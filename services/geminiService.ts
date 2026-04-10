import { GoogleGenAI, GenerateContentResponse, Part, Tool } from "@google/genai";
import { CaseFile } from '../types';

const MODELS = {
  reasoning: "gemini-3-pro-preview",     // strongest reasoning, slower
  fast:      "gemini-3-flash-preview",   // quicker, good fallback
  // You can add gemini-3-pro, gemini-2.5-pro-exp, etc. later
} as const;

class GeminiService {
  private ai: GoogleGenAI;
  private tokenListener: ((count: number) => void) | null = null;

  constructor(apiKey?: string) {
    // Support Vite (VITE_), standard, and legacy env var names
    const key = apiKey ?? 
                process.env.VITE_GEMINI_API_KEY ?? 
                process.env.GEMINI_API_KEY ?? 
                process.env.API_KEY;
    if (!key) {
      throw new Error("No Gemini API key provided. Set VITE_GEMINI_API_KEY, GEMINI_API_KEY, or API_KEY environment variable.");
    }
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  public setTokenListener(listener: (count: number) => void): void {
    this.tokenListener = listener;
  }

  private trackUsage(response: GenerateContentResponse): void {
    if (!this.tokenListener) return;
    const total =
      response.usageMetadata?.totalTokenCount ??
      response.usageMetadata?.promptTokenCount ??
      response.usageMetadata?.candidatesTokenCount ??
      0;

    if (total > 0) this.tokenListener(total);
  }

  private formatCaseFiles(files: CaseFile[]): string {
    if (files.length === 0) return "";

    const formatted = files
      .map((f) => {
        const safeContent = f.content.trim().slice(0, 14000);
        return `--- FILE: ${f.name} (${f.content.length} chars) ---\n${safeContent}\n--- END ---`;
      })
      .join("\n\n");

    return `\n\n<CASE_FILES>\n${formatted}\n</CASE_FILES>\n`;
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>,
    maxRetries = 4,
    baseDelayMs = 1800
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;

        const status = err?.status ?? err?.code;
        const isRetryable =
          status === 429 ||
          status === 503 ||
          err?.message?.includes("quota") ||
          err?.message?.includes("RESOURCE_EXHAUSTED") ||
          err?.message?.includes("rate limit");

        if (!isRetryable || attempt === maxRetries) {
          break;
        }

        // Exponential backoff + jitter
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 400;
        console.warn(`[Gemini retry] attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`, err.message);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (fallbackOperation) {
      try {
        console.warn("[Gemini] falling back to secondary operation");
        return await fallbackOperation();
      } catch (fallbackErr) {
        console.error("[Gemini fallback failed]", fallbackErr);
      }
    }

    throw lastError ?? new Error("All retry attempts failed");
  }

  // ────────────────────────────────────────────────
  //  Deep Research with Grounding (Google Search)
  // ────────────────────────────────────────────────
  async researchLegalPrecedent(query: string): Promise<{
    text: string;
    sources: Array<{ title: string; uri: string }>;
  }> {
    const googleSearchTool: Tool = { googleSearch: {} };

    const runTask = async (model: string, system: string, user: string) => {
      const response = await this.ai.models.generateContent({
        model,
        contents: user,
        config: {
          systemInstruction: system,
          temperature: 0.0,
          tools: [googleSearchTool],
        },
      });

      this.trackUsage(response);
      return response;
    };

    try {
      const [caseRes, statuteRes] = await Promise.all([
        this.withRetry(
          () =>
            runTask(
              MODELS.reasoning,
              "You are a Senior Indiana Appellate & Supreme Court Legal Researcher specializing in civil matters. Use recent case law only. Be precise, cite holdings clearly.",
              `Analyze and summarize recent Indiana civil case law relevant to: ${query}`
            ),
          () =>
            runTask(
              MODELS.fast,
              "Senior Indiana Legal Researcher – focus on civil case law",
              `Recent Indiana civil case law for: ${query}`
            )
        ),

        this.withRetry(
          () =>
            runTask(
              MODELS.fast,
              "You are an expert in Indiana Code across all relevant titles for civil law, including contracts, torts, property, family, and procedural rules like Indiana Trial Rules.",
              `List and explain relevant Indiana statutes, codes, and Trial Rules for: ${query}`
            )
        ),
      ]);

      const extractSources = (res: GenerateContentResponse) => {
        const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        return chunks
          .filter((c) => c.web?.uri)
          .map((c) => ({
            title: c.web!.title ?? "Untitled source",
            uri: c.web!.uri!,
          }));
      };

      const allSources = [...extractSources(caseRes), ...extractSources(statuteRes)];
      const uniqueSources = Array.from(
        new Map(allSources.map((s) => [s.uri, s])).values()
      );

      const combinedText = [
        "# Indiana Civil Legal Research Report (Grounded with Google Search)",
        "",
        "## Civil Case Law Analysis",
        caseRes.text?.trim() || "(no case law summary returned)",
        "",
        "## Relevant Statutes & Trial Rules",
        statuteRes.text?.trim() || "(no statutes returned)",
        "",
        `**Sources (${uniqueSources.length})**: see below`,
      ].join("\n");

      return { text: combinedText, sources: uniqueSources };
    } catch (err) {
      console.error("Legal research failed:", err);
      throw new Error(
        "Failed to complete grounded legal research. The search engine or model may be temporarily unavailable."
      );
    }
  }

  async draftMotion(
    topic: string,
    files: CaseFile[],
    userInstructions: string = ""
  ): Promise<string> {
    const parts: Array<string | Part> = [];
    parts.push(`Draft a professional Indiana civil law motion regarding: ${topic}`);
    if (userInstructions) {
      parts.push(`Additional user instructions:\n${userInstructions}`);
    }
    
    if (files.length > 0) {
      parts.push("CASE CONTEXT:");
      for (const f of files) {
        if (f.inlineData) {
          parts.push(`--- FILE: ${f.name} ---`);
          parts.push({ inlineData: f.inlineData });
        } else {
          const safeContent = f.content.trim().slice(0, 14000);
          parts.push(`--- FILE: ${f.name} (${f.content.length} chars) ---\n${safeContent}\n--- END ---`);
        }
      }
    }

    const runDraft = async (model: string) =>
      this.ai.models.generateContent({
        model,
        contents: parts,
        config: {
          systemInstruction:
            "You are an experienced Indiana Civil Law Attorney handling all types of civil matters (contracts, torts, property, family, etc.). Draft formal motions in proper legal format: caption, title, numbered paragraphs, prayer for relief, certificate of service, verification block.",
          temperature: 0.25,
          topP: 0.95,
        },
      });

    const response = await this.withRetry(
      () => runDraft(MODELS.reasoning),
      () => runDraft(MODELS.fast)
    );

    this.trackUsage(response);
    return response.text?.trim() || "// Motion drafting failed – please try again";
  }

  async chatWithExpert(
    message: string,
    files: CaseFile[],
    history: Array<{ role: string; parts: Part[] }> = []
  ): Promise<string> {
    const parts: Array<string | Part> = [];
    
    if (files.length > 0) {
      parts.push("CASE DATA (do NOT repeat unless asked):");
      for (const f of files) {
        if (f.inlineData) {
          parts.push(`--- FILE: ${f.name} ---`);
          parts.push({ inlineData: f.inlineData });
        } else {
          const safeContent = f.content.trim().slice(0, 14000);
          parts.push(`--- FILE: ${f.name} (${f.content.length} chars) ---\n${safeContent}\n--- END ---`);
        }
      }
    }
    
    parts.push(`\nUSER: ${message}`);

    const runChat = async (model: string) => {
      const chat = this.ai.chats.create({
        model,
        config: {
          systemInstruction:
            "You are Family First – knowledgeable, professional Indiana civil law assistant handling all types of civil matters including contracts, torts, property, family, and more. Be concise, accurate, cite authority when possible.",
          temperature: 0.45,
        },
        history,
      });

      const res = await chat.sendMessage({ message: parts });
      this.trackUsage(res);
      return res.text?.trim() ?? "No response received.";
    };

    return this.withRetry(
      () => runChat(MODELS.reasoning),
      () => runChat(MODELS.fast)
    );
  }
}

export const geminiService = new GeminiService();