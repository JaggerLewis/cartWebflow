const commander = document.querySelector('#jag-cart')
commander.setAttribute("data-toggle", "modal")
commander.setAttribute("data-target", "#cart")

const body = document.querySelector("body");
const modalDiv = document.createElement("div");
let snack = document.createElement('div')
snack.innerHTML = '<div class="jl-snack-icon-container"><img class="jl-snack-icon" id="jl-snack-icon"></img></div><div class="jl-snack-text-container" id="jl-snack-text-container"></div>'

let loaderContainer = document.createElement('div')

loaderContainer.classList.add('jl-loader-container')
loaderContainer.innerHTML = '<lottie-player src="https://webcart.jagger-lewis.com/loader%20site.json" background="transparent" speed="1"style="width: 300px; height: 300px;"  autoplay></lottie-player>'
modalDiv.setAttribute("id", "cart")
modalDiv.setAttribute("tabindex", "-1")
modalDiv.setAttribute("role", "dialog")
modalDiv.setAttribute("aria-labelledby", "exampleModalLabel")
modalDiv.setAttribute("aria-hidden", "true")
modalDiv.classList.add("modal")
modalDiv.setAttribute("class", "modal fade")
snack.id = 'jl-snackbar'
document.querySelector("body").appendChild(snack)
modalDiv.innerHTML = '<div class="modal-dialog modal-lg" role="document"><div class="jl-modal"><div class="jl-header"><p class="title">Panier</p><img class="close-button hover" data-dismiss="modal" src="https://webcart.jagger-lewis.com/asset/icon_close.png"></img></div><div class="jl-border-container"><div id="jl-no-display" class="jl-no-display">Aucun élément séléctionné</div></div><div class="jl-bottom-container"><p class="jl-bottom-text">Frais de livraison (Standard)</p><p class="jl-bottom-text">5.99€</p></div><div class="jl-container-total"><p class="jl-total-title">Total</p><p class="jl-total-title" id="jl-total">0&euro;</p></div><button id="validate-cart" class="jl-button">Finaliser la commande</button></div></div>'
body.appendChild(modalDiv)
body.insertBefore(loaderContainer, document.body.firstChild);

