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
    if (localStorage.getItem("shoppingCart")) {
        JSON.parse(localStorage.getItem('shoppingCart')).forEach(elem => count += elem.quantity)
    }
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
        console.log('item => ', id)
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
        let value = this.cart.map((e) => {return {id : e.id.price.id, quantity : e.quantity}})
        const answer = fetch("https://api.jagger-tracker.com/stripe/checkout_session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: value, mode: 'payment' })
        })
        return answer
    }
}

const getProductsFromStripe = async () => {
    const answer = await fetch("https://api.jagger-tracker.com/stripe/products", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    })
    return answer
}


const shoppingCart = new ShoppingCart();
const colorButtonAction = (elem, image, id) => {
    elem.srcset = image
    elem.setAttribute('data-selected', id)
    elem.src = image
}

const colorButtonSelect = (newBtn, attribut, Newclass) => {
    let btn = document.querySelector(newBtn)
    let oldBtn = document.querySelector('['+attribut+'=true]')

    if (oldBtn != null) {
    oldBtn.removeAttribute(attribut)
    oldBtn.classList.remove(Newclass)
    }
    btn.classList.add(Newclass)
    btn.setAttribute(attribut, 'true')
}

let products = []

const initHome = async () => {
    
    let collar = document.querySelector('#jl-collar')
    let dock = document.querySelector('#jl-dock')

    document.querySelector('#jag-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let product = products.find(elem => elem.price.id == collar.getAttribute('data-selected'))
        shoppingCart.addItem(product, 1)
    })
    document.querySelector('#jag-jag-dock').addEventListener('click', (event) => {
        event.preventDefault()
        let product = products.find(elem => elem.price.id == dock.getAttribute('data-selected'))
        shoppingCart.addItem(product, 1)
    })
    document.querySelector('#btn-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[14].image, products[14].price.id )
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected')
    })
    document.querySelector('#btn-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[16].image, products[16].price.id )
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected')
    })
    document.querySelector('#btn-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[12].image, products[12].price.id )
        colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected')
    })
    document.querySelector('#btn-dock-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[13].image, products[13].price.id )
        colorButtonSelect('#btn-dock-color-fauve', 'color-dock-selected', 'jl-color-selected')
    })
    document.querySelector('#btn-dock-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[15].image, products[15].price.id )
        colorButtonSelect('#btn-dock-color-weimar', 'color-dock-selected', 'jl-color-selected')
    })
    document.querySelector('#btn-dock-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[11].image, products[11].price.id )
        colorButtonSelect('#btn-dock-color-charbon', 'color-dock-selected', 'jl-color-selected')
    })
   
    collar.setAttribute('data-selected', products[16].price.id)
    collar.srcset = products[16].image
    dock.setAttribute('data-selected', products[15].price.id)
    dock.srcset = products[15].image
}

const initCollar = async ()  => {
    let collar = document.querySelector('#page-jag-collar')
    document.querySelector('#jag-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let color = products.find(elem => elem.price.id == collar.getAttribute('data-selected')).metadata.colorId
        let option = document.querySelector('[hover-selected=true]')
        let productId
        console.log('option =>', option)
        console.log('option =>', color)
        switch (option.id) {
            case 'jl-collar-select-1':
                productId = 'jag'
                break;
            case 'jl-collar-select-2':
                productId = 'jag.smartdock'
                break;
            case 'jl-collar-select-3':
                productId = 'jag-unlimited'
                break;
            case 'jl-collar-select-4':
                productId = 'jag-smartdock-unlimited'
                break;
            default:
        }
        let finalProduct = products.find(elem => elem.metadata.productId == productId && elem.metadata.colorId == color)
        console.log('finalProduct => ',finalProduct)


        // shoppingCart.addItem(product, 1)
    })
    document.querySelector('#page-jag-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[14].image, products[14].price.id )
        colorButtonSelect('#page-jag-color-fauve', 'color-selected', 'jl-color-selected')
        
    })
    document.querySelector('#page-jag-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[16].image, products[16].price.id )
        colorButtonSelect('#page-jag-color-weimar', 'color-selected', 'jl-color-selected')
    })
    document.querySelector('#page-jag-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[12].image, products[12].price.id )
        colorButtonSelect('#page-jag-color-charbon', 'color-selected', 'jl-color-selected')
    })
    document.querySelector('#jl-collar-select-1').addEventListener('click', (event) => {
        let btn = document.querySelector('#jl-collar-select-3')
        colorButtonSelect('#jl-collar-select-1', 'hover-selected', 'jag-solo')
    })
    document.querySelector('#jl-collar-select-2').addEventListener('click', (event) => {
        let btn = document.querySelector('#jl-collar-select-3')
        colorButtonSelect('#jl-collar-select-2', 'hover-selected', 'jag-solo')
    })
    document.querySelector('#jl-collar-select-3').addEventListener('click', (event) => {
        let btn = document.querySelector('#jl-collar-select-3')
        colorButtonSelect('#jl-collar-select-3', 'hover-selected', 'jag-solo')
    })
    document.querySelector('#jl-collar-select-4').addEventListener('click', (event) => {
        let btn = document.querySelector('#jl-collar-select-3')
        colorButtonSelect('#jl-collar-select-4', 'hover-selected', 'jag-solo')
    })
    document.querySelector('#jl-jag-coque-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        console.log('prod => ', products)
        shoppingCart.addItem(products[2], 1)
    })
    document.querySelector('#jl-jag-cable').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[3], 1)
    })
    collar.setAttribute('data-selected', products[16].price.id)
    collar.srcset = products[16].image
}

const initBox = async ()  => {
    document.querySelector('#jl-dock-antenne').addEventListener('click', (event) => {
        event.preventDefault()
        console.log('prod => ', products)
        shoppingCart.addItem(products[4], 1)
    })
    document.querySelector('#jl-dock-cable').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[3], 1)
    })
}

const init = async () => {

    let productsJSON = await (await getProductsFromStripe()).json()
    let jlCartNumber = document.createElement('div')

    for (const product of productsJSON) {
        products.push(new Product(product.name, product.description, product.metadata, product.image, product.prices[0]))
    }
    jlCartNumber.classList.add('jl-cart-number')
    jlCartNumber.id = 'jlCartNumber'
    jlCartNumber.setAttribute("data-toggle", "modal")
    jlCartNumber.setAttribute("data-target", "#cart")
    jlCartNumber.textContent = 0
    jlCartNumber.addEventListener('click',(event) => showCart(event))
    document.querySelector('#jag-cart').parentElement.appendChild(jlCartNumber)
    setCartNumber();
    console.log('productsJSON => ', productsJSON)
    page = window.location.href.split('/')[3];
    switch(page) {
        case '' : 
            initHome()
            break;
        case 'smartdock-jagger-lewis' :
            initBox()
            break;
        case 'jag-collier-gps' :
            initCollar()
            break;
        default : 
            console.log('page')
    }
   
}


const redirectToStripe = async (event) => {
    event.preventDefault();
    if (shoppingCart.countItems() == 0) {
            alert("vous n'avez pas d'article")
            return
        }
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
            console.log('remove => ', prod)
            shoppingCart.clearItem(prod);
            shoppingCart.setTotalPrice();
        })
    }

}
init()

document.querySelector('#jag-cart').addEventListener('click',(event) => showCart(event))

const goToStripe = document.getElementById("validate-cart");
goToStripe.onclick = (event) => {
    redirectToStripe(event)
}


