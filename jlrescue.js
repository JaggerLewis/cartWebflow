let timer
let tracksLog
let markers = []

const switchBtn = (btnId, func) => {
    let btn = document.getElementById(btnId)
    let newBtn = btn.cloneNode(true)

    newBtn.addEventListener('click', () => func())
    btn.parentElement.appendChild(newBtn)
    btn.remove()

    return newBtn
}

const startRescue = async (btn) => {
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
    let res2 = await fetch(`https://app-api.mypet.fit/collar/${dog.collar.simcardID}/rescue`,
        {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ 'mode': 'standard_follow', 'key': key })
        }).then(async (value) => await value.json());

    btn.innerHTML = 'Arreter la géolocalisation'

    let newBtn = switchBtn('jl-rescue-action', () => stopRescue(key) )

    timer = setInterval(() => {
        tracks(key)
     }, 1000);
}

const tracks = async (key) => {
    markers.forEach((elem) => {
        elem.setMap(null)
    })
    markers = []
    let res = await fetch(`https://app-api.mypet.fit/personal_activity/${dog.collar.simcardID}/${key}/rescue/tracks`, {
        method: 'GET',
        headers: header
    }).then(async (value) => await value.json());
    console.log('tracks', res)
    if (!res.Tracks) {
        return;
    }
    res.Tracks.forEach(marker => {
        let pos =  {lat : marker.lat, lng : marker.lon}
        let tmp = new google.maps.Marker({
            map: map,
            position: pos,
            title: "",
          });
        markers.push(tmp)
    });
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
    newBtn.innerHTML = 'Lancer un localisation'
}

const initRescue = (btn) => {
    btn.addEventListener('click', () => startRescue(btn))
    console.log('rescue', btn)
}

if (document.getElementById('jl-rescue-action')) {
    initRescue(document.getElementById('jl-rescue-action'))
}