
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
const waModal = document.getElementById("waModal");
const waModalLink = document.getElementById("waModalLink");
const waModalClose = document.getElementById("waModalClose");
const waModalOverlay = document.getElementById("waModalOverlay");
const mobileNav = document.getElementById("mobileNav");
const navToggle = document.getElementById("navToggle");
const filtersContainer = document.querySelector(".filters");

const galleryModal = document.getElementById("productGalleryModal");
const galleryOverlay = document.getElementById("productGalleryOverlay");
const galleryClose = document.getElementById("productGalleryClose");
const galleryMainImage = document.getElementById("galleryMainImage");
const galleryThumbs = document.getElementById("galleryThumbs");
const galleryTitle = document.getElementById("galleryProductTitle");
const galleryCounter = document.getElementById("galleryCounter");
const galleryPrev = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");

let products = [];
let productImagesMap = {};
let categories = [];
let activeFilter = "all";
let cart = JSON.parse(localStorage.getItem("flore_cart") || "[]");
let currentGalleryImages = [];
let currentGalleryIndex = 0;
let currentGalleryTitle = "";

function formatPrice(value) { return `€${Number(value || 0).toFixed(0)}`; }
function saveCart() { localStorage.setItem("flore_cart", JSON.stringify(cart)); }
function lockBody() { document.body.classList.add("no-scroll"); }
function unlockBody() { document.body.classList.remove("no-scroll"); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }
function openCart() { cartDrawer.classList.add("open"); cartDrawer.setAttribute("aria-hidden", "false"); lockBody(); }
function closeCart() { cartDrawer.classList.remove("open"); cartDrawer.setAttribute("aria-hidden", "true"); if (!galleryModal?.classList.contains("open") && !waModal?.classList.contains("open")) unlockBody(); }
function toggleMobileNav() { mobileNav.classList.toggle("open"); }
function openWhatsappModal(url) { if (!waModal || !waModalLink) return; waModalLink.href = url; waModal.classList.add("open"); waModal.setAttribute("aria-hidden", "false"); lockBody(); }
function closeWhatsappModal() { if (!waModal) return; waModal.classList.remove("open"); waModal.setAttribute("aria-hidden", "true"); if (!galleryModal?.classList.contains("open") && !cartDrawer?.classList.contains("open")) unlockBody(); }

function fallbackImage(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#e3c2b8"/><stop offset="52%" stop-color="#cd857b"/><stop offset="100%" stop-color="#b8473f"/></linearGradient></defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <g opacity="0.45" fill="#fff"><circle cx="590" cy="150" r="90"/><circle cx="525" cy="250" r="48"/><circle cx="690" cy="260" r="56"/><circle cx="610" cy="360" r="70"/></g>
      <text x="52" y="542" fill="#fff8f6" font-size="34" font-family="Georgia, serif">${label}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getCategoryName(categoryId) {
  const category = categories.find((c) => c.id === categoryId);
  return category?.name || "Prodotto";
}

function getProductImages(product) {
  const gallery = productImagesMap[String(product.id)] || [];
  const urls = [];
  if (product.image_url) urls.push(product.image_url);
  gallery.forEach((item) => { if (item.image_url && !urls.includes(item.image_url)) urls.push(item.image_url); });
  if (!urls.length) urls.push(fallbackImage(product.name));
  return urls;
}

function renderFilters() {
  if (!filtersContainer) return;
  filtersContainer.innerHTML = '<button class="filter-btn active" data-filter="all" type="button">Tutti</button>';
  categories.filter((c) => c.active !== false).forEach((category) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.type = "button";
    btn.dataset.filter = String(category.id);
    btn.textContent = category.name;
    filtersContainer.appendChild(btn);
  });
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderProducts();
    });
  });
}

