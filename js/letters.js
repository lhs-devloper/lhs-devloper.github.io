/*
 * 레터헤드 카드 휠.
 * 세로형 종이 카드가 폴리곤처럼 호를 따라 부채꼴로 돌아가며,
 * 끝까지 돌면 다시 처음 카드로 이어진다.
 */

/* 세로형 종이 비율 (A4에 가깝게) */
const PAPER_RATIO = 1.414;
/* 호 위에서 이웃 카드 사이의 각도 — 카드가 기울어지는 정도를 결정한다 */
const ARC_STEP = 18 * Math.PI / 180;
/* 카드 폭 대비 호의 반지름. 클수록 부채꼴이 완만하고 카드가 멀리 벌어진다 */
const ARC_RADIUS = 4.2;
/* 좁은 화면에서는 카드가 스테이지 폭을 거의 채우므로 호를 넓혀 한 장씩 보이게 한다 */
const ARC_RADIUS_NARROW = 3.4;
/* 맨 끝 카드가 처음으로 되감기기 직전, 이 구간(카드 단위)에 걸쳐 사라진다 */
const WRAP_FADE = 0.3;
/* 중앙에서 멀어질수록 작아지고 흐려지는 정도 */
const SIDE_SCALE = 0.14;
const SIDE_FADE = 0.55;
/* 호버 시 카드가 떠오르는 높이 (카드 높이 대비) */
const LIFT_RATIO = 0.03;
/* 포커스한 카드가 차지하는 스테이지 높이 비율 */
const FOCUS_HEIGHT = 0.99;
/* 포커스로 들어가고 나오는 속도 */
const FOCUS_EASE = 0.14;

/* 종이 안쪽 여백과 글자 크기 — 모두 카드 폭에 비례한다 */
const PAD = 0.088;
const FONT_HEAD = 0.042;
const FONT_TITLE = 0.085;
const FONT_BODY = 0.050;
const FONT_TAG = 0.038;
const FONT_FOOT = 0.042;

/* 카드가 작아져도 이 아래로는 줄이지 않는다 */
const MIN_HEAD = 9;
const MIN_TITLE = 15;
const MIN_BODY = 11;
const MIN_TAG = 9;
const MIN_FOOT = 10;

const FAMILY = 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/*
 * 프로젝트마다 하나씩 고정으로 배정되는 강조색.
 * 좌측 띠·문서번호·구분선·태그 칩·링크·닫기 버튼이 모두 이 색을 쓴다.
 * 종이(--bg-card) 위에서 읽혀야 하므로 테마별로 밝기를 달리 잡았다.
 */
const THEME_ACCENTS = {
    /* 어두운 종이 위 — 밝고 채도 있는 색으로 서로 확실히 갈라지게 */
    dark: [
        '#a78bfa',  // 바이올렛
        '#38bdf8',  // 스카이블루
        '#34d399',  // 에메랄드
        '#fbbf24',  // 앰버
        '#fb7185',  // 로즈
        '#22d3ee',  // 시안
        '#a3e635',  // 라임
        '#f472b6',  // 핑크
    ],
    /* 흰 종이 위 — 좀 더 가라앉은 색 */
    light: [
        '#2a91a8',  // 틸
        '#4acee5',  // 시안
        '#99d050',  // 라이트그린
        '#e0af27',  // 앰버
        '#c850c0',  // 마젠타
        '#1a73e8',  // 블루
        '#bf342d',  // 레드
        '#605ac7',  // 인디고
    ],
};

function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/* #rrggbb + 투명도 → rgba() */
function rgba(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/*
 * 줄바꿈 단위로 자른다.
 * 영문은 단어를 쪼개지 않고, 한글·한자는 글자 단위로 넘긴다.
 */
function tokenize(text) {
    const tokens = [];
    let buf = '';
    for (const ch of text) {
        if (/\s/.test(ch)) {
            if (buf) { tokens.push(buf); buf = ''; }
            tokens.push(' ');
        } else if (/[　-〿぀-鿿가-힯]/.test(ch)) {
            if (buf) { tokens.push(buf); buf = ''; }
            tokens.push(ch);
        } else {
            buf += ch;
        }
    }
    if (buf) tokens.push(buf);
    return tokens;
}

/* 줄 맨 앞에 오면 어색한 문장부호 */
const TRAILING_PUNCT = /^[.,!?;:)\]}…·%'"”’]+$/;

