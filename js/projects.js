import { LetterStage } from "./letter-stage.js";
import { PROJECTS } from "./projects-data.js";

/*
 * 스터디 & 프로젝트 — 레터헤드 카드 캐러셀.
 * 드래그로 밀고 카드를 클릭해 프로젝트를 연다.
 * 손을 떼면 관성으로 미끄러지고, 멎으면 아주 천천히 혼자 흐른다.
 */
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("projects-canvas");
    if (!canvas) return;

    new LetterStage(canvas, {
        items: PROJECTS,
        friction: 0.94,
        /* 양수면 카드가 왼쪽으로 흐른다. 카드 한 장이 지나가는 데 약 25초 */
        autoSpin: 0.00066,
    });
});
