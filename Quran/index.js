
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
var SurahText;
var surahButtons;
var showNav;
LoadSuraTashkeel('https://voidwave.com/Quran/QuranText/Quran/quran-simple.xml');
LoadSuraClean('https://voidwave.com/Quran/QuranText/Quran/quran-simple-clean.xml');
LoadSuraEnglish('https://voidwave.com/Quran/QuranText/English-Translation/en.sahih.xml');
LoadSuraTafsirJalalyn('https://voidwave.com/Quran/QuranText/Arabic-Tafsir/ar.jalalayn.xml');
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
    showNav = document.getElementById('show-nav');
    SurahText = document.getElementById('maincontent');
    randomButton = document.getElementById("random-button");
    randomSurahButton = document.getElementById("randomSurah-button");
    var list = document.getElementById("nav");

    for (var i = 0; i < 114; i++) {
        // Create a new surah list item
        var surahItem = document.createElement("button");
        surahItem.className = "surah";
        list.appendChild(surahItem);
    }

    showNav.addEventListener('click', function () {
        if (list.style.display == 'none') {
            list.style.display = 'grid';
            SurahText.innerHTML = '';
        }
        else
            list.style.display = 'none';

    });

    //random ayah
    randomButton.addEventListener('click', function () {
        var randomSura = generateRandomNumber(0, 113);
        var maxAyah = surasTashkeel[randomSura].children.length;
        maxAyah--;
        var randomAyahNumber = generateRandomNumber(0, maxAyah);

        SurahText.innerHTML = surasTashkeel[randomSura].getAttribute('name') + " [" + (randomSura + 1) + ":" + (randomAyahNumber + 1) + "]"
            + '<h2 style="color: greenyellow;">  ' + " { " + surasTashkeel[randomSura].children[randomAyahNumber].getAttribute('text') + " } " + '</h2>'
            + "<h3>" + surasTafsirJalalyn[randomSura].children[randomAyahNumber].getAttribute('text') + "</h3>"
            + "<h3>" + surasEnglish[randomSura].children[randomAyahNumber].getAttribute('text') + "</h3>"
            + '<br>';

    });

    //random surah
    randomSurahButton.addEventListener('click', function () {
        var randomSura = generateRandomNumber(0, 113);
        SurahText.innerHTML = "<h3>" + surasTashkeel[randomSura].getAttribute('name') + " [" + (randomSura + 1) + "]" + "</h3>";
        SurahText.innerHTML += '<h3 style="text-align: center;">' + surasTashkeel[0].children[0].getAttribute('text') + '</h3>';
        for (var a = 0; a < surasTashkeel[randomSura].children.length; a++)
            SurahText.innerHTML += '<h2 style="color: greenyellow; ">  ' + surasTashkeel[randomSura].children[a].getAttribute('text') + " { " + (a + 1) + " } " + '</h2>'
                + '<h3 >' + surasTafsirJalalyn[randomSura].children[a].getAttribute('text') + "</h3>"
                + '<h3 >' + surasEnglish[randomSura].children[a].getAttribute('text') + "</h3>"
                + '<br>';
    });
};

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


setTimeout(function () {
    surahButtons = document.getElementsByClassName("surah");

}, 100);

setTimeout(function () {
    // Get the list items
    for (var i = 0; i < 114; i++) {
        // Create a new surah list item
        surahButtons[i].innerHTML = surasTashkeel[i].getAttribute('name') + " " + (i + 1);
        (function (index) {
            surahButtons[index].addEventListener('click', () => ViewSurah(index), false);
        })(i);
    }
}, 500);


function ViewSurah(index) {
    document.getElementById("nav").style.display = 'none';
    SurahText.innerHTML = "<h3>" + surasTashkeel[index].getAttribute('name') + " [" + (index + 1) + "]" + "</h3>";
    SurahText.innerHTML += '<h3 style="text-align: center;">' + surasTashkeel[0].children[0].getAttribute('text') + '</h3>';
    for (var a = 0; a < surasTashkeel[index].children.length; a++)
        SurahText.innerHTML += '<h2 style="color: greenyellow; ">  ' + surasTashkeel[index].children[a].getAttribute('text') + " { " + (a + 1) + " } " + '</h2>'
            + '<h3 >' + surasTafsirJalalyn[index].children[a].getAttribute('text') + "</h3>"
            + '<h3 >' + surasEnglish[index].children[a].getAttribute('text') + "</h3>"
            + '<br>';


}