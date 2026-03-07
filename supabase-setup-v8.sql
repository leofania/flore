-- V8 CATEGORIE DINAMICHE

-- 1) Tabella categorie
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- 2) Colonne prodotti
alter table public.products
add column if not exists featured boolean not null default false;

alter table public.products
add column if not exists category_id bigint;

-- 3) Backfill da vecchia colonna category, se serve
insert into public.categories (name, slug, active, sort_order)
values
  ('Bouquet', 'bouquet', true, 1),
  ('Flower box', 'flower-box', true, 2)
on conflict (name) do nothing;

update public.products p
set category_id = c.id
from public.categories c
where p.category_id is null
and (
  lower(coalesce(p.category, '')) = lower(c.name)
  or lower(coalesce(p.category, '')) = c.slug
  or (lower(coalesce(p.category, '')) in ('box', 'flower box', 'flowerbox') and c.slug = 'flower-box')
);

-- 4) Vincolo foreign key
alter table public.products
drop constraint if exists products_category_id_fkey;

alter table public.products
add constraint products_category_id_fkey
foreign key (category_id)
references public.categories(id)
on delete set null;

-- 5) Policies categorie
alter table public.categories enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
on public.categories
for select
to anon
using (true);

drop policy if exists "Authenticated read categories" on public.categories;
create policy "Authenticated read categories"
on public.categories
for select
to authenticated
using (true);

drop policy if exists "Authenticated insert categories" on public.categories;
create policy "Authenticated insert categories"
on public.categories
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated update categories" on public.categories;
create policy "Authenticated update categories"
on public.categories
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated delete categories" on public.categories;
create policy "Authenticated delete categories"
on public.categories
for delete
to authenticated
using (true);

-- 6) Policies prodotti admin
alter table public.products enable row level security;

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
on public.products
for select
to anon
using (true);

drop policy if exists "Authenticated read products" on public.products;
create policy "Authenticated read products"
on public.products
for select
to authenticated
using (true);

drop policy if exists "Authenticated insert products" on public.products;
create policy "Authenticated insert products"
on public.products
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated update products" on public.products;
create policy "Authenticated update products"
on public.products
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated delete products" on public.products;
create policy "Authenticated delete products"
on public.products
for delete
to authenticated
using (true);

-- 7) Storage bucket immagini prodotti
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects
for select
to public
using (bucket_id = 'products');

drop policy if exists "Authenticated upload product images" on storage.objects;
create policy "Authenticated upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'products');

drop policy if exists "Authenticated update product images" on storage.objects;
create policy "Authenticated update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'products')
with check (bucket_id = 'products');

drop policy if exists "Authenticated delete product images" on storage.objects;
create policy "Authenticated delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'products');
