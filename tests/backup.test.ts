import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, readBackup, MAX_BACKUP_BYTES } from '../src/data/backup';
import { demoState } from '../src/data/demo';

test('backup preserva todos os dados e verifica integridade', async () => {
  const state = demoState();
  const text = await createBackup(state, 'demo');
  const result = await readBackup(text, 'demo');
  assert.deepEqual(result.data, state);
});
test('espaços pessoal e demonstração não misturam backups', async () => {
  const text = await createBackup(demoState(), 'demo');
  await assert.rejects(readBackup(text, 'personal'), /respectivos espaços/);
});
test('backup alterado e JSON truncado não são aceitos', async () => {
  const text = await createBackup(demoState(), 'demo');
  const data = JSON.parse(text);
  data.data.clients[0].name = 'Nome alterado';
  await assert.rejects(readBackup(JSON.stringify(data), 'demo'), /corrompido/);
  await assert.rejects(readBackup(text.slice(0, -3), 'demo'), /JSON válido/);
});
test('formato futuro e arquivos excessivos não são importados', async () => {
  const text = JSON.parse(await createBackup(demoState(), 'demo'));
  text.version = 99;
  await assert.rejects(readBackup(JSON.stringify(text), 'demo'));
  await assert.rejects(readBackup('a'.repeat(MAX_BACKUP_BYTES + 1), 'demo'), /10 MB/);
});
