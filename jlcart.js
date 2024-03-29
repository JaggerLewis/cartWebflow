//const commander = document.querySelector('#jag-cart')
//commander.setAttribute("data-toggle", "modal")
//commander.setAttribute("data-target", "#cart")

const body = document.querySelector("body");
const JL_NavBar = document.getElementById('JL_NavBar')

if (document.querySelector('#jl-aqua-modal'))
{
    document.addEventListener('scroll', (event) => document.querySelector('#jl-aqua-modal').style.display = 'none')
}

let snack = document.createElement('div')
snack.innerHTML = '<div class="jl-snack-icon-container"><img class="jl-snack-icon" id="jl-snack-icon"></img></div><div class="jl-snack-text-container" id="jl-snack-text-container"></div>'
snack.id = 'jl-snackbar'
document.querySelector("body").appendChild(snack)

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

function displayPrice (price) {
    return  price % 1 == 0 
            ? price + '.00'
            :  (price % 0.1).toFixed(5) == 0
                ?price+ '0' 
                : '' + price
}

const setCartNumber = () => {
    if (JL_NavBar)
    {
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
        } else {
            this.cart = []
        }
    }

    findProductIndexById(id) {
        console.log(this.cart.findIndex(product => {
            product.id.price.id === id.price.id
        }
            
        ))
        return this.cart.findIndex(product => 
             product.id.price.id === id.price.id
        )
    }

    addItem(id, count = 1) {
        let maxProductinCart = 4
        if (this.countItems() >= maxProductinCart) {
            //showSnackBar('Vous ne pouvez pas ajouter plus de 4 éléments au panier', true)
            let labeltocart = getTrad( 'Vous ne pouvez pas ajouter plus de ' + maxProductinCart + ' articles au panier', "You can't add more than " + maxProductinCart + " products in your cart");
            showAddCart( labeltocart, true)
            return
        }
        //showSnackBar(id.name + ' ajouté au panier', false)
        let labeltocart = getTrad( id.name + ' ajouté au panier', id.name + ' add to cart');
        showAddCart(labeltocart, false)
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
        let price = this.getTotalPrice() + 5.99
        //const totalSpan = document.querySelector('#jl-total')
        const totalSpan = document.getElementById('JL_Basket_Total_Amount');
        totalSpan.innerHTML = price.toFixed(2) + " &euro;"
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
    try {
        const answer = await fetch("https://api.jagger-tracker.com/stripe/products", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })
        return answer
    }
    catch(e) {
        return await setTimeout(async() => {
            return await getProductsFromStripe()
          }, "1000");
    }
    
}

