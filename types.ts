export interface CaseFile {
  id: string;
  name: string;
  type: string;
  content: string; // Text content for display/preview
  inlineData?: {   // For binary files (PDFs, Images)
    mimeType: string;
    data: string;
  };
  dateAdded: number;
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  citations?: string[]; // URLs from grounding
}

export type ViewMode = 'dashboard' | 'assistant' | 'research' | 'drafting' | 'files' | 'profile';

export interface ResearchResult {
  query: string;
  answer: string;
  sources: { title: string; uri: string }[];
}