const setCartNumber = () => {
    let count = 0
    if (localStorage.getItem("shoppingCart")) {
        JSON.parse(localStorage.getItem('shoppingCart')).forEach(elem => count += elem.quantity)
    }
    document.querySelector('#jl-cart-number').textContent = count
    if (count == 0) {
        document.querySelector('#jl-no-display').style.display = count == 0 ? '' : 'none'
    }
    document.querySelector('#bulle-shopping-cart').style.display = document.querySelector('#jl-cart-number').textContent != '0'? '' : 'none'
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
        if (this.countItems() >= 4) {
            showSnackBar('Vous ne pouvez pas ajouter plus de cinq éléments au panier', true)
            return
        }
        showSnackBar(id.name + ' ajouté au panier', false)
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
        const totalSpan = document.querySelector('#jl-total')
        totalSpan.innerHTML = price.toFixed(2) + "&euro;"
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
    let btn = document.querySelector(newBtn)
    let oldBtn = document.querySelectorAll('['+attribut+'=true]')

    if (oldBtn != null) {
    oldBtn.forEach((element) => {
        element.removeAttribute(attribut)
        element.classList.remove(Newclass)
        element.classList.remove('text-selected')
    })
    }
    if (is_text) {
        let txt = document.querySelectorAll(newBtn.replace('jag', 'txt')).forEach(element => {
            element.classList.add('text-selected')
            element.setAttribute(attribut, 'true')
        })
       
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
    document.querySelectorAll('#btn-color-fauve').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[14].image, products[14].price.id )
        colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    }))
    document.querySelectorAll('#btn-color-weimar').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[16].image, products[16].price.id )
        colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    }))
    document.querySelectorAll('#btn-color-charbon').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[12].image, products[12].price.id )
        colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    })) 
    document.querySelectorAll('#txt-color-fauve').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[14].image, products[14].price.id )
         colorButtonSelect('#btn-color-fauve', 'color-selected', 'jl-color-selected', true)
    }))
    document.querySelectorAll('#txt-color-weimar').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[16].image, products[16].price.id )
         colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    }))
    document.querySelectorAll('#txt-color-charbon').forEach(element => element.addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[12].image, products[12].price.id )
         colorButtonSelect('#btn-color-charbon', 'color-selected', 'jl-color-selected', true)
    }))
    document.querySelector('#btn-dock-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[13].image, products[13].price.id )
        colorButtonSelect('#btn-dock-color-fauve', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#btn-dock-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[15].image, products[15].price.id )
        colorButtonSelect('#btn-dock-color-weimar', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#btn-dock-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[11].image, products[11].price.id )
        colorButtonSelect('#btn-dock-color-charbon', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-dock-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[13].image, products[13].price.id )
        colorButtonSelect('#txt-dock-color-fauve', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-dock-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[15].image, products[15].price.id )
        colorButtonSelect('#txt-dock-color-weimar', 'color-dock-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-dock-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(dock, products[11].image, products[11].price.id )
        colorButtonSelect('#txt-dock-color-charbon', 'color-dock-selected', 'jl-color-selected', true)
    })
   
    collar.setAttribute('data-selected', products[16].price.id)
    collar.srcset = products[16].image
    dock.setAttribute('data-selected', products[15].price.id)
    dock.srcset = products[15].image
    colorButtonSelect('#btn-color-weimar', 'color-selected', 'jl-color-selected', true)
    colorButtonSelect('#btn-dock-color-weimar', 'color-dock-selected', 'jl-color-selected', true)

}

const initCollar = async ()  => {
    let collar = document.querySelector('#page-jag-collar')
    document.querySelector('#je-commande-mon-jag').addEventListener('click', (event) => {
        event.preventDefault()
        let color = products.find(elem => elem.price.id == collar.getAttribute('data-selected')).metadata.colorId
        console.log('color =>', color)
        let option = document.querySelector('[hover-selected=true]')
        console.log('color =>', option.id)
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
    document.querySelector('#jag-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[14].image, products[14].price.id )
        colorButtonSelect('#jag-color-fauve', 'color-selected', 'jl-color-selected', true)
        
    })
    document.querySelector('#jag-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[16].image, products[16].price.id )
        colorButtonSelect('#jag-color-weimar', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#jag-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[12].image, products[12].price.id )
        colorButtonSelect('#jag-color-charbon', 'color-selected', 'jl-color-selected', true)
    })
    document.querySelector('#txt-color-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[14].image, products[14].price.id )
        colorButtonSelect('#jag-color-fauve', 'color-selected', 'jl-color-selected')
        
    })
    document.querySelector('#txt-color-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[16].image, products[16].price.id )
        colorButtonSelect('#jag-color-weimar', 'color-selected', 'jl-color-selected')
    })
    document.querySelector('#txt-color-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        colorButtonAction(collar, products[12].image, products[12].price.id )
        colorButtonSelect('#jag-color-charbon', 'color-selected', 'jl-color-selected')
    })
    document.querySelector('#jag-en-solo').addEventListener('click', (event) => {
        colorButtonSelect('#jag-en-solo', 'hover-selected', 'jag-solo')
    })
    document.querySelector('#jag-avec-smartdock').addEventListener('click', (event) => {
        colorButtonSelect('#jag-avec-smartdock', 'hover-selected', 'jag-avec-smartdock')
    })
   
    document.querySelector('#jl-jag-coque-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[2], 1)
    })
    document.querySelector('#jl-jag-cable').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[3], 1)
    })
    collar.setAttribute('data-selected', products[16].price.id)
    collar.srcset = products[16].image
    colorButtonSelect('#jag-color-weimar', 'color-selected', 'jl-color-selected')
    colorButtonSelect('#jag-en-solo', 'hover-selected', 'jag-solo')

}