const getAbonnementFromStripe = async () => {
    const answer = await fetch("https://api.jagger-tracker.com/stripe/products/category/subscription", {
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

const colorButtonSelect = (newBtn, attribut, Newclass, is_text) => {
    //let btn = document.querySelector(newBtn)

    newBtn = newBtn.replace('#','');

    let btn = document.getElementById( newBtn );

    if (btn == null) {
        console.log('not_find', newBtn);
        return false;
    }

    let oldBtn = document.querySelectorAll('['+attribut+'=true]')
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

const findProduct = (product, color)=> {
    let filtered = products.filter(elem => elem.metadata.productId == product)
  
    if (color != null)
        filtered = filtered.filter(elem => elem.metadata.colorId == color)

    return filtered[0]
}

const findAbonnement = (product)=> {
    let filtered = abonnement.find(elem => elem.metadata.productId == product)
    console.log(filtered);

    return filtered
}

const findAboType = (abo, type) => {
    let filtered =  abo.prices.find(elem => elem.metadata.pricing == type)

    return filtered
}

const getTargetProduct = () => {
    smartboxIsChecked = document.getElementById('btn_add_smartdock').getAttribute('isChecked');
    if ( smartboxIsChecked == 'yes') {
        targetProduct = 'jag-smartdock';
    }
    else
    {
        targetProduct = 'jag';
    }
    return targetProduct;
}

const initJagGPS = async () => {

    let collar = document.getElementById('jl-collar')
    let initialColor = 'fauve' ;

    //document.querySelectorAll('#btn-color-fauve').forEach(element => element.addEventListener('click', (event) => {
    document.getElementById('btn_boitier_color_fauve').addEventListener('click', (event) => {
        event.preventDefault()
        let targetProduct = getTargetProduct();
        colorButtonAction(collar, findProduct(targetProduct, 'fauve').image, findProduct(targetProduct, 'fauve').price.id )
        colorButtonSelect('btn-color-fauve', 'color-selected', 'txt-color-selected', true)
        document.activeElement.blur();
    })
    //document.querySelectorAll('#btn-color-weimar').forEach(element => element.addEventListener('click', (event) => {
    document.getElementById('btn_boitier_color_weimar').addEventListener('click', (event) => {
        event.preventDefault()
        let targetProduct = getTargetProduct();
        colorButtonAction(collar, findProduct(targetProduct, 'weimar').image, findProduct(targetProduct, 'weimar').price.id )
        colorButtonSelect('btn-color-weimar', 'color-selected', 'txt-color-selected', true)
        document.activeElement.blur();
    })
    //document.querySelectorAll('#btn-color-charbon').forEach(element => element.addEventListener('click', (event) => {
    document.getElementById('btn_boitier_color_charbon').addEventListener('click', (event) => {
        event.preventDefault()
        let targetProduct = getTargetProduct();
        colorButtonAction(collar, findProduct(targetProduct, 'charbon').image, findProduct(targetProduct, 'charbon').price.id )
        colorButtonSelect('btn-color-charbon', 'color-selected', 'txt-color-selected', true)
        document.activeElement.blur();
    })

    document.getElementById('jag-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let product = products.find(elem => elem.price.id == collar.getAttribute('data-selected'))
        shoppingCart.addItem(product, 1)
        document.activeElement.blur();
    })

    document.getElementById('btn_add_smartdock').setAttribute('isChecked','no');

    document.getElementById('btn_add_smartdock').addEventListener('click', (event) => {
        event.preventDefault()
        switchSmartdock();
        document.activeElement.blur();
    })

    document.getElementById('price-jag').innerHTML = findProduct('jag', initialColor).price.price;
    collar.setAttribute('data-selected', findProduct('jag', initialColor).price.id)
    collar.srcset = findProduct('jag', 'fauve').image
    colorButtonSelect('#btn-color-' + initialColor, 'color-selected', 'txt-color-selected', true)

    return true;
}

const initSmartDockAlone = async () => {
    let smartdock = document.getElementById('jag-smartdock-alone')

    let priceLabel = document.getElementById('price-jag')
    let btnAddBasket = document.getElementById('btn-buy-smartdock-alone')
    
    if ( !priceLabel ) { return false; }
    if ( !btnAddBasket ) { return false; }

    smartdockProduct = findProduct('smartdock');
    console.log(smartdockProduct);

    priceLabel.innerHTML = smartdockProduct.price.price;
    btnAddBasket.addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(smartdockProduct, 1)
        document.activeElement.blur();
    })

}

const switchSmartdock = () => {

    smartboxIsChecked = document.getElementById('btn_add_smartdock').getAttribute('isChecked');

    if ( smartboxIsChecked == 'yes') {
        document.getElementById('btn_add_smartdock').setAttribute('isChecked','no');
        document.getElementById('btn_add_smartdock').classList.remove('add_smartdock_checked');
        targetProduct = 'jag';
    }
    else
    {
        document.getElementById('btn_add_smartdock').setAttribute('isChecked','yes');
        document.getElementById('btn_add_smartdock').classList.add('add_smartdock_checked');
        targetProduct = 'jag-smartdock';
    }

    colors = ['fauve', 'weimar', 'charbon'] ;
    colorChanged = false;

    let collar = document.getElementById('jl-collar')
    colors.forEach( (color) => {
        theBtnColor = document.getElementById('btn-color-' + color);
        console.log(theBtnColor);

        if ( theBtnColor.getAttribute('color-selected') == 'true' )
        {
            colorChanged = true;
            colorButtonAction(collar, findProduct(targetProduct, color).image, findProduct(targetProduct, color).price.id );
            colorButtonSelect('btn-color-' + color, 'color-selected', 'txt-color-selected', true);
            console.log( findProduct(targetProduct, color) );
            document.getElementById('price-jag').innerHTML = findProduct(targetProduct, color).price.price;
            console.log(targetProduct,color);
        }
    })

    if (colorChanged == false) {
        color = 'fauve';
        targetProduct = 'jag';
        colorButtonAction(collar, findProduct(targetProduct, color).image, findProduct(targetProduct, color).price.id );
        colorButtonSelect('btn-color-' + color, 'color-selected', 'txt-color-selected', true);
        console.log( findProduct(targetProduct, color) );
        document.getElementById('price-jag').innerHTML = findProduct(targetProduct, color).price.price;
        console.log(targetProduct,color);
    }


    
}

const initHome = async () => {
    
    let collar = document.querySelector('#jl-collar')
    let dock = document.querySelector('#jl-dock')
    document.querySelector('#price-jag').innerHTML =  document.querySelector('#price-jag').innerHTML.replace('{price}',findProduct('jag', 'fauve').price.price) 
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
        colorButtonAction(collar, findProduct('jag', 'fauve').image, findProduct('jag', 'fauve').price.id )
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    }))
    //document.querySelectorAll('#btn-color-weimar').forEach(element => element.addEventListener('click', (event) => {
    document.querySelectorAll('#btn_boitier_color_weimar').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'weimar').image, findProduct('jag', 'weimar').price.id )
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    }))
    //document.querySelectorAll('#btn-color-charbon').forEach(element => element.addEventListener('click', (event) => {
    document.querySelectorAll('#btn_boitier_color_charbon').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'charbon').image, findProduct('jag', 'charbon').price.id )
        colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    }))

    /*
    document.querySelectorAll('#txt-color-fauve').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'fauve').image, findProduct('jag', 'fauve').price.id )
         colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    }))
    document.querySelectorAll('#txt-color-weimar').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'weimar').image, findProduct('jag', 'weimar').price.id )
         colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    }))
    document.querySelectorAll('#txt-color-charbon').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'charbon').image, findProduct('jag', 'charbon').price.id )
         colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    }))
    */

    /*
    document.querySelector('#btn-dock-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, findProduct('jag-smartdock', 'fauve').image, findProduct('jag-smartdock', 'fauve').price.id )
        colorButtonSelect('#btn-dock-color-fauve', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#btn-dock-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, findProduct('jag-smartdock', 'weimar').image, findProduct('jag-smartdock', 'weimar').price.id )
        colorButtonSelect('#btn-dock-color-weimar', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#btn-dock-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, findProduct('jag-smartdock', 'charbon').image, findProduct('jag-smartdock', 'charbon').price.id )
        colorButtonSelect('#btn-dock-color-charbon', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-dock-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, findProduct('jag-smartdock', 'fauve').image, findProduct('jag-smartdock', 'fauve').price.id )
        colorButtonSelect('#btn-dock-color-fauve', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-dock-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, findProduct('jag-smartdock', 'weimar').image, findProduct('jag-smartdock', 'weimar').price.id )
        colorButtonSelect('#btn-dock-color-weimar', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-dock-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, findProduct('jag-smartdock', 'charbon').image, findProduct('jag-smartdock', 'charbon').price.id )
        colorButtonSelect('#btn-dock-color-charbon', 'color-dock-selected', 'jl-color-selected', true)
    })
    */
   
    collar.setAttribute('data-selected', findProduct('jag', 'fauve').price.id)
    collar.srcset = findProduct('jag', 'fauve').image
    dock.setAttribute('data-selected', findProduct('jag-smartdock', 'fauve').price.id)
    dock.srcset = findProduct('jag-smartdock', 'fauve').image
    colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    colorButtonSelect('#btn-dock-color-fauve', 'color-dock-selected', 'jl-color-selected', true)

}

