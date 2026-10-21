import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeWorkspace, dispatch, readWorkspace, restoreWorkspace } from '../src/data/store';
import { emptyState } from '../src/domain/model';

test('transações serializam orçamentos simultâneos e restauração não perde edições novas', async () => {
  await initializeWorkspace('personal');
  const clientId = crypto.randomUUID();
  await dispatch('personal', {
    type: 'client.save',
    value: { id: clientId, name: 'Teste local', phone: '', email: '', address: '', notes: '' },
  });
  await Promise.all(
    Array.from({ length: 8 }, () =>
      dispatch('personal', {
        type: 'quote.save',
        value: {
          id: crypto.randomUUID(),
          clientId,
          title: 'Proposta concorrente',
          date: '2026-10-20',
          validityDays: 15,
          items: [
            {
              id: crypto.randomUUID(),
              name: 'Item de teste',
              kind: 'labor',
              unit: 'un',
              quantityMilli: 1000,
              priceCents: 100,
            },
          ],
          discountCents: 0,
          notes: '',
          status: 'draft',
        },
      }),
    ),
  );
  const before = (await readWorkspace('personal'))!;
  assert.equal(new Set(before.quotes.map((q) => q.number)).size, 8);
  await assert.rejects(
    dispatch('personal', {
      type: 'client.delete',
      id: clientId,
      expectedUpdatedAt: before.clients[0].updatedAt,
    }),
  );
  assert.deepEqual(await readWorkspace('personal'), before);
  await assert.rejects(restoreWorkspace('personal', emptyState(), before.revision - 1), /mudaram/);
  assert.deepEqual(await readWorkspace('personal'), before);
  const restored = await restoreWorkspace('personal', emptyState(), before.revision);
  assert.equal(restored.clients.length, 0);
  assert.equal(restored.revision, before.revision + 1);
  assert.equal((await readWorkspace('personal'))?.quotes.length, 0);
});
test('demonstração é persistida separadamente e inicialização não apaga dados', async () => {
  const state = await initializeWorkspace('demo');
  const first = state.clients[0];
  await dispatch('demo', {
    type: 'client.save',
    value: { ...first, name: 'Demonstração editada', expectedUpdatedAt: first.updatedAt },
  });
  assert.equal((await initializeWorkspace('demo')).clients[0].name, 'Demonstração editada');
  assert.equal((await readWorkspace('personal'))?.clients.length, 0);
});
