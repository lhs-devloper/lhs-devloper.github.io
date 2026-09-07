class Soundwave {
    constructor() {
        this.tracks = [
            { src: '../sound/ellinia.mp3', title: 'Ellinia', mood: 'Ambient · Loop' },
            { src: '../sound/speed.mp3', title: 'Speed', mood: 'Energetic · Loop' },
            { src: '../sound/eclipse.mp3', title: 'Eclipse', mood: 'Dark · Loop' },
            { src: '../sound/candyland.mp3', title: 'Candyland', mood: 'Playful · Loop' },
        ];
        this.beingMusic = 0;

        // ----- DOM -----
        this.target = document.getElementById('soundWave');
        this.hint = document.getElementById('visualizerHint');
        this.volumeController = document.getElementById('soundVolume');
        this.stateIcon = document.getElementById('state');
        this.playToggle = document.getElementById('playToggle');
        this.prevTag = document.getElementById('prev');
        this.nextTag = document.getElementById('next');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackSub = document.getElementById('trackSub');
        this.trackCount = document.getElementById('trackCount');
        this.volumeIcon = document.getElementById('volumeIcon');
        this.playlistEl = document.getElementById('playlist');
        this.loadingEl = document.getElementById('visualizerLoading');

        this._prefetched = new Set();

        // ----- Audio -----
        this.audio = document.createElement('audio');
        this.audio.preload = 'auto';
        this.audio.src = this.tracks[this.beingMusic].src;
        this.audio.loop = true;
        this.audio.volume = parseFloat(this.volumeController.value) || 0.5;
        document.body.appendChild(this.audio);

        // 로딩 상태 표시: 버퍼링 시작 → 스피너, 재생 가능 → 숨김
        this.audio.addEventListener('waiting', () => this.setLoading(true));
        this.audio.addEventListener('stalled', () => this.setLoading(true));
        this.audio.addEventListener('playing', () => this.setLoading(false));
        this.audio.addEventListener('canplay', () => this.setLoading(false));

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioState = { isPaused: true };

        this.source = this.audioCtx.createMediaElementSource(this.audio);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        // ----- Canvas -----
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('wave');
        this.ctx = this.canvas.getContext('2d');
        this.target.appendChild(this.canvas);

        // ----- Events -----
        this.prevTag.addEventListener('click', this.prev.bind(this));
        this.nextTag.addEventListener('click', this.next.bind(this));
        this.playToggle.addEventListener('click', this.playMusic.bind(this));
        this.canvas.addEventListener('click', this.playMusic.bind(this));
        if (this.hint) this.hint.addEventListener('click', this.playMusic.bind(this));
        this.volumeController.addEventListener('input', this.volumeChange.bind(this));
        window.addEventListener('resize', this.resize.bind(this), false);

        this.buildPlaylist();
        this.updateTrackInfo();
        this.updateVolumeIcon();
        this.prefetchNeighbors();
        this.resize();
        this.draw();
    }

    setLoading(isLoading) {
        if (!this.loadingEl) return;
        this.loadingEl.classList.toggle('active', isLoading);
    }

    prefetch(url) {
        if (this._prefetched.has(url)) return;
        this._prefetched.add(url);
        // 브라우저 HTTP 캐시를 미리 데워 두면 트랙 전환이 즉시 이뤄짐
        fetch(url, { cache: 'force-cache' }).catch(() => this._prefetched.delete(url));
    }

    prefetchNeighbors() {
        const n = this.tracks.length;
        this.prefetch(this.tracks[(this.beingMusic + 1) % n].src);
        this.prefetch(this.tracks[(this.beingMusic - 1 + n) % n].src);
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = this.target.clientWidth;
        const h = this.target.clientHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = w;
        this.height = h;
    }

    accent() {
        const styles = getComputedStyle(document.documentElement);
        return {
            main: (styles.getPropertyValue('--accent') || '#7a9ce0').trim(),
            hover: (styles.getPropertyValue('--accent-hover') || '#a3c2f0').trim(),
        };
    }

    playMusic() {
        this.audioCtx.resume().then(() => {
            if (this.audioState.isPaused) {
                if (this.audio.readyState < 3) this.setLoading(true);
                this.audio.play();
                this.stateIcon.innerText = 'pause';
            } else {
                this.audio.pause();
                this.stateIcon.innerText = 'play_arrow';
            }
            this.audioState.isPaused = !this.audioState.isPaused;
            this.playToggle.classList.toggle('is-playing', !this.audioState.isPaused);
            if (this.hint) this.hint.classList.toggle('hidden', !this.audioState.isPaused);
        });
    }

    draw() {
        requestAnimationFrame(this.draw.bind(this));
        this.analyser.getByteFrequencyData(this.dataArray);

        const w = this.width;
        const h = this.height;
        this.ctx.clearRect(0, 0, w, h);

        const bars = 48;
        const gap = 3;
        const barWidth = (w - gap * (bars - 1)) / bars;
        const mid = h / 2;
        const step = Math.floor(this.bufferLength / bars);
        const { main, hover } = this.accent();

        const grad = this.ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, hover);
        grad.addColorStop(1, main);
        this.ctx.fillStyle = grad;

        let x = 0;
        for (let i = 0; i < bars; i++) {
            const value = this.dataArray[i * step] || 0;
            const barHeight = Math.max((value / 255) * (h * 0.9), 3);
            const y = mid - barHeight / 2;
            const r = Math.min(barWidth / 2, 4);
            this.roundRect(x, y, barWidth, barHeight, r);
            x += barWidth + gap;
        }
    }

    roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }

    buildPlaylist() {
        if (!this.playlistEl) return;
        this.playlistEl.innerHTML = '';
        this.tracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            li.innerHTML = `
                <span class="playlist-num">${String(index + 1).padStart(2, '0')}</span>
                <span class="playlist-info">
                    <span class="playlist-title">${track.title}</span>
                    <span class="playlist-mood">${track.mood}</span>
                </span>
                <span class="material-symbols-outlined playlist-icon">graphic_eq</span>
            `;
            li.addEventListener('click', () => this.selectTrack(index));
            this.playlistEl.appendChild(li);
        });
    }

    selectTrack(index) {
        this.beingMusic = index;
        this.loadTrack(true);
    }

    loadTrack(forcePlay) {
        this.audio.src = this.tracks[this.beingMusic].src;
        this.updateTrackInfo();
        this.prefetchNeighbors();
        if (forcePlay || !this.audioState.isPaused) {
            this.setLoading(true);
            this.audioCtx.resume().then(() => {
                this.audio.play();
                this.stateIcon.innerText = 'pause';
                this.audioState.isPaused = false;
                this.playToggle.classList.add('is-playing');
                if (this.hint) this.hint.classList.add('hidden');
            });
        }
    }

    updateTrackInfo() {
        const track = this.tracks[this.beingMusic];
        this.trackTitle.innerText = track.title;
        this.trackSub.innerText = track.mood;
        this.trackCount.innerText = `${this.beingMusic + 1} / ${this.tracks.length}`;
        if (this.playlistEl) {
            [...this.playlistEl.children].forEach((li, i) => {
                li.classList.toggle('active', i === this.beingMusic);
            });
        }
    }

    prev() {
        this.beingMusic = (this.beingMusic - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack(false);
    }

    next() {
        this.beingMusic = (this.beingMusic + 1) % this.tracks.length;
        this.loadTrack(false);
    }

    volumeChange() {
        this.audio.volume = this.volumeController.value;
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        if (!this.volumeIcon) return;
        const v = parseFloat(this.volumeController.value);
        this.volumeIcon.innerText = v === 0 ? 'volume_off' : v < 0.5 ? 'volume_down' : 'volume_up';
    }
}

window.onload = () => {
    new Soundwave();
};
