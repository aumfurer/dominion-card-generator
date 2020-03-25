const version = "Alakazam";

document.getElementsByClassName("heading-credits")[0].innerHTML = version;


const italicSubstrings = ["[i]", "Heirloom: ", "Erbstück: ", "This is not in the supply.", "Keep this until Clean-up."];
const iconReplacedWithSpaces = "     ";

const icons = { //the names should match the image filenames (plus a .png extension).
    "@": ["Debt", "white", "Treasure"],
    "\\^": ["Potion", "white", "Treasure"],
    "%": ["VP", "white", "Victory"],
    "#": ["VP-Token", "white", "Victory"], //German VP Token (not a nice decision of ASS Altenburger, but maybe nice to have to keep the cards consistent)
    "\\$": ["Coin", "black", "Treasure"],
    // "§": ["Custom Icon", "white", "Treasure"]
};

const iconList = "[" + Object.keys(icons).join("") + "]";
let iconWithNumbersPattern = "[-+]?(" + iconList + ")([\\d\\?]*[-+\\*]?)";
const iconWithNumbersPatternSingle = RegExp("^([-+]?\\d+)?" + iconWithNumbersPattern + "(\\S*)$");
iconWithNumbersPattern = RegExp(iconWithNumbersPattern, "g");
const iconAddingNumber = RegExp("\\+(" + iconList + ")\\d+");


class Painter {

    constructor(context, boldLinePatternWords, images, numberFirstIcon, shadowDistance) {
        this.context = context;
        this.boldLinePatternWords = boldLinePatternWords;
        this.images = images;
        this.numberFirstIcon = numberFirstIcon;
        this.shadowDistance = shadowDistance
    }

    getIconListing(icon) {
        return icons[icon] || icons["\\" + icon];
    }

    writeLineWithIconsReplacedWithSpaces(line, x, y, scale, family, boldSize) {
        boldSize = boldSize || 64;
        this.context.textAlign = "left";

        if (italicSubstrings.some(substring => line.includes(substring))) {
            this.context.font = "italic " + this.context.font;
            if (line.includes("[i]")) {
                line = line.split("[i]").join("");
                x += boldSize * scale;
            }
        } else {
            this.context.font = this.context.font.replace("italic ", "");
        }

        var words = line.split(" ");
        for (var i = 0; i < words.length; ++i) {
            var word = words[i];
            this.context.save();
            while (word) {
                var match = word.match(iconWithNumbersPatternSingle);
                if (match) {
                    var familyOriginal = family;
                    family = "Minion";
                    var localY = y;
                    var localScale = scale;
                    if (words.length === 1 && !word.match(iconAddingNumber)) {
                        localY += 115 - scale * 48;
                        this.context.font = "bold 192pt " + family;
                        localScale = 1.6;
                        if (templateSize === 3) {
                            this.context.font = "bold 222pt " + family;
                            if (word.includes('$')) { // Treasure Base cards
                                localScale = localScale * 2;
                            } else {
                                localScale = localScale * 1.5;
                            }
                        } else {
                            x = x + 48 * scale;
                        }
                    }
                    var halfWidthOfSpaces = this.context.measureText(iconReplacedWithSpaces).width / 2 + 2;

                    var image = false;
                    var iconKeys = Object.keys(icons);
                    for (var j = 0; j < iconKeys.length; ++j) {
                        if (iconKeys[j].replace("\\", "") === match[2]) {
                            image = this.images[this.numberFirstIcon + j];
                            break;
                        }
                    }

                    this.context.save();
                    if (!match[1] && (match[0].charAt(0) === '+' || match[0].charAt(0) === '-')) {
                        match[1] = match[0].charAt(0);
                    }
                    if (match[1]) {
                        if (this.context.font[0] !== "b")
                            this.context.font = "bold " + this.context.font;
                        this.context.fillText(match[1], x, localY);
                        x += this.context.measureText(match[1]).width + 10 * localScale;
                    }

                    x += halfWidthOfSpaces;

                    this.context.translate(x, localY);
                    this.context.scale(localScale, localScale);
                    if (image && image.height) { //exists
                        //this.context.shadowColor = "#000";
                        this.context.shadowBlur = 25;
                        this.context.shadowOffsetX = localScale * this.shadowDistance;
                        this.context.shadowOffsetY = localScale * this.shadowDistance;
                        this.context.drawImage(image, image.width / -2, image.height / -2);
                        this.context.shadowColor = "transparent";
                    } //else... well, that's pretty weird, but so it goes.
                    if (match[3]) { //text in front of image
                        this.context.textAlign = "center";
                        this.context.fillStyle = this.getIconListing(match[2])[1];
                        let cost = match[3];
                        let bigNumberScale = 1;
                        let nx = localScale > 1.4 ? 0 : -5 * localScale ^ 2;
                        let ny = localScale > 1 ? 6 * localScale : localScale > 0.7 ? 12 * localScale : localScale > 0.5 ? 24 * localScale : 48 * localScale;
                        if (localScale > 3) {
                            bigNumberScale = 0.8;
                            ny -= (115 * 0.2) / 2;
                        }
                        if (cost.length >= 2) {
                            // special handling for overpay and variable costs
                            let specialCost = cost.slice(-1);
                            let specialCostSize = 45;
                            let syShift = 0;
                            if (specialCost === '*') {
                                //specialCost = '✱';
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
                                this.context.font = "bold " + specialCostSize + "pt " + family;
                                let sx = localScale > 1 ? 45 / 2 * localScale : 45 * localScale;
                                let sy = localScale > 1 ? -20 * localScale : 12 * localScale - 35 * localScale;
                                if (cost.length >= 3) {
                                    nx -= specialCostSize / 3;
                                    sx += specialCostSize / 3;
                                }
                                sy += syShift * localScale;
                                this.context.fillText(specialCost, sx, sy);
                            }
                        }
                        this.context.font = "bold " + 115 * bigNumberScale + "pt " + family;
                        this.context.fillText(cost, nx, ny);
                        //this.context.strokeText(match[3], 0, 0);
                    }
                    this.context.restore();
                    family = familyOriginal;

                    x += halfWidthOfSpaces;
                    word = match[4];
                } else {
                    if (word.match(this.boldLinePatternWords)) {
                        if (words.length === 1)
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
        }
    }


}