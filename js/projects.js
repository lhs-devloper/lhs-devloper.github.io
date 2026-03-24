/*
 * 프로젝트 추가: 이 배열에 객체를 추가하면 캐러셀에 자동 반영됩니다.
 */
const PROJECTS = [
    {
        title: "Interactive Sheep",
        desc: "Canvas API와 스프라이트 애니메이션을 활용한 인터랙티브 양 시뮬레이션입니다. 언덕 위를 뛰어다니는 양들의 자연스러운 움직임을 구현했습니다.",
        tags: ["Canvas", "JavaScript", "Sprite Animation"],
        link: "./sheep.html",
        thumb: "./images/1.jpg",
    },
    {
        title: "Interactive Sound",
        desc: "Web Audio API와 FFT 분석을 활용한 실시간 사운드 비주얼라이저입니다. 메이플스토리 BGM에 맞춰 주파수 막대가 반응합니다.",
        tags: ["Web Audio API", "Canvas", "FFT"],
        link: "./sound.html",
        thumb: "./images/2.jpg",
    },
    {
        title: "메이플랜드 퀴즈",
        desc: "메이플스토리 NPC 이미지를 보고 이름을 맞추는 타이머 기반 퀴즈 게임입니다. 131개의 NPC 중 50문제가 랜덤 출제됩니다.",
        tags: ["JavaScript", "Quiz", "Game"],
        link: "./maplequiz/index.html",
        thumb: "./images/3.jpg",
    },
];

const PI2 = Math.PI * 2;

class CarouselItem {
    constructor(project, index) {
        this.project = project;
        this.index = index;
        this.angle = 0;
        this.screenX = 0;
        this.screenY = 0;
        this.scale = 1;
        this.zIndex = 0;
        this.opacity = 1;

        // 썸네일 이미지 프리로드
        this.img = null;
        this.imgLoaded = false;
        if (project.thumb) {
            this.img = new Image();
            this.img.onload = () => { this.imgLoaded = true; };
            this.img.src = project.thumb;
        }
    }
}

class ProjectCarousel {
    constructor() {
        this.canvas = document.getElementById("carousel-canvas");
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext("2d");
        this.pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;

        // 캐러셀 상태
        this.items = PROJECTS.map((p, i) => new CarouselItem(p, i));
        this.rotation = 0;         // 전체 캐러셀 회전각
        this.velocity = 0;         // 관성 속도
        this.isDragging = false;
        this.startX = 0;
        this.lastX = 0;
        this.dragDelta = 0;

        // 레이아웃
        this.centerX = 0;
        this.centerY = 0;
        this.radiusX = 0;    // 타원 가로 반지름
        this.radiusY = 0;    // 타원 세로 반지름 (반구 깊이감)
        this.baseSize = 0;   // 폴리곤 기본 크기

        this.resize();
        window.addEventListener("resize", () => this.resize());

        // 드래그 이벤트
        this.canvas.addEventListener("pointerdown", (e) => this.onDown(e));
        this.canvas.addEventListener("pointermove", (e) => this.onMove(e));
        this.canvas.addEventListener("pointerup", (e) => this.onUp(e));
        this.canvas.addEventListener("pointerleave", (e) => this.onUp(e));

        // 클릭 → 모달
        this.clickStartX = 0;
        this.clickStartY = 0;

        // 모달 이벤트
        const modal = document.getElementById("project-modal");
        modal.querySelector(".modal-close").addEventListener("click", () => this.closeModal());
        modal.addEventListener("click", (e) => {
            if (e.target === modal) this.closeModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this.closeModal();
        });

        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        this.canvas.width = w * this.pixelRatio;
        this.canvas.height = h * this.pixelRatio;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

        this.stageW = w;
        this.stageH = h;
        this.centerX = w / 2;
        this.centerY = h * 0.45;
        this.radiusX = w * 0.35;
        this.radiusY = h * 0.15;
        this.baseSize = Math.min(w, h) * 0.6;
    }

    // --- 3D 위치 계산 ---
    updateItems() {
        const count = this.items.length;
        const angleStep = PI2 / count;

        this.items.forEach((item, i) => {
            item.angle = this.rotation + angleStep * i;

            // 원형 배치: cos = 좌우, sin = 깊이(앞뒤)
            const cosA = Math.cos(item.angle);
            const sinA = Math.sin(item.angle);

            item.screenX = this.centerX + this.radiusX * cosA;
            item.screenY = this.centerY + this.radiusY * sinA;

            // sinA: -1(뒤) ~ +1(앞). 앞에 있을수록 크고 밝게
            const depth = (sinA + 1) / 2; // 0(뒤) ~ 1(앞)
            // ease-in 곡선으로 앞쪽이 급격히 커지는 효과
            const eased = depth * depth;
            item.scale = 0.35 + eased * 0.65;
            item.opacity = 0.3 + depth * 0.7;
            item.zIndex = depth;
        });
    }

