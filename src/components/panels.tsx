'use client';
import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  FileText,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  AppState,
  Client,
  CatalogItem,
  Quote,
  Job,
  today,
  money,
  displayDate,
  quoteNumber,
  totals,
} from '../domain/model';
import {
  Badge,
  Button,
  Empty,
  Icon,
  LinkArrow,
  SearchBox,
  SectionTitle,
  quoteLabels,
  jobLabels,
} from './ui';

export type Tab = 'home' | 'clients' | 'quotes' | 'jobs' | 'more' | 'catalog';
export type Editor =
  | { kind: 'client'; initial?: Client }
  | { kind: 'catalog'; initial?: CatalogItem }
  | { kind: 'quote'; initial?: Quote; duplicate?: boolean }
  | { kind: 'job'; initial?: Job; quote?: Quote }
  | { kind: 'profile' };
export type PanelProps = {
  state: AppState;
  navigate: (tab: Tab) => void;
  edit: (editor: Editor) => void;
  viewQuote: (id: string) => void;
  viewJob: (id: string) => void;
  removeClient: (client: Client) => void;
  removeCatalog: (item: CatalogItem) => void;
};
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
function matches(query: string, ...values: string[]) {
  return normalize(values.join(' ')).includes(normalize(query.trim()));
}
function Limit({ shown, total, more }: { shown: number; total: number; more: () => void }) {
  return shown < total ? (
    <Button variant="secondary" className="wide" onClick={more}>
      Mostrar mais ({total - shown})
    </Button>
  ) : null;
}

export function HomePanel({ state, navigate, edit, viewQuote, viewJob }: PanelProps) {
  const open = state.quotes.filter((q) => q.status === 'sent');
  const upcoming = state.jobs
    .filter((j) => j.status !== 'completed' && j.status !== 'cancelled')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const day = today();
  const dayJobs = upcoming.filter((j) => j.date === day);
  const firstName = (state.profile.name || 'profissional').split(' ')[0];
  return (
    <div className="panel-content">
      <div className="greeting">
        <p className="eyebrow">SEU DIA, BEM CONECTADO</p>
        <h1>
          Bom trabalho,
          <br />
          <span>{firstName}.</span>
          <span className="greeting-dot" />
        </h1>
        <p>Menos papelada. Mais energia no que você faz.</p>
      </div>
      <section className="hero-card">
        <div className="hero-top">
          <span className="hero-label">
            <span className="pulse-dot" />
            SUA PRÓXIMA CONEXÃO
          </span>
          <Icon icon={Zap} size={22} />
        </div>
        <h2>
          Do primeiro contato
          <br />
          ao serviço entregue.
        </h2>
        <p>Monte uma proposta clara, direto do celular.</p>
        <Button onClick={() => edit({ kind: 'quote' })}>
          <Icon icon={Plus} />
          Criar orçamento
          <Icon icon={ArrowUpRight} size={18} />
        </Button>
        <svg className="circuit-art" viewBox="0 0 190 220" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M190 25h-60v40H80v65H30v90M190 70h-35v40h-40v65h-45v45M190 155h-35v65" />
            <circle cx="130" cy="25" r="5" />
            <circle cx="80" cy="65" r="5" />
            <circle cx="30" cy="130" r="6" />
            <circle cx="115" cy="110" r="5" />
          </g>
        </svg>
      </section>
      <div className="stat-grid">
        <button onClick={() => navigate('quotes')} className="stat-card">
          <div>
            <Icon icon={FileText} />
            <span>Em negociação</span>
          </div>
          <strong>{money(open.reduce((sum, q) => sum + totals(q).total, 0))}</strong>
          <small>
            {open.length} orçamento{open.length !== 1 ? 's' : ''} enviado
            {open.length !== 1 ? 's' : ''}
          </small>
        </button>
        <button onClick={() => navigate('jobs')} className="stat-card">
          <div>
            <Icon icon={CalendarDays} />
            <span>Agenda de hoje</span>
          </div>
          <strong>
            {dayJobs.length.toString().padStart(2, '0')}
            <em>trabalhos</em>
          </strong>
          <small>
            {upcoming.filter((j) => j.date < day).length > 0
              ? `${upcoming.filter((j) => j.date < day).length} trabalho(s) de dias anteriores`
              : 'Organize cada visita'}
          </small>
        </button>
      </div>
      <SectionTitle
        title="Na sua agenda"
        action={<LinkArrow onClick={() => navigate('jobs')}>Ver agenda</LinkArrow>}
      />
      {upcoming.length ? (
        <div className="list-stack">
          {upcoming.slice(0, 3).map((job) => (
            <JobCard key={job.id} job={job} open={() => viewJob(job.id)} compact />
          ))}
        </div>
      ) : (
        <Empty
          icon={CalendarDays}
          title="Espaço para novos trabalhos"
          action={
            <Button variant="secondary" onClick={() => edit({ kind: 'job' })}>
              Agendar visita
            </Button>
          }
        >
          Agende visitas e acompanhe a execução dos serviços.
        </Empty>
      )}
      <SectionTitle
        title="Últimas propostas"
        action={<LinkArrow onClick={() => navigate('quotes')}>Ver todas</LinkArrow>}
      />
      {state.quotes.length ? (
        <div className="list-stack">
          {state.quotes.slice(0, 3).map((quote) => (
            <QuoteCard key={quote.id} quote={quote} open={() => viewQuote(quote.id)} />
          ))}
        </div>
      ) : (
        <div className="quiet-card">
          <Icon icon={FileText} />
          <p>Seu primeiro orçamento começa com um cliente e uma boa descrição do serviço.</p>
        </div>
      )}
      <div className="offline-note">
        <Icon icon={ShieldCheck} size={17} />
        <span>Seus dados ficam neste aparelho. Faça backups em “Mais”.</span>
      </div>
    </div>
  );
}

export function ClientsPanel({ state, edit, removeClient }: PanelProps) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(30);
  const clients = state.clients.filter((c) => matches(query, c.name, c.phone, c.address));
  return (
    <div className="panel-content">
      <SectionTitle
        eyebrow="BONS CONTATOS, BONS NEGÓCIOS"
        title="Seus clientes"
        action={
          <Button onClick={() => edit({ kind: 'client' })}>
            <Icon icon={Plus} size={18} />
            Novo
          </Button>
        }
      />
      <SearchBox
        value={query}
        onChange={(q) => {
          setQuery(q);
          setLimit(30);
        }}
        placeholder="Buscar nome, telefone ou endereço"
      />
      <p className="list-count">
        {clients.length} contato{clients.length !== 1 ? 's' : ''}
      </p>
      {!clients.length ? (
        <Empty
          icon={Users}
          title={query ? 'Nenhum contato encontrado' : 'Todo serviço começa com uma conexão'}
          action={
            !query && <Button onClick={() => edit({ kind: 'client' })}>Cadastrar cliente</Button>
          }
        >
          {query
            ? 'Experimente outro nome ou telefone.'
            : 'Cadastre seus clientes e tenha os detalhes sempre à mão.'}
        </Empty>
      ) : (
        <div className="list-stack">
          {clients.slice(0, limit).map((client, index) => (
            <article className="client-card" key={client.id}>
              <div className={`avatar tone-${index % 3}`}>
                {client.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="card-main">
                <h3>{client.name}</h3>
                {client.phone && (
                  <p>
                    <Icon icon={Phone} size={13} />
                    {client.phone}
                  </p>
                )}
                {client.address && (
                  <p>
                    <Icon icon={MapPin} size={13} />
                    {client.address}
                  </p>
                )}
                <div className="row-actions">
                  <button onClick={() => edit({ kind: 'client', initial: client })}>
                    Editar contato
                  </button>
                  <button className="danger-text" onClick={() => removeClient(client)}>
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <Limit shown={limit} total={clients.length} more={() => setLimit(limit + 30)} />
    </div>
  );
}
function QuoteCard({ quote, open }: { quote: Quote; open: () => void }) {
  return (
    <button className="quote-card" onClick={open}>
      <div className="card-top">
        <span className="record-code">{quoteNumber(quote.number)}</span>
        <Badge status={quote.status} label={quoteLabels[quote.status]} />
      </div>
      <h3>{quote.title}</h3>
      <p>{quote.clientSnapshot.name}</p>
      <div className="card-bottom">
        <span>{displayDate(quote.date)}</span>
        <strong>
          {money(totals(quote).total)}
          <Icon icon={ChevronRight} size={17} />
        </strong>
      </div>
    </button>
  );
}
export function QuotesPanel({ state, edit, viewQuote }: PanelProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(30);
  const quotes = state.quotes.filter(
    (q) =>
      (filter === 'all' || q.status === filter) &&
      matches(query, q.title, q.clientSnapshot.name, quoteNumber(q.number)),
  );
  return (
    <div className="panel-content">
      <SectionTitle
        eyebrow="PROPOSTAS QUE GERAM CONFIANÇA"
        title="Orçamentos"
        action={
          <Button onClick={() => edit({ kind: 'quote' })}>
            <Icon icon={Plus} size={18} />
            Novo
          </Button>
        }
      />
      <SearchBox
        value={query}
        onChange={(q) => {
          setQuery(q);
          setLimit(30);
        }}
        placeholder="Buscar proposta ou cliente"
      />
      <div className="filter-row" aria-label="Filtrar orçamentos">
        {[['all', 'Todos'], ...Object.entries(quoteLabels)].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? 'active' : ''}
            onClick={() => {
              setFilter(value);
              setLimit(30);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {!quotes.length ? (
        <Empty icon={FileText} title="Nenhuma proposta por aqui">
          {query || filter !== 'all'
            ? 'Mude os filtros para encontrar outras propostas.'
            : 'Crie um orçamento com materiais, mão de obra e condições de execução.'}
        </Empty>
      ) : (
        <div className="list-stack">
          {quotes.slice(0, limit).map((q) => (
            <QuoteCard key={q.id} quote={q} open={() => viewQuote(q.id)} />
          ))}
        </div>
      )}
      <Limit shown={limit} total={quotes.length} more={() => setLimit(limit + 30)} />
    </div>
  );
}
function JobCard({
  job,
  open,
  compact = false,
}: {
  job: Job;
  open: () => void;
  compact?: boolean;
}) {
  return (
    <button className="job-card" onClick={open}>
      <div
        className={`time-block ${job.date < today() && job.status === 'scheduled' ? 'late' : ''}`}
      >
        <strong>{job.time}</strong>
        <span>{job.date === today() ? 'HOJE' : displayDate(job.date).slice(0, 5)}</span>
      </div>
      <div className="card-main">
        <h3>{job.title}</h3>
        <p>{job.clientSnapshot.name}</p>
        {!compact && job.clientSnapshot.address && (
          <p>
            <Icon icon={MapPin} size={13} />
            {job.clientSnapshot.address}
          </p>
        )}
        <Badge status={job.status} label={jobLabels[job.status]} />
      </div>
      <Icon icon={ChevronRight} size={18} />
    </button>
  );
}
export function JobsPanel({ state, edit, viewJob }: PanelProps) {
  const [filter, setFilter] = useState('active');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(30);
  const jobs = state.jobs
    .filter(
      (j) =>
        (filter === 'all' ||
          (filter === 'active'
            ? j.status === 'scheduled' || j.status === 'in_progress'
            : j.status === filter)) &&
        matches(query, j.title, j.clientSnapshot.name),
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <div className="panel-content">
      <SectionTitle
        eyebrow="CADA VISITA NO SEU TEMPO"
        title="Agenda de campo"
        action={
          <Button onClick={() => edit({ kind: 'job' })}>
            <Icon icon={Plus} size={18} />
            Agendar
          </Button>
        }
      />
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar trabalho ou cliente" />
      <div className="filter-row">
        {[
          ['active', 'Em andamento'],
          ['completed', 'Concluídos'],
          ['cancelled', 'Cancelados'],
          ['all', 'Todos'],
        ].map(([v, label]) => (
          <button
            key={v}
            aria-pressed={filter === v}
            className={filter === v ? 'active' : ''}
            onClick={() => {
              setFilter(v);
              setLimit(30);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {jobs.length ? (
        <div className="list-stack">
          {jobs.slice(0, limit).map((j) => (
            <JobCard key={j.id} job={j} open={() => viewJob(j.id)} />
          ))}
        </div>
      ) : (
        <Empty icon={CalendarDays} title="Agenda livre por aqui">
          Agende uma visita ou transforme um orçamento aprovado em trabalho.
        </Empty>
      )}
      <Limit shown={limit} total={jobs.length} more={() => setLimit(limit + 30)} />
    </div>
  );
}
export function CatalogPanel({ state, edit, removeCatalog }: PanelProps) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(30);
  const catalog = state.catalog.filter((c) =>
    matches(query, c.name, c.kind === 'labor' ? 'mão de obra' : 'material'),
  );
  return (
    <div className="panel-content">
      <SectionTitle
        eyebrow="SEU JEITO DE COBRAR"
        title="Serviços e materiais"
        action={
          <Button onClick={() => edit({ kind: 'catalog' })}>
            <Icon icon={Plus} size={18} />
            Novo
          </Button>
        }
      />
      <p className="muted intro">
        Guarde seus itens frequentes e preencha os próximos orçamentos mais rápido.
      </p>
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar serviço ou material" />
      {catalog.length ? (
        <div className="list-stack">
          {catalog.slice(0, limit).map((item) => (
            <article className="catalog-card" key={item.id}>
              <div className={`catalog-icon ${item.kind}`}>
                <Icon icon={item.kind === 'labor' ? Wrench : Package} />
              </div>
              <div className="card-main">
                <h3>{item.name}</h3>
                <p>
                  {item.kind === 'labor' ? 'Mão de obra' : 'Material'} · {money(item.priceCents)} /{' '}
                  {item.unit}
                </p>
                <div className="row-actions">
                  <button onClick={() => edit({ kind: 'catalog', initial: item })}>Editar</button>
                  <button className="danger-text" onClick={() => removeCatalog(item)}>
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty icon={Wrench} title="Sua caixa de ferramentas comercial">
          Cadastre serviços e materiais com seus próprios preços de referência.
        </Empty>
      )}
      <Limit shown={limit} total={catalog.length} more={() => setLimit(limit + 30)} />
    </div>
  );
}
export const navItems = [
  { tab: 'home' as const, label: 'Início', icon: Zap },
  { tab: 'clients' as const, label: 'Clientes', icon: Users },
  { tab: 'quotes' as const, label: 'Orçamentos', icon: FileText },
  { tab: 'jobs' as const, label: 'Agenda', icon: CalendarDays },
  { tab: 'more' as const, label: 'Mais', icon: MoreHorizontal },
];
