//const commander = document.querySelector('#jag-cart')
//commander.setAttribute("data-toggle", "modal")
//commander.setAttribute("data-target", "#cart")

const interfaceUrl = "https://heyjag.mypet.fit";
const body = document.querySelector("body");
const JL_NavBar = document.getElementById('JL_NavBar')

console.log('🐾 Jag is on the way');

if (document.querySelector('#jl-aqua-modal')) {
    document.addEventListener('scroll', (event) => document.querySelector('#jl-aqua-modal').style.display = 'none')
}

const getTrad = (labelFr, labelUs) => window.location.href.split('/').find((elem) => elem == 'en') ? labelUs : labelFr

function displayPrice(price) { //USED
    return price % 1 == 0
        ? price + '.00'
        : (price % 0.1).toFixed(5) == 0
            ? price + '0'
            : '' + price
}

const setCartNbItems = () => { //USED
    if (JL_NavBar) {
        let count = 0
        if (localStorage.getItem("JagSession")) {
            JSON.parse(localStorage.getItem('JagSession')).cart.forEach(elem => count += elem.quantity);
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
        // On supprime l'ancienne référence
        if (localStorage.getItem("shoppingCart")) {
            localStorage.removeItem("shoppingCart")
        }
       
        let JagSession = {
                cart : [],
                orderId : undefined,
                orderNumber : undefined,
                orderTotalAmount : 0,
                orderShippingCost : 0,
                orderItems : [],
                session_id : undefined,
                session_creation_time : Date.now(),
                customerEmail : undefined,
                tsEncartEmail : Date.now(),
                tsEncartIsHide : false
            }

        if (!localStorage.getItem("JagSession")) {
            console.log('🐾 New Jag Session');
            localStorage.setItem("JagSession", JSON.stringify(JagSession));
            JagSession = JSON.parse(localStorage.getItem("JagSession"));
        }
        else
        {
            JagSession = JSON.parse(localStorage.getItem("JagSession"));
        }

        if ( !JagSession.customerEmail ) {
            console.log('🐾 JAG SET CUSTO');
            JagSession.customerEmail = undefined;
            if ( !JagSession.tsEncartIsHide ) {
                JagSession.tsEncartEmail = Date.now();
                JagSession.tsEncartIsHide = false;
            }
            localStorage.setItem("JagSession", JSON.stringify(JagSession));
        }

        this.cart = []
        for (const product of JagSession.cart) {
            this.cart.push(new ProductCart(product.id, product.quantity))
        }

        if (JagSession.promoCodeInfos)
        {
            this.promoCodeInfos = JagSession.promoCodeInfos
        }
        else
        {
            this.promoCodeInfos = {
                'id' : undefined,
                'amount' : 0,
                'name' : '',
                'minimumAmount' : 0,
                'productsEAN' : [],
                'expires_at' : 0,
                'helper' : '',
            }
        }
        
        this.orderId = JagSession.orderId
        this.orderNumber = JagSession.orderNumber
        this.orderTotalAmount = JagSession.orderTotalAmount
        this.orderShippingCost = JagSession.orderShippingCost
        this.orderItems = JagSession.orderItems
        this.session_id = JagSession.session_id
        this.session_creation_time = JagSession.session_creation_time
        this.customerEmail = JagSession.customerEmail
        this.tsEncartEmail = Date.now();
        this.tsEncartIsHide = false;
        //this.promoCode = JagSession.promoCode
        
        if (this.orderId != undefined) {
            console.log('🐾 ' + this.orderId.toString());
        }   
    }

    findProductIndexById(id) {
        return this.cart.findIndex(product =>
            product.id.price.id === id.price.id
        )
    }

    viewItem(id) {
        console.log("event", "view_item", id);
        gtag("event", "view_item", {
            currency: "EUR",
            value: Number(id.price.price) / 100,
            items: [
                {
                  item_id: id.sku,
                  item_name: id.name,
                  price: Number(id.price.price) / 100,
                  quantity: 1
                }
              ]
        });
    }

    addItem(id, count = 1) {
      
        let labeltocart = getTrad(id.name + ' ajouté au panier', id.name + ' add to cart');
        //showAddCart(labeltocart, false)
        const cardProduct = new ProductCart(id, count)

        console.log("event", "add_to_cart", id);
        gtag("event", "add_to_cart", {
            currency: "EUR",
            value: Number(id.price.price) / 100,
            items: [
                {
                  item_id: id.sku,
                  item_name: id.name,
                  price: Number(id.price.price) / 100,
                  quantity: 1
                }
              ]
        });

        //Gtag conversion (ajout)
        gtag('event', 'conversion', {
            'send_to': 'AW-726660854/6--KCJCjh7cZEPbtv9oC'
        });
        console.log("event", "conversion pushed");
        
        this.cart.push(cardProduct)
        this.saveCart({ event: { 
            type: "addItem", 
            id: id, 
            count: count
         } })
        hideSubscription()
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
        console.log("event", "remove_from_cart", id);
        gtag("event", "remove_from_cart", {
            currency: "EUR",
            value: Number(id.price.price) / 100,
            items: [
                {
                  item_id: id.sku,
                  item_name: id.name,
                  price: Number(id.price.price) / 100,
                  quantity: 1
                }
              ]
        });
        this.saveCart({ event: { type: "removeItem", id: id, count: count } })
    }

    clearItem(id) {
        const productIndex = this.findProductIndexById(id)
        if (productIndex < -1) {
            throw new Error();
        }
        this.cart.splice(productIndex, 1)
        this.saveCart({ event: { type: "clearItem", id: id } })
        console.log('--' + id.toString())
    }

    hasDock() {
        return this.cart.some((e) => { return e.id.metadata.sku.startsWith("JAG-GPS-S2-PLUS") });
    }

    RemoveSession() {
        // On vide la session, le panier car l'achat a bien été fait
        console.log('RemoveSession')
    }

    RemoveCartItems() {
        console.log('RemoveCartItems')
    }

    getTotalPrice() {
        let totalPrice = 0;
        this.cart.forEach((productCart) => {
            console.log("productCart", productCart);
            totalPrice += Number(productCart.id.price.price) * productCart.quantity
        })
        return totalPrice
    }

    getPromoCodeDatas = async (promoCodeId) => {
        /*try {
            const answer = await fetch(`${interfaceUrl}/stripe/promo_code/${promoCodeId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
            const answerJson = await answer.json();
            return answerJson;
        } catch (_) {
            return null;
        }*/
       return null
    }

    getPromoCode = async () => {
        const queryParams = new URLSearchParams(document.location.search);
        let promoCodeId = queryParams.get('promoCodeId');
        let codeHelper = ''

        console.log("promo code : ", promoCodeId);

        if (!promoCodeId) {
            let JagSession = JSON.parse(localStorage.getItem("JagSession"))
            if ( JagSession.customerEmail && ( JagSession.customerEmail != '' ) && ( JagSession.customerEmail != 'undefined' ) )
            {
                promoCodeId = '611vwK8n' ; // LOVEJAG
                promoCodeId = 'hXbVDcY2' ; // 10ANS
            }
            else {
                console.log(this.promoCodeInfos)
                this.applyCodeHelper()
                return;
            }
        }
        
        console.log('start check promo', promoCodeId);

        let codePromoInfos = await fetch(`${interfaceUrl}/stripe/promo_code/${promoCodeId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }).then(res => res.json())
        
        console.log('codePromoInfos', codePromoInfos)

        if ( (codePromoInfos.success == true) && (codePromoInfos.promoCode.valid == true) ) {
            let productsEAN = [];
            if (codePromoInfos.promoCode.metadata.products) {
                productsEAN = codePromoInfos.promoCode.metadata.products;
            }

            let minimumAmount = 0;
            if (codePromoInfos.promoCode.restrictions.minimum_amount) {
                minimumAmount = codePromoInfos.promoCode.restrictions.minimum_amount;
            }

            console.log(codePromoInfos.promoCode.expires_at, Date.now());

            if ( (codePromoInfos.promoCode.expires_at * 1000) > Date.now() ) {

                if ( codePromoInfos.promoCode.id == '96poDEs6')
                {
                    codeHelper = '30€ de réduction avec le code JUNE30 sur les JAG GPS avec Smartdock et 20€ avec le code JUNE20 sur les JAG GPS.'
                }

                if ( codePromoInfos.promoCode.id == 'hXbVDcY2')
                {
                    codeHelper = 'Pour les 10ANS de Jagger, 30€ de réduction avec le code 10ANS sur les JAG GPS avec Smartdock. Soit le coffret à 169.00€'
                }

                if ( codePromoInfos.promoCode.id == '611vwK8n')
                {
                    codeHelper = 'Profitez de 20€ de réduction avec le code LOVEJAG.'
                }

                let promoCodeInfos = {
                    'id' : codePromoInfos.promoCode.id,
                    'amount' : codePromoInfos.promoCode.amount / 100,
                    'name' : codePromoInfos.promoCode.name,
                    'minimumAmount' : minimumAmount,
                    'productsEAN' : productsEAN,
                    'expires_at' : codePromoInfos.promoCode.expires_at,
                    'helper' : codeHelper,
                }
                shoppingCart.savePromoCode(promoCodeInfos);
            }
            else {
                console.log('code promo expired')
            }
            
        }
        else {
            console.log('code promo not valid')
        }

        console.log(this.promoCodeInfos)
        this.applyCodeHelper()
    }

    savePromoCode(promoCodeInfos) {
        this.promoCodeInfos = promoCodeInfos
        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        JagSession.promoCodeInfos = promoCodeInfos
        localStorage.setItem("JagSession", JSON.stringify(JagSession))
    }

    applyCodePromo() {

        let reductionAmount = 0
        let reductionLabel = ''
        let isApplied = false

        const reductionAmountDiv = document.getElementById('JL_Basket_Discount_Div');
        const reductionAmountSpan = document.getElementById('JL_Basket_Discount_Amount');
        const reductionLabelSpan = document.getElementById('JL_Basket_Discount_Code');

        reductionAmountDiv.style.display = 'none'

        if ( this.promoCodeInfos.id == undefined )
        {
            return reductionAmount;
        }

        if ( this.promoCodeInfos.minimumAmount > this.getTotalPrice() )
        {
            return reductionAmount;
        }

        if ( this.promoCodeInfos.productsEAN == [] )
        {
            reductionAmount = this.promoCodeInfos.amount;
            reductionLabel = this.promoCodeInfos.name;
        }
        
        this.cart.forEach((productCart) => {
            if ( this.promoCodeInfos.productsEAN.includes(productCart.id.metadata.productId ) )
            {
                isApplied = true
            }
        })
        
        if (isApplied == false)
        {
            return reductionAmount;
        }

        reductionAmount = JagSession.promoCode.amount
        reductionLabel = JagSession.promoCode.name
        
        if ( document.getElementById('JL_Basket_Discount_Amount') )
        {
            if (reductionAmount > 0) {
                reductionAmountDiv.style.display = 'flex';
                reductionAmountSpan.innerHTML = "- " + reductionAmount.toFixed(2) + " &euro;"
                reductionLabelSpan.innerHTML = "Code " + reductionLabel + " :";
            }
        }
        return reductionAmount

    }

    applyCodeHelper() {
        if (document.getElementById('JL_Basket_Discount_Helper_Div'))
        {
            const reductionAmountHelperDiv = document.getElementById('JL_Basket_Discount_Helper_Div');
            const reductionAmountHelperSpan = document.getElementById('JL_Basket_Discount_Helper_Span');

            reductionAmountHelperSpan.innerHTML = ''
            reductionAmountHelperDiv.style.display = 'none'
            
            if ( this.promoCodeInfos.helper != '') {
                reductionAmountHelperSpan.innerHTML = '<div style="background-color: #e1724f;border-radius: 10px;color: white;padding:5px;"><span>' + this.promoCodeInfos.helper + '</span></div>';
                reductionAmountHelperDiv.style.display = 'flex'
            }
        }

        if (document.getElementById('JL_Basket_Discount_Helper_Div_Popup'))
        {
            const reductionAmountHelperDivPopup = document.getElementById('JL_Basket_Discount_Helper_Div_Popup');
            const reductionAmountHelperPopup = document.getElementById('JL_Basket_Discount_Helper_Popup');

            reductionAmountHelperPopup.innerHTML = ''
            reductionAmountHelperDivPopup.style.display = 'none'
            
            if ( this.promoCodeInfos.helper != '') {
                reductionAmountHelperPopup.innerHTML = this.promoCodeInfos.helper
                reductionAmountHelperDivPopup.style.display = 'flex'
            }
        }   
        
        return true
    }
    
    getDeliveryPrice() {
        let deliveryPrice = 0; // + 5.99
        const deliveryAmountSpan = document.getElementById('JL_Basket_Delivery_Amount');
        const deliveryAmountLabel = document.getElementById('JL_Basket_Delivery_Label');

        if (deliveryPrice > 0) {
            deliveryAmountLabel.style.display = 'block';
            deliveryAmountLabel.innerHTML = getTrad('Livraison', 'Delivery');
            deliveryAmountSpan.innerHTML = price.toFixed(2) + " &euro;"
        }
        else
        {
            deliveryAmountLabel.style.display = 'none';
            deliveryAmountSpan.innerHTML = getTrad("Livraison Offerte", "Free Delivery"); 
            deliveryAmountSpan.style.width = '100%'
        }
        console.log(deliveryPrice);
        return deliveryPrice;
    }

    setTotalPrice() {
        let cartAmountTotal = this.getTotalPrice(); 
        let deliveryPrice = this.getDeliveryPrice();

        if (deliveryPrice > 0) {
            const cartAmountDiv = document.getElementById('JL_Basket_Cart_Div');
            cartAmountDiv.style.display = 'flex';
            
            const cartAmountSpan = document.getElementById('JL_Basket_Cart_Amount');
            cartAmountSpan.innerHTML = cartAmountTotal.toFixed(2) + " &euro;"
        }       

        //let reductionAmount = this.applyCodePromo(); 
        this.applyCodeHelper();

        let reductionAmount = 0;

        console.log(cartAmountTotal, deliveryPrice, reductionAmount);

        let totalPrice = cartAmountTotal + deliveryPrice - reductionAmount;
        const totalAmountSpan = document.getElementById('JL_Basket_Total_Amount');
        totalAmountSpan.innerHTML = totalPrice.toFixed(2) + " &euro;"

        return totalPrice.toFixed(2);
    }

    saveOrderId(orderId) {
        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        JagSession.orderId = orderId
        localStorage.setItem("JagSession", JSON.stringify(JagSession))
        console.log('🐾 JAG orderId Saved ', this.orderId)
    }

    getQueryCustomerEmail = async () => {
        const queryParams = new URLSearchParams(document.location.search);
        let customerEmail = queryParams.get('cml');

	    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	    if ( emailPattern.test(customerEmail) ) {
            this.saveCustomerEmail(customerEmail)
        }
    }

    saveCustomerEmail(customerEmail) {
        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        JagSession.customerEmail = customerEmail
        localStorage.setItem("JagSession", JSON.stringify(JagSession))
        console.log('🐾 JAG CUSTO IS ON FIRE');
    }

    hideCustomerEmail() {
        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        JagSession.tsEncartEmail = Date.now();
        JagSession.tsEncartIsHide = true;
        localStorage.setItem("JagSession", JSON.stringify(JagSession))
        console.log('🐾 JAG BYE COCODE');
    }

    undoCustomerEmail() {
        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        JagSession.tsEncartEmail = Date.now() - 90000000;
        JagSession.tsEncartIsHide = false;
        JagSession.customerEmail = undefined;
        localStorage.setItem("JagSession", JSON.stringify(JagSession))
        console.log('🐾 JAG BYE COCODE');
    }

    askCustomerEmail() {
        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        //console.log ( JagSession.customerEmail , JagSession.tsEncartEmail, JagSession.tsEncartIsHide )
        if ( JagSession.customerEmail && ( JagSession.customerEmail != '' ) && ( JagSession.customerEmail != 'undefined' ) )
        {
            console.log('🐾 JAG CUSTO IS FINE');
            return false;
        }
        
        if ( JagSession.tsEncartIsHide )
        {
            if (JagSession.tsEncartEmail < ( Date.now() - 86400000 )) {
                console.log('🐾 JAG CUSTO [RE]-ASK');
                return true;
            }
            else 
            {
                console.log('🐾 JAG CUSTO WAIT');
                return false;
            }
        } 
        console.log('🐾 JAG CUSTO ASK');
        return true;
    }

    saveCart({ callApi = true, event } = {}) {
        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        JagSession.cart = this.cart
        console.log("JagSession", JagSession);
        localStorage.setItem("JagSession", JSON.stringify(JagSession))
        setCartNbItems();

        if (callApi) {
            this.updateCartInDb({ event }).then(answer => {
                answer.json().then(answerJson => {
                    if (answerJson.success) {
                        this.orderId = answerJson.orderId;
                        this.saveOrderId(answerJson.orderId);
                    }
                })
            })
        }
    }

    getCartStripeUrl() {
        const url = window.location.origin + window.location.pathname;
        let value = this.cart.map((e) => { return { id: e.id.price.id, quantity: e.quantity } });

        //let infosCart = {cart: value,orderId: this.orderId, mode: 'payment', referer: url, 'promoCodeId' : this.promoCodeId };
        let infosCart = {cart: value,orderId: this.orderId, mode: 'payment', referer: url };

        let JagSession = JSON.parse(localStorage.getItem("JagSession"))
        if ( JagSession.customerEmail && ( JagSession.customerEmail != '' ) && ( JagSession.customerEmail != 'undefined' ) ) {
            infosCart['customerEmail'] = JagSession.customerEmail
        }

        const answer = fetch(`${interfaceUrl}/stripe/checkout_session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(infosCart)
        })
        return answer
    }

    updateCartInDb({ event } = {}) {
        const JagSession = JSON.parse(localStorage.getItem("JagSession"))
        try {
            const answer = fetch(`${interfaceUrl}/stripe/cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart: JagSession.cart,
                    orderId: JagSession.orderId,
                    event: event,
                    customerEmail : JagSession.customerEmail,
                })
            })
            return answer
        }
        catch (e) {
            console.error("Error Saving CartDB", e)
            return {success:false}
        }
    }

    recreateCart(cart) {
        this.cart.length = 0;
        const cart_items = [];
        for (const product of cart) {
            //this.addItem(product.id, product.quantity);
            const cardProduct = new ProductCart(product.id, product.quantity)
            this.cart.push(cardProduct)
            cart_items.push({
                'item_id': product.id.metadata.productId,
                'item_name': product.id.metadata.title_fr,
                'item_brand': "Jagger & Lewis",
                'item_variant': product.id.metadata.colorId,
                'price': product.id.price.price,
                'quantity': product.quantity
            });
        }
            
        let cart_totalPrice = shoppingCart.setTotalPrice();
        let view_cart_event = {
            currency: "EUR",
            value: cart_totalPrice,
            items: cart_items,
        }
        console.log("event", "view_cart", view_cart_event);
        gtag("event", "view_cart", view_cart_event);
    }
}

const shoppingCart = new ShoppingCart();

let products = []

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

// Permet de faire bouger le slider
const SlideToColor = (ColorProduct) => {

    slides = document.getElementById('jl-slide-mask-product');
    withSlide = slides.offsetWidth;

    if (ColorProduct == 'fauve') {nbSlide = 0};
    if (ColorProduct == 'weimar') {nbSlide = 1};
    if (ColorProduct == 'charbon') {nbSlide = 2};

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

const initAboB = async () => {}

const refreshOrderInfo = async () => {

    document.getElementById('JL_CHECKOUT_LOADER').style.display = 'block';
    document.getElementById('JL_CHECKOUT_INFOS').style.display = 'none';

    // Désormais la fonction est traitée sur WFL
    if (!document.getElementById('JL_ORDER')) {
        console.log('🐾 JAG WRONG CONTENT')
        return false
    }

    document.getElementById('JL_ORDER').style.display = 'none';

    let session_id = new URLSearchParams(window.location.search).get('session_id')
    let orderDatas = await fetch(`${interfaceUrl}/stripe/checkout_session/` + session_id + '/cart').then(res => res.json())

    console.log('🐾 JAG CS DATAS', orderDatas)

    if (document.getElementById('JL_ORDER')) {
        document.getElementById('JL_ORDER_ID').textContent = orderDatas.orderNumber
        document.getElementById('JL_ORDER').style.display = 'flex';
    }

    if (document.getElementById('JL_USER_EMAIL')) {
        try {
            document.getElementById('JL_USER_EMAIL').textContent = orderDatas.aside_data.customerDetails.email ;
        }
        catch (e)  {
            console.log('🐾 JAG CS DATAS NO EMAIL');
        }
    }

    document.getElementById('JL_CHECKOUT_INFOS').style.display = 'flex';
    document.getElementById('JL_CHECKOUT_LOADER').style.display = 'none';

    let orderItems = [];
    let orderTotalAmount = 0;
    let orderShippingCost = 0;
    let orderNumber = orderDatas.orderNumber

    let cartItems = orderDatas.aside_data.cart ;

    for (i = 0; i < cartItems.length; i++) {

        let item = cartItems[i];

        let itemColor = '';
        if (item.description) {
            if (item.description.toLowerCase().indexOf('weimar') > -1) { itemColor = 'Weimar'; }
            if (item.description.toLowerCase().indexOf('fauve') > -1) { itemColor = 'Fauve'; }
            if (item.description.toLowerCase().indexOf('charbon') > -1) { itemColor = 'Charbon'; }
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

        orderTotalAmount += item.amount_total
        orderItems.push(newItem)
    }
    
    orderTotalAmount = orderTotalAmount + orderShippingCost;
    orderTotalTax = parseInt(orderTotalAmount / 1.2);

    purchaseInfos = {
        'transaction_id': orderNumber,
        'value': orderTotalAmount / 100,
        'tax': orderTotalTax / 100,
        'shipping': orderShippingCost / 100,
        'currency': "EUR",
        'items': orderItems
    }

    gtag("event", "purchase", purchaseInfos);

    console.log('🐾 JAG gtag Purchase Sent', purchaseInfos)

    conversionValue = {
        'send_to': 'AW-726660854/rlPfCLWfg7cZEPbtv9oC',
        'value': orderTotalAmount / 100,
        'currency': 'EUR',
        'transaction_id': orderNumber
    }
    gtag('event', 'conversion', conversionValue);

    console.log('🐾 JAG gtag Conversion Sent', conversionValue)
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

const init = async () => {

    console.log('🐾 JAG IS HERE ' + JL_pageId)

    if (JL_NavBar) {
        document.getElementById('JL_Basket_Item').style.display = 'none';
        document.getElementById('JL_Basket_Empty').style.display = 'block';
        document.getElementById('jl-cart-number').addEventListener('click', (event) => showNewCart(event))
        document.getElementById('jag-cart').addEventListener('click', (event) => showNewCart(event))
        document.getElementById('JL_Btn_Close_Basket').addEventListener('click', () => {
            hideSubscription()   
            document.getElementById('JL_Basket_Container').style.display = 'none';
            document.getElementById('JL_Btn_Close_Basket').style.display = 'none';
            document.getElementById('JL_Basket_Cart_Div').style.display = 'none';
            document.getElementById('JL_Basket_Discount_Div').style.display = 'none';
        })
    }

    if (document.getElementById('JL_Abo_Newsletter')) { //USED
        initNewsLettre()
    }

    if (document.getElementById('jl-collar')) { //USED
        initJagGPS();
    }

    
    if (document.getElementById('jl-checkout-redirect')) { //NOT USED - WFL
        //refreshOrderInfo();
    }

    if (JL_pageId == 'confirm_checkout') {
        refreshOrderInfo();
    }

    setCartNbItems();
    page = window.location.href.split('/')[3].split('?')[0];

    console.log("prepare promo code")
    
    shoppingCart.getPromoCode();
    shoppingCart.getQueryCustomerEmail()

}

const hideSubscription = () => {
    if (typeof abo_list == 'undefined') {
        return
    }
    // Find subscription in cart
    let productId = shoppingCart.cart.filter((elem) => elem.id.metadata.subscription==true)[0]?.id?.metadata?.productId
    let sub_list = [...abo_list].filter((elem) => elem.getAttribute('jl_category') == 'subscription')
    sub_list.forEach((elem) => {
        // able subscription   
        elem.style.backgroundColor = null
        elem.style.color = null
        elem.style.pointerEvents = "auto";
    })
    if (productId) {
        // Get subscription node in page
        sub_list.forEach((elem) => {
            // Find subscription defferent that in cart
            if (elem.getAttribute('jl_productId') != productId ) {
                // Disable subscription   
                elem.style.backgroundColor = '#f5f5f5'
                elem.style.color = "#00000052"
                elem.style.pointerEvents = "none";
            }
        })
    }
}

const redirectToStripe = async (event) => {
    console.log('Start Checkout')
    try {
        event.preventDefault();
    }
    catch (e) {}
    shoppingCart.cart.forEach((elem) => {
        if (elem.id.price.id == 'price_1Q5pKjADzHYMiB1YAxkcjLSv') {
            elem.id.price.id = 'price_1P9Nh8ADzHYMiB1Y0XMZ9v4y'
        }
        if (elem.id.price.id == 'price_1QIBgoADzHYMiB1Y6CQ1JsIu') {
            elem.id.price.id = 'price_1P9NihADzHYMiB1YCTWgreKk'
        }
    
    })

    const apiRes = await shoppingCart.getCartStripeUrl()
    //console.log("apiRes", apiRes);

    const apiResJson = await apiRes.json()
    //console.log("apiResJson", apiResJson);

    //Appel du Tag Manager pour le checkout puis redirection vers stripe
    if (apiResJson.url) {
        try {
            console.log('event','begin_checkout', apiResJson.url);
            gtag("event", "begin_checkout", {
                event_callback: function () {
                    window.location.href = apiResJson.url
                },
            });
        } catch (e) {
            console.log('error with tag manager : ', e)
        }
        //window.location.href = apiResJson.url
    }
    else {
        showAddCart('', true)
    }
}

const showNewCart = (event) => {
    try {
        
        event.preventDefault();
    } catch (_) {}

    document.getElementById('JL_Basket_Valide_Commande').addEventListener('click', (event) => {
        event.preventDefault()
        redirectToStripe()
        document.activeElement.blur();
    })

    function clearCartPopup() {
        const myElement = document.getElementById("JL_Basket_Items");
        for (const child of myElement.children) {
            if (child.id != 'JL_Basket_Item') {
                child.remove();
            }
        }
    }

    function noItems() {
        document.getElementById('JL_Btn_Close_Basket').style.display = 'block';
        document.getElementById('JL_Basket_Empty').style.display = 'flex';
        // document.getElementById('JL_Basket_Content').style.display = 'none';
        document.getElementById('JL_Basket_Items').style.display = 'none';
        // document.getElementById('JL_Basket_Delivery_Amount').style.display = 'none';
        // document.getElementById('JL_Basket_Info_Abo').style.display = 'none';
        document.getElementById('JL_Basket_Boutons').style.display = 'none';
        document.getElementById('JL_Basket_Container').style.display = 'flex';
        document.getElementById('JL_Basket_Total').style.display = 'none';
    }

    function createLine(itemLine) {
        let element = document.getElementById('JL_Basket_Item');

        let newItem = element.cloneNode(true);
        newItem.setAttribute('id', 'JL_Basket_Item_' + itemLine);

        for (const child of newItem.childNodes) {
            if (child.hasChildNodes()) {
                child.childNodes.forEach((e, i) => {
                    if (e.hasChildNodes()) {
                        e.childNodes.forEach((eChild, i) => {
                            if (eChild.id.startsWith('JL_Basket_Item')) {
                                eChild.setAttribute('id', eChild.id + '_' + itemLine);
                            }
                        });
                    }
                    else {
                        if (e.id.startsWith('JL_Basket_Item')) {
                            e.setAttribute('id', e.id + '_' + itemLine);
                        }
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

    clearCartPopup();

    let cart_items = [];

    shoppingCart.cart.forEach((prod) => {
        createLine(nbItem);
        
        document.getElementById('JL_Basket_Item_Label_' + nbItem).innerHTML =  getTrad(prod.id.metadata.title_fr, prod.id.metadata.title_en);
        if (prod.id.metadata.colorId != 'undefined')
            {
                document.getElementById('JL_Basket_Item_Color_' + nbItem).innerHTML =  prod.id.metadata.colorId;
            }
        else {
            document.getElementById('JL_Basket_Item_Color_' + nbItem).innerHTML =  '';
        }
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
            console.log('event','remove_from_cart');
            gtag("event", "remove_from_cart",
                {
                    'currency': "EUR",
                    'value': prod.id.price.price / 100,
                    'items': [
                        {
                            'item_id': prod.id.metadata.productId,
                            'item_name': prod.id.metadata.title_fr,
                            'item_brand': "Jagger Lewis",
                            'item_variant': prod.id.metadata.colorId,
                            'price': prod.id.price.price / 100,
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
    let view_cart_event = {
        currency: "EUR",
        value: cart_totalPrice,
        items: cart_items,
    }
    console.log("event", "view_cart", view_cart_event);
    gtag("event", "view_cart", view_cart_event);

    document.getElementById('JL_Btn_Close_Basket').style.display = 'block';
    document.getElementById('JL_Basket_Total').style.display = 'flex';
    document.getElementById('JL_Basket_Boutons').style.display = 'flex';
    document.getElementById('JL_Basket_Item').style.display = 'none'; // Ligne vide de modèle
    document.getElementById('JL_Basket_Empty').style.display = 'none';
    // document.getElementById('JL_Basket_Info_Abo').style.display = 'flex';
    document.getElementById('JL_Basket_Container').style.display = 'flex';
    document.getElementById('JL_Basket_Content').style.display = 'block';
    document.getElementById('JL_Basket_Items').style.display = 'flex';

}

const showAddCart = (text, isError) => {
    if (isError) {
        text = getTrad('Oups, une erreur est survenue, rechargez la page', 'Oops, an error has occurred, reload the page')
    }
    document.getElementById('JL_AddCart_Snack_Label').textContent = text
    document.getElementById('JL_AddCart_Snack').style.display = 'block';

    setTimeout(function () { document.getElementById('JL_AddCart_Snack').style.display = 'none' }, 3000);
}

if (document.getElementById("validate-cart"))
{   
    // Adx
    document.getElementById("validate-cart").onclick = (event) => {
        redirectToStripe(event)
    };
}

var colors = ['fauve', 'weimar', 'charbon'];
var devices = ['jag', 'jag-smartdock'];
var initialColor = 'fauve';
var initialDevice = 'jag-smartdock';

const appendPage = (url) => {
    let s = document.createElement('script')
    s.type = 'text/javascript'
    s.src = url
    document.getElementsByTagName('head')[0].appendChild(s)
}

if (typeof JL_pageId === 'undefined') {
  // Your variable is undefined
  JL_pageId = '';
}

if ( document.getElementById('JL_NavBar') || JL_pageId == 'confirm_checkout' ) {
    init();
    if ( document.getElementById('jl-product-selector-global') ) {
        console.log('launch webflow embed script viewItem');
        viewItem_EmbedWebflow();
        hideSubscription();

    }
    let queryParams = new URLSearchParams(document.location.search);
    var stripe_cancel = queryParams.get("stripe_cancel")
    if (stripe_cancel != null) {
        console.log("event", "stripe_cancel")
    }
}
else {
    appendPage('https://cdnjs.cloudflare.com/ajax/libs/lottie-player/2.0.4/lottie-player.js')
    appendPage('https://webcart.jagger-lewis.com/jlclient.js')
}

const getEventDatas = async (eventId) => {
    try {
        const answer = await fetch(`${interfaceUrl}/event/${eventId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })
        const answerJson = await answer.json();
        return answerJson;
    } catch (_) {
        return null;
    }
}

try {
    if (JLCart) {
        const queryParams = new URLSearchParams(document.location.search);
        const eventId = queryParams.get("eventId");
        const promoCodeId = queryParams.get("promoCodeId");
        getEventDatas(eventId).then((res) => {
            const eventDatas = res.result.event.datas;
            shoppingCart.saveOrderId(eventDatas.order._id);
            shoppingCart.saveCustomerEmail(eventDatas.customer.email);
            shoppingCart.recreateCart(eventDatas.order.aside_data.cart);
            shoppingCart.saveCart({ event: { type: "recreate Cart", cart: eventDatas.order.aside_data.cart } });
            init();
        })
        getPromoCodeDatas(promoCodeId).then((res) => {
            const promoCodeDatas = res.promoCode;
            shoppingCart.savePromoCode(promoCodeDatas);
            console.log("shoppingCart", shoppingCart)
        })
    }
} catch (_) {}

