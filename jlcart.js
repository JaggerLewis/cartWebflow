const commander = document.querySelector('#jag-cart')
commander.setAttribute("data-toggle", "modal")
commander.setAttribute("data-target", "#cart")

const body = document.querySelector("body");
const modalDiv = document.createElement("div");
modalDiv.setAttribute("id", "cart")
modalDiv.setAttribute("tabindex", "-1")
modalDiv.setAttribute("role", "dialog")
modalDiv.setAttribute("aria-labelledby", "exampleModalLabel")
modalDiv.setAttribute("aria-hidden", "true")
modalDiv.classList.add("modal")
modalDiv.setAttribute("class", "modal fade")

modalDiv.innerHTML = '<div class="modal-dialog modal-lg" role="document"><div class="global-container"><div class="jl-header"><p class="title">Panier</p><p class="close-button" data-dismiss="modal">x</p></div><div class="border-container"><div class="container-product"></div></div><div class="container-receipe"><div class="container-sub-reciepe"><p class="reciep-text">Frais D\'activitation</p><p class="reciep-text">5,00&euro;</p></div><div class="container-sub-reciepe"><p class="reciep-text">Livraison</p><p class="reciep-text">GRATUIT</p></div></div><div class="container-total"><p class="total-title">Total</p><p class="total-price">0&euro;</p></div><button id="validate-cart" class="button" >Finaliser la commande</button></div></div>'
body.appendChild(modalDiv)


const setCartNumber = () => {
    let count = 0
    JSON.parse(localStorage.getItem('shoppingCart')).forEach(elem => count += elem.quantity)
     document.querySelector('#jlCartNumber').textContent = count
}

class Product {
    constructor(name, description, metadata, image, price) {
        this.name = name;
        this.description = description;
        this.metadata = metadata;
        this.image = image;
        this.price = price
    }
}

class ProductCart {
    constructor(id, quantity) {
        this.id = id;
        this.quantity = quantity;
    }

    getProductFromList(products) {
        return products.find((product) => {
            return product.price.id === this.id
        })
    }
}

class ShoppingCart {
    constructor() {
        if (localStorage.getItem("shoppingCart")) {
            let cart = JSON.parse(localStorage.getItem("shoppingCart"))
            this.cart = []
            for (const product of cart) {
                this.cart.push(new ProductCart(product.id, product.quantity))
            }
        } else {
            this.cart = []
        }
    }

    findProductIndexById(id) {
        return this.cart.findIndex((product) => {
            return product.id === id
        })
    }

    addItem(id, count = 1) {
        if (this.countItems() >= 2) {
            alert('vous ne pouvez pas ajouter plus de deux elements au panier')
            return
        }
        const productIndex = this.findProductIndexById(id)
        if (productIndex < 0) {
            const cardProduct = new ProductCart(id, count)
            this.cart.push(cardProduct)
        } else {
            this.cart[productIndex].quantity++
        }
        this.saveCart()
    }

    removeItem(id, count = 1) {
        const productIndex = this.findProductIndexById(id)
        if (productIndex < -1) {
            throw new Error();
        }
        this.cart[productIndex].quantity -= count
        if (this.cart[productIndex].quantity <= 0) {
            this.clearItem(id);
        }
        this.saveCart()
    }

    setItemCount(id, count) {
        const productIndex = this.findProductIndexById(id)
        if (productIndex < -1) {
            throw new Error();
        }
        if (count < 0) {
            throw new Error();
        }
        if (count === 0) {
            this.removeItem(id)
        } else {
            this.cart[productIndex].quantity = count
        }
        this.saveCart()
    }

    clearItem(id) {
        const productIndex = this.findProductIndexById(id)
        if (productIndex < -1) {
            throw new Error();
        }
        this.cart.splice(productIndex, 1)
        this.saveCart()
    }

    countItems() {
        let total = 0
        this.cart.forEach(product => {
            total += product.quantity
        })
        return total
    }

    getTotalPrice() {
        let totalPrice = 0;
        this.cart.forEach((productCart) => {
            totalPrice += productCart.id.price.price * productCart.quantity
        })
        return totalPrice
    }

    setTotalPrice() {
        let price = this.getTotalPrice()
        const totalSpan = document.querySelector('.total-price')
        totalSpan.innerHTML = price + "&euro;"
    }


    clear() {
        this.cart = []
        this.saveCart();
    }

    saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        setCartNumber();
    }

    getCartStripeUrl() {
        console.log('cart =>', this.cart)
        let value = this.cart.map((e) => {return {id : e.id.price.id, quantity : e.quantity}})
        const answer = fetch("https://dev.jagger-tracker.com/stripe/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: value, mode: 'payment' })
        })
        return answer
    }
}

const getProductsFromStripe = async () => {
    const answer = await fetch("https://dev.jagger-tracker.com/stripe/products", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    })
    return answer
}


const shoppingCart = new ShoppingCart();

