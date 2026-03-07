const supabaseClient = window.supabase.createClient(
  "https://xduzdbrosdljzvbopzwh.supabase.co",
  "sb_publishable_nUldNy4z7YKT_q1jPcZZig_9f5wDGz8"
);

const FLORE_WHATSAPP = "393888513480";

const productsContainer = document.getElementById("products");
const productsState = document.getElementById("productsState");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const summaryItems = document.getElementById("summaryItems");
const summaryTotal = document.getElementById("summaryTotal");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const toast = document.getElementById("toast");
const checkoutForm = document.getElementById("checkoutForm");
const submitOrderBtn = document.getElementById("submitOrderBtn");
const mobileNav = document.getElementById("mobileNav");
const navToggle = document.getElementById("navToggle");

let products = [];
let activeFilter = "all";
let cart = JSON.parse(localStorage.getItem("flore_cart") || "[]");

function formatPrice(value) {
  return `€${Number(value || 0).toFixed(0)}`;
}

function saveCart() {
  localStorage.setItem("flore_cart", JSON.stringify(cart));
}

function lockBody() {
  document.body.classList.add("no-scroll");
}

function unlockBody() {
  document.body.classList.remove("no-scroll");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  lockBody();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  unlockBody();
}

function toggleMobileNav() {
  mobileNav.classList.toggle("open");
}

