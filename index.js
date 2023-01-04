//check if mobile or not
var isMobile = false;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
}

console.log("isMobile= " + isMobile);
var ytwindow = document.getElementById("yt-window-id");
var twwindow = document.getElementById("tw-window-id");
var glwindow = document.getElementById("gl-window-id");
var pongwindow = document.getElementById("pong-window-id");

const ytCloseButton = document.getElementById('yt-toggle-button');
const twCloseButton = document.getElementById('tw-toggle-button');
const glCloseButton = document.getElementById('gl-toggle-button');
const pongCloseButton = document.getElementById('pong-toggle-button');

const ytMaxButton = document.getElementById('yt-max-button');
const twMaxButton = document.getElementById('tw-max-button');
const glMaxButton = document.getElementById('gl-max-button');
const pongMaxButton = document.getElementById('pong-max-button');

const ytbar = document.getElementById('yt-bar');
const twbar = document.getElementById('tw-bar');
const glbar = document.getElementById('gl-bar');
const pongbar = document.getElementById('pong-bar');

const ytIcon = document.getElementById('yt-icon-id');
const twIcon = document.getElementById('tw-icon-id');
const glIcon = document.getElementById('gl-icon-id');
const pongIcon = document.getElementById('pong-icon-id');

const sidepanel = document.getElementsByClassName('side-panel');

twwindow.style.width = '60%';
pongwindow.style.width = '60%';
ytwindow.style.width = '60%';
glwindow.style.width = '60%';

twwindow.style.display = 'none';
glwindow.style.display = 'none';
pongwindow.style.display = 'none';
//hide controls if mobile

if (isMobile) {

    sidepanel[0].style.display = 'none';
    ytbar.style.display = 'none';
    twbar.style.display = 'none';
    ytCloseButton.style.display = 'none';
    twCloseButton.style.display = 'none';
    ytMaxButton.style.display = 'none';

    twwindow.style.display = 'none';

    ytIcon.style.display = 'none';
    twIcon.style.display = 'none';
    glIcon.style.display = 'none';
    pongIcon.style.display = 'none';
    ytwindow.style.width = '100%';
    ytwindow.style.height = '85%';
    ytwindow.style.right = '0px';
    ytwindow.style.border = 'none';
}


// function ChangeWindowSize(elmnt, scale) {
//     elmnt[0].style.transition = "transform 1s";
//     elmnt[0].style.transform = "scale(" + scale + ")";
// }


// Add an event listener to the button to toggle the iframe
ytCloseButton.addEventListener('click', () => AddRemoveYT(ytwindow), false);
ytIcon.addEventListener('click', () => AddRemoveYT(ytwindow), false);
ytbar.addEventListener('dblclick', () => MaxMinWindow(ytwindow), false);
ytMaxButton.addEventListener('click', () => MaxMinWindow(ytwindow), false);

twCloseButton.addEventListener('click', () => AddRemoveTw(twwindow), false);
twIcon.addEventListener('click', () => AddRemoveTw(twwindow), false);
twbar.addEventListener('dblclick', () => MaxMinWindow(twwindow), false);
twMaxButton.addEventListener('click', () => MaxMinWindow(twwindow), false);

glCloseButton.addEventListener('click', () => AddRemoveGl(glwindow), false);
glIcon.addEventListener('click', () => AddRemoveGl(glwindow), false);
glbar.addEventListener('dblclick', () => MaxMinWindow(glwindow), false);
glMaxButton.addEventListener('click', () => MaxMinWindow(glwindow), false);

pongCloseButton.addEventListener('click', () => AddRemovePong(pongwindow), false);
pongIcon.addEventListener('click', () => AddRemovePong(pongwindow), false);
pongbar.addEventListener('dblclick', () => MaxMinWindow(pongwindow), false);
pongMaxButton.addEventListener('click', () => MaxMinWindow(pongwindow), false);

function MaxMinWindow(elmnt) {
    // Max
    if (elmnt.style.width === '60%') {
        // Show the iframe
        //elmnt.style.top = '35px'
        //elmnt.style.left = '100px'
        //elmnt.style.right = '100px'
        elmnt.style = "width: calc(100% - 110px);height: calc(100% - 50px);left: 100px;top: 35px;";
        //elmnt.style.height = '90%'
    } else {
        // Min
        elmnt.style.top = '10%'
        elmnt.style.left = '100px'
        //elmnt.style.right = '100px'
        elmnt.style.width = '60%'
        elmnt.style.height = '60%'
    }
}

