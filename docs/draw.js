const version = "Inkay";

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
const iconWithNumbersPatternStr = "(" + iconList + ")([\\d?]*)([+*]?)";
const iconWithNumbersPatternSingle = RegExp("^([-+]?\\d*)" + iconWithNumbersPatternStr + "(\\S*)$");
const iconWithNumbersPattern = RegExp("[-+]?" + iconWithNumbersPatternStr, "g");
const iconAddingNumber = RegExp("\\+(" + iconList + ")\\d+");

const boldableKeywords = [ //case-insensitive
    "card", "cards",
    "buy", "buys",
    "action", "actions",
    "coffer", "coffers",
    "villager", "villagers",

    "aktion", "aktionen",
    "karte", "karten",
    "kauf", "käufe",
    "dorfbewohner",
    "münze", "münzen"
];


class Painter {

    /**
     *
     * @param context {CanvasRenderingContext2D}
     * @param boldWordsExtra {String []}
     * @param images {Image []}
     * @param numberFirstIcon {number}
     * @param picture {{image: Image, x: number, y: number, zoom: number}}
     * @param fields {{creator: string, credit: string}}
     */
    constructor(
        context,
        boldWordsExtra,
        images,
        numberFirstIcon,
        picture,
        fields
    ) {
        this.context = context;
        this.boldLinePatternWords = this.buildBoldLinePatternWords(boldWordsExtra);
        this.images = images;
        this.numberFirstIcon = numberFirstIcon;
        this.picture = picture;
        this.fields = fields;
        this.shadowDistance = 10
    }

    buildBoldLinePatternWords(boldWordsExtra) {
        let boldKeywordsFull = boldableKeywords.concat(boldWordsExtra);
        return  RegExp("([-+]\\d+)\\s+(" + boldKeywordsFull.join("|") + ")", "ig");
    }

    savingContext(callback){
        this.context.save();
        callback();
        this.context.restore();
    }

    setFontAttr(attr, value) {
        this.context.font =
            !value ?
                this.context.font.replace(attr + ' ', '') :
                this.context.font.includes(attr + ' ') ?
                    this.context.font :
                    attr + ' ' + this.context.font;
    }

    bigIconProps(templateSize, word, scale){
        return {
            dy: 115 - 48 * scale,
            dx: templateSize === 3 ? 0 : 48 * scale,
            scale: templateSize === 3 ?
                (word.includes('$') ? 3.2 : 2.4) :
                1.6,
            font: templateSize === 3 ? "bold 222pt Minion" : "bold 192pt Minion"
        }
    }

    write(word, x, y, space=' '){
        this.context.fillText(word, x, y);
        return this.context.measureText(word + space).width
    }

    drawIconSingle(y, scale, isSingleLine, x, word, frontValue, icon, cost, specialCost) {
        if (isSingleLine && !word.match(iconAddingNumber)) {
            const big = this.bigIconProps(templateSize, word, scale);
            x += big.dx;
            y += big.dy;
            scale = big.scale;
            this.context.font = big.font; // context is changed here without saving, it's ok?
        }
        const halfWidthOfSpaces = this.context.measureText(iconReplacedWithSpaces).width / 2 + 2;

        const iconIndex = Object.keys(icons).indexOf(icon);
        const image = iconIndex !== -1 && this.images[this.numberFirstIcon + iconIndex];

        this.savingContext(() => {
            if (frontValue) {
                this.setFontAttr('bold', true);
                x += this.write(frontValue, x, y, '') + 10 * scale;
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
                if (specialCost.length + cost.length >= 2) {
                    if (cost.length > 1) bigNumberScale = 1.5 / (cost.length);
                    nx = this.drawSpecialCost(specialCost, cost, bigNumberScale, scale, nx);
                    if (specialCost) cost += " ";
                }
                this.context.font = "bold " + 115 * bigNumberScale + "pt Minion";
                this.write(cost, nx, ny);
            }
        });
        x += halfWidthOfSpaces;
        return x;
    }

