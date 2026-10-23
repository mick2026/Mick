-- Studio Amico: schema iniziale. Da eseguire nell'SQL Editor di Supabase (una volta).
-- Accesso ai dati SOLO dal server con la chiave segreta: RLS attiva e nessuna regola per anon/authenticated.

create table public.famiglie (
  id uuid primary key references auth.users (id) on delete cascade,
  creata timestamptz not null default now(),
  piano text not null default 'prova' check (piano in ('prova', 'abbonato')),
  abbonamento_scade timestamptz,
  consenso_versione text,
  consenso_at timestamptz
);

create table public.profili (
  id uuid primary key default gen_random_uuid(),
  famiglia_id uuid not null references public.famiglie (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 40),
  livello text not null default 'media2',
  lingua text not null default 'it',
  creato timestamptz not null default now()
);
create index profili_famiglia on public.profili (famiglia_id);

create table public.schede (
  id uuid primary key default gen_random_uuid(),
  famiglia_id uuid not null references public.famiglie (id) on delete cascade,
  profilo_id uuid not null references public.profili (id) on delete cascade,
  materia text not null,
  tipo text not null default 'scheda' check (tipo in ('scheda', 'ripasso')),
  titolo text not null,
  creata timestamptz not null default now(),
  aggiornata timestamptz not null default now(),
  riepilogo jsonb not null default '{}'::jsonb,
  dati jsonb not null
);
create index schede_profilo on public.schede (famiglia_id, profilo_id, creata desc);

create table public.utilizzo (
  famiglia_id uuid not null references public.famiglie (id) on delete cascade,
  mese text not null,
  schede integer not null default 0,
  verifiche integer not null default 0,
  primary key (famiglia_id, mese)
);

alter table public.famiglie enable row level security;
alter table public.profili enable row level security;
alter table public.schede enable row level security;
alter table public.utilizzo enable row level security;
revoke all on public.famiglie, public.profili, public.schede, public.utilizzo from anon, authenticated;

-- Scala o restituisce una quota in modo atomico. Restituisce false se il limite è raggiunto.
create or replace function public.consuma_quota(p_famiglia uuid, p_mese text, p_tipo text, p_limite integer, p_delta integer default 1)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  riuscito boolean;
begin
  insert into utilizzo (famiglia_id, mese) values (p_famiglia, p_mese) on conflict do nothing;
  if p_tipo = 'schede' then
    update utilizzo set schede = greatest(0, schede + p_delta)
      where famiglia_id = p_famiglia and mese = p_mese and (p_delta < 0 or schede + p_delta <= p_limite)
      returning true into riuscito;
  elsif p_tipo = 'verifiche' then
    update utilizzo set verifiche = greatest(0, verifiche + p_delta)
      where famiglia_id = p_famiglia and mese = p_mese and (p_delta < 0 or verifiche + p_delta <= p_limite)
      returning true into riuscito;
  else
    raise exception 'tipo di quota non valido: %', p_tipo;
  end if;
  return coalesce(riuscito, false);
end;
$$;

revoke all on function public.consuma_quota(uuid, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consuma_quota(uuid, text, text, integer, integer) to service_role;