const initCollar = async ()  => {
    let collar = document.querySelector('#page-jag-collar')
    document.querySelector('#abo-dock-price').innerHTML = document.querySelector('#abo-dock-price').innerHTML.replace('{price}', findProduct('jag-smartdock', 'fauve').price.price) 
    document.querySelector('#abo-jag-price').innerHTML = document.querySelector('#abo-jag-price').innerHTML.replace('{price}', findProduct('jag', 'fauve').price.price)
    document.querySelector('#abo-cable-price').innerHTML = document.querySelector('#abo-cable-price').innerHTML.replace('{price}', findProduct('jag-chargingcable').price.price)
    document.querySelector('#abo-coque-price').innerHTML = document.querySelector('#abo-coque-price').innerHTML.replace('{price}', findProduct('jag-sock', 'fauve').price.price)
    console.log
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
        let finalProduct = products.find(elem => elem.metadata.productId == productId && elem.metadata.colorId == color)

        if (finalProduct != null)
            shoppingCart.addItem(finalProduct, 1)
        else 
        showSnackBar("Votre produit n'a pas été trouvé...", true)

    })
    document.querySelector('#btn-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'fauve').image, findProduct('jag', 'fauve').price.id )
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
        
    })
    document.querySelector('#btn-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'weimar').image, findProduct('jag', 'weimar').price.id )
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#btn-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'charbon').image, findProduct('jag', 'charbon').price.id )
        colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'fauve').image, findProduct('jag', 'fauve').price.id )
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
        
    })
    document.querySelector('#txt-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'weimar').image, findProduct('jag', 'weimar').price.id )
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, findProduct('jag', 'charbon').image, findProduct('jag', 'charbon').price.id )
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

