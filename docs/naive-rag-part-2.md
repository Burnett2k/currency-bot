## Naive approach second attempt

As a reminder, here are some of the problems I observed while working on my first attempt:

* The LLM would pass incorrect input to the function
* The LLM would hallucinate and use the last known conversion of the currency instead of the one from the function
* Instead of simply saying "I don't know", the LLM would give unhelpful suggestions
* The LLM would give somewhat vague answers without showing it's work

The goal of the second attempt is to try and fix as many of these issues as possible. There are a few categories of questions I want the RAG app to handle well:

1. Simple questions that it *can* answer: What is 100 USD in Japanese Yen? This should be a pretty straightforward lookup for the LLM. The primary thing it has to figure out is that Japanese Yen currency code = "JPY". It's surprisingly good at completing this step already.
2. Simple questions that it *cannot / is not qualified* to answer: What is 100 USD worth in Doge coin? In this situation, we want the LLM to clearly respond back to the user that it cannot figure out the answer, and also what it's capabilities are.

Other requirements I want to implement:
* Don't give unhelpful feedback about market fluctuations, or ideas about where to go get the data.
* Be able to do a complex conversion using US as a bridge currency. I.e. How many JPY are in 200 AUD? The function gives all currencies in relation to USD, but this conversion can be done in a multi step process
* Always show your work. If the LLM just gives a value without showing the calculation, I will not trust it. It should show the logical steps of how it came to it's answer so you can validate it is correct.
* Bonus: give answer in a consistent format. The final idea I had was that if I ever want to automate or test this, it would be nice if it could always give the answer in a format which I can parse. I know I will get back a paragraph of test, but if for instance it always gave the answer at the bottom in the format `answer: ${answer}`, then I could potentially run unit tests against it and verify it gets the correct answer.

### Prompt engineering

I don't know much about prompt engineering at all, but it seems that it is important for this step. The things I mentioned above are mostly around the LLM's *behavior* rather than the code I am using. The LLM generally uses the currency function correctly, so in this step I will be focusing more on creating a better system prompt for the bot.

