import {
  AppState,
  Client,
  CatalogItem,
  Job,
  Quote,
  Profile,
  validateState,
  clientSchema,
  catalogSchema,
  jobSchema,
  quoteSchema,
  profileSchema,
} from './model';

type Editable<T> = Omit<T, 'updatedAt'> & { expectedUpdatedAt?: string };
export type Command =
  | { type: 'client.save'; value: Editable<Client> }
  | { type: 'client.delete'; id: string; expectedUpdatedAt: string }
  | { type: 'catalog.save'; value: Editable<CatalogItem> }
  | { type: 'catalog.delete'; id: string; expectedUpdatedAt: string }
  | { type: 'quote.save'; value: Omit<Editable<Quote>, 'number' | 'clientSnapshot'> }
  | { type: 'quote.status'; id: string; status: Quote['status']; expectedUpdatedAt: string }
  | { type: 'quote.delete'; id: string; expectedUpdatedAt: string }
  | { type: 'job.save'; value: Omit<Editable<Job>, 'clientSnapshot'> }
  | { type: 'job.status'; id: string; status: Job['status']; expectedUpdatedAt: string }
  | { type: 'job.delete'; id: string; expectedUpdatedAt: string }
  | { type: 'profile.save'; value: Profile; expectedRevision: number };

function checkExisting<T extends { id: string; updatedAt: string }>(
  list: T[],
  id: string,
  expected?: string,
) {
  const existing = list.find((item) => item.id === id);
  if ((existing && existing.updatedAt !== expected) || (!existing && expected)) {
    throw new Error('Este registro mudou em outra tela. Feche e abra novamente antes de salvar.');
  }
  return existing;
}
function upsert<T extends { id: string }>(list: T[], value: T) {
  const index = list.findIndex((item) => item.id === value.id);
  if (index < 0) list.unshift(value);
  else list[index] = value;
}
function snapshot(state: AppState, id: string) {
  const client = state.clients.find((c) => c.id === id);
  if (!client) throw new Error('Selecione um cliente existente.');
  const { name, phone, email, address } = client;
  return { name, phone, email, address };
}
function requireId<T extends { id: string }>(list: T[], id: string) {
  const value = list.find((v) => v.id === id);
  if (!value) throw new Error('Registro não encontrado. Atualize a tela.');
  return value;
}
export function applyCommand(
  current: AppState,
  command: Command,
  now = new Date().toISOString(),
): AppState {
  const state = structuredClone(current);
  const latest = [...state.clients, ...state.catalog, ...state.quotes, ...state.jobs].reduce(
    (max, value) => Math.max(max, Date.parse(value.updatedAt)),
    0,
  );
  now = new Date(Math.max(Date.parse(now), latest + 1)).toISOString();
  switch (command.type) {
    case 'client.save': {
      const { expectedUpdatedAt, ...value } = command.value;
      checkExisting(state.clients, value.id, expectedUpdatedAt);
      upsert(state.clients, clientSchema.parse({ ...value, updatedAt: now }));
      break;
    }
    case 'client.delete':
      requireId(state.clients, command.id);
      checkExisting(state.clients, command.id, command.expectedUpdatedAt);
      if (
        state.quotes.some((q) => q.clientId === command.id) ||
        state.jobs.some((j) => j.clientId === command.id)
      ) {
        throw new Error(
          'Este cliente possui orçamentos ou trabalhos. Preserve o histórico ou remova os vínculos primeiro.',
        );
      }
      state.clients = state.clients.filter((c) => c.id !== command.id);
      break;
    case 'catalog.save': {
      const { expectedUpdatedAt, ...value } = command.value;
      checkExisting(state.catalog, value.id, expectedUpdatedAt);
      upsert(state.catalog, catalogSchema.parse({ ...value, updatedAt: now }));
      break;
    }
    case 'catalog.delete':
      requireId(state.catalog, command.id);
      checkExisting(state.catalog, command.id, command.expectedUpdatedAt);
      state.catalog = state.catalog.filter((c) => c.id !== command.id);
      break;
    case 'quote.save': {
      const { expectedUpdatedAt, ...value } = command.value;
      const old = checkExisting(state.quotes, value.id, expectedUpdatedAt);
      if (old && old.status !== 'draft')
        throw new Error(
          'Somente rascunhos podem ser editados. Duplique para criar uma nova proposta.',
        );
      if (value.status !== 'draft') throw new Error('Novos orçamentos devem ser rascunhos.');
      upsert(
        state.quotes,
        quoteSchema.parse({
          ...value,
          number: old?.number ?? state.nextNumber++,
          clientSnapshot: snapshot(state, value.clientId),
          updatedAt: now,
        }),
      );
      break;
    }
    case 'quote.status': {
      const quote = requireId(state.quotes, command.id);
      checkExisting(state.quotes, quote.id, command.expectedUpdatedAt);
      const allowed: Record<Quote['status'], Quote['status'][]> = {
        draft: ['sent'],
        sent: ['approved', 'declined'],
        approved: [],
        declined: [],
      };
      if (!allowed[quote.status].includes(command.status))
        throw new Error('Esta mudança de status não é permitida.');
      quote.status = command.status;
      quote.updatedAt = now;
      break;
    }
    case 'quote.delete':
      requireId(state.quotes, command.id);
      checkExisting(state.quotes, command.id, command.expectedUpdatedAt);
      if (state.jobs.some((j) => j.quoteId === command.id))
        throw new Error('Remova o trabalho vinculado antes de excluir o orçamento.');
      state.quotes = state.quotes.filter((q) => q.id !== command.id);
      break;
    case 'job.save': {
      const { expectedUpdatedAt, ...value } = command.value;
      const old = checkExisting(state.jobs, value.id, expectedUpdatedAt);
      if ((old && old.status !== value.status) || (!old && value.status !== 'scheduled')) {
        throw new Error('Atualize o status pelos controles do trabalho.');
      }
      if (value.quoteId) {
        const quote = requireId(state.quotes, value.quoteId);
        if (quote.status !== 'approved')
          throw new Error('Aprove o orçamento antes de agendar o trabalho.');
      }
      upsert(
        state.jobs,
        jobSchema.parse({
          ...value,
          clientSnapshot: snapshot(state, value.clientId),
          updatedAt: now,
        }),
      );
      break;
    }
    case 'job.status': {
      const job = requireId(state.jobs, command.id);
      checkExisting(state.jobs, job.id, command.expectedUpdatedAt);
      const allowed: Record<Job['status'], Job['status'][]> = {
        scheduled: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };
      if (!allowed[job.status].includes(command.status))
        throw new Error('Esta mudança de status não é permitida.');
      job.status = command.status;
      job.updatedAt = now;
      break;
    }
    case 'job.delete':
      requireId(state.jobs, command.id);
      checkExisting(state.jobs, command.id, command.expectedUpdatedAt);
      state.jobs = state.jobs.filter((j) => j.id !== command.id);
      break;
    case 'profile.save':
      if (state.revision !== command.expectedRevision)
        throw new Error('Os dados mudaram. Feche e reabra o perfil antes de salvar.');
      state.profile = profileSchema.parse(command.value);
      break;
    default:
      throw new Error('Comando desconhecido.');
  }
  state.revision += 1;
  return validateState(state);
}