/* 현재 ctx.font 기준으로 maxLines 줄까지 접고, 넘치면 말줄임 */
function wrapText(ctx, text, maxWidth, maxLines) {
    const lines = [];
    let line = '';

    for (const token of tokenize(text)) {
        if (token === ' ' && !line) continue;
        const next = line + token;
        if (line && ctx.measureText(next).width > maxWidth) {
            /* 마침표·쉼표는 넘치더라도 앞 줄에 붙여 둔다 */
            if (TRAILING_PUNCT.test(token)) { line = next; continue; }
            lines.push(line);
            if (lines.length === maxLines) break;
            line = token === ' ' ? '' : token;
        } else {
            line = next;
        }
    }
    if (lines.length < maxLines && line) lines.push(line);

    /* 아직 남은 글자가 있으면 마지막 줄을 말줄임으로 닫는다 */
    const consumed = lines.join('').replace(/\s/g, '').length;
    const total = text.replace(/\s/g, '').length;
    if (consumed < total && lines.length) {
        let last = lines[lines.length - 1];
        while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
        lines[lines.length - 1] = last + '…';
    }
    return lines;
}

export class LetterWheel {
    constructor(options = {}) {
        this.items = options.items || [];
        /* 카드 단위 위치. 1 늘어나면 카드 한 장만큼 왼쪽으로 흐른다 */
        this.offset = 0;

        this.hoverIndex = -1;
        this.activeIndex = -1;
        this.lift = new Array(this.items.length).fill(0);

        /* 확대해서 들여다보는 카드 */
        this.focusIndex = -1;
        this.focusT = 0;
        /* 확대된 카드의 닫기·링크 영역 (스테이지 좌표, 매 프레임 갱신) */
        this.regions = null;

        this.stageWidth = 0;
        this.stageHeight = 0;
        this.setTheme(document.documentElement.getAttribute('data-theme'));
    }

    setTheme(theme) {
        this.theme = theme === 'light' ? 'light' : 'dark';
        /* 색이 바뀌므로 미리 구워둔 앞면 캐시를 버린다 */
        this.faces = null;
        /* 프로젝트 순서대로 강조색을 하나씩 배정한다 */
        const accents = THEME_ACCENTS[this.theme];
        this.accents = this.items.map((_, i) => accents[i % accents.length]);

        this.ui = {
            paper: cssVar('--bg-card', '#1c242d'),
            border: cssVar('--border', '#2d3748'),
            title: cssVar('--text-primary', '#f0f4f8'),
            body: cssVar('--text-secondary', '#a0aec0'),
            muted: cssVar('--text-muted', '#718096'),
            shadow: this.theme === 'light'
                ? 'rgba(70, 100, 150, 0.20)'
                : 'rgba(0, 0, 0, 0.55)',
        };
    }

    resize(w, h) {
        this.stageWidth = w;
        this.stageHeight = h;

        /* 스테이지가 세로로 길면(모바일) 카드를 폭에 맞춰 크게 키운다 */
        const narrow = w / h < 1.1;
        this.narrow = narrow;

        this.cardH = Math.min(
            h * (narrow ? 0.70 : 0.56),
            w * (narrow ? 0.72 : 0.44) * PAPER_RATIO
        );
        this.cardW = this.cardH / PAPER_RATIO;

        /* 좁은 화면에서는 호를 넓혀 한 장씩, 넓은 화면에서는 부채꼴로 펼친다 */
        this.radius = this.cardW * (narrow ? ARC_RADIUS_NARROW : ARC_RADIUS);
        /* 드래그 거리를 카드 단위로 환산할 때 쓰는 가로 간격 */
        this.spacing = this.radius * Math.sin(ARC_STEP);

        this.cx = w / 2;
        /* 호의 꼭대기(가운데 카드)가 놓이는 높이 */
        this.cy = h * (narrow ? 0.46 : 0.44);
    }

    projectAt(i) {
        return this.items[i] || null;
    }

    /* i번 카드의 중앙 기준 거리(카드 단위). -n/2 ~ n/2 로 감긴다 */
    distance(i) {
        const n = this.items.length;
        if (!n) return 0;
        let d = (((i - this.offset) % n) + n) % n;
        if (d > n / 2) d -= n;
        return d;
    }

    focus(i) {
        this.focusIndex = i;
        /* 확대된 뒤에는 포인터가 움직이지 않아도 호버가 풀려야 한다 */
        this.hoverIndex = -1;
    }

