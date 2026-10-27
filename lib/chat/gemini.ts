import "server-only";
import { GoogleGenAI } from "@google/genai";

// The conversation model (Google Gemini, Interactions API). Picked in
// Admin → Chatbot → Behavior; prices are USD per 1M tokens (prompts ≤ 200k),
// used only to show what conversations cost.

export const CHAT_MODELS = {
  "gemini-3.1-pro-preview": { label: "Gemini 3.1 Pro (preview): best answers", input: 2, output: 12 },
  "gemini-3.1-flash-lite": { label: "Gemini 3.1 Flash-Lite: fastest, lowest cost", input: 0.25, output: 1.5 },
} as const;

export type ChatModel = keyof typeof CHAT_MODELS;

export function chatModel(model: string): ChatModel {
  return model in CHAT_MODELS ? (model as ChatModel) : "gemini-3.1-pro-preview";
}

let client: GoogleGenAI | null = null;
export function gemini() {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export function costUsd(model: ChatModel, inputTokens: number, outputTokens: number) {
  const p = CHAT_MODELS[model];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
