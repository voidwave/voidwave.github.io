//بسم الله الرحمن الرحيم
//Majed Altaemi : voidwave.com

//check if mobile or not
var isMobile = false;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
}
console.log("isMobile= " + isMobile);

//storing iframe data, so instead of just hiding the iframe but still have the data
//running in the background, we remove it from the div and add it when it launches from here
const FramesContentHTML = [
    '<iframe style="width:100%; height:100%;"src="https://www.youtube.com/embed/videoseries?list=PLCyM3qNxv8UyJ2vV6gZb3smWyrJB5fnGq"title="YouTube video player" frameborder="0"allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"allowfullscreen></iframe>',
    '<iframe style="width:100%; height:100%; border: none;" src="https://voidwave.github.io/twitter.html"></iframe>',
    '<iframe src="https://albumizr.com/skins/bandana/index.php?key=I33m#1" scrolling="no" frameborder="0" allowfullscreen  width="100%" height="100%"></iframe>',
    '<iframe style="width:100%; height:100%; border: none;" src="primejinn/index.html"></iframe>'
]
const windows = document.getElementsByClassName('window');
const closeButtons = document.getElementsByClassName('close-button');
const maxButtons = document.getElementsByClassName('max-button');
const Frames = document.getElementsByClassName("frame");
const windowBars = document.getElementsByClassName("draggable");
const icons = document.getElementsByClassName('icon');
const sidepanel = document.getElementsByClassName('side-panel');

//hide windows
for (var i = 0; i < windows.length; i++) {
    windows[i].style.width = '60%';
    windows[i].style.display = 'none';
}
//show youtube window
windows[0].style.display = 'block';

//hide everything on mobile except for youtube frame
//and scale it correctly
if (isMobile) {
    sidepanel[0].style.display = 'none';
    windowBars[0].style.display = 'none';
    closeButtons[0].style.display = 'none';
    maxButtons[0].style.display = 'none';
    windows[0].style.width = '100%';
    windows[0].style.height = '85%';
    windows[0].style.right = '0px';
    windows[0].style.border = 'none';
}

// Add an event listener to the close button to toggle the window
for (var i = 0; i < closeButtons.length; i++) {
    (function (index) {
        closeButtons[index].addEventListener('click', () => AddRemove(closeButtons[index].parentNode, index), false);
    })(i);
}

// Add an event listener to the icons to toggle the window
for (var i = 0; i < icons.length; i++) {
    (function (index) {
        icons[index].addEventListener('click', () => AddRemove(closeButtons[index].parentNode, index), false);
    })(i);
}

// Add an event listener to the window bars to toggle maximize and minimize window
for (var i = 0; i < windowBars.length; i++) {
    (function (index) {
        windowBars[index].addEventListener('dblclick', () => MaxMinWindow(windowBars[index].parentNode), false);
    })(i);
}

// Add an event listener to the max buttons to toggle maximize and minimize window
for (var i = 0; i < maxButtons.length; i++) {
    (function (index) {
        maxButtons[index].addEventListener('click', () => MaxMinWindow(maxButtons[index].parentNode), false);
    })(i);
}


function MaxMinWindow(elmnt) {
    // Max
    if (elmnt.style.width === '60%') {
        // Show the iframe
        BringToFront(elmnt);
        elmnt.style = "width: calc(100% - 110px);height: calc(100% - 50px);left: 100px;top: 35px; z-index:10";
    } else {
        // Min
        elmnt.style.top = '10%'
        elmnt.style.left = '100px'
        elmnt.style.width = '60%'
        elmnt.style.height = '60%'
    }

}

//here iframe data is toggled in or off the div
function AddRemove(elmnt, index) {

    if (elmnt.style.display === 'none') {
        // Show the iframe
        unfade(elmnt);
        console.log(Frames[index]);
        Frames[index].innerHTML = FramesContentHTML[index];
    } else {
        // Hide the iframe
        fade(elmnt);
        Frames[index].innerHTML = '';
    }
}

function BringToFront(elmnt) {
    for (var i = 0; i < windows.length; i++) {
        console.log(windows[i].style.zIndex);
        windows[i].style.zIndex = '1';
    }
    elmnt.style.zIndex = '10';
}

function MinimizeAllWindows() {
    for (var i = 0; i < windows.length; i++) {
        windows[i].style.width = '60%';
        windows[i].style.height = '60%';
    }
}

//adding the drag event to window bars
for (var i = 0; i < windows.length; i++) {
    dragElement(windows, i);
}

function dragElement(elmnt, index) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (elmnt[index].getElementsByClassName("draggable")) {
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
        MinimizeAllWindows();
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
        //.style.zIndex = '10';
        BringToFront(elmnt[index]);
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

    BringToFront(element);
}