    blur() {
        this.focusIndex = -1;
    }

    updateFocus() {
        const target = this.focusIndex >= 0 ? 1 : 0;
        this.focusT += (target - this.focusT) * FOCUS_EASE;
        if (Math.abs(target - this.focusT) < 0.001) this.focusT = target;
        if (!this.focusT) this.regions = null;
    }

    /* 확대된 카드에서 포인터가 짚은 곳 */
    focusHitTest(px, py) {
        if (this.focusIndex < 0 || this.focusT < 0.98 || !this.regions) return 'none';
        const { close, link, card } = this.regions;

        /* 닫기 버튼은 원, 링크는 글자 영역 */
        if (Math.hypot(px - close.cx, py - close.cy) <= close.r + 5) return 'close';
        if (px >= link.x && px <= link.x + link.w &&
            py >= link.y && py <= link.y + link.h) return 'link';
        if (Math.abs(px - card.x) <= card.w / 2 &&
            Math.abs(py - card.y) <= card.h / 2) return 'card';
        return 'outside';
    }

    /*
     * 확대된 카드의 스테이지 기준 사각형과 색.
     * 페이지 전환 연출이 이 자리에서 이어받는다.
     */
    focusVisual() {
        if (this.focusIndex < 0 || !this.regions) return null;

        const c = this.regions.card;
        const project = this.projectAt(this.focusIndex);
        if (!project) return null;

        return {
            x: c.x - c.w / 2,
            y: c.y - c.h / 2,
            w: c.w,
            h: c.h,
            radius: c.w * 0.03,
            accent: this.accents[this.focusIndex],
            paper: this.ui.paper,
            titleColor: this.ui.title,
            title: project.title,
            link: project.link,
        };
    }

    /* 되감기 직전 구간에서 0으로 떨어지는 계수 */
    wrapFade(d) {
        const edge = this.items.length / 2;
        return Math.min(1, Math.max(0, (edge - Math.abs(d)) / WRAP_FADE));
    }

    /* i번 카드의 호 위 위치·기울기·크기 */
    box(i) {
        const d = this.distance(i);
        const k = Math.min(Math.abs(d), 1);
        const lift = this.lift[i];

        /* 가운데가 0도, 양옆으로 갈수록 호를 따라 기운다 */
        const angle = d * ARC_STEP;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        /* 호버한 카드는 호 바깥쪽으로 뽑혀 나온다 */
        const out = lift * this.cardH * LIFT_RATIO;
        const scale = 1 - k * SIDE_SCALE + lift * 0.02;

        const arc = {
            d,
            k,
            angle,
            w: this.cardW * scale,
            h: this.cardH * scale,
            x: this.cx + this.radius * sin + out * sin,
            y: this.cy + this.radius * (1 - cos) - out * cos,
            /* 되감기는 지점에서 카드가 튀어 보이지 않도록 미리 사라진다 */
            alpha: (1 - k * SIDE_FADE) * this.wrapFade(d),
        };

        if (!this.focusT) return arc;

        /* 나머지 카드는 확대가 진행될수록 물러난다 */
        const t = this.focusT * this.focusT * (3 - 2 * this.focusT);
        if (i !== this.focusIndex) {
            return { ...arc, alpha: arc.alpha * (1 - t) };
        }

        /* 확대된 카드는 호를 벗어나 똑바로 선 채 가운데로 온다 */
        const big = (this.stageHeight * FOCUS_HEIGHT) / this.cardH;
        const to = (a, b) => a + (b - a) * t;
        return {
            d,
            k: to(k, 0),
            angle: to(arc.angle, 0),
            w: to(arc.w, this.cardW * big),
            h: to(arc.h, this.cardH * big),
            x: to(arc.x, this.cx),
            y: to(arc.y, this.stageHeight / 2),
            alpha: to(arc.alpha, 1),
        };
    }

    hitTest(px, py) {
        /* 확대 중에는 뒤쪽 카드를 짚을 수 없다 */
        if (this.focusIndex >= 0) return -1;

        /* 앞에 있는(중앙에 가까운) 카드부터 검사 */
        const order = this.items
            .map((_, i) => i)
            .sort((a, b) => Math.abs(this.distance(a)) - Math.abs(this.distance(b)));

        for (const i of order) {
            const b = this.box(i);
            /* 카드가 기울어져 있으므로 포인터를 카드 기준 좌표로 되돌려 본다 */
            const dx = px - b.x;
            const dy = py - b.y;
            const cos = Math.cos(-b.angle);
            const sin = Math.sin(-b.angle);
            const lx = dx * cos - dy * sin;
            const ly = dx * sin + dy * cos;
            if (Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2) return i;
        }
        return -1;
    }

