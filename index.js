//check if mobile or not
var isMobile = false;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
}

console.log("isMobile= " + isMobile);
var ytwindow = document.getElementsByClassName("yt-window");
var twwindow = document.getElementsByClassName("tw-window");
var glwindow = document.getElementsByClassName("gl-window");

const ytCloseButton = document.getElementById('yt-toggle-button');
const twCloseButton = document.getElementById('tw-toggle-button');
const glCloseButton = document.getElementById('gl-toggle-button');

const ytbar = document.getElementById('yt-bar');
const twbar = document.getElementById('tw-bar');
const glbar = document.getElementById('gl-bar');

const ytIcon = document.getElementById('yt-icon-id');
const twIcon = document.getElementById('tw-icon-id');
const glIcon = document.getElementById('gl-icon-id');

twwindow[0].style.display = 'none';
glwindow[0].style.display = 'none';

//hide controls if mobile

if (isMobile) {

    ytbar.style.display = 'none';
    twbar.style.display = 'none';
    ytCloseButton.style.display = 'none';
    twCloseButton.style.display = 'none';

    twwindow[0].style.display = 'none';

    ytIcon.style.display = 'none';
    twIcon.style.display = 'none';
    glIcon.style.display = 'none';

    ytwindow[0].style.width = '100%';
    ytwindow[0].style.height = '85%';
}


// function ChangeWindowSize(elmnt, scale) {
//     elmnt[0].style.transition = "transform 1s";
//     elmnt[0].style.transform = "scale(" + scale + ")";
// }


// Add an event listener to the button to toggle the iframe
ytCloseButton.addEventListener('click', () => ShowHideWindow(ytwindow), false);
ytIcon.addEventListener('dblclick', () => ShowHideWindow(ytwindow), false);
ytbar.addEventListener('dblclick', () => MaxMinWindow(ytwindow), false);

twCloseButton.addEventListener('click', () => ShowHideWindow(twwindow), false);
twIcon.addEventListener('dblclick', () => ShowHideWindow(twwindow), false);
twbar.addEventListener('dblclick', () => MaxMinWindow(twwindow), false);

glCloseButton.addEventListener('click', () => ShowHideWindow(glwindow), false);
glIcon.addEventListener('dblclick', () => ShowHideWindow(glwindow), false);
glbar.addEventListener('dblclick', () => MaxMinWindow(glwindow), false);

function MaxMinWindow(elmnt) {
    // Max
    if (elmnt[0].style.width === '60%') {
        // Show the iframe
        elmnt[0].style.top = '20px'
        elmnt[0].style.left = '0px'
        elmnt[0].style.width = '100%'
        elmnt[0].style.height = '95%'

    } else {
        // Min
        elmnt[0].style.top = '10%'
        elmnt[0].style.left = '10px'
        elmnt[0].style.width = '60%'
        elmnt[0].style.height = '60%'

    }
}

function ShowHideWindow(elmnt) {
    // Check the current display value of the iframe
    if (elmnt[0].style.display === 'none') {
        // Show the iframe
        unfade(elmnt[0]);

    } else {
        // Hide the iframe
        fade(elmnt[0]);

    }
}

function BringToFront(elmnt) {
    // Check the current display value of the iframe
    elmnt[0].style.zIndex = '10';
}

dragElement(document.getElementById("yt-icon-id"));
dragElement(document.getElementById("yt-window-id"));

dragElement(document.getElementById("tw-icon-id"));
dragElement(document.getElementById("tw-window-id"));

dragElement(document.getElementById("gl-icon-id"));
dragElement(document.getElementById("gl-window-id"));

function dragElement(elmnt) {



    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (elmnt.getElementsByClassName("draggable")) {
        // if present, the header is where you move the DIV from:
        elmnt.getElementsByClassName("draggable")[0].onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
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

        twwindow[0].style.zIndex = '1';
        ytwindow[0].style.zIndex = '1';
        glwindow[0].style.zIndex = '1';
        twwindow[0].style.width = '60%'
        twwindow[0].style.height = '60%'
        glwindow[0].style.width = '60%'
        glwindow[0].style.height = '60%'
        ytwindow[0].style.width = '60%'
        ytwindow[0].style.height = '60%'
        ytIcon.style.zIndex = '0';
        twIcon.style.zIndex = '0';
        glIcon.style.zIndex = '0';
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        elmnt.style.zIndex = '10';
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
    var timer = setInterval(function () {
        if (op >= 1) {
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 5);
}