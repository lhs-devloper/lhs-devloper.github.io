const quotes = [
    {
        "quote": "삶이 있는 한 희망은 있다",
        "author": "키케로"
    },
    {
        "quote": "산다는것 그것은 치열한 전투이다",
        "author": "로망로랑"
    },
    {
        "quote": "하루에 3시간을 걸으면 7년 후에 지구를 한바퀴 돌 수 있다",
        "author": "사무엘존슨"
    },
    {
        "quote": "단순하게 살아라. 현대인은 쓸데없는 절차와 일 때문에 얼마나 복잡한 삶을 살아가는가?",
        "author": "이드리스 샤흐"
    },
    {
        "quote": "먼저 자신을 비웃어라. 다른 사람이 당신을 비웃기 전에",
        "author": "엘사 맥스웰"
    },
    {
        "quote": "절대 어제를 후회하지 마라. 인생은 오늘의  내 안에 있고 내일은 스스로 만드는것이다",
        "author": "L론허바드"
    },
    {
        "quote": "절대 포기하지 말라. 당신이 되고 싶은 무언가가 있다면, 그에 대해 자부심을 가져라. 당신 자신에게 기회를 주어라. 스스로가 형편없다고 생각하지 말라. 그래봐야 아무 것도 얻을 것이 없다. 목표를 높이 세워라.인생은 그렇게 살아야 한다",
        "author": "마이크 맥라렌"
    },
    {
        "quote": "흔히 사람들은 기회를 기다리고 있지만 기회는 기다리는 사람에게 잡히지 않는 법이다. 우리는 기회를 기다리는 사람이 되기 전에 기회를 얻을 수 있는 실력을 갖춰야 한다. 일에 더 열중하는 사람이 되어야한다",
        "author": "안창호"
    },
    {
        "quote": "재산을 잃은 사람은 많이 잃은 것이고, 친구를 잃은 사람은 더많이 잃은 것이며, 용기를 잃은 사람은 모든것을 잃은 것이다",
        "author": "세르반테스"
    },
    {
        "quote": "자신의 본성이 어떤것이든 그에 충실하라 . 자신이 가진 재능의 끈을 놓아 버리지 마라. 본성이 이끄는 대로 따르면 성공할것이다",
        "author": "시드니 스미스"
    },
]
const quote = document.querySelector("#quote span:first-child");
const author = document.querySelector("#quote span:last-child");

const todaysQuote = quotes[Math.floor(Math.random() * quotes.length)]

quote.innerText = todaysQuote.quote
author.innerText = `저자: ${todaysQuote.author}`
