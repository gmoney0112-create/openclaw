import OpenAI from "openai";
import type { TaskClassification, TaskType } from "./types.js";

const KEYWORD_RULES: Array<{ task_type: TaskType; keywords: string[] }> = [
  {
    task_type: "coding",
    keywords: ["code", "function", "script", "bug", "implement", "build", "debug", "typescript", "python"]
  },
  {
    task_type: "reasoning",
    keywords: ["analyze", "why", "explain", "logic", "compare", "evaluate", "plan", "strategy"]
  },
  {
    task_type: "writing",
    keywords: ["write", "draft", "email", "copy", "blog", "post", "caption", "content", "marketing"]
  },
  {
    task_type: "research",
    keywords: ["research", "find", "search", "discover", "market", "trends", "competitors"]
  },
  {
    task_type: "sales",
    keywords: ["sales", "pitch", "objection", "close", "offer", "funnel", "upsell", "revenue"]
  }
];

export class TaskClassifier {
  public async classify(prompt: string): Promise<TaskClassification> {
    const lowered = prompt.toLowerCase();

    const scoreMap = new Map<TaskType, number>();
    for (const rule of KEYWORD_RULES) {
      const score = rule.keywords.reduce((total, keyword) => total + (lowered.includes(keyword) ? 1 : 0), 0);
      if (score > 0) {
        scoreMap.set(rule.task_type, score);
      }
    }

    if (scoreMap.size > 0) {
      const [task_type, score] = Array.from(scoreMap.entries()).sort((a, b) => b[1] - a[1])[0];
      return {
        task_type,
        confidence: Math.min(0.95, 0.55 + score * 0.1)
      };
    }

    if (prompt.trim().split(/\s+/).length < 50) {
      return {
        task_type: "fast",
        confidence: 0.65
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        task_type: "reasoning",
        confidence: 0.35
      };
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Classify the user's prompt into exactly one of: coding, reasoning, writing, fast, research, sales. Reply with just the label."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_output_tokens: 10
    });

    const text = completion.output_text.trim().toLowerCase();
    const allowed: TaskType[] = ["coding", "reasoning", "writing", "fast", "research", "sales"];
    const task_type = allowed.includes(text as TaskType) ? (text as TaskType) : "reasoning";
    return {
      task_type,
      confidence: 0.6
    };
  }
}
