import OpenAI from "openai";
import { MemoryTagger } from "./memory-tagger";
import type { EmbeddingClient, StoreRequest, StoreResult, VectorStore } from "./types";

class OpenAIEmbeddingClient implements EmbeddingClient {
  private client?: OpenAI;
  private readonly model: string;

  constructor(model: string) {
    this.model = model;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: text
    });

    return response.data[0]?.embedding ?? [];
  }
}

export class MemoryWriter {
  constructor(
    private readonly vectorStore: VectorStore,
    private readonly tagger: MemoryTagger,
    private readonly embeddingClient: EmbeddingClient
  ) {}

  async store(request: StoreRequest): Promise<StoreResult> {
    const startedAt = Date.now();
    const tags = request.tags && request.tags.length > 0 ? request.tags : this.tagger.tag(request.content);
    const embedding = await this.embeddingClient.embed(request.content);
    const embedding_ms = Date.now() - startedAt;

    const id = await this.vectorStore.upsert({
      content: request.content,
      embedding,
      tags,
      source: request.source,
      session_id: request.session_id
    });

    return {
      id,
      tags_applied: tags,
      embedding_ms
    };
  }
}

export { OpenAIEmbeddingClient };
