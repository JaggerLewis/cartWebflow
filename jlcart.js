//const commander = document.querySelector('#jag-cart')
//commander.setAttribute("data-toggle", "modal")
//commander.setAttribute("data-target", "#cart")

const interfaceUrl = "https://heyjag.mypet.fit";
const body = document.querySelector("body");
const JL_NavBar = document.getElementById('JL_NavBar')

if (document.querySelector('#jl-aqua-modal')) {
    document.addEventListener('scroll', (event) => document.querySelector('#jl-aqua-modal').style.display = 'none')
}



const modalDiv = document.createElement("div");
modalDiv.setAttribute("id", "cart")
modalDiv.setAttribute("tabindex", "-1")
modalDiv.setAttribute("role", "dialog")
modalDiv.setAttribute("aria-labelledby", "exampleModalLabel")
modalDiv.setAttribute("aria-hidden", "true")
modalDiv.classList.add("modal")
modalDiv.setAttribute("class", "modal fade")
modalDiv.innerHTML = '<div class="modal-dialog modal-lg" role="document"><div class="jl-modal"><div class="jl-header"><p class="title jl-p">Panier</p><img class="close-button hover" data-dismiss="modal" src="https://webcart.jagger-lewis.com/asset/icon_close.png"></img></div><div class="jl-border-container"><div id="jl-no-display" class="jl-no-display">Aucun élément sélectionné</div></div><div class="jl-bottom-container"><p class="jl-p jl-bottom-text">Frais de livraison (Standard)</p><p class=" jl-p jl-bottom-text">5.99€</p></div><div class="jl-container-total"><p class=" jl-p jl-total-title">Total</p><p class="jl-p jl-total-title" id="jl-total">0&euro;</p></div><button id="validate-cart" class="jl-button">Finaliser la commande</button></div></div>'
body.appendChild(modalDiv)


const capitalise = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const getLocalName = (products) => window.location.href.split('/').find((elem) => elem == 'en') ? products.metadata.title_en : products.metadata.title_fr

function displayPrice(price) {
    return price % 1 == 0
        ? price + '.00'
        : (price % 0.1).toFixed(5) == 0
            ? price + '0'
            : '' + price
}

const getRightAbo = (value) => {
    switch (value) {
        case 'premium':
            return 'premium-family';
        case 'family':
            return 'starter-family';
        default:
            return value
    }
}

const getRightLenght = (value) => {
    switch (value) {
        case 'mois':
            return 'monthly';
        case 'annee':
            return 'yearly';
        default:
            return value
    }
}

const setCartNumber = () => {
    if (JL_NavBar) {
        let count = 0
        if (localStorage.getItem("shoppingCart")) {
            JSON.parse(localStorage.getItem('shoppingCart')).forEach(elem => count += elem.quantity)
        }
        document.getElementById('jl-cart-number').textContent = count;
    }

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
            this.orderId = localStorage.getItem("orderId") ?? undefined;
        } else {
            this.cart = []
            this.orderId = undefined;
        }
    }

    findProductIndexById(id) {


        return this.cart.findIndex(product =>
            product.id.price.id === id.price.id
        )
    }

    addItem(id, count = 1) {
        let maxProductinCart = 4
        if (this.countItems() >= maxProductinCart) {
            let labeltocart = getTrad('Vous ne pouvez pas ajouter plus de ' + maxProductinCart + ' articles au panier', "You can't add more than " + maxProductinCart + " products in your cart");
            showAddCart(labeltocart, true)
            return
        }
        let labeltocart = getTrad(id.name + ' ajouté au panier', id.name + ' add to cart');
        showAddCart(labeltocart, false)
        const productIndex = this.findProductIndexById(id)
        if (productIndex < 0) {
            const cardProduct = new ProductCart(id, count)
            this.cart.push(cardProduct)
        } else {
            this.cart[productIndex].quantity++
        }
        this.saveCart({ event: { type: "addItem", id: id, count: count } })
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
        this.saveCart({ event: { type: "removeItem", id: id, count: count } })
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
        this.saveCart({ event: { type: "setItem", id: id, count: count } })
    }

    clearItem(id) {
        const productIndex = this.findProductIndexById(id)
        if (productIndex < -1) {
            throw new Error();
        }
        this.cart.splice(productIndex, 1)
        this.saveCart({ event: { type: "clearItem", id: id } })
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
        let price = this.getTotalPrice() + 5.99
        //const totalSpan = document.querySelector('#jl-total')
        const totalSpan = document.getElementById('JL_Basket_Total_Amount');
        totalSpan.innerHTML = price.toFixed(2) + " &euro;"
        return price.toFixed(2);
    }


    clear() {
        this.cart = []
        //this.saveCart({ event: { type: "clearCart", id: id, count: count } });
    }

    saveCart({ callApi = true, event } = {}) {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        setCartNumber();
        if (callApi) {
            this.updateCartInDb({ event }).then(answer => {
                answer.json().then(answerJson => {
                    if (answerJson.success) {
                        this.orderId = answerJson.orderId
                        localStorage.setItem('orderId', this.orderId)
                    }
                }).catch(e => {
                    console.error("error parsing", e);
                })
            }).catch(e => {
                console.error("error fetching", e)
            })
        }
    }

    getCartStripeUrl() {
        const url = window.location.origin + window.location.pathname;
        let value = this.cart.map((e) => { return { id: e.id.price.id, quantity: e.quantity } })
        const answer = fetch(`${interfaceUrl}/stripe/checkout_session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: value, orderId: this.orderId, mode: 'payment', referer: url })
        })
        return answer
    }

    updateCartInDb({ event } = {}) {
        try {
            const answer = fetch(`${interfaceUrl}/stripe/cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart: this.cart,
                    orderId: this.orderId,
                    event: event,
                })
            })
            return answer
        }
        catch (e) {
            console.log(e)
            return true
        }
    }
}

const getProductsFromStripe = async () => {
    try {
        const answer = await fetch(`${interfaceUrl}/stripe/products`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })
        return answer
    }
    catch (e) {
        return await setTimeout(async () => {
            return await getProductsFromStripe()
        }, "1000");
    }
}

