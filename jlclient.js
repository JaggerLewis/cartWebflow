

const baseurl = 'https://app-api.mypet.fit'
const REDIRECT = '/my/seconnecter'
const step2 = 'activation-produit-etape02'

let header = {
    'Content-Type': 'application/json'
  }

let loaderContainer
let user
let dog
let session
let display
let option
let token
let map
let path

const findAbonnementSolo = (type) => {
    return abonnement.find((elem) => elem.metadata.pId == 'formula_unique').prices.find((elem) => elem.metadata.pricing == type)
}

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
    'jl-profil-dog-picture' : (node) =>  node.src = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid ,
    'jl-profil-dog-name' : (node) => node.innerHTML = dog.name,
    'jl-profil-dog-id' : (node) => node.innerHTML = dog.publicId,
    'jl-collar-battery' : (node) => node.innerHTML = dog.battery.soc+'%',
    'jl-collar-serial' : (node) => node.innerHTML = dog.collar.serialNumber,
    'jl-collar-id' : (node) => node.innerHTML = dog.collar.name,
    'jl-collar-activation' : (node) => node.innerHTML = getDate(dog.collar.activationDate),
    'jl-collar-version' : (node) => node.innerHTML = dog.collar.firmwareVersion,
    'jl-collar-autonomy' : (node) => node.innerHTML = 'Il reste environ ' + converTimestamp(dog.battery.estimated) + " d'autonomie",
    'jl-collar-synchro-date' : (node) => node.innerHTML = 'Dernière mise à jour :' +  getDate(parseInt(Math.round(dog.geolocation.LastConnect) + '000')),
    'jl-map' : (node) => initMap(node),
    'jl-geofencing-labal' : (node) => initGeoFencing(node),
    'jl-is-moment' : (node) =>  initActivity('moment'),
    'jl-activity-activity' : (node) => node.addEventListener('click', () => initActivity('activity')),
    'jl-activity-rescue' : (node) => node.addEventListener('click', () => initActivity('rescue')),
    'jl-is-activity' : (node) =>  initActivity('activity'),
    'jl_Activation_Action' : (node) => node.addEventListener('click', () => checkActivation()),
    'jl_Abonnement_starter_action' : (node) => node.addEventListener('click', () => aboAction('monthly')),
    'jl_Abonnement_family_action' : (node) => node.addEventListener('click', () => aboAction('yealry')),
    'jl_Abonnement_Premium_action' : (node) => node.addEventListener('click', () => aboAction('life')),
    'jl-abo-change' : (node) => node.addEventListener('click', () => window.open('/my/choix-abonnement-upgrade-b')),
    'jl-formula-action' : (node) => node.addEventListener('click', () => formulaPageSwitch('abo')),
    'jl-option-action' : (node) => node.addEventListener('click', () => formulaPageSwitch('option')),
    'jl-insurance-action' : (node) => node.addEventListener('click', () => formulaPageSwitch('insurance')),
    'jl_Btn_phoneToken' : (node) => node.addEventListener('click', () => validateAction()),
    'jl-connect-action' : (node) => node.addEventListener('click', () => loginEmail()),
    'jl-connect-action-bis' : (node) => node.addEventListener('click', () => loginCode()),
    'jl-profil-dog-list': (node) => initDashboard(node),
    'jl-order-container' : () => initOrder(),
    'jl-order-order' : (node) => node.addEventListener('click', () => switchInfo('order')),
    'jl-order-info' : (node) => node.addEventListener('click', () => switchInfo('info')),
    'jl-delete-email' : (node) => node.addEventListener('click', () => deleteAccountEmail()),
    'jl-delete-sms-action' : (node) => initDelete(node),
    'jl-formula-close-action' : (node) =>  node.addEventListener('click', () => cancelSubScriptionEmail()),
    'jl-formula-good-action' : (node) =>  node.addEventListener('click', () => redirectAbo()),
    'jl_switch_month' : (node) =>  node.addEventListener('click', () => changeSubscription('monthly')),
    'jl_switch_year' : (node) =>  node.addEventListener('click', () => changeSubscription('yearly')),
    'jl_switch_life' : (node) =>  node.addEventListener('click', () => changeSubscription('life')),
    'jl-collar-synchro-state' : (node) => node.innerHTML = dog.geolocation.endpointStatus ? 'Le boîtier est connecté' : 'Le boîtier est en veille',
    'jl-collar-synchro-last-date' : (node) => node.innerHTML = getDate(dog.flash.tmsLastInfo)
}


