import fs from "fs";
import { currencies } from "../data/currencies";
import wikipediaContentJson from "../data/wikipedia-content.json";
import { generateEmbedding } from "../embedding/generate-embeddings";

const iterateCurrencies = async (): Promise<void> => {
  for (const [code, data] of Object.entries(currencies.exchange_rates)) {
    const textToEmbed = `full name: ${data.full_name} description: ${
      data.description
    } country of origin: ${data.country_of_origin} currency volatility: ${
      data.volatility
    } wikipedia content: ${wikipediaContentJson[code as currencies]}`;
    // console.log(`Generating embedding for ${code}: ${textToEmbed}`);

    try {
      (data as any).embedding = await generateEmbedding(textToEmbed);
    } catch (error) {
      console.error(`Error generating embedding for ${code}:`, error);
    }
  }
  fs.writeFileSync(
    "./data/currencies-with-embeddings.json",
    JSON.stringify(currencies, null, 2)
  );

  console.log(
    "Embeddings generated and saved to currencies-with-embeddings.json"
  );
};

iterateCurrencies();
