
// We keep specific types for UI helpers, but allow string for extensibility
export type NoteType = 'general' | 'link' | 'problem' | 'lesson' | 'video' | 'meeting' | string;

export interface Attachment {
  id: string;
  name: string;
  type: string; // mime type
  data: string; // base64 or url
}

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  content: string; // Main markdown content
  
  // Extensible metadata field (JSON column in DB)
  // Replaces specific columns like 'solution' or 'url'
  metadata: Record<string, any>;
  
  tags: string[];
  catalogId?: string;
  attachments: Attachment[];
  
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  isArchived: boolean;
}

export interface Catalog {
  id: string;
  name: string;
  parentId?: string;
}

export interface FilterState {
  query: string;
  type: NoteType | 'all';
  catalogId: string | 'all';
  tag: string | null;
  startDate?: string;
  endDate?: string;
  isArchived?: boolean; // New field for Suggestion 2
}