const initGeoFencing = (node) => {
    let data = JSON.parse(dog.collar.settings.geofencing)
    node.innerHTML = `${data.active ? 'Active' : 'Désactié'} dans un rayon de ${data.radius}m autour de ${data.label.name}`
}
const deleteAccountEmail = async () => {
    let res = await fetch(baseurl + '/user/delete/email', {
                method: 'POST',
                headers: header
            })
    if (res.status == 200) {
        showAddCart('Email envoyé')
    }
    else {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
    }
}

const redirectAbo = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('dog')
    window.open('/my/dog-dashboard', '_self')
    checkAuth()
}

const initDelete = (node) => {
    let type = new URL(window.location.href).searchParams.get('type')

    if (type == 'subscription_cancel') {
        document.getElementById('jag-delete-text-stop').style.display = 'flex'
        document.getElementById('jag-delete-text-delete').style.display = 'none'
        node.addEventListener('click', () => cancelSubScription())
        return
    }
    document.getElementById('jag-delete-text-stop').style.display = 'none'
    document.getElementById('jag-delete-text-delete').style.display = 'flex'
    node.addEventListener('click', () => deleteAccountSms())
}

const deleteAccountSms = async () => {
        let input = document.getElementById('jag-delete-sms-input')
        if (!input) {
            showAddCart('Oups, une erreur est survenue, rechargez la page', true)
            return
        }
    
        let value = input.value
        if(value.length != 7) {
            showAddCart('Code incorrect', true)
            return
        }
    
        let res = await fetch(baseurl + '/user/delete', {
                method: 'DELETE',
                headers: header,
                body : JSON.stringify({"phoneToken": value})
                })

      if (res.status == 200) {
        window.location.replace('/seconnecter')
        localStorage.removeItem('token')
        checkAuth()
      }
      else {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
      }

}


const clearFamily = () => {
    let nodes = document.getElementById('jl-family-container').childNodes
    for (let i = nodes.length - 1; i >= 0; i--) {
        nodes[i].id.includes('jag-family-card-') ?  nodes[i].remove() : null
    }
}

let initGalery =  () => {
    let list =  document.getElementById('jag-profil-identity-gallery-container')
    let img = document.getElementById('jag-profil-identity-gallery-pict')
    for (let i = 0; i < 3; i++) {
        let newPict = img.cloneNode(true)
        let pict = user.galery[i]
        if (!pict) {
            return
        }
        
        newPict.style.display = 'flex'
        changeChildsId(newPict, '-'+pict.image._id, 'jag-')
        list.insertBefore(newPict, list.firstChild)
        document.getElementById('jag-profil-identity-gallery-pict-' + pict.image._id).src = "https://app-api.mypet.fit/img/" + pict.image.type +"/"+ pict.image.uuid 
        document.getElementById('jag-profil-identity-gallery-pict-' + pict.image._id).srcset = "https://app-api.mypet.fit/img/" + pict.image.type +"/"+ pict.image.uuid 
    }
}

const initFamily = () => {
    clearFamily()
    let list = document.getElementById('jl-family-container')
    let card = document.getElementById('jag-family-card')

    let owerCard = card.cloneNode(true)
    owerCard.style.display = 'flex'
    changeChildsId(owerCard, '-'+user._id, 'jag-')
    list.appendChild(owerCard)
    document.getElementById('jag-family-pict-' + user._id).src = "https://app-api.mypet.fit/img/" + user.image.type +"/"+ user.image.uuid 
    document.getElementById('jag-family-pict-' + user._id).srcset = "https://app-api.mypet.fit/img/" + user.image.type +"/"+ user.image.uuid 
    document.getElementById('jag-family-name-' + user._id).innerHTML =user.name
    document.getElementById('jag-family-type-' + user._id).innerHTML = "Propriétaire"
    if (!dog.family) {
        return
    }
    dog.family.forEach((membre) => {
        let familyCard = card.cloneNode(true)
        familyCard.style.display = 'flex'
        changeChildsId(familyCard, '-'+membre._id, 'jag-')
        list.appendChild(familyCard)
        console.log(familyCard)
        document.getElementById('jag-family-pict-' + membre._id).src = "https://app-api.mypet.fit/img/" + membre.image.type +"/"+ membre.image.uuid 
         document.getElementById('jag-family-pict-' + membre._id).srcset = "https://app-api.mypet.fit/img/" + membre.image.type +"/"+ membre.image.uuid 
        document.getElementById('jag-family-name-' + membre._id).innerHTML =membre.name
        document.getElementById('jag-family-type-' + membre._id).innerHTML = "Ma Famille"
    })
}


