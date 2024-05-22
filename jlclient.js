

const baseurl = 'https://app-api.mypet.fit'
const REDIRECT = {
    login : 'seconnecter',
    dashboard : 'profil-chien',
    home : 'localisation-activite',
    abo : 'choix-abonnement-upgrade-b',
    stop : 'confirmation-de-resiliation',
    active : 'activation-1-3',
    active_2 : 'activation-produit-etape02-copy',
    active_3 : 'step3',
}

const ACTIVITY_PICT = {
    bike : '',
}


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
let circle
let path

const findAbonnementSolo = (type) => {
    return abonnement.find((elem) => elem.metadata.pId == 'formula_unique').prices.find((elem) => elem.metadata.pricing == type)
}
 // TODO(dev): migrate findAbonnementSolo to use findNewAbonnementSolo
const findNewAbonnementSolo = (type) => {
    return abonnement.filter((elem) => elem.metadata.pId.includes('formula_unique_')).find((elem) => elem.metadata.pricing == type)
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

    'jl-profil-user-name' : (node) => node.innerHTML = session?.order?.customer?.name ?? '',
    'jl-nav-dog-name' : (node) => node.innerHTML = dog?.name ?? '',
    'jl-nav-dog-pict' : (node) =>  { node.src = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid; node.srcset = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid  },
    'jl-profil-dog-picture' : (node) => { node.src = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid; node.srcset = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid  },
    'jl-profil-dog-name' : (node) => node.innerHTML = dog.name,
    'jl-profil-dog-id' : (node) => node.innerHTML = dog.publicId[0] == '@' ? dog.publicId : `@${dog.publicId}`,
    'jl-logout' : (node) => node.addEventListener('click', () => logout()),
    'jl-collar-battery' : (node) => node.innerHTML = (dog.battery.soc ?? '0') +'%',
    'jl-collar-serial' : (node) => node.innerHTML = dog.collar.serialNumber,
    'jl-collar-id' : (node) => node.innerHTML = dog.collar.name,
    'jl-collar-activation' : (node) => node.innerHTML = getDate(dog.collar.activationDate),
    'jl-collar-version' : (node) => node.innerHTML = dog.collar.firmwareVersion,
    'jl-collar-autonomy' : (node) => node.innerHTML = dog.battery.estimated != -1 ? 'Il reste environ ' + converTimestamp(dog.battery.estimated) + " d'autonomie" : '',
    'jl-collar-synchro-date' : (node) => node.innerHTML = dog.geolocation.LastConnect ? 'Dernière mise à jour: ' +  getDate(parseInt(Math.round(dog.geolocation.LastConnect) + '000')) : '',
    'jl_Activation_serialNumber' : (node) => node.value = new URLSearchParams(window.location.search).get('sn'),
    'jl_Activation_phoneNumber' : (_) => checkActivationToken(),
    'jl-map' : (node) => initMap(node),
    'jl-geofencing-label' : (node) => initGeoFencingLabel(node,),
    'jl-geofencing-switch' : (node) => initGeoFencingSwitch(node),
    'jl-smartdock-card' : (node) => initSmartDock(node), 
    'jl-is-moment' : (_) =>  initActivity('moment'),
    'jl-activity-activity' : (node) => node.addEventListener('click', () => initActivity('activity')),
    'jl-activity-rescue' : (node) => node.addEventListener('click', () => initActivity('rescue')),
    'jl-is-activity' : () =>  initActivity('activity'),
    'jl_Activation_Action' : (node) => node.addEventListener('click', () => checkActivation()),
    'jl_Abonnement_starter_action' : (node) => node.addEventListener('click', () => aboAction('monthly')),
    'jl_Abonnement_family_action' : (node) => node.addEventListener('click', () => aboAction('yearly')),
    'jl-galerie-link' : (node) => node.innerHTML = node.innerHTML.replace('{{nameDog}}', dog.name),
    'jl_Abonnement_Premium_action' : (node) => node.addEventListener('click', () => aboAction('life')),
    'jl-abo-change' : (node) => node.addEventListener('click', () => window.open(REDIRECT.abo)),
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
    'jl-activation-resend-code' : (node) => node.addEventListener('click', () => resendActivationCode()),
    'jl-resend-code' : (node) => node.addEventListener('click', () => resendCode()),
    'jl-collar-synchro-state' : (node) => node.innerHTML = dog.geolocation.endpointStatus ? 'Le boîtier est connecté' : 'Le boîtier est en veille',
    'jl-collar-synchro-last-date' : (node) => node.innerHTML = dog.flash.tmsLastInfo ? getDate(dog.flash.tmsLastInfo) : 'Pas encore synchronisé',
    'jl-galery-list-0' : () => intiPict()
}

