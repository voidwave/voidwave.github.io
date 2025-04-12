
function loadHtml(id, filename) {

    // console.log('div id: ${id}, filename: ${filename}');
    let xhttp;
    let element = document.getElementById(id);
    let file = filename;

    if (file) {
        // console.log(file);
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

var surasTashkeel;
var surasClean;
var surasEnglish;
var surasTafsirJalalyn;
var randomButton;
var clearButton;
var SurahText;
var surahButtons;
var showNav;
let showTafsir = true; // Flag to track the visibility of Tafsir
let showEnglish = true; // Flag to track the visibility of English


Promise.all([
    loadXml('https://voidwave.com/Quran/QuranText/Quran/quran-uthmani.xml').then(data => surasTashkeel = data),
    loadXml('https://voidwave.com/Quran/QuranText/Quran/quran-simple-clean.xml').then(data => surasClean = data),
    loadXml('https://voidwave.com/Quran/QuranText/English-Translation/en.sahih.xml').then(data => surasEnglish = data),
    loadXml('https://voidwave.com/Quran/QuranText/Arabic-Tafsir/ar.jalalayn.xml').then(data => surasTafsirJalalyn = data)
]).then(() => {
    console.log("All XML files loaded successfully!");
    initializePage();
    setupSearchBar(); // Call the function that initializes the page
}).catch(error => {
    console.error("Error loading XML files:", error);
});


function loadXml(path) {
    return fetch(path)
        .then(response => response.text())
        .then(xml => {
            let parser = new DOMParser();
            let xmlDOM = parser.parseFromString(xml, 'application/xml');
            return xmlDOM.querySelectorAll('sura'); // Return the parsed sura elements
        });
}

function initializePage() {
    showNav = document.getElementById('show-nav');
    SurahText = document.getElementById('maincontent');
    randomButton = document.getElementById("random-button");
    randomSurahButton = document.getElementById("randomSurah-button");
    clearButton = document.getElementById('clear-button');
    var list = document.getElementById("nav");
    var toggleTafsirButton = document.getElementById("toggle-tafsir"); // Get the toggle button
    var toggleEnglishButton = document.getElementById("toggle-english"); // Get the toggle button

    toggleTafsirButton.addEventListener('click', function () {
        // Toggle the visibility flags
        showTafsir = !showTafsir;


        // Optionally, update the button text to reflect the current state
        toggleTafsirButton.innerText = showTafsir ? "HIDE TAFSIR" : "SHOW TAFSIR";

        // Re-render the content based on the new visibility state
        if (selectedSurah !== null) {
            ViewSurah(selectedSurah);
        }
    });
    toggleEnglishButton.addEventListener('click', function () {
        // Toggle the visibility flags
        showEnglish = !showEnglish;

        // Optionally, update the button text to reflect the current state
        toggleEnglishButton.innerText = showEnglish ? "HIDE ENGLISH" : "SHOW ENGLISH";

        // Re-render the content based on the new visibility state
        if (selectedSurah !== null) {
            ViewSurah(selectedSurah);
        }
    });


    for (var i = 0; i < 114; i++) {
        var surahItem = document.createElement("button");
        surahItem.className = "surah";
        list.appendChild(surahItem);
    }

    showNav.addEventListener('click', function () {
        if (list.style.display == 'none') {
            list.style.display = 'grid';
            SurahText.innerHTML = '';
        } else {
            list.style.display = 'none';
        }
    });

    // Random Ayah button functionality
    randomButton.addEventListener('click', function () {
        document.getElementById('search-results').innerHTML = '';

        var randomSura = generateRandomNumber(0, 113);
        selectSurah(randomSura);
        var maxAyah = surasTashkeel[randomSura].children.length - 1;
        var randomAyahNumber = generateRandomNumber(0, maxAyah);

        SurahText.innerHTML = surasTashkeel[randomSura].getAttribute('name') + " [" + (randomAyahNumber + 1) + ":" + (randomSura + 1) + "]"
            + '<h2 style="color: white;">  ' + " { " + surasTashkeel[randomSura].children[randomAyahNumber].getAttribute('text') + " } " + '</h2>'
            + (showTafsir ? '<h3 style="color: gray;">' + surasTafsirJalalyn[randomSura].children[randomAyahNumber].getAttribute('text') + "</h3>" : '')
            + (showEnglish ? "<h3 style='direction: ltr; color: gray;'>" + surasEnglish[randomSura].children[randomAyahNumber].getAttribute('text') + "</h3>" : '')
            + '<br>';
    });

    // Random Surah button functionality
    randomSurahButton.addEventListener('click', function () {
        document.getElementById('search-results').innerHTML = '';

        var randomSura = generateRandomNumber(0, 113);
        selectSurah(randomSura);
        SurahText.innerHTML = "<h3>" + surasTashkeel[randomSura].getAttribute('name') + " [" + (randomSura + 1) + "]" + "</h3>";
        SurahText.innerHTML += '<h3 style="text-align: center;">' + surasTashkeel[0].children[0].getAttribute('text') + '</h3>';
        for (var a = 0; a < surasTashkeel[randomSura].children.length; a++)
            SurahText.innerHTML += '<h2 style="color: white;">  ' + surasTashkeel[randomSura].children[a].getAttribute('text') + " { " + (a + 1) + " } " + '</h2>'
                + (showTafsir ? '<h3 style="color: gray;">' + surasTafsirJalalyn[randomSura].children[a].getAttribute('text') + "</h3>" : '')
                + (showEnglish ? "<h3 style='direction: ltr;color: gray;'>" + surasEnglish[randomSura].children[a].getAttribute('text') + "</h3>" : '')
                + '<br>';
    });
    // Clear button functionality
    clearButton.addEventListener('click', function () {
        // Clear the current surah and ayah
        SurahText.innerHTML = '';  // Clear the displayed surah and ayah

        // Clear search results
        document.getElementById('search-results').innerHTML = '';  // Clear the search results

        // Optionally, clear the search bar as well
        document.getElementById('search-bar').value = '';  // Clear the search bar input
        clearSurahSelection();
    });

    setTimeout(function () {
        surahButtons = document.getElementsByClassName("surah");
        for (var i = 0; i < 114; i++) {
            surahButtons[i].innerHTML = surasTashkeel[i].getAttribute('name') + " " + (i + 1);
            (function (index) {
                surahButtons[index].addEventListener('click', () => ViewSurah(index), false);
            })(i);
        }
    }, 100);
}

var selectedSurah = null; // Variable to track selected Surah

function setupSearchBar() {
    const searchBar = document.getElementById('search-bar');
    const resultsContainer = document.getElementById('search-results');

    searchBar.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        resultsContainer.innerHTML = ''; // Clear previous results

        if (query.length < 2) return; // Avoid overly short searches

        let matchCount = 0;

        if (selectedSurah === null) {
            // Search the entire Quran if no surah is selected
            for (let s = 0; s < surasClean.length; s++) {
                for (let a = 0; a < surasClean[s].children.length; a++) {
                    const cleanText = surasClean[s].children[a].getAttribute('text')?.toLowerCase();
                    if (cleanText && cleanText.includes(query)) {
                        matchCount++;

                        const surahName = surasTashkeel[s].getAttribute('name');
                        const cleanAyahText = surasClean[s].children[a].getAttribute('text');
                        const tashkeelAyahText = surasTashkeel[s].children[a].getAttribute('text');
                        const tafsir = surasTafsirJalalyn[s].children[a].getAttribute('text');
                        const english = surasEnglish[s].children[a].getAttribute('text');

                        // Step 1: Highlight the tashkeel ayah text based on the clean text and search query
                        const highlightedAyahText = highlightMatch(cleanAyahText, query);

                        const result = document.createElement('div');
                        result.style.padding = '10px';
                        result.style.borderBottom = '1px solid #ccc';
                        result.innerHTML = `
                           <h4>${surahName} [${a + 1}:${s + 1}]</h4>
                        <p style="color: white;">${highlightedAyahText}</p>` +
                            (showTafsir ? `<p style="color: gray;"><strong></strong> ${tafsir}</p>` : ``) +
                            (showEnglish ? `<p style="direction: ltr; color: gray;"><strong></strong> ${english}</p>` : ``);
                        resultsContainer.appendChild(result);
                    }
                }
            }
        } else {
            // Search only the selected surah
            const s = selectedSurah;
            for (let a = 0; a < surasClean[s].children.length; a++) {
                const cleanText = surasClean[s].children[a].getAttribute('text')?.toLowerCase();
                if (cleanText && cleanText.includes(query)) {
                    matchCount++;

                    const surahName = surasTashkeel[s].getAttribute('name');
                    const cleanAyahText = surasClean[s].children[a].getAttribute('text');
                    const tafsir = surasTafsirJalalyn[s].children[a].getAttribute('text');
                    const english = surasEnglish[s].children[a].getAttribute('text');
                    const highlightedAyahText = highlightMatch(cleanAyahText, query);

                    const result = document.createElement('div');
                    result.style.padding = '10px';
                    result.style.borderBottom = '1px solid #ccc';
                    result.innerHTML = `
                        <h4>${surahName} [${a + 1}:${s + 1}]</h4>
                        <p style="color: white;">${highlightedAyahText}</p>` +
                        (showTafsir ? `<p style="color: gray;"><strong></strong> ${tafsir}</p>` : ``) +
                        (showEnglish ? `<p style="direction: ltr; color: gray;"><strong></strong> ${english}</p>` : ``);
                    resultsContainer.appendChild(result);
                }
            }
        }

        if (matchCount === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
        }
    });
}
// Function to select a surah (for example when a surah button is clicked)
function selectSurah(surahIndex) {
    selectedSurah = surahIndex;  // Store the selected surah index
    // Optionally, highlight the selected surah in your UI (e.g., add a class to the button)
    // Refresh the results based on the selected surah
    document.getElementById('search-bar').dispatchEvent(new Event('input')); // Trigger search based on the new selection
}