    // --- 렌더링 ---
    drawItem(item) {
        const ctx = this.ctx;
        const size = this.baseSize * item.scale;
        const r = size * 0.5; // 원 반지름

        ctx.save();
        ctx.globalAlpha = item.opacity;

        // 원형 클리핑 + 이미지 그리기
        if (item.imgLoaded) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(item.screenX, item.screenY, r, 0, PI2);
            ctx.closePath();
            ctx.clip();

            // 이미지를 원 영역에 cover 방식으로 그리기
            const img = item.img;
            const imgRatio = img.width / img.height;
            let drawW, drawH;
            // 정사각 영역에 cover
            if (imgRatio > 1) {
                drawH = size;
                drawW = size * imgRatio;
            } else {
                drawW = size;
                drawH = size / imgRatio;
            }
            ctx.drawImage(
                img,
                item.screenX - drawW / 2,
                item.screenY - drawH / 2,
                drawW,
                drawH
            );
            ctx.restore();

            // 테두리
            ctx.beginPath();
            ctx.arc(item.screenX, item.screenY, r, 0, PI2);
            ctx.closePath();
            ctx.strokeStyle = item.zIndex > 0.7
                ? (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a3c2f0')
                : (getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2d3748');
            ctx.lineWidth = item.zIndex > 0.7 ? 3 : 1.5;
            ctx.stroke();
        } else {
            // 이미지 로딩 전 placeholder
            ctx.beginPath();
            ctx.arc(item.screenX, item.screenY, r, 0, PI2);
            ctx.closePath();
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#222';
            ctx.fill();
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2a2a2a';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // 프로젝트 이름
        ctx.globalAlpha = item.opacity;
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary').trim() || '#f0f0f0';
        ctx.font = `600 ${Math.round(14 * item.scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(item.project.title, item.screenX, item.screenY + r + 24);

        ctx.restore();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.ctx.clearRect(0, 0, this.stageW, this.stageH);

        // 관성 + 자동 회전
        if (!this.isDragging) {
            this.velocity *= 0.96;
            if (Math.abs(this.velocity) < 0.0001) this.velocity = 0;
            this.rotation += this.velocity;

            // 관성이 멈추면 시계방향 자동 회전
            if (this.velocity === 0) {
                this.rotation += 0.004;
            }
        }

        this.updateItems();

        // z-sort: 뒤쪽 먼저 그리기
        const sorted = [...this.items].sort((a, b) => a.zIndex - b.zIndex);
        sorted.forEach(item => this.drawItem(item));
    }

    // --- 드래그 ---
    onDown(e) {
        this.isDragging = true;
        this.velocity = 0;
        this.startX = e.clientX;
        this.lastX = e.clientX;
        this.clickStartX = e.clientX;
        this.clickStartY = e.clientY;
        this.dragDelta = 0;
    }

    onMove(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastX;
        this.lastX = e.clientX;
        this.dragDelta += Math.abs(dx);

        // 드래그 → 회전
        this.rotation -= dx * 0.005;
        this.velocity = -dx * 0.005;
    }

    onUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        // 클릭 판정 (드래그 거리 짧으면 클릭)
        if (this.dragDelta < 6 && e.clientX !== undefined) {
            this.handleClick(e);
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // 앞쪽(z가 높은) 항목부터 히트 테스트
        const sorted = [...this.items].sort((a, b) => b.zIndex - a.zIndex);

        for (const item of sorted) {
            const size = this.baseSize * item.scale;
            const dx = mx - item.screenX;
            const dy = my - item.screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < size * 0.5 && item.opacity > 0.4) {
                this.openModal(item.index);
                return;
            }
        }
    }

    // --- 모달 ---
    openModal(index) {
        const project = PROJECTS[index];
        const modal = document.getElementById("project-modal");

        // 썸네일 이미지
        const thumbImg = document.getElementById("modal-thumb");
        const thumbWrap = document.getElementById("modal-thumb-wrap");
        if (project.thumb) {
            thumbImg.src = project.thumb;
            thumbImg.alt = project.title;
            thumbWrap.style.display = "";
        } else {
            thumbWrap.style.display = "none";
        }

        document.getElementById("modal-title").textContent = project.title;
        document.getElementById("modal-desc").textContent = project.desc;
        document.getElementById("modal-link").href = project.link;

        const tagsEl = document.getElementById("modal-tags");
        tagsEl.innerHTML = project.tags
            .map(t => `<span class="tag">${t}</span>`)
            .join("");

        modal.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    closeModal() {
        const modal = document.getElementById("project-modal");
        modal.classList.remove("open");
        document.body.style.overflow = "";
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new ProjectCarousel();
});
