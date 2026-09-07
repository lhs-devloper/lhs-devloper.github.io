import question from "./qustionList.js";
import { Timer } from "./timer.js";

const COUNT = 50;
const SECONDS = 10;

/* "./img/이그네트 .png" → "이그네트" (뒤따르는 공백까지 제거) */
function nameFromPath(path) {
    const file = decodeURIComponent(path.split("/").pop());
    return file.replace(/\.png$/i, "").trim();
}

/* 공백·대소문자 차이를 무시하고 비교한다 ("돈 지오바네" ≈ "돈지오바네") */
function normalize(text) {
    return (text || "").replace(/\s+/g, "").toLowerCase();
}

export class Quiz {
    constructor({ imgElement, onProgress, onQuestion, onTick, onFinish } = {}) {
        this.imgElement = imgElement;
        this.onProgress = onProgress;   // (now, count, correct)
        this.onQuestion = onQuestion;   // (path, name)
        this.onFinish = onFinish;       // (results, correct, count)

        this.count = Math.min(COUNT, new Set(question).size);
        this.seconds = SECONDS;

        this.timer = new Timer({
            seconds: SECONDS,
            onTick,
            onTimeout: () => this.resolve(null, true),
        });

        this.Reset();
    }

    Reset() {
        this.now = 0;          // 지금까지 푼 문제 수
        this.correct = 0;
        this.results = [];
        this.questionList = this.Shuffle(question).slice(0, this.count);
        this.current = null;
        this.locked = false;
    }

    Start() {
        this.Reset();
        this.Next();
    }

    Next() {
        this.locked = false;
        this.current = this.questionList[this.now];
        this.imgElement.src = this.current;
        this.onQuestion?.(this.current, nameFromPath(this.current));
        this.onProgress?.(this.now, this.count, this.correct);
        this.timer.Start();
    }

    /* 확인/Enter로 답을 제출 */
    Submit(answer) {
        this.resolve(answer, false);
    }

    /* 통과 */
    Skip() {
        this.resolve(null, false);
    }

    Stop() {
        this.timer.Stop();
    }

    /*
     * 한 문제를 마무리한다.
     * 제출·통과·시간초과가 동시에 들어와도 한 번만 처리되도록 locked로 막는다.
     */
    resolve(answer, timedOut) {
        if (this.locked) return;
        this.locked = true;
        this.timer.Stop();

        const name = nameFromPath(this.current);
        const isCorrect = !timedOut && normalize(answer) === normalize(name);
        if (isCorrect) this.correct++;

        this.results.push({
            img: this.current,
            name,
            answer: (answer || "").trim(),
            correct: isCorrect,
            timedOut,
        });

        this.now++;
        if (this.now >= this.count) {
            this.onProgress?.(this.now, this.count, this.correct);
            this.onFinish?.(this.results, this.correct, this.count);
        } else {
            this.Next();
        }
    }

    /* Fisher-Yates 셔플 (중복 제거 후) */
    Shuffle(list) {
        const arr = [...new Set(list)];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
