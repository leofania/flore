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
const categorySelect = document.getElementById("productCategory");
const productsSearch = document.getElementById("productsSearch");

let currentFilter = "all";
let currentSearch = "";
let productsCache = [];
let categoriesCache = [];

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

function renderCategoryOptions() {
  if (!categorySelect) return;
  categorySelect.innerHTML = "";
  const activeCategories = categoriesCache.filter((c) => c.active !== false);
  if (!activeCategories.length) {
    categorySelect.innerHTML = '<option value="">Nessuna categoria attiva</option>';
    return;
  }
  activeCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

function resetForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
  document.getElementById("productFeatured").value = "false";
  document.getElementById("productActive").value = "true";
  document.getElementById("productPriceOnRequest").value = "false";
  document.getElementById("productSortOrder").value = "1";
  document.getElementById("productImageUrl").value = "";
  if (categorySelect && categorySelect.options.length) categorySelect.selectedIndex = 0;
}

function applyFilter(products) {
  let filtered = products;
  if (currentFilter === "active") filtered = filtered.filter((p) => p.active === true);
  if (currentFilter === "inactive") filtered = filtered.filter((p) => p.active === false);
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    filtered = filtered.filter((p) => String(p.name || "").toLowerCase().includes(q));
  }
  return filtered;
}

function getCategoryNameById(categoryId) {
  const category = categoriesCache.find((c) => c.id === categoryId);
  return category?.name || "-";
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
        <strong>${product.price_on_request ? "Su richiesta" : formatPrice(product.price)}</strong>
      </div>

      <div class="product-admin-preview">
        <div class="product-admin-image">
          ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : "<span>Nessuna foto</span>"}
        </div>

        <div class="order-meta">
          <div><strong>Categoria:</strong> ${getCategoryNameById(product.category_id)}</div>
          <div><strong>Descrizione:</strong> ${product.description || "-"}</div>
          <div><strong>In evidenza:</strong> ${product.featured ? "Sì" : "No"}</div>
          <div><strong>Prezzo:</strong> ${product.price_on_request ? "Su richiesta" : formatPrice(product.price)}</div>
          <div><strong>Ordine:</strong> ${product.sort_order ?? "-"}</div>
          <div><strong>Slug:</strong> ${product.slug || "-"}</div>
        </div>
      </div>

      <div class="order-actions">
        <button class="btn btn-secondary" data-edit-product="${product.id}" type="button">Modifica</button>
        <button class="btn btn-secondary" data-toggle-product="${product.id}" type="button">${product.active ? "Segna non disponibile" : "Rendi disponibile"}</button>
        <button class="btn btn-secondary" data-duplicate-product="${product.id}" type="button">Duplica</button>
        <button class="btn btn-danger" data-delete-product="${product.id}" type="button">Elimina</button>
      </div>
    `;
    productsList.appendChild(card);
  });
}

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    adminStatus.textContent = `Errore categorie: ${error.message}`;
    return;
  }

  categoriesCache = data || [];
  renderCategoryOptions();
}

async function loadProducts() {
  productsList.innerHTML = "<p class='empty-message'>Caricamento prodotti...</p>";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
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
  document.getElementById("productPrice").value = product.price ?? "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productFeatured").value = product.featured ? "true" : "false";
  document.getElementById("productActive").value = product.active ? "true" : "false";
  document.getElementById("productPriceOnRequest").value = product.price_on_request ? "true" : "false";
  document.getElementById("productSortOrder").value = product.sort_order ?? 1;
  document.getElementById("productImageUrl").value = product.image_url || "";
  if (product.category_id && categorySelect) categorySelect.value = String(product.category_id);
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
    const category_id = Number(document.getElementById("productCategory").value || 0);
    const price_on_request = document.getElementById("productPriceOnRequest").value === "true";
    const rawPrice = document.getElementById("productPrice").value;
    const price = price_on_request ? null : Number(rawPrice || 0);
    const description = document.getElementById("productDescription").value.trim();
    const sort_order = Number(document.getElementById("productSortOrder").value || 1);
    const featured = document.getElementById("productFeatured").value === "true";
    const active = document.getElementById("productActive").value === "true";
    const image_url = await uploadImageIfNeeded();
    const slug = slugify(name);

    const payload = {
      name,
      slug,
      category_id,
      price,
      price_on_request,
      description,
      sort_order,
      featured,
      active,
      image_url
    };

    let response;
    if (id) {
      response = await supabaseClient.from("products").update(payload).eq("id", Number(id));
    } else {
      response = await supabaseClient.from("products").insert([payload]);
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

async function duplicateProduct(productId) {
  const product = productsCache.find((p) => p.id === Number(productId));
  if (!product) return;

  const payload = {
    name: `${product.name} copia`,
    slug: slugify(`${product.name}-copia-${Date.now()}`),
    category_id: product.category_id,
    price: product.price,
    price_on_request: product.price_on_request || false,
    description: product.description,
    sort_order: Number(product.sort_order || 1) + 1,
    featured: false,
    active: false,
    image_url: product.image_url || ""
  };

  const { error } = await supabaseClient.from("products").insert([payload]);
  if (error) {
    adminStatus.textContent = `Errore duplicazione: ${error.message}`;
    return;
  }

  adminStatus.textContent = "Prodotto duplicato.";
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
    await loadCategories();
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
  await loadCategories();
  loadProducts();
});

refreshBtn.addEventListener("click", async () => {
  await loadCategories();
  loadProducts();
});

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
  const duplicateId = event.target.getAttribute("data-duplicate-product");
  const deleteId = event.target.getAttribute("data-delete-product");

  if (editId) fillForm(editId);
  if (toggleId) toggleProduct(toggleId);
  if (duplicateId) duplicateProduct(duplicateId);
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

if (productsSearch) {
  productsSearch.addEventListener("input", (event) => {
    currentSearch = event.target.value;
    renderProducts();
  });
}

checkSession();