const switchInfo = (type) => {
    document.getElementById('jag-order-list').style.display = type == 'info' ? 'none' : 'flex'
    document.getElementById('jag-info-container').style.display = type == 'info' ? 'flex' : 'none'
}

const initOrder = async () => {
    loaderContainer.style.display = 'flex'
    let orders = await fetch(baseurl + '/user/order', {headers : header})
                        .then(async (res) => await res.json())
                        .then((res) => res.orders)
    let container = document.getElementById('jl-order-container')
    let node = document.getElementById('jag-order-list')
    orders.forEach((order) => {
        newCard = container.cloneNode(true)
        newCard.style.display = 'flex'
        changeChildsId(newCard, '-'+order._id, 'jag-')
        node.appendChild(newCard)
        document.getElementById('jag-order-ref-'+order._id).innerHTML = order.orderNumber
        document.getElementById('jag-order-date-'+order._id).innerHTML = getDate(order.createdAt)
        document.getElementById('jag-order-price-'+order._id).innerHTML = order.total.total / 100 + '€'
        document.getElementById('jag-order-status-'+order._id).innerHTML = order.status
        document.getElementById('jag-order-action-'+order._id).addEventListener('click', async () => {
            loaderContainer.style.display = 'flex'
            fetch(baseurl + '/order/'+ order._id +'/pdf', {
                method: 'GET',
                headers: header
            })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jl-facture-'+ order._id+'.pdf'; 
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
            loaderContainer.style.display = 'none'
        })
        document.getElementById('jag-order-list').style.display = 'flex'
        initInfos()
    })
}

const initInfos = async () => {
    let res = await fetch(baseurl + '/user/customer', {headers : header})
    let infos

    if (res.status == 404) {
        showAddCart('Utilisateur introuvable...')
        setTimeout(() => {
            history.back()
          }, "1000");
    }
    else {
        infos = await res.json()
    }

    if (infos)
    document.getElementById('jag-info-name').innerHTML = infos.result.customer.name
    document.getElementById('jag-info-firstname').innerHTML = infos.result.customer.name
    document.getElementById('jag-info-email').innerHTML = infos.result.customer.email
    document.getElementById('jag-info-livraison').innerHTML = infos.result.customer.address.line1+ ',' + infos.result.customer.address.city
    document.getElementById('jag-info-phone').innerHTML = infos.result.customer.phone
    document.getElementById('jag-info-facture').innerHTML = infos.result.customer.address.line1+ ',' + infos.result.customer.address.city

    loaderContainer.style.display = 'none'
}

const loginEmail = async () => {
    let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    let email = document.getElementById('jag-email').value
    if (email.match(regex)) {
        let result =  await fetch(baseurl + '/login', {
            method: "POST",
            headers : header,
            body: JSON.stringify({
                'email' : email,
            }), 
          }).then(async (res) => await res.json()) 
          if (result.code == '004') {
            document.getElementById('jag-code-popup').style.display = 'flex'
          }
          else {
            showAddCart('Email inconnu')
          }
    }
    else {
        showAddCart('Format email incorrect')
    }
}
const loginCode = async () => {
    let code = document.getElementById('Jag_PhoneToken').value
    let email = document.getElementById('jag-email').value

    if (code.length == 7) {
        let result =  await fetch(baseurl + '/login', {
            method: "POST",
            headers : header,
            body: JSON.stringify({
                     
                'email' : email,
                "phoneToken" : code
            }), 
          }).then(async (res) => await res.json()) 
          if (result.token) {
            window.localStorage.setItem('token', result.token)
            let searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('redirect')) {
                window.location.replace(searchParams.get('redirect'))
            }
            else {
                window.open('profil-chien', '_self')
            }
          }
          else {
            showAddCart('Code incorrect')
          }
    }
    else {
        showAddCart('Le code doit être au format 1234567')
    }
}

