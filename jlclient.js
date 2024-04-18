

const baseurl = 'https://app-api.mypet.fit'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY1NzFkM2RjNzA4M2E3ODg2ZTQzNzNhOCIsInBob25lIjoiMDAzMzYxMjk2NTM5OCIsIm5hbWUiOiJFbGlvdCIsImxhc3RuYW1lIjoiTUFSVElOIiwiZW1haWwiOiJlbGlvdC5tYXJ0aW5AamFnZ2VyLWxld2lzLmNvbSJ9LCJpYXQiOjE3MTIxMzM0Njh9.cfvU9bp8yr8ASiMN5vY9j5mrQH8CfV50m1k3Hny917Y'

const step2 = 'activation-produit-etape02'

const header = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }

let loaderContainer
let user
let dog
let session
let display

const converTimestamp = (timestamp) => {
    let day = Math.floor(timestamp / (24 * 3600)); 
    let hour = Math.floor((timestamp % (24 * 3600)) / 3600);
    let min = Math.floor((timestamp % 3600) / 60);

    let resultat = '';
    if (day > 0) {
        resultat += day + ' jour' + (day > 1 ? 's' : '') + ' ';
    }
    if (hour > 0) {
        resultat += hour + ' heure' + (hour > 1 ? 's' : '') + ' ';
    }
    if (min > 0) {
        resultat += min + ' minute' + (min > 1 ? 's' : '');
    }

    return resultat;
}

const initClient = {
    'jl-profil-user-name' : (node) => node.innerHTML = session.customer.name,
    'jl-profil-dog-picture' : (node) => null,
    'jl-profil-dog-name' : (node) => node.innerHTML = dog.name,
    'jl-profil-dog-id' : (node) => node.innerHTML = dog.id,
    'jl-collar-battery' : (node) => node.innerHTML = dog.battery.soc+'%',
    'jl-collar-autonomy' : (node) => node.innerHTML = 'Il reste environ ' + converTimestamp(dog.battery.estimated) + " d'autonomie",
    'jl-collar-synchro-date' : (node) => null,
    'jl-collar-rescue' : (node) => null,
    'jl-activity-card-container' : (node) => initActivity(node),
    'jl_Activation_serialNumber' : (node) => null,
    'jl_Activation_phoneNumber' : (node) => null,
    'jl_Activation_Action' : (node) => node.addEventListener('click', () => checkActivation()),
    'jl_Abonnement_starter_action' : (node) => node.addEventListener('click', () => aboAction('starter')),
    'jl_Abonnement_family_action' : (node) => node.addEventListener('click', () => aboAction('starter-family')),
    'jl_Abonnement_Premium_action' : (node) => node.addEventListener('click', () => aboAction('premium-family')),
    'jl-formula-action' : (node) => formulaPageSwitch('formula'),
    'jl-option-action' : (node) => formulaPageSwitch('option'),
    'jl-insurance-action' : (node) => formulaPageSwitch('insurance'),
    'jl-abo-container' : (node) => null,
    'jl-insurance-container' : (node) => null,
    'jl-option-container' : (node) => null,
}


const formulaPageSwitch = (type) => {
    display = type;
    console.log(display)

    let template = document.getElementById('jl-'+dispaly+'-action')
    if (!template)
        return
    template.style.display == 'block'
}




const getMonth = (month) => {switch (month) {
    case 0:
        return "janv";
        break;
    case 1:
        return "févr";
        break;
    case 2:
        return "mars";
        break;
    case 3:
        return "avri";
        break;
    case 4:
        return "mai";
        break;
    case 5:
        return "juin"
        break;
    case 6:
        return "juil";
        break;
    case 7:
        return "août";
        break;
    case 8:
        return "sept";
        break;
    case 9:
        return "octo";
        break;
    case 10:
        return "nove";
        break;
    case 11:
        return "déce";
        break;
    default:
        return "";
}}

const redirectStep2 = () => {
    if (!window.localStorage.serial || !window.localStorage.phone) {
        window.open('activation-produit', '_self')
    }
}

const aboAction = async (type) => {
    let duration = document.getElementsByClassName('abo_btn_on')[0]
    let check = document.getElementById('jag_Abonnement_check')
    if (duration && check && check.checked) {
        let length = getRightLenght(duration.id.split('-')[2].toLowerCase())
        let subscription = findAboType(findAbonnement(type), length).id
        loaderContainer.style.display = 'flex'
        const result = await fetch('https://app-api.mypet.fit/stripe/checkout_session/subscription', {
            method: "POST",
            headers : header,
            body: JSON.stringify({
                'subscription' : subscription,
                'phone' : window.localStorage.phone,
                'serialNumber' : window.localStorage.serial
            }), 
          }).then(async (res) => await res.json()) 
          if (result.url) {
            loaderContainer.style.display = 'none'
            window.open(result.url, '_self')
          }

        return
    }

    else if (!duration) {
        showAddCart('Vous devez séléctionner une durée', true)
        return
    }

    else if (!check || !check.checked) {
        showAddCart("Vous devez accepter les frais d'activitation", true)
        return
    }
}



