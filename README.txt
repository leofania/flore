FLORÈ V3 — FILE DA CARICARE

Contenuto del pacchetto:
- index.html
- style.css
- script.js
- logo-flore.svg
- supabase-setup.sql

1) GITHUB
Sostituisci nel repo i file:
- index.html
- style.css
- script.js

e aggiungi:
- logo-flore.svg

Fai commit e attendi il deploy di GitHub Pages.

2) SUPABASE
Apri SQL Editor ed esegui il file:
- supabase-setup.sql

Questo abilita:
- lettura pubblica tabella products
- inserimento pubblico tabella orders
- inserimento pubblico tabella order_items
- inserimento pubblico tabella custom_requests

3) TABELLA PRODUCTS
Il sito usa questi campi:
- id
- name
- description
- price
- category
- image_url
- active

Se image_url è vuoto, il sito mostra un visual fallback elegante.
Se active = true, il prodotto compare.

4) COSA È GIÀ RISOLTO
- nuovo design coerente con il brand
- palette aggiornata
- logo integrato
- hero più premium
- portfolio placeholder elegante
- catalogo responsive
- carrello drawer migliorato
- chiusura con overlay / X / ESC
- blocco scroll body mentre il carrello è aperto
- checkout funzionante con Supabase

5) PROSSIMI STEP CONSIGLIATI
- sostituire i portfolio placeholder con foto reali
- compilare image_url per i prodotti
- aggiungere sezione Eventi / Matrimoni separata
- attivare WhatsApp o email post-ordine
- aggiungere pagamento online in futuro