const formulaPageSwitch = (type) => {
    ids = ['abo', 'option', 'insurance']
    display = type;

    ids.forEach((id) => {
        let template = document.getElementById('jag-'+id+'-container')
        if (!template) {
            console.log('no found :', display)
            return
        }
        else if (id == display) {
            template.style.display = 'block'
        }
        else {
            template.style.display = 'none'
        }

    })
}

const cancelSubScription =  async () => {
    let code = document.getElementById('jag-delete-sms-input')
    let sub = dog.collar.formula_subscription._id

    if (code && code.value.length == 7) {
        let result = await fetch(
            baseurl + `/formula_subscription/${sub}/cancel`, {
            method: "POST",
            headers: header,
            body: JSON.stringify( {
                "phoneToken" : code.value,
            })
        })
        if (result.status == 200) {
            window.open('/my/confirmation-de-resiliation', '_self')
            checkAuth()
          }
          else {
            showAddCart('Oups, une erreur est survenue, rechargez la page', true)
          }
    }
    else {
        showAddCart('Code Incorrect', true)
      }

   
}

const cancelSubScriptionEmail = async () => {
    let sub = dog.collar.formula_subscription._id
    let result = await fetch(
        baseurl + `/formula_subscription/${sub}/cancel/email`, {
        method: "POST",
        headers: header,
        body: JSON.stringify( {
            "subscription" : sub,
            "collarId" : dog.collar._id
        })
    })
    .then(async (res) => await res.json())

    if (result.success) {
        showAddCart('Un mail vous à été envoyé', true)
    }
    else {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
    }
}

const changeSubscription = async (type) => {
    let sub = findAbonnementSolo(type).id
    let result = await fetch(
        baseurl + '/stripe/checkout_session/subscription/update', {
        method: "POST",
        headers: header,
        body: JSON.stringify( {
            "subscription" : sub,
            "collarId" : dog.collar._id
        })
    })
    .then(async (res) => await res.json())

    if (result.url) {
       window.open(result.url)
    }
    else {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
    }
}

const initOption = async () => {
    let types = ['abo']
    types.forEach((type) => {
        let card = document.getElementById('jag-'+type+'-card')
        let array = type == 'abo' ? abonnement : option.filter((elem) => elem.type == type)
        // TODO(dev): check formula in dog.collar.formula_subscription
        let formula = abonnement.find((elem) => elem.metadata.pId == 'formula_unique')
        
        let subFormula = findAbonnementSolo(dog.collar.formula_subscription.type ?? 'life')
        newCard = card.cloneNode(true)
        changeChildsId(newCard, '-'+subFormula.id, 'jag-')
        document.getElementById('jag-'+type+'-container').appendChild(newCard)
        document.getElementById('jag-'+type+'-name-'+subFormula.id).innerHTML = formula.name
        document.getElementById('jag-'+type+'-description-'+subFormula.id).innerHTML = subFormula.metadata.pricing
        document.getElementById('jag-'+type+'-renew-'+subFormula.id).innerHTML = 'À renouveler le : ' + getDate(dog.collar.formula_subscription.timeout)
        document.getElementById('jag-'+type+'-start-'+subFormula.id).innerHTML = 'Début le : '+ getDate(dog.collar.formula_subscription.subscription_date)
        if (dog.collar.formula_subscription.type == 'life') {
            document.getElementById('jag-'+type+'-stop-'+subFormula.id).addEventListener('click', () => showAddCart('Vous ne pouvez pas résilié'))
            document.getElementById('jag-'+type+'-stop-'+subFormula.id).style.display = 'none'
            document.getElementById('jl-abo-change').style.display = 'none'
           
        } else {
            document.getElementById('jag-'+type+'-stop-'+subFormula.id).addEventListener('click', () => window.open('/my/choix-abonnement-upgrade-b', '_self'))
        }
        if (dog.collar.formula_subscription.status == 'resilied') {
            let oldNode =  document.getElementById('jag-'+type+'-stop-'+subFormula.id)
            let node =  document.createElement('div')
            node.innerHTML = 'Résilié'
            oldNode.parentElement.replaceChild(node, oldNode)
            
        }
        card.style.display = 'none'
    })
    document.getElementById('jag-abo-container').style.display = 'block'
       
}


