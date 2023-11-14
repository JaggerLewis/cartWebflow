const commander = document.querySelector('#jag-cart')
commander.setAttribute("data-toggle", "modal")
commander.setAttribute("data-target", "#cart")

const body = document.querySelector("body");
const modalDiv = document.createElement("div");
modalDiv.setAttribute("id", "cart")
modalDiv.setAttribute("index", "-1")
modalDiv.setAttribute("role", "dialog")
modalDiv.setAttribute("aria-labelledby", "exampleModalLabel")
modalDiv.setAttribute("aria-hidden", "true")
modalDiv.classList.add("modal")
modalDiv.setAttribute("class", "modal fade")

modalDiv.innerHTML = '<div class="global-container"><p class="title">Panier</p><div class="border-container"><div class="container-product"></div></div><div class="container-receipe"><div class="container-sub-reciepe"><p class="reciep-text">Frais D\'activitation</p><p class="reciep-text">5,00&euro;</p></div><div class="container-sub-reciepe"><p class="reciep-text">Livraison</p><p class="reciep-text">GRATUIT</p></div></div><div class="container-total"><p class="total-title">Total</p><p class="total-price">0&euro;</p></div><button id="validate-cart" class="button">Finaliser la commande</button></div>'
body.appendChild(modalDiv)

class Product {
    constructor(name, price, image, prices) {
        this.name = name;
        this.price = price;
        this.image = image;
        this.prices = prices
    }
}

class ProductCart extends Product {
    constructor(product, count) {
        super(product.name, product.price, product.image, product.prices)
        this.count = count;
    }
}

class ShoppingCart {
    constructor() {
        if (localStorage.getItem("shoppingCart")) {
            this.items = JSON.parse(localStorage.getItem("shoppingCart"))
        } else {
            this.items = []
        }
    }

    findItemIndexByName(name) {
        const itemIndex = this.items.findIndex((item) => {
            return item.name === name
        })
        return itemIndex
    }

    addItem(item, count = 1) {
        console.log(item)
        const itemIndex = this.findItemIndexByName(item.name)
        if (itemIndex < 0) {
            const cardProduct = new ProductCart(item, count)
            this.items.push(cardProduct)
        } else {
            this.items[itemIndex].count++
        }
        this.saveCart()
    }

    removeItem(item, count = 1) {
        const itemIndex = this.findItemIndexByName(item.name)
        if (itemIndex < -1) {
            throw new Error();
        }
        this.items.count -= count
        if (this.items.count <= 0) {
            this.clearItem(item);
        }
    }

    setItemCount(item, count) {
        const itemIndex = this.findItemIndexByName(item.name)
        if (itemIndex < -1) {
            throw new Error();
        }
        if (count < 0) {
            throw new Error();
        }
        if (count === 0) {
            this.removeItem(item)
        } else {
            this.items[itemIndex].count = count
        }
    }

    clearItem(item) {
        const itemIndex = this.findItemIndexByName(item.name)
        if (itemIndex < -1) {
            throw new Error();
        }
        this.items.splice(itemIndex, 1)
        this.saveCart()
    }

    countItems() {
        let total = 0
        this.items.forEach(item => {
            total += item.count
        })
        return total
    }

    setTotalPrice() {
        let price = 0;
        this.items.forEach(item => {
            price += item.price * item.count
        })
        const totalSpan = document.querySelector('.total-price')
        totalSpan.innerHTML = price + "&euro;"
    }


    clear() {
        this.items = []
        this.saveCart();
    }

    saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
        let count = 0
        JSON.parse(localStorage.getItem('shoppingCart')).forEach(elem => count += elem.count)
        document.querySelector('.total-count').textContent = count
    }

    getCartStripeUrl() {
        const answer = fetch("https://dev.jagger-tracker.com/stripe/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: this.items, mode: 'payment' })
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

const constructProductList = async () => {
    const products = await getProductsFromStripe()
    const productJSON = await products.json();
    const divProductList = document.getElementsByClassName('product-list')[0];
    for (const product of productJSON) {
        console.log(product)
        let jagjag = document.querySelector('#jag-jag').addEventListener('click', () => shoppingCart.addItem(product.name, product.price, product.image, product.prices))
        let jagjagdock = document.querySelector('#jag-jag-dock').addEventListener('click', () => console.log('ui'))
        let fauve = document.querySelector('#jag-color-fauve').addEventListener('click', () => console.log('ui'))
        let weimar = document.querySelector('#jag-color-weimar').addEventListener('click', () => console.log('ui'))
        let charbon = document.querySelector('#jag-color-charbon').addEventListener('click', () => console.log('ui'))


    }
}
constructProductList()


const addToCart = (event) => {
    event.preventDefault();
    var name = event.target.getAttribute('data-name');
    var price = Number(event.target.getAttribute('data-price'));
    var prices = event.target.getAttribute('data-prices');
    var img = event.target.getAttribute('data-image');
    shoppingCart.addItem(new Product(name, price, img, prices), 1)
}

const redirectToStripe = async (event) => {
    event.preventDefault();
    const apiRes = await shoppingCart.getCartStripeUrl()
    const apiResJson = await apiRes.json()
    window.location.href = apiResJson.url
}

const showCart = document.querySelector('#jag-cart')
showCart.onclick = (event) => {
    event.preventDefault();

    let allProduct = JSON.parse(localStorage.getItem("shoppingCart"))
    allProduct.forEach(prod => {
        let id = JSON.parse(prod.prices)[0].id
        addHtml(prod, id)
        addFunction(prod, id)
    })
    shoppingCart.setTotalPrice();


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
        image.src = prod.image
        image.classList.add('product-pict')
        elemContainer.classList.add('container-product-bis')
        containerProduct.classList.add('container-product')
        containerProduct.id = id
        containerProductText.classList.add('container-product-text')
        name.classList.add('product-name')
        desc.classList.add('product-description')
        price.classList.add('product-price')
        quantityContainer.classList.add('input-group')
        quantityContainer.innerHTML = "<p>qt : " + prod.count + " </p><button class='delete-item btn btn-danger' id=remove-" + id + " > X</button >"
        name.textContent = prod.name
        price.textContent = prod.price
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

const clearCart = document.getElementsByClassName('clear-cart')[0];
clearCart.onclick = (event) => {
    shoppingCart.clear();
}

const goToStripe = document.getElementById("validate-cart");
goToStripe.onclick = (event) => {
    redirectToStripe(event)
}