const logout = () => {
    window.localStorage.clear()
    window.open(REDIRECT.login, '_self')
}

let intiPict = () => {
    let container = document.getElementById('jag-pict-container')

    user.galery.forEach((elem) => {
        let url = "https://app-api.mypet.fit/img/" + elem.image.type +"/"+ elem.image.uuid 
        let pict = container.cloneNode(true)
        pict.src = url
        pict.srcset = url
        pict.style.display = 'flex'
    
        document.getElementById('jl-galery-list-' +new Date(elem.timestamp).getMonth()).appendChild(pict)
    })
}


const initSmartDock = (node) => {
    let assigned = dog.dock?.result?.assigned

    if (assigned == undefined) {
        node.style.display = 'none'
        return
    }

    document.getElementById('jl-smartdock-title').innerHTML = assigned ? 'Smartdock appairé' : 'Smartdock non-appairé'
    if (!assigned) {
        document.getElementById('jl-smartdock-desc').innerHTML = "Configurez-le sur l'application"
    }
    else {
        let connected = dog.dock?.data?.dock_status?.isConnected ?? false
        document.getElementById('jl-smartdock-desc').innerHTML = connected ? 'Connecté' : 'Non-Connecté'
        if (!connected) {
            document.getElementById('jl-smartdock-pic-activate').parentElement.style.display = 'none'
            document.getElementById('jl-smartdock-pic-desactivate').parentElement.style.display = 'flex'
            
        }
    }
    
}

const initGeoFencingLabel = (node) => {
    if (!dog.collar.settings.geofencing) {
        node.innerHTML = 'Non configurée'
        return
    }
    let data = JSON.parse(dog.collar.settings.geofencing)
    if (data.label == "") {
        document.getElementById('jag-geofencing-card').style.display = 'none'
    }
    node.innerHTML = `${data.active ? 'Activée' : 'Désactivée'} dans un rayon de ${data.radius}m autour de ${data.label.name}`
}

const initGeoFencingSwitch = (node) => {
    if (!dog.collar.settings.geofencing) {
        return
    }
    let data = JSON.parse(dog.collar.settings.geofencing)
    node.innerHTML = `<label class="switch"><input type="checkbox" id="jag-geofencing-slider" ><span class="slider round" ></span></label>`
    let slider = document.getElementById('jag-geofencing-slider')
    slider.checked = data.active
    slider.addEventListener('click', async () => {
        data.active = slider.checked
        let res = await fetch(baseurl + `/collar/${dog.collar.simcardID}/settings`, {
            headers : header,
            method : 'POST',
            body : JSON.stringify({'field': ['geofencing'], 'value': [JSON.stringify({active: slider.checked})]}),
        }).then(async (res) => res.json())
        if (res.code == '001') {
            document.getElementById('jl-geofencing-label').innerHTML = `${data.active ? 'Active' : 'Désactié'} dans un rayon de ${data.radius}m autour de ${data.label.name}`
        }
    })
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
    window.open(REDIRECT.home, '_self')
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

    const getorderStatus = (status) => {
        switch (status) {
            case 'new' : 
                return 'En cours de traitement'
            default :
            return `(${status})`
        }
    }

    loaderContainer.style.display = 'flex'
    let orders = await fetch(baseurl + '/user/order', {headers : header})
                        .then(async (res) => await res.json())
                        .then((res) => res.orders)
    let container = document.getElementById('jl-order-container')
    let node = document.getElementById('jag-order-list')
    orders.filter((elem) => elem.type == 'product').forEach((order) => {
        newCard = container.cloneNode(true)
        newCard.style.display = 'flex'
        changeChildsId(newCard, '-'+order._id, 'jag-')
        node.appendChild(newCard)
        document.getElementById('jag-order-ref-'+order._id).innerHTML = order.orderNumber
        document.getElementById('jag-order-date-'+order._id).innerHTML = getDate(order.createdAt)
        document.getElementById('jag-order-price-'+order._id).innerHTML = order.total.total / 100 + '€'
        document.getElementById('jag-order-status-'+order._id).innerHTML = getorderStatus(order.status)
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
        container.style.display = 'none'
        initInfos()
    })
}

