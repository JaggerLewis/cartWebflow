console.log('toto');
alert('test pour alex');
const commander = document.querySelector("#open-cart");
commander.setAttribute("data-toggle", "modal")
commander.setAttribute("data-target", "#cart")

const body = document.querySelector("body");
const stylesheet = document.createElement("style")
// stylesheet.innerHTML = ".global-container {margin: auto;margin-top: 10vh;width: 50vw;padding: 20px;background-color: white;border: 10px solid #ffffff;border-radius: 10px;}@media (max-width: 1000px) {.global-container {    width: 90vw;}}.product-pict {height: 100px;width: 4px;}.trash-pict {height: 10px;width: 10px;margin-bottom: 20%;}.product-pict {margin: auto;width: 69px;height: 69px;border-radius: 7px;}.container-receipe,.container-total {display: flex;padding: 16px 14px 16px 16px;flex-direction: row;align-items: flex-end;justify-content: space-between;}.container-receipe {border-top: 2px solid rgba(0, 0, 0, 0.30);border-bottom: 2px solid rgba(0, 0, 0, 0.30);}.container-product-bis {display: flex;align-items: flex-start;flex-direction: row;justify-content: center;}.container-product {display: flex;padding: 16px 14px 16px 16px;flex-direction: row;align-items: center;justify-content: space-between;border-radius: 15px;border: 2px solid rgba(0, 0, 0, 0.30);background: #FFF;gap: 10px;margin-bottom: 1%;}.reciep-text {color: rgba(0, 0, 0, 0.30);font-family: Source Sans 3;font-style: normal;font-weight: 600;line-height: normal;}.total-title {font-family: Stolzl;font-size: 24px;font-weight: 700;}.tital-price {font-size: 16px;}.product-name {margin-left: 10px;font-family: Stolzl;font-size: 15px;font-weight: 700;}.product-description {margin-left: 10px;font-size: 13px;}.product-price {margin-left: 10px;font-size: 16px;font-weight: 400;}.product-quantity {font-size: 13px;}p {color: #000;font-family: Source Sans 3;font-style: normal;font-weight: 600;line-height: normal;}.button {width: 84%;margin: auto;display: flex;padding: 16px 40px;justify-content: center;align-items: center;gap: 8px;border-radius: 5px;background: #000;color: #FFF;}"
body.appendChild(stylesheet)
const modalDiv = document.createElement("div");
modalDiv.setAttribute("id", "cart")
modalDiv.setAttribute("index", "-1")
modalDiv.setAttribute("role", "dialog")
modalDiv.setAttribute("aria-labelledby", "exampleModalLabel")
modalDiv.setAttribute("aria-hidden", "true")
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

    listItems() {

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
    let done = []
    for (const product of productJSON) {
        console.log(product)
        if (done.includes(product.metadata.productId)) {
            let button = document.createElement('button')
            button.textContent = product.metadata.colorId
            document.querySelector('#block' + product.metadata.productId.replace('.', '-'))
                .appendChild(button)

        } else {
            done.push(product.metadata.productId)
            let divCol = document.createElement('div');
            divCol.classList.add('col')
            let divCard = document.createElement('div');
            divCard.classList.add('card')
            divCard.style = "width: 20rem;"
            let img = document.createElement('img');
            img.id = product.metadata.productId
            img.classList.add('card-img-top')
            img.alt = 'Card image cap'
            img.src = product.image ?? ""
            let divCardBlock = document.createElement('div');
            divCardBlock.classList.add('card-block')
            divCardBlock.id = 'block' + product.metadata.productId.replace('.', '-')
            let title = document.createElement('h4')
            title.classList.add('card-title')
            title.textContent = product.name
            let price = document.createElement('p')
            price.classList.add('card-text')
            price.textContent = product.prices[0].price + product.prices[0].currency
            let button = document.createElement('a')
            button.href = "#button"
            button.setAttribute('data-name', product.name)
            button.setAttribute('data-prices', JSON.stringify(product.prices))
            button.setAttribute('data-price', product.prices[0].price)
            button.setAttribute('data-image', product.image ?? "")
            button.classList.add("add-to-cart", "btn", "btn-primary")
            button.onclick = (event) => {
                addToCart(event)
            }
            button.textContent = "Add to cart"

            divProductList.appendChild(divCol)
            divCol.appendChild(divCard)
            divCard.appendChild(img)
            divCard.appendChild(divCardBlock)
            divCardBlock.appendChild(title)
            divCardBlock.appendChild(price)
            divCardBlock.appendChild(button)
        }

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

const showCart = document.getElementById('open-cart');
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


