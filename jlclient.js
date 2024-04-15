

const baseurl = 'https://app-api.mypet.fit'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY1NzFkM2RjNzA4M2E3ODg2ZTQzNzNhOCIsInBob25lIjoiMDAzMzYxMjk2NTM5OCIsIm5hbWUiOiJFbGlvdCIsImxhc3RuYW1lIjoiTUFSVElOIiwiZW1haWwiOiJlbGlvdC5tYXJ0aW5AamFnZ2VyLWxld2lzLmNvbSJ9LCJpYXQiOjE3MTIxMzM0Njh9.cfvU9bp8yr8ASiMN5vY9j5mrQH8CfV50m1k3Hny917Y'

const step2 = 'activation-produit-etape02'

const header ={ headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json' 
  }}

let aboDuration = 'month'


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
    'jl-profil-dog-picture' : (node) => console.log( 'jl-profil-dog-picture'),
    'jl-profil-dog-name' : (node) => node.innerHTML = dog.name,
    'jl-profil-dog-id' : (node) => node.innerHTML = dog.id,
    'jl-collar-battery' : (node) => node.innerHTML = dog.battery.soc+'%',
    'jl-collar-autonomy' : (node) => node.innerHTML = 'Il reste environ ' + converTimestamp(dog.battery.estimated) + " d'autonomie",
    'jl-collar-synchro-date' : (node) => console.log( 'jl-collar-synchro-date'),
    'jl-collar-rescue' : (node) => console.log( 'jl-collar-rescue'),
    'jl-activity-card-container' : (node) => initActivity(node),
    'jl-scnackbar' : (node) => console.log('snack-bar'),
    'jl_Activation_serialNumber' : (node) => document.getElementById('Jag_Activation_Action').addEventListener('click', () => checkActivation()),
    'jl_Activation_phoneNumber' : (node) => null,
    'jl_Activation_Action' : (node) => node.addEventListener('click', () => checkActivation()),
    'jl_Abonnement_Action_month' : (node) =>node.addEventListener('click', () => toMonth()),
    'jl_Abonnement_Action_year' : (node) =>node.addEventListener('click', () => toYear()),
    'jl_Abonnement_Action_life' : (node) =>node.addEventListener('click', () => toLife()),
    'jl_Abonnement_Starter' : (node) => '',
    'jl_Abonnement_Starter_action' : (node) => '',
    'jl_Abonnement_Family' : (node) => '',
    'jl_Abonnement_Family_action' : (node) => '',
    'jl_Abonnement_Premium' : (node) => '',
    'jl_Abonnement_Premium_action' : (node) => '',
    'jl_Abonnement_check' : (node) => '',
    
}

let user
let dog

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

const toMonth = () => {
    aboType = ['starter', 'starter-family', 'premium-family']
    aboType.forEach((abo) => {
        console.log(findAbonnement(abo))
        console.log(findAboType(findAbonnement(abo), "monthly"))
        document.getElementById('jl-abo-'+abo+'-top').innerHTML =  getTrad('Sans engagement', 'No obligation')
        document.getElementById('jl-abo-'+abo+'-bottom').innerHTML = ''
        document.getElementById('jl-abo-'+abo+'-price').innerHTML = displayPrice(findAboType(findAbonnement(abo), "monthly").price) + getTrad('€/mois', '€/month')
    })
}
const toYear = () => {
    aboType = ['starter', 'starter-family', 'premium-family']
    aboType.forEach((abo) => {
        console.log(findAbonnement(abo))
        console.log(findAboType(findAbonnement(abo), "yearly"))
        document.getElementById('jl-abo-'+abo+'-top').innerHTML =  getTrad('2 mois offerts', '2 months free')
        document.getElementById('jl-abo-'+abo+'-bottom').innerHTML = getTrad('Paiement de ', '') + displayPrice(findAboType(findAbonnement(abo), "yearly").price) + getTrad('€ tous les ans', '€ billed annualy')
        document.getElementById('jl-abo-'+abo+'-price').innerHTML =   (findAboType(findAbonnement(abo), "yearly").price / 12).toFixed(2) + getTrad('€/mois', '€/month')
    })
}
const toLife = () => {
    aboType = ['starter', 'starter-family', 'premium-family']
    aboType.forEach((abo) => {
        console.log(findAbonnement(abo))
        console.log(findAboType(findAbonnement(abo), "life"))
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

const initAbonnement = (node) => {

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

const checkActivation = () => {
    const regexPhone = '^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$'
    const reglexSerial = 'JL[A-Za-z0-9]-[A-Za-z0-9]{8}'

    let serial = document.getElementById('jl_Activation_serialNumber').value
    let phone = document.getElementById('jl_Activation_phoneNumber').value

    if (!phone.match(regexPhone)) {
        showSnackBar('Mauvais téléphone', true)
        return
    }
    if (!serial.match(reglexSerial)) {
        showSnackBar('Numéro de serie incorrecte (JL-01-0111A11A)', true)
        return
    }

    // TODO(dev): add API call
    window.localStorage.serial = serial
    window.open('activation-produit-etape02', '_self')
}

const getAll = async () => {
    //INIT LOADER
    let loaderContainer = document.createElement('div')
    loadAbonnement()
    loaderContainer.classList.add('jl-loader-container')
    loaderContainer.innerHTML = '<lottie-player src="https://webcart.jagger-lewis.com/loader%20site.json" background="transparent" speed="1"style="width: 300px; height: 300px;"  autoplay></lottie-player>'
    body.insertBefore(loaderContainer, document.body.firstChild);

    user = await fetch(baseurl + '/profile/full', header)
            .then(async (res) => await res.json())
            .then((res) => res.user)
    if (user.dogs.length != 0)
        dog = await fetch(baseurl + '/dog/'+ user.dogs[0]._id +'?activity_limit=5', header)
        .then(async (res) => await res.json())
        .then((res) => res.dog)
    dog.battery = await fetch(baseurl + '/collar/'+ dog.collar.simcardID+'/battery', header)
    .then(async (res) => await res.json())
    .then((res) => res.BatteryInfos)
    loaderContainer.style.display = 'none'

    setAll()
   }

const setAll = () => {
    var nodes = document.querySelectorAll('[id^="jl"]');

    nodes.forEach(function(node) {
        if (initClient[node.id])
            initClient[node.id](node)
        else console.log(node.id + ' is not handle :(')
    });
}
if(!document.getElementById('JL_NavBar')) {
    getAll()
}