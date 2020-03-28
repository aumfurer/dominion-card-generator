const version = "Inkay";

document.getElementsByClassName("heading-credits")[0].innerHTML = version;


const italicSubstrings = ["[i]", "Heirloom: ", "Erbstück: ", "This is not in the supply.", "Keep this until Clean-up."];
const iconReplacedWithSpaces = "     ";
const travellerTypesPattern = new RegExp(["Traveller", "Traveler", "Reisender", "Reisende"].join("|"));

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
    "cards?",
    "buys?",
    "actions?",
    "coffers?",
    "villagers?",

    "aktion(?:en)?",
    "karten?",
    "kauf", "käufe",
    "dorfbewohner",
    "münzen?",
];

const COLOR_SAME = -1;
const COLOR_NORMAL = 0;


class Painter {

    /**
     *
     * @param context {CanvasRenderingContext2D}
     * @param boldWordsExtra {String []}
     * @param images {HTMLImageElement []}
     * @param fields {{
     *          creator: string, credit: string, description: string, title: string,
     *          heirloom: string, type: string, price: string, preview: string
     *          description2: string, title2: string, color2split: number,
     *          color1: int, color2: int,
     *          pictureX: number, pictureY: number, pictureZoom: number,
     *          extraBoldKeys: string
     *          }}
     * @param isEachColorDark {boolean[]}
     * @param getRecoloredImage {{function(int,int,int=):HTMLImageElement}}
     */
    constructor(
        context,
        images,
        fields,
        isEachColorDark,
        getRecoloredImage,
    ) {
        this.context = context;
        this.images = images;
        this.fields = fields;
        this.isEachColorDark = isEachColorDark;
        this.getRecoloredImage = getRecoloredImage;

        this.boldLinePatternWords = this.buildBoldLinePatternWords(fields.extraBoldKeys);
        this.extra = {};
        this.numberFirstIcon = -1;
        this.shadowDistance = 10;
    }

