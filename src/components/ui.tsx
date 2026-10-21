'use client';

import { useEffect, useRef, useId, cloneElement, type ReactElement, type ReactNode } from 'react';
import { X, Search, ArrowUpRight, type LucideIcon } from 'lucide-react';

export function Icon({
  icon: Component,
  size = 20,
  ...props
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button ${variant} ${className}`}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const control = children as ReactElement<{ id?: string; 'aria-describedby'?: string }>;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(control, {
        id,
        'aria-describedby': hint ? `${id}-hint` : undefined,
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <Icon icon={Search} />
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function Empty({
  icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon icon={icon} size={28} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  dirty = false,
  notice,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  dirty?: boolean;
  notice?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    closeRef.current = onClose;
    dirtyRef.current = dirty;
  });
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const close = () => {
      if (
        !dirtyRef.current ||
        window.confirm('Descartar as alterações que ainda não foram salvas?')
      )
        closeRef.current();
    };
    const back = (event: Event) => {
      event.preventDefault();
      close();
    };
    dialog?.addEventListener('cancel', back);
    const nativeBack = () => {
      const open = document.querySelectorAll('dialog[open]');
      if (open[open.length - 1] === dialog) close();
    };
    window.addEventListener('eletropro-back', nativeBack);
    return () => {
      dialog?.removeEventListener('cancel', back);
      window.removeEventListener('eletropro-back', nativeBack);
      dialog?.close();
    };
  }, []);
  function close() {
    if (!dirty || window.confirm('Descartar as alterações que ainda não foram salvas?')) onClose();
  }
  return (
    <dialog ref={ref} className="modal" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" onClick={close} aria-label="Fechar">
          <Icon icon={X} />
        </button>
      </div>
      <div className="modal-body">
        {notice && (
          <p className="modal-notice" role="status">
            {notice}
          </p>
        )}
        {children}
      </div>
    </dialog>
  );
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="error-box">
      {message}
    </p>
  ) : null;
}
export function LinkArrow({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <Icon icon={ArrowUpRight} size={16} />
    </button>
  );
}
export const quoteLabels = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  declined: 'Recusado',
};
export const jobLabels = {
  scheduled: 'Agendado',
  in_progress: 'Em execução',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};
export function Badge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`badge ${status}`}>
      <i />
      {label}
    </span>
  );
}
