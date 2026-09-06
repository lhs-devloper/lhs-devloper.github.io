/*
 * 프로젝트 추가: 이 배열에 객체를 추가하면
 * 스터디 & 프로젝트 휠에 자동 반영됩니다.
 */
export const PROJECTS = [
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