    buildBoldLinePatternWords(extraBoldKeys) {
        const extra = extraBoldKeys.split(";").filter(x => x !== "")
        const all = boldableKeywords.concat(extra);
        return  RegExp("([-+]\\d+)\\s+(" + all.join("|") + ")", "ig");
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

    bigIconProps(word, scale){
        return {
            dy: 115 - 48 * scale,
            dx: 48 * scale,
            scale: 1.6,
            font: "bold 192pt Minion"
        }
    }

    write(word, x, y, space=' '){
        this.context.fillText(word, x, y);
        return this.context.measureText(word + space).width
    }

    drawIconSingle(y, scale, isSingleLine, x, word, frontValue, icon, cost, specialCost) {
        if (isSingleLine && !word.match(iconAddingNumber)) {
            const big = this.bigIconProps(word, scale);
            x += big.dx;
            y += big.dy;
            scale = big.scale;
            this.context.font = big.font; // context is changed here without saving, it's ok?
        }
        const halfWidthOfSpaces = this.context.measureText(iconReplacedWithSpaces).width / 2 + 2;

        const image = this.getIcon(icon);

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

    getIcon(icon) {
        if (this.numberFirstIcon === -1){
            const firstIconName = Object.values(icons)[0][0];
            this.numberFirstIcon = this.images
                 .map(x => x.src)
                 .findIndex(x => x.includes('/'+firstIconName+'.'))
        }
        const iconIndex = Object.keys(icons).indexOf(icon);
        return iconIndex !== -1 && this.images[this.numberFirstIcon + iconIndex];
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
        const image = this.images[5];
        if (image.height) {
            const scale = Math.max(height / image.height, width / image.width);

            let sizeX = image.width * scale * this.fields.pictureZoom;
            let sizeY = image.height * scale * this.fields.pictureZoom;
            let spaceX = sizeX - width;
            let spaceY = sizeY - height;
            let moveX = this.fields.pictureX * spaceX / 2;
            let moveY = this.fields.pictureY * spaceY / 2;

            this.savingContext(()=>{
                this.context.translate(xCenter + moveX, yCenter + moveY);
                this.context.scale(scale * this.fields.pictureZoom, scale * this.fields.pictureZoom);
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

    drawExpansionIcon(xCenter, yCenter, width, height) {
        const expansion = this.images[17];
        if (expansion.height) {
            const scale = Math.min(height / expansion.height, width / expansion.width);
            this.context.save();
            this.context.translate(xCenter, yCenter);
            this.context.scale(scale, scale);
            this.context.drawImage(expansion, expansion.width / -2, expansion.height / -2);
            this.context.restore();
        }
    }
}

class CardPainter extends Painter {

    draw() {
        this.context.save();
        const regexNumberPriceIcons = new RegExp("[" + Object.keys(icons).join("") + "]", "g");
        const numberPriceIcons = (this.fields.price.match(regexNumberPriceIcons) || []).length;

        this.drawPicture(704, 706, 1150, 835);
        this.removeCorners(1403, 2151, 100);

        this.context.save();
        this.context.filter = 'url(#matrix-color-0)';
        this.context.drawImage(this.getRecoloredImage(0, 0), 0, 0); //CardColorOne
        this.context.restore();

        if (this.fields.color2 !== COLOR_SAME) {
            let splitPosition = this.fields.color2split;
            let sameIntensities = this.isEachColorDark[0] === this.isEachColorDark[1];
            const colorID = sameIntensities ? splitPosition : 12;
            this.context.save();
            this.context.filter = 'url(#matrix-color-1)';
            this.context.drawImage(this.getRecoloredImage(colorID, 1), 0, 0); //CardColorTwo
            this.context.restore();
        }
        this.context.drawImage(this.getRecoloredImage(2, 0, 6), 0, 0); //CardGray
        this.context.drawImage(this.getRecoloredImage(16, 0, 9), 0, 0); //CardBrown

        const shouldDrawFocus =
            this.fields.color1 !== COLOR_NORMAL &&
            !this.isEachColorDark[0] &&
            this.fields.color2 === COLOR_SAME;

        if (shouldDrawFocus) //single (non-Action, non-Night) color
            this.context.drawImage(this.images[3], 44, 1094); //DescriptionFocus

        if (travellerTypesPattern.test(this.fields.type)) {
            this.context.save();
            this.context.globalCompositeOperation = "luminosity";
            if (this.isEachColorDark[0])
                this.context.globalAlpha = 0.33;
            this.context.drawImage(this.images[4], 524, 1197); //Traveller
            this.context.restore();
        }

        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        if (this.fields.heirloom) {
            this.context.drawImage(this.images[13], 97, 1720); //Heirloom banner
            this.writeSingleLine(this.fields.heirloom, 701, 1799, 1040, 58, "Times New Roman");
        }
        if (this.isEachColorDark[1])
            this.context.fillStyle = "white";
        this.writeSingleLine(this.fields.title, 701, 215, this.fields.preview ? 800 : 1180, 75);
        if (this.fields.type.split(" - ").length >= 4) {
            let types2 = this.fields.type.split(" - ");
            let types1 = types2.splice(0, Math.ceil(types2.length / 2));
            let left = this.fields.price ? 750 + 65 * (numberPriceIcons - 1) : 701;
            let right = this.fields.price ? 890 - 65 * (numberPriceIcons - 1) : 1180;
            this.writeSingleLine(types1.join(" - ") + " -", left, 1922 - 26, right, 42);
            this.writeSingleLine(types2.join(" - "), left, 1922 + 26, right, 42);
        } else {
            if (this.images[17].height > 0 && this.images[17].width > 0) {
                let left = this.fields.price ? 730 + 65 * (numberPriceIcons - 1) : 701;
                let right = this.fields.price ? 800 - 65 * (numberPriceIcons - 1) : 900;
                this.writeSingleLine(this.fields.type, left, 1922, right, 64);
            } else {
                let left = this.fields.price ? 750 + 125 * (numberPriceIcons - 1) : 701;
                let right = this.fields.price ? 890 - 85 * (numberPriceIcons - 1) : 1180;
                this.writeSingleLine(this.fields.type, left, 1922, right, 64);
            }
        }
        if (this.fields.price)
            this.writeLineWithIcons(this.fields.price + " ", 153, 1940, 85 / 90, "Minion"); //adding a space confuses writeLineWithIconsReplacedWithSpaces into thinking this isn't a line that needs resizing
        if (this.fields.preview) {
            this.writeSingleLine(this.fields.preview + " ", 223, 210, 0, 0, "Minion");
            this.writeSingleLine(this.fields.preview + " ", 1203, 210, 0, 0, "Minion");
        }
        this.context.fillStyle = (this.isEachColorDark[0]) ? "white" : "black";
        if (!this.fields.heirloom)
            this.writeDescription(this.fields.description, 701, 1500, 960, 660, 64);
        else
            this.writeDescription(this.fields.description, 701, 1450, 960, 560, 64);
        this.writeIllustrationCredit(150, 2038, "white", "");
        this.writeCreatorCredit(1253, 2038, "white", "");

        this.drawExpansionIcon(1230, 1920, 80, 80);
        this.context.restore();
    }
}

class EventPainter extends Painter {

    draw(){
        this.context.save();
        this.drawPicture(1075, 584, 1887, 730);
        this.removeCorners(2151, 1403, 100);

        this.context.drawImage(this.getRecoloredImage(6, 0), 0, 0); //EventColorOne
        if (this.fields.heirloom)
            this.context.drawImage(this.images[14], 146, 832); //EventHeirloom
        if (this.fields.color2 !== COLOR_SAME) //two colors are different
            this.context.drawImage(this.getRecoloredImage(7, 1), 0, 0); //EventColorTwo
        this.context.drawImage(this.getRecoloredImage(8, 0, 6), 0, 0); //EventUncoloredDetails
        this.context.drawImage(this.getRecoloredImage(15, 0, 9), 0, 0); //EventBar

        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        if (this.fields.heirloom)
            this.writeSingleLine(this.fields.heirloom, 1074, 900, 1600, 58, "Times New Roman");
        if (this.isEachColorDark[0])
            this.context.fillStyle = "white";
        this.writeSingleLine(document.getElementById("title").value, 1075, 165, 780, 70);

        if (this.fields.type) {
            this.context.save();
            this.context.translate(1903, 240);
            this.context.rotate(45 * Math.PI / 180);
            this.context.scale(1, 0.8); //yes, the letters are shorter
            this.writeSingleLine(this.fields.type, 0, 0, 283, 64);
            this.context.restore();
        }

        if (this.fields.price)
            this.writeLineWithIcons(this.fields.price + " ", 130, 205, 85 / 90, "Minion");
        //adding a space confuses writeLineWithIconsReplacedWithSpaces into thinking this isn't a line that needs resizing

        this.writeDescription(this.fields.description, 1075, 1107, 1600, 283, 70);
        this.writeIllustrationCredit(181, 1272, "black", "bold ");
        this.writeCreatorCredit(1969, 1272, "black", "bold ");

        this.drawExpansionIcon(1930, 1190, 80, 80);
        this.context.restore();
    }
}

class DoubleCardPainter extends Painter {

    drawHalfCard(t, title, price, description, colorID) {
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        this.context.save();

        let size = 75 + 2;
        do {
            this.context.font = (size -= 2) + "pt TrajanPro";
        } while (this.context.measureText(title).width > 750);

        this.context.textAlign = "left";
        this.context.fillStyle = "rgb(" + this.extra.recolorFactors[colorID].slice(0, 3).map(x => Math.round(x*224)).join(",") + ")";
        this.context.lineWidth = 15;
        if (this.isEachColorDark[colorID])
            this.context.strokeStyle = "white";
        this.context.strokeText(title, 150, 1287);
        this.context.fillText(title, 150, 1287);
        this.context.restore();

        if (this.isEachColorDark[colorID])
            this.context.fillStyle = "white";

        this.writeSingleLine(t, price ? 750 : 701, 1922, price ? 890 : 1190, 64);
        if (price)
            this.writeLineWithIcons(price + " ", 153, 1940, 85 / 90, "Minion", undefined);
        this.writeDescription(description, 701, 1600, 960, 460, 64);
        this.context.restore();
    }

    draw() {
        this.context.save();
        this.drawPicture(704, 1075, 1150, 564);
        this.removeCorners(1403, 2151, 100);

        const colorID = this.fields.color2 === COLOR_SAME ? 0 : 1;

        this.context.drawImage(this.getRecoloredImage(9, 0), 0, 0); //DoubleColorOne
        if (!this.isEachColorDark[0])
            this.context.drawImage(this.images[3], 44, 1330, this.images[3].width, this.images[3].height * 2 / 3); //DescriptionFocus
        this.context.save();
        this.context.rotate(Math.PI);

        this.context.drawImage(this.getRecoloredImage(10, colorID), -1403, -2151); //DoubleColorOne again, but rotated
        if (!this.isEachColorDark[1])
            this.context.drawImage(this.images[3], 44 - 1403, 1330 - 2151, this.images[3].width, this.images[3].height * 2 / 3); //DescriptionFocus
        this.context.restore();
        this.context.drawImage(this.images[11], 0, 0); //DoubleUncoloredDetails //todo

        this.context.save();
        this.drawHalfCard(this.fields.type, this.fields.title, this.fields.price, this.fields.description, 0);
        this.context.save();
        this.context.translate(1403, 2151); //bottom right corner
        this.context.rotate(Math.PI);
        this.shadowDistance = -this.shadowDistance;
        this.drawHalfCard(this.fields.heirloom, this.fields.title2, this.fields.preview, this.fields.description2, colorID);
        this.shadowDistance = -this.shadowDistance;
        this.writeIllustrationCredit(150, 2038, "white", "");
        this.writeCreatorCredit(1253, 2038, "white", "");

        this.drawExpansionIcon(1230, 1920, 80, 80);
        this.context.restore();
    }
}

class BaseCardPainter extends Painter {

    bigIconProps(word, scale){
        return {
            dy: 115 - 48 * scale,
            dx: 0,
            scale: word.includes('$') ? 3.2 : 2.4,
            font: "bold 222pt Minion"
        }
    }

    draw() {
        this.context.save();
        this.drawPicture(704, 1075, 1150, 1898);
        this.removeCorners(1403, 2151, 100);

        this.context.drawImage(this.getRecoloredImage(20, 0), 0, 0); //CardColorOne
        this.context.drawImage(this.getRecoloredImage(21, 0, 6), 0, 0); //CardGray
        this.context.drawImage(this.getRecoloredImage(22, 0, 9), 0, 0); //CardBrown

        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        if (this.fields.heirloom) {
            this.context.drawImage(this.images[13], 97, 1720); //Heirloom banner
            this.writeSingleLine(this.fields.heirloom, 701, 1799, 1040, 58, "Times New Roman");
        }

        if (this.isEachColorDark[1])
            this.context.fillStyle = "white";
        this.writeSingleLine(this.fields.title, 701, 215, this.fields.preview ? 800 : 1180, 75);

        if (this.fields.type.split(" - ").length >= 4) {
            let types2 = this.fields.type.split(" - ");
            let types1 = types2.splice(0, Math.ceil(types2.length / 2));
            this.writeSingleLine(types1.join(" - ") + " -", this.fields.price ? 750 : 701, 1945 - 26, this.fields.price ? 890 : 1180, 42);
            this.writeSingleLine(types2.join(" - "), this.fields.price ? 750 : 701, 1945 + 26, this.fields.price ? 890 : 1180, 42);
        } else {
            if (this.images[17].height > 0 && this.images[17].width > 0) {
                this.writeSingleLine(this.fields.type, this.fields.price ? 730 : 701, 1945, this.fields.price ? 800 : 900, 64);
            } else {
                this.writeSingleLine(this.fields.type, this.fields.price ? 750 : 701, 1945, this.fields.price ? 890 : 1180, 64);
            }
        }

        if (this.fields.price)
            this.writeLineWithIcons(this.fields.price + " ", 153, 1947, 85 / 90, "Minion"); //adding a space confuses writeLineWithIconsReplacedWithSpaces into thinking this isn't a line that needs resizing

        if (this.fields.preview) {
            this.writeSingleLine(this.fields.preview + " ", 223, 210, 0, 0, "Minion");
            this.writeSingleLine(this.fields.preview + " ", 1203, 210, 0, 0, "Minion");
        }

        this.context.fillStyle = (this.isEachColorDark[0]) ? "white" : "black";

        if (!this.fields.heirloom)
            this.writeDescription(this.fields.description, 701, 1060, 960, 1500, 64);
        else
            this.writeDescription(this.fields.description, 701, 1000, 960, 1400, 64);

        this.writeIllustrationCredit(165, 2045, "white", "");
        this.writeCreatorCredit(1225, 2045, "white", "");

        this.drawExpansionIcon(1230, 1945, 80, 80);
        this.context.restore();
    }
}


class PileMarkerPainter extends Painter {
    draw(){
        this.context.save();
        this.drawPicture(1075, 702, 1250, 870);
        this.removeCorners(2151, 1403, 100);

        this.context.drawImage(this.getRecoloredImage(24, 0, 6), 0, 0); //CardGray
        this.context.drawImage(this.getRecoloredImage(23, 0), 0, 0); //CardColorOne

        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        this.context.save();
        if (this.isEachColorDark[1])
            this.context.fillStyle = "white";
        this.context.rotate(Math.PI / 2);
        this.writeSingleLine(this.fields.title, 700, -1920, 500, 75);
        this.context.restore();

        this.context.save();
        if (this.isEachColorDark[1])
            this.context.fillStyle = "white";
        this.context.rotate(Math.PI * 3 / 2);
        this.writeSingleLine(this.fields.title, -700, 230, 500, 75);
        this.context.restore();
        this.context.restore();
    }
}

class MatPainter extends Painter {

    draw(){
        this.context.save();
        this.drawPicture(464, 342, 928, 684);

        this.context.drawImage(this.getRecoloredImage(25, 0, 6), 0, 0); //MatBannerTop
        if (this.fields.description.trim().length > 0)
            this.context.drawImage(this.getRecoloredImage(26, 0, 6), 0, 0); //MatBannerBottom

        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        if (this.isEachColorDark[1])
            this.context.fillStyle = "white";
        this.writeSingleLine(this.fields.title, 464, 96, 490, 55);

        this.writeDescription(this.fields.description, 464, 572, 740, 80, 44);

        this.writeIllustrationCredit(15, 660, "white", "", 16);
        this.writeCreatorCredit(913, 660, "white", "", 16);

        this.drawExpansionIcon(888, 40, 40, 40);
        this.context.restore();
    }
}