const updateContainerBorder = (type) => {
    ['jl_Abonnement_Starter','jl_Abonnement_Family','jl_Abonnement_Premium'].forEach((elem) =>
     document.getElementById(elem).className = elem == type ? 'abo_border_on' : 'abo_border_off' )
}

const toMonth = () => {
    document.getElementById('jl_abo-facture-mois').className = 'abo_btn_on';
    document.getElementById('jl_abo-facture-annee').className = 'abo_btn_off';
    document.getElementById('jl_abo-facture-life').className = 'abo_btn_off';
    aboType = ['starter', 'starter-family', 'premium-family']
    aboType.forEach((abo) => {
        document.getElementById('jl-abo-'+abo+'-top').innerHTML =  getTrad('Sans engagement', 'No obligation')
        document.getElementById('jl-abo-'+abo+'-bottom').innerHTML = ''
        document.getElementById('jl-abo-'+abo+'-price').innerHTML = displayPrice(findAboType(findAbonnement(abo), "monthly").price) + getTrad('€/mois', '€/month')
    })
}
const toYear = () => {
    document.getElementById('jl_abo-facture-mois').className = 'abo_btn_off';
    document.getElementById('jl_abo-facture-annee').className = 'abo_btn_on';
    document.getElementById('jl_abo-facture-life').className = 'abo_btn_off';
    aboType = ['starter', 'starter-family', 'premium-family']
    aboType.forEach((abo) => {
        document.getElementById('jl-abo-'+abo+'-top').innerHTML =  getTrad('2 mois offerts', '2 months free')
        document.getElementById('jl-abo-'+abo+'-bottom').innerHTML = getTrad('Paiement de ', '') + displayPrice(findAboType(findAbonnement(abo), "yearly").price) + getTrad('€ tous les ans', '€ billed annualy')
        document.getElementById('jl-abo-'+abo+'-price').innerHTML =   (findAboType(findAbonnement(abo), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')
    })
}
const toLife = () => {
    document.getElementById('jl_abo-facture-mois').className = 'abo_btn_off';
    document.getElementById('jl_abo-facture-annee').className = 'abo_btn_off';
    document.getElementById('jl_abo-facture-life').className = 'abo_btn_on';
    aboType = ['starter', 'starter-family', 'premium-family']
    aboType.forEach((abo) => {
        document.getElementById('jl-abo-'+abo+'-top').innerHTML =  getTrad('Formule sans abonnement', 'no-subscription formula')
        document.getElementById('jl-abo-'+abo+'-bottom').innerHTML =  getTrad('1 paiement unique', '1 single payment')
        document.getElementById('jl-abo-'+abo+'-price').innerHTML = findAboType(findAbonnement(abo), "life").price + '€'
    })
}

const initActivity = async (node) => {
    card = document.getElementById('jl-activity-card')
    dog.activities.personalActivities.forEach((activity) => {
        if (activity.start_timestamp && activity.end_timestamp && activity.distance) {
            newCard = card.cloneNode(true)
            changeChildsId(newCard, '-' + activity._id, 'jl')
            newCard['data-id'] = activity._id
            node.appendChild(newCard)
            document.getElementById('jl-activity-card-type-' + activity._id).innerHTML = activity.activity_id
            start =  new Date(activity.start_timestamp);
            end = new Date(activity.end_timestamp);
            if (activity.start_timestamp && activity.end_timestamp) {
                document.getElementById('jl-activity-card-time-' + activity._id).innerHTML =  'De ' + (start.getHours() < 10 ? "0" +  start.getHours() : start.getHours()) + "h" + (start.getMinutes() < 10 ? "0" +  start.getMinutes() : start.getMinutes()) + ' à '  + (end.getHours() < 10 ? "0" +  end.getHours() : end.getHours()) + "h" + (end.getMinutes() < 10 ? "0" +  end.getMinutes() : end.getMinutes())
                document.getElementById('jl-activity-card-duration-' + activity._id).innerHTML = new Date(activity.duration * 1000).toISOString().substring(14, 19)
                document.getElementById('jl-activity-card-date-' + activity._id).innerHTML = start.getDay() + ' ' +  getMonth(start.getMonth())
            }
            if (activity.distance) {
                distance = activity.distance > 1000 ? activity.distance /1000 + 'km' : activity.distance + 'm'
                document.getElementById('jl-activity-card-distance-' + activity._id).innerHTML = 'Distance parcourue de ' + distance
            }
        }
    })
    card.style.display = 'none'
}

const changeChildsId = (node, suffix, filter) => {
    if (filter) {
        if (node.id && node.id.includes(filter))
            node.id = node.id + suffix
        }
    else node.id = node.id + suffix
    if(node.hasChildNodes) {
        var childs = node.childNodes;
        for(var index=0; index<childs.length; index++) {
            changeChildsId(childs[index], suffix)
        }
    }
}

const checkActivation = async () => {
    const regexPhone = '^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$'
    const reglexSerial = 'JL[A-Za-z0-9]-[A-Za-z0-9]{8}'

    let serial = document.getElementById('jl_Activation_serialNumber').value
    let phone = document.getElementById('jl_Activation_phoneNumber').value

    if (!phone.match(regexPhone)) {
        showAddCart('Numéro de téléphone incorrect', true)
        return
    }
    if (!serial.match(reglexSerial)) {
        showAddCart('Numéro de serie incorrect (JL1-1111A11A)', true)
        return
    }

    const result = await fetch(baseurl + '/collar/serialNumber', {
        method: "POST",
        headers : header,
        body: JSON.stringify({
            'serialNumber' : serial,
            'phone' : phone,
        }), 
      }).then(async (res) => await res.status) 
    
      switch (result) {
        case 200 : 
            window.localStorage.serial = serial
            window.localStorage.phone = phone
            window.open('activation-produit-etape02', '_self')
            break
        case 400 :
            showAddCart('Ce boîtier est déjà activé', true)
            break 
        case 404 : 
            showAddCart('boîtier inconnu', true)
            break 
      }
}

const getCart = async () => {
    let searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has('session_id')) {
          window.open('activation-produit', '_self')
        return
    }

    let session_id = searchParams.get('session_id')
    result =  await fetch('https://app-api.mypet.fit/order/checkout/' + session_id , {
        method: "GET",
        headers : header,
    })
    
    if (result.status != 200) {
        window.open('activation-produit', '_self')
        return
    }
    session = await result.json()
}

const getAbonnement = async () => {
    if (window.localStorage.abonnement) {
        let data = JSON.parse(window.localStorage.abonnement)
        if (data.length != 0) {
            abonnement = data
            return
        }
    }
    let data = await fetch(`${interfaceUrl}/stripe/products/category/subscription`, {
        method: "GET",
        headers: header,
    })
    window.localStorage.setItem('abonnement', JSON.stringify(data))
    abonnement = data
}

const getUser = async () => {
    loaderContainer.style.display = 'flex'
    user = await fetch(baseurl + '/profile/full', {headers : header})
        .then(async (res) => await res.json())
        .then((res) => res.user)

    if (user.dogs.length != 0) {
        dog = await fetch(baseurl + '/dog/'+ user.dogs[0]._id +'?activity_limit=5', {headers : header})
            .then(async (res) => await res.json())
            .then((res) => res.dog)
        dog.battery = await fetch(baseurl + '/collar/'+ dog.collar.simcardID+'/battery', {headers : header})
            .then(async (res) => await res.json())
            .then((res) => res.BatteryInfos)
    }
    loaderContainer.style.display = 'none'

}


const getAll = async () => {
   
    loaderContainer = document.createElement('div')
    loaderContainer.classList.add('jl-loader-container')
    loaderContainer.innerHTML = '<lottie-player src="https://webcart.jagger-lewis.com/loader%20site.json" background="transparent" speed="1"style="width: 300px; height: 300px;"  autoplay></lottie-player>'
    body.insertBefore(loaderContainer, document.body.firstChild);

    if (document.getElementById('jag-step-3'))
        await getCart();
    else if (document.getElementById('jag-step-2')) {
        redirectStep2();
        await loadAbonnement()
        abonnement = JSON.parse(localStorage.getItem('abonnement'))
        initAboJag();
    }
    else if (document.getElementById('jag-formula')) {
        await loadAbonnement()
        abonnement = JSON.parse(localStorage.getItem('abonnement'))
    }

  
  
    loaderContainer.style.display = 'none'

    setAll()
   }

const setAll = () => {
    var nodes = document.querySelectorAll('[id^="jl"]');

    nodes.forEach(( node) => {
        if (initClient[node.id])
            initClient[node.id](node)
        else console.log(node.id + ' is not handle :(')
    });
}
if(!document.getElementById('JL_NavBar')) {
    getAll()
}