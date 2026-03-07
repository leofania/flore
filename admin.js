const supabaseClient = window.supabase.createClient(
  "https://xduzdbrosdljzvbopzwh.supabase.co",
  "sb_publishable_nUldNy4z7YKT_q1jPcZZig_9f5wDGz8"
);

const loginForm = document.getElementById("adminLoginForm");
const ordersList = document.getElementById("ordersList");
const adminStatus = document.getElementById("adminStatus");
const refreshBtn = document.getElementById("adminRefreshBtn");
const logoutBtn = document.getElementById("adminLogoutBtn");

async function loadOrders() {
  ordersList.innerHTML = "<p class='empty-message'>Caricamento ordini...</p>";

  const { data: orders, error } = await supabaseClient
    .from("orders")
    .select("id, customer_name, phone, delivery_address, delivery_date, delivery_time, card_message, total_amount, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    ordersList.innerHTML = `<p class='empty-message'>Errore: ${error.message}</p>`;
    return;
  }

  if (!orders || !orders.length) {
    ordersList.innerHTML = "<p class='empty-message'>Nessun ordine presente.</p>";
    return;
  }

  const { data: items, error: itemsError } = await supabaseClient
    .from("order_items")
    .select("order_id, quantity, unit_price, products(name)");

  if (itemsError) {
    ordersList.innerHTML = `<p class='empty-message'>Errore: ${itemsError.message}</p>`;
    return;
  }

  ordersList.innerHTML = "";

  orders.forEach((order) => {
    const orderItems = (items || []).filter((row) => row.order_id === order.id);

    const card = document.createElement("article");
    card.className = "order-admin-card";

    const itemsHtml = orderItems.length
      ? orderItems.map((item) => `
          <div class="summary-item-top">
            <div>
              <strong>${item.products?.name || "Prodotto"}</strong>
              <small>Quantità: ${item.quantity}</small>
            </div>
            <strong>€${Number(item.unit_price * item.quantity).toFixed(0)}</strong>
          </div>
        `).join("")
      : "<p class='empty-message'>Nessun dettaglio prodotti.</p>";

    card.innerHTML = `
      <div class="order-admin-head">
        <div>
          <h3 style="margin:0 0 6px;">Ordine #${order.id}</h3>
          <span class="admin-chip">${order.status}</span>
        </div>
        <strong>€${Number(order.total_amount || 0).toFixed(0)}</strong>
      </div>

      <div class="order-meta">
        <div><strong>Cliente:</strong> ${order.customer_name}</div>
        <div><strong>Telefono:</strong> ${order.phone}</div>
        <div><strong>Data consegna:</strong> ${order.delivery_date || "-"}</div>
        <div><strong>Fascia oraria:</strong> ${order.delivery_time || "-"}</div>
        <div><strong>Indirizzo:</strong> ${order.delivery_address}</div>
        <div><strong>Messaggio:</strong> ${order.card_message || "-"}</div>
      </div>

      <div class="order-items-list">
        ${itemsHtml}
      </div>
    `;

    ordersList.appendChild(card);
  });
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    adminStatus.textContent = `Autenticato come ${data.session.user.email}`;
    loadOrders();
  } else {
    adminStatus.textContent = "Non autenticato.";
    ordersList.innerHTML = "<p class='empty-message'>Effettua il login per vedere gli ordini.</p>";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    adminStatus.textContent = `Errore login: ${error.message}`;
    return;
  }

  adminStatus.textContent = `Autenticato come ${email}`;
  loadOrders();
});

refreshBtn.addEventListener("click", loadOrders);

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  adminStatus.textContent = "Logout effettuato.";
  ordersList.innerHTML = "<p class='empty-message'>Effettua il login per vedere gli ordini.</p>";
});

checkSession();
