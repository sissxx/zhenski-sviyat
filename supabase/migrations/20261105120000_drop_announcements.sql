-- Removes the "Обяви" (announcements) feature. Nothing on the public site ever showed them,
-- and the admin section that managed them is gone. Dropping the table also drops its
-- RLS policies, grants and updated_at trigger. Images uploaded under media/announcements/
-- are left in storage.

drop table if exists public.announcements;
