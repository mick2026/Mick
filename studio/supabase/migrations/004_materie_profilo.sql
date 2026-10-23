-- Studio Amico: tipo di scuola e materie personalizzate per ogni profilo.
-- Da eseguire una volta nell'SQL Editor di Supabase, PRIMA di pubblicare la versione con le materie.

alter table public.profili add column if not exists scuola text;
alter table public.profili add column if not exists materie jsonb not null default '[]'::jsonb;
