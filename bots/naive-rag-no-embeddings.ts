import ollama from "ollama";
import readline from "readline";
import { currencies } from "../data/currencies";

const SYSTEM_MESSAGE = {
  role: "system",
  content: `You are a fact-based helpful financial analyst. Your purpose is to help users with currency conversions. 
    You need to know at a minimum the target and destination to answer correctly. If the user doesn't know that, 
    explain to them what currencies you support and what information you need.
     If the information needed to answer is not available, respond in one sentence that you don't have the answer and 
     list the currencies you know about in their full name. Do not give advice or tips. Do NOT guess. Only provide 
     answers when confident. It is critically important to show your work back to the user so they can verify it.
     When showing your work, use simple text because you are responding in a chat application which cannot parse complicated math equations. 
     You have information about the following currencies: ${Object.keys(
       currencies.exchange_rates
     )}`,
};

let messages = [SYSTEM_MESSAGE];

function getCurrencyConversion({ destination }: { destination: currencies }) {
  try {
    if (!currencies.exchange_rates[destination]) {
      return JSON.stringify({
        error: `Cannot compute conversion to '${destination}'. No data available.`,
      });
    }

    return JSON.stringify({
      rate: currencies.exchange_rates[destination].rate,
    });
  } catch (error) {
    console.error("Conversion Error:", error);
    return JSON.stringify({ error: "An unexpected error occurred." });
  }
}

async function handleQuery(model: string, userQuery: string) {
  messages.push({
    role: "user",
    content: userQuery,
  });

  const response = await ollama.chat({
    model: model,
    messages: messages,
    options: { temperature: 0 },
    tools: [
      {
        type: "function",
        function: {
          name: "get_currency_conversions",
          description:
            "Get currency conversion rates from USD to another currency",
          parameters: {
            type: "object",
            properties: {
              destination: {
                type: "string",
                description: "Currency code (e.g., 'JPY' for Japanese Yen)",
              },
            },
            required: ["destination"],
          },
        },
      },
    ],
  });
  // Add the model's response to the conversation history
  messages.push(response.message);

  // Check if the model decided to use the provided function
  if (
    !response.message.tool_calls ||
    response.message.tool_calls.length === 0
  ) {
    console.log("Internal log message that shouldn't show to users!");
    console.log("The model didn't use the function. Its response was:");
    console.log(response.message.content);
  }

  // Process function calls made by the model
  if (response.message.tool_calls) {
    for (const tool of response.message.tool_calls) {
      const functionResponse = getCurrencyConversion(
        tool.function.arguments as any
      );

      // output from the function call
      // console.log(
      //   `functionResponse from ${tool.function.name}`,
      //   functionResponse
      // );
      // Add function response to the conversation
      messages.push({
        role: "tool",
        content: functionResponse,
      });
    }
  } else {
    messages.push({
      role: "system",
      content: "You do not have the answer and should tell the user that!",
    });
  }

  const finalResponse = await ollama.chat({
    model: model,
    messages: messages,
  });
  console.log(finalResponse.message.content);

  messages.push({ role: "assistant", content: finalResponse.message.content });
}

// Command Line Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (prompt: string) => {
  rl.question(prompt, (query) => {
    if (query.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }
    handleQuery("llama3.1", query).then(() => {
      askQuestion("Do you want to ask another question?");
    });
  });
};

askQuestion("what is your first question?");