function renderProducts() {
  const filtered = activeFilter === "all" ? products : products.filter((p) => String(p.category_id) === String(activeFilter));
  productsContainer.innerHTML = "";
  if (!filtered.length) {
    productsState.textContent = "Nessun prodotto disponibile per questo filtro.";
    productsState.classList.remove("hidden");
    return;
  }
  productsState.classList.add("hidden");

  filtered.forEach((product) => {
    const images = getProductImages(product);
    const primary = images[0];
    const secondary = images[1] || images[0];
    const actionHtml = product.active === false
      ? `<button class="btn btn-primary" type="button" disabled>Non disponibile</button>`
      : product.price_on_request
        ? `<a class="btn btn-primary" target="_blank" rel="noreferrer" href="https://wa.me/${FLORE_WHATSAPP}?text=${encodeURIComponent(`Ciao Florè, vorrei ricevere informazioni su: ${product.name}`)}">Richiedi info</a>`
        : `<button class="btn btn-primary" data-add="${product.id}" type="button">Aggiungi</button>`;

    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <div class="product-image-hover">
          <img src="${primary}" alt="${product.name}" class="product-image-primary" loading="lazy">
          <img src="${secondary}" alt="${product.name}" class="product-image-secondary" loading="lazy">
          ${images.length > 1 ? `<span class="product-image-more">+${images.length} foto</span>` : ""}
          <button class="product-gallery-trigger" type="button" data-open-gallery="${product.id}" aria-label="Apri gallery di ${product.name}"></button>
        </div>
      </div>
      <div class="product-content">
        <div class="product-badges">${product.featured ? '<span class="catalog-badge catalog-badge-featured">In evidenza</span>' : ""}${product.price_on_request ? '<span class="catalog-badge catalog-badge-featured">Su richiesta</span>' : ""}${product.active === false ? '<span class="catalog-badge catalog-badge-unavailable">Non disponibile</span>' : ""}</div>
        <span class="product-category">${getCategoryName(product.category_id)}</span>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description || "Composizione floreale naturale ed elegante."}</p>
        <div class="product-bottom">
          <strong class="product-price">${product.price_on_request ? "Su richiesta" : formatPrice(product.price)}</strong>
          ${actionHtml}
        </div>
      </div>`;
    productsContainer.appendChild(card);
  });
}

function openProductGallery(productId) {
  const product = products.find((p) => p.id === Number(productId));
  if (!product || !galleryModal) return;
  currentGalleryImages = getProductImages(product);
  currentGalleryIndex = 0;
  currentGalleryTitle = product.name;
  renderGallery();
  galleryModal.classList.add("open");
  galleryModal.setAttribute("aria-hidden", "false");
  lockBody();
}
function closeProductGallery() { if (!galleryModal) return; galleryModal.classList.remove("open"); galleryModal.setAttribute("aria-hidden", "true"); if (!cartDrawer?.classList.contains("open") && !waModal?.classList.contains("open")) unlockBody(); }
function renderGallery() {
  galleryMainImage.src = currentGalleryImages[currentGalleryIndex];
  galleryMainImage.alt = currentGalleryTitle;
  galleryTitle.textContent = currentGalleryTitle;
  galleryCounter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
  galleryThumbs.innerHTML = "";
  currentGalleryImages.forEach((url, index) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = `${currentGalleryTitle} ${index + 1}`;
    img.className = `gallery-thumb ${index === currentGalleryIndex ? "active" : ""}`;
    img.addEventListener("click", () => { currentGalleryIndex = index; renderGallery(); });
    galleryThumbs.appendChild(img);
  });
}
function galleryNextImage() { if (!currentGalleryImages.length) return; currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length; renderGallery(); }
function galleryPrevImage() { if (!currentGalleryImages.length) return; currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length; renderGallery(); }

function getCartCount() { return cart.reduce((sum, item) => sum + item.quantity, 0); }
function getCartTotal() { return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0); }

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
        <div><strong>${item.name}</strong><small>${formatPrice(item.price)} cad.</small></div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
      <div class="cart-actions-inline">
        <button class="qty-button" data-decrease="${item.id}" type="button">−</button>
        <span>${item.quantity}</span>
        <button class="qty-button" data-increase="${item.id}" type="button">+</button>
        <button class="text-button" data-remove="${item.id}" type="button">Rimuovi</button>
      </div>`;
    cartItems.appendChild(cartRow);

    const summaryRow = document.createElement("div");
    summaryRow.className = "summary-item";
    summaryRow.innerHTML = `
      <div class="summary-item-top">
        <div><strong>${item.name}</strong><small>Quantità: ${item.quantity}</small></div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>`;
    summaryItems.appendChild(summaryRow);
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.id === Number(productId));
  if (!product || product.active === false || product.price_on_request) return;
  const existing = cart.find((item) => item.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, name: product.name, price: Number(product.price), quantity: 1 });
  saveCart();
  renderCart();
  openCart();
  showToast(`${product.name} aggiunto al carrello`);
}
function updateQuantity(productId, delta) {
  const item = cart.find((row) => row.id === Number(productId));
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter((row) => row.id !== Number(productId));
  saveCart();
  renderCart();
}
function removeItem(productId) { cart = cart.filter((row) => row.id !== Number(productId)); saveCart(); renderCart(); }

async function loadCategories() {
  const { data, error } = await supabaseClient.from("categories").select("*").eq("active", true).order("sort_order", { ascending: true }).order("id", { ascending: true });
  if (error) return console.error(error);
  categories = data || [];
  renderFilters();
}

