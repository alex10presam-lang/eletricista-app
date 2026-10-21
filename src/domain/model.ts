import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);
const name = text(120).min(2, 'Informe um nome com pelo menos 2 caracteres.');
const id = z.uuid();
const stamp = z.iso.datetime();
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= '2000-01-01' &&
      value <= '2100-12-31'
    );
  }, 'Informe uma data válida entre 2000 e 2100.');
const cents = z.number().int().min(0).max(100_000_000);
export const contactSchema = z
  .object({
    name,
    phone: text(24).refine((v) => !v || /^[+()\d\s-]{8,24}$/.test(v), 'Telefone inválido.'),
    email: z.union([z.literal(''), z.email().max(160)]),
    address: text(240),
  })
  .strict();
export const profileSchema = z
  .object({
    businessName: text(100),
    name: text(100),
    phone: contactSchema.shape.phone,
    email: contactSchema.shape.email,
    address: text(240),
    document: text(24),
  })
  .strict();
export const clientSchema = contactSchema
  .extend({ id, notes: text(2000), updatedAt: stamp })
  .strict();
export const units = ['un', 'm', 'm²', 'h', 'ponto', 'diária'] as const;
export const catalogSchema = z
  .object({
    id,
    name,
    kind: z.enum(['labor', 'material']),
    unit: z.enum(units),
    priceCents: cents,
    updatedAt: stamp,
  })
  .strict();
export const itemSchema = z
  .object({
    id,
    name,
    kind: z.enum(['labor', 'material']),
    unit: z.enum(units),
    quantityMilli: z.number().int().min(1).max(1_000_000),
    priceCents: cents,
  })
  .strict();
export const quoteSchema = z
  .object({
    id,
    number: z.number().int().min(1).max(999_999),
    clientId: id,
    clientSnapshot: contactSchema,
    title: name,
    date: dateSchema,
    validityDays: z.number().int().min(1).max(365),
    items: z.array(itemSchema).min(1, 'Adicione pelo menos um item.').max(100),
    discountCents: cents,
    notes: text(6000),
    status: z.enum(['draft', 'sent', 'approved', 'declined']),
    updatedAt: stamp,
  })
  .strict();
export const jobSchema = z
  .object({
    id,
    quoteId: z.union([id, z.literal('')]),
    clientId: id,
    clientSnapshot: contactSchema,
    title: name,
    date: dateSchema,
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.'),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
    notes: text(2000),
    updatedAt: stamp,
  })
  .strict();
export const stateSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().min(0),
    nextNumber: z.number().int().min(1).max(1_000_000),
    profile: profileSchema,
    clients: z.array(clientSchema).max(10_000),
    catalog: z.array(catalogSchema).max(10_000),
    quotes: z.array(quoteSchema).max(10_000),
    jobs: z.array(jobSchema).max(10_000),
  })
  .strict();

export type Profile = z.infer<typeof profileSchema>;
export type Client = z.infer<typeof clientSchema>;
export type CatalogItem = z.infer<typeof catalogSchema>;
export type QuoteItem = z.infer<typeof itemSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Job = z.infer<typeof jobSchema>;
export type AppState = z.infer<typeof stateSchema>;
export type Mode = 'personal' | 'demo';

export function emptyState(): AppState {
  return {
    schemaVersion: 1,
    revision: 0,
    nextNumber: 1,
    profile: { businessName: '', name: '', phone: '', email: '', address: '', document: '' },
    clients: [],
    catalog: [],
    quotes: [],
    jobs: [],
  };
}
export function lineTotal(item: QuoteItem) {
  return Math.round((item.quantityMilli * item.priceCents) / 1000);
}
export function totals(quote: Pick<Quote, 'items' | 'discountCents'>) {
  const labor = quote.items.filter((i) => i.kind === 'labor').reduce((s, i) => s + lineTotal(i), 0);
  const material = quote.items
    .filter((i) => i.kind === 'material')
    .reduce((s, i) => s + lineTotal(i), 0);
  const subtotal = labor + material;
  if (quote.discountCents > subtotal) throw new Error('O desconto não pode superar o subtotal.');
  if (!Number.isSafeInteger(subtotal) || subtotal > 1_000_000_000)
    throw new Error('Orçamento excede o limite de R$ 10 milhões.');
  return { labor, material, subtotal, total: subtotal - quote.discountCents };
}
export function validateState(input: unknown): AppState {
  const state = stateSchema.parse(input);
  const unique = (values: string[]) => new Set(values).size === values.length;
  for (const list of [state.clients, state.catalog, state.quotes, state.jobs]) {
    if (!unique(list.map((item) => item.id)))
      throw new Error('Há identificadores duplicados nos dados.');
  }
  if (!unique(state.quotes.map((q) => String(q.number))))
    throw new Error('Há números de orçamento duplicados.');
  if (state.quotes.some((q) => q.number >= state.nextNumber))
    throw new Error('A sequência de orçamentos é inválida.');
  const clientIds = new Set(state.clients.map((c) => c.id));
  const quoteIds = new Set(state.quotes.map((q) => q.id));
  for (const quote of state.quotes) {
    totals(quote);
    if (!clientIds.has(quote.clientId)) throw new Error('Orçamento com cliente inexistente.');
    if (!unique(quote.items.map((i) => i.id))) throw new Error('Itens de orçamento duplicados.');
  }
  const linked: string[] = [];
  for (const job of state.jobs) {
    if (!clientIds.has(job.clientId)) throw new Error('Trabalho com cliente inexistente.');
    if (job.quoteId) {
      if (!quoteIds.has(job.quoteId)) throw new Error('Trabalho com orçamento inexistente.');
      const quote = state.quotes.find((q) => q.id === job.quoteId)!;
      if (quote.clientId !== job.clientId)
        throw new Error('Cliente do trabalho difere do orçamento.');
      linked.push(job.quoteId);
    }
  }
  if (!unique(linked)) throw new Error('Um orçamento está vinculado a mais de um trabalho.');
  return state;
}

export function parseMoney(input: string): number {
  const clean = input.trim();
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(clean))
    throw new Error('Informe o valor sem separador de milhar, por exemplo 1250,50.');
  const [whole, fraction = ''] = clean.replace(',', '.').split('.');
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents.parse(value);
}
export function parseQuantity(input: string): number {
  if (!/^\d{1,4}([.,]\d{1,3})?$/.test(input.trim()))
    throw new Error('Quantidade inválida. Use até três casas decimais.');
  const [whole, fraction = ''] = input.trim().replace(',', '.').split('.');
  return itemSchema.shape.quantityMilli.parse(
    Number(whole) * 1000 + Number(fraction.padEnd(3, '0')),
  );
}
export const moneyInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
export const quantityInput = (milli: number) => String(milli / 1000).replace('.', ',');
export const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
export const displayDate = (date: string) => date.split('-').reverse().join('/');
export const quoteNumber = (number: number) => `ORC-${String(number).padStart(4, '0')}`;
export function errorMessage(error: unknown) {
  if (error instanceof Error && error.message === 'Share canceled') {
    return 'Compartilhamento cancelado. O arquivo foi preservado.';
  }
  if (error instanceof z.ZodError)
    return error.issues[0]?.message || 'Confira os campos informados.';
  return error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
}