let products = []
const init = async () => {

    let jlCartNumber = document.createElement('div')
    jlCartNumber.classList.add('jl-cart-number')
    jlCartNumber.id = 'jlCartNumber'
    jlCartNumber.setAttribute("data-toggle", "modal")
    jlCartNumber.setAttribute("data-target", "#cart")
    jlCartNumber.textContent = 0
    document.querySelector('#jag-cart').parentElement.appendChild(jlCartNumber)
    setCartNumber();
    const productsJSON = await (await getProductsFromStripe()).json()
    for (const product of productsJSON) {
        products.push(new Product(product.name, product.description, product.metadata, product.image, product.prices[0]))
    }
    const divProductList = document.getElementsByClassName('product-list')[0];
    let pict = document.querySelector('#w-node-_438be8f3-a333-f580-da31-2066f4127c97-0608d8f7')
    let jagjag = document.querySelector('#jag-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let product = products.find(elem => elem.price.id == pict.getAttribute('data-selected'))
        shoppingCart.addItem(product, 1)
    })
    let jagjagdock = document.querySelector('#jag-jag-dock').addEventListener('click', (event) => {
        event.preventDefault()
        console.log('ui')
    })
    let fauve = document.querySelector('#btn-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        console.log('fauve')

        pict.srcset = products[3].image
        pict.setAttribute('data-selected', products[3].price.id)
        pict.src = products[3].image
    })
    let weimar = document.querySelector('#btn-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        console.log('weimar')
       
        pict.srcset = products[1].image
        pict.setAttribute('data-selected', products[1].price.id)
        pict.src = products[1].image
    })
    let charbon = document.querySelector('#btn-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        console.log('charbon')
       
        pict.srcset = products[5].image
        pict.setAttribute('data-selected', products[5].price.id)
        pict.src = products[5].image
    })
   
    pict.setAttribute('data-selected', products[1].price.id)
    pict.srcset = products[1].image
}

init()

const redirectToStripe = async (event) => {
    event.preventDefault();
    console.log('2')
    const apiRes = await shoppingCart.getCartStripeUrl()
    const apiResJson = await apiRes.json()
    console.log('apiRes =>', apiResJson)
    window.location.href = apiResJson.url
}

const addToCart = (event) => {
    event.preventDefault();
    var name = event.target.getAttribute('data-name');
    var price = Number(event.target.getAttribute('data-price'));
    var prices = event.target.getAttribute('data-prices');
    var img = event.target.getAttribute('data-image');
    shoppingCart.addItem(id, 1)
}


const showCart = (event) => {
    event.preventDefault();
    
    clearHtml()
    shoppingCart.cart.forEach((prod) => {
        let id = prod.id.price.id
        addHtml(prod, id)
        addFunction(prod.id, id)
    })
    shoppingCart.setTotalPrice();

    function clearHtml () {
        document.querySelector('.border-container').innerHTML = '';
    } 

    function addHtml(prod, id) {
        let container = document.querySelector('.border-container')
        let containerProduct = document.createElement('div')
        let containerProductText = document.createElement('div')
        let elemContainer = document.createElement('div')
        let image = document.createElement('img')
        let name = document.createElement('p')
        let desc = document.createElement('p')
        let price = document.createElement('p')
        let quantityContainer = document.createElement('p')
        image.src = prod.id.image
        image.classList.add('product-pict')
        elemContainer.classList.add('container-product-bis')
        containerProduct.classList.add('container-product')
        containerProduct.id = id
        containerProductText.classList.add('container-product-text')
        name.classList.add('product-name')
        desc.classList.add('product-description')
        price.classList.add('product-price')
        quantityContainer.classList.add('jl-input', 'input-groupe')
        quantityContainer.innerHTML = "<p>qt : " + prod.quantity + " </p><button class='delete-item btn btn-danger' id=remove-" + id + " > X</button >"
        name.textContent = prod.id.name
        price.textContent = prod.id.price.price + '€'
        containerProductText.appendChild(name)
        containerProductText.appendChild(desc)
        containerProductText.appendChild(price)
        elemContainer.appendChild(image)
        elemContainer.appendChild(containerProductText)
        containerProduct.appendChild(elemContainer)
        containerProduct.appendChild(quantityContainer)
        container.appendChild(containerProduct)
    }

    function addFunction(prod, id) {
        document.querySelector('#remove-' + id).addEventListener('click', (event) => {
            event.preventDefault()
            document.querySelector('.border-container').removeChild(document.querySelector('#' + id))

            shoppingCart.clearItem(new Product(prod.name, prod.price, prod.img, prod.prices), 1);
            shoppingCart.setTotalPrice();
        })
    }

}

document.querySelector('#jag-cart').addEventListener('click',(event) => showCart(event))
document.querySelector('#jlCartNumber').addEventListener('click',(event) => showCart(event))

const goToStripe = document.getElementById("validate-cart");
goToStripe.onclick = (event) => {
    console.log('1')
    redirectToStripe(event)
}


