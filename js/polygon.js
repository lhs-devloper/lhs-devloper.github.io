const PI2 = Math.PI * 2;

const COLORS = [
    '#4b45ab',
    '#554fb8',
    '#605ac7',
    '#2a91a8',
    '#2e9ab2',
    '#32a5bf',
    '#81b144',
    '#85b944',
    '#8fc549',
    '#e0af27',
    '#eeba2a',
    '#fec72e',
    '#bf342d',
    '#ca3931',
    '#d7423a',
]

export const COLOR_SETS = [
    // 보라-파랑 계열
    ['#4b45ab','#554fb8','#605ac7','#6e5fd4','#7b6ee0','#8b7ff0','#9b8fff','#ab9fff','#bbb0ff','#ccc2ff','#554fb8','#605ac7','#6e5fd4','#7b6ee0','#8b7ff0'],
    // 민트-그린 계열
    ['#2a91a8','#2e9ab2','#32a5bf','#38b2cc','#40c0d8','#4acee5','#56daf0','#81b144','#85b944','#8fc549','#99d050','#a3db58','#2e9ab2','#32a5bf','#38b2cc'],
    // 오렌지-레드 계열
    ['#e0af27','#eeba2a','#fec72e','#ffd234','#ffdd3a','#bf342d','#ca3931','#d7423a','#e54d45','#f05a52','#ff6b5e','#e0af27','#eeba2a','#bf342d','#ca3931'],
    // 핑크-퍼플 계열
    ['#c850c0','#d65db1','#e466a5','#f06fa0','#ff7eb3','#ff8ec6','#ff9ed9','#a855f7','#b06cf7','#b883f7','#c09af7','#c8b1f7','#c850c0','#d65db1','#e466a5'],
    // 블루-시안 계열
    ['#1a73e8','#2b7de9','#3c87ea','#4d91eb','#5e9bec','#6fa5ed','#80afee','#00bcd4','#1cc3d9','#38cade','#54d1e3','#70d8e8','#1a73e8','#2b7de9','#3c87ea'],
];

export class Polygon{
    constructor(x, y, radius, sides, colors){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.sides = sides;
        this.rotate = 0;
        this.colors = colors || COLORS;
    }

    animate(ctx, moveX){
        ctx.save();

        const angle = PI2 / this.sides;
        const angle2 = PI2 / 4;

        ctx.translate(this.x, this.y)

        this.rotate -= moveX * 0.008;
        ctx.rotate(this.rotate);

        for(let i = 0 ; i < this.sides ; i++){
            const x = this.radius * Math.cos(angle * i);
            const y = this.radius * Math.sin(angle * i);

            ctx.save();
            ctx.fillStyle = this.colors[i % this.colors.length];
            ctx.translate(x, y);
            ctx.rotate(((360 / this.sides) * i + 45) * Math.PI / 180);
            ctx.beginPath();

            for(let j = 0; j < 4; j++){
                const x2 = 160 * Math.cos(angle2 * j);
                const y2 = 160 * Math.sin(angle2 * j);
                (j == 0 ) ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
            }
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }

        ctx.restore();
    }
}
