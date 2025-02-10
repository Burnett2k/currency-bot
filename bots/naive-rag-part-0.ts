import ollama from "ollama";
import readline from "readline";

type currencies = keyof typeof currencies.exchange_rates;

// defining a data structure to use in the RAG function
const currencies = {
  base_currency: "USD",
  last_updated: "2025-02-05T12:00:00Z",
  exchange_rates: {
    EUR: 0.92,
    GBP: 0.79,
    JPY: 148.5,
    AUD: 1.52,
    CAD: 1.34,
    CHF: 0.87,
    CNY: 7.1,
    INR: 83.0,
    BRL: 4.95,
    ZAR: 18.45,
  },
} as const;

// Simulate an api call to get currency conversions
function getCurrencyConversion(args: { [key: string]: any }) {
  const destination = args.destination as currencies;

  return JSON.stringify(
    currencies.exchange_rates[destination] || {
      error: "Cannot compute",
    }
  );
}

async function handleQuery(model: string, userQuery: string) {
  let messages = [
    {
      role: "user",
      content: userQuery,
    },
  ];

  const response = await ollama.chat({
    model: model,
    messages: messages,
    options: { temperature: 0.5 },
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
  rl.write("what is the value of 100 USD in Euros?");
  rl.question(prompt, (query) => {
    if (query.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }
    handleQuery("llama3.1", query);
    rl.close();
  });
};

askQuestion("what is your question? ");