function fallbackImage(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#e3c2b8"/>
          <stop offset="52%" stop-color="#cd857b"/>
          <stop offset="100%" stop-color="#b8473f"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <g opacity="0.45" fill="#fff">
        <circle cx="590" cy="150" r="90"/>
        <circle cx="525" cy="250" r="48"/>
        <circle cx="690" cy="260" r="56"/>
        <circle cx="610" cy="360" r="70"/>
      </g>
      <text x="52" y="542" fill="#fff8f6" font-size="34" font-family="Georgia, serif">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function normalizeCategory(category) {
  return (category || "").trim().toLowerCase();
}

function renderProducts() {
  const filtered = activeFilter === "all"
    ? products
    : products.filter((p) => normalizeCategory(p.category) === activeFilter);

  productsContainer.innerHTML = "";

  if (!filtered.length) {
    productsState.textContent = "Nessun prodotto disponibile per questo filtro.";
    productsState.classList.remove("hidden");
    return;
  }

  productsState.classList.add("hidden");

  filtered.forEach((product) => {
    const image = product.image_url || fallbackImage(product.name);
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        <img src="${image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-content">
        <span class="product-category">${product.category || "bouquet"}</span>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description || "Composizione floreale naturale ed elegante."}</p>
        <div class="product-bottom">
          <strong class="product-price">${formatPrice(product.price)}</strong>
          <button class="btn btn-primary" data-add="${product.id}" type="button">Aggiungi</button>
        </div>
      </div>
    `;

    productsContainer.appendChild(card);
  });
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}

function renderCart() {
  cartCount.textContent = getCartCount();
  cartTotal.textContent = formatPrice(getCartTotal());
  summaryTotal.textContent = formatPrice(getCartTotal());

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-message">Non hai ancora aggiunto prodotti.</p>';
    summaryItems.innerHTML = '<p class="empty-message">Il tuo carrello è vuoto.</p>';
    return;
  }

  cartItems.innerHTML = "";
  summaryItems.innerHTML = "";

  cart.forEach((item) => {
    const cartRow = document.createElement("div");
    cartRow.className = "cart-item";
    cartRow.innerHTML = `
      <div class="cart-item-top">
        <div>
          <strong>${item.name}</strong>
          <small>${formatPrice(item.price)} cad.</small>
        </div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
      <div class="cart-actions-inline">
        <button class="qty-button" data-decrease="${item.id}" type="button">−</button>
        <span>${item.quantity}</span>
        <button class="qty-button" data-increase="${item.id}" type="button">+</button>
        <button class="text-button" data-remove="${item.id}" type="button">Rimuovi</button>
      </div>
    `;
    cartItems.appendChild(cartRow);

    const summaryRow = document.createElement("div");
    summaryRow.className = "summary-item";
    summaryRow.innerHTML = `
      <div class="summary-item-top">
        <div>
          <strong>${item.name}</strong>
          <small>Quantità: ${item.quantity}</small>
        </div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
    `;
    summaryItems.appendChild(summaryRow);
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.id === Number(productId));
  if (!product) return;

  const existing = cart.find((item) => item.id === product.id);

  if (existing) existing.quantity += 1;
  else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
  showToast(`${product.name} aggiunto al carrello`);
}

function updateQuantity(productId, delta) {
  const item = cart.find((row) => row.id === Number(productId));
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((row) => row.id !== Number(productId));
  }

  saveCart();
  renderCart();
}

function removeItem(productId) {
  cart = cart.filter((row) => row.id !== Number(productId));
  saveCart();
  renderCart();
}

async function loadProducts() {
  productsState.textContent = "Caricamento prodotti...";

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("active", true)
      .order("id", { ascending: true });

    if (error) {
      productsState.textContent = `Errore Supabase: ${error.message}`;
      return;
    }

    products = data || [];
    renderProducts();
  } catch (e) {
    productsState.textContent = `Errore JS: ${e.message}`;
  }
}

function buildWhatsappUrl(order) {
  const lines = [
    "Ciao Florè, ho appena inviato un ordine dal sito.",
    "",
    `Ordine #${order.id}`,
    `Nome: ${order.customer_name}`,
    `Telefono: ${order.phone}`,
    `Data consegna: ${order.delivery_date}`,
    `Fascia oraria: ${order.delivery_time}`,
    `Indirizzo: ${order.delivery_address}`,
    `Messaggio regalo: ${order.card_message || "-"}`,
    "",
    "Prodotti:"
  ];

  cart.forEach((item) => {
    lines.push(`- ${item.name} x${item.quantity} (${formatPrice(item.price * item.quantity)})`);
  });

  lines.push("", `Totale: ${formatPrice(order.total_amount)}`);

  return `https://wa.me/${FLORE_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}

async function submitOrder(event) {
  event.preventDefault();

  if (!cart.length) {
    showToast("Aggiungi almeno un prodotto al carrello");
    openCart();
    return;
  }

  const customer_name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const delivery_date = document.getElementById("deliveryDate").value;
  const delivery_address = document.getElementById("deliveryAddress").value.trim();
  const delivery_time = document.getElementById("deliveryTime").value;
  const card_message = document.getElementById("cardMessage").value.trim();
  const total_amount = getCartTotal();

  submitOrderBtn.disabled = true;
  submitOrderBtn.textContent = "Invio in corso...";

  try {
    const { data: orderData, error: orderError } = await supabaseClient
      .from("orders")
      .insert([{
        customer_name,
        phone,
        delivery_address,
        delivery_date,
        delivery_time,
        card_message,
        total_amount,
        status: "new"
      }])
      .select();

    if (orderError) throw orderError;

    const orderId = orderData[0].id;

    const itemsPayload = cart.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await supabaseClient
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) throw itemsError;

    const whatsappUrl = buildWhatsappUrl(orderData[0]);

    checkoutForm.reset();
    cart = [];
    saveCart();
    renderCart();
    closeCart();
    showToast("Ordine registrato correttamente");
    window.open(whatsappUrl, "_blank");
    window.location.hash = "#checkout";
  } catch (error) {
    console.error(error);
    alert(`Errore durante il salvataggio ordine: ${error.message}`);
  } finally {
    submitOrderBtn.disabled = false;
    submitOrderBtn.textContent = "Invia ordine";
  }
}

document.addEventListener("click", (event) => {
  const addId = event.target.getAttribute("data-add");
  const increaseId = event.target.getAttribute("data-increase");
  const decreaseId = event.target.getAttribute("data-decrease");
  const removeId = event.target.getAttribute("data-remove");

  if (addId) addToCart(addId);
  if (increaseId) updateQuantity(increaseId, 1);
  if (decreaseId) updateQuantity(decreaseId, -1);
  if (removeId) removeItem(removeId);
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderProducts();
  });
});

document.querySelectorAll(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", () => mobileNav.classList.remove("open"));
});

document.getElementById("openCartBtn").addEventListener("click", openCart);
document.getElementById("openCartBtnSecondary").addEventListener("click", openCart);
document.getElementById("closeCartBtn").addEventListener("click", closeCart);
document.getElementById("goCheckoutBtn").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
navToggle.addEventListener("click", toggleMobileNav);
checkoutForm.addEventListener("submit", submitOrder);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    mobileNav.classList.remove("open");
  }
});

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
document.getElementById("deliveryDate").min = tomorrow.toISOString().split("T")[0];

renderCart();
loadProducts();
