FLORÈ V5 — FIX MOBILE + FIX ORDINI

Cosa risolve:
1. Fix gerarchia mobile header/hero
2. Bottoni hero più ordinati su mobile
3. Carrello mobile più compatto
4. Checkout responsive più pulito
5. FIX errore salvataggio ordini RLS

PERCHÉ L'ORDINE NON ANDAVA:
Con l'inserimento classico su orders/order_items e .select(), Supabase richiedeva policy aggiuntive.
Questa versione usa una funzione RPC sicura:
create_public_order(...)
Così l'ordine viene salvato senza esporre lettura anonima delle tabelle ordini.

GITHUB:
Sostituisci:
- index.html
- style.css
- script.js
- supabase-setup.sql

Mantieni anche:
- admin.html
- admin.js
- logo-flore.svg
- portfolio-flore.pdf

SUPABASE:
1) Apri SQL Editor
2) Esegui tutto il file supabase-setup.sql
3) Se compare un warning, conferma

TEST DOPO IL DEPLOY:
- aggiungi prodotto
- compila checkout
- invia ordine
- verifica apertura WhatsApp
- verifica ordine in admin.html dopo login admin
