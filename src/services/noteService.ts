import axios from 'axios';
import type { Note, NoteTag } from '../types/note';

export interface FetchNotesParams {
  page: number;
  search?: string;
  perPage?: number;
  signal?: AbortSignal;
}

export interface FetchNotesResponse {
  notes: Note[];
  totalPages: number;
}

export interface CreateNoteParams {
  title: string;
  content: string;
  tag: NoteTag;
}

const token = import.meta.env.VITE_NOTEHUB_TOKEN;
export const hasNoteHubToken = Boolean(token?.trim());

const noteApi = axios.create({
  baseURL: 'https://notehub-public.goit.study/api',
  headers: { Authorization: `Bearer ${token}` },
});

export async function fetchNotes({
  page,
  search = '',
  perPage = 12,
  signal,
}: FetchNotesParams): Promise<FetchNotesResponse> {
  const { data } = await noteApi.get<FetchNotesResponse>('/notes', {
    params: { page, perPage, search: search || undefined, sortBy: 'created' },
    signal,
  });
  return data;
}

export async function createNote(note: CreateNoteParams): Promise<Note> {
  const { data } = await noteApi.post<Note>('/notes', note);
  return data;
}

export async function deleteNote(id: Note['id']): Promise<Note> {
  const { data } = await noteApi.delete<Note>(`/notes/${id}`);
  return data;
}