async function loadProductImages() {
  const { data, error } = await supabaseClient.from("product_images").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true });
  if (error) { console.error(error); productImagesMap = {}; return; }
  productImagesMap = {};
  (data || []).forEach((item) => {
    const key = String(item.product_id);
    if (!productImagesMap[key]) productImagesMap[key] = [];
    productImagesMap[key].push(item);
  });
}

async function loadProducts() {
  productsState.textContent = "Caricamento prodotti...";
  try {
    const { data, error } = await supabaseClient.from("products").select("*").eq("active", true).order("sort_order", { ascending: true }).order("featured", { ascending: false }).order("id", { ascending: true });
    if (error) { productsState.textContent = `Errore Supabase: ${error.message}`; return; }
    products = data || [];
    renderProducts();
  } catch (e) {
    productsState.textContent = `Errore JS: ${e.message}`;
  }
}

function buildWhatsappUrl(order) {
  const lines = [
    "Ciao Florè, ho appena inviato un ordine dal sito e vorrei confermarlo.",
    "",
    `Ordine #${order.id}`,
    `Nome: ${order.customer_name}`,
    `Telefono: ${order.phone}`,
    `Data consegna: ${order.delivery_date}`,
    `Fascia oraria: ${order.delivery_time}`,
    `Indirizzo: ${order.delivery_address}`,
    `Messaggio regalo: ${order.card_message || "-"}`,
    "",
    "Prodotti selezionati:"
  ];
  cart.forEach((item) => lines.push(`- ${item.name} x${item.quantity} (${formatPrice(item.price * item.quantity)})`));
  lines.push("", `Totale: ${formatPrice(order.total_amount)}`, "", "Attendo conferma, grazie.");
  return `https://wa.me/${FLORE_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}

async function submitOrder(event) {
  event.preventDefault();
  if (!cart.length) { showToast("Aggiungi almeno un prodotto al carrello"); openCart(); return; }

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
    const { data: orderId, error } = await supabaseClient.rpc("create_public_order", {
      p_customer_name: customer_name,
      p_phone: phone,
      p_delivery_address: delivery_address,
      p_delivery_date: delivery_date,
      p_delivery_time: delivery_time,
      p_card_message: card_message,
      p_total_amount: total_amount,
      p_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity, unit_price: item.price }))
    });
    if (error) throw error;
    const whatsappUrl = buildWhatsappUrl({ id: orderId, customer_name, phone, delivery_address, delivery_date, delivery_time, card_message, total_amount });
    checkoutForm.reset();
    cart = [];
    saveCart();
    renderCart();
    closeCart();
    showToast("Ordine registrato correttamente");
    openWhatsappModal(whatsappUrl);
    setTimeout(() => { window.location.href = whatsappUrl; }, 450);
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
  const galleryId = event.target.getAttribute("data-open-gallery");
  if (addId) addToCart(addId);
  if (increaseId) updateQuantity(increaseId, 1);
  if (decreaseId) updateQuantity(decreaseId, -1);
  if (removeId) removeItem(removeId);
  if (galleryId) openProductGallery(galleryId);
});

document.querySelectorAll(".mobile-nav a").forEach((link) => link.addEventListener("click", () => mobileNav.classList.remove("open")));
document.getElementById("openCartBtn").addEventListener("click", openCart);
document.getElementById("openCartBtnSecondary").addEventListener("click", openCart);
document.getElementById("closeCartBtn").addEventListener("click", closeCart);
document.getElementById("goCheckoutBtn").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
navToggle.addEventListener("click", toggleMobileNav);
checkoutForm.addEventListener("submit", submitOrder);
if (waModalClose) waModalClose.addEventListener("click", closeWhatsappModal);
if (waModalOverlay) waModalOverlay.addEventListener("click", closeWhatsappModal);
if (galleryClose) galleryClose.addEventListener("click", closeProductGallery);
if (galleryOverlay) galleryOverlay.addEventListener("click", closeProductGallery);
if (galleryNext) galleryNext.addEventListener("click", galleryNextImage);
if (galleryPrev) galleryPrev.addEventListener("click", galleryPrevImage);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { closeProductGallery(); closeWhatsappModal(); closeCart(); mobileNav.classList.remove("open"); }
  if (galleryModal?.classList.contains("open")) {
    if (event.key === "ArrowRight") galleryNextImage();
    if (event.key === "ArrowLeft") galleryPrevImage();
  }
});

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
document.getElementById("deliveryDate").min = tomorrow.toISOString().split("T")[0];

renderCart();
(async function init() { await loadCategories(); await loadProductImages(); await loadProducts(); })();