const initBox = async ()  => {
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
        fetch('https://api.jagger-tracker.com/newsletter/subscribe', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailValue })
        })
    })
}

const initAccessory = () => {

    document.querySelector('#acc-coque-fauve-price').innerHTML = document.querySelector('#acc-coque-fauve-price').innerHTML.replace('{price}', findProduct('jag-sock', 'fauve').price.price) 
    document.querySelector('#acc-coque-carbon-price').innerHTML = document.querySelector('#acc-coque-carbon-price').innerHTML.replace('{price}',findProduct('jag-sock', 'charbon').price.price) 
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
    
    console.log(accessory);

    document.getElementById('jl-Accessory-model').style.display = 'none';

    function createAccessoryItem(itemLine) {
        let element = document.getElementById('jl-Accessory-model') ;
        
        let newAccess = element.cloneNode(true);
        newAccess.setAttribute('id', 'jl-Accessory-item-' + itemLine );

        for (const child of newAccess.childNodes) {
            if(child.hasChildNodes()) {
                child.childNodes.forEach((e, i)=>{
                    if (e.id.startsWith('jl-Accessory-item')) {
                        e.setAttribute('id', e.id + '-' + itemLine );
                        }
                });
            }
            else
            {
                if (child.id.startsWith('jl-Accessory-item')) {
                    child.setAttribute('id', child.id + '-' + itemLine );
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

        //let id = prod.price.id
        //addHtml(prod, id)
        //addFunction(prod.id, id)

        console.log(access);
        createAccessoryItem(nbAccess);
        document.getElementById('jl-Accessory-item-label-' + nbAccess ).innerHTML = capitalise(getLocalName(access)) ;
        document.getElementById('jl-Accessory-item-ref-' + nbAccess ).innerHTML = access.metadata.productId;
        document.getElementById('jl-Accessory-item-Img-' + nbAccess ).src = access.image ;
        document.getElementById('jl-Accessory-item-Img-' + nbAccess ).removeAttribute('srcset')  ;
        document.getElementById('jl-Accessory-item-price-' + nbAccess ).innerHTML = (access.price.price).toFixed(2) + ' &euro;'; 
        
        document.getElementById('jl-Accessory-item-btn-' + nbAccess).addEventListener('click', (event) => {
            event.preventDefault();
            shoppingCart.addItem(access, 1)
            document.activeElement.blur();
        });

        document.getElementById('jl-Accessory-item-' + nbAccess ).style.display = 'block';
    
        nbAccess++;
    })


}

const loadAbonnement = async () => {
    //loaderContainer.style = null
    
    let date = Date.now()

    //loaderContainer.style.display = 'none'
    abonnement = await (await getAbonnementFromStripe()).json()
    localStorage.setItem('ts-abonnement', date)
    localStorage.setItem('abonnement', JSON.stringify(abonnement))
}

const updateTime = (search) => {
    var div = document.getElementsByTagName("div");
    var searchText = search ? '1 an':  '1 mois';
    
    for (var i = 0; i < div.length; i++) {
      if (div[i].textContent == searchText) {
        div[i].textContent = search ? '1 mois':  '1 an';
      }
    }
}

const initAboJag = async() => {

    const switchDisplay = () => {
        if ( document.getElementById('abo-facture-mois').className == 'abo_btn_on') {
            toMonth();
        }
        if ( document.getElementById('abo-facture-annee').className == 'abo_btn_on') {
            toYear();
        }
        if (document.getElementById('abo-facture-life').className == 'abo_btn_on') {
            toLife();
        }
    }

    const toMonth = () => {
        document.getElementById('abo-facture-mois').className = 'abo_btn_on' ;
        document.getElementById('abo-facture-annee').className = 'abo_btn_off' ;
        document.getElementById('abo-facture-life').className = 'abo_btn_off' ;
        
        document.getElementById('abo-prix-family-premium').textContent = displayPrice(findAboType(findAbonnement("premium-family"), "monthly").price) + getTrad('€/mois', '€/month') 
        document.getElementById('abo-prix-starter-family').textContent = displayPrice(findAboType(findAbonnement("starter-family"), "monthly").price) + getTrad('€/mois', '€/month')
        document.getElementById('abo-prix-starter').textContent = displayPrice(findAboType(findAbonnement("starter"), "monthly").price) + getTrad('€/mois', '€/month')

        document.getElementById('abo-annee-mois-starter').textContent = getTrad('Sans engagement', 'No obligation') 
        document.getElementById('abo-annee-mois-starter-family').textContent = getTrad('Sans engagement', 'No obligation')
        document.getElementById('abo-annee-mois-family-premium').textContent = getTrad('Sans engagement', 'No obligation')

        document.querySelector('#total-family-premium').innerHTML = "" ; //"Ou " + findAboType(findAbonnement("premium-family"), "yearly").price + "&euro; / an <br> soit <b>" +  (findAboType(findAbonnement("premium-family"), "yearly").price / 12).toFixed(2) + "€</b>/mois"
        document.querySelector('#total-starter-family').innerHTML = ""; // "Ou " + findAboType(findAbonnement("starter-family"), "yearly").price + "&euro; / an <br> soit <b>" +  (findAboType(findAbonnement("starter-family"), "yearly").price / 12).toFixed(2) + "€</b>/mois"
        document.querySelector('#total-starter').innerHTML = ""; // "Ou " + findAboType(findAbonnement("starter"), "yearly").price + "&euro; / an <br> soit <b>" +  (findAboType(findAbonnement("starter"), "yearly").price / 12).toFixed(2)  + "€</b>/mois"
        
        updateTime(false)
    }

    const toYear = () => {
        document.getElementById('abo-facture-mois').className = 'abo_btn_off' ;
        document.getElementById('abo-facture-annee').className = 'abo_btn_on' ;
        document.getElementById('abo-facture-life').className = 'abo_btn_off' ;
        
        
        document.getElementById('abo-prix-family-premium').textContent = displayPrice(findAboType(findAbonnement("premium-family"), "yearly").price) +  getTrad('€/an', '€/year') 
        document.getElementById('abo-prix-starter-family').textContent = displayPrice(findAboType(findAbonnement("starter-family"), "yearly").price) +  getTrad('€/an', '€/year') 
        document.getElementById('abo-prix-starter').textContent = displayPrice(findAboType(findAbonnement("starter"), "yearly").price) +  getTrad('€/an', '€/year') 

        document.getElementById('abo-annee-mois-starter').textContent = getTrad('2 mois offerts', '2 months free') 
        document.getElementById('abo-annee-mois-starter-family').textContent = getTrad('2 mois offerts', '2 months free') 
        document.getElementById('abo-annee-mois-family-premium').textContent = getTrad('2 mois offerts', '2 months free') 

        document.getElementById('total-family-premium').innerHTML = getTrad('Soit', 'Or')  + " <b>" + (findAboType(findAbonnement("premium-family"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month') 
        document.getElementById('total-starter-family').innerHTML = getTrad('Soit', 'Or')  + " <b>" + (findAboType(findAbonnement("starter-family"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month') 
        document.getElementById('total-starter').innerHTML = getTrad('Soit', 'Or')  + " <b>" + (findAboType(findAbonnement("starter"), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month') 
        updateTime(false)
    }

    const toLife = () => {
        document.getElementById('abo-facture-mois').className = 'abo_btn_off' ;
        document.getElementById('abo-facture-annee').className = 'abo_btn_off' ;
        document.getElementById('abo-facture-life').className = 'abo_btn_on' ;
        
        document.getElementById('abo-prix-family-premium').textContent =  findAboType(findAbonnement("premium-family"), "life").price + '€'
        document.getElementById('abo-prix-starter-family').textContent =  findAboType(findAbonnement("starter-family"), "life").price + '€'
        document.getElementById('abo-prix-starter').textContent = findAboType(findAbonnement("starter"), "life").price + '€'

        document.getElementById('abo-annee-mois-starter').textContent = getTrad('formule au forfait', 'package deal') 
        document.getElementById('abo-annee-mois-starter-family').textContent = getTrad('formule au forfait', 'package deal') 
        document.getElementById('abo-annee-mois-family-premium').textContent = getTrad('formule au forfait', 'package deal') 

        document.getElementById('total-family-premium').innerHTML = getTrad('Vous payez une seule fois pour toute', 'You pay once for everything') 
        document.getElementById('total-starter-family').innerHTML = getTrad('Vous payez une seule fois pour toute', 'You pay once for everything') 
        document.getElementById('total-starter').innerHTML = getTrad('Vous payez une seule fois pour toute', 'You pay once for everything') 
        updateTime(true)

    }

    /*
    abo-facture-mois
    abo-facture-annee
    abo-facture-life
    */

    document.getElementById('abo-facture-annee').addEventListener('click', (event) => {
        event.preventDefault();
        toYear();
        document.activeElement.blur();
    });
    document.getElementById('abo-facture-life').addEventListener('click', (event) => {
        event.preventDefault();
        toLife();
        document.activeElement.blur();
    });
    document.getElementById('abo-facture-mois').addEventListener('click', (event) => {
        event.preventDefault();
        toMonth();
        document.activeElement.blur();
    })

    switchDisplay();

}


const initResult = async () => {
    shoppingCart.clear()
    document.getElementById('JL_ORDER').style.display = 'none';
    let id = new URLSearchParams(window.location.search).get('session_id')
    console.log(id)
    if (id != null) {
        let datas = await loadCart(id)
        console.log(datas);
        localStorage.setItem('session_id', id)
        document.getElementById('JL_ORDER_ID').textContent = datas.numOrder
        document.getElementById('JL_ORDER').style.display = 'flex';
        
    }
    
}

const loadCart = async (id) => {
    try
    {
        loaderContainer.display = ''
    }
    catch(e) {}
    return await fetch('https://api.jagger-tracker.com/stripe/checkout_session/'+id+'/cart').then(res => res.json())
}

function preload(url) {
    let tmp = new Image();
    tmp.src = url;
    }

const loadData = async () => {
    let date = Date.now()
    let result
    let delayDate = 24 * 60 * 60 * 1000;
    
    result = await (await getProductsFromStripe()).json()
    localStorage.setItem('ts', date)
    localStorage.setItem('data', JSON.stringify(result))
    
}

const init = async () => {
    
    let date = Date.now()
    let result
    let delayDate = 24 * 60 * 60 * 1000;
    if (localStorage.getItem('data') == null)
    {
        lastDate = 0;
    }
    else
    {
        lastDate = JSON.parse(localStorage.getItem('ts'));
    }

    if ( (date - lastDate) > delayDate) {
        let loaderContainer = document.createElement('div')
        loaderContainer.classList.add('jl-loader-container')
        loaderContainer.innerHTML = '<lottie-player src="https://webcart.jagger-lewis.com/loader%20site.json" background="transparent" speed="1"style="width: 300px; height: 300px;"  autoplay></lottie-player>'
        body.insertBefore(loaderContainer, document.body.firstChild);
        await loadData()
        await loadAbonnement()
        loaderContainer.style.display = 'none'
    }

    result = JSON.parse(localStorage.getItem('data'))
    abonnement = JSON.parse(localStorage.getItem('abonnement'))
    
    for (const product of result) {
        products.push(new Product(product.name, product.description, product.metadata, product.image, product.prices[0]))
        if ( product.metadata.category == "accessory" )
        {
            accessory.push(new Product(product.name, product.description, product.metadata, product.image, product.prices[0]))
        }
    }

    preload(findProduct('jag', 'fauve').image)
    preload(findProduct('jag', 'weimar').image)
    preload(findProduct('jag', 'charbon').image)
    preload(findProduct('jag-smartdock', 'fauve').image)
    preload(findProduct('jag-smartdock', 'weimar').image)
    preload(findProduct('jag-smartdock', 'charbon').image)

    if (JL_NavBar)
    {
        document.getElementById('JL_Basket_Item').style.display = 'none';
        document.getElementById('JL_Basket_Empty').style.display = 'block';
        document.getElementById('jl-cart-number').addEventListener('click',(event) => showNewCart(event))
        document.getElementById('jag-cart').addEventListener('click',(event) => showNewCart(event))
        document.getElementById('JL_Btn_Close_Basket').addEventListener('click',(event) => hideCart(event))    
    }
    
    if ( document.getElementById('JL_Abonnement_Full_Grille') )
    {
        initAboJag()
    }

    if ( document.getElementById('JL_Abo_Newsletter')) {
        initNewsLettre()
    }

    if ( document.getElementById('jag-smartdock-alone')) {
        initSmartDockAlone()
    }

    if ( document.getElementById('jl-collar')) {
        initJagGPS();
    }

    if ( document.getElementById('jl-price-month')) {
        document.querySelector('#jl-price-month').textContent = (findAboType(findAbonnement("starter"), "monthly").price).toFixed(2)
    }

    if ( document.getElementById('jl-Accessory')) {
    initJagAccessory();
    }

    if ( document.getElementById('jl-checkout-redirect')) {
        initResult();
    }

    setCartNumber();
    page = window.location.href.split('/')[3].split('?')[0];

    console.log(page);
}

const redirectToStripe = async (event) => {
    try {
        event.preventDefault();
    }
    catch(e) {
        console.log(e);
    }
    /*
    if (shoppingCart.countItems() == 0) {
        showSnackBar("Vous n'avez pas d'article", true)
            return
        }
    */
    const apiRes = await shoppingCart.getCartStripeUrl()
    console.log(apiRes);
    const apiResJson = await apiRes.json()
    console.log(apiResJson);
    window.location.href = apiResJson.url
}

const redirectToStripeBis = async () => {
    let abo = findAboType(findAbonnement('premium-first'), 'life').id;
    const answer = await fetch("https://api.jagger-tracker.com/stripe/checkout_session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: [{id : abo, quantity : 1}], mode: 'payment' })
        })
    const apiResJson = await answer.json()
    window.location.href = apiResJson.url
}

/*
const addToCart = (event) => {
    event.preventDefault();
    var name = event.target.getAttribute('data-name');
    var price = Number(event.target.getAttribute('data-price'));
    var prices = event.target.getAttribute('data-prices');
    var img = event.target.getAttribute('data-image');
    shoppingCart.addItem(id, 1)
}
*/

/*
const showCart = (event) => {
    event.preventDefault();
    
    clearHtml()

    if (shoppingCart.cart.length == 0) {
        document.querySelector('#jl-no-display').style.display = ''
    }
    else {
        document.querySelector('#jl-no-display').style.display = 'none'
        shoppingCart.cart.forEach((prod) => {
            let id = prod.id.price.id
            addHtml(prod, id)
            addFunction(prod.id, id)
        })
    }

    shoppingCart.setTotalPrice();

    function clearHtml () {
        document.querySelector('.jl-border-container').innerHTML = '<div id="jl-no-display" class="jl-no-display">Aucun élément sélectionné</div>';
    } 

    function addHtml(prod, id) {
        let container = document.querySelector('.jl-border-container')
        let containerProduct = document.createElement('div')
        let containerProductText = document.createElement('div')
        let RowElem1 = document.createElement('div')
        let RowElem2 = document.createElement('div')
        let RowElem3 = document.createElement('div')
        let image = document.createElement('img')
        RowElem1.classList.add('jl-product-row')
        RowElem1.innerHTML = "<p class='jl-p jl-product-name'>"+ prod.id.name+"</p><p class='jl-p jl-product-price'>" + displayPrice(prod.id.price.price) + "€</p>"
        RowElem2.classList.add('jl-product-row')
        RowElem2.innerHTML = "<p class='jl-p jl-product-quantity'>Qté : "+ prod.quantity + " </p>"
       
        
        RowElem3.classList.add('jl-product-row-end')
        RowElem3.innerHTML = "<img class='close-button'  src='https://webcart.jagger-lewis.com/asset/icon_info.png'><p class='jl-p jl-text-hint'>Choisissez un abonnement après votre achat. </p> <img class='close-button hover button-small' id='remove-"  + id + "' src='https://webcart.jagger-lewis.com/asset/icon_trash.png'></img >"
        image.src = prod.id.image
        image.classList.add('jl-product-img')
        containerProduct.classList.add('jl-container-product')
        containerProduct.id = id
        containerProductText.classList.add('jl-container-product-text')
        containerProduct.appendChild(image)
        containerProductText.appendChild(RowElem1)
        containerProductText.appendChild(RowElem2)
        containerProductText.appendChild(RowElem3)
        containerProduct.appendChild(containerProductText)
        container.appendChild(containerProduct)
    }

    function addFunction(prod, id) {
        document.querySelector('#remove-' + id).addEventListener('click', (event) => {
            event.preventDefault()
            document.querySelector('.jl-border-container').removeChild(document.querySelector('#' + id))
            shoppingCart.clearItem(prod);
            shoppingCart.setTotalPrice();
        })
    }

}
*/

const getTrad = (labelFr,labelUs) => window.location.href.split('/').find((elem) => elem == 'en') ? labelUs : labelFr

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
        let element = document.getElementById('JL_Basket_Item') ;
        
        let newItem = element.cloneNode(true);
        newItem.setAttribute('id', 'JL_Basket_Item_' + itemLine );

        for (const child of newItem.childNodes) {
            if(child.hasChildNodes()) {
                child.childNodes.forEach((e, i)=>{
                    if (e.id.startsWith('JL_Basket_Item')) {
                        e.setAttribute('id', e.id + '_' + itemLine );
                        }
                });
            }
            else
            {
                if (child.id.startsWith('JL_Basket_Item')) {
                    child.setAttribute('id', child.id + '_' + itemLine );
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

    shoppingCart.cart.forEach((prod) => {

        let id = prod.id.price.id
        //addHtml(prod, id)
        //addFunction(prod.id, id)

        //console.log(prod);
        createLine(nbItem);

        document.getElementById('JL_Basket_Item_Label_' + nbItem ).innerHTML = getLocalName(prod.id) ;
        let labelQty = getTrad('qté : ','qty : ');
        document.getElementById('JL_Basket_Item_Ref_' + nbItem ).innerHTML = prod.id.metadata.productId + " (" + labelQty + prod.quantity + ")" ;
        document.getElementById('JL_Basket_Item_Img_' + nbItem ).src = prod.id.image ;
        document.getElementById('JL_Basket_Item_Img_' + nbItem ).removeAttribute('srcset')  ;
        document.getElementById('JL_Basket_Item_Price_' + nbItem ).innerHTML = (prod.quantity * prod.id.price.price).toFixed(2) + ' &euro;'; 
        
        document.getElementById('JL_Basket_Item_Trash_Icon_' + nbItem).setAttribute('nbItem', nbItem);
        document.getElementById('JL_Basket_Item_Trash_Icon_' + nbItem).addEventListener('click', (event) => {
            event.preventDefault();
            ligneId = document.getElementById(event.target.id).getAttribute('nbItem');
            itemLineChild = document.getElementById('JL_Basket_Item_' + ligneId);
            document.getElementById('JL_Basket_Items').removeChild(itemLineChild);
            shoppingCart.clearItem(prod.id);
            shoppingCart.setTotalPrice();
            if (shoppingCart.cart.length == 0) {
                noItems();
            }
            document.activeElement.blur();
        });

        document.getElementById('JL_Basket_Item_' + nbItem ).style.display = 'flex';
    
        nbItem++;
    })

    shoppingCart.setTotalPrice();

    document.getElementById('JL_Basket_Delivery_Amount').innerHTML = "<b>" + document.getElementById('JL_Basket_Delivery_Amount').innerHTML.replace('{price.delivery.std}', '5.90') + "</b>";
    
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

const showSnackBar = (text, isError) => {
    document.querySelector('#jl-snack-text-container').textContent = text
    document.querySelector('#jl-snack-icon').src = isError ? 'https://webcart.jagger-lewis.com/asset/icon_error.png' : 'https://webcart.jagger-lewis.com/asset/icon_validate.png'
    snack.className = isError ? 'show jl-snack-red' : 'show jl-snack-green';
    setTimeout(function(){ snack.className = '' }, 3000);
}

const showAddCart = (text, isError) => {
    document.getElementById('JL_AddCart_Snack_Label').textContent = text
    document.getElementById('JL_AddCart_Snack').style.display = 'block';
    //document.querySelector('#jl-snack-icon').src = isError ? 'https://webcart.jagger-lewis.com/asset/icon_error.png' : 'https://webcart.jagger-lewis.com/asset/icon_validate.png'
    //snack.className = isError ? 'show jl-snack-red' : 'show jl-snack-green';
    setTimeout(function(){ document.getElementById('JL_AddCart_Snack').style.display = 'none' }, 3000);
}

const goToStripe = document.getElementById("validate-cart");
goToStripe.onclick = (event) => {
    redirectToStripe(event)
}

init()
