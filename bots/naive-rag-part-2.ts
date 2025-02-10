import ollama from "ollama";
import readline from "readline";

type currencies = keyof typeof currencies.exchange_rates;

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

const SYSTEM_MESSAGE = {
  role: "system",
  content: `You are a fact-based helpful financial analyst. Your purpose is to help users with currency conversions.
    You need to know at a minimum the source and destination currency to answer correctly. If the user doesn't provide that,
    explain what currencies you support and what information you need. You must show your calculations so the user can verify and
    trust your responses.

    NOTE: If there is **no direct conversion rate** between two currencies, you **MUST**:
    1. Convert the source currency to USD (if it's not already USD).
    2. Then convert from USD to the destination currency.

    This requires you to call the 'get_currency_conversions' function **twice**—once for each currency involved in the conversion.

    You have information about these currencies: ${Object.keys(
      currencies.exchange_rates
    )}. All conversion rates are in relation to the US Dollar.`,
};

// Simulate an api call to get currency conversions
function getCurrencyConversion(args: { [key: string]: any }) {
  const destination = args.destination as currencies;

  return JSON.stringify(
    currencies.exchange_rates[destination] || {
      error: "Cannot compute",
    }
  );
}

let messages = [SYSTEM_MESSAGE];

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
            "Retrieves currency conversion rates between the United States Dollar and one other destination Currency. All answers are in relation to USD.",
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

      // Add function response to the conversation in clear terms
      const output = `The exchange rate from USD to ${tool.function.arguments.destination} is ${functionResponse}`;
      messages.push({
        role: "tool",
        content: output,
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
  rl.write("How many JPY are in 200 AUD?");
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
