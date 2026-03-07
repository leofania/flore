const supabaseClient = window.supabase.createClient(
  "https://xduzdbrosdljzvbopzwh.supabase.co",
  "sb_publishable_nUldNy4z7YKT_q1jPcZZig_9f5wDGz8"
);

async function loadProducts() {
  const container = document.getElementById("products");
  container.innerHTML = "<p>Caricamento prodotti...</p>";

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*");

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      container.innerHTML = `<p style="color:red;">Errore Supabase: ${error.message}</p>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = "<p>Nessun prodotto trovato.</p>";
      return;
    }

    container.innerHTML = "";

    data.forEach((product) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description || ""}</p>
        <b>€${product.price}</b>
        <br><br>
        <button onclick="orderProduct('${product.name.replace(/'/g, "\\'")}')">
          Ordina
        </button>
      `;

      container.appendChild(card);
    });
  } catch (e) {
    console.error("ERRORE JS:", e);
    container.innerHTML = `<p style="color:red;">Errore JS: ${e.message}</p>`;
  }
}

function orderProduct(name) {
  alert("Hai scelto: " + name);
}

loadProducts();