    /* 중앙에 가장 가까운 카드 */
    updateActive() {
        let best = -1;
        let bestDist = Infinity;
        for (let i = 0; i < this.items.length; i++) {
            const d = Math.abs(this.distance(i));
            if (d < bestDist) { bestDist = d; best = i; }
        }
        this.activeIndex = best;
    }

    updateLift() {
        for (let i = 0; i < this.lift.length; i++) {
            const target = i === this.hoverIndex ? 1 : 0;
            this.lift[i] += (target - this.lift[i]) * 0.18;
            if (Math.abs(target - this.lift[i]) < 0.001) this.lift[i] = target;
        }
    }

    /* 회전량을 카드 단위로 더한다. 양수면 카드가 왼쪽으로 흐른다 */
    spin(amount) {
        this.offset += amount;
    }

    /*
     * 가장 가까운 카드가 가운데 오도록 끌어당긴다.
     * 좁은 화면에서는 카드가 스테이지를 거의 채우므로,
     * 계속 흐르게 두면 어느 카드도 온전히 보이지 않는다.
     */
    settle() {
        const target = Math.round(this.offset);
        const diff = target - this.offset;
        if (Math.abs(diff) < 0.0005) {
            this.offset = target;
            return;
        }
        this.offset += diff * 0.12;
    }

    animate(ctx, moveX) {
        /* 포인터를 왼쪽으로 끌면 카드도 왼쪽으로 따라온다 */
        if (this.spacing) this.spin(-moveX / this.spacing);
        this.updateActive();
        this.updateLift();
        this.updateFocus();
        this.draw(ctx);
    }

    draw(ctx) {
        /* 먼 카드부터 그려 가운데 카드가 위에 오게 한다 */
        const order = this.items
            .map((_, i) => i)
            .sort((a, b) => Math.abs(this.distance(b)) - Math.abs(this.distance(a)));

        /* 확대·겨냥 중인 카드는 맨 마지막에 그려 항상 온전히 보이게 한다 */
        const top = this.focusIndex >= 0 ? this.focusIndex : this.hoverIndex;
        for (const i of order) {
            if (i !== top) this.drawCard(ctx, i);
        }
        if (top >= 0) this.drawCard(ctx, top);
    }

    drawCard(ctx, i) {
        const project = this.projectAt(i);
        if (!project) return;

        const b = this.box(i);
        /* 화면 밖 카드는 건너뛴다 (기울기까지 감안해 넉넉히) */
        const reach = (b.w + b.h) / 2;
        if (b.x + reach < 0 || b.x - reach > this.stageWidth) return;

        /*
         * 회전 중인 일반 카드는 미리 구워둔 앞면 비트맵을 얹기만 한다.
         * 텍스트 레이아웃(measureText·줄바꿈)은 카드당 한 번이면 되므로
         * 매 프레임 다시 그리던 비용이 사라진다.
         * 호버·확대 중인 카드만 강조 테두리·닫기 버튼까지 정밀하게 그린다.
         */
        const emphasis = Math.max(this.lift[i], i === this.focusIndex ? this.focusT : 0);
        if (emphasis <= 0.02) {
            this.drawCardCached(ctx, i, b);
            return;
        }
        this.drawCardLive(ctx, i, b, project, emphasis);
    }

