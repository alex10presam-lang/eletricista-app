import { z } from 'zod';
import { AppState, Mode, validateState } from '../domain/model';

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const envelope = z
  .object({
    format: z.literal('eletropro.backup'),
    version: z.literal(1),
    exportedAt: z.iso.datetime(),
    mode: z.enum(['personal', 'demo']),
    checksum: z.string().regex(/^[a-f0-9]{64}$/),
    data: z.unknown(),
  })
  .strict();
async function checksum(data: unknown) {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(data)),
  );
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function createBackup(state: AppState, mode: Mode) {
  const data = validateState(state);
  return JSON.stringify(
    {
      format: 'eletropro.backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      mode,
      checksum: await checksum(data),
      data,
    },
    null,
    2,
  );
}
export async function readBackup(text: string, mode: Mode) {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error('Backup excede o limite de 10 MB.');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não é um backup JSON válido.');
  }
  const parsed = envelope.parse(json);
  if (parsed.mode !== mode)
    throw new Error(
      'Backups de demonstração e pessoais devem ser restaurados em seus respectivos espaços.',
    );
  if ((await checksum(parsed.data)) !== parsed.checksum)
    throw new Error('O arquivo foi alterado ou está corrompido. Nenhum dado foi restaurado.');
  return { data: validateState(parsed.data), exportedAt: parsed.exportedAt };
}
