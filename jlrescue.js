let timer
let tracksLog
let markers = []
let icon


const switchBtn = (btnId, func) => {
    let btn = document.getElementById(btnId)
    let newBtn = btn.cloneNode(true)

    newBtn.addEventListener('click', () => func())
    btn.parentElement.appendChild(newBtn)
    btn.remove()

    return newBtn
}

const startRescue = async (btn) => {
    updateLoading(2)
    loaderContainer.style.display = 'flex'
    let body = {
        'activity_id': 'rescue',
        'start_timestamp': Date.now(),
        'aside_data': JSON.stringify({ 'mode': 'standard_follow' }),
        'dog_id': dog._id,
    }

    let res = await fetch(`https://app-api.mypet.fit/personal_activity`,
        {
            method: 'PUT',
            headers: header,
            body: JSON.stringify(body)
        }).then(async (value) => await value.json());

    let key = res.timestamp_key
    res = await fetch(`https://app-api.mypet.fit/collar/${dog.collar.simcardID}/rescue`,
        {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ 'mode': 'standard_follow', 'key': key })
        }).then(async (value) => await value.json());

    btn.innerHTML = getTrad('Arrêter la géolocalisation', 'Stop geolocation')
    switchBtn('jl-rescue-action', () => stopRescue(key) )
    circle?.setMap(map)
    loaderContainer.style.display = 'none'
    document.getElementById('jag-detail-activity').style.display = 'none'
    document.getElementById('jag-detail-rescue').style.display = 'flex'
    timer = setInterval(() => {
        tracks(key)
     }, 5000);
}

const tracks = async (key) => {
    let step = 2
    let pos;
    let res = await fetch(`https://app-api.mypet.fit/personal_activity/${dog.collar.simcardID}/${key}/rescue/tracks`, {
        method: 'GET',
        headers: header
    }).then(async (value) => await value?.json());
    clearMap()
    
    if(!res || !map) {
        stopRescue()
    }
    if (!icon) {
        icon = {
            url: "https://assets-global.website-files.com/6549f4ba8294cf140608d893/664e065a96ae535c2291cf88_dog%20pict.png",
            scaledSize: new google.maps.Size(50, 50), 
            origin: new google.maps.Point(0,0),
            anchor: new google.maps.Point(0, 0)
        };
    }

    if(res.Tracks[res.Tracks.lenght - 1]?.origin_mode == 'GNSS_TIMEOUT') {
        await circle.setMap(null)
        step = 6
        circle.fillColor = 'red'
        circle.strokeColor = 'red'
        circle.setMap(map)
        return
    }
    if(res.Tracks.find((elem) => elem.tracking_cmd == 1)) {
        step = 4
        res.Tracks.reverse().forEach(marker => {
            if (marker.tracking_cmd == 0) {
                return
            }

            pos =  {lat : marker.lat, lng : marker.lon}
            step = 4
            circle.setMap(null)
            let tmp = new google.maps.Marker({
                map: map,
                position: pos,
                title: "",
                icon : icon ?? `https://assets-global.website-files.com/6549f4ba8294cf140608d893/664c893a5d2b02d82784dbdc_imagedog.png`
            });
            markers.push(tmp)
            })
    }
    else if(res.Tracks.find((elem) => elem.tracking_cmd == 0)) {
        await circle.setMap(null)
        step = 3
        circle.fillColor = '#5363ff'
        circle.strokeColor = '#5363ff'
        circle.setMap(map)
    }
    else 
        circle.setMap(map)

    updateLoading(step)
    map.setCenter(pos)
}

