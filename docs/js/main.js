let templateSize = 0; //save globally
const templateSizeCanvas = [0, 1, 0, 0, 1, 2];

Array.prototype.remove = function () {
    let what, a = arguments,
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

    const colorDropdowns = /** @type {NodeListOf<HTMLSelectElement>} */ document.getElementsByName("normalcolor");

    for (let dropdown of colorDropdowns) {
        for (let color of normalColorFactorLists){
            const option = document.createElement("option");
            option.textContent = color[0];
            dropdown.appendChild(option);
        }
        for (let text of ["CUSTOM", "EXTRA CUSTOM"]) {
            const customOption = document.createElement("option");
            customOption.textContent = text;
            dropdown.appendChild(customOption);
        }
        dropdown.selectedIndex = 0;
        dropdown.oldIndex = -1;
    }

    const customColorIndex = [normalColorFactorLists.length, normalColorFactorLists.length+1];

    const canvases = document.getElementsByClassName("myCanvas");
    let images = [];
    let imagesLoaded = false;

    // const currentColorIndex = [0, 0];

    let recolorFactorList = [
        [0.75, 1.1, 1.35, 0, 0, 0, 1, 2, 3, 4, 5, 6],
        [0.75, 1.1, 1.35, 0, 0, 0, 1, 2, 3, 4, 5, 6]
    ];

    let recoloredImages = [];
    let isEachColorDark = [false, false];

    function isColorDark(i) {
        const color = (colorDropdowns[i].selectedIndex >= customColorIndex[i]) ?
            recolorFactorList[i] :
            normalColorFactorLists[colorDropdowns[i].selectedIndex - i][1];
        return color.slice(0, 3).reduce((total, num) => total + parseFloat(num)) <= 1.5;
    }


    function updateIsEachColorDark() {
        isEachColorDark[0] = isColorDark(0);
        isEachColorDark[1] = colorDropdowns[1].selectedIndex === 0 ? isEachColorDark[0] : isColorDark(1);

        const splitSelector = document.getElementById('color2splitselector');

        const showSelector = (
            isEachColorDark[0] === isEachColorDark[1] &&
            colorDropdowns[1].selectedIndex !== 0 &&
            colorDropdowns[0].selectedIndex + 1 !== colorDropdowns[1].selectedIndex
        );

        if (showSelector) {
            splitSelector.removeAttribute("style");
        } else {
            splitSelector.setAttribute("style", "display:none");
        }
    }

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
                if (colorDropdowns[colorID].selectedIndex === customColorIndex[colorID])
                    recolorFactors = recolorFactorList[colorID].slice(0, 3);
                else if (colorDropdowns[colorID].selectedIndex > customColorIndex[colorID])
                    recolorFactors = recolorFactorList[colorID];
                else
                    recolorFactors = normalColorFactorLists[colorDropdowns[colorID].selectedIndex - colorID][1];
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

        updateIsEachColorDark();

        const fields = {
            creator: document.getElementById("creator").value,
            credit: document.getElementById("credit").value,
            description: document.getElementById("description").value,
            description2: document.getElementById("description2").value,
            title: document.getElementById("title").value,
            title2: document.getElementById("title2").value,
            heirloom: document.getElementById("type2").value,
            type: document.getElementById("type").value,
            price: document.getElementById("price").value,
            preview: document.getElementById("preview").value,
            color2split: document.getElementById("color2split").value,
            color1: colorDropdowns[0].selectedIndex, // currentColorIndex[0],
            color2: colorDropdowns[1].selectedIndex - 1,
            pictureX: parseFloat(document.getElementById("picture-x").value),
            pictureY: parseFloat(document.getElementById("picture-y").value),
            pictureZoom: document.getElementById("picture-zoom").value,
            extraBoldKeys: document.getElementById("boldkeys").value,
        };

        const painterTypes = [CardPainter, EventPainter, DoubleCardPainter, BaseCardPainter, PileMarkerPainter, MatPainter];

        const painter = new painterTypes[templateSize](
            canvases[templateSizeCanvas[templateSize]].getContext("2d"),
            images,
            fields,
            isEachColorDark,
            getRecoloredImage,
        );

        painter.extra.recolorFactors = [false, false];
        painter.draw();

        updateURL();

        document.getElementById("load-indicator").setAttribute("style", "display:none;");
        canvases[0].parentNode.removeAttribute("data-status");
    }

    let nextDrawInstruction = 0;

    function queueDraw(time = 1500) {
        if (nextDrawInstruction)
            window.clearTimeout(nextDrawInstruction);
        nextDrawInstruction = window.setTimeout(draw, time);
    }

    function updateURL() {
        var arguments = "?";
        for (var i = 0; i < simpleOnChangeInputFieldIDs.length; ++i) {
            arguments += simpleOnChangeInputFieldIDs[i] + "=" + encodeURIComponent(document.getElementById(simpleOnChangeInputFieldIDs[i]).value) + "&";
            if (templateSize === 2 && i < simpleOnChangeButOnlyForSize2InputFieldIDs.length)
                arguments += simpleOnChangeButOnlyForSize2InputFieldIDs[i] + "=" + encodeURIComponent(document.getElementById(simpleOnChangeButOnlyForSize2InputFieldIDs[i]).value) + "&";
        }
        arguments += "picture=" + encodeURIComponent(document.getElementById("picture").value) + "&";
        arguments += "expansion=" + encodeURIComponent(document.getElementById("expansion").value) + "&";
        arguments += "custom-icon=" + encodeURIComponent(document.getElementById("custom-icon").value);
        for (let i = 0; i < colorDropdowns.length; ++i) {
            switch (customColorIndex[i] - colorDropdowns[i].selectedIndex) {
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
                    arguments += "&color" + i + "=" + colorDropdowns[i].selectedIndex;
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
    for (let key in icons) {
        const li = document.createElement("li");
        li.textContent = ": " + icons[key][0];
        const span = document.createElement("span");
        span.classList.add("def");
        span.textContent = key.replace("\\", "");
        li.insertBefore(span, li.firstChild);
        legend.insertBefore(li, legend.firstChild);
    }

    for (let key in icons)
        sources.push(icons[key][0] + ".png");

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
                    recoloredImages[2] = false;
                    recoloredImages[8] = false;
                    recoloredImages[11] = false;
                    recoloredImages[15] = false;
                    recoloredImages[16] = false;

                    recoloredImages[imageID] = false;
                    recoloredImages[imageID + 6] = false;
                    recoloredImages[imageID + 9] = false;
                    if (imageID === 0)
                        recoloredImages[10] = false;
                    recoloredImages[12] = false;
                    recoloredImages[18] = false;
                    recoloredImages[19] = false;
                    recoloredImages[20] = false;
                    recoloredImages[23] = false;
                    recolorFactorList[imageID][i % 12] = val;
                    updateIsEachColorDark();
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

    function normalColorDropDownChanges(colorID, event) {
        const dropdown = event.currentTarget;
        if (dropdown.oldIndex >= 10 || dropdown.selectedIndex >= 10) { //potentially recoloring the supposedly Uncolored images
            recoloredImages[8] = false;
            recoloredImages[11] = false;
            recoloredImages[15] = false;
            recoloredImages[16] = false;
        }
        recoloredImages[colorID] = false;
        recoloredImages[colorID + 6] = false;
        recoloredImages[colorID + 9] = false;
        if (colorID === 0)
            recoloredImages[10] = false;
        recoloredImages[2] = false;
        recoloredImages[12] = false;
        recoloredImages[18] = false;
        recoloredImages[19] = false;
        recoloredImages[20] = false;
        recoloredImages[23] = false;

        const customColorFields = dropdown.nextElementSibling;
        const extraCustomColorFields = customColorFields.nextElementSibling;

        const delta = customColorIndex[colorID] - dropdown.selectedIndex;

        if (delta <= 0)
            customColorFields.removeAttribute("style");
        else
            customColorFields.setAttribute("style", "display:none;");

        if (delta === -1)
            extraCustomColorFields.removeAttribute("style");
        else
            extraCustomColorFields.setAttribute("style", "display:none;");

        if (delta === -1 && colorID === 0 && !alreadyNeededToDetermineCustomAccentColors) {
            alreadyNeededToDetermineCustomAccentColors = true;
            for (let j = 6; j < 12; ++j)
                recolorFactorList[0][j] = recolorInputs[j].value = genericCustomAccentColors[templateSize & 1][j];
        }

        updateIsEachColorDark();
        queueDraw(1);
        dropdown.oldIndex = dropdown.selectedIndex;
    }

    colorDropdowns[0].onchange = (event) => normalColorDropDownChanges(0, event);
    colorDropdowns[1].onchange = (event) => normalColorDropDownChanges(1, event);

    const templateSizeInputs = document.getElementsByName("size");
    for (const template of templateSizeInputs)
        template.onchange = function () {
            templateSize = parseInt(this.value);
            document.body.className = this.id;
            document.getElementById("load-indicator").removeAttribute("style");
            queueDraw(250);
        };

    //ready to begin: load information from query parameters
    const query = getQueryParams(document.location.search);
    for (const key in query) {
        const value = query[key];
        switch (key) {
            case "color0":
                colorDropdowns[0].selectedIndex = parseInt(value);
                break;
            case "color1":
                colorDropdowns[1].selectedIndex = parseInt(value);
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
                    colorDropdowns[id].selectedIndex = customColorIndex[id];
                    colorDropdowns[id].nextElementSibling.removeAttribute("style");
                    recolorFactorList[id][matches[2]] = recolorInputs[12 * id + parseInt(matches[2])].value = parseFloat(value);
                } else {
                    matches = key.match(/^c(\d)\.(\d)\.(\d)$/);
                    if (matches) {
                        alreadyNeededToDetermineCustomAccentColors = true;
                        const id = matches[1];
                        colorDropdowns[id].selectedIndex = customColorIndex[id] + 1;
                        colorDropdowns[id].nextElementSibling.removeAttribute("style");
                        colorDropdowns[id].nextElementSibling.nextElementSibling.removeAttribute("style");
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
                document.getElementById(id).value = document.getElementById(id.slice(0, -1)).value;
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


    updateIsEachColorDark();

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

    function cardFilename(title, creator) {
        let fileName = title.length > 0 ? title : "card";
        if (creator.length > 0)
            fileName += "_" + creator.split(" ")[0];
        return fileName.replace(/ /g, "_") + '.png';
    }

    const link = document.getElementById("download");
    const canvas = (document.getElementsByClassName("myCanvas"))[templateSizeCanvas[templateSize]];
    const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const title = document.getElementById("title").value.trim();
    const creator = document.getElementById("creator").value.trim();
    link.setAttribute('download', cardFilename(title, creator));
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