When randomly browsing llama3.1 code, I saw it had a [template file](https://ollama.com/library/llama3.1/blobs/948af2743fc7) which gave me the idea to do something similar. The file resembles a handlebars template. The section of most interest to me was the text in the middle:

```
When you receive a tool call response, use the output to format an answer to the orginal user question.

Given the following functions, please respond with a JSON for a function call with its proper arguments that best answers the given prompt.

Respond in the format {"name": function name, "parameters": dictionary of argument name and its value}. Do not use variables.
```

I was wondering how ollama knew to call functions, and this somewhat clears that up. It is pretty neat! Essentially, a RAG app (in my case) is just an LLM which you've empowered to use a set of 'tools' to help it do it's job better.

### Adding a system prompt

After multiple iterations, this is what I came up with:

```
const SYSTEM_MESSAGE = {
  role: "system",
  content: `You are a fact-based helpful financial analyst. Your purpose is to help users with currency conversions.
    You need to know at a minimum the target and destination currency to answer correctly. If the user doesn't know that,
    explain to them what currencies you support and what information you need.
     If the information needed to answer is not available, respond in one sentence that you don't have the answer and
     list the currencies you know about in their full name. Do not give advice or tips. Do NOT guess. Only provide
     answers when confident. It is critically important to show your work back to the user so they can verify it.
     When showing your work, use simple text because you are responding in a chat application which cannot parse complicated math equations.
     You have information about the following currencies: ${Object.keys(
       currencies.exchange_rates
     )}`,
};
```

This 'system' prompt is the first message we will pass to Ollama. While I don't actually know the specifics of how this is used, from what I understand the 'system' prompt is more like the personality and takes higher precedence than other types of prompts. Other options for role are assistant, tool, and user.

Here are some experiments to see how it now responds?


1. Simple question it should be able to answer: What is 100 USD in Japanese Yen?

```
what is your question? What is 100 USD in Japanese Yen?
I converted 1 USD to JPY and multiplied it by 100.

**Exchange rate used:** 1 USD = 1.485 JPY

**Calculation:**

1 USD x 100 = 100 USD
100 USD x 1.485 JPY/USD = 148.5 JPY
```

This is pretty good! It is the correct answer, and appears to have used the 'market rate' from my currency conversion function. I'd say this is a success overall. The work it is showing is a little weird, but gets the job done.


2. Simple question is should not be able to answer: What is 100 USD worth in Doge coin?

```
what is your question? What is 100 USD worth in Doge coin?
I don't have the information needed to answer your question. I only know about the following currencies: Euro (EUR), British Pound (GBP), Japanese Yen (JPY), Australian Dollar (AUD), Canadian Dollar (CAD), Swiss Franc (CHF), Chinese Renminbi (CNY), Indian Rupee (INR), Brazilian Real (BRL), South African Rand (ZAR).
Do you want to ask another question?
```

This is a pretty good response as well! It was pretty clear that it didn't know the answer, and then gave information on what it can answer. This is a success.


3. Complex question it should be able to answer: How many JPY are in 200 AUD?

I did the math separately to see what will happen. The process is as follows

Step one: Convert 200 AUS to USD 
Exchange rate: 1 USD = 1.52 AUD, so

$\text{USD} = \frac{200}{1.52} = 131.5789 \approx 131.57 \, \text{USD}$


Step two: Convert 131.57 USD to JPY
Exchange rate = 1 USD = 148.5 JPY


$\text{JPY} = 131.57 \times 148.5 = 19538.1545 \approx 19538.15 \, \text{JPY}$


```
what is your first question? How many JPY are in 200 AUD?
To calculate this, we'll use the current exchange rate for AUD to JPY.

1 AUD = approximately 84.32 JPY (this is subject to change and may not be accurate at the time of your request)

To find out how many JPY are in 200 AUD:

 Multiply 200 by 84.32:
200 x 84.32 = 16,864 

So, there are approximately 16,864 JPY in 200 AUD.
```

Dang, it seems like it failed this one pretty hard. It seems to have found the AUD => JPY conversion and used that instead of my table. I really thought the LLM would be smart enough to figure this out, but after repeatedly asking it seems to always use this incorrect market rate. I'm going to log out what it is passing to the function to see where the problem lies. It looks like the app was mostly confused about how to use the function. It would always invoke it a single time to get the JPY conversion, and then hallucinate the USD to AUD part. I attempted to fix this by being more clear in the initial system prompt about what to do in that situation.

```
const SYSTEM_MESSAGE = {
  role: "system",
  content: `You are a fact-based helpful financial analyst. Your purpose is to help users with currency conversions.
    You need to know at a minimum the source and destination currency to answer correctly. If the user doesn't provide that,
    explain what currencies you support and what information you need.

    NOTE: If there is **no direct conversion rate** between two currencies, you **MUST**:
    1. Convert the source currency to USD (if it's not already USD).
    2. Then convert from USD to the destination currency.

    This requires you to call the 'get_currency_conversions' function **twice**—once for each currency involved in the conversion.

    You have information about these currencies: ${Object.keys(
      currencies.exchange_rates
    )}. All conversion rates are in relation to the US Dollar.`,
};
```

Fun fact: that prompt was generated by ChatGPT and it worked pretty darn well.

However, it still is struggling to answer correctly.

When I looked closer at the code, I saw that in the messages array we are pushing the function response. This seems fine at first glance, but once you add in multiple function calls i started to htink this might be confusing. Essentially, the message would just be 


```
// call to get AUD conversion
{
  role: "tool",
  content: "1.52",
}

// call to get JPY conversion
{
  role: "tool",
  content: "148.5",
}
```

My theory now is that this worked fine for a single function call, but now the AI needs a little more context. We should say something like "the answer to your function with these inputs is <blank>". Here's what my final update looks like:

```
// call to get AUD conversion
{
  role: "tool",
  content: "The exchange rate from USD to AUD is 1.52",
}

// call to get JPY conversion
{
  role: "tool",
  content: "The exchange rate from USD to JPY is 148.5",
}
```

Ok, I think this should probably conclude part 2. I now appreciate the importance of prompt engineering a lot more. It can make things a bit easier.

Here is the correct response...Finally!

```
What is your question? How many JPY are in 200 AUD?
To convert AUD to JPY, we need to first convert it to USD and then from USD to JPY.

200 AUD = (200 x 1/1.52) USD
= 131.58 USD

Now, converting USD to JPY:
131.58 USD = 131.58 x 148.5 JPY
= 19539 JPY

So there are **19,539** JPY in **200** AUD.
Do you want to ask another question?How many JPY are in 200 AUD?
To convert AUD to JPY, we need to first convert it to USD and then from USD to JPY.

200 AUD = (200 x 1/1.52) USD
= 131.58 USD

Now, converting USD to JPY:
131.58 USD = 131.58 x 148.5 JPY
= 19539 JPY

So there are **19,539** JPY in **200** AUD.
```

This bot is now fairly decent at currency conversions. Although, I will say it has given me such weird responses I don't totally trust it. I even set temperature to 0 which is supposed to limit creativity and randomness, but I still get different answers occasionally.

