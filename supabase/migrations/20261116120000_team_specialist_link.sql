-- A founder or team member who is also a specialist is linked to that specialist profile (site review, 2026-11).
-- The public team card then falls back to the specialist's title, bio and photo, and links to booking a consultation,
-- so the admin keeps those details in one place.

alter table public.team_members
  add column specialist_id uuid unique references public.specialists (id) on delete set null;

create index if not exists team_members_specialist_idx on public.team_members (specialist_id);

-- Link the people who are already in both lists under the same name (case and extra spaces ignored).
update public.team_members t
   set specialist_id = s.id
  from public.specialists s
 where t.specialist_id is null
   and lower(regexp_replace(trim(t.full_name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(s.full_name), '\s+', ' ', 'g'))
   and not exists (select 1 from public.team_members other where other.specialist_id = s.id);
