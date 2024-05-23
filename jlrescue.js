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
    updateLoading(3)
    let pos;
    let res = await fetch(`https://app-api.mypet.fit/personal_activity/${dog.collar.simcardID}/${key}/rescue/tracks`, {
        method: 'GET',
        headers: header
    }).then(async (value) => await value?.json());
    clearMap()
    if(!res) {
        stopRescue()
    }
    if (!(res.Tracks && res.Tracks.lenght != 0)) {
        circle.setMap(map)
        return;
    }

    res.Tracks.reverse().forEach(marker => {
        pos =  {lat : marker.lat, lng : marker.lon}
        switch (marker.tracking_cmd) {
            case 0 : 
                updateLoading(4)
                circle.fillColor = '#4287f5'
                circle.strokeColor = '#4287f5'
                circle.setMap(map)
                break
            case 1 : 
                updateLoading(5)
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

const updateLoading = (step) => {
    const clearPath = (index) => 
        Rescuepath.forEach((elem, pathIndex) =>  elem.style.backgroundColor = pathIndex == index ? '#5363ff' : 'rgba(0, 0, 0, .07)'  );

    let Rescuepath = document.querySelectorAll("[id^='jag-rescue-info-path']")
    let title = document.getElementById('jag-rescue-info-title')
    let desc = document.getElementById('jag-rescue-info-description')
    switch (step) {
        case 2:
            clearPath(1)
            title.innerHTML = 'step 2'
            desc.innerHTML = 'desc 2'
            break;
        case 3:
            clearPath(2)
            title.innerHTML = 'step 3'
            desc.innerHTML = 'desc 3'
            break;
        case 4:
            clearPath(3)
            title.innerHTML = 'step 4'
            desc.innerHTML = 'desc 4'
            break;
        case 5:
            clearPath(4)
            title.innerHTML = 'step 5'
            desc.innerHTML = 'desc 5'
            break;
    
        default:
            clearPath(0)
            title.innerHTML = 'step 1'
            desc.innerHTML = 'desc 1'
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
    updateLoading(1)
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

initRescue(document.getElementById('jl-rescue-action'))
