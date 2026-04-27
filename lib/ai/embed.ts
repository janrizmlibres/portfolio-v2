import OpenAI from "openai";

const openai = new OpenAI();

export async function embedQuery(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return r.data[0]!.embedding;
}
