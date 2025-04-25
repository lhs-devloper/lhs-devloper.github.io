import { Quiz } from "./quiz.js";


class App {
    constructor(
        now,
        answer,
        img,
        timer,
        {
            reset,
            skip,
            next
        }
    ) {
        this.now = now;
        this.answer = answer;
        this.img = img;
        this.timer = timer;
        this.quiz = new Quiz(this.now, this.img);


        this.reset = reset;
        this.skip = skip;
        this.next = next;

        this.skip.addEventListener('click', () => {
            this.quiz.Answer();
            this.answer.value = "";
        })

        this.next.addEventListener('click', () => {
            this.quiz.Answer(this.answer.value)
            this.answer.value = "";
        });

        this.answer.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.quiz.Answer(this.answer.value)
                this.answer.value = "";
            }
        });
    }

    Start() {
        this.quiz.Start();
    }



}
const now = document.getElementById("now");
const answer = document.getElementById("answer");
const img = document.getElementById("random_img");
const timer = document.getElementById("timer");

const reset = document.getElementById("reset");
const skip = document.getElementById("skip");
const next = document.getElementById("next");
const app = new App(
    now,
    answer,
    img,
    timer,
    {
        reset,
        skip,
        next,
    }
);


app.Start();