'use client';
import { useState, type FormEvent } from 'react';
import { AppState, Job, Quote, today, errorMessage } from '../domain/model';
import { Button, Field, ErrorText } from './ui';
import type { Save } from './contact-form';

export function JobForm({
  state,
  initial,
  quote,
  save,
  done,
  dirty,
}: {
  state: AppState;
  initial?: Job;
  quote?: Quote;
  save: Save;
  done: () => void;
  dirty: () => void;
}) {
  const [clientId, setClientId] = useState(initial?.clientId ?? quote?.clientId ?? '');
  const [title, setTitle] = useState(initial?.title ?? quote?.title ?? '');
  const [date, setDate] = useState(initial?.date ?? today());
  const [time, setTime] = useState(initial?.time ?? '08:00');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await save({
        type: 'job.save',
        value: {
          id: initial?.id ?? crypto.randomUUID(),
          quoteId: initial?.quoteId ?? quote?.id ?? '',
          clientId,
          title,
          date,
          time,
          notes,
          status: initial?.status ?? 'scheduled',
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
    <form className="form-stack" onSubmit={submit} onChange={dirty}>
      <Field label="Cliente">
        <select
          required
          disabled={!!quote || !!initial?.quoteId}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Selecione um cliente</option>
          {state.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Trabalho a realizar">
        <input
          required
          minLength={2}
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Visita para levantamento"
        />
      </Field>
      <div className="form-grid">
        <Field label="Data do trabalho">
          <input
            type="date"
            required
            min="2000-01-01"
            max="2100-12-31"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Horário">
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Anotações do trabalho">
        <textarea
          rows={4}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="O que levar, acesso ao local, pendências…"
        />
      </Field>
      <ErrorText message={error} />
      <Button type="submit" disabled={busy || !state.clients.length} className="wide">
        {busy ? 'Salvando…' : 'Salvar na agenda'}
      </Button>
    </form>
  );
}
