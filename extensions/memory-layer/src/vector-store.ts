import { randomUUID } from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Memory, VectorStore } from "./types";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

class InMemoryVectorStore implements VectorStore {
  private readonly memories = new Map<string, Memory>();

  getBackendName(): "chroma" {
    return "chroma";
  }

  async upsert(memory: Memory): Promise<string> {
    const id = memory.id ?? randomUUID();
    this.memories.set(id, {
      ...memory,
      id,
      created_at: memory.created_at ?? new Date().toISOString()
    });
    return id;
  }

  async search(embedding: number[], top_k: number, tags?: string[]): Promise<Memory[]> {
    const requestedTags = tags ?? [];

    return [...this.memories.values()]
      .filter((memory) => memory.embedding)
      .filter((memory) => requestedTags.length === 0 || requestedTags.every((tag) => memory.tags.includes(tag)))
      .map((memory) => ({
        ...memory,
        similarity: cosineSimilarity(embedding, memory.embedding ?? [])
      }))
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, top_k);
  }

  async list(tag?: string, limit = 20): Promise<Memory[]> {
    return [...this.memories.values()]
      .filter((memory) => !tag || memory.tags.includes(tag))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, limit);
  }

  async delete(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async count(): Promise<number> {
    return this.memories.size;
  }
}

class SupabaseVectorStore implements VectorStore {
  private readonly client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  getBackendName(): "supabase" {
    return "supabase";
  }

  async upsert(memory: Memory): Promise<string> {
    const id = memory.id ?? randomUUID();
    const payload = {
      id,
      content: memory.content,
      embedding: memory.embedding,
      tags: memory.tags,
      source: memory.source,
      session_id: memory.session_id,
      created_at: memory.created_at ?? new Date().toISOString()
    };

    const { error } = await this.client.from("memories").upsert(payload);
    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    return id;
  }

  async search(embedding: number[], top_k: number, tags?: string[]): Promise<Memory[]> {
    let query = this.client
      .from("memories")
      .select("id, content, embedding, tags, source, session_id, created_at")
      .limit(500);

    if (tags && tags.length > 0) {
      query = query.overlaps("tags", tags);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase search failed: ${error.message}`);
    }

    return (data ?? [])
      .map((record) => ({
        id: record.id,
        content: record.content,
        embedding: record.embedding as number[] | undefined,
        tags: (record.tags as string[] | null) ?? [],
        source: record.source as string | null ?? undefined,
        session_id: record.session_id as string | null ?? undefined,
        created_at: record.created_at as string | null ?? undefined
      }))
      .filter((memory) => memory.embedding)
      .map((memory) => ({
        ...memory,
        similarity: cosineSimilarity(embedding, memory.embedding ?? [])
      }))
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, top_k);
  }

  async list(tag?: string, limit = 20): Promise<Memory[]> {
    let query = this.client
      .from("memories")
      .select("id, content, tags, source, session_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase list failed: ${error.message}`);
    }

    return (data ?? []).map((record) => ({
      id: record.id,
      content: record.content,
      tags: (record.tags as string[] | null) ?? [],
      source: record.source as string | null ?? undefined,
      session_id: record.session_id as string | null ?? undefined,
      created_at: record.created_at as string | null ?? undefined
    }));
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client.from("memories").delete().eq("id", id);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }

    return true;
  }

  async count(): Promise<number> {
    const { count, error } = await this.client.from("memories").select("*", { count: "exact", head: true });
    if (error) {
      throw new Error(`Supabase count failed: ${error.message}`);
    }

    return count ?? 0;
  }
}

export function createVectorStore(): VectorStore {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    return new SupabaseVectorStore(supabaseUrl, supabaseKey);
  }

  return new InMemoryVectorStore();
}