    drawSpecialCost(specialCost, cost, bigNumberScale, scale, nx) {
        let specialCostSize = 45;
        let syShift = 0;
        if (specialCost === '*') {
            specialCostSize = 65;
            syShift = 10;
        } else if (specialCost === '+') {
            specialCost = '✚'; // XD
            specialCostSize = 40;
        }
        if (specialCost) {
            this.context.font = "bold " + specialCostSize + "pt Minion";
            let sx = scale > 1 ? 45 / 2 * scale : 45 * scale;
            let sy = scale > 1 ? -20 * scale : 12 * scale - 35 * scale;
            if (cost.length >= 2) {
                nx -= specialCostSize / 3;
                sx += specialCostSize / 3;
            }
            sy += syShift * scale;
            this.write(specialCost, sx, sy);
        }
        return nx;
    }

    writeLineWithIcons(line, x, y, scale, family, boldSize=64) {
        this.context.textAlign = "left";

        const isItalic = italicSubstrings.some(substring => line.includes(substring));
        this.setFontAttr('italic', isItalic);

        if (line.includes("[i]")) {
            line = line.split("[i]").join("");
            x += boldSize * scale;
        }

        const isSingleWord = !line.includes(" ");

        line.split(" ").forEach(word => {
            this.savingContext( () => {
                let match = word.match(iconWithNumbersPatternSingle);
                while (match) {
                    x = this.drawIconSingle(y, scale, isSingleWord, x, ...match);
                    word = match[5];
                    match = word.match(iconWithNumbersPatternSingle)
                }
                if (word.match(this.boldLinePatternWords)) { //TODO: can i merge this with next?
                    this.context.font = isSingleWord ?
                        "bold " + boldSize + "pt " + family :
                        "bold " + this.context.font;
                }
                if (this.context.font.includes('bold')) {
                    const lastChar = word.substr(word.length - 1);
                    if ([",", ";", ".", "?", "!", ":"].includes(lastChar)) {
                        x += this.write(word.slice(0, -1), x, y, '');
                        this.setFontAttr('bold', false);
                        x += this.write(lastChar, x, y);
                    } else {
                        x += this.write(word, x, y);
                    }
                } else {
                    x += this.write(word, x, y);
                }
            })
        })
    }

    /**
     * ex - getWidthOfLineWithIconsReplacedWithSpaces
     * @param line {String}
     * @returns {number} width of the line with icons replaced with spaces
     */
    getLineWidth(line) {
        return this.context.measureText(line.replace(iconWithNumbersPattern, iconReplacedWithSpaces)).width;
    }

    writeSingleLine(line, x, y, maxWidth, initialSize=85, family="TrajanPro") {
        let size = initialSize  + 2;
        do {
            this.context.font = (size -= 2) + "pt " + family;
        } while (maxWidth && this.getLineWidth(line) > maxWidth);
        x -= this.getLineWidth(line) / 2;
        this.writeLineWithIcons(line, x, y, size / 90, family)
    }

    withFont(font, callback){
        let properFont = this.context.font;
        this.context.font = font;
        const res = callback();
        this.context.font = properFont;
        return res
    }

    measureFullLine(line, size, boldSize, progressiveWidth) {
        let height;
        if (line === "") //multiple newlines in a row
            height = size * 0.5;
        else if (line === "-") //horizontal bar
            height = size * 0.75;
        else if (line.match(this.boldLinePatternWords) && line.indexOf(" ") < 0) { //important line
            height = boldSize * 1.433;
            const font = "bold " + boldSize + "pt Times New Roman";
            progressiveWidth = this.withFont(font, () => this.context.measureText(line).width)
        } else if (line.match(iconWithNumbersPatternSingle) && !line.match(iconAddingNumber)) {
            height = 275; //192 * 1.433
            const font = "bold 192pt Times New Roman";
            progressiveWidth = this.withFont(font, () => this.getLineWidth(line)); //=, not +=
        } else //regular word
            height = size * 1.433;
        return  {text: line, width: progressiveWidth, height: height};
    }

