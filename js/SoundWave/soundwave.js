class Soundwave {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.classList.add('wave')
        this.ctx = this.canvas.getContext("2d");
        this.audioList = [
            '../sound/ellinia.mp3',
            '../sound/speed.mp3',
            '../sound/eclipse.mp3',
            '../sound/candyland.mp3',
        ]
        this.beingMusic = 0;
        this.audio = document.createElement("audio");
        this.audio.src = this.audioList[this.beingMusic];
        this.audio.autoplay = true;
        this.audio.loop = true;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioState = {
            isPaused: true,
        }
        this.target = document.getElementById("soundWave");
        this.volumeController = document.getElementById("soundVolume")
        this.volumeController.value = this.audio.volume;
        this.stateIcon = document.getElementById("state")

        if (this.audioState.isPaused) {
            this.stateIcon.innerText = "pause";
        }

        this.canvas.width = this.target.clientWidth;
        this.canvas.height = this.target.clientHeight;

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        document.body.appendChild(this.audio);
        this.target.appendChild(this.canvas);

        this.prevTag = document.getElementById("prev");
        this.nextTag = document.getElementById("next");
        this.prevTag.addEventListener("click", this.prev.bind(this));
        this.nextTag.addEventListener("click", this.next.bind(this));

        this.volumeController.addEventListener("input", this.volumeChange.bind(this));

        this.source = this.audioCtx.createMediaElementSource(this.audio);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 1024;

        this.source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        window.addEventListener('resize', this.resize.bind(this), false);
        this.resize();
        this.canvas.addEventListener('click', this.playMusic.bind(this))
        this.stateIcon.addEventListener('click', this.playMusic.bind(this))
        this.draw();
    }
    resize() {
        this.canvas.width = this.target.clientWidth;
        this.canvas.height = this.target.clientHeight;

        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    playMusic() {
        this.audioCtx.resume().then(() => {
            if (this.audioState.isPaused) {
                this.audio.play();
                this.stateIcon.innerText = "pause";
            } else {
                this.audio.pause();
                this.stateIcon.innerText = "play_arrow";
            }
            this.audioState.isPaused = !this.audioState.isPaused;
        })
        console.log(this.stateIcon)
    }
    draw() {
        requestAnimationFrame(this.draw.bind(this));
        this.analyser.getByteFrequencyData(this.dataArray);
        this.ctx.fillStyle = 'rgb(2, 2, 2)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        const barWidth = (this.width / this.bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            barHeight = this.dataArray[i] / 2;
            this.ctx.fillStyle = `rgb(50, 50, 200)`;
            this.ctx.fillRect(x, this.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    prev() {
        this.beingMusic -= 1;
        if (this.beingMusic < 0) {
            this.beingMusic = this.audioList.length - 1;
            this.audio.src = this.audioList[this.beingMusic]
        } else {
            this.audio.src = this.audioList[this.beingMusic];
        }
    }
    next() {
        this.beingMusic += 1;
        console.log(this.beingMusic)
        if (this.beingMusic > this.audioList.length - 1) {
            this.beingMusic = 0;
            this.audio.src = this.audioList[this.beingMusic]
        } else {
            this.audio.src = this.audioList[this.beingMusic];
        }
    }

    volumeChange() {
        this.audio.volume = this.volumeController.value;
    }
}

window.onload = () => {
    new Soundwave();
}

