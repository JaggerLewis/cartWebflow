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




function displayPrice(price) { //USED
    return price % 1 == 0
        ? price + '.00'
        : (price % 0.1).toFixed(5) == 0
            ? price + '0'
            : '' + price
}



const setCartNumber = () => { //USED
    if (JL_NavBar) {
        let count = 0
        if (localStorage.getItem("shoppingCart")) {
            JSON.parse(localStorage.getItem('shoppingCart')).forEach(elem => count += elem.quantity)
        }
        document.getElementById('jl-cart-number').textContent = count;
    }

}


// TODO(dev): update with new methode
class Product {
    constructor(name, description, metadata, image, price) {
        this.name = name;
        this.description = description;
        this.metadata = metadata;
        this.image = image;
        this.price = price
    }
}

// TODO(dev): update with new methode
class ProductCart {
    
    constructor(id, quantity) {
        this.id = id;
        this.quantity = quantity;
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
   
        let labeltocart = getTrad(id.name + ' ajouté au panier', id.name + ' add to cart');
        showAddCart(labeltocart, false)
        const cardProduct = new ProductCart(id, count)

        this.cart.push(cardProduct)
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

    clearItem(id) {
        const productIndex = this.findProductIndexById(id)
        if (productIndex < -1) {
            throw new Error();
        }
        this.cart.splice(productIndex, 1)
        this.saveCart({ event: { type: "clearItem", id: id } })
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



// TODO(dev): update methode to use JL API
const getAbonnementFromStripe = async () => {
    const answer = await fetch(`${interfaceUrl}/stripe/products/category/subscription`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    })
    return answer
}

const shoppingCart = new ShoppingCart();


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

// const getTargetProduct = () => {

//     targetProduct = 'jag-smartdock';

//     if (document.getElementById('jag-without-smartdock').getAttribute('isChecked') == 'yes') {
//         targetProduct = 'jag';
//     }

//     if (document.getElementById('jag-with-smartdock').getAttribute('isChecked') == 'yes') {
//         targetProduct = 'jag-smartdock';
//     }

//     return targetProduct;
// }

const SlideToColor = (ColorProduct) => {

    // Permet de faire bouger le slider
    slides = document.getElementById('jl-slide-mask-product');
    withSlide = slides.offsetWidth;

    if (ColorProduct == 'fauve') {nbSlide = 0};
    if (ColorProduct == 'weimar') {nbSlide = 1};
    if (ColorProduct == 'charbon') {nbSlide = 2};

    console.log('nbSlide',nbSlide)

    for (const child of slides.children) {
        child.style.transform = 'translateX(-' + (nbSlide * withSlide).toString() + 'px)';
        child.style.transition = 'transform 500ms cubic-bezier(0.55, 0.085, 0.68, 0.53) 0s';
    }

    navSlide = document.getElementById('jl-slide-nav-product');
    for (const child of navSlide.children) {
            if ( child.getAttribute('aria-label').indexOf(nbSlide+1) > 0 ) {
                child.className = 'w-slider-dot w-active';
                child.setAttribute('aria-pressed',true);
                child.setAttribute('tabindex',0);
            }
            else
            {
                child.className = 'w-slider-dot';
                child.setAttribute('aria-pressed',false);
                child.setAttribute('tabindex',-1);
            }
    }

}

const setBtnColor = (color) => {
    document.querySelectorAll('[id^=txt-color-]').forEach((elem) => elem.classList.remove('txt-color-selected'))
    document.getElementById('txt-color-' + color).classList.add('txt-color-selected')
}

const initJagGPS = async () => {
    let colors = ['fauve', 'weimar', 'charbon']

    colors.forEach((color) => {
        document.getElementById('btn_boitier_color_'+ color).addEventListener('click', (event) => {
            event.preventDefault()
            setBtnColor(color)
            SlideToColor(color);
            document.activeElement.blur();
        })
    })

    setBtnColor(initialColor)

    return true;
}

const initNewsLettre = () => {
    document.querySelector('#btn-restons-en-contact').addEventListener('click', () => {
        let emailValue = document.querySelector('#input-restons-en-contact').value
        fetch(`${interfaceUrl}/newsletter/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailValue })
        })
    })
}


const loadAbonnement = async () => {
    //loaderContainer.style = null

    let date = Date.now()
    let abonnement
    //loaderContainer.style.display = 'none'
    // abonnement = await (await getAbonnementFromStripe()).json()
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

const initAboB = async () => {}




const refreshOrderInfo = async () => {
    if (document.getElementById('JL_ORDER'))
        document.getElementById('JL_ORDER').style.display = 'none';

    let id = new URLSearchParams(window.location.search).get('session_id') ?? "cs_live_a1Rd0HTjHn8zIFgoXlj3wnk0jxW0Krpv5f3W4wjamNnAzytLTq9Px9WYfV"
    let datas = await loadCart(id)

    localStorage.setItem('session_id', id)
    if (document.getElementById('JL_ORDER')) {
        document.getElementById('JL_ORDER_ID').textContent = datas.orderNumber
        document.getElementById('JL_ORDER').style.display = 'flex';
    }

    let order_total_amount = 0;
    let order_items = [];
    let items = datas.aside_data.cart;

    for (i = 0; i < items.length; i++) {

        let item = datas.aside_data.cart[i];
        shoppingCart.clearItem(item)

        let itemColor = '';
        if (item.description) {
            if (item.description.toLowerCase().indexOf('weimar') > -1) { itemColor = 'Weimar'; }
            if (item.description.toLowerCase().indexOf('fauve') > -1) { itemColor = 'Fauve'; }
            if (item.description.toLowerCase().indexOf('charbon') > -1) { itemColor = 'Charbon'; }
        }
        else {
            itemColor = null
        }
            
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
        order_items.push(newItem)
    }

    shipping_cost = 599;
    order_total_amount = order_total_amount + shipping_cost;
    order_total_tax = parseInt(order_total_amount / 1.2);

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

// const loadData = async () => {
//     let date = Date.now()
//     let result

//     result = await (await getProductsFromStripe()).json()
//     localStorage.setItem('ts', date)
//     localStorage.setItem('data', JSON.stringify(result))
//     return result
// }

const init = async () => {


    let loaderContainer
    loaderContainer = document.createElement('div')
    loaderContainer.classList.add('jl-loader-container')
    loaderContainer.innerHTML = '<lottie-player src="https://webcart.jagger-lewis.com/loader%20site.json" background="transparent" speed="1"style="width: 300px; height: 300px;"  autoplay></lottie-player>'
    body.insertBefore(loaderContainer, document.body.firstChild);
    loaderContainer.style.display = 'none'

    if (JL_NavBar) {
        document.getElementById('JL_Basket_Item').style.display = 'none';
        document.getElementById('JL_Basket_Empty').style.display = 'block';
        document.getElementById('jl-cart-number').addEventListener('click', (event) => showNewCart(event))
        document.getElementById('jag-cart').addEventListener('click', (event) => showNewCart(event))
        document.getElementById('JL_Btn_Close_Basket').addEventListener('click', (event) => hideCart(event))
    }

    if (document.getElementById('JL_Abo_Newsletter')) { //USED
        initNewsLettre()
    }

    if (document.getElementById('jl-collar')) { //USED
        initJagGPS();
    }

    if (document.getElementById('jl-checkout-redirect')) { //USED
        refreshOrderInfo();

    }
    setCartNumber();
    page = window.location.href.split('/')[3].split('?')[0];
}

const redirectToStripe = async (event) => {
    try {
        event.preventDefault();
    }
    catch (e) {}

    const apiRes = await shoppingCart.getCartStripeUrl()
    const apiResJson = await apiRes.json()

    //Appel du Tag Manager pour le checkout puis redirection vers stripe
    gtag("event", "begin_checkout", {
        event_callback: function () {
            window.location.href = apiResJson.url
        },
    });

}


const getTrad = (labelFr, labelUs) => window.location.href.split('/').find((elem) => elem == 'en') ? labelUs : labelFr

const showNewCart = (event) => {
    try {
        
        event.preventDefault();
    } catch (_) {}

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
        // document.getElementById('JL_Basket_Info_Abo').style.display = 'none';
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
        createLine(nbItem);

        document.getElementById('JL_Basket_Item_Label_' + nbItem).innerHTML =  getTrad(prod.metadata.title_fr, prod.metadata.title_en);
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
    // document.getElementById('JL_Basket_Info_Abo').style.display = 'flex';
    document.getElementById('JL_Basket').style.display = 'flex';
    document.getElementById('JL_Basket_Content').style.display = 'block';

}

const hideCart = () => {
    document.getElementById('JL_Basket').style.display = 'none';
}
//document.querySelector('#jag-cart').addEventListener('click',(event) => showCart(event))



const showAddCart = (text, isError) => {
    if (isError) {
        text = getTrad('Oups, une erreur est survenue, rechargez la page', 'Oops, an error has occurred, reload the page')
    }
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

const appendPage = (url) => {
    let s = document.createElement('script')
    s.type = 'text/javascript'
    s.src = url
    document.getElementsByTagName('head')[0].appendChild(s)
}


if (document.getElementById('JL_NavBar')) {
    init()
}
else {
   appendPage('https://webcart.jagger-lewis.com/jlclient.js')
}