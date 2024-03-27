const JagClientbody = document.querySelector("body");

const Jag_initBox = async ()  => {
    document.querySelector('#jl-dock-antenne').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-smartdock-antenna-md'), 1)
    })
    document.querySelector('#jl-dock-cable').addEventListener('click', (event) => {
        event.preventDefault()
        shoppingCart.addItem(findProduct('jag-chargingcable'), 1)
    })
}

function preload(url) {
    let tmp = new Image();
    tmp.src = url;
    }

function Jag_GetContext() {
    let jagToken = new URLSearchParams(window.location.search).get('jwt')
    return jagToken;
}

const Jag_Init = async () => {
    
    let date = Date.now()
    
    console.log(document.location);
    
    let context = Jag_GetContext()

    if ( document.getElementById('JL_Account_Label') )
    {
        document.getElementById('JL_Account_Label').textContent = context;
    }

}

const Jag_getTrad = (key) => {

    if ( navigator.language.toLowerCase().indexOf('fr') > -1)
    {
        goodLabel = key;
    }
    else
    {
        goodLabel = key;
    }
    return goodLabel;
} 

Jag_Init()
