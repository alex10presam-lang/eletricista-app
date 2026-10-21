'use client';
import { useState, type FormEvent } from 'react';
import {
  Client,
  CatalogItem,
  Profile,
  units,
  parseMoney,
  moneyInput,
  errorMessage,
} from '../domain/model';
import { Command } from '../domain/actions';
import { Button, Field, ErrorText } from './ui';

export type Save = (command: Command) => Promise<void>;
function Submit({ busy, label }: { busy: boolean; label: string }) {
  return (
    <Button type="submit" disabled={busy} className="wide">
      {busy ? 'Salvando…' : label}
    </Button>
  );
}

export function ClientForm({
  initial,
  save,
  done,
  dirty,
}: {
  initial?: Client;
  save: Save;
  done: () => void;
  dirty: () => void;
}) {
  const [value, setValue] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    address: initial?.address ?? '',
    notes: initial?.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (key: keyof typeof value, text: string) => {
    setValue((v) => ({ ...v, [key]: text }));
    dirty();
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await save({
        type: 'client.save',
        value: {
          ...value,
          id: initial?.id ?? crypto.randomUUID(),
          expectedUpdatedAt: initial?.updatedAt,
        },
      });
      done();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <Field label="Nome do cliente">
        <input
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          value={value.name}
          onChange={(e) => change('name', e.target.value)}
          placeholder="Pessoa ou empresa"
        />
      </Field>
      <div className="form-grid">
        <Field label="Telefone / WhatsApp">
          <input
            type="tel"
            maxLength={24}
            autoComplete="tel"
            value={value.phone}
            onChange={(e) => change('phone', e.target.value)}
            placeholder="(92) 99999-9999"
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            maxLength={160}
            autoComplete="email"
            value={value.email}
            onChange={(e) => change('email', e.target.value)}
            placeholder="Opcional"
          />
        </Field>
      </div>
      <Field label="Endereço">
        <textarea
          rows={2}
          maxLength={240}
          autoComplete="street-address"
          value={value.address}
          onChange={(e) => change('address', e.target.value)}
          placeholder="Rua, número, bairro e cidade"
        />
      </Field>
      <Field label="Observações internas" hint="Estas anotações não aparecem no PDF.">
        <textarea
          rows={3}
          maxLength={2000}
          value={value.notes}
          onChange={(e) => change('notes', e.target.value)}
          placeholder="Referência, acesso ao imóvel, preferências…"
        />
      </Field>
      <ErrorText message={error} />
      <Submit busy={busy} label={initial ? 'Salvar cliente' : 'Cadastrar cliente'} />
    </form>
  );
}
export function CatalogForm({
  initial,
  save,
  done,
  dirty,
}: {
  initial?: CatalogItem;
  save: Save;
  done: () => void;
  dirty: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<'labor' | 'material'>(initial?.kind ?? 'labor');
  const [unit, setUnit] = useState<(typeof units)[number]>(initial?.unit ?? 'un');
  const [price, setPrice] = useState(moneyInput(initial?.priceCents ?? 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await save({
        type: 'catalog.save',
        value: {
          id: initial?.id ?? crypto.randomUUID(),
          name,
          kind,
          unit,
          priceCents: parseMoney(price),
          expectedUpdatedAt: initial?.updatedAt,
        },
      });
      done();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} onChange={dirty} className="form-stack">
      <Field label="Nome do serviço ou material">
        <input
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Instalação de luminária"
        />
      </Field>
      <Field label="Categoria">
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="labor">Mão de obra</option>
          <option value="material">Material</option>
        </select>
      </Field>
      <div className="form-grid">
        <Field label="Unidade">
          <select value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
            {units.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Field>
        <Field label="Valor unitário (R$)">
          <input
            required
            inputMode="decimal"
            maxLength={11}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
      </div>
      <p className="muted small">
        Seu preço de referência. Você poderá ajustá-lo em cada orçamento.
      </p>
      <ErrorText message={error} />
      <Submit busy={busy} label="Salvar no catálogo" />
    </form>
  );
}
export function ProfileForm({
  profile,
  revision,
  save,
  done,
  dirty,
}: {
  profile: Profile;
  revision: number;
  save: Save;
  done: () => void;
  dirty: () => void;
}) {
  const [expectedRevision] = useState(revision);
  const [value, setValue] = useState(profile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (key: keyof Profile, text: string) => {
    setValue((v) => ({ ...v, [key]: text }));
    dirty();
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await save({ type: 'profile.save', value, expectedRevision });
      done();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <p className="muted">Essas informações identificam seu trabalho nos orçamentos em PDF.</p>
      <Field label="Nome profissional / empresa">
        <input
          maxLength={100}
          value={value.businessName}
          onChange={(e) => change('businessName', e.target.value)}
          placeholder="Como seus clientes conhecem você"
        />
      </Field>
      <Field label="Seu nome">
        <input
          maxLength={100}
          autoComplete="name"
          value={value.name}
          onChange={(e) => change('name', e.target.value)}
        />
      </Field>
      <Field label="CPF / CNPJ (opcional)">
        <input
          maxLength={24}
          value={value.document}
          onChange={(e) => change('document', e.target.value)}
        />
      </Field>
      <div className="form-grid">
        <Field label="Telefone">
          <input
            type="tel"
            maxLength={24}
            value={value.phone}
            onChange={(e) => change('phone', e.target.value)}
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            maxLength={160}
            value={value.email}
            onChange={(e) => change('email', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Endereço / região de atendimento">
        <input
          maxLength={240}
          value={value.address}
          onChange={(e) => change('address', e.target.value)}
        />
      </Field>
      <ErrorText message={error} />
      <Submit busy={busy} label="Salvar meu perfil" />
    </form>
  );
}
