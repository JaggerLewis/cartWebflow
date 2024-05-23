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
    icon = {
        url: "https://app-api.mypet.fit/img/" + dog.image.type +"/"+ dog.image.uuid,
        scaledSize: new google.maps.Size(50, 50), 
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(0, 0)
    };
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
    await fetch(`https://app-api.mypet.fit/collar/${dog.collar.simcardID}/rescue`,
        {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ 'mode': 'standard_follow', 'key': key })
        }).then(async (value) => await value.json());

    btn.innerHTML = 'Arrêter la géolocalisation'
    switchBtn('jl-rescue-action', () => stopRescue(key) )
    circle?.setMap(map)
    loaderContainer.style.display = 'none'
    document.getElementById('jag-detail-activity').style.display = 'none'
    document.getElementById('jag-detail-rescue').style.display = 'flex'
    timer = setInterval(() => {
        tracks(key)
     }, 1000);
}

const tracks = async (key) => {
    let pos;
    let res = await fetch(`https://app-api.mypet.fit/personal_activity/${dog.collar.simcardID}/${key}/rescue/tracks`, {
        method: 'GET',
        headers: header
    }).then(async (value) => await value.json());
    clearMap()

    if (!(res.Tracks && res.Tracks.lenght != 0)) {
        circle.setMap(map)
        return;
    }

    res.Tracks.reverse().forEach(marker => {
        pos =  {lat : marker.lat, lng : marker.lon}
        switch (marker.tracking_cmd) {
            case 0 : 
                circle.fillColor = '#4287f5'
                circle.strokeColor = '#4287f5'
                circle.setMap(map)
                break
            case 1 : 
                circle.setMap(null)
                let tmp = new google.maps.Marker({
                    map: map,
                    position: pos,
                    title: "",
                    icon : icon ?? `https://assets-global.website-files.com/6549f4ba8294cf140608d893/664c893a5d2b02d82784dbdc_imagedog.png`
                });
                markers.push(tmp)
                break
            case 2 : 
            default :
            console.log('marker => ', marker)
        }
     
     
    });
    map.setCenter(pos)
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
    clearInterval(timer);
    let res = await fetch(`https://app-api.mypet.fit/collar/${dog.collar.simcardID}/rescue`,
        {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ 'mode': 'stop_follow', 'key': key })
        }).then(async (value) => await value.json());

    let newBtn = switchBtn('jl-rescue-action', () => initRescue(document.getElementById('jl-rescue-action')))
    newBtn.innerHTML = 'Lancer une localisation'
}

const initRescue = async (btn) => {
    await getDog(dog._id)
    let acti = dog.personalActivities.find((elem) => !elem.end_timestamp)
    if (acti) {
        if (acti.type == 'rescue') {
            let btn = switchBtn('jl-rescue-action', () => stopRescue(acti.timestamp_key) )
            btn.innerHTML = 'Arrêter la géolocalisation'
            timer = setInterval(() => {
                tracks(acti.timestamp_key)
             }, 1000);
        }
        else if (acti.type == 'activity') {
            btn.parentElement.style.backgroundColor = 'grey'
            btn.addEventListener('click', () =>   showAddCart('Une activité est déjà en court !'))
        }
    }
    else {
        btn.addEventListener('click', () => startRescue(btn))
    }
}
