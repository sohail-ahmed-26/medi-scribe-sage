create extension if not exists pg_trgm;
create extension if not exists vector;

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  uses text,
  why_used text,
  potencies text[] default '{}',
  source text,
  fts tsvector generated always as (to_tsvector('english', coalesce(name,'')||' '||coalesce(description,'')||' '||coalesce(uses,'')||' '||coalesce(why_used,''))) stored,
  created_at timestamptz default now()
);
create table public.conditions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  symptoms text[] default '{}',
  source text,
  fts tsvector generated always as (to_tsvector('english', coalesce(name,'')||' '||coalesce(description,''))) stored,
  created_at timestamptz default now()
);
create table public.medicine_conditions (
  medicine_id uuid references public.medicines(id) on delete cascade,
  condition_id uuid references public.conditions(id) on delete cascade,
  notes text,
  primary key (medicine_id, condition_id)
);
create table public.book_chunks (
  id uuid primary key default gen_random_uuid(),
  book text not null,
  page int,
  content text not null,
  embedding vector(384),
  fts tsvector generated always as (to_tsvector('english', content)) stored
);
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null default auth.uid(),
  name text not null,
  age int,
  phone text,
  created_at timestamptz default now()
);
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null default auth.uid(),
  visit_date date not null default current_date,
  symptoms text,
  diagnosis text,
  notes text,
  created_at timestamptz default now()
);
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  doctor_id uuid not null default auth.uid(),
  medicine_name text not null,
  potency text,
  dosage text
);

create index on public.medicines using gin(fts);
create index on public.medicines using gin(name gin_trgm_ops);
create index on public.conditions using gin(fts);
create index on public.conditions using gin(name gin_trgm_ops);
create index on public.book_chunks using gin(fts);

grant select, insert, update, delete on public.medicines, public.conditions, public.medicine_conditions, public.book_chunks, public.patients, public.visits, public.prescriptions to authenticated;
grant all on public.medicines, public.conditions, public.medicine_conditions, public.book_chunks, public.patients, public.visits, public.prescriptions to service_role;

alter table public.medicines enable row level security;
alter table public.conditions enable row level security;
alter table public.medicine_conditions enable row level security;
alter table public.book_chunks enable row level security;
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.prescriptions enable row level security;

create policy "auth all" on public.medicines for all to authenticated using (true) with check (true);
create policy "auth all" on public.conditions for all to authenticated using (true) with check (true);
create policy "auth all" on public.medicine_conditions for all to authenticated using (true) with check (true);
create policy "auth all" on public.book_chunks for all to authenticated using (true) with check (true);
create policy "own" on public.patients for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
create policy "own" on public.visits for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
create policy "own" on public.prescriptions for all to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

create or replace function public.search_medicines(q text)
returns table(id uuid, name text, description text, uses text, why_used text, potencies text[], conditions jsonb, rank real)
language sql stable security invoker set search_path = public as $$
  select m.id, m.name, m.description, m.uses, m.why_used, m.potencies,
    coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'symptoms', c.symptoms, 'notes', mc.notes))
      from medicine_conditions mc join conditions c on c.id = mc.condition_id where mc.medicine_id = m.id), '[]'::jsonb),
    (ts_rank(m.fts, websearch_to_tsquery('english', q)) + similarity(m.name, q))::real as rank
  from medicines m
  where m.fts @@ websearch_to_tsquery('english', q) or m.name % q or m.name ilike '%'||q||'%'
  order by rank desc limit 20
$$;

create or replace function public.search_conditions(q text)
returns table(id uuid, name text, description text, symptoms text[], medicines jsonb, rank real)
language sql stable security invoker set search_path = public as $$
  select c.id, c.name, c.description, c.symptoms,
    coalesce((select jsonb_agg(jsonb_build_object('name', m.name, 'uses', m.uses, 'why_used', m.why_used, 'potencies', m.potencies, 'notes', mc.notes))
      from medicine_conditions mc join medicines m on m.id = mc.medicine_id where mc.condition_id = c.id), '[]'::jsonb),
    (ts_rank(c.fts, websearch_to_tsquery('english', q)) + similarity(c.name, q))::real
  from conditions c
  where c.fts @@ websearch_to_tsquery('english', q) or c.name % q or c.name ilike '%'||q||'%'
     or exists (select 1 from unnest(c.symptoms) s where s ilike '%'||q||'%')
  order by 6 desc limit 20
$$;

create or replace function public.search_chunks(q text)
returns table(book text, page int, snippet text)
language sql stable security invoker set search_path = public as $$
  select book, page, ts_headline('english', content, websearch_to_tsquery('english', q), 'MaxWords=40,MinWords=15')
  from book_chunks where fts @@ websearch_to_tsquery('english', q)
  order by ts_rank(fts, websearch_to_tsquery('english', q)) desc limit 5
$$;

grant execute on function public.search_medicines(text), public.search_conditions(text), public.search_chunks(text) to authenticated;

insert into public.medicines (name, description, uses, why_used, potencies, source) values
('Arnica Montana','Mountain daisy remedy for trauma.','Bruises, injuries, muscle soreness, shock after accidents.','Reduces soreness and swelling from physical trauma.', '{"30C","200C","Mother Tincture 30ml"}','Sample data'),
('Belladonna','Deadly nightshade remedy for sudden intense states.','High fever with flushed face, throbbing headache, sore throat.','Indicated for sudden onset, heat, redness and throbbing.', '{"30C","200C"}','Sample data'),
('Nux Vomica','Poison nut remedy for digestive complaints.','Indigestion, acidity, constipation, hangover.','Suits overindulgence and irritable digestion.', '{"30C","200C"}','Sample data');
insert into public.conditions (name, description, symptoms, source) values
('Fever','Raised body temperature.','{"high temperature","flushed face","chills","headache"}','Sample data'),
('Injury','Physical trauma.','{"bruise","swelling","soreness","pain"}','Sample data'),
('Indigestion','Digestive discomfort.','{"acidity","bloating","nausea","constipation"}','Sample data');
insert into public.medicine_conditions (medicine_id, condition_id, notes)
select m.id, c.id, 'Sample mapping' from medicines m, conditions c
where (m.name,c.name) in (('Belladonna','Fever'),('Arnica Montana','Injury'),('Nux Vomica','Indigestion'));