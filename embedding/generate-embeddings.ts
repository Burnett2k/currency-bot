import ollama from "ollama";

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const embedding = await ollama.embeddings({
    model: "nomic-embed-text",
    prompt: text,
  });
  return embedding.embedding;
};
