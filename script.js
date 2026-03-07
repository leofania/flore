// INSERISCI QUI I TUOI DATI SUPABASE
const supabase = window.supabase.createClient(
"YOUR_SUPABASE_PROJECT_URL",
"YOUR_SUPABASE_PUBLISHABLE_KEY"
)

async function loadProducts(){

const { data, error } = await supabase
.from("products")
.select("*")

if(error){
console.error(error)
return
}

const container = document.getElementById("products")

data.forEach(product => {

const card = document.createElement("div")
card.className="card"

card.innerHTML = `
<h3>${product.name}</h3>
<p>${product.description || ""}</p>
<b>€${product.price}</b>
<br><br>
<button onclick="orderProduct('${product.name}')">
Ordina
</button>
`

container.appendChild(card)

})

}

function orderProduct(name){
alert("Hai scelto: " + name)
}

loadProducts()