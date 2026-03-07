const supabaseClient = window.supabase.createClient(
  "https://xduzdbrosdljzvbopzwh.supabase.co",
  "sb_publishable_nUldNy4z7YKT_q1jPcZZig_9f5wDGz8"
);

const loginForm = document.getElementById("categoriesLoginForm");
const refreshBtn = document.getElementById("categoriesRefreshBtn");
const logoutBtn = document.getElementById("categoriesLogoutBtn");
const newCategoryBtn = document.getElementById("newCategoryBtn");
const adminStatus = document.getElementById("categoriesAdminStatus");
const categoriesList = document.getElementById("categoriesList");
const categoryForm = document.getElementById("categoryForm");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");

let categoriesCache = [];

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resetForm() {
  categoryForm.reset();
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryActive").value = "true";
  document.getElementById("categorySortOrder").value = "1";
}

function renderCategories() {
  if (!categoriesCache.length) {
    categoriesList.innerHTML = "<p class='empty-message'>Nessuna categoria presente.</p>";
    return;
  }

  categoriesList.innerHTML = "";
  categoriesCache.forEach((category) => {
    const card = document.createElement("article");
    card.className = "order-admin-card";
    card.innerHTML = `
      <div class="order-admin-head">
        <div>
          <h3 style="margin:0 0 6px;">${category.name}</h3>
          <span class="admin-chip">${category.active ? "attiva" : "non attiva"}</span>
        </div>
        <strong>#${category.sort_order ?? 0}</strong>
      </div>

      <div class="order-meta">
        <div><strong>Slug:</strong> ${category.slug}</div>
      </div>

      <div class="order-actions">
        <button class="btn btn-secondary" data-edit-category="${category.id}" type="button">Modifica</button>
        <button class="btn btn-secondary" data-toggle-category="${category.id}" type="button">${category.active ? "Disattiva" : "Attiva"}</button>
        <button class="btn btn-danger" data-delete-category="${category.id}" type="button">Elimina</button>
      </div>
    `;
    categoriesList.appendChild(card);
  });
}

async function loadCategories() {
  categoriesList.innerHTML = "<p class='empty-message'>Caricamento categorie...</p>";

  const { data, error } = await supabaseClient
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    categoriesList.innerHTML = `<p class='empty-message'>Errore: ${error.message}</p>`;
    return;
  }

  categoriesCache = data || [];
  renderCategories();
}

function fillForm(categoryId) {
  const category = categoriesCache.find((c) => c.id === Number(categoryId));
  if (!category) return;

  document.getElementById("categoryId").value = category.id;
  document.getElementById("categoryName").value = category.name || "";
  document.getElementById("categoryActive").value = category.active ? "true" : "false";
  document.getElementById("categorySortOrder").value = category.sort_order ?? 1;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveCategory(event) {
  event.preventDefault();

  saveCategoryBtn.disabled = true;
  saveCategoryBtn.textContent = "Salvataggio in corso...";

  try {
    const id = document.getElementById("categoryId").value.trim();
    const name = document.getElementById("categoryName").value.trim();
    const active = document.getElementById("categoryActive").value === "true";
    const sort_order = Number(document.getElementById("categorySortOrder").value || 1);
    const slug = slugify(name);

    const payload = { name, slug, active, sort_order };

    let response;
    if (id) {
      response = await supabaseClient.from("categories").update(payload).eq("id", Number(id));
    } else {
      response = await supabaseClient.from("categories").insert([payload]);
    }

    if (response.error) throw response.error;

    adminStatus.textContent = id ? "Categoria aggiornata." : "Categoria creata.";
    resetForm();
    loadCategories();
  } catch (error) {
    adminStatus.textContent = `Errore salvataggio: ${error.message}`;
  } finally {
    saveCategoryBtn.disabled = false;
    saveCategoryBtn.textContent = "Salva categoria";
  }
}

async function toggleCategory(categoryId) {
  const category = categoriesCache.find((c) => c.id === Number(categoryId));
  if (!category) return;

  const { error } = await supabaseClient
    .from("categories")
    .update({ active: !category.active })
    .eq("id", category.id);

  if (error) {
    adminStatus.textContent = `Errore update: ${error.message}`;
    return;
  }

  adminStatus.textContent = "Categoria aggiornata.";
  loadCategories();
}

async function deleteCategory(categoryId) {
  const confirmed = confirm("Vuoi davvero eliminare questa categoria?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("categories")
    .delete()
    .eq("id", Number(categoryId));

  if (error) {
    adminStatus.textContent = `Errore delete: ${error.message}`;
    return;
  }

  adminStatus.textContent = "Categoria eliminata.";
  resetForm();
  loadCategories();
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    adminStatus.textContent = `Autenticato come ${data.session.user.email}`;
    loadCategories();
  } else {
    adminStatus.textContent = "Non autenticato.";
    categoriesList.innerHTML = "<p class='empty-message'>Effettua il login per vedere le categorie.</p>";
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
  loadCategories();
});

refreshBtn.addEventListener("click", loadCategories);
logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  adminStatus.textContent = "Logout effettuato.";
  categoriesList.innerHTML = "<p class='empty-message'>Effettua il login per vedere le categorie.</p>";
});
newCategoryBtn.addEventListener("click", resetForm);
categoryForm.addEventListener("submit", saveCategory);

document.addEventListener("click", (event) => {
  const editId = event.target.getAttribute("data-edit-category");
  const toggleId = event.target.getAttribute("data-toggle-category");
  const deleteId = event.target.getAttribute("data-delete-category");

  if (editId) fillForm(editId);
  if (toggleId) toggleCategory(toggleId);
  if (deleteId) deleteCategory(deleteId);
});

checkSession();
