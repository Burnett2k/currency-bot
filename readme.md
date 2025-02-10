# Currency bot

I learn best by doing things. This sample AI...thing. Is an arbitrary use case I created to help guide my learning.

The overall idea is to create a Retrieval Augmented Generation (RAG) app that is somehow better than a standalone LLM like chatGPT or LLAMA and doing some kind of currency analysis. At a minimum, that could just mean it looks up the current currency conversion rates and gives up to date conversions. However, it could be further advanced to somehow become a "currency" expert.

I will be taking snapshots of progress along the way, so we can see how the app changes over time. The files will have a `-part-<number>` to indicate which version it is. 

## Naive approach

I'm just calling this Naive because it was my first try at a RAG app and I used a few shortcuts. Since I wanted the project to be open source and free, I decided to use Ollama as the framework for downloading and running AI models. This was extremely quick and easy to setup. Only caveat is some models are huge, so you need to take care when you first pull one down. Initially, I started pulling down a 30gb model only to remember I have Comcast and they will probably throttle my connection if I download that :laugh: 

Getting Ollama setup and sending commands to it was quite easy. You can run an interactive prompt using 

```
# llama run <model name>
llama run llama3.1
```

That's great to get an llm running, but to make it retrieve things I needed to find a better way. Even though typescript is probably not the best tool for this job, I felt it appropriate to use it for stringing together my scripts / code that will be the RAG application. Don't want to learn too many things at the same time.

So, I moved into a new approach where I would run a typescript file using very minimal dependencies
* readline (to get input data from command line)
* ollama (to integrate with ollama running on my machine)
* typescript (cuz strong typing)

To keep things even simpler, my first task was just to get a combination of LLM communication and function calls working. To do this, I found an Ollama example which uses a concept called 'tools'. Essentially, within Ollama you can provide the LLM with context around 'tools' that it has available. In our case, I will tell it that it has access to a currency conversion function which will give data on the conversion rates for specific currencies. The idea is then that if I ask it something like "what is the value of 100 USD in Euros?" It would be able to call the function with the correct inputs, get a value, feed that into the LLM to do the final calculations using it's general knowledge.

Here's what the initial function looked like. It was a simple object which stored the exchange rates as a map. All were in reference to USD. The function just retrieves based on the key. Very simple.:
```
// Simulate an api call to get currency conversions
function getCurrencyConversion(args: { [key: string]: any }) {
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

  const destination = args.destination as currencies;

  return JSON.stringify(
    currencies.exchange_rates[destination] || {
      error: "Cannot compute",
    }
  );
}
```

That part is easy. I've written functions before. The next part was quite weird. I need to build the 'tool' so that I can let the LLM know what capabilities it has. This is what that looked like. It is largely based on the Ollama example and unclear how similar this is to how other rag apps would approach this.

```
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
```

Above we are telling Ollama to chat with the Llama LLM, passing in an array of messages (user input) as well as a tools array which is essentially like a JSDoc defining the purpose of the function and what the inputs are.

This was not too difficult to get working, and was really interesting to test out. Some common problems started occurring such as:

* The LLM would pass incorrect input to the function
* The LLM would hallucinate and use the last known conversion of the currency instead of the one from the function
* Instead of simply saying "I don't know", the LLM would give unhelpful suggestions
* The LLM would give somewhat vague answers without showing it's work

Here's an example. 

```
question: what is your first question? what is the value of 100 USD in Euros?
answer: The exchange rate between the US Dollar (USD) and the Euro (EUR) can vary depending on market conditions, but as of my knowledge cutoff in 2023, the approximate conversion is:

1 USD = 0.95 EUR
100 USD = 95 EUR

Please note that this is an approximation and the actual exchange rate may be different at the time of your inquiry.
```

It didn't even use the value from my function! The rate in our map is .92... Strange

One more try with the exact same question gives a better answer, but the last statement is inaccurate as it appears to have used the .92 exchange rate from my map

```
what is your first question?what is the value of 100 USD in Euros?
The value of $100 USD is approximately €92.

Note: The exchange rate may fluctuate depending on the current market conditions. This answer is based on the data available until 01 Mar 2023. For up-to-date conversions, please check a reliable currency conversion source like XE or Oanda.
```

This is where I started to realize this isn't just a coding problem. I think I need to be prompting the LLM internally on what it should be doing. Currently, it's like I'm asking a random person on the street what the currency conversion rate is. They may guess, look it up on their phone, or just not answer at all because I am crazy... What I *think* I want is the LLM to believe it's a currency conversion analyst which needs to provide very specific answers.

I believe this is a pretty common thing to kind of 'seed' an LLM with a prompt to let it know it should be helpful, do no harm, etc, so I wanted to try that out. Here's what I came up with after some trial and error:

