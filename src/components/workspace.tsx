'use client';

import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ArrowDownToLine,
  ArrowUpRight,
  ArrowUpFromLine,
  Check,
  CheckCheck,
  Copy,
  FileText,
  HardDrive,
  MapPin,
  Package,
  Pencil,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
  X,
  Zap,
  CalendarDays,
  Phone,
} from 'lucide-react';
import {
  AppState,
  Mode,
  Quote,
  Job,
  Client,
  CatalogItem,
  errorMessage,
  money,
  totals,
  quoteNumber,
  displayDate,
  quantityInput,
} from '../domain/model';
import { Command } from '../domain/actions';
import {
  dispatch,
  initializeWorkspace,
  readWorkspace,
  restoreWorkspace,
  subscribeWorkspace,
} from '../data/store';
import { createBackup, readBackup, MAX_BACKUP_BYTES } from '../data/backup';
import { shareFile } from '../lib/files';
import { ClientForm, CatalogForm, ProfileForm } from './contact-form';
import { QuoteForm } from './quote-form';
import { JobForm } from './job-form';
import { Button, Modal, ErrorText, Icon, Badge, quoteLabels, jobLabels, SectionTitle } from './ui';
import {
  HomePanel,
  ClientsPanel,
  QuotesPanel,
  JobsPanel,
  CatalogPanel,
  navItems,
  type Tab,
  type Editor,
  type PanelProps,
} from './panels';

type Confirmation = {
  title: string;
  message: string;
  label: string;
  action: () => Promise<void>;
  danger?: boolean;
};
export default function Workspace() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<Tab>('home');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [dirty, setDirty] = useState(false);
  const [quoteId, setQuoteId] = useState('');
  const [jobId, setJobId] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmError, setConfirmError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState('');
  const main = useRef<HTMLElement>(null);

  function load() {
    return readInitialWorkspace()
      .then(({ saved, chosen }) => {
        setLoadError('');
        if (saved) {
          setMode(chosen);
          setState(saved);
        }
      })
      .catch((error) =>
        setLoadError(
          `Não foi possível abrir seus dados. ${errorMessage(error)} Não limpe o armazenamento do aplicativo.`,
        ),
      )
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!mode) return;
    let active = true;
    const refresh = () => {
      readWorkspace(mode)
        .then((next) => {
          if (active && next)
            setState((previous) =>
              !previous || next.revision >= previous.revision ? next : previous,
            );
        })
        .catch((error) => {
          if (active) setNotice(errorMessage(error));
        });
    };
    const cleanup = subscribeWorkspace(refresh);
    return () => {
      active = false;
      cleanup();
    };
  }, [mode]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = import('@capacitor/app').then(({ App }) =>
      App.addListener('backButton', () => {
        if (document.querySelector('dialog[open]'))
          window.dispatchEvent(new Event('eletropro-back'));
        else if (tab !== 'home') setTab('home');
        else void App.minimizeApp();
      }),
    );
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [tab]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  function navigate(next: Tab) {
    setTab(next);
    main.current?.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openEditor(value: Editor) {
    if ((value.kind === 'quote' || value.kind === 'job') && !state?.clients.length) {
      setNotice('Cadastre um cliente antes de criar um orçamento ou agendar um trabalho.');
      navigate('clients');
      return;
    }
    setDirty(false);
    setQuoteId('');
    setJobId('');
    setEditor(value);
  }
  async function switchMode(next: Mode) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const nextState = await initializeWorkspace(next);
      setState(nextState);
      setMode(next);
      setEditor(null);
      setQuoteId('');
      setJobId('');
      navigate('home');
      try {
        localStorage.setItem('eletropro-mode', next);
      } catch {
        /* O banco continua salvo mesmo se a preferência falhar. */
      }
      if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function save(command: Command) {
    if (!mode) throw new Error('Abra seu espaço de trabalho.');
    const next = await dispatch(mode, command);
    setState(next);
  }
  async function act(command: Command, message: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await save(command);
      setNotice(message);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function confirm(value: Confirmation) {
    setConfirmError('');
    setConfirmation(value);
  }
  async function confirmAction() {
    if (!confirmation || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setConfirmError('');
    try {
      await confirmation.action();
      setConfirmation(null);
    } catch (error) {
      setConfirmError(errorMessage(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function removeClient(client: Client) {
    confirm({
      title: 'Excluir cliente?',
      message: `“${client.name}” será removido. Clientes com orçamentos ou trabalhos vinculados são preservados.`,
      label: 'Excluir cliente',
      danger: true,
      action: async () => {
        await save({ type: 'client.delete', id: client.id, expectedUpdatedAt: client.updatedAt });
        setNotice('Cliente excluído.');
      },
    });
  }
  function removeCatalog(item: CatalogItem) {
    confirm({
      title: 'Excluir item do catálogo?',
      message: `“${item.name}” será removido do catálogo. Os itens já incluídos em orçamentos serão preservados.`,
      label: 'Excluir item',
      danger: true,
      action: async () => {
        await save({ type: 'catalog.delete', id: item.id, expectedUpdatedAt: item.updatedAt });
        setNotice('Item excluído.');
      },
    });
  }
  async function pdf(quote: Quote) {
    if (!state || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const { buildQuotePDF } = await import('../lib/pdf');
      const document = buildQuotePDF(quote, state.profile, mode === 'demo');
      await shareFile(
        document.output('blob'),
        `${quoteNumber(quote.number)}${mode === 'demo' ? '-demo' : ''}.pdf`,
        'Compartilhar orçamento',
      );
      setNotice('PDF preparado. O envio e a aprovação são registrados por você.');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const currentQuote = state?.quotes.find((q) => q.id === quoteId);
  const currentJob = state?.jobs.find((j) => j.id === jobId);
  const modalOpen = !!editor || !!currentQuote || !!currentJob || !!confirmation;

  if (loading || loadError)
    return (
      <div className="startup">
        <Brand />
        <div className="startup-content">
          <div className="startup-symbol">
            <Icon icon={loadError ? HardDrive : Zap} size={36} />
          </div>
          <h1>{loadError ? 'Vamos preservar seus dados.' : 'Conectando seu dia…'}</h1>
          {loadError ? (
            <>
              <ErrorText message={loadError} />
              <Button onClick={() => void load()}>
                <Icon icon={RefreshCw} />
                Tentar novamente
              </Button>
            </>
          ) : (
            <p>Abrindo seu espaço de trabalho.</p>
          )}
        </div>
      </div>
    );
  if (!mode || !state)
    return (
      <div className="welcome">
        <div className="welcome-brand">
          <Brand />
          <span className="version-tag">FEITO PARA O CAMPO</span>
        </div>
        <div className="welcome-copy">
          <div className="welcome-label">
            <span className="pulse-dot" />
            SUA ROTINA, EM OUTRA FASE
          </div>
          <h1>
            Trabalho
            <br />
            bem feito.
            <br />
            <span>
              Negócio
              <br />
              bem cuidado.
            </span>
          </h1>
          <p>Clientes, propostas e serviços na palma da mão. Com ou sem sinal.</p>
          <div className="welcome-benefits">
            <span>
              <Icon icon={FileText} />
              Orçamentos em PDF
            </span>
            <span>
              <Icon icon={ShieldCheck} />
              Dados no aparelho
            </span>
            <span>
              <Icon icon={CalendarDays} />
              Agenda de campo
            </span>
          </div>
          <Button disabled={busy} onClick={() => void switchMode('personal')}>
            Começar meu espaço
            <Icon icon={ArrowUpRight} />
          </Button>
          <Button disabled={busy} variant="ghost" onClick={() => void switchMode('demo')}>
            Explorar demonstração
            <Icon icon={Sparkles} size={18} />
          </Button>
          <p className="welcome-footnote">
            Sem criar conta. A demonstração usa um espaço separado com dados fictícios.
          </p>
        </div>
        <div className="welcome-circuit" aria-hidden="true">
          +<span />+<span />+
        </div>
        {notice && (
          <div className="toast" role="status">
            {notice}
          </div>
        )}
      </div>
    );

  const props: PanelProps = {
    state,
    navigate,
    edit: openEditor,
    viewQuote: setQuoteId,
    viewJob: setJobId,
    removeClient,
    removeCatalog,
  };
  return (
    <div className="app-shell">
      <aside className="desktop-nav" inert={modalOpen}>
        <Brand />
        <p>SEU ESCRITÓRIO DE CAMPO</p>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.tab}
              className={
                tab === item.tab || (tab === 'catalog' && item.tab === 'more') ? 'active' : ''
              }
              onClick={() => navigate(item.tab)}
            >
              <Icon icon={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="nav-bottom">
          <span className="pulse-dot" />
          Funciona sem internet<small>EletroPro · versão 1.0</small>
        </div>
      </aside>
      <div className="app-main" inert={modalOpen}>
        <header className="top-bar">
          <Brand />
          <span className="local-tag">
            <span className="pulse-dot" />
            {mode === 'demo' ? 'DEMONSTRAÇÃO' : 'NO SEU APARELHO'}
          </span>
          <button
            className="profile-button"
            aria-label="Meu perfil profissional"
            onClick={() => openEditor({ kind: 'profile' })}
          >
            <Icon icon={UserRound} size={19} />
          </button>
        </header>
        {mode === 'demo' && (
          <div className="demo-banner">
            <Sparkles size={15} aria-hidden="true" />
            <span>Dados fictícios · explore à vontade</span>
            <button disabled={busy} onClick={() => void switchMode('personal')}>
              Usar meus dados
              <Icon icon={ArrowUpRight} size={14} />
            </button>
          </div>
        )}
        <main ref={main} className="main-scroll" id="main-content">
          {tab === 'home' && <HomePanel {...props} />}
          {tab === 'clients' && <ClientsPanel {...props} />}
          {tab === 'quotes' && <QuotesPanel {...props} />}
          {tab === 'jobs' && <JobsPanel {...props} />}
          {tab === 'catalog' && <CatalogPanel {...props} />}
          {tab === 'more' && (
            <MorePanel
              state={state}
              mode={mode}
              busy={busy}
              navigate={navigate}
              edit={openEditor}
              notify={setNotice}
              confirm={confirm}
              switchMode={switchMode}
              onRestore={setState}
            />
          )}
        </main>
        <nav className="bottom-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              key={item.tab}
              aria-current={
                tab === item.tab || (tab === 'catalog' && item.tab === 'more') ? 'page' : undefined
              }
              className={
                tab === item.tab || (tab === 'catalog' && item.tab === 'more') ? 'active' : ''
              }
              onClick={() => navigate(item.tab)}
            >
              <Icon icon={item.icon} size={21} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {editor && (
        <Modal
          notice={notice}
          title={
            editor.kind === 'client'
              ? editor.initial
                ? 'Editar cliente'
                : 'Novo cliente'
              : editor.kind === 'catalog'
                ? editor.initial
                  ? 'Editar item'
                  : 'Novo item do catálogo'
                : editor.kind === 'profile'
                  ? 'Seu perfil profissional'
                  : editor.kind === 'job'
                    ? editor.initial
                      ? 'Editar trabalho'
                      : 'Agendar trabalho'
                    : editor.duplicate
                      ? 'Duplicar proposta'
                      : editor.initial
                        ? 'Editar rascunho'
                        : 'Novo orçamento'
          }
          subtitle="Preencha no seu ritmo. Salve antes de sair."
          dirty={dirty}
          onClose={() => setEditor(null)}
        >
          {editor.kind === 'client' && (
            <ClientForm
              initial={editor.initial}
              save={save}
              dirty={() => setDirty(true)}
              done={() => {
                setEditor(null);
                setNotice('Cliente salvo.');
              }}
            />
          )}
          {editor.kind === 'catalog' && (
            <CatalogForm
              initial={editor.initial}
              save={save}
              dirty={() => setDirty(true)}
              done={() => {
                setEditor(null);
                setNotice('Item salvo no catálogo.');
              }}
            />
          )}
          {editor.kind === 'profile' && (
            <ProfileForm
              profile={state.profile}
              revision={state.revision}
              save={save}
              dirty={() => setDirty(true)}
              done={() => {
                setEditor(null);
                setNotice('Perfil atualizado.');
              }}
            />
          )}
          {editor.kind === 'quote' && (
            <QuoteForm
              state={state}
              initial={editor.initial}
              duplicate={editor.duplicate}
              save={save}
              dirty={() => setDirty(true)}
              done={() => {
                setEditor(null);
                navigate('quotes');
                setNotice('Rascunho salvo.');
              }}
            />
          )}
          {editor.kind === 'job' && (
            <JobForm
              state={state}
              initial={editor.initial}
              quote={editor.quote}
              save={save}
              dirty={() => setDirty(true)}
              done={() => {
                setEditor(null);
                navigate('jobs');
                setNotice('Trabalho agendado.');
              }}
            />
          )}
        </Modal>
      )}
      {currentQuote && (
        <Modal
          notice={notice}
          title={quoteNumber(currentQuote.number)}
          subtitle={currentQuote.clientSnapshot.name}
          onClose={() => setQuoteId('')}
        >
          <QuoteDetail
            quote={currentQuote}
            busy={busy}
            linked={state.jobs.some((j) => j.quoteId === currentQuote.id)}
            pdf={() => void pdf(currentQuote)}
            edit={() => openEditor({ kind: 'quote', initial: currentQuote })}
            duplicate={() => openEditor({ kind: 'quote', initial: currentQuote, duplicate: true })}
            schedule={() => openEditor({ kind: 'job', quote: currentQuote })}
            status={(status) =>
              confirm({
                title: `Marcar como ${quoteLabels[status].toLowerCase()}?`,
                message:
                  status === 'sent'
                    ? 'Confira o PDF e compartilhe com o cliente. O conteúdo ficará preservado após esta mudança; para alterações posteriores, duplique a proposta.'
                    : 'Este registro é manual. Confirme que o cliente comunicou essa decisão.',
                label: 'Confirmar status',
                action: async () => {
                  await save({
                    type: 'quote.status',
                    id: currentQuote.id,
                    status,
                    expectedUpdatedAt: currentQuote.updatedAt,
                  });
                },
              })
            }
            remove={() =>
              confirm({
                title: 'Excluir orçamento?',
                message:
                  'A proposta será removida deste aparelho. Esta ação não remove PDFs já compartilhados.',
                label: 'Excluir orçamento',
                danger: true,
                action: async () => {
                  await save({
                    type: 'quote.delete',
                    id: currentQuote.id,
                    expectedUpdatedAt: currentQuote.updatedAt,
                  });
                  setQuoteId('');
                },
              })
            }
          />
        </Modal>
      )}
      {currentJob && (
        <Modal
          notice={notice}
          title="Detalhes do trabalho"
          subtitle={currentJob.clientSnapshot.name}
          onClose={() => setJobId('')}
        >
          <JobDetail
            job={currentJob}
            busy={busy}
            edit={() => openEditor({ kind: 'job', initial: currentJob })}
            status={(status) =>
              void act(
                {
                  type: 'job.status',
                  id: currentJob.id,
                  status,
                  expectedUpdatedAt: currentJob.updatedAt,
                },
                'Trabalho atualizado.',
              )
            }
            remove={() =>
              confirm({
                title: 'Excluir trabalho?',
                message:
                  'O registro sairá da agenda. O orçamento vinculado, se houver, será preservado.',
                label: 'Excluir trabalho',
                danger: true,
                action: async () => {
                  await save({
                    type: 'job.delete',
                    id: currentJob.id,
                    expectedUpdatedAt: currentJob.updatedAt,
                  });
                  setJobId('');
                },
              })
            }
          />
        </Modal>
      )}
      {confirmation && (
        <Modal
          notice={notice}
          title={confirmation.title}
          onClose={() => {
            if (!busy) setConfirmation(null);
          }}
        >
          <div className="form-stack">
            <p>{confirmation.message}</p>
            <ErrorText message={confirmError} />
            <Button
              variant={confirmation.danger ? 'danger' : 'primary'}
              disabled={busy}
              onClick={() => void confirmAction()}
            >
              {busy ? 'Aguarde…' : confirmation.label}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirmation(null)}>
              Voltar
            </Button>
          </div>
        </Modal>
      )}
      {notice && !modalOpen && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Fechar aviso">
            <Icon icon={X} size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon icon={Zap} size={22} />
      </span>
      <span>
        Eletro<span className="brand-light">Pro</span>
        <small>GESTÃO QUE CONECTA</small>
      </span>
    </div>
  );
}
function QuoteDetail({
  quote,
  busy,
  linked,
  pdf,
  edit,
  duplicate,
  schedule,
  status,
  remove,
}: {
  quote: Quote;
  busy: boolean;
  linked: boolean;
  pdf: () => void;
  edit: () => void;
  duplicate: () => void;
  schedule: () => void;
  status: (status: Quote['status']) => void;
  remove: () => void;
}) {
  const total = totals(quote);
  return (
    <div className="form-stack">
      <div className="detail-heading">
        <Badge status={quote.status} label={quoteLabels[quote.status]} />
        <h3>{quote.title}</h3>
        <p>
          {displayDate(quote.date)} · Validade de {quote.validityDays} dias
        </p>
      </div>
      {quote.clientSnapshot.address && (
        <p className="detail-address">
          <Icon icon={MapPin} size={17} />
          {quote.clientSnapshot.address}
        </p>
      )}
      <div>
        {quote.items.map((i) => (
          <div className="detail-item" key={i.id}>
            <div>
              <strong>{i.name}</strong>
              <small>
                {i.kind === 'labor' ? 'Mão de obra' : 'Material'} · {quantityInput(i.quantityMilli)}{' '}
                {i.unit} × {money(i.priceCents)}
              </small>
            </div>
            <b>{money(Math.round((i.quantityMilli * i.priceCents) / 1000))}</b>
          </div>
        ))}
      </div>
      <div className="total-card">
        <div className="total-row">
          <span>Mão de obra</span>
          <span>{money(total.labor)}</span>
        </div>
        <div className="total-row">
          <span>Materiais</span>
          <span>{money(total.material)}</span>
        </div>
        {quote.discountCents > 0 && (
          <div className="total-row">
            <span>Desconto</span>
            <span>− {money(quote.discountCents)}</span>
          </div>
        )}
        <div className="total-row">
          <b>Total</b>
          <strong>{money(total.total)}</strong>
        </div>
      </div>
      {quote.notes && (
        <div className="notes-block">
          <h4>Condições e observações</h4>
          <p>{quote.notes}</p>
        </div>
      )}
      <Button disabled={busy} onClick={pdf}>
        <Icon icon={Share2} size={18} />
        Gerar e compartilhar PDF
      </Button>
      <div className="form-grid">
        {quote.status === 'draft' && (
          <>
            <Button variant="secondary" disabled={busy} onClick={edit}>
              <Icon icon={Pencil} size={17} />
              Editar rascunho
            </Button>
            <Button disabled={busy} onClick={() => status('sent')}>
              Marcar enviado
            </Button>
          </>
        )}
        {quote.status === 'sent' && (
          <>
            <Button disabled={busy} onClick={() => status('approved')}>
              <Icon icon={Check} size={17} />
              Aprovado pelo cliente
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => status('declined')}>
              Registrar recusa
            </Button>
          </>
        )}
      </div>
      {quote.status === 'approved' && (
        <Button disabled={busy || linked} onClick={schedule}>
          <Icon icon={CalendarDays} size={18} />
          {linked ? 'Trabalho já vinculado à agenda' : 'Agendar este trabalho'}
        </Button>
      )}
      <Button variant="secondary" disabled={busy} onClick={duplicate}>
        <Icon icon={Copy} size={17} />
        Duplicar como rascunho
      </Button>
      <p className="muted small">
        Os status são atualizados por você. O aplicativo não envia mensagens nem registra aceite
        eletrônico.
      </p>
      <Button variant="ghost" disabled={busy} onClick={remove}>
        <Icon icon={Trash2} size={16} />
        Excluir orçamento
      </Button>
    </div>
  );
}
function JobDetail({
  job,
  busy,
  edit,
  status,
  remove,
}: {
  job: Job;
  busy: boolean;
  edit: () => void;
  status: (status: Job['status']) => void;
  remove: () => void;
}) {
  return (
    <div className="form-stack">
      <div className="detail-heading">
        <Badge status={job.status} label={jobLabels[job.status]} />
        <h3>{job.title}</h3>
        <p>
          {displayDate(job.date)} às {job.time}
        </p>
      </div>
      {job.clientSnapshot.address && (
        <p className="detail-address">
          <Icon icon={MapPin} size={17} />
          {job.clientSnapshot.address}
        </p>
      )}
      {job.clientSnapshot.phone && (
        <p className="detail-address">
          <Icon icon={Phone} size={17} />
          {job.clientSnapshot.phone}
        </p>
      )}
      {job.notes && (
        <div className="notes-block">
          <h4>Anotações de campo</h4>
          <p>{job.notes}</p>
        </div>
      )}
      {job.status === 'scheduled' && (
        <Button disabled={busy} onClick={() => status('in_progress')}>
          <Icon icon={Wrench} size={18} />
          Iniciar trabalho
        </Button>
      )}
      {job.status === 'in_progress' && (
        <Button disabled={busy} onClick={() => status('completed')}>
          <Icon icon={CheckCheck} size={18} />
          Marcar como concluído
        </Button>
      )}
      <Button disabled={busy} variant="secondary" onClick={edit}>
        <Icon icon={Pencil} size={17} />
        Editar informações
      </Button>
      {(job.status === 'scheduled' || job.status === 'in_progress') && (
        <Button disabled={busy} variant="ghost" onClick={() => status('cancelled')}>
          Cancelar trabalho
        </Button>
      )}
      <Button disabled={busy} variant="ghost" onClick={remove}>
        <Icon icon={Trash2} size={16} />
        Excluir registro
      </Button>
    </div>
  );
}

function MorePanel({
  state,
  mode,
  busy,
  navigate,
  edit,
  notify,
  confirm,
  switchMode,
  onRestore,
}: {
  state: AppState;
  mode: Mode;
  busy: boolean;
  navigate: (tab: Tab) => void;
  edit: (editor: Editor) => void;
  notify: (text: string) => void;
  confirm: (value: Confirmation) => void;
  switchMode: (mode: Mode) => Promise<void>;
  onRestore: (state: AppState) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  async function backup() {
    if (working) return;
    setWorking(true);
    try {
      const current = await readWorkspace(mode);
      if (!current) throw new Error('Espaço não encontrado.');
      const json = await createBackup(current, mode);
      await shareFile(
        new Blob([json], { type: 'application/json' }),
        `eletropro-${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
        'Salvar backup do EletroPro',
      );
      notify('Backup preparado. Guarde o arquivo em um local seguro antes de trocar de aparelho.');
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setWorking(false);
    }
  }
  async function restore(file?: File) {
    if (!file || working) return;
    setWorking(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup excede o limite de 10 MB.');
      const parsed = await readBackup(await file.text(), mode);
      const current = await readWorkspace(mode);
      if (!current) throw new Error('Espaço não encontrado.');
      confirm({
        title: 'Restaurar este backup?',
        message: `Backup de ${new Date(parsed.exportedAt).toLocaleString('pt-BR')}: ${parsed.data.clients.length} clientes, ${parsed.data.quotes.length} orçamentos e ${parsed.data.jobs.length} trabalhos. Os dados atuais deste espaço serão substituídos. Exporte um backup atual antes de continuar.`,
        label: 'Substituir e restaurar',
        danger: true,
        action: async () => {
          const restored = await restoreWorkspace(mode, parsed.data, current.revision);
          onRestore(restored);
          notify('Backup restaurado e validado.');
        },
      });
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setWorking(false);
      if (input.current) input.current.value = '';
    }
  }
  return (
    <div className="panel-content">
      <SectionTitle eyebrow="TUDO PRONTO PARA TRABALHAR" title="Sua base de operações" />
      <button className="professional-card" onClick={() => edit({ kind: 'profile' })}>
        <div className="avatar">
          <Icon icon={UserRound} size={26} />
        </div>
        <div>
          <h3>{state.profile.businessName || state.profile.name || 'Complete seu perfil'}</h3>
          <p>Seus dados nos orçamentos em PDF</p>
        </div>
        <Icon icon={Pencil} size={18} />
      </button>
      <button className="menu-card" onClick={() => navigate('catalog')}>
        <div className="menu-icon">
          <Icon icon={Package} />
        </div>
        <div>
          <h3>Serviços e materiais</h3>
          <p>Seu catálogo com preços de referência</p>
        </div>
        <Icon icon={ArrowUpRight} size={19} />
      </button>
      <SectionTitle title="Seus dados, com você" />
      <div className="backup-card">
        <div className="backup-symbol">
          <Icon icon={HardDrive} size={28} />
        </div>
        <h3>Tranquilidade também é ferramenta.</h3>
        <p>
          Os dados ficam neste aparelho. Desinstalar o aplicativo ou limpar seu armazenamento remove
          os registros. Faça backups regularmente e guarde-os fora do aparelho.
        </p>
        <div className="form-grid">
          <Button disabled={working || busy} onClick={() => void backup()}>
            <Icon icon={ArrowUpFromLine} size={17} />
            Exportar backup
          </Button>
          <Button
            variant="secondary"
            disabled={working || busy}
            onClick={() => input.current?.click()}
          >
            <Icon icon={ArrowDownToLine} size={17} />
            Restaurar
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          aria-label="Arquivo de backup"
          onChange={(e) => void restore(e.target.files?.[0])}
        />
        <small>
          O backup contém seus contatos e propostas em arquivo legível. Compartilhe somente com
          pessoas de confiança.
        </small>
      </div>
      <button
        className="menu-card"
        disabled={busy || working}
        onClick={() => void switchMode(mode === 'demo' ? 'personal' : 'demo')}
      >
        <div className="menu-icon lime">
          <Icon icon={Sparkles} />
        </div>
        <div>
          <h3>{mode === 'demo' ? 'Abrir meus dados' : 'Explorar demonstração'}</h3>
          <p>Espaços separados. Seus registros permanecem salvos.</p>
        </div>
        <Icon icon={ArrowUpRight} size={19} />
      </button>
      <div className="about-card">
        <Icon icon={ShieldCheck} size={22} />
        <h3>Projetado para o campo</h3>
        <p>
          Sem conta e sem conexão obrigatória. A aplicação não envia seus registros a um servidor. A
          agenda é um organizador local e não dispara alarmes ou lembretes automáticos.
        </p>
        <p>
          Os preços são definidos por você. Os exemplos são fictícios e não representam uma tabela
          de preços profissional.
        </p>
        <span>EletroPro 1.0 · Alexandre</span>
      </div>
    </div>
  );
}

async function readInitialWorkspace() {
  let preferred: string | null = null;
  try {
    preferred = localStorage.getItem('eletropro-mode');
  } catch {
    /* Apenas uma preferência de interface. */
  }
  const chosen: Mode = preferred === 'demo' ? 'demo' : 'personal';
  return { saved: await readWorkspace(chosen), chosen };
}