const initInfos = async () => {
    document.getElementById('jag-info-container').style.display = 'none'
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

    if (infos) {
        document.getElementById('jag-info-name').innerHTML = infos.result.customer.name
        document.getElementById('jag-info-firstname').innerHTML = infos.result.customer.name
        document.getElementById('jag-info-email').innerHTML = infos.result.customer.email
        document.getElementById('jag-info-livraison').innerHTML =  infos.result.customer?.address ? infos.result.customer?.address.line1+ ',' + infos.result.customer?.address?.city : 'Inconnue'
        document.getElementById('jag-info-phone').innerHTML = infos.result.customer.phone.replace('0033', '0')
        document.getElementById('jag-info-facture').innerHTML =  infos.result.customer?.address ? infos.result.customer?.address.line1+ ',' + infos.result.customer?.address?.city : 'Inconnue'
        loaderContainer.style.display = 'none'
    }
    else {
        showAddCart('Utilisateur introuvable...')
        setTimeout(() => {
            history.back()
          }, "1000");
    }
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
                let goTo = searchParams.get('redirect')
                 goTo = REDIRECT[goTo] ?? REDIRECT.home
                window.location.replace(goTo)
            }
            else {
                window.open(REDIRECT.home, '_self')
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
            window.open(REDIRECT.stop, '_self')
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
    let sub = findNewAbonnementSolo(type).prices[0].id
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
        let formula = abonnement.find((elem) => elem.metadata.pId == 'formula_unique')
        
        let subFormula = findNewAbonnementSolo(dog.collar.formula_subscription.type ?? 'life')
        newCard = card.cloneNode(true)
        changeChildsId(newCard, '-'+subFormula.prices[0].id, 'jag-')
        document.getElementById('jag-'+type+'-container').appendChild(newCard)
        document.getElementById('jag-'+type+'-name-'+subFormula.prices[0].id).innerHTML = subFormula.name
        if( dog.collar.formula_subscription.type == 'life') {
            document.getElementById('jag-'+type+'-renew-'+subFormula.prices[0].id).style.display = 'none'
        }
        else {
            document.getElementById('jag-'+type+'-renew-'+subFormula.prices[0].id).innerHTML = 'Au ' + getDate(dog.collar.formula_subscription.timeout)
        }
        document.getElementById('jag-'+type+'-start-'+subFormula.prices[0].id).innerHTML = 'Du '+ getDate(dog.collar.formula_subscription.subscription_date)
        if (subFormula.prices[0].metadata.pricing == 'life') {
            document.getElementById('jag-'+type+'-stop-'+subFormula.prices[0].id).addEventListener('click', () => showAddCart('Vous ne pouvez pas résilié'))
            document.getElementById('jag-'+type+'-stop-'+subFormula.prices[0].id).style.display = 'none'
            document.getElementById('jl-abo-change').style.display = 'none'
           
        } else {
            document.getElementById('jag-'+type+'-stop-'+subFormula.prices[0].id).addEventListener('click', () => window.open(REDIRECT.abo, '_self'))
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
    var mois = date.getMonth() + 1;
    var annee = date.getFullYear() % 100;
    
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

const getSize = (size) => {
    switch(size) {
        case 'verySmall' :
             return 'Très petite' 
        case 'small' :
             return 'Petite'  
        case 'tall' :
             return 'Grande'  
        case 'veryTall' :
             return 'Très grande'
        default : 
             return 'Moyenne'
    }
}
const getSilhouette = (silhouete) => {
    switch(silhouete) {
        case 'verySkinny' :
             return 'Très maigre' 
        case 'skinny' :
             return 'Maigre'  
        case 'Maigre' :
             return 'Excès de poids'  
        case 'obese' :
             return 'En surpoids'
        default : 
             return 'Idéale'
    }
}

const getAboType = (type) => {
    switch(type) {
        case 'monthly' :
             return 'Paiement mensuel' 
        case 'yearly' :
             return 'Paiement annuel'  
        default : 
             return 'À vie'
    }
}

const getActivity = (name) => {
    switch(name) {
        case 'footing' :
            return 'CaniCross' 
        case 'chasse' :
            return 'Chasse'
        case 'bike' :
            return 'CaniVTT'
        case 'crossfit' :
            return 'Parcours libre'
        case 'promenade' :
            return 'Balade'
        case 'city_dogsitting' :
            return 'DogSitting'  
        case 'cani_rando' :
            return 'CaniRando'  
        case 'away' :
            return 'Absence'  
        case 'rescue' : 
            return 'Localisation'
        default : 
             return `Autre (${name})`
    }
}



const getMonth = (month) => {switch (month) {
    case 0:
        return "janv";
    case 1:
        return "févr";
    case 2:
        return "mars";
    case 3:
        return "avri";
    case 4:
        return "mai";
    case 5:
        return "juin"
    case 6:
        return "juil";
    case 7:
        return "août";
    case 8:
        return "sept";
    case 9:
        return "octo";
    case 10:
        return "nove";
    case 11:
        return "déce";
    default:
        return "";
}}

const redirectStep2 = () => {
    if (!window.localStorage.serial || !window.localStorage.phone) {
        window.open(REDIRECT.active, '_self')
    }
}

const aboAction = async (type) => {
    const url = window.location.origin + window.location.pathname;
    let check = document.getElementById('jag_Abonnement_check')
    if (check && check.checked) {
        let subscription = findNewAbonnementSolo(type).prices[0].id
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
          }).then(async (res) => await res?.json()) 
          if (result.url) {
            loaderContainer.style.display = 'none'
            window.open(result.url, '_self')
          }
          else {
            showAddCart('Oups, une erreur est survenue, rechargez la page', true)
            setTimeout(() => {
                window.open(REDIRECT.active, '_self')
              }, "1000");
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
    const { Map } = await google.maps.importLibrary("maps");

    if (data.CellTower) {
        position = { lat: data.CellTower.lat, lng: data.CellTower.lon};
        map = new Map(node, {
            zoom: 14,
            center: position,
            mapId: "map",
        });
        circle = new google.maps.Circle({
            strokeColor: 'grey',
            fillColor: 'grey',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillOpacity: 0.35,
            map,
            center: position,
            radius: data.CellTower?.accuracy ?? 500,
          });
 
    } 
    else {
        setTimeout(() => initMap(node), 20000)
    }
    
}

const initActivity = (type) => {
    if (type != 'moment') {

        let color = ['var(--main)', 'var(--gristypofaible)']
        document.getElementById('jag-detail-activity').style.display = type == 'none'
        
        if (type == 'rescue') {
            color = color.reverse()
        }
        
        document.getElementById('jl-activity-activity').style.color = color[0]
        document.getElementById('jl-activity-activity').style.borderColor = color[0]
        document.getElementById('jl-activity-rescue').style.color = color[1]
        document.getElementById('jl-activity-rescue').style.borderColor = color[1]
        
    }

    let container = document.getElementById('jl-activity-card-container')

    for (let i = container.childNodes.length - 1; i >= 1; i--) {
        container.childNodes[i].remove()
    }

    let card = document.getElementById('jag-activity-card')
    let array = type == 'moment' ? dog.activities.moments : type == 'activity' ? dog.activities.personalActivities : dog.activities.rescues
    array.sort(function(a,b){
        return new Date(b.start_timestamp) - new Date(a.start_timestamp);
      });
    array.forEach((activity) => {
        let distance
        if (activity.start_timestamp && activity.end_timestamp) {
            newCard = card.cloneNode(true)
            changeChildsId(newCard, '-' + activity._id, 'jl')
            newCard['data-id'] = activity._id
            container.appendChild(newCard)
            newCard.style.display = 'flex'
            document.getElementById('jl-activity-card-type-' + activity._id).innerHTML = getActivity(activity.activity_id)
           
            start =  new Date(activity.start_timestamp);
            end = new Date(activity.end_timestamp);
            if (activity.start_timestamp && activity.end_timestamp) {
                document.getElementById('jl-activity-card-time-' + activity._id).innerHTML =  'De ' + (start.getHours() < 10 ? "0" +  start.getHours() : start.getHours()) + "h" + (start.getMinutes() < 10 ? "0" +  start.getMinutes() : start.getMinutes()) + ' à '  + (end.getHours() < 10 ? "0" +  end.getHours() : end.getHours()) + "h" + (end.getMinutes() < 10 ? "0" +  end.getMinutes() : end.getMinutes())
                if (activity.duration) {
                    document.getElementById('jl-activity-card-duration-' + activity._id).innerHTML = new Date(activity.duration * 1000).toISOString().substring(14, 19)
                }
                else {
                    document.getElementById('jl-activity-card-duration-' + activity._id).innerHTML = new Date(0).toISOString().substring(14, 19)
                }
                document.getElementById('jl-activity-card-date-' + activity._id).innerHTML = start.getDate() + ' ' +  getMonth(start.getMonth())
            }
            if (activity.distance) {
                distance = activity.distance > 1000 ? activity.distance /1000 + 'Km' : activity.distance + 'm'
            }
            document.getElementById('jl-activity-card-img-' + activity._id)?.src = ''
            document.getElementById('jl-activity-card-img-' + activity._id)?.srcset = ''
            if (type != 'moment')
            document.getElementById('jl-activity-card-distance-' + activity._id).innerHTML = 'Distance parcourue de ' + (distance ?? '0m')
            if (type == 'activity') {
                if (!activity.duration || !activity.distance) {
                    newCard.style.color = "#00000036"
                    newCard.style.opacity = 0.5
                }
                else {
                    newCard.addEventListener('click', () => setMap(activity));
                }
            }
        }
    })
    card.style.display = 'none'
}

const setBound = () => {
    if (!map || !path) {
        return
    }
    let bounds = new google.maps.LatLngBounds();
    let newPath = path.getPath();

    let slat, blat = newPath.getAt(0).lat();
    let slng, blng = newPath.getAt(0).lng();

    for(let i = 1; i < newPath.getLength(); i++)
    {
        let e = newPath.getAt(i);
        slat = ((slat < e.lat()) ? slat : e.lat());
        blat = ((blat > e.lat()) ? blat : e.lat());
        slng = ((slng < e.lng()) ? slng : e.lng());
        blng = ((blng > e.lng()) ? blng : e.lng());
    }

    bounds.extend(new google.maps.LatLng(slat, slng));
    bounds.extend(new google.maps.LatLng(blat, blng));
    map.fitBounds(bounds)
}

const setMap = async (activity) => {
    document.getElementById('jag-detail-activity').style.display = 'flex'
    document.getElementById('jag-detail-rescue').style.display = 'none'
   
    clearMap()

    let datas =  await fetch(baseurl + '/personal_activity/' + activity._id, {headers : header}).then(async (res) => await res.json())
    if (!datas.data.gps_data) {
        showAddCart('Oups pas de données')
        return
    }
    let line =  Object.values(JSON.parse(datas.data.gps_data)).map((line) => { res = {}; res.lat = line.lat; res.lng = line.lng; return res;})
    if (!map) {
        try {
            map = new Map(document.getElementById('jl-map'), {
                zoom: 14,
                center: line[0],
                mapId: "DEMO_MAP_ID",
            });
        }
        catch (e) {
            showAddCart('Oups, une erreur est survenue, rechargez la page', true)
        }
    }

    path = new google.maps.Polyline({
        path: line,
        geodesic: true,
        strokeColor: '#4287f5',
        width: 5,
      });
    path.setMap(map)
    setBound()
    document.getElementById('jag-detail-activity-lenght').innerHTML = (datas.data.distance > 1000 ? datas.data.distance /1000 : datas.data.distance).toFixed(2)
    document.getElementById('jag-detail-activity-lenght-id').innerHTML = datas.data.distance > 1000 ? 'Km' : 'm'
    document.getElementById('jag-detail-activity-time').innerHTML = new Date(datas.data.duration * 1000).toISOString().substring(14, 19)
    document.getElementById('jag-detail-activity-speed').innerHTML = `${((datas.data.distance /1000) / (datas.data.duration ?? 1))}`.substring(0,3)
}

const resendActivationCode = async () => {
    let serial = window.localStorage.getItem('serial')
    let phone = window.localStorage.getItem('phone')
    if (!serial || !phone) {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
        return
    }
    const result = await fetch(baseurl + '/event/resend_activation_token', {
        method: "POST",
        headers : header,
        body: JSON.stringify({
            "phone": res = phone.slice(0, -9).replace('+', '0000000').slice(-4) + phone.slice(-9),
            "serialNumber": serial,
        }), 
      }).then((res) => res.status) 
      
      if (result == 200) {
        showAddCart('Le code a été renvoyé', true)
      }
      else {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
      }

      return
}
const resendCode = async () => {
    let email = document.getElementById('jag-email').value

    if (!email) {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
        return
    }
    const result = await fetch(baseurl + '/resend_token', {
        method: "POST",
        headers : header,
        body: JSON.stringify({
            "email": email,
            "type": 'sms',
        }), 
      }).then((res) => res.status) 
      
      if (result == 200) {
        showAddCart('Le code a été renvoyé', true)
      }
      else {
        showAddCart('Oups, une erreur est survenue, rechargez la page', true)
      }

      return
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
            "phone": res = phone.slice(0, -9).replace('+', '0000000').slice(-4) + phone.slice(-9),
            "serialNumber": serial,
            "phoneToken": value
        }), 
      }).then(async (res) => await res?.json())
      console.log(result)
      if (result.result) {
        if (result.result.activated) {
            window.open(REDIRECT.active_3 + '?session_id=725', '_self')
        }
        else {
            window.open(REDIRECT.active_2, '_self')
        }
      }
      else {
        showAddCart('Code incorrect', true)
      }
      return

}

