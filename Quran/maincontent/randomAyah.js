console.log("R Clicked");
const rbtn = document.getElementById("rbtn");
randomButton.addEventListener('click', function () {
    console.log("R Clicked");
    let randomAyah = document.getElementById('random-ayah');
    var randomSura = generateRandomNumber(0, 113);
    var maxAyah = surasTashkeel[randomSura].children.length;
    maxAyah--;
    var randomAyahNumber = generateRandomNumber(0, maxAyah);

    randomAyah.innerText = surasTashkeel[randomSura].getAttribute('name') + " [" + (randomSura + 1) + ":" + (randomAyahNumber + 1) + "]"
        + "\n" + surasTashkeel[randomSura].children[randomAyahNumber].getAttribute('text')
        + '\n\n' + surasTafsirJalalyn[randomSura].children[randomAyahNumber].getAttribute('text')
        + '\n\n' + surasEnglish[randomSura].children[randomAyahNumber].getAttribute('text');

});

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
