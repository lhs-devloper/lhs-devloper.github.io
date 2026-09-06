import { LetterWheel } from "./letters.js";

/* 이 거리 이상 끌면 클릭이 아니라 드래그로 본다 */
const DRAG_THRESHOLD = 6;
/* 드래그·클릭을 가로채면 안 되는(자체 동작이 있는) 요소 */
const BLOCKERS = 'a, button, input, textarea, select';

/* 캔버스 하나에 레터 카드 휠을 올리고 드래그·호버·클릭을 연결한다. */
export class LetterStage {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.host = canvas.parentElement;

        /* 손을 뗀 뒤 감속률과 유휴 상태의 자동 흐름 */
        this.friction = options.friction ?? 0.94;
        this.autoSpin = options.autoSpin || 0;

        this.wheel = new LetterWheel({ items: options.items || [] });

        this.pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;
        this.isDown = false;
        this.moveX = 0;
        this.offsetX = 0;
        this.dragDelta = 0;

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));

        document.addEventListener('pointerdown', this.onDown.bind(this), false);
        document.addEventListener('pointermove', this.onMove.bind(this), false);
        document.addEventListener('pointerup', this.onUp.bind(this), false);

        /* 테마 토글 → 종이·글자·강조색도 함께 전환 */
        new MutationObserver(() => {
            this.wheel.setTheme(document.documentElement.getAttribute('data-theme'));
        }).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        /* Esc 로 확대를 닫는다 */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.wheel.blur();
        });

        window.requestAnimationFrame(this.animate.bind(this));
    }

    resize() {
        const host = this.canvas.parentElement;
        this.stageWidth = host.clientWidth;
        this.stageHeight = host.clientHeight;

        this.canvas.width = this.stageWidth * this.pixelRatio;
        this.canvas.height = this.stageHeight * this.pixelRatio;
        this.canvas.style.width = this.stageWidth + 'px';
        this.canvas.style.height = this.stageHeight + 'px';
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

        /* 휠은 다시 만들지 않으므로 현재 위치가 그대로 유지된다 */
        this.wheel.resize(this.stageWidth, this.stageHeight);
    }

    animate() {
        window.requestAnimationFrame(this.animate.bind(this));
        this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

        this.moveX *= this.friction;

        /*
         * 손을 떼고 관성도 멎었을 때:
         * 좁은 화면은 가장 가까운 카드로 정렬하고,
         * 넓은 화면은 아주 천천히 혼자 흐른다. 카드를 겨냥하는 중엔 멈춘다.
         */
        const idle = !this.isDown && Math.abs(this.moveX) < 0.05;
        if (idle && this.wheel.focusIndex < 0) {
            if (this.wheel.narrow) {
                this.wheel.settle();
            } else if (this.autoSpin && this.wheel.hoverIndex < 0) {
                this.wheel.spin(this.autoSpin);
            }
        }

        this.wheel.animate(this.ctx, this.moveX);
    }

    /* 포인터의 캔버스 기준 좌표와 영역 안 여부 */
    localPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        return { x, y, inside };
    }

    matches(e, selector) {
        return !!(e.target && e.target.closest && e.target.closest(selector));
    }

    /* 포인터 위치로 호버 중인 카드를 갱신하고 그 index를 돌려준다 */
    updateHover(e) {
        const p = this.localPoint(e);
        const blocked = this.isDown || this.matches(e, BLOCKERS);

        /* 확대 상태에서는 닫기·링크·바깥만 누를 수 있다 */
        if (this.wheel.focusIndex >= 0) {
            const hit = (p.inside && !blocked) ? this.wheel.focusHitTest(p.x, p.y) : 'none';
            this.wheel.hoverIndex = -1;
            this.host.classList.toggle('is-hot', hit === 'link' || hit === 'close' || hit === 'outside');
            return -1;
        }

        const index = (p.inside && !blocked) ? this.wheel.hitTest(p.x, p.y) : -1;
        this.wheel.hoverIndex = index;
        this.host.classList.toggle('is-hot', index >= 0);
        return index;
    }

    onDown(e) {
        /* 스테이지 밖에서 시작한 드래그는 카드를 움직이지 않는다 */
        if (!this.localPoint(e).inside) return;
        if (this.matches(e, BLOCKERS)) return;

        /* 카드를 잡고 미는 중에 주변 텍스트가 선택되지 않게 한다 */
        if (this.wheel.hoverIndex >= 0) e.preventDefault();

        this.isDown = true;
        this.moveX = 0;
        this.offsetX = e.clientX;
        this.dragDelta = 0;
    }

    onMove(e) {
        if (this.isDown) {
            const dx = e.clientX - this.offsetX;
            this.offsetX = e.clientX;
            this.dragDelta += Math.abs(dx);
            /* 확대 중에는 끌어도 휠이 돌지 않는다 */
            this.moveX = this.wheel.focusIndex >= 0 ? 0 : dx;
        }
        this.updateHover(e);
    }

    onUp(e) {
        if (!this.isDown) return;
        this.isDown = false;

        /* 거의 안 움직였을 때만 클릭으로 본다 */
        if (this.dragDelta >= DRAG_THRESHOLD) return;

        const p = this.localPoint(e);
        if (!p.inside) return;

        /* 확대 상태: 링크는 프로젝트로, 닫기·바깥은 원래 크기로 */
        if (this.wheel.focusIndex >= 0) {
            const hit = this.wheel.focusHitTest(p.x, p.y);
            if (hit === 'link') {
                const project = this.wheel.projectAt(this.wheel.focusIndex);
                if (project) window.open(project.link, '_blank', 'noopener');
            } else if (hit === 'close' || hit === 'outside') {
                this.wheel.blur();
            }
            return;
        }

        /* 평소: 누른 카드를 확대한다 */
        const index = this.updateHover(e);
        if (index >= 0) this.wheel.focus(index);
    }
}
