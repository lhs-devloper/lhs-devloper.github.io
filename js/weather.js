const APIKEY = "5e7c8b31c44c7daaa736b096a48eddac";

const changeTemp = (K) => {
    return K - 273.15
}

const onGeok = (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKEY}`;
    console.log(url)
    fetch(url).then(
        (response) => response.json()
    ).then((data) => {
        // const weather = document.querySelector("#weather span:nth-child(2)")
        const icon = document.querySelector("#icon");
        console.log(icon)
        const city = document.querySelector("#weather span:nth-child(3)");
        const temp = document.querySelector("#weather span:last-child");
        const tempK = data.main.temp;
        const tempC = changeTemp(tempK)
        const weatherIcon = data.weather[0].icon
        console.log(weather)
        icon.src = `http://openweathermap.org/img/wn/${weatherIcon}@2x.png`
        // weather.innerText = data.weather[0].main;
        temp.innerText = `${tempC.toFixed(1)}℃`;
        city.innerText = `${data.name}:`;

    })
}
const onGeoError = () => {
    const inf = document.querySelector("#weather")
    inf.innerText = "위치불러오기 실패하였습니다!"
    console.log("Error")
}
navigator.geolocation.getCurrentPosition(onGeok, onGeoError)