const getAbonnementFromStripe = async () => {
    const answer = await fetch(`${interfaceUrl}/stripe/products/category/subscription`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    })
    return answer
}

const shoppingCart = new ShoppingCart();

const colorButtonAction = (elem, image, id) => {
    //elem.srcset = image
    elem.setAttribute('data-selected', id)
    elem.src = image
}

const colorButtonSelect = (newBtn, attribut, Newclass, is_text) => {

    newBtn = newBtn.replace('#', '');

    let btn = document.getElementById(newBtn);

    if (btn == null) {
        return false;
    }

    let oldBtn = document.querySelectorAll('[' + attribut + '=true]')
    if (oldBtn != null) {
        oldBtn.forEach((element) => {
            element.removeAttribute(attribut)
            element.classList.remove(Newclass)
            element.classList.remove('text-selected')
        })
    }

    if (is_text) {
        let txtlabel = document.getElementById(newBtn.replace('btn', 'txt'));
        txtlabel.classList.add(Newclass);
        txtlabel.setAttribute(attribut, 'true');
    }

    btn.setAttribute(attribut, 'true');
    return true;

}

let products = []
let abonnement = []
let accessory = []

const findProduct = (product, color) => {
    const filtered = products.find(elem =>
        elem.metadata.pId === product && (color ? elem.metadata.colorId === color : true)
    )
    return filtered;
}

const findAbonnement = (product) => {
    let filtered = abonnement.find(elem => elem.metadata.pId == product)

    return filtered
}

const findAboType = (abo, type) => {
    let filtered = abo.prices.find(elem => elem.metadata.pricing == type)

    return filtered
}

const getTargetProduct = () => {

    targetProduct = 'jag-smartdock';

    if (document.getElementById('jag-without-smartdock').getAttribute('isChecked') == 'yes') {
        targetProduct = 'jag';
    }

    if (document.getElementById('jag-with-smartdock').getAttribute('isChecked') == 'yes') {
        targetProduct = 'jag-smartdock';
    }

    return targetProduct;
}

const SlideToColor = (ColorProduct) => {

    // Permet de faire bouger le slider
    slides = document.getElementById('jl-slide-mask-product');
    withSlide = slides.offsetWidth;
    for (const child of slides.children) {
        child.style.transform = 'translateX(0px);';
    }
    if (ColorProduct == 'fauve') {nbSlide = 0};
    if (ColorProduct == 'weimar') {nbSlide = 1};
    if (ColorProduct == 'charbon') {nbSlide = 2};

    console.log('nbSlide',nbSlide)
    
    for (const child of slides.children) {
        child.style.transform = 'translateX(-' + nbSlide * withSlide + 'px);';
    }

    navSlide = document.getElementById('jl-slide-nav-product');




}

const initJagGPS = async () => {

    console.log('start');
    
    let collar = document.getElementById('jl-collar')

    //document.querySelectorAll('#btn-color-fauve').forEach(element => element.addEventListener('click', (event) => {
    document.getElementById('btn_boitier_color_fauve').addEventListener('click', (event) => {
        event.preventDefault()
        let targetProduct = getTargetProduct();
        colorButtonAction(collar, findProduct(targetProduct, 'fauve').image, findProduct(targetProduct, 'fauve').price.id)
        colorButtonSelect('btn-color-fauve', 'color-selected', 'txt-color-selected', true)
        SlideToColor('fauve');
        document.activeElement.blur();
    })
    //document.querySelectorAll('#btn-color-weimar').forEach(element => element.addEventListener('click', (event) => {
    document.getElementById('btn_boitier_color_weimar').addEventListener('click', (event) => {
        event.preventDefault()
        let targetProduct = getTargetProduct();
        colorButtonAction(collar, findProduct(targetProduct, 'weimar').image, findProduct(targetProduct, 'weimar').price.id)
        colorButtonSelect('btn-color-weimar', 'color-selected', 'txt-color-selected', true)
        SlideToColor('weimar');
        document.activeElement.blur();
    })
    //document.querySelectorAll('#btn-color-charbon').forEach(element => element.addEventListener('click', (event) => {
    document.getElementById('btn_boitier_color_charbon').addEventListener('click', (event) => {
        event.preventDefault()
        let targetProduct = getTargetProduct();
        colorButtonAction(collar, findProduct(targetProduct, 'charbon').image, findProduct(targetProduct, 'charbon').price.id)
        colorButtonSelect('btn-color-charbon', 'color-selected', 'txt-color-selected', true)
        SlideToColor('charbon');
        document.activeElement.blur();
    })

    document.getElementById('jag-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let product = products.find(elem => elem.price.id == collar.getAttribute('data-selected'))
        shoppingCart.addItem(product, 1)
        document.activeElement.blur();
        gtag("event", "add_to_cart",
            {
                currency: "EUR",
                value: product.price.price,
                items: [
                    {
                        item_id: product.metadata.productId,
                        item_name: product.metadata.title_fr,
                        item_brand: "Jagger & Lewis",
                        item_variant: product.colorId,
                        price: product.price.price,
                        quantity: 3
                    }
                ]
            });
    })

    /*
    document.getElementById('btn_add_smartdock').setAttribute('isChecked', 'no');
    document.getElementById('btn_add_smartdock').addEventListener('click', (event) => {
        event.preventDefault()
        switchProduct();
        document.activeElement.blur();
    })
    */

    console.log('ici');

    document.getElementById('jag-without-smartdock').addEventListener('click', (event) => {
        event.preventDefault()
        switchProduct('jag');
        document.activeElement.blur();
    })
    document.getElementById('jag-with-smartdock').addEventListener('click', (event) => {
        event.preventDefault()
        switchProduct('jag-smartdock');
        document.activeElement.blur();
    })

    document.getElementById('price-jag').innerHTML = findProduct('jag', initialColor).price.price;
    document.getElementById('price-jag-smartdock').innerHTML = findProduct('jag-smartdock', initialColor).price.price;
    
    //collar.srcset = findProduct('jag', initialColor).image
    
    colorButtonSelect('#btn-color-' + initialColor, 'color-selected', 'txt-color-selected', true)
    switchProduct(initialDevice);

    return true;
}

