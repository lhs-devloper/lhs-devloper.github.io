import { LetterWheel } from "./letters.js";
import { openAndGo } from "./page-transition.js";

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
            this.dirty = true;
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
        /* 레이아웃이 바뀌었으니 최소 한 프레임은 다시 그린다 */
        this.dirty = true;
    }

    animate() {
        window.requestAnimationFrame(this.animate.bind(this));

        this.moveX *= this.friction;
        /* 아주 미세한 관성은 0으로 끊어 불필요한 재렌더를 막는다 */
        if (Math.abs(this.moveX) < 0.05) this.moveX = 0;

        /*
         * 손을 떼고 관성도 멎었을 때:
         * 좁은 화면은 가장 가까운 카드로 정렬하고,
         * 넓은 화면은 아주 천천히 혼자 흐른다. 카드를 겨냥하는 중엔 멈춘다.
         */
        const idle = !this.isDown && this.moveX === 0;
        if (idle && this.wheel.focusIndex < 0) {
            if (this.wheel.narrow) {
                this.wheel.settle();
            } else if (this.autoSpin && this.wheel.hoverIndex < 0) {
                this.wheel.spin(this.autoSpin);
            }
        }

        /*
         * 움직임이 완전히 멎은 프레임은 다시 그리지 않는다.
         * 정지한 캔버스를 매 프레임 새로 칠하면 페이지 스크롤까지 끊긴다.
         */
        if (!this.dirty && !this.needsFrame()) return;
        this.dirty = false;

        this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
        this.wheel.animate(this.ctx, this.moveX);
    }

    /* 아직 화면이 변할 여지가 있는가 (없으면 이 프레임은 건너뛴다) */
    needsFrame() {
        const w = this.wheel;
        if (this.isDown || this.moveX !== 0) return true;
        /* 확대 카드가 떠 있거나 여닫는 중 */
        if (w.focusIndex >= 0 || w.focusT !== 0) return true;
        /* 호버로 떠오른 카드가 있거나 아직 가라앉는 중 */
        if (w.hoverIndex >= 0 || w.lift.some((v) => v > 0.0001)) return true;
        /* 좁은 화면: 가장 가까운 카드로 정렬이 끝나지 않았으면 계속 */
        if (w.narrow) return w.offset !== Math.round(w.offset);
        /* 넓은 화면은 자동으로 천천히 흐른다 */
        return !!this.autoSpin;
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
        this.dirty = true;
    }

    onMove(e) {
        if (this.isDown) {
            const dx = e.clientX - this.offsetX;
            this.offsetX = e.clientX;
            this.dragDelta += Math.abs(dx);
            /* 확대 중에는 끌어도 휠이 돌지 않는다 */
            this.moveX = this.wheel.focusIndex >= 0 ? 0 : dx;
            /* 드래그 중 호버 판정은 의미가 없다 — 매 이동마다의 좌표 계산을 건너뛴다 */
            return;
        }
        this.updateHover(e);
    }

    onUp(e) {
        if (!this.isDown) return;
        this.isDown = false;
        this.dirty = true;

        /* 거의 안 움직였을 때만 클릭으로 본다 */
        if (this.dragDelta >= DRAG_THRESHOLD) return;

        const p = this.localPoint(e);
        if (!p.inside) return;

        /* 확대 상태: 링크는 프로젝트로, 닫기·바깥은 원래 크기로 */
        if (this.wheel.focusIndex >= 0) {
            const hit = this.wheel.focusHitTest(p.x, p.y);
            if (hit === 'link') {
                const card = this.wheel.focusVisual();
                if (card) {
                    /* 스테이지 기준 좌표를 뷰포트 기준으로 옮겨 넘긴다 */
                    const rect = this.canvas.getBoundingClientRect();
                    openAndGo({ ...card, x: rect.left + card.x, y: rect.top + card.y });
                }
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
