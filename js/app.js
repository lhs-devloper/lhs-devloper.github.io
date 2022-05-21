const loginForm = document.querySelector("#login-form");
const loginInput = document.querySelector("#login-form input");
const greeting = document.querySelector("#greeting");
const toDoForm = document.getElementById("todo-form");

const TODOFORM = "todo-form"
const TODOINPUT = "#todo-form input"
const TODOLIST = "#todo-list"

const HIDDEN_CLASSNAME = "hidden";
const USERNAME_KEY = "username"

const onLogin = (event) => {
    event.preventDefault();
    const username = loginInput.value;
    localStorage.setItem(USERNAME_KEY, username)
    paintGreeting(username);
}

const paintGreeting = (username) => {
    loginForm.classList.add(HIDDEN_CLASSNAME)
    greeting.innerText = `Hello! ${username}님`;
    greeting.classList.remove(HIDDEN_CLASSNAME);
    toDoForm.classList.remove(HIDDEN_CLASSNAME);
}

const savedUsername = localStorage.getItem(USERNAME_KEY);

if(savedUsername === null){
    loginForm.classList.remove(HIDDEN_CLASSNAME);
    loginForm.addEventListener("submit", onLogin);
} else {
    paintGreeting(savedUsername);
}