const initSmartDockAlone = async () => {
    let smartdock = document.getElementById('jag-smartdock-alone')

    let priceLabel = document.getElementById('price-jag')
    let btnAddBasket = document.getElementById('btn-buy-smartdock-alone')

    if (!priceLabel) { return false; }
    if (!btnAddBasket) { return false; }

    smartdockProduct = findProduct('smartdock');
    //console.log(smartdockProduct);

    priceLabel.innerHTML = smartdockProduct.price.price;
    btnAddBasket.addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(smartdockProduct, 1)
        document.activeElement.blur();
    })
}

const switchProduct = (targetProduct) => {

    if (targetProduct == 'jag-smartdock') {
        // On bascule avec le smartdock
        document.getElementById('jag-without-smartdock').setAttribute('isChecked', 'no');
        document.getElementById('jag-with-smartdock').setAttribute('isChecked', 'yes');
        document.getElementById('jag-without-smartdock').className = 'jl-jag-encart';
        document.getElementById('jag-with-smartdock').className = 'jl-jag-encart selected';
    }
    
    if (targetProduct == 'jag') {
        // On bascule sur le produit seul
        document.getElementById('jag-without-smartdock').setAttribute('isChecked', 'yes');
        document.getElementById('jag-with-smartdock').setAttribute('isChecked', 'no');
        document.getElementById('jag-without-smartdock').className = 'jl-jag-encart selected';
        document.getElementById('jag-with-smartdock').className = 'jl-jag-encart';
    }

    let collar = document.getElementById('jl-collar')
    colorChanged = false;

    colors.forEach((color) => {
        theBtnColor = document.getElementById('btn-color-' + color);
        if (theBtnColor.getAttribute('color-selected') == 'true') {
            colorChanged = true;
            colorButtonAction(collar, findProduct(targetProduct, color).image, findProduct(targetProduct, color).price.id);
            colorButtonSelect('btn-color-' + color, 'color-selected', 'txt-color-selected', true);
            document.getElementById('price-' + targetProduct).innerHTML = findProduct(targetProduct, color).price.price;
        }
    })

    if (colorChanged == false) {
        color = initialColor;
        colorButtonAction(collar, findProduct(targetProduct, color).image, findProduct(targetProduct, color).price.id);
        colorButtonSelect('btn-color-' + color, 'color-selected', 'txt-color-selected', true);
        document.getElementById('price-' + targetProduct).innerHTML = findProduct(targetProduct, color).price.price;
    }
    
    collar.setAttribute('data-selected', findProduct(targetProduct, initialColor).price.id)

}

const initHome = async () => {

    let collar = document.querySelector('#jl-collar')
    let dock = document.querySelector('#jl-dock')
    document.querySelector('#price-jag').innerHTML = document.querySelector('#price-jag').innerHTML.replace('{price}', findProduct('jag', 'fauve').price.price)
    document.querySelector('#jl-price-month').textContent = (findAboType(findAbonnement("starter"), "monthly").price).toFixed(2)

    document.querySelector('#jag-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let product = products.find(elem => elem.price.id == collar.getAttribute('data-selected'))
        shoppingCart.addItem(product, 1)
        document.activeElement.blur();
    })

    document.querySelector('#jag-jag-dock').addEventListener('click', (event) => {
        event.preventDefault()
        let product = products.find(elem => elem.price.id == dock.getAttribute('data-selected'))
        shoppingCart.addItem(product, 1)
        document.activeElement.blur();
    })

    //document.querySelectorAll('#btn-color-fauve').forEach(element => element.addEventListener('click', (event) => {
    document.querySelectorAll('#btn_boitier_color_fauve').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'fauve').image, findProduct('jag', 'fauve').price.id)
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    }))
    //document.querySelectorAll('#btn-color-weimar').forEach(element => element.addEventListener('click', (event) => {
    document.querySelectorAll('#btn_boitier_color_weimar').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'weimar').image, findProduct('jag', 'weimar').price.id)
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    }))
    //document.querySelectorAll('#btn-color-charbon').forEach(element => element.addEventListener('click', (event) => {
    document.querySelectorAll('#btn_boitier_color_charbon').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'charbon').image, findProduct('jag', 'charbon').price.id)
        colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    }))

    collar.setAttribute('data-selected', findProduct('jag', 'fauve').price.id)
    collar.srcset = findProduct('jag', 'fauve').image
    dock.setAttribute('data-selected', findProduct('jag-smartdock', 'fauve').price.id)
    dock.srcset = findProduct('jag-smartdock', 'fauve').image
    colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    colorButtonSelect('#btn-dock-color-fauve', 'color-dock-selected', 'jl-color-selected', true)

}

const initCollar = async () => {
    let collar = document.querySelector('#page-jag-collar')
    document.querySelector('#abo-dock-price').innerHTML = document.querySelector('#abo-dock-price').innerHTML.replace('{price}', findProduct('jag-smartdock', 'fauve').price.price)
    document.querySelector('#abo-jag-price').innerHTML = document.querySelector('#abo-jag-price').innerHTML.replace('{price}', findProduct('jag', 'fauve').price.price)
    document.querySelector('#abo-cable-price').innerHTML = document.querySelector('#abo-cable-price').innerHTML.replace('{price}', findProduct('jag-chargingcable').price.price)
    document.querySelector('#abo-coque-price').innerHTML = document.querySelector('#abo-coque-price').innerHTML.replace('{price}', findProduct('jag-sock', 'fauve').price.price)
    document.querySelector('#je-commande-mon-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let color = products.find(elem => elem.price.id == collar.getAttribute('data-selected')).metadata.colorId
        let option = document.querySelector('[hover-selected=true]')
        let productId
        switch (option.id) {
            case 'jag-en-solo':
                productId = 'jag'
                break;
            case 'jag-avec-smartdock':
                productId = 'jag-smartdock'
                break;
            default:
        }
        let finalProduct = products.find(elem => elem.metadata.pId == productId && elem.metadata.colorId == color)

        if (finalProduct != null)
            shoppingCart.addItem(finalProduct, 1)
        else
            showSnackBar("Votre produit n'a pas été trouvé...", true)

    })
    document.querySelector('#btn-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'fauve').image, findProduct('jag', 'fauve').price.id)
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)

    })
    document.querySelector('#btn-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'weimar').image, findProduct('jag', 'weimar').price.id)
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#btn-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'charbon').image, findProduct('jag', 'charbon').price.id)
        colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'fauve').image, findProduct('jag', 'fauve').price.id)
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)

    })
    document.querySelector('#txt-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'weimar').image, findProduct('jag', 'weimar').price.id)
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'charbon').image, findProduct('jag', 'charbon').price.id)
        colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#jag-en-solo').addEventListener('click', (event) => {
        colorButtonSelect('#jag-en-solo', 'hover-selected', 'jag-button-selected')
    })
    document.querySelector('#jag-avec-smartdock').addEventListener('click', (event) => {
        colorButtonSelect('#jag-avec-smartdock', 'hover-selected', 'jag-button-selected')
    })

    document.querySelector('#jl-jag-coque-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-sock', 'fauve'), 1)
    })
    document.querySelector('#jl-jag-cable').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-chargingcable'), 1)
    })
    collar.setAttribute('data-selected', findProduct('jag', 'fauve').price.id)
    collar.srcset = findProduct('jag', 'fauve').image
    colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    colorButtonSelect('#jag-en-solo', 'hover-selected', 'jag-button-selected')

}

