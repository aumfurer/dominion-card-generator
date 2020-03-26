var templateSize = 0; //save globally

Array.prototype.remove = function () {
    var what, a = arguments,
        L = a.length,
        ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

// Initialization of complete logic on load of page
function initCardImageGenerator() {

    const normalColorFactorLists = [
		["Action/Event", [1, 1, 1]],
		["Treasure", [1.1, 0.95, 0.55]],
		["Victory", [0.75, 0.9, 0.65]],
		["Reaction", [0.65, 0.8, 1.05]],
		["Duration", [1.2, 0.8, 0.4]],
		["Reserve", [0.9, 0.75, 0.5]],
		["Curse", [0.85, 0.6, 1.1]],
		["Shelter", [1.05, 0.65, 0.5]],
		["Ruins", [0.75, 0.6, 0.35]],
		["Landmark", [0.45, 1.25, 0.85]],
		["Night", [0.3, 0.4, 0.45]],
		["Boon", [1.4, 1.35, 0.55, 0, 0, 0, 1.7, 1.25, 0.65, 1.95, 1.6, 0.4]],
		["Hex", [0.75, 0.6, 2.1, 0, 0, 0, 0.8, 0.8, 0.8, 1.0, 0.75, 2.1]],
		["State", [1.1, 1.3, 1.3, 0.6, 0.15, 0, 1.55, 1.15, 1.05, 1.4, 0.65, 0.45]],
		["Artifact", [1.15, 1, 0.75, 0.3, 0.15, 0.05]],
		["Project", [1.15, 0.95, 0.9, 0.4, 0.2, 0.15]],
		["Way", [1, 1.15, 1.25, 0.25, 0.3, 0.35, 1.6, 1.6, 1.6, 1.3, 1.3, 1.3]]
	];

    const travellerTypesPattern = new RegExp(["Traveller", "Traveler", "Reisender", "Reisende"].join("|"));

    const normalColorCustomIndices = [0, 0];
    const normalColorDropdowns = document.getElementsByName("normalcolor");

    for (let j = 0; j < normalColorDropdowns.length; ++j) {
        for (let i = 0; i < normalColorFactorLists.length; ++i) { //"- j" because only the first dropdown should have Night
            const option = document.createElement("option");
            option.textContent = normalColorFactorLists[i][0];
            normalColorDropdowns[j].appendChild(option);
        }
        normalColorCustomIndices[j] = normalColorDropdowns[j].childElementCount;
        var customOption = document.createElement("option");
        customOption.textContent = "CUSTOM";
        normalColorDropdowns[j].appendChild(customOption);
        customOption = document.createElement("option");
        customOption.textContent = "EXTRA CUSTOM";
        normalColorDropdowns[j].appendChild(customOption);
        normalColorDropdowns[j].selectedIndex = 0;
    }

    function getExtraBoldWords() {
        let elemBoldkeys = document.getElementById("boldkeys");
        let boldExtraKeys = elemBoldkeys !== null ? elemBoldkeys.value : "";
        return boldExtraKeys.split(";").filter(x => x !== "")
    }

    const canvases = document.getElementsByClassName("myCanvas");
    let images = [];
    let imagesLoaded = false;
    let recolorFactorList = [
		[0.75, 1.1, 1.35, 0, 0, 0, 1, 2, 3, 4, 5, 6],
		[0.75, 1.1, 1.35, 0, 0, 0, 1, 2, 3, 4, 5, 6]
	];

    const normalColorCurrentIndices = [0, 0];
    let recoloredImages = [];

    function draw() {

        function getRecoloredImage(imageID, colorID, offset) {
            if (!recoloredImages[imageID]) { //http://stackoverflow.com/questions/1445862/possible-to-use-html-images-like-canvas-with-getimagedata-putimagedata
                var cnvs = document.createElement("canvas");
                var w = images[imageID].width,
                    h = images[imageID].height;
                cnvs.width = w;
                cnvs.height = h;
                var ctx = cnvs.getContext("2d");
                ctx.drawImage(images[imageID], 0, 0);

                var imgdata = ctx.getImageData(0, 0, w, h);
                var rgba = imgdata.data;

                offset = offset || 0;
                var recolorFactors;
                if (normalColorCurrentIndices[colorID] === normalColorCustomIndices[colorID])
                    recolorFactors = recolorFactorList[colorID].slice(0, 3);
                else if (normalColorCurrentIndices[colorID] > normalColorCustomIndices[colorID])
                    recolorFactors = recolorFactorList[colorID];
                else
                    recolorFactors = normalColorFactorLists[normalColorCurrentIndices[colorID] - colorID][1];
                recolorFactors = recolorFactors.slice();

                while (recolorFactors.length < 6)
                    recolorFactors.push(0);

                if (offset === 0) {
                    for (let ch = 0; ch < 3; ++ch)
                        recolorFactors[ch] -= recolorFactors[ch + 3];
                    for (let px = 0, ct = w * h * 4; px < ct; px += 4)
                        if (rgba[px + 3]) //no need to recolor pixels that are fully transparent
                            for (let ch = 0; ch < 3; ++ch)
                                rgba[px + ch] = Math.max(0, Math.min(255, Math.round(recolorFactors[ch + 3] * 255 + rgba[px + ch] * recolorFactors[ch])));
                } else {
                    while (recolorFactors.length < 12)
                        recolorFactors.push(genericCustomAccentColors[templateSize & 1][recolorFactors.length]);
                    for (let px = 0, ct = w * h * 4; px < ct; px += 4)
                        if (rgba[px + 3])
                            for (let ch = 0; ch < 3; ++ch)
                                rgba[px + ch] = Math.max(0, Math.min(255, rgba[px + ch] * recolorFactors[ch + offset]));
                }

                ctx.putImageData(imgdata, 0, 0);
                recoloredImages[imageID] = cnvs;
            }
            return recoloredImages[imageID];
        }

        function writeIllustrationCredit(x, y, color, bold, size = 31) {
            const illustrationCredit = document.getElementById("credit").value;
            if (illustrationCredit) {
                context.font = bold + size + "pt Times New Roman";
                context.fillStyle = color;
                context.fillText(illustrationCredit, x, y);
                context.fillStyle = "#000";
            }
        }

        function writeCreatorCredit(x, y, color, bold, size = 31) {
            const creatorCredit = document.getElementById("creator").value;
            if (creatorCredit) {
                context.textAlign = "right";
                context.font = bold + size + "pt Times New Roman";
                context.fillStyle = color;
                context.fillText(creatorCredit, x, y);
                context.fillStyle = "#000";
            }
        }

        if (!imagesLoaded) {
            imagesLoaded = images.every(img => img.complete);
            if (!imagesLoaded) {
                queueDraw();
                return;
            }
        } //else ready to draw!

        canvases[0].parentNode.setAttribute("data-status", "Redrawing...");

        // clear
        for (let c of canvases)
            c.getContext("2d").clearRect(0, 0, c.width, c.height);


        var context;
        if (templateSize === 0 || templateSize === 2 || templateSize === 3) {
            context = canvases[0].getContext("2d");
        } else if (templateSize === 1 || templateSize === 4) {
            context = canvases[1].getContext("2d");
        } else {
            context = canvases[2].getContext("2d");
        }

        //context.save();

        // draw

        const picture = images[5];
        const pictureX = document.getElementById("picture-x").value;
        const pictureY = document.getElementById("picture-y").value;
        const pictureZoom = document.getElementById("picture-zoom").value;
        const expansion = images[17];
        const typeLine = document.getElementById("type").value;
        const heirloomLine = document.getElementById("type2").value;
        const priceLine = document.getElementById("price").value;
        const numberPriceIcons = (priceLine.match(new RegExp("[" + Object.keys(icons).join("") + "]", "g")) || []).length;
        const previewLine = document.getElementById("preview").value;

        let isEachColorDark = [false, false];
        for (let i = 0; i < 2; ++i)
            isEachColorDark[i] = (i === 1 && normalColorCurrentIndices[1] == 0) ? isEachColorDark[0] : (((normalColorCurrentIndices[i] >= normalColorCustomIndices[i]) ? recolorFactorList[i] : normalColorFactorLists[normalColorCurrentIndices[i] - i][1]).slice(0, 3).reduce(function getSum(total, num) {
                return total + parseFloat(num);
            }) <= 1.5);
        const differentIntensities = isEachColorDark[0] !== isEachColorDark[1];

        if (!(differentIntensities || parseInt(normalColorCurrentIndices[1]) === 0 || parseInt(normalColorCurrentIndices[0]) + 1 === parseInt(normalColorCurrentIndices[1]))) {
            document.getElementById('color2splitselector').removeAttribute("style");
        } else {
            document.getElementById('color2splitselector').setAttribute("style", "display:none");
        }

        function drawExpansionIcon(xCenter, yCenter, width, height) {
            if (expansion.height) {
                var scale;
                if (expansion.width / width < expansion.height / height) { //size of area to draw picture to
                    scale = height / expansion.height;
                } else {
                    scale = width / expansion.width;
                }
                context.save();
                context.translate(xCenter, yCenter);
                context.scale(scale, scale);
                context.drawImage(expansion, expansion.width / -2, expansion.height / -2);
                context.restore();
            }
        }

        function actuallyDraw() {

            const painter = new Painter(
                context,
                getExtraBoldWords(),
                images,
                numberFirstIcon,
                {image: picture, x: parseFloat(pictureX), y: parseFloat(pictureY), zoom: pictureZoom}
            );

            const descriptionStr = document.getElementById("description").value;

            if (templateSize === 0) { //card
                painter.drawPicture(704, 706, 1150, 835);
                painter.removeCorners(1403, 2151, 100);

                context.drawImage(getRecoloredImage(0, 0), 0, 0); //CardColorOne
                if (normalColorCurrentIndices[1] > 0) { //two colors are different
                    let splitPosition = document.getElementById("color2split").value;
                    context.drawImage(getRecoloredImage(!differentIntensities ? splitPosition : 12, 1), 0, 0); //CardColorTwo
                }
                context.drawImage(getRecoloredImage(2, 0, 6), 0, 0); //CardGray
                context.drawImage(getRecoloredImage(16, 0, 9), 0, 0); //CardBrown
                if (normalColorCurrentIndices[0] > 0 && !isEachColorDark[0] && normalColorCurrentIndices[1] === 0) //single (non-Action, non-Night) color
                    context.drawImage(images[3], 44, 1094); //DescriptionFocus

                if (travellerTypesPattern.test(typeLine)) {
                    context.save();
                    context.globalCompositeOperation = "luminosity";
                    if (isEachColorDark[0])
                        context.globalAlpha = 0.33;
                    context.drawImage(images[4], 524, 1197); //Traveller
                    context.restore();
                }

                context.textAlign = "center";
                context.textBaseline = "middle";
                //context.font = "small-caps" + context.font;
                if (heirloomLine) {
                    context.drawImage(images[13], 97, 1720); //Heirloom banner
                    painter.writeSingleLine(heirloomLine, 701, 1799, 1040, 58, "Times New Roman");
                }
                if (isEachColorDark[1])
                    context.fillStyle = "white";
                painter.writeSingleLine(document.getElementById("title").value, 701, 215, previewLine ? 800 : 1180, 75);
                if (typeLine.split(" - ").length >= 4) {
                    let types2 = typeLine.split(" - ");
                    let types1 = types2.splice(0, Math.ceil(types2.length / 2));
                    let left = priceLine ? 750 + 65 * (numberPriceIcons - 1) : 701;
                    let right = priceLine ? 890 - 65 * (numberPriceIcons - 1) : 1180;
                    painter.writeSingleLine(types1.join(" - ") + " -", left, 1922 - 26, right, 42);
                    painter.writeSingleLine(types2.join(" - "), left, 1922 + 26, right, 42);
                } else {
                    if (expansion.height > 0 && expansion.width > 0) {
                        let left = priceLine ? 730 + 65 * (numberPriceIcons - 1) : 701;
                        let right = priceLine ? 800 - 65 * (numberPriceIcons - 1) : 900;
                        painter.writeSingleLine(typeLine, left, 1922, right, 64);
                    } else {
                        let left = priceLine ? 750 + 125 * (numberPriceIcons - 1) : 701;
                        let right = priceLine ? 890 - 85 * (numberPriceIcons - 1) : 1180;
                        painter.writeSingleLine(typeLine, left, 1922, right, 64);
                    }
                }
                if (priceLine)
                    painter.writeLineWithIcons(priceLine + " ", 153, 1940, 85 / 90, "Minion"); //adding a space confuses writeLineWithIconsReplacedWithSpaces into thinking this isn't a line that needs resizing
                if (previewLine) {
                    painter.writeSingleLine(previewLine + " ", 223, 210, 0, 0, "Minion");
                    painter.writeSingleLine(previewLine + " ", 1203, 210, 0, 0, "Minion");
                }
                context.fillStyle = (isEachColorDark[0]) ? "white" : "black";
                if (!heirloomLine)
                    painter.writeDescription(descriptionStr, 701, 1500, 960, 660, 64);
                else
                    painter.writeDescription(descriptionStr, 701, 1450, 960, 560, 64);
                writeIllustrationCredit(150, 2038, "white", "");
                writeCreatorCredit(1253, 2038, "white", "");

                drawExpansionIcon(1230, 1920, 80, 80);

            } else if (templateSize === 1) { //event/landscape
                painter.drawPicture(1075, 584, 1887, 730);
                painter.removeCorners(2151, 1403, 100);

                context.drawImage(getRecoloredImage(6, 0), 0, 0); //EventColorOne
                if (heirloomLine)
                    context.drawImage(images[14], 146, 832); //EventHeirloom
                if (normalColorCurrentIndices[1] > 0) //two colors are different
                    context.drawImage(getRecoloredImage(7, 1), 0, 0); //EventColorTwo
                context.drawImage(getRecoloredImage(8, 0, 6), 0, 0); //EventUncoloredDetails
                context.drawImage(getRecoloredImage(15, 0, 9), 0, 0); //EventBar

                //no Traveller

                context.textAlign = "center";
                context.textBaseline = "middle";
                //context.font = "small-caps" + context.font;
                if (heirloomLine)
                    painter.writeSingleLine(heirloomLine, 1074, 900, 1600, 58, "Times New Roman");
                if (isEachColorDark[0])
                    context.fillStyle = "white";
                painter.writeSingleLine(document.getElementById("title").value, 1075, 165, 780, 70);

                if (typeLine) {
                    context.save();
                    context.translate(1903, 240);
                    context.rotate(45 * Math.PI / 180);
                    context.scale(1, 0.8); //yes, the letters are shorter
                    painter.writeSingleLine(typeLine, 0, 0, 283, 64);
                    context.restore();
                }

                if (priceLine)
                    painter.writeLineWithIcons(priceLine + " ", 130, 205, 85 / 90, "Minion", undefined) //adding a space confuses writeLineWithIconsReplacedWithSpaces into thinking this isn't a line that needs resizing
                painter.writeDescription(descriptionStr, 1075, 1107, 1600, 283, 70);
                writeIllustrationCredit(181, 1272, "black", "bold ");
                writeCreatorCredit(1969, 1272, "black", "bold ");

                drawExpansionIcon(1930, 1190, 80, 80);

            } else if (templateSize === 2) { //double card
                painter.drawPicture(704, 1075, 1150, 564);
                painter.removeCorners(1403, 2151, 100);

                if (!recoloredImages[9]) recoloredImages[10] = false;
                context.drawImage(getRecoloredImage(9, 0), 0, 0); //DoubleColorOne
                if (!isEachColorDark[0])
                    context.drawImage(images[3], 44, 1330, images[3].width, images[3].height * 2 / 3); //DescriptionFocus
                context.save();
                context.rotate(Math.PI);
                context.drawImage(getRecoloredImage(10, (normalColorCurrentIndices[1] > 0) ? 1 : 0), -1403, -2151); //DoubleColorOne again, but rotated
                if (!isEachColorDark[1])
                    context.drawImage(images[3], 44 - 1403, 1330 - 2151, images[3].width, images[3].height * 2 / 3); //DescriptionFocus
                context.restore();
                context.drawImage(images[11], 0, 0); //DoubleUncoloredDetails //todo

                function drawHalfCard(t, l, p, d, colorID) {
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    //context.font = "small-caps" + context.font;
                    //writeSingleLine(document.getElementById(l).value, 701, 215, 1180, 75);

                    var recolorFactors;
                    if (normalColorCurrentIndices[colorID] >= normalColorCustomIndices[colorID])
                        recolorFactors = recolorFactorList[colorID];
                    else
                        recolorFactors = normalColorFactorLists[normalColorCurrentIndices[colorID] - colorID][1];

                    context.save();
                    var title = document.getElementById(l).value;
                    var size = 75 + 2;
                    do {
                        context.font = (size -= 2) + "pt TrajanPro";
                    } while (context.measureText(title).width > 750);
                    context.textAlign = "left";
                    context.fillStyle = "rgb(" + Math.round(recolorFactors[0] * 224) + "," + Math.round(recolorFactors[1] * 224) + "," + Math.round(recolorFactors[2] * 224) + ")";
                    context.lineWidth = 15;
                    if (isEachColorDark[colorID])
                        context.strokeStyle = "white";
                    context.strokeText(title, 150, 1287);
                    context.fillText(title, 150, 1287);
                    context.restore();

                    if (isEachColorDark[colorID])
                        context.fillStyle = "white";
                    painter.writeSingleLine(t, p ? 750 : 701, 1922, p ? 890 : 1190, 64);
                    if (p)
                        painter.writeLineWithIcons(p + " ", 153, 1940, 85 / 90, "Minion", undefined)
                    painter.writeDescription(d, 701, 1600, 960, 460, 64);
                    context.restore();
                }

                context.save();
                drawHalfCard(typeLine, "title", priceLine, descriptionStr, 0);
                context.save();
                context.translate(1403, 2151); //bottom right corner
                context.rotate(Math.PI);
                painter.shadowDistance = -painter.shadowDistance;
                const description2 = document.getElementById("description2").value;
                drawHalfCard(heirloomLine, "title2", previewLine, description2, (normalColorCurrentIndices[1] > 0) ? 1 : 0);
                painter.shadowDistance = -painter.shadowDistance;
                writeIllustrationCredit(150, 2038, "white", "");
                writeCreatorCredit(1253, 2038, "white", "");

                drawExpansionIcon(1230, 1920, 80, 80);

            } else if (templateSize === 3) { //base card
                painter.drawPicture(704, 1075, 1150, 1898);
                painter.removeCorners(1403, 2151, 100);

                context.drawImage(getRecoloredImage(20, 0), 0, 0); //CardColorOne
                context.drawImage(getRecoloredImage(21, 0, 6), 0, 0); //CardGray
                context.drawImage(getRecoloredImage(22, 0, 9), 0, 0); //CardBrown

                context.textAlign = "center";
                context.textBaseline = "middle";
                //context.font = "small-caps" + context.font;
                if (heirloomLine) {
                    context.drawImage(images[13], 97, 1720); //Heirloom banner
                    painter.writeSingleLine(heirloomLine, 701, 1799, 1040, 58, "Times New Roman");
                }
                if (isEachColorDark[1])
                    context.fillStyle = "white";
                painter.writeSingleLine(document.getElementById("title").value, 701, 215, previewLine ? 800 : 1180, 75);
                if (typeLine.split(" - ").length >= 4) {
                    let types2 = typeLine.split(" - ");
                    let types1 = types2.splice(0, Math.ceil(types2.length / 2));
                    painter.writeSingleLine(types1.join(" - ") + " -", priceLine ? 750 : 701, 1945 - 26, priceLine ? 890 : 1180, 42);
                    painter.writeSingleLine(types2.join(" - "), priceLine ? 750 : 701, 1945 + 26, priceLine ? 890 : 1180, 42);
                } else {
                    if (expansion.height > 0 && expansion.width > 0) {
                        painter.writeSingleLine(typeLine, priceLine ? 730 : 701, 1945, priceLine ? 800 : 900, 64);
                    } else {
                        painter.writeSingleLine(typeLine, priceLine ? 750 : 701, 1945, priceLine ? 890 : 1180, 64);
                    }
                }
                if (priceLine)
                    painter.writeLineWithIcons(priceLine + " ", 153, 1947, 85 / 90, "Minion"); //adding a space confuses writeLineWithIconsReplacedWithSpaces into thinking this isn't a line that needs resizing
                if (previewLine) {
                    painter.writeSingleLine(previewLine + " ", 223, 210, 0, 0, "Minion");
                    painter.writeSingleLine(previewLine + " ", 1203, 210, 0, 0, "Minion");
                }
                context.fillStyle = (isEachColorDark[0]) ? "white" : "black";
                if (!heirloomLine)
                    painter.writeDescription(descriptionStr, 701, 1060, 960, 1500, 64);
                else
                    painter.writeDescription(descriptionStr, 701, 1000, 960, 1400, 64);
                writeIllustrationCredit(165, 2045, "white", "");
                writeCreatorCredit(1225, 2045, "white", "");

                drawExpansionIcon(1230, 1945, 80, 80);
            } else if (templateSize === 4) { //pile marker
                painter.drawPicture(1075, 702, 1250, 870);
                painter.removeCorners(2151, 1403, 100);

                context.drawImage(getRecoloredImage(24, 0, 6), 0, 0); //CardGray
                context.drawImage(getRecoloredImage(23, 0), 0, 0); //CardColorOne

                context.textAlign = "center";
                context.textBaseline = "middle";

                context.save();
                if (isEachColorDark[1])
                    context.fillStyle = "white";
                context.rotate(Math.PI / 2);
                painter.writeSingleLine(document.getElementById("title").value, 700, -1920, 500, 75);
                context.restore();
                context.save();
                if (isEachColorDark[1])
                    context.fillStyle = "white";
                context.rotate(Math.PI * 3 / 2);
                painter.writeSingleLine(document.getElementById("title").value, -700, 230, 500, 75);
                context.restore();
            } else if (templateSize === 5) { //player mat
                painter.drawPicture(464, 342, 928, 684);

                context.drawImage(getRecoloredImage(25, 0, 6), 0, 0); //MatBannerTop
                if (document.getElementById("description").value.trim().length > 0)
                    context.drawImage(getRecoloredImage(26, 0, 6), 0, 0); //MatBannerBottom

                context.textAlign = "center";
                context.textBaseline = "middle";

                if (isEachColorDark[1])
                    context.fillStyle = "white";
                painter.writeSingleLine(document.getElementById("title").value, 464, 96, 490, 55);

                painter.writeDescription(descriptionStr, 464, 572, 740, 80, 44);
                painter.writeDescription(descriptionStr, 464, 572, 740, 80, 44);

                writeIllustrationCredit(15, 660, "white", "", 16);
                writeCreatorCredit(913, 660, "white", "", 16);

                drawExpansionIcon(888, 40, 40, 40);

            }
        }
        actuallyDraw();
        //finish up
        //context.restore();

        updateURL();

        document.getElementById("load-indicator").setAttribute("style", "display:none;");
        canvases[0].parentNode.removeAttribute("data-status");
    }

    let nextDrawInstruction = 0;
    function queueDraw(time=1500) {
        if (nextDrawInstruction)
            window.clearTimeout(nextDrawInstruction);
        nextDrawInstruction = window.setTimeout(draw, time);
    }

    function updateURL() {
        var arguments = "?";
        for (var i = 0; i < simpleOnChangeInputFieldIDs.length; ++i) {
            arguments += simpleOnChangeInputFieldIDs[i] + "=" + encodeURIComponent(document.getElementById(simpleOnChangeInputFieldIDs[i]).value) + "&";
            if (templateSize == 2 && i < simpleOnChangeButOnlyForSize2InputFieldIDs.length)
                arguments += simpleOnChangeButOnlyForSize2InputFieldIDs[i] + "=" + encodeURIComponent(document.getElementById(simpleOnChangeButOnlyForSize2InputFieldIDs[i]).value) + "&";
        }
        arguments += "picture=" + encodeURIComponent(document.getElementById("picture").value) + "&";
        arguments += "expansion=" + encodeURIComponent(document.getElementById("expansion").value) + "&";
        arguments += "custom-icon=" + encodeURIComponent(document.getElementById("custom-icon").value);
        for (let i = 0; i < normalColorDropdowns.length; ++i) {
            switch (normalColorCustomIndices[i] - normalColorDropdowns[i].selectedIndex) {
                case 0: //custom
                    for (let ch = 0; ch < 3; ++ch)
                        arguments += "&c" + i + "." + ch + "=" + recolorInputs[i * 12 + ch].value;
                    break;
                case -1: //extra custom
                    for (let ch = 0; ch < 12; ++ch) {
                        let recolorInputsIndex = i * 12 + ch;
                        if (recolorInputs.length <= recolorInputsIndex)
                            break;
                        arguments += "&c" + i + "." + ((ch / 3) | 0) + "." + (ch % 3) + "=" + recolorInputs[i * 12 + ch].value;
                    }
                    break;
                default: //preconfigured
                    arguments += "&color" + i + "=" + normalColorDropdowns[i].selectedIndex;
                    break;
            }
        }
        arguments += "&size=" + templateSize;
        history.replaceState({}, "Dominion Card Image Generator", arguments);
    }


    // help function to load images CORS save // https://stackoverflow.com/a/43001137
    function loadImgAsBase64(url, callback, maxWidth, maxHeight) {
        let canvas = document.createElement('CANVAS');
        let img = document.createElement('img');
        img.setAttribute('crossorigin', 'anonymous');
        if (!url.startsWith('data:image/') && !url.startsWith('file:///')) {
            img.src = 'https://cors-anywhere.herokuapp.com/' + url;
        } else {
            img.src = url;
        }
        img.onload = () => {
            let context = canvas.getContext('2d');
            if (maxWidth > 0 && maxHeight > 0) {
                canvas.width = maxWidth;
                canvas.height = maxHeight;
            } else {
                canvas.height = img.height;
                canvas.width = img.width;
            }
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            let dataURL = canvas.toDataURL('image/png');
            canvas = null;
            callback(dataURL);
        };
    }

    const useCORS = true; // flag to activate loading of external images via CORS helper function -> otherwise canvas is tainted and download button not working

    // initialize stage
    var sources = [
		"CardColorOne.png",
		"CardColorTwo.png",
		"CardGray.png",
		"DescriptionFocus.png",
		"Traveller.png",
		"", //illustration //5
		"EventColorOne.png",
		"EventColorTwo.png",
		"EventBrown.png",
		"DoubleColorOne.png",
		"DoubleColorOne.png", //10
		"DoubleUncoloredDetails.png",
		"CardColorTwoNight.png",
		"Heirloom.png",
		"EventHeirloom.png",
		"EventBrown2.png", //15
		"CardBrown.png",
        "", //expansion
		"CardColorTwoSmall.png",
		"CardColorTwoBig.png",
		"BaseCardColorOne.png", //20
		"BaseCardGray.png",
		"BaseCardBrown.png",
		"PileMarkerColorOne.png",
		"PileMarkerGrey.png",
        "MatBannerTop.png",
        "MatBannerBottom.png"
		//icons come afterwards
	];
    for (let source of sources)
        recoloredImages.push(false);

    const legend = document.getElementById("legend");
    const numberFirstIcon = sources.length;

    for (let key in icons) {
        const li = document.createElement("li");
        li.textContent = ": " + icons[key][0];
        const span = document.createElement("span");
        span.classList.add("def");
        span.textContent = key.replace("\\", "");
        li.insertBefore(span, li.firstChild);
        legend.insertBefore(li, legend.firstChild);
        sources.push(icons[key][0] + ".png");
    }

    for (let i = 0; i < sources.length; i++) {
        images.push(new Image());
        images[i].src = "card-resources/" + sources[i];
    }

    const simpleOnChangeInputFieldIDs = [
        "title", "description", "type", "credit", "creator", "price", "preview",
        "type2", "color2split", "boldkeys",
        "picture-x", "picture-y", "picture-zoom"
    ];

    const simpleOnChangeButOnlyForSize2InputFieldIDs = ["title2", "description2"];

    for (let id of simpleOnChangeInputFieldIDs)
        document.getElementById(id).onchange = queueDraw;
    for (let id of simpleOnChangeButOnlyForSize2InputFieldIDs)
        document.getElementById(id).onchange = queueDraw;

    const recolorInputs = document.getElementsByName("recolor");
    let alreadyNeededToDetermineCustomAccentColors = false;

    for (let i = 0; i < recolorInputs.length; ++i)
        recolorInputs[i].onchange = function (i) {
            return function () {
                const val = parseFloat(this.value);
                if (val === val) {
                    const imageID = Math.floor(i / 12);
                    if (normalColorCurrentIndices[imageID] >= 10) { //potentially recoloring the supposedly Uncolored images
                        recoloredImages[2] = false;
                        recoloredImages[8] = false;
                        recoloredImages[11] = false;
                        recoloredImages[15] = false;
                        recoloredImages[16] = false;
                    }
                    recoloredImages[imageID] = false;
                    recoloredImages[imageID + 6] = false;
                    recoloredImages[imageID + 9] = false;
                    recoloredImages[12] = false;
                    recoloredImages[18] = false;
                    recoloredImages[19] = false;
                    recoloredImages[20] = false;
                    recoloredImages[23] = false;
                    recolorFactorList[imageID][i % 12] = val;
                    queueDraw();
                }
            }
        }(i);

    function onChangeExternalImage(id, value, maxWidth, maxHeight) {
        let url = (sources[id] = value.trim());

        function setImageSource(src) {
            images[id].src = src;
            imagesLoaded = false;
            queueDraw(250);
        }

        if (url.length > 0 && useCORS) {
            loadImgAsBase64(url, (dataURL) => {
                setImageSource(dataURL)
            }, maxWidth, maxHeight);
        } else {
            setImageSource(url);
        }
    }
    document.getElementById("picture").onchange = function () {
        onChangeExternalImage(5, this.value);
    };
    document.getElementById("expansion").onchange = function () {
        onChangeExternalImage(17, this.value);
    };

    const customIcon = document.getElementById("custom-icon");
    onChangeExternalImage(images.length - 1, customIcon.value, 156, 156);
    customIcon.onchange = function () {
        //Last Icon = Custom Icon
        onChangeExternalImage(images.length - 1, this.value, 156, 156);
    };

    const genericCustomAccentColors = [
		[0, 0, 0, 0, 0, 0, 1, 1, 1, 1.2, 0.8, 0.5],
		[0, 0, 0, 0, 0, 0, 0.9, 0.8, 0.7, 0.9, 0.8, 0.7]
	];
    for (i = 0; i < normalColorDropdowns.length; ++i)
        normalColorDropdowns[i].onchange = function (i) {
            return function () {
                if (normalColorCurrentIndices[i] >= 10 || this.selectedIndex >= 10) { //potentially recoloring the supposedly Uncolored images
                    recoloredImages[2] = false;
                    recoloredImages[8] = false;
                    recoloredImages[11] = false;
                    recoloredImages[15] = false;
                    recoloredImages[16] = false;
                }
                normalColorCurrentIndices[i] = this.selectedIndex;
                recoloredImages[i] = false;
                recoloredImages[i + 6] = false;
                recoloredImages[i + 9] = false;
                recoloredImages[2] = false;
                recoloredImages[12] = false;
                recoloredImages[18] = false;
                recoloredImages[19] = false;
                recoloredImages[20] = false;
                recoloredImages[23] = false;
                var delta = normalColorCustomIndices[i] - this.selectedIndex;
                if (delta <= 0)
                    this.nextElementSibling.removeAttribute("style");
                else
                    this.nextElementSibling.setAttribute("style", "display:none;");
                if (delta === -1) {
                    this.nextElementSibling.nextElementSibling.removeAttribute("style");
                    if (i === 0 && !alreadyNeededToDetermineCustomAccentColors) {
                        alreadyNeededToDetermineCustomAccentColors = true;
                        for (var j = 6; j < 12; ++j)
                            recolorFactorList[0][j] = recolorInputs[j].value = genericCustomAccentColors[templateSize & 1][j];
                    }
                } else
                    this.nextElementSibling.nextElementSibling.setAttribute("style", "display:none;");
                queueDraw(1);
            }
        }(i);

    const templateSizeInputs = document.getElementsByName("size");
    for (const input of templateSizeInputs)
        input.onchange = function () {
            templateSize = parseInt(this.value);
            document.body.className = this.id;
            document.getElementById("load-indicator").removeAttribute("style");
            queueDraw(250);
        };

    //ready to begin: load information from query parameters
    var query = getQueryParams(document.location.search);
    for (const key in query) {
        const value = query[key];
        switch (key) {
            case "color0":
                normalColorCurrentIndices[0] = normalColorDropdowns[0].selectedIndex = value;
                break;
            case "color1":
                normalColorCurrentIndices[1] = normalColorDropdowns[1].selectedIndex = value;
                break;
            case "size":
                const buttonElement = document.getElementsByName("size")[templateSize = parseInt(value)];
                document.body.className = buttonElement.id;
                buttonElement.checked = true;
                break;
            default:
                let matches = key.match(/^c(\d)\.(\d)$/);
                if (matches) {
                    const id = matches[1];
                    normalColorCurrentIndices[id] = normalColorDropdowns[id].selectedIndex = normalColorCustomIndices[id];
                    normalColorDropdowns[id].nextElementSibling.removeAttribute("style");
                    recolorFactorList[id][matches[2]] = recolorInputs[12 * id + parseInt(matches[2])].value = parseFloat(value);
                } else {
                    matches = key.match(/^c(\d)\.(\d)\.(\d)$/);
                    if (matches) {
                        alreadyNeededToDetermineCustomAccentColors = true;
                        const id = matches[1];
                        normalColorCurrentIndices[id] = normalColorDropdowns[id].selectedIndex = normalColorCustomIndices[id] + 1;
                        normalColorDropdowns[id].nextElementSibling.removeAttribute("style");
                        normalColorDropdowns[id].nextElementSibling.nextElementSibling.removeAttribute("style");
                        recolorFactorList[id][parseInt(matches[2]) * 3 + parseInt(matches[3])] = recolorInputs[12 * id + 3 * parseInt(matches[2]) + parseInt(matches[3])].value = parseFloat(value);
                    } else {
                        const el = document.getElementById(key);
                        if (el)
                            el.value = value;
                    }
                }
                break;
        }
        for (const id of simpleOnChangeButOnlyForSize2InputFieldIDs)
            if (!document.getElementById(id).value)
                document.getElementById(id).value = document.getElementById(id.slice(0, - 1)).value;
    }
    //set the illustration's Source properly and also call queueDraw.
    document.getElementById("picture").onchange();
    document.getElementById("expansion").onchange();
    document.getElementById("custom-icon").onchange();

    //adjust page title
    function adjustPageTitle() {
        let cardTitle = document.getElementById("title").value.trim();
        let creator = document.getElementById("creator").value.trim();
        let pageDefaultTitle = "Dominion Card Image Generator";
        document.title = cardTitle.length > 0 ? (pageDefaultTitle + " - " + cardTitle + " " + creator) : pageDefaultTitle;
    }

    document.getElementById('title').addEventListener('change', adjustPageTitle, false);
    document.getElementById('creator').addEventListener('change', adjustPageTitle, false);

    adjustPageTitle();

    //pass parameters to original version to enable easy comparison
    document.getElementById('linkToOriginal').addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = this.href + document.location.search;
    }, false);

}