    /* 회전 중인 카드: 캐시된 앞면 + 그림자만 합성한다 (drawImage 한 번) */
    drawCardCached(ctx, i, b) {
        const face = this.faceBitmap(i);
        if (!face) return;
        const blurScale = this.narrow ? 0.55 : 1;
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.shadowColor = this.ui.shadow;
        ctx.shadowBlur = b.w * 0.09 * blurScale;
        ctx.shadowOffsetY = b.w * 0.02 * blurScale;
        ctx.drawImage(face, -b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
    }

    /* 카드 앞면을 오프스크린에 한 번만 그려 재사용한다 (크기·테마가 바뀌면 다시 굽는다) */
    faceBitmap(i) {
        if (!this.faces) this.faces = [];
        const cached = this.faces[i];
        if (cached && cached.w === this.cardW && cached.h === this.cardH) return cached.canvas;

        const res = Math.min(2, window.devicePixelRatio || 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(this.cardW * res));
        canvas.height = Math.max(1, Math.round(this.cardH * res));
        const fctx = canvas.getContext('2d');
        fctx.setTransform(res, 0, 0, res, 0, 0);
        this.renderFace(fctx, i, this.cardW, this.cardH);
        this.faces[i] = { canvas, w: this.cardW, h: this.cardH };
        return canvas;
    }

    /* (0,0)-(w,h)에 카드 앞면을 그린다 — 기울기·그림자·강조·닫기 버튼은 포함하지 않는다 */
    renderFace(ctx, i, w, h) {
        const project = this.projectAt(i);
        if (!project) return;
        const accent = this.accents[i] || this.ui.border;
        const pad = w * PAD;
        const inner = w - pad * 2;
        const radius = w * 0.03;

        /* 종이 */
        roundRect(ctx, 0, 0, w, h, radius);
        ctx.fillStyle = this.ui.paper;
        ctx.fill();

        /* 왼쪽 가장자리 색 띠 */
        ctx.save();
        roundRect(ctx, 0, 0, w, h, radius);
        ctx.clip();
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, w * 0.018, h);
        ctx.restore();

        /* 테두리 */
        roundRect(ctx, 0, 0, w, h, radius);
        ctx.strokeStyle = this.ui.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        /* 종이 밖으로 글자가 새지 않게 */
        ctx.save();
        roundRect(ctx, 0, 0, w, h, radius);
        ctx.clip();

        let cursor = pad;

        const headSize = Math.max(MIN_HEAD, w * FONT_HEAD);
        ctx.font = `600 ${headSize}px ${FAMILY}`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = this.ui.muted;
        ctx.textAlign = 'left';
        ctx.fillText('LHS © 2026', pad, cursor);
        ctx.textAlign = 'right';
        ctx.fillStyle = accent;
        ctx.fillText(`No. ${String(i + 1).padStart(2, '0')}`, w - pad, cursor);
        cursor += headSize * 1.6;

        ctx.beginPath();
        ctx.moveTo(pad, Math.round(cursor) + 0.5);
        ctx.lineTo(w - pad, Math.round(cursor) + 0.5);
        ctx.strokeStyle = rgba(accent, 0.55);
        ctx.lineWidth = 1;
        ctx.stroke();
        cursor += h * 0.07;

        const titleSize = Math.max(MIN_TITLE, w * FONT_TITLE);
        ctx.textAlign = 'left';
        ctx.font = `800 ${titleSize}px ${FAMILY}`;
        ctx.fillStyle = this.ui.title;
        for (const line of wrapText(ctx, project.title, inner, 2)) {
            ctx.fillText(line, pad, cursor);
            cursor += titleSize * 1.28;
        }
        cursor += h * 0.028;

        const bodySize = Math.max(MIN_BODY, w * FONT_BODY);
        ctx.font = `400 ${bodySize}px ${FAMILY}`;
        ctx.fillStyle = this.ui.body;
        for (const line of wrapText(ctx, project.desc, inner, 6)) {
            ctx.fillText(line, pad, cursor);
            cursor += bodySize * 1.7;
        }

        const footSize = Math.max(MIN_FOOT, w * FONT_FOOT);
        const tagSize = Math.max(MIN_TAG, w * FONT_TAG);
        const chipH = tagSize * 2.1;
        const tagsY = h - pad - footSize * 1.9 - chipH;

        const signSize = footSize;
        const signY = tagsY - signSize * 3.1;
        if (signY > cursor) {
            ctx.textAlign = 'right';
            ctx.font = `400 ${signSize}px ${FAMILY}`;
            ctx.fillStyle = this.ui.muted;
            ctx.fillText('Hyeonseo Lee', w - pad, signY + signSize * 0.5);

            ctx.beginPath();
            ctx.moveTo(w - pad - signSize * 6, Math.round(signY) + 0.5);
            ctx.lineTo(w - pad, Math.round(signY) + 0.5);
            ctx.strokeStyle = this.ui.border;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.textAlign = 'left';
        }

        ctx.font = `600 ${tagSize}px ${FAMILY}`;
        let chipX = pad;
        for (const tag of project.tags || []) {
            const chipW = ctx.measureText(tag).width + tagSize * 1.5;
            if (chipX + chipW > w - pad) break;

            roundRect(ctx, chipX, tagsY, chipW, chipH, chipH / 2);
            ctx.fillStyle = rgba(accent, 0.16);
            ctx.fill();

            ctx.fillStyle = accent;
            ctx.textBaseline = 'middle';
            ctx.fillText(tag, chipX + tagSize * 0.75, tagsY + chipH / 2 + 0.5);
            ctx.textBaseline = 'top';

            chipX += chipW + tagSize * 0.5;
        }

        const linkText = 'View Project  →';
        ctx.font = `700 ${footSize}px ${FAMILY}`;
        ctx.fillStyle = accent;
        ctx.fillText(linkText, pad, h - pad - footSize);

        ctx.restore();
    }

