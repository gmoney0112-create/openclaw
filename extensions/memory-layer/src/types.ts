export interface Memory {
  id?: string;
  content: string;
  embedding?: number[];
  tags: string[];
  source?: string;
  session_id?: string;
  created_at?: string;
  similarity?: number;
}

export interface StoreRequest {
  content: string;
  tags?: string[];
  source?: string;
  session_id?: string;
}

export interface RetrieveRequest {
  query: string;
  top_k?: number;
  tags?: string[];
  min_similarity?: number;
}

export interface RetrieveResponse {
  memories: Memory[];
  query_embedding_ms: number;
  search_ms: number;
}

export interface StoreResult {
  id: string;
  tags_applied: string[];
  embedding_ms: number;
}

export interface VectorStore {
  getBackendName(): "supabase" | "chroma";
  upsert(memory: Memory): Promise<string>;
  search(embedding: number[], top_k: number, tags?: string[]): Promise<Memory[]>;
  list(tag?: string, limit?: number): Promise<Memory[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

export interface EmbeddingClient {
  embed(text: string): Promise<number[]>;
}
