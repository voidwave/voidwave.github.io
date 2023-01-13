
function loadHtml(id, filename) {

    // console.log('div id: ${id}, filename: ${filename}');
    let xhttp;
    let element = document.getElementById(id);
    let file = filename;

    if (file) {
        console.log(file);
        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) { element.innerHTML = this.responseText; }
                if (this.status == 404) { element.innerHTML = "<h1>Page not found.</h1>"; }
            }
        }

        xhttp.open("GET", 'maincontent/' + file, true);
        xhttp.send();
        return;
    }
}


//load quran xml
//this was going to be a nice single function call for each with just the path
//but javascript, async, global variables and the fetch function... headache of undefined
//needed to assign the global function inside the fetch.then scope, assigning with return, or a parameter doesnt work

var surasTashkeel;// = LoadXml('QuranText/Quran/quran-simple.xml');
var surasClean;// = LoadXml('QuranText/Quran/quran-simple-clean.xml');
var surasEnglish;// = LoadXml('QuranText/English-Translation/en.sahih.xml');
var surasTafsirJalalyn;// = LoadXml('QuranText/Arabic-Tafsir/ar.jalalayn.xml');
var randomButton;


LoadSuraTashkeel('https://voidwave.github.io/Quran/QuranText/Quran/quran-simple.xml');
LoadSuraClean('https://voidwave.github.io/Quran/QuranText/Quran/quran-simple-clean.xml');
LoadSuraEnglish('https://voidwave.github.io/Quran/QuranText/English-Translation/en.sahih.xml');
LoadSuraTafsirJalalyn('https://voidwave.github.io/Quran/QuranText/Arabic-Tafsir/ar.jalalayn.xml');
// console.log("Check Quran Loaded: " + LoadXml('QuranText/Quran/quran-simple.xml').length);
//console.log("Check Quran Loaded: " + surasTashkeel.length);

function LoadSuraTashkeel(path) {
    let xmlContent = '';
    fetch(path).then((response) => {
        response.text().then((xml) => {
            xmlContent = xml;
            let parser = new DOMParser();
            let xmlDOM = parser.parseFromString(xmlContent, 'application/xml');
            surasTashkeel = xmlDOM.querySelectorAll('sura');
        });
    });
}

function LoadSuraClean(path) {
    let xmlContent = '';
    fetch(path).then((response) => {
        response.text().then((xml) => {
            xmlContent = xml;
            let parser = new DOMParser();
            let xmlDOM = parser.parseFromString(xmlContent, 'application/xml');
            surasClean = xmlDOM.querySelectorAll('sura');
        });
    });
}

function LoadSuraEnglish(path) {
    let xmlContent = '';
    fetch(path).then((response) => {
        response.text().then((xml) => {
            xmlContent = xml;
            let parser = new DOMParser();
            let xmlDOM = parser.parseFromString(xmlContent, 'application/xml');
            surasEnglish = xmlDOM.querySelectorAll('sura');
        });
    });
}

function LoadSuraTafsirJalalyn(path) {
    let xmlContent = '';
    fetch(path).then((response) => {
        response.text().then((xml) => {
            xmlContent = xml;
            let parser = new DOMParser();
            let xmlDOM = parser.parseFromString(xmlContent, 'application/xml');
            surasTafsirJalalyn = xmlDOM.querySelectorAll('sura');
        });
    });
}




window.onload = function () {
    randomButton = document.getElementById("random-button");
    randomSurahButton = document.getElementById("randomSurah-button");

    //random ayah
    randomButton.addEventListener('click', function () {
        console.log("R Clicked");
        let randomAyah = document.getElementById('maincontent');
        var randomSura = generateRandomNumber(0, 113);
        var maxAyah = surasTashkeel[randomSura].children.length;
        maxAyah--;
        var randomAyahNumber = generateRandomNumber(0, maxAyah);

        randomAyah.innerText = surasTashkeel[randomSura].getAttribute('name') + " [" + (randomSura + 1) + ":" + (randomAyahNumber + 1) + "]"
            + "\n" + " { " + surasTashkeel[randomSura].children[randomAyahNumber].getAttribute('text') + " } "
            + '\n\n' + surasTafsirJalalyn[randomSura].children[randomAyahNumber].getAttribute('text')
            + '\n\n' + surasEnglish[randomSura].children[randomAyahNumber].getAttribute('text');

    });

    //random surah
    randomSurahButton.addEventListener('click', function () {
        console.log("R Clicked");
        let randomAyah = document.getElementById('maincontent');
        var randomSura = generateRandomNumber(0, 113);

        randomAyah.innerHTML = "<h3>" + surasTashkeel[randomSura].getAttribute('name') + " [" + (randomSura + 1) + "]" + '\n\n\n' + "</h3>";
        randomAyah.innerHTML += '<h3 style="text-align: center;">' + surasTashkeel[0].children[0].getAttribute('text') + '\n\n\n' + '</h3>';
        for (var a = 0; a < surasTashkeel[randomSura].children.length; a++)
            randomAyah.innerHTML += '<h2 style="color: greenyellow;">  ' + surasTashkeel[randomSura].children[a].getAttribute('text') + " { " + (a + 1) + " } " + '</h2>'
                + "<h3>" + surasTafsirJalalyn[randomSura].children[a].getAttribute('text') + "</h3>"
                + "<h3>" + surasEnglish[randomSura].children[a].getAttribute('text') + "</h3>"
                + '<br>';


    });
};

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}