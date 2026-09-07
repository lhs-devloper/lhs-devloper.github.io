import { Quiz } from "./quiz.js";

const $ = (id) => document.getElementById(id);

const screens = {
    start: $("screen-start"),
    quiz: $("screen-quiz"),
    result: $("screen-result"),
};

function show(name) {
    for (const [key, el] of Object.entries(screens)) {
        el.classList.toggle("is-hidden", key !== name);
    }
}

const img = $("random_img");
const answer = $("answer");
const nowEl = $("now");
const scoreEl = $("score");
const timerEl = $("timer");
const timerBar = $("timerbar");

const quiz = new Quiz({
    imgElement: img,
    onProgress: (now, count, correct) => {
        nowEl.textContent = `${now} / ${count}`;
        scoreEl.textContent = correct;
    },
    onQuestion: () => {
        answer.value = "";
        answer.focus();
    },
    onTick: (time, ratio) => {
        timerEl.textContent = Math.max(0, time);
        timerBar.style.width = `${ratio * 100}%`;
        timerBar.classList.toggle("is-low", time <= 3);
    },
    onFinish: (results, correct, count) => renderResult(results, correct, count),
});

/* 시작 화면 규칙 문구를 실제 값으로 채운다 */
$("rule-count").textContent = quiz.count;
$("rule-time").textContent = quiz.seconds;
$("result-total").textContent = quiz.count;
nowEl.textContent = `0 / ${quiz.count}`;

function submit() {
    quiz.Submit(answer.value);
}

/* ── 화면 전환 ── */
$("start").addEventListener("click", () => {
    show("quiz");
    quiz.Start();
});

$("retry").addEventListener("click", () => {
    show("start");
});

$("reset").addEventListener("click", () => {
    quiz.Stop();
    show("start");
});

/* ── 답 제출 ── */
$("next").addEventListener("click", submit);
$("skip").addEventListener("click", () => quiz.Skip());

/*
 * 한글(IME) 입력에서 Enter 처리.
 * 조합을 확정하는 Enter는 곧바로 제출하지 않고, 조합이 끝난 직후 제출한다.
 * (event.isComposing 을 써서 이중 제출을 막는다)
 */
let pendingSubmit = false;
answer.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (event.isComposing) {
        pendingSubmit = true;
    } else {
        submit();
    }
});
answer.addEventListener("compositionend", () => {
    if (pendingSubmit) {
        pendingSubmit = false;
        submit();
    }
});

/* ── 결과 화면 렌더 ── */
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}

function renderResult(results, correct, count) {
    $("result-score").textContent = correct;
    $("result-total").textContent = count;

    const pct = count ? Math.round((correct / count) * 100) : 0;
    $("result-msg").textContent = `${count}문제 중 ${correct}개 정답 (${pct}%)`;

    const list = $("result-list");
    list.innerHTML = "";
    results.forEach((r, i) => {
        const item = document.createElement("div");
        item.className = `result-item ${r.correct ? "is-correct" : "is-wrong"}`;

        const yours = r.timedOut ? "시간초과" : (r.answer || "통과");
        item.innerHTML = `
            <span class="ri-no">${i + 1}</span>
            <img class="ri-thumb" src="${escapeHtml(r.img)}" alt="${escapeHtml(r.name)}" loading="lazy">
            <div class="ri-body">
                <span class="ri-name">${escapeHtml(r.name)}</span>
                <span class="ri-your">내 답 : ${escapeHtml(yours)}</span>
            </div>
            <span class="ri-mark">${r.correct ? "O" : "X"}</span>`;
        list.appendChild(item);
    });

    show("result");
}

show("start");
