import type { EmbeddingClient, RetrieveRequest, RetrieveResponse, VectorStore } from "./types";

export class MemoryRetriever {
  constructor(
    private readonly vectorStore: VectorStore,
    private readonly embeddingClient: EmbeddingClient,
    private readonly defaultTopK = 5,
    private readonly defaultMinSimilarity = 0.75
  ) {}

  async retrieve(request: RetrieveRequest): Promise<RetrieveResponse> {
    const embeddingStartedAt = Date.now();
    const embedding = await this.embeddingClient.embed(request.query);
    const query_embedding_ms = Date.now() - embeddingStartedAt;

    const searchStartedAt = Date.now();
    const matches = await this.vectorStore.search(
      embedding,
      request.top_k ?? this.defaultTopK,
      request.tags
    );
    const minSimilarity = request.min_similarity ?? this.defaultMinSimilarity;
    const memories = matches.filter((memory) => (memory.similarity ?? 0) >= minSimilarity);
    const search_ms = Date.now() - searchStartedAt;

    return {
      memories,
      query_embedding_ms,
      search_ms
    };
  }
}
