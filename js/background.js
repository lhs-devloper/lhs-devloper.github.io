const images = ["1.jpg","2.jpg","3.jpg","4.jpg"]

const chooseImage = images[Math.floor(Math.random()*images.length)]
console.log(chooseImage)
const bgImage = `images/${chooseImage}`

document.body.style.backgroundImage = `url(${bgImage})`
document.body.style.backgroundSize = "cover"