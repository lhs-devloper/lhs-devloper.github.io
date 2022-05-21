const toDoInput = document.querySelector("#todo-form input")
const toDoList = document.getElementById("todo-list")

const TODOS_KEY = "todos"

let toDos = [];

const saveToDos = () => {
    localStorage.setItem(TODOS_KEY, JSON.stringify(toDos))
}

const deleteTodo = (event) => {
    const li = event.target.parentElement;
    li.remove();
    toDos = toDos.filter((toDo) => toDo.id != parseInt(li.id));
    saveToDos()
}

const paintTodo = (newTodo) => {
    const li = document.createElement("li");
    li.id = newTodo.id;
    const span = document.createElement("span");
    span.innerText = newTodo.text;
    span.style.margin = "20px";
    span.style.color = "white";
    const button = document.createElement("button");
    button.innerText = "❌";
    button.style.border = "0";
    button.style.outline = "0";
    button.style.backgroundColor = "transparent";
    button.addEventListener("click", deleteTodo);
    li.appendChild(span);
    li.appendChild(button);
    toDoList.appendChild(li);    
}

const handleToDoSubmit = (event) => {
    event.preventDefault()
    const newTodo = toDoInput.value;
    toDoInput.value = "";
    const newTodoObj = {
        text:newTodo,
        id:Date.now(),
    };
    console.log(newTodoObj)
    toDos.push(newTodoObj);
    paintTodo(newTodoObj);
    saveToDos();
}

toDoForm.addEventListener("submit", handleToDoSubmit)

const savedToDos = localStorage.getItem(TODOS_KEY)

if(savedToDos !== null){
    const parsedToDos = JSON.parse(savedToDos);
    toDos = parsedToDos;
    parsedToDos.forEach(paintTodo);
}