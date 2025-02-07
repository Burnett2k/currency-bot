import fs from "fs";
import { currencies } from "../data/currencies";

const wikipedia_content: Record<any, any> = {};

// Fetch Wikipedia title using the search API
async function fetchWikipediaTitle(
  currencyName: string
): Promise<string | null> {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    currencyName
  )}&format=json&origin=*`;
  try {
    const response = await fetch(searchUrl);
    const json = await response.json();
    const searchResults = json.query?.search;

    if (searchResults && searchResults.length > 0) {
      return searchResults[0].title; // Use the top search result
    }
    return null;
  } catch (error) {
    console.error(`Error fetching title for ${currencyName}:`, error);
    return null;
  }
}

// Fetch Wikipedia extract using the correct title
async function fetchWikipediaContent(title: string): Promise<string> {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&titles=${encodeURIComponent(
    title
  )}&explaintext=true&format=json&origin=*`;
  try {
    const response = await fetch(apiUrl);
    const json = await response.json();
    const pages = json.query?.pages;
    const page = (pages ? Object.values(pages)[0] : null) as any;

    return page?.extract || "No content available.";
  } catch (error) {
    console.error(`Error fetching content for ${title}:`, error);
    return "No content available.";
  }
}

// Enrich currency data
async function enrichCurrencyData() {
  for (const [code, data] of Object.entries(currencies.exchange_rates)) {
    console.log(`Searching for ${data.full_name}...`);
    const title = await fetchWikipediaTitle(data.full_name);
    if (title) {
      console.log(`Fetching content for: ${title}`);
      wikipedia_content[code] = await fetchWikipediaContent(title);
    } else {
      console.warn(`No Wikipedia page found for ${data.full_name}`);
      wikipedia_content[code] = "No content available.";
    }
  }

  fs.writeFileSync(
    "wikipedia-content.json",
    JSON.stringify(wikipedia_content, null, 2)
  );
  console.log("Data enriched successfully!");
}

enrichCurrencyData();
