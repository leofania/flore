const supabaseClient = window.supabase.createClient(
  "https://xduzdbrosdljzvbopzwh.supabase.co",
  "sb_publishable_nUldNy4z7YKT_q1jPcZZig_9f5wDGz8"
);

const loginForm = document.getElementById("adminLoginForm");
const ordersList = document.getElementById("ordersList");
const adminStatus = document.getElementById("adminStatus");
const refreshBtn = document.getElementById("adminRefreshBtn");
const logoutBtn = document.getElementById("adminLogoutBtn");
const statOrders = document.getElementById("statOrders");
const statRevenue = document.getElementById("statRevenue");

let currentFilter = "all";
let ordersCache = [];
let itemsCache = [];

function formatPrice(value) {
  return `€${Number(value || 0).toFixed(0)}`;
}

function isSameDay(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function isThisWeek(date) {
  const d = new Date(date);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0,0,0,0);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function isThisMonth(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function applyFilter(orders) {
  if (currentFilter === "today") return orders.filter(o => o.created_at && isSameDay(o.created_at));
  if (currentFilter === "week") return orders.filter(o => o.created_at && isThisWeek(o.created_at));
  if (currentFilter === "month") return orders.filter(o => o.created_at && isThisMonth(o.created_at));
  return orders;
}

function updateStats(orders) {
  statOrders.textContent = orders.length;
  const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  statRevenue.textContent = formatPrice(revenue);
}

function renderOrders() {
  const filteredOrders = applyFilter(ordersCache);
  updateStats(filteredOrders);

  if (!filteredOrders.length) {
    ordersList.innerHTML = "<p class='empty-message'>Nessun ordine presente per questo filtro.</p>";
    return;
  }

  ordersList.innerHTML = "";

  filteredOrders.forEach((order) => {
    const orderItems = itemsCache.filter((row) => row.order_id === order.id);

    const itemsHtml = orderItems.length
      ? orderItems.map((item) => `
          <div class="summary-item-top">
            <div>
              <strong>${item.products?.name || "Prodotto"}</strong>
              <small>Quantità: ${item.quantity}</small>
            </div>
            <strong>${formatPrice(Number(item.unit_price || 0) * Number(item.quantity || 0))}</strong>
          </div>
        `).join("")
      : "<p class='empty-message'>Nessun dettaglio prodotti.</p>";

    const card = document.createElement("article");
    card.className = "order-admin-card";
    card.innerHTML = `
      <div class="order-admin-head">
        <div>
          <h3 style="margin:0 0 6px;">Ordine #${order.id}</h3>
          <span class="admin-chip">${order.status}</span>
        </div>
        <strong>${formatPrice(order.total_amount)}</strong>
      </div>

      <div class="order-meta">
        <div><strong>Cliente:</strong> ${order.customer_name}</div>
        <div><strong>Telefono:</strong> ${order.phone || "-"}</div>
        <div><strong>Data consegna:</strong> ${order.delivery_date || "-"}</div>
        <div><strong>Fascia oraria:</strong> ${order.delivery_time || "-"}</div>
        <div><strong>Indirizzo:</strong> ${order.delivery_address || "-"}</div>
        <div><strong>Messaggio:</strong> ${order.card_message || "-"}</div>
        <div><strong>Creato il:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString("it-IT") : "-"}</div>
      </div>

      <div class="order-items-list">
        ${itemsHtml}
      </div>

      <div class="order-actions">
        <button class="btn btn-secondary" data-complete="${order.id}" type="button">Segna come completato</button>
        <button class="btn btn-danger" data-delete="${order.id}" type="button">Elimina ordine</button>
      </div>
    `;

    ordersList.appendChild(card);
  });
}

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

  const { data: items, error: itemsError } = await supabaseClient
    .from("order_items")
    .select("order_id, quantity, unit_price, products(name)");

  if (itemsError) {
    ordersList.innerHTML = `<p class='empty-message'>Errore: ${itemsError.message}</p>`;
    return;
  }

  ordersCache = orders || [];
  itemsCache = items || [];
  renderOrders();
}

async function markCompleted(orderId) {
  const { error } = await supabaseClient
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId);

  if (error) {
    adminStatus.textContent = `Errore update: ${error.message}`;
    return;
  }

  adminStatus.textContent = `Ordine #${orderId} aggiornato.`;
  loadOrders();
}

async function deleteOrder(orderId) {
  const confirmed = confirm(`Vuoi davvero eliminare l'ordine #${orderId}?`);
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (error) {
    adminStatus.textContent = `Errore delete: ${error.message}`;
    return;
  }

  adminStatus.textContent = `Ordine #${orderId} eliminato.`;
  loadOrders();
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    adminStatus.textContent = `Autenticato come ${data.session.user.email}`;
    loadOrders();
  } else {
    adminStatus.textContent = "Non autenticato.";
    ordersList.innerHTML = "<p class='empty-message'>Effettua il login per vedere gli ordini.</p>";
    statOrders.textContent = "0";
    statRevenue.textContent = "€0";
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
  statOrders.textContent = "0";
  statRevenue.textContent = "€0";
});

document.addEventListener("click", (event) => {
  const completeId = event.target.getAttribute("data-complete");
  const deleteId = event.target.getAttribute("data-delete");

  if (completeId) markCompleted(Number(completeId));
  if (deleteId) deleteOrder(Number(deleteId));
});

document.querySelectorAll("[data-admin-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-admin-filter]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.adminFilter;
    renderOrders();
  });
});

checkSession();
