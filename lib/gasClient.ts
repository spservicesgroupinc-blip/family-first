/**
 * Google Apps Script Client Wrapper
 * TypeScript interface for the Family First GAS backend
 */

import { ClientProfile, ClientSummary } from '../types';

const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || '';
const GAS_API_KEY = import.meta.env.VITE_GAS_API_KEY || '';

interface GASResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  total?: number;
}

// ────────────────────────────────────────────────
// Core API Methods
// ────────────────────────────────────────────────

async function gasRequest<T>(body: Record<string, unknown>): Promise<GASResponse<T>> {
  if (!GAS_API_URL) {
    throw new Error('GAS API URL not configured. Set VITE_GAS_API_URL in your environment.');
  }

  const url = new URL(GAS_API_URL);
  if (GAS_API_KEY) {
    url.searchParams.set('apiKey', GAS_API_KEY);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`GAS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as GASResponse<T>;
}

export async function saveClient(profile: ClientProfile): Promise<ClientProfile> {
  const action = profile.id && profile.id.startsWith('client_') ? 'update' : 'create';
  
  const response = await gasRequest<ClientProfile>({
    action,
    id: profile.id,
    profile,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to save client');
  }

  return response.data;
}

export async function createClient(profile: Omit<ClientProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientProfile> {
  const response = await gasRequest<ClientProfile>({
    action: 'create',
    profile,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to create client');
  }

  return response.data;
}

export async function updateClient(id: string, updates: Partial<ClientProfile>): Promise<ClientProfile> {
  const response = await gasRequest<ClientProfile>({
    action: 'update',
    id,
    profile: updates,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to update client');
  }

  return response.data;
}

export async function listClients(query?: string): Promise<ClientSummary[]> {
  const url = new URL(GAS_API_URL);
  url.searchParams.set('action', 'list');
  if (GAS_API_KEY) url.searchParams.set('apiKey', GAS_API_KEY);
  if (query) url.searchParams.set('query', query);

  const response = await fetch(url.toString());
  const data = await response.json() as GASResponse<ClientSummary[]>;

  if (!data.success) {
    throw new Error(data.error || 'Failed to list clients');
  }

  return data.data || [];
}

export async function getClient(id: string): Promise<ClientProfile> {
  const url = new URL(GAS_API_URL);
  url.searchParams.set('action', 'get');
  url.searchParams.set('id', id);
  if (GAS_API_KEY) url.searchParams.set('apiKey', GAS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json() as GASResponse<ClientProfile>;

  if (!data.success) {
    throw new Error(data.error || 'Failed to get client');
  }

  return data.data;
}

export async function searchClients(query: string): Promise<ClientSummary[]> {
  const url = new URL(GAS_API_URL);
  url.searchParams.set('action', 'search');
  url.searchParams.set('query', query);
  if (GAS_API_KEY) url.searchParams.set('apiKey', GAS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json() as GASResponse<ClientSummary[]>;

  if (!data.success) {
    throw new Error(data.error || 'Search failed');
  }

  return data.data || [];
}

export async function archiveClient(id: string): Promise<boolean> {
  const response = await gasRequest<{ success: boolean }>({
    action: 'delete',
    id,
  });

  return response.success;
}

// ────────────────────────────────────────────────
// Offline Fallback (localStorage)
// ────────────────────────────────────────────────

const LOCAL_CLIENTS_KEY = 'ff_clients_local';
const LOCAL_ACTIVE_KEY = 'ff_active_client_local';

function getLocalClients(): ClientProfile[] {
  try {
    const data = localStorage.getItem(LOCAL_CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalClients(clients: ClientProfile[]): void {
  localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(clients));
}

export async function saveClientOffline(profile: ClientProfile): Promise<ClientProfile> {
  const clients = getLocalClients();
  const existingIndex = clients.findIndex(c => c.id === profile.id);
  
  if (existingIndex >= 0) {
    clients[existingIndex] = { ...clients[existingIndex], ...profile, updatedAt: Date.now() };
  } else {
    const newProfile: ClientProfile = {
      ...profile,
      id: profile.id || 'client_local_' + Date.now(),
      createdAt: profile.createdAt || Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      status: 'active',
    };
    clients.push(newProfile);
  }
  
  saveLocalClients(clients);
  return profile;
}

export function getLocalClient(id: string): ClientProfile | undefined {
  return getLocalClients().find(c => c.id === id);
}

export function getLocalClientSummaries(): ClientSummary[] {
  return getLocalClients().map(c => ({
    id: c.id,
    fullName: `${c.personalInfo.firstName || ''} ${c.personalInfo.lastName || ''}`.trim(),
    caseType: c.caseInfo.caseType || 'other',
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    spouseName: c.spouseInfo?.fullName || '',
    childrenCount: c.children?.length || 0,
    caseNumber: c.caseInfo?.caseNumber || '',
    countyFiled: c.caseInfo?.countyFiled || '',
  }));
}

export function setActiveClientLocal(id: string): void {
  localStorage.setItem(LOCAL_ACTIVE_KEY, id);
}

export function getActiveClientLocal(): string | null {
  return localStorage.getItem(LOCAL_ACTIVE_KEY);
}

// ────────────────────────────────────────────────
// Sync Helper
// ────────────────────────────────────────────────

export async function syncClientToCloud(profile: ClientProfile): Promise<ClientProfile> {
  try {
    if (GAS_API_URL) {
      return await saveClient(profile);
    }
  } catch (error) {
    console.warn('[GAS] Cloud sync failed, falling back to local storage:', error);
  }
  
  // Fallback to local
  return await saveClientOffline(profile);
}

export async function loadClientsWithFallback(): Promise<ClientSummary[]> {
  try {
    if (GAS_API_URL) {
      return await listClients();
    }
  } catch (error) {
    console.warn('[GAS] Cloud load failed, falling back to local storage:', error);
  }
  
  return getLocalClientSummaries();
}

export async function loadClientWithFallback(id: string): Promise<ClientProfile | null> {
  try {
    if (GAS_API_URL) {
      return await getClient(id);
    }
  } catch (error) {
    console.warn('[GAS] Cloud load failed, falling back to local storage:', error);
  }
  
  return getLocalClient(id) || null;
}

// ────────────────────────────────────────────────
// Default Export
// ────────────────────────────────────────────────

export const gasClient = {
  saveClient,
  createClient,
  updateClient,
  listClients,
  getClient,
  searchClients,
  archiveClient,
  saveClientOffline,
  getLocalClient,
  getLocalClientSummaries,
  setActiveClientLocal,
  getActiveClientLocal,
  syncClientToCloud,
  loadClientsWithFallback,
  loadClientWithFallback,
};