function getQueryParams(qs) { //http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
    qs = qs.split('+').join(' ');

    let params = {};
    let tokens;
    let re = /[?&]?([^&=]+)=?([^&]*)/g;

    for (tokens = re.exec(qs); tokens; tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

// function to download the finished card
function downloadPicture() {

    function dataURLtoBlob(dataurl) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {
            type: mime
        });
    }

    const id = templateSize === 0 || templateSize === 2 || templateSize === 3 ?
        0 :
        templateSize === 1 || templateSize === 4 ?
            1 :
            2;

    const link = document.getElementById("download");
    const canvases = document.getElementsByClassName("myCanvas");
    const canvas = canvases[id];
    const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const title = document.getElementById("title").value.trim();
    const creator = document.getElementById("creator").value.trim();
    let fileName = "";
    if (title.length > 0) {
        fileName += title;
    } else {
        fileName += "card";
    }
    if (creator.length > 0) {
        fileName += "_" + creator.split(" ")[0];
    }
    fileName = fileName.split(" ").join("_");
    fileName += ".png";
    link.setAttribute('download', fileName);
    const url = (window.webkitURL || window.URL).createObjectURL(dataURLtoBlob(image));
    link.setAttribute("href", url);
}


function Favorites(name) {
    const fav = document.getElementById("manage-favorites");
    const favList = document.getElementById("favorites-list");
    let data = localStorage.getItem('favorites') ? JSON.parse(localStorage.getItem('favorites')) : [];
    let ascending = true;

    this.open = function () {
        this.refresh();
        fav.classList.remove('hidden');
        document.getElementById('favorites-search').focus();
    };
    this.close = function () {
        fav.classList.add('hidden');
    };
    this.deleteAll = function () {
        data = [];
        this.save();
    };
    this.delete = function (params) {
        this.refresh();
        data = data.remove(params);
        this.save();
    };
    this.add = function (params) {
        this.refresh();
        data = data.remove(params);
        data.push(params);
        this.save();
    };
    this.load = function (params) {
        window.location.href = this.href + params;
    };
    this.save = function () {
        localStorage.setItem('favorites', JSON.stringify(data));
        this.refresh();
    };
    this.sort = function () {
        data.sort();
        if (ascending === false) {
            data.reverse();
            console.log('Favorites sorted in descending order.');
            ascending = true;
        } else {
            console.log('Favorites sorted in ascending order.');
            ascending = false;
        }
        this.save();
        this.refresh();
    };
    this.search = function (term) {
        let children = favList.childNodes;
        for (const c in children) {
            if (!isNaN(child)) {
                if (children[child].hasChildNodes()) {
                    const cardname = children[child].childNodes[0].innerHTML;
                    if (cardname.toUpperCase().includes(term.toUpperCase())) {
                        children[child].classList.remove('hidden');
                    } else {
                        children[child].classList.add('hidden');
                    }
                }
            }
        }
    };
    this.refresh = function (params) {
        data = localStorage.getItem('favorites') ? JSON.parse(localStorage.getItem('favorites')) : [];

        while (favList.firstChild) {
            favList.removeChild(favList.firstChild);
        }
        data.forEach(function (item) {
            const queryParams = getQueryParams(item);
            let title = queryParams.title === "" ? "<unnamed card>" : queryParams.title.trim();
            let types = '[' + queryParams.type.trim() + '] ';
            let price = queryParams.price.replace('^', 'P').trim();
            title = queryParams.creator === "" ? title : title + ' ' + queryParams.creator.split(" ")[0];
            switch (queryParams.size) {
                case '0':
                    title = queryParams.type.trim() === "" ? title : types + title;
                    title = price === "" ? title : price + ' ' + title;
                    title = "Card: " + title;
                    break;
                case '1':
                    title = queryParams.type.trim() === "" ? title : types + title;
                    title = price === "" ? title : price + ' ' + title;
                    title = "Landscape: " + title;
                    break;
                case '3':
                    title = queryParams.type.trim() === "" ? title : types + title;
                    title = price === "" ? title : price + ' ' + title;
                    title = "Base Card: " + title;
                    break;
                case '4':
                    title = "Pile Marker: " + title;
                    break;
                case '5':
                    title = "Mat: " + title;
                    break;
            }

            let li = document.createElement("li");
            let a = document.createElement("a");
            a.setAttribute('href', location.pathname + item);
            a.appendChild(document.createTextNode(title));
            if (item === document.location.search) {
                li.setAttribute('class', "active");
            }
            li.appendChild(a);
            let bttnDel = document.createElement("button");
            bttnDel.setAttribute('class', "delete");
            bttnDel.setAttribute('onclick', name + ".delete('" + item + "')");
            let imgDel = document.createElement("img");
            imgDel.setAttribute('src', "assets/icon-delete.png");
            bttnDel.appendChild(imgDel);
            bttnDel.appendChild(document.createTextNode("Delete"));
            li.appendChild(bttnDel);
            favList.appendChild(li);
        });
    };
}
