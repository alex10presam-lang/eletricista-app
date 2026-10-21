'use client';
import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Package, Wrench } from 'lucide-react';
import {
  AppState,
  Quote,
  QuoteItem,
  units,
  today,
  money,
  moneyInput,
  quantityInput,
  parseMoney,
  parseQuantity,
  totals,
  errorMessage,
} from '../domain/model';
import { Button, Field, ErrorText, Icon } from './ui';
import type { Save } from './contact-form';

export function QuoteForm({
  state,
  initial,
  duplicate = false,
  save,
  done,
  dirty,
}: {
  state: AppState;
  initial?: Quote;
  duplicate?: boolean;
  save: Save;
  done: () => void;
  dirty: () => void;
}) {
  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(duplicate ? today() : (initial?.date ?? today()));
  const [days, setDays] = useState(String(initial?.validityDays ?? 15));
  const [items, setItems] = useState<QuoteItem[]>(() =>
    (initial?.items ?? []).map((i) => ({ ...i, id: crypto.randomUUID() })),
  );
  const [discount, setDiscount] = useState(moneyInput(initial?.discountCents ?? 0));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [picker, setPicker] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [item, setItem] = useState({
    name: '',
    kind: 'labor' as QuoteItem['kind'],
    unit: 'un' as QuoteItem['unit'],
    quantity: '1',
    price: '0,00',
  });
  let total: ReturnType<typeof totals> | undefined;
  try {
    total = totals({ items, discountCents: parseMoney(discount) });
  } catch {
    /* O formulário explica o erro ao salvar. */
  }
  function addItem() {
    try {
      if (items.length >= 100) throw new Error('Limite de 100 itens por orçamento.');
      if (item.name.trim().length < 2) throw new Error('Informe o nome do item.');
      setItems((values) => [
        ...values,
        {
          id: crypto.randomUUID(),
          name: item.name.trim(),
          kind: item.kind,
          unit: item.unit,
          quantityMilli: parseQuantity(item.quantity),
          priceCents: parseMoney(item.price),
        },
      ]);
      setItem({ name: '', kind: 'labor', unit: 'un', quantity: '1', price: '0,00' });
      setPicker('');
      setError('');
      dirty();
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  function selectCatalog(id: string) {
    setPicker(id);
    const selected = state.catalog.find((c) => c.id === id);
    if (selected)
      setItem({
        name: selected.name,
        kind: selected.kind,
        unit: selected.unit,
        quantity: '1',
        price: moneyInput(selected.priceCents),
      });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (item.name.trim())
        throw new Error('Há um item em preenchimento. Toque em “Adicionar item” antes de salvar.');
      await save({
        type: 'quote.save',
        value: {
          id: duplicate ? crypto.randomUUID() : (initial?.id ?? crypto.randomUUID()),
          clientId,
          title,
          date,
          validityDays: Number(days),
          items,
          discountCents: parseMoney(discount),
          notes,
          status: 'draft',
          expectedUpdatedAt: duplicate ? undefined : initial?.updatedAt,
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
        <select required value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Selecione um cliente</option>
          {state.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Título do orçamento">
        <input
          required
          minLength={2}
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Reforma elétrica da cozinha"
        />
      </Field>
      <div className="form-grid">
        <Field label="Data de emissão">
          <input
            type="date"
            required
            min="2000-01-01"
            max="2100-12-31"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Validade (dias)">
          <input
            type="number"
            min="1"
            max="365"
            required
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </Field>
      </div>
      <div className="item-builder">
        <h3>Materiais e mão de obra</h3>
        {items.map((i, index) => (
          <div className="quote-item" key={i.id}>
            <Icon icon={i.kind === 'labor' ? Wrench : Package} />
            <div>
              <strong>{i.name}</strong>
              <small>
                {quantityInput(i.quantityMilli)} {i.unit} × {money(i.priceCents)}
              </small>
            </div>
            <b>{money(Math.round((i.quantityMilli * i.priceCents) / 1000))}</b>
            <button
              type="button"
              className="icon-button danger-text"
              aria-label={`Remover item ${index + 1}`}
              onClick={() => {
                setItems(items.filter((item) => item.id !== i.id));
                dirty();
              }}
            >
              <Icon icon={Trash2} size={18} />
            </button>
          </div>
        ))}
        <div className="item-fields">
          {state.catalog.length > 0 && (
            <Field label="Usar item do catálogo">
              <select value={picker} onChange={(e) => selectCatalog(e.target.value)}>
                <option value="">Preencher manualmente</option>
                {state.catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {money(c.priceCents)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Descrição do item">
            <input
              maxLength={120}
              value={item.name}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
              placeholder="Ex.: Instalação de tomada"
            />
          </Field>
          <div className="form-grid">
            <Field label="Tipo de item">
              <select
                value={item.kind}
                onChange={(e) => setItem({ ...item, kind: e.target.value as typeof item.kind })}
              >
                <option value="labor">Mão de obra</option>
                <option value="material">Material</option>
              </select>
            </Field>
            <Field label="Unidade do item">
              <select
                value={item.unit}
                onChange={(e) => setItem({ ...item, unit: e.target.value as typeof item.unit })}
              >
                {units.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Quantidade do item">
              <input
                inputMode="decimal"
                maxLength={8}
                value={item.quantity}
                onChange={(e) => setItem({ ...item, quantity: e.target.value })}
              />
            </Field>
            <Field label="Preço unitário (R$)">
              <input
                inputMode="decimal"
                maxLength={11}
                value={item.price}
                onChange={(e) => setItem({ ...item, price: e.target.value })}
              />
            </Field>
          </div>
          <Button variant="secondary" onClick={addItem}>
            <Icon icon={Plus} size={18} />
            Adicionar item
          </Button>
        </div>
      </div>
      <Field label="Desconto (R$)">
        <input
          required
          inputMode="decimal"
          maxLength={11}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />
      </Field>
      <div className="total-card">
        <span>Total do orçamento</span>
        <strong>{total ? money(total.total) : 'Confira o desconto'}</strong>
        {total && (
          <small>
            Mão de obra {money(total.labor)} · Materiais {money(total.material)}
          </small>
        )}
      </div>
      <Field label="Condições e observações para o cliente">
        <textarea
          rows={4}
          maxLength={6000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Prazo de execução, forma de pagamento e o que está incluído…"
        />
      </Field>
      <ErrorText message={error} />
      <Button type="submit" disabled={busy || !state.clients.length} className="wide">
        {busy ? 'Salvando…' : 'Salvar rascunho'}
      </Button>
    </form>
  );
}
