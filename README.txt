FLORÈ V6 — ADMIN COMPLETA

Aggiunte:
- bottone Elimina ordine
- bottone Segna come completato
- filtro ordini: tutti / oggi / settimana / mese
- totale ordini
- totale incassi
- cancellazione automatica order_items quando elimini un ordine

FILE DA CARICARE SU GITHUB:
- admin.html
- admin.js
- style.css
- supabase-setup.sql

FILE GIÀ ESISTENTI DA TENERE:
- index.html
- script.js
- logo-flore.svg
- portfolio-flore.pdf

SUPABASE:
Esegui tutto il file supabase-setup.sql

NOTA IMPORTANTE:
La cancellazione ordine ora funziona bene perché order_items usa ON DELETE CASCADE.
Quindi quando elimini un ordine dalla dashboard admin, i relativi prodotti vengono rimossi automaticamente.
