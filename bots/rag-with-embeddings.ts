import currenciesJson from "../data/currencies-with-embeddings.json";
import { generateEmbedding } from "../embedding/generate-embeddings";

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}

async function run(model: string) {
  // Initialize conversation with a user query
  const userQuery = "which currencies are based out of americas??";
  const queryEmbedding = await generateEmbedding(userQuery);

  const similarityResults = Object.entries(currenciesJson.exchange_rates).map(
    ([code, data]) => {
      const currencyData = data as any;
      const similarity = cosineSimilarity(
        queryEmbedding,
        currencyData.embedding
      );

      return {
        code,
        full_name: currencyData.full_name,
        country_of_origin: currencyData.country_of_origin,
        similarity,
      };
    }
  );

  // Step 3: Rank results based on similarity
  const rankedResults = similarityResults.sort(
    (a, b) => b.similarity - a.similarity
  );

  // Step 4: Display Top 3 Matches
  console.log("\nTop Matches:");
  rankedResults.slice(0, 3).forEach((result, index) => {
    console.log(
      `${index + 1}. ${result.full_name} (${
        result.code
      }) - Similarity: ${result.similarity.toFixed(3)}`
    );
  });
}

run("llama3.1").catch((error) => console.error("An error occurred:", error));