const updateLoading = (step) => {
    const clearPath = (index) => 
        Rescuepath.forEach((elem, pathIndex) =>  elem.style.backgroundColor = pathIndex == index ? '#5363ff' : 'rgba(0, 0, 0, .07)'  );

    let Rescuepath = document.querySelectorAll("[id^='jag-rescue-info-path']")
    let title = document.getElementById('jag-rescue-info-title')
    let desc = document.getElementById('jag-rescue-info-description')
    switch (step) {
        case 2:
            clearPath(1)
            title.innerHTML = getTrad('Demande de localisation envoyée', 'Location request sent')
            desc.innerHTML = getTrad("Nous contactons votre collier, cela peut prendre du temps s'il se trouve dans une zone à faible couverture réseau...", 'We will contact your collar, which may take some time if it is in an area with poor network coverage...')
            break;
        case 3:
            clearPath(2)
            title.innerHTML = getTrad('Boîtier contacté, localisation en cours', 'Collar contacted, location in progress')
            desc.innerHTML = getTrad('Votre chien se trouve dans cette zone, nous recherchons actuellement un position plus précise.', 'Your dog is in this area. We are currently looking for a more precise location.')
            break;
        case 4:
            clearPath(3)
            title.innerHTML = getTrad('Boîtier localisé', 'Localized collar')
            desc.innerHTML = dog.name +  getTrad('est actuellement localisé à cette position', 'is currently located at this position.')
            break;
        case 5:
            clearPath(4)
            title.innerHTML = getTrad('Arrête en cours', 'Stop in progress')
            desc.innerHTML = getTrad("Nous contactons le boîtier afin d'arrêter la localisation", 'We contact the collar to stop the location')
            break;
        case 6:
            clearPath(-1)
            title.innerHTML =  dog.name  + getTrad('est introuvable...', 'connot be found...')
            desc.innerHTML = getTrad(`Nous continuons de rechercher ${dog.name}, mais cela prends plus de temps que prévu`, `We're still searching for ${dog.name}, but it's taking longer than expected`)
            break;
    
        default:
            clearPath(0)
            title.innerHTML = getTrad("Recherche de l'antenne", 'Antenna search')
            desc.innerHTML = getTrad("Avant de contacter votre boîtier, nous localison la zone grâce à l'antenne réseau la plus proche", 'Before contacting your collar, we locate the area using the nearest network antenna')
            break;
    }
}

const clearMap = () => {
    if (path) {
        path.setMap(null)
    } if (circle) {
        circle.setMap(null)
    }
    markers.forEach((elem) => {
        elem.setMap(null)
    })


    markers = []
}

const stopRescue = async (key) => {
    updateLoading(5)
    clearInterval(timer);
    let res = await fetch(`https://app-api.mypet.fit/collar/${dog.collar.simcardID}/rescue`,
        {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ 'mode': 'stop_follow', 'key': key })
        }).then(async (value) => await value.json());

    let newBtn = switchBtn('jl-rescue-action', () => initRescue(document.getElementById('jl-rescue-action')))
    newBtn.innerHTML = getTrad('Lancer une localisation', 'Start a search')
    updateLoading(0)
    clearMap()
    initMap(document.getElementById('jl-map'), true)
}

const initRescue = async (btn) => {
    updateLoading(1)
  
    await getDog(dog._id)
    let acti = dog.personalActivities.find((elem) => !elem.end_timestamp)
   
    if (acti) {
        if (acti.type == 'rescue') {
            let btn = switchBtn('jl-rescue-action', () => stopRescue(acti.timestamp_key) )
            updateLoading(2)
            btn.innerHTML =  getTrad('Arrêter la géolocalisation', 'Stop geolocation')
            timer = setInterval(() => {
                tracks(acti.timestamp_key)
             }, 1000);
        }
        else if (acti.type == 'activity') {
            btn.parentElement.style.backgroundColor = 'grey'
            btn.addEventListener('click', () =>   showAddCart(getTrad('Une activité est déjà en cours !', 'One activity is already underway!')))
        }
    }
    else {
        btn.innerHTML = getTrad('Lancer une localisation', 'Start a search')
        btn.addEventListener('click', () => startRescue(btn))
    }
}

