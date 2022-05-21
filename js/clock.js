const clock = document.querySelector("h2#clock");

const getClock = () => {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    if(hours>=13){
        clock.innerText = `${hours-12}:${minutes}:${seconds}`;
    }
    else{
        clock.innerText = `${hours}:${minutes}:${seconds}`;
    }
}

setInterval(getClock, 1000)