    /* 호버·확대 카드: 강조 테두리·닫기 버튼까지 매 프레임 정밀하게 그린다 */
    drawCardLive(ctx, i, b, project, emphasis) {
        const accent = this.accents[i] || this.ui.border;
        /* 카드 중심으로 옮겨 기울인 뒤, 내용은 카드 기준 좌표로 그린다 */
        const x = -b.w / 2;
        const y = -b.h / 2;
        const pad = b.w * PAD;
        const inner = b.w - pad * 2;
        const radius = b.w * 0.03;

        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        /* 종이 — 모바일에서는 그림자 블러를 줄여 스와이프 부담을 던다 */
        const blurScale = this.narrow ? 0.55 : 1;
        ctx.shadowColor = this.ui.shadow;
        ctx.shadowBlur = b.w * (0.09 + this.lift[i] * 0.06) * blurScale;
        ctx.shadowOffsetY = b.w * (0.02 + this.lift[i] * 0.03) * blurScale;
        roundRect(ctx, x, y, b.w, b.h, radius);
        ctx.fillStyle = this.ui.paper;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        /* 왼쪽 가장자리에 프로젝트 색 띠 */
        ctx.save();
        roundRect(ctx, x, y, b.w, b.h, radius);
        ctx.clip();
        ctx.fillStyle = accent;
        ctx.fillRect(x, y, b.w * 0.018, b.h);
        ctx.restore();

        /* 테두리 — 호버 중이면 프로젝트 색으로 */
        roundRect(ctx, x, y, b.w, b.h, radius);
        ctx.strokeStyle = emphasis > 0.02 ? accent : this.ui.border;
        ctx.lineWidth = 1 + emphasis * 1.4;
        ctx.stroke();

        /* 종이 밖으로 글자가 새지 않게 */
        ctx.save();
        roundRect(ctx, x, y, b.w, b.h, radius);
        ctx.clip();

        let cursor = y + pad;

        /* 레터헤드: 왼쪽 발신인, 오른쪽 문서번호 */
        const headSize = Math.max(MIN_HEAD, b.w * FONT_HEAD);
        ctx.font = `600 ${headSize}px ${FAMILY}`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = this.ui.muted;
        ctx.textAlign = 'left';
        ctx.fillText('LHS © 2026', x + pad, cursor);
        ctx.textAlign = 'right';
        ctx.fillStyle = accent;
        ctx.fillText(`No. ${String(i + 1).padStart(2, '0')}`, x + b.w - pad, cursor);
        cursor += headSize * 1.6;

        /* 구분선 */
        ctx.beginPath();
        ctx.moveTo(x + pad, Math.round(cursor) + 0.5);
        ctx.lineTo(x + b.w - pad, Math.round(cursor) + 0.5);
        ctx.strokeStyle = rgba(accent, 0.55);
        ctx.lineWidth = 1;
        ctx.stroke();
        cursor += b.h * 0.07;

        /* 제목 */
        const titleSize = Math.max(MIN_TITLE, b.w * FONT_TITLE);
        ctx.textAlign = 'left';
        ctx.font = `800 ${titleSize}px ${FAMILY}`;
        ctx.fillStyle = this.ui.title;
        for (const line of wrapText(ctx, project.title, inner, 2)) {
            ctx.fillText(line, x + pad, cursor);
            cursor += titleSize * 1.28;
        }
        cursor += b.h * 0.028;

        /* 본문 */
        const bodySize = Math.max(MIN_BODY, b.w * FONT_BODY);
        ctx.font = `400 ${bodySize}px ${FAMILY}`;
        ctx.fillStyle = this.ui.body;
        for (const line of wrapText(ctx, project.desc, inner, 6)) {
            ctx.fillText(line, x + pad, cursor);
            cursor += bodySize * 1.7;
        }

        /* 태그 칩 — 종이 아래쪽에 고정 */
        const footSize = Math.max(MIN_FOOT, b.w * FONT_FOOT);
        const tagSize = Math.max(MIN_TAG, b.w * FONT_TAG);
        const chipH = tagSize * 2.1;
        const tagsY = y + b.h - pad - footSize * 1.9 - chipH;

        /* 서명란 */
        const signSize = footSize;
        const signY = tagsY - signSize * 3.1;
        if (signY > cursor) {
            ctx.textAlign = 'right';
            ctx.font = `400 ${signSize}px ${FAMILY}`;
            ctx.fillStyle = this.ui.muted;
            ctx.fillText('Hyeonseo Lee', x + b.w - pad, signY + signSize * 0.5);

            ctx.beginPath();
            ctx.moveTo(x + b.w - pad - signSize * 6, Math.round(signY) + 0.5);
            ctx.lineTo(x + b.w - pad, Math.round(signY) + 0.5);
            ctx.strokeStyle = this.ui.border;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.textAlign = 'left';
        }

        ctx.font = `600 ${tagSize}px ${FAMILY}`;
        let chipX = x + pad;
        for (const tag of project.tags || []) {
            const chipW = ctx.measureText(tag).width + tagSize * 1.5;
            if (chipX + chipW > x + b.w - pad) break;

            roundRect(ctx, chipX, tagsY, chipW, chipH, chipH / 2);
            ctx.fillStyle = rgba(accent, 0.16);
            ctx.fill();

            ctx.fillStyle = accent;
            ctx.textBaseline = 'middle';
            ctx.fillText(tag, chipX + tagSize * 0.75, tagsY + chipH / 2 + 0.5);
            ctx.textBaseline = 'top';

            chipX += chipW + tagSize * 0.5;
        }

        /* 맨 아래 안내 — 확대 상태에서는 실제로 누를 수 있는 링크가 된다 */
        const linkText = 'View Project  →';
        const linkX = x + pad;
        const linkY = y + b.h - pad - footSize;
        ctx.font = `700 ${footSize}px ${FAMILY}`;
        ctx.fillStyle = accent;
        ctx.fillText(linkText, linkX, linkY);
        const linkW = ctx.measureText(linkText).width;

        ctx.restore();

        /* 확대된 카드: 레터 오른쪽 위 끝자락에 걸치는 닫기 버튼 */
        if (i === this.focusIndex && this.focusT > 0.02) {
            const size = footSize * 2.1;
            const r = size / 2;
            /* 종이의 오른쪽 끝에 반쯤 걸친다 */
            let ccx = x + b.w;
            const ccy = y + size * 0.55;

            /* 좁은 화면에서 버튼이 스테이지 밖으로 잘리지 않게 안쪽으로 물린다 */
            const overflow = (b.x + ccx + r) - (this.stageWidth - 4);
            if (overflow > 0) ccx -= overflow;

            ctx.globalAlpha = b.alpha * this.focusT;

            ctx.shadowColor = this.ui.shadow;
            ctx.shadowBlur = size * 0.35;
            ctx.beginPath();
            ctx.arc(ccx, ccy, r, 0, Math.PI * 2);
            ctx.fillStyle = this.ui.paper;
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.arc(ccx, ccy, r, 0, Math.PI * 2);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            /* 가위표 */
            const arm = size * 0.19;
            ctx.beginPath();
            ctx.moveTo(ccx - arm, ccy - arm);
            ctx.lineTo(ccx + arm, ccy + arm);
            ctx.moveTo(ccx + arm, ccy - arm);
            ctx.lineTo(ccx - arm, ccy + arm);
            ctx.strokeStyle = accent;
            ctx.lineWidth = Math.max(1.4, size * 0.07);
            ctx.lineCap = 'round';
            ctx.stroke();

            /* 카드가 똑바로 섰을 때만 유효한 스테이지 좌표 */
            this.regions = {
                close: { cx: b.x + ccx, cy: b.y + ccy, r },
                link: {
                    x: b.x + linkX,
                    y: b.y + linkY - footSize * 0.35,
                    w: linkW,
                    h: footSize * 1.7,
                },
                card: { x: b.x, y: b.y, w: b.w, h: b.h },
            };
        }

        ctx.restore();
    }
}