const getDate = (ts) => {
    var date = new Date(ts);

    var jour = date.getDate();
    var mois = date.getMonth() + 1; // Les mois commencent à partir de 0, donc ajoutez 1
    var annee = date.getFullYear() % 100; // Obtenez les deux derniers chiffres de l'année
    
    if (jour < 10) {
        jour = '0' + jour;
    }
    if (mois < 10) {
        mois = '0' + mois;
    }
    if (annee < 10) {
        annee = '0' + annee;
    }
    
    var dateFormatted = jour + '/' + mois + '/' + annee;
    
    return(dateFormatted);
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
    const url = window.location.origin + window.location.pathname;
    let check = document.getElementById('jag_Abonnement_check')
    if (check && check.checked) {
        let subscription = findAbonnementSolo(type).id
        loaderContainer.style.display = 'flex'
        const result = await fetch('https://app-api.mypet.fit/stripe/checkout_session/subscription', {
            method: "POST",
            headers : header,
            body: JSON.stringify({
                     
                'subscription' : subscription,
                'phone' : window.localStorage.phone,
                'serialNumber' : window.localStorage.serial,
                'referer': url,
            }), 
          }).then(async (res) => await res.json()) 
          if (result.url) {
            loaderContainer.style.display = 'none'
            window.open(result.url, '_self')
          }
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

const initMap = async (node) => {
    let position
    let data = await fetch(baseurl + `/collar/${dog.collar.simcardID}/checkgeolocation`, {
        method: 'GET',
        headers : header
    }).then(async (res) => res.json())
    console.log('data => ', data)
    if (data.CellTower) {
        position = { lat: data.CellTower.lat ?? 50.64144516315174, lng: data.CellTower.lon ?? 3.045265016887294 };
    } else {
        position =  { lat: 50.64144516315174, lng: 3.045265016887294 };
    }
    const { Map } = await google.maps.importLibrary("maps");
        console.log(position)
      map = new Map(node, {
        zoom: 14,
        center: position,
        mapId: "DEMO_MAP_ID",
      });
}

const initActivity = (type) => {
    let container = document.getElementById('jl-activity-card-container')

    for (let i = container.childNodes.length - 1; i >= 1; i--) {
        container.childNodes[i].remove()
    }

    let card = document.getElementById('jag-activity-card')
    let array = type == 'moment' ? dog.activities.moments : type == 'activity' ? dog.activities.personalActivities : dog.activities.rescues
    array.forEach((activity) => {
        if (activity.start_timestamp && activity.end_timestamp) {
            newCard = card.cloneNode(true)
            changeChildsId(newCard, '-' + activity._id, 'jl')
            newCard['data-id'] = activity._id
            container.appendChild(newCard)
            newCard.style.display = 'flex'
            document.getElementById('jl-activity-card-type-' + activity._id).innerHTML = activity.activity_id
           
            start =  new Date(activity.start_timestamp);
            end = new Date(activity.end_timestamp);
            if (activity.start_timestamp && activity.end_timestamp) {
                document.getElementById('jl-activity-card-time-' + activity._id).innerHTML =  'De ' + (start.getHours() < 10 ? "0" +  start.getHours() : start.getHours()) + "h" + (start.getMinutes() < 10 ? "0" +  start.getMinutes() : start.getMinutes()) + ' à '  + (end.getHours() < 10 ? "0" +  end.getHours() : end.getHours()) + "h" + (end.getMinutes() < 10 ? "0" +  end.getMinutes() : end.getMinutes())
                if (activity.duration) {
                    document.getElementById('jl-activity-card-duration-' + activity._id).innerHTML = new Date(activity.duration * 1000).toISOString().substring(14, 19)
                }
                document.getElementById('jl-activity-card-date-' + activity._id).innerHTML = start.getDay() + ' ' +  getMonth(start.getMonth())
            }
            if (activity.distance) {
                distance = activity.distance > 1000 ? activity.distance /1000 + 'km' : activity.distance + 'm'
                document.getElementById('jl-activity-card-distance-' + activity._id).innerHTML = 'Distance parcourue de ' + distance
            }
        }
        if (type == 'activity') {
            if (!activity.duration || !activity.distance) {
                newCard.style.color = "#00000036"
                newCard.style.opacity = 0.5
            }
            else {
                newCard.addEventListener('click', () => setMap(activity));
            }
        }
    })
    card.style.display = 'none'
}


const setMap = async (activity) => {
    if(path) {
        path.setMap(null)
    }
    let datas =  await fetch(baseurl + '/personal_activity/' + activity._id, {headers : header}).then(async (res) => await res.json())
    console.log(datas)
    if (!datas.data.gps_data) {
        showAddCart('Oups pas de données')
        return
    }
    let line =  Object.values(JSON.parse(datas.data.gps_data)).map((line) => { res = {}; res.lat = line.lat; res.lng = line.lng; return res;})
    path = new google.maps.Polyline({
        path: line,
        geodesic: true,
        color: '#4287f5',
        width: 5,
      });
      console.log(Object.values(JSON.parse(datas.data.gps_data))[0])
    map.setCenter(Object.values(JSON.parse(datas.data.gps_data))[0])
    map.setZoom(14)
    path.setMap(map)
    document.getElementById('jag-detail-activity-lenght').innerHTML = datas.data.distance > 1000 ? datas.data.distance /1000 : datas.data.distance
    document.getElementById('jag-detail-activity-lenght-id').innerHTML = datas.data.distance > 1000 ? 'Km' : 'm'
    document.getElementById('jag-detail-activity-time').innerHTML = new Date(datas.data.duration * 1000).toISOString().substring(14, 19)
    document.getElementById('jag-detail-activity-speed').innerHTML = `${((datas.data.distance /1000) / (datas.data.duration ?? 1))}`.substring(0,3)
}


const validateAction = async () => {
    let value = document.getElementById('Jag_Activation_phoneToken').value
    let serial = window.localStorage.getItem('serial')
    let phone = window.localStorage.getItem('phone')
    if (!value) {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
        return
    }
    const result = await fetch(baseurl + '/login/activation', {
        method: "POST",
        headers : header,
        body: JSON.stringify({
            "phone": phone,
            "serialNumber": serial,
            "phoneToken": value
        }), 
      }).then((res) => res.status) 
      
      if (result == 200) {
        window.open('activation-produit-etape02-copy', '_self')
      }
      else {
        showAddCart('Code incorrect', true)
      }
       
      return

}

const checkActivation = async () => {
    const regexPhone = '^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$'
    const reglexSerial = 'JL[A-Za-z0-9]-[A-Za-z0-9]{8}'

    let serial = document.getElementById('jl_Activation_serialNumber').value
    let phone = document.getElementById('jl_Activation_phoneNumber').value.replaceAll(' ', '')

    if (!phone.match(regexPhone)) {
        showAddCart('Numéro de téléphone incorrect', true)
        return
    }
    if (!serial.match(reglexSerial)) {
        showAddCart('Numéro de serie incorrect (JL1-1111A11A)', true)
        return
    }
    phone = phone.replace('+', '00')
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
            if (document.getElementById('Jag_Popup_phoneToken')) {
                document.getElementById('Jag_Popup_phoneToken').style.display = 'flex'
                window.localStorage.serial = serial
                window.localStorage.phone = phone
            }
            else {
                showAddCart('Oups, une erreur est survenue, rechargez la page', true)
            }
            break
        case 400 :
            showAddCart('Ce boîtier est déjà activé', true)
            break 
        case 404 : 
            showAddCart('Boîtier inconnu', true)
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

const getOption = async () => {
    if (window.localStorage.getItem('option')) {
        option = JSON.parse(window.localStorage.getItem('option'))
        return
    }
    result =  await fetch(baseurl + '/collar_options/e-commerce/options', {
      method: "GET",
      headers : header,
  })
  
  if (result.status != 200) {
      showAddCart('Oups, une erreur est survenue, rechargez la page', true)
  }
  option = await result.json()
  window.localStorage.setItem('option', JSON.stringify(option))
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

const getDog = async () => {
    dog = JSON.parse(localStorage.getItem('dog'))
    if (dog) {
        return
    }
    if (user.dogs.length != 0) {
        dog = await fetch(baseurl + '/dog/'+ user.dogs[0]._id, {headers : header})
            .then(async (res) => await res.json())
            .then((res) => res.dog)
        dog.battery = await fetch(baseurl + '/collar/'+ dog.collar.simcardID+'/battery', {headers : header})
            .then(async (res) => await res.json())
            .then((res) => res.BatteryInfos)
        dog.flash = await fetch(`https://app-api.mypet.fit/collar/${dog.collar.simcardID}/flash`, {
            method: 'GET',
            headers: header
        }).then(async (value) => await value.json());
        dog.geolocation = await fetch(baseurl + `/collar/${dog.collar.simcardID}/checkgeolocation`, {
            method: 'GET',
            headers : header
        }).then(async (res) => res.json())


    }
    window.localStorage.setItem('dog', JSON.stringify(dog))
}

let getNewAbo = () => {
    if (dog.collar.formula_subscription.type) {
        return findAbonnementSolo(dog.collar.formula_subscription.type)
    }
    return dog.collar.formula_subscription.type
}

const getUser = async () => {
    user = JSON.parse(localStorage.getItem('user'))

    if (!user) {
        loaderContainer.style.display = 'flex'
        user = await fetch(baseurl + '/profile/full', {headers : header})
        .then(async (res) => await res.json())
        .then((res) => res.user)
        
        user.galery = await fetch(baseurl + '/user/gallery?sharing=false', {headers : header})
        .then(async (res) => await res.json())
        .then(async (res) => res.personalActivities)
        window.localStorage.setItem('user',JSON.stringify(user))
    }
    await getDog()
    if (!dog.welfareData) {
        await getWelfareData()
    }
    loaderContainer.style.display = 'none'
}

const setidentity = () => {
    initFamily()
    let race = dog.race ?? dog.dadRace ?? dog.momRace
    let food = JSON.parse(dog.food ?? '{}')
    document.getElementById('jag-profil-identity-pict').src = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid 
    document.getElementById('jag-profil-identity-pict').srcset = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid 
    document.getElementById('jag-profil-identity-name').innerHTML = dog.name 
    document.getElementById('jag-profil-identity-Iname').innerHTML = dog.name
    document.getElementById('jag-profil-identity-id').innerHTML = dog.publicId
    document.getElementById('jag-profil-identity-bio').innerHTML = dog.biography?? 'Biographie'
    document.getElementById('jag-profil-identity-sexe').innerHTML = dog.gender
    document.getElementById('jag-profil-identity-birthdate').innerHTML = getDate(dog.birthDate)
    document.getElementById('jag-profil-identity-weight').innerHTML = dog.weight
    document.getElementById('jag-profil-identity-size').innerHTML = dog.size
    document.getElementById('jag-profil-identity-silouhette').innerHTML = dog.silhouette
    document.getElementById('jag-profil-identity-breed').innerHTML =race.name
    document.getElementById('jag-profil-identity-lof').firstChild.style['background-color'] = dog.isLOF ? '' : 'grey'
    document.getElementById('jag-profil-identity-steril').firstChild.style['background-color'] = dog.sterilized ? '' : 'grey'
    // TODO(dev): add disable state on food
    document.getElementById('jag-profil-food-moring').innerHTML = (food.morning ?? '-') + ' g'
    document.getElementById('jag-profil-food-noon').innerHTML = (food.noon ?? '-') + ' g'
    document.getElementById('jag-profil-food-night').innerHTML = (food.evening ?? '-') + ' g'
    document.getElementById('jag-profil-food-all').innerHTML = ((food.morning ?? 0) + (food.noon ?? 0) + (food.evening ?? 0)) == 0 ? '-' : ((food.morning ?? 0) + (food.noon ?? 0) + (food.evening ?? 0)) + 'g'
    if (food.foodType && food.foodType.type) {
        document.getElementById('jag-profil-food-type').innerHTML = food.foodType.type == 'indus' ? 'Croquette' : 'fait maison'
    }
    document.getElementById('jag-profil-welfare-calory').innerHTML = dog.welfareData.global.calory_global ?? '-'
    document.getElementById('jag-profil-welfare-rest').innerHTML = dog.welfareData.global.rest_global ?? '-'
    document.getElementById('jag-profil-welfare-trophy').innerHTML = dog.welfareData.global.trophy_global ?? '-'
    document.getElementById('jag-profil-welfare-welfare').innerHTML = dog.welfareData.global.welfare_global ?? '-'
}

const initDashboard = async (node) => {
    await getUser()
  
    initGalery()
    loaderContainer.style.display = 'flex'
    let container = document.getElementById('jag-profil-dog-container');
    user.dogs.forEach((localDog) => {
                newCard = container.cloneNode(true)
                newCard.style.display = 'flex'
                changeChildsId(newCard, '-'+localDog._id, 'jag-')
                node.appendChild(newCard)
                document.getElementById('jag-profil-dog-name-'+localDog._id).innerHTML = localDog.name ?? ''
                document.getElementById('jag-profil-dog-id-'+localDog._id).innerHTML = localDog.publicId ?? ''
                document.getElementById('jag-profil-dog-pict-'+localDog._id).src = "https://app-api.mypet.fit/img/" + localDog.image.type +"/"+ localDog.image.uuid 
                document.getElementById('jag-profil-dog-pict-'+localDog._id).srcset = "https://app-api.mypet.fit/img/" + localDog.image.type +"/"+ localDog.image.uuid 
    
                newCard.addEventListener('click', async () => {
                     loaderContainer.style.display = 'flex'
                  dog = await fetch(baseurl + '/dog/'+ localDog._id +'?activity_limit=5', {headers : header})
                        .then(async (res) => await res.json())
                        .then((res) => res.dog)
                     loaderContainer.style.display = 'none'
                    setidentity()
                })
        })
    setidentity()
    loaderContainer.style.display = 'none'
}

const checkAuth = async () => {
    let url = new URL(window.location.href)
    let searchParams = new URLSearchParams(window.location.search);

    if (url.pathname == REDIRECT) {
        let goTo = searchParams.has('redirect') ? searchParams.get('redirect') : 'profil-chien'
        let token = localStorage.getItem('token') ?? url.searchParams.get('HeyJag')
        if (token) {
            localStorage.setItem('token', token) 
            header.Authorization = 'Bearer ' + token
            window.open(goTo, '_self')
            return
        }
    } else {
        if (localStorage.getItem('token')) {
            token = window.localStorage.getItem('token')
            header.Authorization = 'Bearer ' + token
            return
        }
        else if (url.searchParams.has('HeyJag')) {
            token = url.searchParams.get('HeyJag')
            header.Authorization = 'Bearer ' + token
            localStorage.setItem('token', token)
            return
        }
        else {
            window.location.replace(REDIRECT+'?redirect='+url.pathname);
        }
    }
}

const getWelfareData = async () => {
    let date = Date.now()
    let result =  await fetch(baseurl + `/collar/${dog.collar.simcardID}/new_welfare_data/${date}`, {
        method: "GET",
        headers : header,
    }).then(async (res) => res.json())

    dog.welfareData = result
}

const disableButton = () => {
    let newBtn = document.getElementById('jag-my-formula')
    newBtn.style.display = 'none'
    let id = 'month'
    switch(getNewAbo().metadata.pricing) {
        case 'monthly' :
            id =  'month'
            break
        case 'yearly' :
            id =   'year'
            break
        case 'life' :
            id =   'life'
            break
    }
    let btn = document.getElementById('jl_switch_' + id)
    btn.style.display = 'none'
    newBtn.style.display = 'block'
    btn.parentElement.appendChild(newBtn)

    btn.remove()
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
        initAboB()
    }
    else if (document.getElementById('jag-formula')) {
        await loadAbonnement()
        abonnement = JSON.parse(localStorage.getItem('abonnement'))
        await getOption()
        await getUser()

        await initOption()
    
    }
    else if (document.getElementById('jag-switch-abo')) {
        await loadAbonnement()
        abonnement = JSON.parse(localStorage.getItem('abonnement'))
        await getUser()
        initAboB()
        disableButton()
    }
    else if (document.getElementById('jag-abo-stop')) {
        await loadAbonnement()
        abonnement = JSON.parse(localStorage.getItem('abonnement'))
        await getUser()
    }
    else if (document.getElementById('jl-profil-dog-name') || document.getElementById('jl-collar-battery') ) {
        await getUser()
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
    checkAuth()
    getAll()
}