const checkActivationToken = async () => {
    let token =  new URLSearchParams(window.location.search).get('HeyJag')
    let serial =   new URLSearchParams(window.location.search).get('sn')

    if (!token || !serial) {
        return
    }

    header.Authorization = 'Bearer ' + token
    const result = await fetch(baseurl + '/login/activation/token', {
        method: "POST",
        headers : header,
        body: JSON.stringify({
            'serialNumber' : serial,
        }), 
    }).then(async (res) => await res?.json())
    console.log(result)
    if (result.result) {
      if (result.result.activated) {
          window.open(REDIRECT.active_3 + '?session_id=725', '_self')
      }
      else {
          window.open(REDIRECT.active_2, '_self')
      }
    }

}


const checkActivation = async () => {
    const regexPhone = /\+[0-9]{2,3}[0-9]{9}/
    const reglexSerial = 'JL[A-Za-z0-9]-[A-Za-z0-9]{8}'

    let serial = document.getElementById('jl_Activation_serialNumber').value
    let phone = document.getElementById('jl_Activation_phoneNumber').value.replaceAll(' ', '')

    if (!phone.match(regexPhone)) {
        showAddCart('Numéro de téléphone incorrect (+33612345678)', true)
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
            'phone' : res = phone.slice(0, -9).replace('+', '0000000').slice(-4) + phone.slice(-9),
        }), 
      }).then(async (res) => res.status) 
    
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
            setTimeout(() => {
                window.open(REDIRECT.login, '_self')
              }, "1000");
            break 
        case 404 : 
            showAddCart('Boîtier inconnu', true)
            break 
        case 403 :
            showAddCart("Le numéro de téléphone ne correspond pas à l'acheteur du collier", true)
            break  
      }
}