function ShowHideWindow(elmnt) {
    // Check the current display value of the iframe
    if (elmnt.style.display === 'none') {
        // Show the iframe
        unfade(elmnt);

    } else {
        // Hide the iframe
        fade(elmnt);

    }
}

function AddRemovePong(elmnt) {
    pongDiv = document.getElementById("pongDiv");
    if (elmnt.style.display === 'none') {
        // Show the iframe
        unfade(elmnt);

        pongDiv.innerHTML = '<iframe id="pongIframe" src="pong.html" scrolling="no" frameborder="0" width="100%" height="100%"></iframe>';

    } else {
        // Hide the iframe
        fade(elmnt);
        pongDiv.innerHTML = '';
    }
}

function AddRemoveGl(elmnt) {
    Div = document.getElementById("glDiv");
    if (elmnt.style.display === 'none') {
        // Show the iframe
        unfade(elmnt);

        Div.innerHTML = ' <iframe src="https://albumizr.com/skins/bandana/index.php?key=I33m#1" scrolling="no" frameborder="0" allowfullscreen  width="100%" height="100%"></iframe>';

    } else {
        // Hide the iframe
        fade(elmnt);
        Div.innerHTML = '';
    }
}

function AddRemoveTw(elmnt) {
    Div = document.getElementById("twDiv");
    if (elmnt.style.display === 'none') {
        // Show the iframe
        unfade(elmnt);
        Div.innerHTML = '<iframe style="width:100%; height:100%; border: none;" src="https://voidwave.github.io/twitter.html"></iframe>';
    } else {
        // Hide the iframe
        fade(elmnt);
        Div.innerHTML = '';
    }
}

function AddRemoveYT(elmnt) {
    Div = document.getElementById("ytDiv");
    if (elmnt.style.display === 'none') {
        // Show the iframe
        unfade(elmnt);
        Div.innerHTML = '<iframe style="width:100%; height:100%;"src="https://www.youtube.com/embed/videoseries?list=PLCyM3qNxv8UyJ2vV6gZb3smWyrJB5fnGq"title="YouTube video player" frameborder="0"allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"allowfullscreen></iframe>';
    } else {
        // Hide the iframe
        fade(elmnt);
        Div.innerHTML = '';
    }
}
function BringToFront(elmnt) {
    // Check the current display value of the iframe
    elmnt.style.zIndex = '10';
}

//dragElement(document.getElementById("yt-icon-id"));
var windows = document.getElementsByClassName("window");
for (var i = 0; i < windows.length; i++) {
    dragElement(windows, i);
}
// //dragElement(document.getElementById("tw-icon-id"));
// dragElement(document.getElementById("tw-window-id"));
// // //dragElement(document.getElementById("gl-icon-id"));
// dragElement(document.getElementById("gl-window-id"));

function dragElement(elmnt, index) {


    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (elmnt[index].getElementsByClassName("draggable")) {
        // if present, the header is where you move the DIV from:
        elmnt[index].getElementsByClassName("draggable")[0].onmousedown = dragMouseDown;
    }
    else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt[index].onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {

        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {

        twwindow.style.zIndex = '1';
        ytwindow.style.zIndex = '1';
        glwindow.style.zIndex = '1';
        pongwindow.style.zIndex = '1';

        twwindow.style.width = '60%'
        twwindow.style.height = '60%'
        glwindow.style.width = '60%'
        glwindow.style.height = '60%'
        ytwindow.style.width = '60%'
        ytwindow.style.height = '60%'
        pongwindow.style.width = '60%'
        pongwindow.style.height = '60%'
        // ytIcon.style.zIndex = '0';
        // twIcon.style.zIndex = '0';
        // glIcon.style.zIndex = '0';

        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt[index].style.top = (elmnt[index].offsetTop - pos2) + "px";
        elmnt[index].style.left = (elmnt[index].offsetLeft - pos1) + "px";
        elmnt[index].style.zIndex = '10';
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}


function fade(element) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 15);
}

function unfade(element) {
    var op = 0.1;  // initial opacity
    element.style.display = 'block';
    twwindow.style.zIndex = '1';
    ytwindow.style.zIndex = '1';
    glwindow.style.zIndex = '1';
    pongwindow.style.zIndex = '1';


    var timer = setInterval(function () {
        if (op >= 1) {
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 5);

    element.style.zIndex = '10';
}