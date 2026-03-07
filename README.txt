Florè V2

Contenuto:
- design più elegante e responsive
- catalogo con immagini fallback
- filtri categoria
- carrello laterale
- checkout
- salvataggio ordine su Supabase

Prima di usare il checkout, esegui su Supabase:

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public insert orders"
on public.orders
for insert
to anon
with check (true);

create policy "Public insert order_items"
on public.order_items
for insert
to anon
with check (true);

Opzionale:
compila il campo image_url nella tabella products per mostrare foto reali.
Se image_url è vuoto, il sistema usa un fallback grafico elegante.
