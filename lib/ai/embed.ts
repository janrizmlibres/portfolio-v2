import OpenAI from "openai";

let _client: OpenAI | null = null;
function client() {
  if (!_client) _client = new OpenAI();
  return _client;
}

export async function embedQuery(text: string): Promise<number[]> {
  const r = await client().embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return r.data[0]!.embedding;
}