// Reset the search to search the entire Quran
function clearSurahSelection() {
    selectedSurah = null;  // Clear the selected surah
    document.getElementById('search-bar').dispatchEvent(new Event('input')); // Trigger search based on the new state
}
function highlightMatch(text, query) {
    // Step 1: Escape the query to make it safe for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Step 2: Find the positions of the matches in the clean text
    let match;
    let indices = [];
    while ((match = regex.exec(text)) !== null) {
        indices.push([match.index, match.index + match[0].length]);
    }

    // Step 3: Highlight the matched text in the tashkeel text
    let highlightedText = text;
    for (let i = indices.length - 1; i >= 0; i--) {
        let [start, end] = indices[i];
        highlightedText = highlightedText.substring(0, start) +
            '<mark>' + highlightedText.substring(start, end) + '</mark>' +
            highlightedText.substring(end);
    }

    // console.log('highlightMatch result:', highlightedText); // Debug
    return highlightedText;
}

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
    selectSurah(index);
    document.getElementById("nav").style.display = 'none';
    SurahText.innerHTML = "<h3>" + surasTashkeel[index].getAttribute('name') + " [" + (index + 1) + "]" + "</h3>";
    SurahText.innerHTML += '<h3 style="text-align: center;">' + surasTashkeel[0].children[0].getAttribute('text') + '</h3>';
    for (var a = 0; a < surasTashkeel[index].children.length; a++)
        SurahText.innerHTML += '<h2 style="color: white; ">  ' + surasTashkeel[index].children[a].getAttribute('text') + " { " + (a + 1) + " } " + '</h2>'
            + (showTafsir ? '<h3 style="color: gray;">' + surasTafsirJalalyn[index].children[a].getAttribute('text') + "</h3>" : '')
            + (showEnglish ? "<h3 style='direction: ltr; color: gray;'>" + surasEnglish[index].children[a].getAttribute('text') + "</h3>" : '')
            + '<br>';


}