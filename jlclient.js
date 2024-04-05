const baseurl = 'https://app-api.mypet.fit'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY1NzFkM2RjNzA4M2E3ODg2ZTQzNzNhOCIsInBob25lIjoiMDAzMzYxMjk2NTM5OCIsIm5hbWUiOiJFbGlvdCIsImxhc3RuYW1lIjoiTUFSVElOIiwiZW1haWwiOiJlbGlvdC5tYXJ0aW5AamFnZ2VyLWxld2lzLmNvbSJ9LCJpYXQiOjE3MTIxMzM0Njh9.cfvU9bp8yr8ASiMN5vY9j5mrQH8CfV50m1k3Hny917Y'
const header ={ headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json' 
  }}

const initClient = {
    'jl-profil-dog-picture' : (node) => console.log( 'jl-profil-dog-picture'),
    'jl-profil-dog-name' : (node) => node.innerHTML = dog.name,
    'jl-profil-dog-id' : (node) => node.innerHTML = dog.id,
    'jl-collar-battery' : (node) => console.log( 'jl-collar-battery'),
    'jl-collar-autonomy' : (node) => console.log( 'jl-collar-battery'),
    'jl-collar-synchro-date' : (node) => console.log( 'jl-collar-battery'),
    'jl-collar-rescue' : (node) => console.log( 'jl-collar-battery'),
    'jl-activity-card-container' : (node) => initActivity(node),
    'jl-scnackbar' : (node) => console.log('snack-bar')
}

let user
let dog

const initActivity = async (node) => {
    card = document.getElementById('jl-activity-card')
    dog.personalActivities.forEach((activity) => {
            newCard = card.cloneNode(true)
            changeChildsId(newCard, '-' + activity._id, 'jl')
            newCard['data-id'] = activity._id
            node.appendChild(newCard)
            document.getElementById('jl-activity-card-type-' + activity._id).innerHTML = activity.activity_id
            start =  new Date(activity.start_timestamp);
            end = new Date(activity.end_timestamp);
            document.getElementById('jl-activity-card-time-' + activity._id).innerHTML =  'De ' + (start.getHours() < 10 ? "0" +  start.getHours() : start.getHours()) + "h" + (start.getMinutes() < 10 ? "0" +  start.getMinutes() : start.getMinutes()) + ' à '  + (end.getHours() < 10 ? "0" +  end.getHours() : end.getHours()) + "h" + (end.getMinutes() < 10 ? "0" +  end.getMinutes() : end.getMinutes())
            document.getElementById('jl-activity-card-duration-' + activity._id).innerHTML = new Date(activity.duration * 1000).toISOString().substring(14, 19)
            distance = activity.distance > 1000 ? activity.distance /1000 + 'km' : activity.distance + 'm'
            document.getElementById('jl-activity-card-distance-' + activity._id).innerHTML = 'Distance parcourue de ' + distance

          

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

const getAll = async () => {
    //INIT LOADER
    let loaderContainer = document.createElement('div')
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