const getCart = async () => {
    let searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has('session_id')) {
          window.open(REDIRECT.active, '_self')
        return
    }


    let session_id = searchParams.get('session_id')
    result =  await fetch('https://app-api.mypet.fit/order/checkout/' + session_id , {
        method: "GET",
        headers : header,
    })
    console.log(session_id);
    if (result.status != 200 && session_id != '725') {
        window.open(REDIRECT.active, '_self')
        return
    }
    const checkoutOrder = await result.json();
    session = checkoutOrder?.result;
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

const getDog = async (id) => {
    dog = JSON.parse(localStorage.getItem('dog'))
    if (dog && !id) {
        return
    }
    if (user.dogs.length != 0) {
        dog = await fetch(baseurl + '/dog/'+ (id ?? user.dogs[0]._id), {headers : header})
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
        dog.dock = await fetch(baseurl + `/collar/${dog.collar.simcardID}/dock`, {
            method: 'GET',
            headers : header
        }).then(async (res) => res.json())
        if (dog.dock.result.assigned && dog.dock.result.dock?.serial_number) {
            dog.dock.data = await fetch('https://app-api.mypet.fit/dock/getStatus', 
                {headers : header, method : 'POST',  body: JSON.stringify({'serial_number': dog.dock.result.dock?.serial_number, 'dog_id': dog._id}),}
            ).then(async (res) => await res.json())
        }
        if (!dog.welfareData) {
            await getWelfareData()
        }

    }
    window.localStorage.setItem('dog', JSON.stringify(dog))
}

