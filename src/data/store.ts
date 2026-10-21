import { openDB, type DBSchema } from 'idb';
import { AppState, Mode, emptyState, validateState } from '../domain/model';
import { applyCommand, type Command } from '../domain/actions';
import { demoState } from './demo';

interface StoreDB extends DBSchema {
  workspaces: { key: Mode; value: AppState };
}
const DB_NAME = 'eletropro-local';
let connection: ReturnType<typeof openDB<StoreDB>> | undefined;
function database() {
  connection ??= openDB<StoreDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('workspaces');
    },
    blocking() {
      connection?.then((db) => db.close());
      connection = undefined;
    },
    terminated() {
      connection = undefined;
    },
  }).catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
}
function notify() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('eletropro-change'));
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('eletropro');
    channel.postMessage('change');
    channel.close();
  }
}
export async function readWorkspace(mode: Mode): Promise<AppState | undefined> {
  const state = await (await database()).get('workspaces', mode);
  return state === undefined ? undefined : validateState(state);
}
export async function initializeWorkspace(mode: Mode) {
  const db = await database();
  const tx = db.transaction('workspaces', 'readwrite');
  const existing = await tx.store.get(mode);
  const state = validateState(existing ?? (mode === 'demo' ? demoState() : emptyState()));
  if (!existing) await tx.store.put(state, mode);
  await tx.done;
  notify();
  return state;
}
export async function dispatch(mode: Mode, command: Command) {
  const db = await database();
  const tx = db.transaction('workspaces', 'readwrite');
  try {
    const state = await tx.store.get(mode);
    if (!state) throw new Error('Abra um espaço de trabalho antes de salvar.');
    const next = applyCommand(validateState(state), command);
    await tx.store.put(next, mode);
    await tx.done;
    notify();
    return next;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* A transação pode ter sido encerrada pelo banco. */
    }
    await tx.done.catch(() => undefined);
    throw error;
  }
}
export async function restoreWorkspace(mode: Mode, data: AppState, expectedRevision: number) {
  const validated = validateState(data);
  const db = await database();
  const tx = db.transaction('workspaces', 'readwrite');
  try {
    const current = await tx.store.get(mode);
    if (!current || current.revision !== expectedRevision)
      throw new Error('Os dados mudaram. Confira novamente antes de restaurar.');
    const latest = [
      ...current.clients,
      ...current.catalog,
      ...current.quotes,
      ...current.jobs,
      ...validated.clients,
      ...validated.catalog,
      ...validated.quotes,
      ...validated.jobs,
    ].reduce((max, item) => Math.max(max, Date.parse(item.updatedAt)), 0);
    const updatedAt = new Date(Math.max(Date.now(), latest + 1)).toISOString();
    // Invalida formulários que permaneceram abertos em outra janela durante a restauração.
    const next = {
      ...validated,
      revision: current.revision + 1,
      clients: validated.clients.map((item) => ({ ...item, updatedAt })),
      catalog: validated.catalog.map((item) => ({ ...item, updatedAt })),
      quotes: validated.quotes.map((item) => ({ ...item, updatedAt })),
      jobs: validated.jobs.map((item) => ({ ...item, updatedAt })),
    };
    await tx.store.put(next, mode);
    await tx.done;
    notify();
    return next;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* Nada foi substituído em uma transação já abortada. */
    }
    await tx.done.catch(() => undefined);
    throw error;
  }
}
export function subscribeWorkspace(callback: () => void) {
  window.addEventListener('eletropro-change', callback);
  const channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('eletropro') : null;
  if (channel) channel.onmessage = callback;
  return () => {
    window.removeEventListener('eletropro-change', callback);
    channel?.close();
  };
}