    textToLinesBySize(size, description, boldSize, maxWidth) {
        let linesBySize = [];
        this.context.font = size + "pt Times New Roman";
        let line = "";
        let progressiveWidth = 0;
        for (let word of description.split(" ")) {
            if (word === "\n") {
                const fullLine = this.measureFullLine(line, size, boldSize, progressiveWidth);
                linesBySize.push(fullLine);
                progressiveWidth = 0;
                line = ""; //start next line empty
            } else if (progressiveWidth + this.getLineWidth(" " + word) > maxWidth) {
                linesBySize.push({text: line + " ", width: progressiveWidth, height: size * 1.433});
                line = word;
                progressiveWidth = this.getLineWidth(word);
            } else {
                const font = (word.match(this.boldLinePatternWords) ? 'bold ' : '') + this.context.font;
                if (line.length)
                    word = " " + word;
                line += word;
                progressiveWidth += this.withFont(font, () => this.getLineWidth(word));
            }
        }
        return linesBySize;
    }

    writeDescription(description, xCenter, yCenter, maxWidth, maxHeight, boldSize) {
        description = description.replace(/ *\n */g, " \n ").replace(this.boldLinePatternWords, "$1\xa0$2") + " \n";
        let lines;
        let overallHeight;
        let size = 64 + 2;

        do { //figure out the best font size, and also decide in advance how wide and tall each individual line is
            size -= 2;
            lines = this.textToLinesBySize(size, description, boldSize, maxWidth);
            overallHeight = lines.reduce((acc, e) => acc + e.height, 0)
        } while (overallHeight > maxHeight && size > 16); //can only shrink so far before giving up

        let y = yCenter - (overallHeight - size * 1.433) / 2;

        for (let line of lines) {
            if (line.text === "-") //horizontal bar
                this.context.fillRect(xCenter / 2, y - size * 0.375 - 5, xCenter, 10);
            else if (line.text.length) {
                const x = xCenter - line.width / 2;
                this.writeLineWithIcons(line.text, x, y, size / 96, "Times New Roman", boldSize);
            }
            y += line.height;
        }
        this.context.fillStyle = "black";
    }

    drawPicture(xCenter, yCenter, width, height) {
        const image = this.picture.image;
        if (image.height) {
            const scale = Math.max(height / image.height, width / image.width);

            let sizeX = image.width * scale * this.picture.zoom;
            let sizeY = image.height * scale * this.picture.zoom;
            let spaceX = sizeX - width;
            let spaceY = sizeY - height;
            let moveX = this.picture.x * spaceX / 2;
            let moveY = this.picture.y * spaceY / 2;

            this.savingContext(()=>{
                this.context.translate(xCenter + moveX, yCenter + moveY);
                this.context.scale(scale * this.picture.zoom, scale * this.picture.zoom);
                this.context.drawImage(image, image.width / -2, image.height / -2);
            })
        }
    }

    removeCorners(width, height, radius) {
        this.context.clearRect(0, 0, radius, radius);
        this.context.clearRect(width - radius, 0, radius, radius);
        this.context.clearRect(0, height - radius, radius, radius);
        this.context.clearRect(width - radius, height - radius, radius, radius);
    }

    writeIllustrationCredit(x, y, color, bold, size = 31) {
        if (this.fields.credit) {
            this.context.font = bold + size + "pt Times New Roman";
            this.context.fillStyle = color;
            this.context.fillText(this.fields.credit, x, y);
        }
    }

    writeCreatorCredit(x, y, color, bold, size = 31) {
        if (this.fields.creator) {
            this.context.textAlign = "right";
            this.context.font = bold + size + "pt Times New Roman";
            this.context.fillStyle = color;
            this.context.fillText(this.fields.creator, x, y);
        }
    }

}