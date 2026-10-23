-- Studio Amico: email del genitore nella tabella famiglie, per l'area amministrazione.
-- Da eseguire una volta nell'SQL Editor di Supabase.

alter table public.famiglie add column if not exists email text;
create index if not exists famiglie_email on public.famiglie (email);

-- Riempie l'email per le famiglie già iscritte.
update public.famiglie f
set email = u.email
from auth.users u
where u.id = f.id and f.email is null;
