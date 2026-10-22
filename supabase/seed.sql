-- Local development seed (runs on `supabase db reset`, never in production).
-- Prices are the provisional ones from the spec (8.1) and still need client approval.

insert into public.membership_plans (slug, name, description, price_cents, billing_interval, sort_order) values
  ('beauty-club', 'Клуб „Красота, стил и естетика“', 'Месечен абонамент за клуба.', 800, 'month', 1),
  ('viber-community', 'Затворена Viber общност', 'Месечен абонамент за затворената Viber общност.', 2100, 'month', 2);

insert into public.viber_groups (slug, name, description, sort_order) values
  ('main-community', 'Женски свят — основна група', 'Основната затворена група на общността.', 1),
  ('beauty-club', 'Клуб „Красота, стил и естетика“', 'Група за членовете на клуба.', 2);

insert into public.plan_viber_groups (plan_id, viber_group_id)
select p.id, g.id
from public.membership_plans p
join public.viber_groups g
  on (p.slug = 'viber-community' and g.slug = 'main-community')
  or (p.slug = 'beauty-club' and g.slug = 'beauty-club');

insert into public.consultation_types (slug, name, description, duration_minutes, buffer_minutes, price_cents, requires_prepayment, allow_bank_transfer) values
  ('individual-consultation', 'Индивидуална консултация', 'Примерна услуга за разработка.', 60, 15, 4000, true, true);

insert into public.faqs (question, answer, sort_order, is_published) values
  ('Как да се регистрирам за събитие?', 'Влезте в профила си, отворете събитието и натиснете „Запиши се“.', 1, true);
