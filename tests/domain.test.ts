import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand, type Command } from '../src/domain/actions';
import {
  emptyState,
  parseMoney,
  parseQuantity,
  totals,
  validateState,
  dateSchema,
  type AppState,
} from '../src/domain/model';
import { demoState } from '../src/data/demo';

export function withClient(): AppState {
  return applyCommand(emptyState(), {
    type: 'client.save',
    value: {
      id: crypto.randomUUID(),
      name: 'Cliente de teste',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  });
}
export function quoteCommand(state: AppState): Command {
  return {
    type: 'quote.save',
    value: {
      id: crypto.randomUUID(),
      clientId: state.clients[0].id,
      title: 'Instalação de teste',
      date: '2026-10-20',
      validityDays: 15,
      discountCents: 0,
      notes: '',
      status: 'draft',
      items: [
        {
          id: crypto.randomUUID(),
          name: 'Tomada de teste',
          kind: 'labor',
          unit: 'un',
          quantityMilli: 1000,
          priceCents: 12345,
        },
      ],
    },
  };
}
test('espaço vazio e demonstração respeitam o contrato', () => {
  assert.deepEqual(validateState(emptyState()), emptyState());
  assert.equal(validateState(demoState()).clients.length, 3);
});
for (const [input, expected] of [
  ['0,01', 1],
  ['12.34', 1234],
  ['0', 0],
  ['1250,50', 125050],
] as const) {
  test(`valor ${input} é representado em centavos`, () =>
    assert.equal(parseMoney(input), expected));
}
for (const input of ['-1', '1.000,00', '1,001', '1e3', 'NaN', 'Infinity', '', '1000001', '1 2']) {
  test(`valor inválido ${JSON.stringify(input)} é rejeitado`, () =>
    assert.throws(() => parseMoney(input)));
}
test('quantidades fracionárias são exatas em milésimos', () => {
  assert.equal(parseQuantity('0,125'), 125);
  assert.equal(parseQuantity('2.5'), 2500);
  assert.throws(() => parseQuantity('0'));
  assert.throws(() => parseQuantity('0.0001'));
  assert.throws(() => parseQuantity('1e2'));
  assert.throws(() => parseQuantity('1001'));
});
test('datas impossíveis, formato e limites são rejeitados', () => {
  for (const value of ['2026-02-30', '2025-02-29', '20/10/2026', '1999-01-01', '2101-01-01'])
    assert.equal(dateSchema.safeParse(value).success, false);
  assert.equal(dateSchema.parse('2028-02-29'), '2028-02-29');
});
test('totais arredondam por item e rejeitam desconto excessivo', () => {
  const state = demoState();
  const quote = state.quotes[0];
  assert.equal(totals(quote).total, 53200);
  assert.throws(() => totals({ ...quote, discountCents: 999999 }));
});
test('comandos não modificam a entrada e nomes vazios não são salvos', () => {
  const state = emptyState();
  const original = structuredClone(state);
  const command = {
    type: 'client.save',
    value: { id: crypto.randomUUID(), name: '   ', phone: '', email: '', address: '', notes: '' },
  } as const;
  assert.throws(() => applyCommand(state, command));
  assert.deepEqual(state, original);
});
test('edições simultâneas são detectadas mesmo no mesmo milissegundo', () => {
  const state = withClient();
  const client = state.clients[0];
  const command = {
    type: 'client.save',
    value: { ...client, expectedUpdatedAt: client.updatedAt, name: 'Nome alterado' },
  } as const;
  const next = applyCommand(state, command, client.updatedAt);
  assert.notEqual(next.clients[0].updatedAt, client.updatedAt);
  assert.throws(() => applyCommand(next, command), /outra tela/);
});
test('orçamentos recebem sequência e preservam os dados do cliente', () => {
  let state = withClient();
  state = applyCommand(state, quoteCommand(state));
  const client = state.clients[0];
  const oldName = client.name;
  state = applyCommand(state, {
    type: 'client.save',
    value: { ...client, name: 'Outro nome', expectedUpdatedAt: client.updatedAt },
  });
  assert.equal(state.quotes[0].clientSnapshot.name, oldName);
  assert.equal(state.nextNumber, 2);
  state = applyCommand(state, quoteCommand(state));
  assert.equal(state.quotes[0].number, 2);
});
test('cliente vinculado não pode ser excluído', () => {
  let state = withClient();
  state = applyCommand(state, quoteCommand(state));
  assert.throws(
    () =>
      applyCommand(state, {
        type: 'client.delete',
        id: state.clients[0].id,
        expectedUpdatedAt: state.clients[0].updatedAt,
      }),
    /histórico/,
  );
});
test('proposta enviada não pode ser editada nem ter status pulado', () => {
  let state = withClient();
  const command = quoteCommand(state);
  state = applyCommand(state, command);
  assert.throws(
    () =>
      applyCommand(state, {
        type: 'quote.status',
        id: state.quotes[0].id,
        expectedUpdatedAt: state.quotes[0].updatedAt,
        status: 'approved',
      }),
    /não é permitida/,
  );
  state = applyCommand(state, {
    type: 'quote.status',
    id: state.quotes[0].id,
    expectedUpdatedAt: state.quotes[0].updatedAt,
    status: 'sent',
  });
  if (command.type !== 'quote.save') throw new Error('Fixture inválida');
  assert.throws(
    () =>
      applyCommand(state, {
        ...command,
        value: { ...command.value, expectedUpdatedAt: state.quotes[0].updatedAt },
      }),
    /rascunhos/,
  );
});
test('integridade rejeita registros duplicados e vínculos quebrados', () => {
  const state = demoState();
  assert.throws(
    () => validateState({ ...state, clients: [...state.clients, state.clients[0]] }),
    /duplicados/,
  );
  assert.throws(() => validateState({ ...state, clients: [] }), /inexistente/);
  assert.throws(() => validateState({ ...state, schemaVersion: 2 }));
  assert.throws(() => validateState({ ...state, nextNumber: 1 }), /sequência/);
});
test('catálogo não modifica os itens já cotados', () => {
  const state = demoState();
  const before = structuredClone(state.quotes);
  const item = state.catalog[0];
  const next = applyCommand(state, {
    type: 'catalog.save',
    value: { ...item, priceCents: 99999, expectedUpdatedAt: item.updatedAt },
  });
  assert.deepEqual(next.quotes, before);
});
test('orçamento não cria dois trabalhos e o vínculo não pode apontar a outro cliente', () => {
  const state = demoState();
  const job = state.jobs[0];
  const command = { type: 'job.save', value: { ...job, id: crypto.randomUUID() } } as const;
  assert.throws(() => applyCommand(state, command), /mais de um trabalho/);
  assert.throws(
    () => validateState({ ...state, jobs: [{ ...job, clientId: state.clients[1].id }] }),
    /difere/,
  );
});
test('trabalho percorre estados válidos e orçamento vinculado é preservado', () => {
  let state = demoState();
  let job = state.jobs[0];
  assert.throws(
    () =>
      applyCommand(state, {
        type: 'job.status',
        id: job.id,
        expectedUpdatedAt: job.updatedAt,
        status: 'completed',
      }),
    /não é permitida/,
  );
  state = applyCommand(state, {
    type: 'job.status',
    id: job.id,
    expectedUpdatedAt: job.updatedAt,
    status: 'in_progress',
  });
  job = state.jobs[0];
  state = applyCommand(state, {
    type: 'job.status',
    id: job.id,
    expectedUpdatedAt: job.updatedAt,
    status: 'completed',
  });
  assert.equal(state.jobs[0].status, 'completed');
  assert.throws(
    () =>
      applyCommand(state, {
        type: 'quote.delete',
        id: job.quoteId,
        expectedUpdatedAt: state.quotes.find((q) => q.id === job.quoteId)!.updatedAt,
      }),
    /vinculado/,
  );
});

test('exclusões e perfil rejeitam uma confirmação desatualizada', () => {
  const state = withClient();
  const client = state.clients[0];
  assert.throws(
    () =>
      applyCommand(state, {
        type: 'client.delete',
        id: client.id,
        expectedUpdatedAt: '2020-01-01T00:00:00.000Z',
      }),
    /outra tela/,
  );
  assert.throws(
    () =>
      applyCommand(state, {
        type: 'profile.save',
        value: state.profile,
        expectedRevision: state.revision - 1,
      }),
    /mudaram/,
  );
});
