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
    'jl-scnackbar' : (node) => console.log('snack-bar')
}

let user
let dog
 
const getAll = async () => {
    //INIT LOADER
    let loaderContainer = document.createElement('div')
    loaderContainer.classList.add('jl-loader-container')
    loaderContainer.innerHTML = '<lottie-player src="https://webcart.jagger-lewis.com/loader%20site.json" background="transparent" speed="1"style="width: 300px; height: 300px;"  autoplay></lottie-player>'
    body.insertBefore(loaderContainer, document.body.firstChild);

    user = await fetch(baseurl + '/profile/full', header)
            .then(async (res) => await res.json())
            .then((res) => res.user)
    dog = user.dogs[0]

    setAll()
   }

const setAll = () => {
    var nodes = document.querySelectorAll('[id^="jl"]');

    nodes.forEach(function(node) {
        if (initClient[node.id])
            initClient[node.id](node)
        else console.log(node.id + ' is not handle :(')
    });

    loaderContainer.style.display = 'none'
}
if(!document.getElementById('JL_NavBar')) {
    getAll()
}