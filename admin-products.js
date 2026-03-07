const supabaseClient = window.supabase.createClient(
  "https://xduzdbrosdljzvbopzwh.supabase.co",
  "sb_publishable_nUldNy4z7YKT_q1jPcZZig_9f5wDGz8"
);

const STORAGE_BUCKET = "products";

const loginForm = document.getElementById("productsLoginForm");
const refreshBtn = document.getElementById("productsRefreshBtn");
const logoutBtn = document.getElementById("productsLogoutBtn");
const newProductBtn = document.getElementById("newProductBtn");
const adminStatus = document.getElementById("productsAdminStatus");
const productsList = document.getElementById("productsList");
const productForm = document.getElementById("productForm");
const saveProductBtn = document.getElementById("saveProductBtn");

let currentFilter = "all";
let productsCache = [];

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPrice(value) {
  return `€${Number(value || 0).toFixed(0)}`;
}

function resetForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
  document.getElementById("productFeatured").value = "false";
  document.getElementById("productActive").value = "true";
  document.getElementById("productImageUrl").value = "";
}

function applyFilter(products) {
  if (currentFilter === "active") return products.filter((p) => p.active === true);
  if (currentFilter === "inactive") return products.filter((p) => p.active === false);
  return products;
}

function renderProducts() {
  const filtered = applyFilter(productsCache);

  if (!filtered.length) {
    productsList.innerHTML = "<p class='empty-message'>Nessun prodotto presente per questo filtro.</p>";
    return;
  }

  productsList.innerHTML = "";

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "order-admin-card";
    card.innerHTML = `
      <div class="order-admin-head">
        <div>
          <h3 style="margin:0 0 6px;">${product.name}</h3>
          <span class="admin-chip">${product.active ? "disponibile" : "non disponibile"}</span>
        </div>
        <strong>${formatPrice(product.price)}</strong>
      </div>

      <div class="product-admin-preview">
        <div class="product-admin-image">
          ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : "<span>Nessuna foto</span>"}
        </div>

        <div class="order-meta">
          <div><strong>Categoria:</strong> ${product.category || "-"}</div>
          <div><strong>Descrizione:</strong> ${product.description || "-"}</div>
          <div><strong>In evidenza:</strong> ${product.featured ? "Sì" : "No"}</div>
          <div><strong>Slug:</strong> ${product.slug || "-"}</div>
        </div>
      </div>

      <div class="order-actions">
        <button class="btn btn-secondary" data-edit-product="${product.id}" type="button">Modifica</button>
        <button class="btn btn-secondary" data-toggle-product="${product.id}" type="button">${product.active ? "Segna non disponibile" : "Rendi disponibile"}</button>
        <button class="btn btn-danger" data-delete-product="${product.id}" type="button">Elimina</button>
      </div>
    `;
    productsList.appendChild(card);
  });
}

async function loadProducts() {
  productsList.innerHTML = "<p class='empty-message'>Caricamento prodotti...</p>";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    productsList.innerHTML = `<p class='empty-message'>Errore: ${error.message}</p>`;
    return;
  }

  productsCache = data || [];
  renderProducts();
}

function fillForm(productId) {
  const product = productsCache.find((p) => p.id === Number(productId));
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productCategory").value = product.category || "bouquet";
  document.getElementById("productPrice").value = product.price || "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productFeatured").value = product.featured ? "true" : "false";
  document.getElementById("productActive").value = product.active ? "true" : "false";
  document.getElementById("productImageUrl").value = product.image_url || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function uploadImageIfNeeded() {
  const imageInput = document.getElementById("productImage");
  const existingUrl = document.getElementById("productImageUrl").value.trim();

  if (!imageInput.files || !imageInput.files.length) return existingUrl;

  const file = imageInput.files[0];
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `catalog/${fileName}`;

  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function saveProduct(event) {
  event.preventDefault();

  saveProductBtn.disabled = true;
  saveProductBtn.textContent = "Salvataggio in corso...";

  try {
    const id = document.getElementById("productId").value.trim();
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const price = Number(document.getElementById("productPrice").value || 0);
    const description = document.getElementById("productDescription").value.trim();
    const featured = document.getElementById("productFeatured").value === "true";
    const active = document.getElementById("productActive").value === "true";
    const image_url = await uploadImageIfNeeded();
    const slug = slugify(name);

    const payload = {
      name,
      slug,
      category,
      price,
      description,
      featured,
      active,
      image_url
    };

    let response;
    if (id) {
      response = await supabaseClient
        .from("products")
        .update(payload)
        .eq("id", Number(id));
    } else {
      response = await supabaseClient
        .from("products")
        .insert([payload]);
    }

    if (response.error) throw response.error;

    adminStatus.textContent = id ? "Prodotto aggiornato." : "Prodotto creato.";
    resetForm();
    loadProducts();
  } catch (error) {
    adminStatus.textContent = `Errore salvataggio: ${error.message}`;
  } finally {
    saveProductBtn.disabled = false;
    saveProductBtn.textContent = "Salva prodotto";
  }
}

async function toggleProduct(productId) {
  const product = productsCache.find((p) => p.id === Number(productId));
  if (!product) return;

  const { error } = await supabaseClient
    .from("products")
    .update({ active: !product.active })
    .eq("id", product.id);

  if (error) {
    adminStatus.textContent = `Errore update: ${error.message}`;
    return;
  }

  adminStatus.textContent = "Disponibilità aggiornata.";
  loadProducts();
}

async function deleteProduct(productId) {
  const confirmed = confirm("Vuoi davvero eliminare questo prodotto?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", Number(productId));

  if (error) {
    adminStatus.textContent = `Errore delete: ${error.message}`;
    return;
  }

  adminStatus.textContent = "Prodotto eliminato.";
  resetForm();
  loadProducts();
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    adminStatus.textContent = `Autenticato come ${data.session.user.email}`;
    loadProducts();
  } else {
    adminStatus.textContent = "Non autenticato.";
    productsList.innerHTML = "<p class='empty-message'>Effettua il login per vedere i prodotti.</p>";
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
  loadProducts();
});

refreshBtn.addEventListener("click", loadProducts);
logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  adminStatus.textContent = "Logout effettuato.";
  productsList.innerHTML = "<p class='empty-message'>Effettua il login per vedere i prodotti.</p>";
});
newProductBtn.addEventListener("click", resetForm);
productForm.addEventListener("submit", saveProduct);

document.addEventListener("click", (event) => {
  const editId = event.target.getAttribute("data-edit-product");
  const toggleId = event.target.getAttribute("data-toggle-product");
  const deleteId = event.target.getAttribute("data-delete-product");

  if (editId) fillForm(editId);
  if (toggleId) toggleProduct(toggleId);
  if (deleteId) deleteProduct(deleteId);
});

document.querySelectorAll("[data-products-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-products-filter]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.productsFilter;
    renderProducts();
  });
});

checkSession();