let getNewAbo = () => {
    if (dog.collar.formula_subscription.type) {
        return findNewAbonnementSolo(dog.collar.formula_subscription.type).prices[0]
    }
    return dog.collar.formula_subscription.type
}

const getUser = async () => {
    user = JSON.parse(localStorage.getItem('user'))

    if (!user) {
       
        user = await fetch(baseurl + '/profile/full', {headers : header})
        .then(async (res) => await res.json())
        .then((res) => res.user)
        
        user.galery = await fetch(baseurl + '/user/gallery?sharing=false', {headers : header})
        .then(async (res) => await res.json())
        .then(async (res) => res.personalActivities)
        window.localStorage.setItem('user',JSON.stringify(user))
    }
    await getDog()
}

const setidentity = () => {
    initFamily()
    let race = dog.race ?? dog.dadRace ?? dog.momRace
    let food = JSON.parse(dog.food ?? '{}')
    document.getElementById('jag-profil-identity-pict').src = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid 
    document.getElementById('jag-profil-identity-pict').srcset = "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid 
    document.getElementById('jag-profil-identity-name').innerHTML = dog.name 
    document.getElementById('jag-profil-identity-Iname').innerHTML = dog.name
    document.getElementById('jag-profil-identity-id').innerHTML =  dog.publicId[0] == '@' ? dog.publicId : `@${dog.publicId}`,
    document.getElementById('jag-profil-identity-bio').innerHTML = dog.biography?? 'Biographie'
    document.getElementById('jag-profil-identity-sexe').innerHTML = dog.gender == 'male' ? 'Mâle' : 'Femelle'
    document.getElementById('jag-profil-identity-birthdate').innerHTML = getDate(dog.birthDate)
    document.getElementById('jag-profil-identity-weight').innerHTML = dog.weight + 'Kg'
    document.getElementById('jag-profil-identity-size').innerHTML = getSize(dog.size)
    document.getElementById('jag-profil-identity-silouhette').innerHTML = getSilhouette(dog.silhouette)
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
    if (document.getElementById('jag-profil-welfare-calory')) {
        document.getElementById('jag-profil-welfare-calory').innerHTML = dog.welfareData?.global?.calory_global ?? '-'
        let date = new Date(null);
        date.setSeconds(dog.welfareData?.global?.rest_global)
        document.getElementById('jag-profil-welfare-rest').innerHTML = date.toISOString().slice(11, 16).replace(':' ,'h');
        
        document.getElementById('jag-profil-welfare-trophy').innerHTML = dog.welfareData?.global?.trophy_global ?? '-'
        document.getElementById('jag-profil-welfare-welfare').innerHTML = dog.welfareData?.global?.welfare_global ?? '-'
    }
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
                     await getDog(localDog._id)
                
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
    if(document.querySelectorAll("[jl-auth='false']").length) {
        return;
    }

    if (document.querySelectorAll("[jl-auth='login']").length) {
        let goTo = searchParams.has('redirect') ? searchParams.get('redirect') : REDIRECT.home
        goTo = REDIRECT[goTo]
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
            let goTo = Object.keys(REDIRECT).find(key => REDIRECT[key] === url.pathname.split('/').pop()) ?? REDIRECT.home
            window.open(REDIRECT.login +'?redirect='+goTo, '_self');
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
    loaderContainer.style.display = 'flex'
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
    else if (document.getElementById('jag-profil-dog-name') || document.getElementById('jl-collar-battery')  ||  document.getElementById('jl-galery-list-0') ) {
        await getUser()
    }
    if (document.getElementById('jl-collar-battery')) {
        await getDog(dog._id)
    }
    loaderContainer.style.display = 'none'
    if (document.getElementById('jl-rescue-action')) {
        initRescue(document.getElementById('jl-rescue-action'))
    }


  
  

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
