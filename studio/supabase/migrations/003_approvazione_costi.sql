-- Studio Amico: approvazione delle iscrizioni e registro dei costi di Claude.
-- Da eseguire una volta nell'SQL Editor di Supabase.

-- Stato di ogni famiglia: le nuove restano "in_attesa" finché un amministratore non le approva.
alter table public.famiglie add column if not exists stato text not null default 'in_attesa'
  check (stato in ('in_attesa', 'approvata', 'sospesa'));
-- Chi è già iscritto (prima di questa modifica) resta abilitato.
update public.famiglie set stato = 'approvata' where stato = 'in_attesa';

-- Una riga per ogni chiamata a Claude: solo numeri, nessun contenuto.
create table if not exists public.consumi (
  id bigint generated always as identity primary key,
  famiglia_id uuid not null references public.famiglie (id) on delete cascade,
  creato timestamptz not null default now(),
  mese text not null,
  tipo text not null check (tipo in ('scheda', 'ripasso', 'verifica')),
  modello text not null,
  immagini integer not null default 0,
  token_in integer not null default 0,
  token_out integer not null default 0,
  token_cache integer not null default 0,
  costo_usd numeric(12, 6) not null default 0
);
create index if not exists consumi_mese on public.consumi (mese, famiglia_id);

alter table public.consumi enable row level security;
revoke all on public.consumi from anon, authenticated;
