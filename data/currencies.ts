/**
 * This is the source file from which embeddings and other data is generated that the bots will use
 */
export const currencies = {
  base_currency: "USD",
  last_updated: "2025-02-05T12:00:00Z",
  exchange_rates: {
    EUR: {
      rate: 0.92,
      full_name: "Euro",
      date_created: "1999-01-01",
      country_of_origin: "European Union",
      volatility: "Medium",
      description:
        "The Euro is the official currency of the Eurozone, used by 19 of the 27 European Union countries.",
    },
    GBP: {
      rate: 0.79,
      full_name: "British Pound Sterling",
      date_created: "1694-07-27",
      country_of_origin: "United Kingdom",
      volatility: "Medium",
      description:
        "The British Pound is the oldest currency still in use, serving as the official currency of the United Kingdom.",
    },
    JPY: {
      rate: 148.5,
      full_name: "Japanese Yen",
      date_created: "1871-06-27",
      country_of_origin: "Japan",
      volatility: "High",
      description:
        "The Japanese Yen is the official currency of Japan and is widely used as a reserve currency globally.",
    },
    AUD: {
      rate: 1.52,
      full_name: "Australian Dollar",
      date_created: "1966-02-14",
      country_of_origin: "Australia",
      volatility: "High",
      description:
        "The Australian Dollar is the official currency of Australia and several Pacific Island states.",
    },
    CAD: {
      rate: 1.34,
      full_name: "Canadian Dollar",
      date_created: "1858-01-01",
      country_of_origin: "Canada",
      volatility: "Medium",
      description:
        "The Canadian Dollar is the official currency of Canada and is commonly referred to as the 'Loonie'.",
    },
    CHF: {
      rate: 0.87,
      full_name: "Swiss Franc",
      date_created: "1850-05-07",
      country_of_origin: "Switzerland",
      volatility: "Low",
      description:
        "The Swiss Franc is the official currency of Switzerland and Liechtenstein, known for its stability.",
    },
    CNY: {
      rate: 7.1,
      full_name: "Chinese Yuan",
      date_created: "1948-12-01",
      country_of_origin: "China",
      volatility: "High",
      description:
        "The Chinese Yuan, also known as Renminbi, is the official currency of the People's Republic of China.",
    },
    INR: {
      rate: 83.0,
      full_name: "Indian Rupee",
      date_created: "1540-01-01",
      country_of_origin: "India",
      volatility: "High",
      description:
        "The Indian Rupee is the official currency of India, issued and controlled by the Reserve Bank of India.",
    },
    BRL: {
      rate: 4.95,
      full_name: "Brazilian Real",
      date_created: "1994-07-01",
      country_of_origin: "Brazil",
      volatility: "Very High",
      description:
        "The Brazilian Real is the official currency of Brazil, introduced as part of a stabilization plan to control inflation.",
    },
    ZAR: {
      rate: 18.45,
      full_name: "South African Rand",
      date_created: "1961-02-14",
      country_of_origin: "South Africa",
      volatility: "High",
      description:
        "The South African Rand is the official currency of South Africa and is also used in neighboring countries.",
    },
  },
} as const;

export type currencies = keyof typeof currencies.exchange_rates;
