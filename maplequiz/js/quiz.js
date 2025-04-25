import question from "./qustionList.js";
import { Timer } from "./timer.js";
const COUNT = 50;
export class Quiz {
    constructor(nowElement, imgElement) {
        this.now = 0;
        this.count = COUNT;
        this.answer = 0;
        this.nowElement = nowElement;
        this.imgElement = imgElement;
        this.questionList = this.ShuffleQuiz(question, COUNT);

        this.timer = new Timer(timer, this);
    }

    Start() {
        this.imgElement.src = this.questionList.pop()
        this.timer.Start();
    }

    Answer(answer) {
        const fileName = this.imgElement.src.split("/").pop();
        if (decodeURIComponent(fileName) === `${answer}.png`) {
            this.answer++;
        }
        this.timer.End();
    }

    Next() {
        this.now++;
        this.nowElement.innerHTML = `진행사항 ${this.now} / 50 <span class="ans">(정답: ${this.answer} 개)</span>`;
        if (this.now == this.count) {
            return true;
        } else {
            this.imgElement.src = this.questionList.pop()
            return false;
        }
    }

    Reset() {
        this.now = 0;
        this.count = 50;
        this.answer = 0;
        this.shuffledQuestionArr = [...new Set(this.json)].sort(() => Math.random() - 0.5).slice(0, this.count);
    }

    ShuffleQuiz(questionList, COUNT) {
        const unique = [...new Set(questionList)];
        const shuffled = unique.sort(() => Math.random() - 0.5)
        return shuffled.slice(0, COUNT);
    }
}