const initBox = async () => {
    document.querySelector('#jl-dock-antenne').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-smartdock-antenna-md'), 1)
    })
    document.querySelector('#jl-dock-cable').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-chargingcable'), 1)
    })
}

const initNewsLettre = () => {
    let btn = document.querySelector('#btn-restons-en-contact').addEventListener('click', () => {
        let emailValue = document.querySelector('#input-restons-en-contact').value
        fetch(`${interfaceUrl}/newsletter/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailValue })
        })
    })
}

const initAccessory = () => {

    document.querySelector('#acc-coque-fauve-price').innerHTML = document.querySelector('#acc-coque-fauve-price').innerHTML.replace('{price}', findProduct('jag-sock', 'fauve').price.price)
    document.querySelector('#acc-coque-carbon-price').innerHTML = document.querySelector('#acc-coque-carbon-price').innerHTML.replace('{price}', findProduct('jag-sock', 'charbon').price.price)
    document.querySelector('#acc-coque-weimar-price').innerHTML = document.querySelector('#acc-coque-weimar-price').innerHTML.replace('{price}', findProduct('jag-sock', 'weimar').price.price)
    document.querySelector('#acc-cable-sm-price').innerHTML = document.querySelector('#acc-cable-sm-price').innerHTML.replace('{price}', findProduct('jag-chargingcable').price.price)
    document.querySelector('#acc-cable-price').innerHTML = document.querySelector('#acc-cable-price').innerHTML.replace('{price}', findProduct('jag-chargingcable').price.price)
    document.querySelector('#acc-dock-price').innerHTML = document.querySelector('#acc-dock-price').innerHTML.replace('{price}', findProduct('smartdock').price.price)
    document.querySelector('#acc-big-antena-price').innerHTML = document.querySelector('#acc-big-antena-price').innerHTML.replace('{price}', findProduct('jag-smartdock-antenna-lg').price.price)
    document.querySelector('#acc-sml-antena-price').innerHTML = document.querySelector('#acc-sml-antena-price').innerHTML.replace('{price}', findProduct('jag-smartdock-antenna-md').price.price)
    document.querySelector('#jl-coque-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-sock', 'fauve'), 1)
    })
    document.querySelector('#jl-coque-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-sock', 'charbon'), 1)
    })
    document.querySelector('#jl-coque-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-sock', 'weimar'), 1)
    })
    document.querySelector('#jl-antenne').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-smartdock-antenna-md'), 1)
    })
    document.querySelector('#jl-cable-cta').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-chargingcable'), 1)
    })
    document.querySelector('#jl-cable-cta-dock').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-smartdock-chargingcable'), 1)
    })
    document.querySelector('#jl-grande-antenne').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-smartdock-antenna-lg'), 1)
    })
    document.querySelector('#jl-smartdock-accessoire').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('smartdock'), 1)
    })
}

const initJagAccessory = () => {

    //console.log(accessory);

    document.getElementById('jl-Accessory-model').style.display = 'none';

    function createAccessoryItem(itemLine) {
        let element = document.getElementById('jl-Accessory-model');

        let newAccess = element.cloneNode(true);
        newAccess.setAttribute('id', 'jl-Accessory-item-' + itemLine);

        for (const child of newAccess.childNodes) {
            if (child.hasChildNodes()) {
                child.childNodes.forEach((e, i) => {
                    if (e.id.startsWith('jl-Accessory-item')) {
                        e.setAttribute('id', e.id + '-' + itemLine);
                    }
                });
            }
            else {
                if (child.id.startsWith('jl-Accessory-item')) {
                    child.setAttribute('id', child.id + '-' + itemLine);
                }
            }
        }
        //console.log(newItem);
        document.getElementById('jl-Accessory-List').appendChild(newAccess);
    }

    nbAccess = 1;

    if (accessory.length == 0) {
        return true;
    }

    accessory.forEach((access) => {
        if (access.metadata.pId.endsWith('unlimited')) {
            return;
        }

        //let id = prod.price.id
        //addHtml(prod, id)
        //addFunction(prod.id, id)

        //console.log(access);
        createAccessoryItem(nbAccess);
        document.getElementById('jl-Accessory-item-label-' + nbAccess).innerHTML = capitalise(getLocalName(access));
        document.getElementById('jl-Accessory-item-ref-' + nbAccess).innerHTML = access.metadata.pId;
        document.getElementById('jl-Accessory-item-Img-' + nbAccess).src = access.image;
        document.getElementById('jl-Accessory-item-Img-' + nbAccess).removeAttribute('srcset');
        document.getElementById('jl-Accessory-item-price-' + nbAccess).innerHTML = (access.price.price).toFixed(2) + ' &euro;';

        document.getElementById('jl-Accessory-item-btn-' + nbAccess).addEventListener('click', (event) => {
            event.preventDefault();
            shoppingCart.addItem(access, 1)
            document.activeElement.blur();
        });

        document.getElementById('jl-Accessory-item-' + nbAccess).style.display = 'block';

        nbAccess++;
    })



}

const loadAbonnement = async () => {
    //loaderContainer.style = null

    let date = Date.now()
    let abonnement
    //loaderContainer.style.display = 'none'
    abonnement = await (await getAbonnementFromStripe()).json()
    localStorage.setItem('ts-abonnement', date)
    localStorage.setItem('abonnement', JSON.stringify(abonnement))
    return abonnement
}

const updateTime = (search) => {
    var div = document.getElementsByTagName("div");
    var searchText = search ? '1 an' : '1 mois';

    for (var i = 0; i < div.length; i++) {
        if (div[i].textContent == searchText) {
            div[i].textContent = search ? '1 mois' : '1 an';
        }
    }
}

const initAboJag = async () => {
    const switchDisplay = () => {
        if (document.getElementById('jl_abo-facture-mois').className == 'abo_btn_on') {
            toMonth();
        }
        if (document.getElementById('jl_abo-facture-annee').className == 'abo_btn_on') {
            toYear();
        }
        if (document.getElementById('jl_abo-facture-life').className == 'abo_btn_on') {
            toLife();
        }
    }

    const toMonth = () => {
        document.getElementById('jl_abo-facture-mois').className = 'abo_btn_on';
        document.getElementById('jl_abo-facture-annee').className = 'abo_btn_off';
        document.getElementById('jl_abo-facture-life').className = 'abo_btn_off';

        document.getElementById('abo-prix-family-premium').textContent = displayPrice(findAboType(findAbonnement("premium-family"), "monthly").price) + getTrad('€/mois', '€/month')
        document.getElementById('abo-prix-starter-family').textContent = displayPrice(findAboType(findAbonnement("starter-family"), "monthly").price) + getTrad('€/mois', '€/month')
        document.getElementById('abo-prix-starter').textContent = displayPrice(findAboType(findAbonnement("starter"), "monthly").price) + getTrad('€/mois', '€/month')

        document.getElementById('abo-annee-mois-starter').textContent = getTrad('Sans engagement', 'No obligation')
        document.getElementById('abo-annee-mois-starter-family').textContent = getTrad('Sans engagement', 'No obligation')
        document.getElementById('abo-annee-mois-family-premium').textContent = getTrad('Sans engagement', 'No obligation')

        document.querySelector('#total-family-premium').innerHTML = ""; //"Ou " + findAboType(findAbonnement("premium-family"), "yearly").price + "&euro; / an <br> soit <b>" +  (findAboType(findAbonnement("premium-family"), "yearly").price / 12).toFixed(2) + "€</b>/mois"
        document.querySelector('#total-starter-family').innerHTML = ""; // "Ou " + findAboType(findAbonnement("starter-family"), "yearly").price + "&euro; / an <br> soit <b>" +  (findAboType(findAbonnement("starter-family"), "yearly").price / 12).toFixed(2) + "€</b>/mois"
        document.querySelector('#total-starter').innerHTML = ""; // "Ou " + findAboType(findAbonnement("starter"), "yearly").price + "&euro; / an <br> soit <b>" +  (findAboType(findAbonnement("starter"), "yearly").price / 12).toFixed(2)  + "€</b>/mois"

        updateTime(false)
    }

    const toYear = () => {
        document.getElementById('jl_abo-facture-mois').className = 'abo_btn_off';
        document.getElementById('jl_abo-facture-annee').className = 'abo_btn_on';
        document.getElementById('jl_abo-facture-life').className = 'abo_btn_off';

        /*
        document.getElementById('abo-prix-family-premium').textContent = displayPrice(findAboType(findAbonnement("premium-family"), "yearly").price) + getTrad('€/an', '€/year')
        document.getElementById('abo-prix-starter-family').textContent = displayPrice(findAboType(findAbonnement("starter-family"), "yearly").price) + getTrad('€/an', '€/year')
        document.getElementById('abo-prix-starter').textContent = displayPrice(findAboType(findAbonnement("starter"), "yearly").price) + getTrad('€/an', '€/year')
        document.getElementById('total-family-premium').innerHTML = getTrad('Soit', 'Or') + " <b>" + (findAboType(findAbonnement("premium-family"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')
        document.getElementById('total-starter-family').innerHTML = getTrad('Soit', 'Or') + " <b>" + (findAboType(findAbonnement("starter-family"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')
        document.getElementById('total-starter').innerHTML = getTrad('Soit', 'Or') + " <b>" + (findAboType(findAbonnement("starter"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')
        */

        document.getElementById('total-family-premium').textContent = getTrad('Paiement de ', '') + displayPrice(findAboType(findAbonnement("premium-family"), "yearly").price) + getTrad('€ tous les ans', '€ billed annualy')
        document.getElementById('total-starter-family').textContent = getTrad('Paiement de ', '') + displayPrice(findAboType(findAbonnement("starter-family"), "yearly").price) + getTrad('€ tous les ans', '€ billed annualy')
        document.getElementById('total-starter').textContent = getTrad('Paiement de ', '') + displayPrice(findAboType(findAbonnement("starter"), "yearly").price) + getTrad('€ tous les ans', '€ billed annualy')
        document.getElementById('abo-prix-family-premium').innerHTML = (findAboType(findAbonnement("premium-family"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')
        document.getElementById('abo-prix-starter-family').innerHTML = (findAboType(findAbonnement("starter-family"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')
        document.getElementById('abo-prix-starter').innerHTML = (findAboType(findAbonnement("starter"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')

        document.getElementById('abo-annee-mois-starter').textContent = getTrad('2 mois offerts', '2 months free')
        document.getElementById('abo-annee-mois-starter-family').textContent = getTrad('2 mois offerts', '2 months free')
        document.getElementById('abo-annee-mois-family-premium').textContent = getTrad('2 mois offerts', '2 months free')

        updateTime(false)
    }

    const toLife = () => {
        document.getElementById('jl_abo-facture-mois').className = 'abo_btn_off';
        document.getElementById('jl_abo-facture-annee').className = 'abo_btn_off';
        document.getElementById('jl_abo-facture-life').className = 'abo_btn_on';

        document.getElementById('abo-prix-family-premium').textContent = findAboType(findAbonnement("premium-family"), "life").price + '€'
        document.getElementById('abo-prix-starter-family').textContent = findAboType(findAbonnement("starter-family"), "life").price + '€'
        document.getElementById('abo-prix-starter').textContent = findAboType(findAbonnement("starter"), "life").price + '€'

        document.getElementById('abo-annee-mois-starter').textContent = getTrad('Formule sans abonnement', 'no-subscription formula')
        document.getElementById('abo-annee-mois-starter-family').textContent = getTrad('Formule sans abonnement', 'no-subscription formula')
        document.getElementById('abo-annee-mois-family-premium').textContent = getTrad('Formule sans abonnement', 'no-subscription formula')

        document.getElementById('total-family-premium').innerHTML = getTrad('1 paiement unique', '1 single payment')
        document.getElementById('total-starter-family').innerHTML = getTrad('1 paiement unique', '1 single payment')
        document.getElementById('total-starter').innerHTML = getTrad('1 paiement unique', '1 single payment')
        updateTime(true)

    }

    document.getElementById('jl_abo-facture-annee').addEventListener('click', (event) => {
        event.preventDefault();
        toYear();
        document.activeElement.blur();
    });
    document.getElementById('jl_abo-facture-life').addEventListener('click', (event) => {
        event.preventDefault();
        toLife();
        document.activeElement.blur();
    });
    document.getElementById('jl_abo-facture-mois').addEventListener('click', (event) => {
        event.preventDefault();
        toMonth();
        document.activeElement.blur();
    })

    switchDisplay();

    toYear();

}

const initAboB = async () => {
    let formula = abonnement.find((elem) => elem.metadata.pId == 'formula_unique')
    document.getElementById('jl-abo-month-price').innerHTML = (formula.prices.find((elem) => elem.metadata.pricing == 'monthly').price).toFixed(2) + '€' + getTrad('/mois', '/month')
    document.getElementById('jl-abo-year-price').innerHTML = (formula.prices.find((elem) => elem.metadata.pricing == 'yearly').price / 12).toFixed(2) + '€' + getTrad('/mois', '/month')
    document.getElementById('jl-abo-life-price').innerHTML = (formula.prices.find((elem) => elem.metadata.pricing == 'life').price).toFixed(2) + '€'

    document.getElementById('jl-abo-month-price-info').innerHTML = getTrad('Sans engagement', 'Without obligation')
    //document.getElementById('jl-abo-year-price-info').innerHTML = getTrad('Soit 3 mois gratuits', '3 months free')
    let annualPrice = (formula.prices.find((elem) => elem.metadata.pricing == 'yearly').price).toFixed(2) + '€'
    document.getElementById('jl-abo-year-price-info').innerHTML = getTrad('Soit ' + annualPrice + ' par an', 'or ' + annualPrice + ' per year')
    let lifePrice36 = (formula.prices.find((elem) => elem.metadata.pricing == 'life').price / 36).toFixed(2) + '€'
    document.getElementById('jl-abo-life-price-info').innerHTML = getTrad('Soit ' + lifePrice36 + '/mois sur 3 ans', 'Or ' + lifePrice36 + '/month over 3 years')
}

const initAccessWidget = async () => {
    let datas = products.filter((elem) => elem.metadata.category == 'product' && !['jag-unlimited', 'jag-smartdock', 'jag-smartdock-unlimited'].includes(elem.metadata.pId))
    let card = document.getElementById('jag-solo-container')
    let container = document.getElementById('jag-solo')
    datas.forEach((prod) => {
        let newCard = card.cloneNode(true)

        changeChildsId(newCard, '-' + prod.metadata.productId, 'jag-')
        container.insertBefore(newCard, container.firstChild)
        document.getElementById('jag-solo-pict-' + prod.metadata.productId).src = prod.image
        document.getElementById('jag-solo-title-' + prod.metadata.productId).innerHTML = prod.name
        document.getElementById('jag-solo-price-' + prod.metadata.productId).innerHTML = prod.price.price + '€'
        document.getElementById('jag-solo-action-' + prod.metadata.productId).addEventListener('click', () => shoppingCart.addItem(prod, 1))
        newCard.style.display = 'flex'
    })
}


const refreshOrderInfo = async () => {
    shoppingCart.clear()
    if (document.getElementById('JL_ORDER'))
        document.getElementById('JL_ORDER').style.display = 'none';

    let id = new URLSearchParams(window.location.search).get('session_id')
    //console.log(id)
    if (id == null) {
        id = "cs_live_a1Rd0HTjHn8zIFgoXlj3wnk0jxW0Krpv5f3W4wjamNnAzytLTq9Px9WYfV";
    }

    let datas = await loadCart(id)
    //console.log(datas);

    localStorage.setItem('session_id', id)
    if (document.getElementById('JL_ORDER')) {
        document.getElementById('JL_ORDER_ID').textContent = datas.orderNumber
        document.getElementById('JL_ORDER').style.display = 'flex';
    }

    let order_total_amount = 0;
    let order_items = [];
    let items = datas.aside_data.cart;

    for (i = 0; i < items.length; i++) {
        item = datas.aside_data.cart[i];
        //console.log(item);

        let itemColor = '';
        if (item.description.toLowerCase().indexOf('weimar') > -1) { itemColor = 'Weimar'; }
        if (item.description.toLowerCase().indexOf('fauve') > -1) { itemColor = 'Fauve'; }
        if (item.description.toLowerCase().indexOf('charbon') > -1) { itemColor = 'Charbon'; }

        newItem = {
            item_id: item.price.product,
            item_name: item.description,
            index: 0,
            item_brand: "Jagger & Lewis",
            item_variant: itemColor,
            price: item.amount_total,
            quantity: item.quantity
        }

        order_total_amount += item.amount_total;
        //console.log(newItem);
        order_items.push(newItem)
    }

    shipping_cost = 599;
    order_total_amount = order_total_amount + shipping_cost;
    order_total_tax = parseInt(order_total_amount / 1.2);
    //console.log(order_total_amount,order_total_tax,order_items )

    gtag("event", "purchase", {
        transaction_id: datas.orderNumber,
        value: order_total_amount / 100,
        tax: order_total_tax / 100,
        shipping: shipping_cost / 100,
        currency: "EUR",
        items: order_items
    });
    console.log('gtag purchase ok', datas.orderNumber, shipping_cost, order_total_amount, order_total_tax);

}

const changeChildsId = (node, suffix, filter) => {
    if (filter) {
        if (node.id && node.id.includes(filter))
            node.id = node.id + suffix
    }
    else node.id = node.id + suffix
    if (node.hasChildNodes) {
        var childs = node.childNodes;
        for (var index = 0; index < childs.length; index++) {
            changeChildsId(childs[index], suffix, filter)
        }
    }
}

const loadCart = async (id) => {
    try {
        loaderContainer.display = ''
    }
    catch (e) { }
    return await fetch(`${interfaceUrl}/stripe/checkout_session/` + id + '/cart').then(res => res.json())
}

function preload(url) {
    let image = new Image();
    image.src = url;
    return image;
}

const loadData = async () => {
    let date = Date.now()
    let result

    result = await (await getProductsFromStripe()).json()
    localStorage.setItem('ts', date)
    localStorage.setItem('data', JSON.stringify(result))
    return result
}

const init = async () => {

    let date = Date.now()

    let loaderContainer
    loaderContainer = document.createElement('div')
    loaderContainer.classList.add('jl-loader-container')
    loaderContainer.innerHTML = '<lottie-player src="https://webcart.jagger-lewis.com/loader%20site.json" background="transparent" speed="1"style="width: 300px; height: 300px;"  autoplay></lottie-player>'
    body.insertBefore(loaderContainer, document.body.firstChild);


    let lastDate = JSON.parse(localStorage.getItem('ts')) || Date.now();
    let delayDate = 24 * 60 * 60 * 1000;


    console.log(date, lastDate, (date - lastDate));

    if ((date - lastDate) > delayDate) {
        await loadData()
        await loadAbonnement()
    }

    let result = JSON.parse(localStorage.getItem('data')) || await loadData()
    abonnement = JSON.parse(localStorage.getItem('abonnement')) || await loadAbonnement()

    loaderContainer.style.display = 'none'

    for (const product of result) {
        products.push(new Product(product.name, product.description, product.metadata, product.image, product.prices[0]))
        if (product.metadata.category == "accessory" || product.metadata.category == "product") {
            accessory.push(new Product(product.name, product.description, product.metadata, product.image, product.prices[0]))
        }
    }

    /*
    try {
        preload(findProduct('jag', 'fauve').image)
        preload(findProduct('jag', 'weimar').image)
        preload(findProduct('jag', 'charbon').image)
        preload(findProduct('jag-smartdock', 'fauve').image)
        preload(findProduct('jag-smartdock', 'weimar').image)
        preload(findProduct('jag-smartdock', 'charbon').image)
    }
    catch (e) {
        console.log(e)
    }
    */

    if (JL_NavBar) {
        document.getElementById('JL_Basket_Item').style.display = 'none';
        document.getElementById('JL_Basket_Empty').style.display = 'block';
        document.getElementById('jl-cart-number').addEventListener('click', (event) => showNewCart(event))
        document.getElementById('jag-cart').addEventListener('click', (event) => showNewCart(event))
        document.getElementById('JL_Btn_Close_Basket').addEventListener('click', (event) => hideCart(event))
    }

    if (document.getElementById('JL_Abonnement_Full_Grille')) {
        initAboJag()
    }

    if (document.getElementById('JL_Abo_Newsletter')) {
        initNewsLettre()
    }

    if (document.getElementById('jag-smartdock-alone')) {
        initSmartDockAlone()
    }

    //if (document.getElementById('jl-collar')) {
        initJagGPS();
    //}

    if (document.getElementById('jl-price-month')) {
        document.querySelector('#jl-price-month').textContent = (findAboType(findAbonnement("starter"), "monthly").price).toFixed(2)
    }

    if (document.getElementById('jl-Accessory')) {
        initJagAccessory();
    }

    if (document.getElementById('jl-checkout-redirect')) {
        refreshOrderInfo();
    }
    if (document.getElementById('jag-solo')) {
        initAccessWidget();
    }
    if (document.getElementById('jag-abo-B-page')) {
        initAboB();
    }

    setCartNumber();
    page = window.location.href.split('/')[3].split('?')[0];

    //console.log(page);
}

const redirectToStripe = async (event) => {
    try {
        event.preventDefault();
    }
    catch (e) {
        //console.log(e);
    }

    /*
    if (shoppingCart.countItems() == 0) {
        showSnackBar("Vous n'avez pas d'article", true)
            return
        }
    */
    const apiRes = await shoppingCart.getCartStripeUrl()
    //console.log(apiRes);
    const apiResJson = await apiRes.json()
    //console.log(apiResJson);

    //Appel du Tag Manager pour le checkout puis redirection vers stripe
    gtag("event", "begin_checkout", {
        event_callback: function () {
            window.location.href = apiResJson.url
        },
    });

}

const redirectToStripeBis = async () => {
    const url = window.location.origin + window.location.pathname;
    let abo = findAboType(findAbonnement('premium-first'), 'life').id;
    const answer = await fetch(`${interfaceUrl}/stripe/checkout_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: [{ id: abo, quantity: 1 }], mode: 'payment', referer: url })
    })
    const apiResJson = await answer.json()
    window.location.href = apiResJson.url
}


