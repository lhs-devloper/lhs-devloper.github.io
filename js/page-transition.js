/*
 * 프로젝트로 넘어갈 때의 연출.
 * 확대된 레터가 책처럼 펼쳐지고, 드러난 속지 안으로 화면이 빨려들어간 뒤 이동한다.
 * 도착한 페이지는 같은 색 판이 계속 다가오듯 커지며 걷힌다 (js/page-enter.js).
 */

/* 도착 페이지에 넘겨줄 색 */
const COLOR_KEY = 'lhs:page-transition-color';
/* 책장 색. 이 색으로 화면이 덮이고, 도착 페이지도 이 색에서 걷힌다 */
const PAGE_COLOR = '#ffffff';

/* 표지가 열리기 시작한 뒤 줌이 따라붙는 시점 */
const ZOOM_DELAY = 430;
/* 줌이 끝나고 실제로 이동하기까지 */
const TRAVEL = 1020;

let cover = null;

function build() {
    if (cover) return cover;

    cover = document.createElement('div');
    cover.className = 'page-cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.innerHTML =
        '<div class="page-cover-book">' +
        '<div class="page-cover-inside"></div>' +
        '<div class="page-cover-leaf">' +
        '<div class="page-cover-face is-back"></div>' +
        '<div class="page-cover-face is-front"><span class="page-cover-title"></span></div>' +
        '</div>' +
        '</div>';

    document.body.appendChild(cover);
    return cover;
}

/* 뒤로가기로 되돌아왔을 때 덮개가 화면을 가린 채 남지 않도록 */
export function resetCover() {
    if (!cover) return;
    cover.classList.remove('is-open', 'is-unfolding');
    cover.style.backgroundColor = '';
    const book = cover.querySelector('.page-cover-book');
    book.style.transform = '';
}

/*
 * card: 확대된 카드의 뷰포트 기준 위치·크기와 색
 *       { x, y, w, h, radius, accent, paper, title, titleColor, link }
 */
export function openAndGo(card) {
    if (!card || !card.link) return;

    const go = () => { window.location.href = card.link; };

    /* 도착 페이지가 같은 색으로 이어받도록 넘겨둔다 */
    try {
        sessionStorage.setItem(COLOR_KEY, PAGE_COLOR);
    } catch (e) {
        /* sessionStorage가 막혀 있어도 연출만 못 이을 뿐이라 그냥 진행한다 */
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        go();
        return;
    }

    const el = build();
    const book = el.querySelector('.page-cover-book');

    el.style.setProperty('--cover-accent', card.accent);
    el.style.setProperty('--cover-paper', card.paper);
    el.style.setProperty('--cover-title', card.titleColor);
    el.style.setProperty('--cover-radius', card.radius + 'px');
    el.style.setProperty('--cover-font', Math.round(card.w * 0.085) + 'px');
    el.querySelector('.page-cover-title').textContent = card.title;

    book.style.left = card.x + 'px';
    book.style.top = card.y + 'px';
    book.style.width = card.w + 'px';
    book.style.height = card.h + 'px';
    book.style.transform = '';

    el.classList.add('is-open');

    /* 위치를 먼저 반영시킨 다음 표지를 연다 */
    void el.offsetWidth;
    el.classList.add('is-unfolding');

    /* 속지가 화면을 덮을 만큼 키우고, 카드 중심을 화면 한가운데로 옮긴다 */
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.max(vw / card.w, vh / card.h) * 1.4;
    const dx = vw / 2 - (card.x + card.w / 2);
    const dy = vh / 2 - (card.y + card.h / 2);

    setTimeout(() => {
        book.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        /* 주변 포트폴리오도 책장 색으로 잠기게 한다 */
        el.style.backgroundColor = PAGE_COLOR;
    }, ZOOM_DELAY);

    setTimeout(go, TRAVEL);
}

window.addEventListener('pageshow', resetCover);
