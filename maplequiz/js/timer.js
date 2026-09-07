/*
 * 문제당 카운트다운 타이머.
 * 매 초 onTick(남은초, 0~1 비율)을 알리고, 0초가 되면 onTimeout을 한 번 호출한다.
 */
export class Timer {
    constructor({ seconds = 10, onTick, onTimeout } = {}) {
        this.seconds = seconds;
        this.onTick = onTick;
        this.onTimeout = onTimeout;
        this.time = seconds;
        this.interval = null;
    }

    Start() {
        this.Stop();
        this.time = this.seconds;
        this.onTick?.(this.time, 1);
        this.interval = setInterval(() => {
            this.time--;
            this.onTick?.(this.time, Math.max(0, this.time) / this.seconds);
            if (this.time <= 0) {
                this.Stop();
                this.onTimeout?.();
            }
        }, 1000);
    }

    Stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