const getTrad = (labelFr, labelUs) => window.location.href.split('/').find((elem) => elem == 'en') ? labelUs : labelFr

const showNewCart = (event) => {

    event.preventDefault();

    document.getElementById('JL_Basket_Valide_Commande').addEventListener('click', (event) => {
        event.preventDefault()
        redirectToStripe()
        document.activeElement.blur();
    })

    function clearCart() {
        const myElement = document.getElementById("JL_Basket_Items");
        for (const child of myElement.children) {
            if (child.id != 'JL_Basket_Item') {
                child.remove();
            }
        }
    }
    function noItems() {
        document.getElementById('JL_Basket_Empty').style.display = 'flex';
        document.getElementById('JL_Basket_Content').style.display = 'none';
        document.getElementById('JL_Basket_Delivery_Amount').style.display = 'none';
        document.getElementById('JL_Basket_Info_Abo').style.display = 'none';
        document.getElementById('JL_Basket_Boutons').style.display = 'none';
        document.getElementById('JL_Basket').style.display = 'flex';
        document.getElementById('JL_Basket_Total').style.display = 'none';
    }

    function createLine(itemLine) {
        let element = document.getElementById('JL_Basket_Item');

        let newItem = element.cloneNode(true);
        newItem.setAttribute('id', 'JL_Basket_Item_' + itemLine);

        for (const child of newItem.childNodes) {
            if (child.hasChildNodes()) {
                child.childNodes.forEach((e, i) => {
                    if (e.id.startsWith('JL_Basket_Item')) {
                        e.setAttribute('id', e.id + '_' + itemLine);
                    }
                });
            }
            else {
                if (child.id.startsWith('JL_Basket_Item')) {
                    child.setAttribute('id', child.id + '_' + itemLine);
                }
            }
        }
        //console.log(newItem);
        document.getElementById('JL_Basket_Items').appendChild(newItem);
    }

    if (shoppingCart.cart.length == 0) {
        noItems();
        return true;
    }

    nbItem = 1;

    clearCart();

    let cart_items = [];

    shoppingCart.cart.forEach((prod) => {

        let id = prod.id.price.id
        //addHtml(prod, id)
        //addFunction(prod.id, id)

        createLine(nbItem);

        document.getElementById('JL_Basket_Item_Label_' + nbItem).innerHTML = getLocalName(prod.id);
        let labelQty = getTrad('qté : ', 'qty : ');
        document.getElementById('JL_Basket_Item_Ref_' + nbItem).innerHTML = prod.id.metadata.pId + " (" + labelQty + prod.quantity + ")";
        document.getElementById('JL_Basket_Item_Img_' + nbItem).src = prod.id.image;
        document.getElementById('JL_Basket_Item_Img_' + nbItem).removeAttribute('srcset');
        document.getElementById('JL_Basket_Item_Price_' + nbItem).innerHTML = (prod.quantity * prod.id.price.price).toFixed(2) + ' &euro;';

        document.getElementById('JL_Basket_Item_Trash_Icon_' + nbItem).setAttribute('nbItem', nbItem);
        document.getElementById('JL_Basket_Item_Trash_Icon_' + nbItem).addEventListener('click', (event) => {
            event.preventDefault();
            ligneId = document.getElementById(event.target.id).getAttribute('nbItem');
            itemLineChild = document.getElementById('JL_Basket_Item_' + ligneId);
            document.getElementById('JL_Basket_Items').removeChild(itemLineChild);
            shoppingCart.clearItem(prod.id);
            shoppingCart.setTotalPrice();

            // Add event for google
            gtag("event", "remove_from_cart",
                {
                    'currency': "EUR",
                    'value': prod.id.price.price,
                    'items': [
                        {
                            'item_id': prod.id.metadata.productId,
                            'item_name': prod.id.metadata.title_fr,
                            'item_brand': "Jagger & Lewis",
                            'item_variant': prod.id.metadata.colorId,
                            'price': prod.id.price.price,
                            'quantity': prod.quantity
                        }
                    ]
                });

            if (shoppingCart.cart.length == 0) {
                noItems();
            }
            document.activeElement.blur();
        });

        document.getElementById('JL_Basket_Item_' + nbItem).style.display = 'flex';

        cart_items.push({
            'item_id': prod.id.metadata.productId,
            'item_name': prod.id.metadata.title_fr,
            'item_brand': "Jagger & Lewis",
            'item_variant': prod.id.metadata.colorId,
            'price': prod.id.price.price,
            'quantity': prod.quantity
        });

        nbItem++;
    })

    let cart_totalPrice = shoppingCart.setTotalPrice();

    gtag("event", "view_cart", {
        currency: "EUR",
        value: cart_totalPrice,
        items: cart_items,
    });

    document.getElementById('JL_Basket_Delivery_Amount').innerHTML = "<b>" + document.getElementById('JL_Basket_Delivery_Amount').innerHTML.replace('{price.delivery.std}', '5.99') + "</b>";

    document.getElementById('JL_Basket_Total').style.display = 'flex';
    document.getElementById('JL_Basket_Boutons').style.display = 'flex';
    document.getElementById('JL_Basket_Item').style.display = 'none'; // Ligne vide de modèle
    document.getElementById('JL_Basket_Empty').style.display = 'none';
    document.getElementById('JL_Basket_Info_Abo').style.display = 'flex';
    document.getElementById('JL_Basket').style.display = 'flex';
    document.getElementById('JL_Basket_Content').style.display = 'block';

}

const hideCart = () => {
    document.getElementById('JL_Basket').style.display = 'none';
}
//document.querySelector('#jag-cart').addEventListener('click',(event) => showCart(event))



const showAddCart = (text, isError) => {
    document.getElementById('JL_AddCart_Snack_Label').textContent = text
    document.getElementById('JL_AddCart_Snack').style.display = 'block';

    setTimeout(function () { document.getElementById('JL_AddCart_Snack').style.display = 'none' }, 3000);
}

const goToStripe = document.getElementById("validate-cart");
goToStripe.onclick = (event) => {
    redirectToStripe(event)
}

var colors = ['fauve', 'weimar', 'charbon'];
var devices = ['jag', 'jag-smartdock'];
var initialColor = 'fauve';
var initialDevice = 'jag-smartdock';

if (document.getElementById('encart_jag_gps_s2')) {
    let queryParams = new URLSearchParams(document.location.search);
    var jagColor = queryParams.get("c")
    if ((jagColor != null) && (colors.includes(jagColor))) {
        initialColor = jagColor;
    }

    var jagDevice = queryParams.get("d")
    if ((jagDevice != null) && (devices.includes(jagDevice))) {
        initialDevice = jagDevice;
    }
}


if (document.getElementById('JL_NavBar'))
    init()