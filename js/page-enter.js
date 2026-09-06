/*
 * 프로젝트 페이지 진입 연출.
 * 포트폴리오에서 넘어온 경우에만, 덮고 있던 색과 같은 판이 걷히며 페이지가 드러난다.
 * 주소를 직접 열었을 때는 아무 일도 하지 않는다.
 *
 * <head> 안에서 body보다 먼저 실행되어야 판이 깜빡이지 않는다.
 */
(() => {
    const KEY = 'lhs:page-transition-color';

    let color = null;
    try {
        color = sessionStorage.getItem(KEY);
        sessionStorage.removeItem(KEY);
    } catch (e) {
        /* 시크릿 모드 등에서 sessionStorage가 막혀 있으면 그냥 넘어간다 */
    }

    if (!color) return;

    const root = document.documentElement;
    root.style.setProperty('--page-enter-bg', color);
    root.classList.add('page-enter');
})();
