import test from 'node:test';
import assert from 'node:assert/strict';
import { demoState } from '../src/data/demo';
import { buildQuotePDF } from '../src/lib/pdf';

test('PDF tem total, identificação, indicação de demonstração e assinatura PDF válida', () => {
  const state = demoState();
  const pdf = buildQuotePDF(state.quotes[0], state.profile, true);
  const content = pdf.output();
  assert.match(content, /^%PDF/);
  assert.match(content, /ORC-0001/);
  assert.match(content, /532/);
  assert.equal(pdf.getNumberOfPages(), 1);
});
test('orçamento longo gera várias páginas e numeração em todas elas', () => {
  const state = demoState();
  const quote = {
    ...state.quotes[0],
    notes: 'Condição de execução detalhada. '.repeat(150),
    items: Array.from({ length: 50 }, (_, index) => ({
      ...state.quotes[0].items[0],
      id: crypto.randomUUID(),
      name: `Serviço de teste ${index + 1}`,
    })),
  };
  const pdf = buildQuotePDF(quote, state.profile);
  const pages = pdf.getNumberOfPages();
  assert.ok(pages > 3);
  assert.match(pdf.output(), new RegExp(`${pages}/${pages}`));
});
