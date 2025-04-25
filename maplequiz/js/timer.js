export class Timer {
    constructor(element, quiz) {
        this.element = element
        this.time = 10;
        this.interval = null
        this.quiz = quiz;
    }

    Start() {
        this.interval = setInterval(() => {
            this.time--;
            if (this.time < 0) {
                this.End()
            }
            this.element.textContent = `남은시간: ${this.time} 초`;
        }, 1000)
    }

    End() {
        clearInterval(this.interval);
        this.time = 10;
        if (this.quiz.Next()) {
            this.Stop()
        } else {
            this.element.textContent = `남은시간: ${this.time} 초`;
            this.Start();
        }
    }

    Stop() {
        clearInterval(this.interval);
    }
}
