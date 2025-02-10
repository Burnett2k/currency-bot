## Naive approach third attempt

The currency conversion isn't that impressive at the moment. To make the bot more useful, I thought I could expand it's scope to handle questions about all of the currencies it can handle.

To do this, I needed to expand my data set. My thought was that I could pretend I have some proprietary data set of information on currencies the Bot could utilize. However, I don't actually have one, so I would just scrape wikipedia for the currencies supported and see what I could do with that.

Here are some of the questions I would like my bot  to handle well:

“What is the most popular currency in Europe?”
“Which currencies are most commonly traded globally?”
“Is the Chinese Yuan (CNY) stronger than the US Dollar (USD)?”
“Which currency is the most volatile among the ones you support?”
“Has the value of the Brazilian Real (BRL) increased or decreased recently?”
“What was the currency used in Germany before the Euro?”
“Why is the US Dollar considered the world’s reserve currency?”
“Which countries currently use the Swiss Franc (CHF) as their official currency?”


// todo:

Add wikipedia embedding search to look for semantic meaning or what not.

Add wikipedia search function for additional context.

Update the system prompt to let the assistant know it has multiple jobs.