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
    let newBtn = btn.cloneNode(true)
    newBtn.addEventListener('click', () => stopRescue(key))
    btn.parentElement.appendChild(newBtn)
    btn.remove()
    console.log('start => ', res, res2)
}

const tracks = async (key) => {
    let res = await fetch(`https://app-api.mypet.fit/personal_activity/${dog.collar.simcardID}/${key}/rescue`, {
        method: 'GET',
        headers: header
    }).then(async (value) => await value.json());

    console.log('tracks', res)
}

const stopRescue = async (key) => {

    let res = await fetch(`https://app-api.mypet.fit/collar/${dog.collar.simcardID}/rescue`,
        {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ 'mode': 'stop_follow', 'key': key })
        }).then(async (value) => await value.json());

    console.log('stop', res)
}


document.getElementById('start').addEventListener('click', () => start());
document.getElementById('tracks').addEventListener('click', () => tracks());
document.getElementById('stop').addEventListener('click', () => stop());

const initRescue = (btn) => {
    btn.addEventListener('click', () => startRescue(btn))
    console.log('rescue', btn)
}

if (document.getElementById('jl-rescue-action')) {
    initRescue(document.getElementById('jl-rescue-action'))
}