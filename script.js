const supabase = window.supabase.createClient(
"https://xduzdbrosdljzvbopzwh.supabase.co",
"sb_publishable_nUldNy4z7YKT_q1jPcZZig_9f5wDGz8"
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
