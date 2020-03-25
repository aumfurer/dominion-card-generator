const version = "Camerupt.3";

document.getElementsByClassName("heading-credits")[0].innerHTML = version;


const italicSubstrings = ["[i]", "Heirloom: ", "Erbstück: ", "This is not in the supply.", "Keep this until Clean-up."];
const iconReplacedWithSpaces = "     ";

const icons = { //the names should match the image filenames (plus a .png extension).
    "@": ["Debt", "white", "Treasure"],
    "^": ["Potion", "white", "Treasure"], // No problem inside [] if not first
    "%": ["VP", "white", "Victory"],
    "#": ["VP-Token", "white", "Victory"], //German VP Token (not a nice decision of ASS Altenburger, but maybe nice to have to keep the cards consistent)
    "$": ["Coin", "black", "Treasure"], // No problem inside []
    "§": ["Custom Icon", "white", "Treasure"]
};

const iconList = "[" + Object.keys(icons).join("") + "]";
const iconWithNumbersPatternStr = "[-+]?(" + iconList + ")([\\d\\?]*[-+\\*]?)";
const iconWithNumbersPatternSingle = RegExp("^([-+]?\\d+)?" + iconWithNumbersPatternStr + "(\\S*)$");
const iconWithNumbersPattern = RegExp(iconWithNumbersPatternStr, "g");
const iconAddingNumber = RegExp("\\+(" + iconList + ")\\d+");


class Painter {

    /**
     *
     * @param context {CanvasRenderingContext2D}
     * @param boldLinePatternWords
     * @param images
     * @param numberFirstIcon
     * @param shadowDistance
     */
    constructor(context, boldLinePatternWords, images, numberFirstIcon, shadowDistance) {
        this.context = context;
        this.boldLinePatternWords = boldLinePatternWords;
        this.images = images;
        this.numberFirstIcon = numberFirstIcon;
        this.shadowDistance = shadowDistance
    }

    setFontAttr(attr, value){
        this.context.font =
            !value ?
                this.context.font.replace(attr + ' ', '') :
                this.context.font.includes(attr + ' ') ?
                    this.context.font:
                    attr + ' ' + this.context.font;
    }

    drawIconSingle(y, scale, isSingleLine, x, match) {
        let [word, frontValue, icon, cost, _] = match;
        if (isSingleLine && !word.match(iconAddingNumber)) {
            y += 115 - scale * 48;
            if (templateSize === 3) {
                this.context.font = "bold 222pt Minion";
                scale = word.includes('$') ? 3.2 : 2.4;
            } else {
                x += 48 * scale;
                this.context.font = "bold 192pt Minion";
                scale = 1.6;
            }
        }
        const halfWidthOfSpaces = this.context.measureText(iconReplacedWithSpaces).width / 2 + 2;

        const iconIndex = Object.keys(icons).indexOf(icon);
        const image = iconIndex !== -1 && this.images[this.numberFirstIcon + iconIndex];

        this.context.save();
        if (!frontValue && (word.charAt(0) === '+' || word.charAt(0) === '-')) {
            frontValue = word.charAt(0);
        }
        if (frontValue) {
            this.setFontAttr('bold', true);
            this.context.fillText(frontValue, x, y);
            x += this.context.measureText(frontValue).width + 10 * scale;
        }

        x += halfWidthOfSpaces;

        this.context.translate(x, y);
        this.context.scale(scale, scale);
        if (image && image.height) { //exists
            this.context.shadowBlur = 25;
            this.context.shadowOffsetX = scale * this.shadowDistance;
            this.context.shadowOffsetY = scale * this.shadowDistance;
            this.context.drawImage(image, image.width / -2, image.height / -2);
            this.context.shadowColor = "transparent";
        } //else... well, that's pretty weird, but so it goes.
        if (cost) { //text in front of image
            this.context.textAlign = "center";
            this.context.fillStyle = icons[icon][1];
            let bigNumberScale = 1;
            let nx = scale > 1.4 ? 0 : -5 * scale ^ 2;
            let ny = scale > 1 ? 6 * scale : scale > 0.7 ? 12 * scale : scale > 0.5 ? 24 * scale : 48 * scale;
            if (scale > 3) {
                bigNumberScale = 0.8;
                ny -= (115 * 0.2) / 2;
            }
            if (cost.length >= 2) {
                // special handling for overpay and variable costs
                let specialCost = cost.slice(-1);
                let specialCostSize = 45;
                let syShift = 0;
                if (specialCost === '*') {
                    specialCostSize = 65;
                    syShift = 10;
                    if (cost.length > 2) {
                        bigNumberScale = 1.5 / (cost.length - 1);
                    }
                } else if (specialCost === '+') {
                    specialCost = '✚';
                    specialCostSize = 40;
                    if (cost.length > 2) {
                        bigNumberScale = 1.5 / (cost.length - 1);
                    }
                } else {
                    specialCost = null;
                    bigNumberScale = 1.5 / cost.length;
                }
                if (specialCost != null) {
                    cost = cost.slice(0, -1) + " ";
                    this.context.font = "bold " + specialCostSize + "pt Minion";
                    let sx = scale > 1 ? 45 / 2 * scale : 45 * scale;
                    let sy = scale > 1 ? -20 * scale : 12 * scale - 35 * scale;
                    if (cost.length >= 3) {
                        nx -= specialCostSize / 3;
                        sx += specialCostSize / 3;
                    }
                    sy += syShift * scale;
                    this.context.fillText(specialCost, sx, sy);
                }
            }
            this.context.font = "bold " + 115 * bigNumberScale + "pt Minion";
            this.context.fillText(cost, nx, ny);
            //this.context.strokeText(match[3], 0, 0);
        }
        this.context.restore();

        x += halfWidthOfSpaces;

        return x;
    }

    writeLineWithIconsReplacedWithSpaces(line, x, y, scale, family, boldSize) {
        boldSize = boldSize || 64;
        this.context.textAlign = "left";

        const isItalic = italicSubstrings.some(substring => line.includes(substring));
        this.setFontAttr('italic', isItalic);

        if (line.includes("[i]")) {
            line = line.split("[i]").join("");
            x += boldSize * scale;
        }

        const isSingleWord = !line.includes(" ");

        line.split(" ").forEach( word => {
            this.context.save();
            while (word) {
                const match = word.match(iconWithNumbersPatternSingle);
                if (match) {
                    x = this.drawIconSingle(y, scale, isSingleWord, x, match);
                    word = match[4];
                } else {
                    if (word.match(this.boldLinePatternWords)) {
                        if (isSingleWord)
                            this.context.font = "bold " + boldSize + "pt " + family;
                        else
                            this.context.font = "bold " + this.context.font;
                    }
                    if (this.context.font.includes('bold')) {
                        let lastChar = word.substr(word.length - 1);
                        if ([",", ";", ".", "?", "!", ":"].includes(lastChar)) {
                            word = word.slice(0, -1);
                        } else {
                            lastChar = "";
                        }
                        this.context.fillText(word, x, y);

                        if (lastChar !== "") {
                            var x2 = this.context.measureText(word).width;
                            this.context.font = this.context.font.replace('bold ', '');
                            this.context.fillText(lastChar, x + x2, y);
                            this.context.font = "bold " + this.context.font;
                        }

                        word = word + lastChar;
                    } else {
                        this.context.fillText(word, x, y);
                    }

                    break; //don't start this again
                }
            }
            x += this.context.measureText(word + " ").width;
            this.context.restore();
        })
    }
}