const initBox = async ()  => {
    document.querySelector('#jl-dock-antenne').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[4], 1)
    })
    document.querySelector('#jl-dock-cable').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[3], 1)
    })
}

const initNewsLettre = () => {
    let btn = document.querySelector('#btn-restons-en-contact').addEventListener('click', () => {
        let email = document.querySelector('#input-restons-en-contact').value
        if (email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/))
            fetch('')
        else
         showSnackBar('Wrong email', true)
    })
}

const initAccessory = () => {
    document.querySelector('#jl-coque-fauve').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[2], 1)
    })
    document.querySelector('#jl-coque-charbon').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[1], 1)
    })
    document.querySelector('#jl-coque-weimar').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[0], 1)
    })
    document.querySelector('#jl-antenne').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[4], 1)
    })
    document.querySelector('#jl-cable-cta').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(products[3], 1)
    })
    document.querySelector('#jl-cable-cta-dock').addEventListener('click', (event) => {
        event.preventDefault()
        showSnackBar('ON NE VEND PAS DE CABLE POUR LE DOCK', true)
    })
}

const loadAbonnement = async () => {
    loaderContainer.style = null

    let date = Date.now()
    let answer
    if (localStorage.getItem('abonnement') == null) {
        answer = await (await getAbonnementFromStripe()).json()
        localStorage.setItem('abonnement', JSON.stringify(answer))
        localStorage.setItem('ts-abonnement', date)
    }
    else 
        answer = JSON.parse(localStorage.getItem('abonnement'))
    if (date - JSON.parse(localStorage.getItem('ts-abonnement')) > 600000) {
        answer = await (await getAbonnementFromStripe()).json()
        localStorage.setItem('ts-abonnemnt', date)
        localStorage.setItem('abonnement', JSON.stringify(answer))
    }
    console.log("answer =>", answer)

  
    loaderContainer.style.display = 'none'

    return answer
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

const initAbonnement = async () => {
    let datas = await loadAbonnement()
    document.querySelector('#abo-facture-mois').classList.add('text-selected')
    updateTime(true)
    document.querySelector('#toggle').addEventListener('click', (event) => {
        event.preventDefault()
        if ( document.querySelector('#abo-facture-mois').classList.contains('text-selected')) {
            document.querySelector('#abo-facture-mois').classList.remove('text-selected')
            document.querySelector('#abo-facture-annee').classList.add('text-selected')
            console.log()
            document.querySelector('#abo-prix-family-premium').textContent = datas[2].prices[0].price + '€/ an'
            document.querySelector('#abo-prix-starter-family').textContent = datas[1].prices[0].price + '€/ an'
            document.querySelector('#abo-prix-starter').textContent = datas[0].prices[1].price + '€/ an'
            document.querySelector('#total-family-premium').style.display = 'none'
            document.querySelector('#total-starter-family').style.display = 'none'
            document.querySelector('#total-starter').style.display = 'none'
            updateTime(false)

        }
        else {
            document.querySelector('#abo-facture-mois').classList.add('text-selected')
            document.querySelector('#abo-facture-annee').classList.remove('text-selected')
            document.querySelector('#abo-prix-family-premium').textContent = datas[2].prices[1].price + '€/ mois'
            document.querySelector('#abo-prix-starter-family').textContent = datas[1].prices[1].price + '€/ mois'
            document.querySelector('#abo-prix-starter').textContent = datas[0].prices[0].price + '€/ mois'
            document.querySelector('#total-family-premium').style.display = 'block'
            document.querySelector('#total-starter-family').style.display = 'block'
            document.querySelector('#total-starter').style.display = 'block'
            updateTime(true)
        }
    })
}

const initResult = async () => {
    shoppingCart.clear()
    let id = new URLSearchParams(window.location.search).get('session_id')
    let datas = await loadCart(id)
    localStorage.setItem('session_id', id)
    loaderContainer.display = 'none'
    document.querySelector('#jl-product-id').textContent = datas.numOrder
    document.querySelector('#jl-result-name').textContent += datas.customer.name[0].toUpperCase() + datas.customer.name.substr(1)
}

const loadCart = async (id) => {
    loaderContainer.display = ''
    return await fetch('https://dev.jagger-tracker.com/stripe/checkout_session/'+id+'/cart').then(res => res.json())
}

const loadData = async () => {
    let date = Date.now()
    let result
    if (localStorage.getItem('data') == null) {
        result = await (await getProductsFromStripe()).json()
        localStorage.setItem('data', JSON.stringify(result))
        localStorage.setItem('ts', date)
    }
    else 
        result = JSON.parse(localStorage.getItem('data'))
    if (date - JSON.parse(localStorage.getItem('ts')) > 600000) {
        result = await (await getProductsFromStripe()).json()
        localStorage.setItem('ts', date)
        localStorage.setItem('data', JSON.stringify(result))
    }
    for (const product of result) {
        products.push(new Product(product.name, product.description, product.metadata, product.image, product.prices[0]))
    }

    loaderContainer.style.display = 'none'
}

const init = async () => {
    await loadData()
    let jlCartNumber = document.querySelector('#jl-cart-number')
   
    jlCartNumber.setAttribute("data-toggle", "modal")
    jlCartNumber.setAttribute("data-target", "#cart")
    jlCartNumber.addEventListener('click',(event) => showCart(event))
    setCartNumber();
    page = window.location.href.split('/')[3].split('?')[0];
    switch(page) {
        case '' : 
            initHome()
            initNewsLettre()

            break;
        case 'jagger-lewis-smartdock' :
            initBox()
            initNewsLettre()
            break;
        case 'jagger-lewis-jag' :
            initCollar()
            initNewsLettre()
            break;
        case 'accessoires-jag-smartdock' :
            initAccessory()
            initNewsLettre()
            break;
        case 'jagger-lewis-abonnement' : 
            initAbonnement()
            initNewsLettre()
            break;
        case 'eliot-test': 
            initResult()
            break
        default : 
            console.log(page)
    }
   
}


const redirectToStripe = async (event) => {
    event.preventDefault();
    if (shoppingCart.countItems() == 0) {
        showSnackBar("Vous n'avez pas d'article", true)
            return
        }
    const apiRes = await shoppingCart.getCartStripeUrl()
    const apiResJson = await apiRes.json()
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
        document.querySelector('.jl-border-container').innerHTML = '<div id="jl-no-display" class="jl-no-display">Aucun élément séléctionné</div>';
    } 

    function displayPrice (price) {
        return  price % 1 == 0 
                ? price + '.00'
                : price % 0.1 == 0
                    ? '' + price
                    : price+ '0' 
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
        RowElem1.innerHTML = "<p class='jl-product-name'>"+ prod.id.name+"</p><p class='jl-product-price'>" + displayPrice(prod.id.price.price) + "€</p>"
        RowElem2.classList.add('jl-product-row')
        RowElem2.innerHTML = "<p class='jl-product-quantity'>Qté : "+ prod.quantity + " </p>"
       
        
        RowElem3.classList.add('jl-product-row-end')
        RowElem3.innerHTML = "<img class='close-button'  src='https://webcart.jagger-lewis.com/asset/icon_info.png'><p class='jl-text-hint'>Choisissez un abonnement après l’achat de votre Jag. </p> <img class='close-button hover button-small' id='remove-"  + id + "' src='https://webcart.jagger-lewis.com/asset/icon_trash.png'></img >"
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

document.querySelector('#jag-cart').addEventListener('click',(event) => showCart(event))

const showSnackBar = (text, isError) => {
    document.querySelector('#jl-snack-text-container').textContent = text
    document.querySelector('#jl-snack-icon').src = isError ? 'https://webcart.jagger-lewis.com/asset/icon_error.png' : 'https://webcart.jagger-lewis.com/asset/icon_validate.png'
    snack.className = "show";
    setTimeout(function(){ snack.className = snack.className.replace("show", ""); }, 3000);
}

const goToStripe = document.getElementById("validate-cart");
goToStripe.onclick = (event) => {
    redirectToStripe(event)
}

init()
