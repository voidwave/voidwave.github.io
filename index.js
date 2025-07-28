//بسم الله الرحمن الرحيم
//Majed Altaemi : voidwave.com

// Window Configuration Data
const windowData = [
    {
        id: 'youtube',
        title: 'DEV VIDEOS',
        iconClass: 'fa-youtube-square',
        iconColor: 'rgb(255, 0, 0)',
        initialTop: '50px',
        initialLeft: '100px',
        initialWidth: '500px',
        initialHeight: '500px',
        contentHTML: '<iframe style="width:100%; height:100%;" src="https://www.youtube.com/embed/videoseries?list=PLCyM3qNxv8UyJ2vV6gZb3smWyrJB5fnGq" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        contentType: 'iframe'
    },
    {
        id: 'steam',
        title: 'HYDROGEN ON STEAM',
        iconClass: 'fa-steam',
        iconColor: 'rgb(255, 153, 0)',
        initialTop: '50px',
        initialLeft: '35%',
        initialWidth: '500px',
        initialHeight: '250px',
        contentHTML: '<iframe style="width:100%; height:100%; border: none;" src="https://store.steampowered.com/widget/1746820/" frameborder="0" allowfullscreen="true" scrolling="no"></iframe>',
        contentType: 'iframe'
    },
    {
        id: 'gallery',
        title: 'GALLERY',
        iconClass: 'fa-camera-retro',
        iconColor: 'rgb(0, 114, 0)',
        initialTop: '60%',
        initialLeft: '100px',
        initialWidth: '500px',
        initialHeight: '350px',
        contentHTML: '<iframe src="https://voidwave.com/gallery/index.html" scrolling="yes" frameborder="0" allowfullscreen width="100%" height="100%"></iframe>', //https://albumizr.com/skins/bandana/index.php?key=I33m#1
        contentType: 'iframe'
    },
    {
        id: 'projects',
        title: 'RANDOM PROJECTS',
        iconClass: 'fa-folder',
        iconColor: 'rgb(184, 187, 0)',
        initialTop: '40%',
        initialLeft: '35%',
        initialWidth: '500px',
        initialHeight: '500px',
        contentHTML: '<iframe style="width:100%; height:100%; border: none;" src="projects.html"></iframe>',
        contentType: 'iframe'
    },
    // {
    //     id: 'hydrogen-updates',
    //     title: 'HYDROGEN UPDATES',
    //     iconClass: 'fa-qrcode',
    //     iconColor: 'rgb(255, 153, 0)',
    //     initialTop: '130px',
    //     initialLeft: '300px',
    //     initialWidth: '500px',
    //     initialHeight: '500px',
    //     contentURL: 'https://steamcommunity.com/app/1746820/allnews/',
    //     contentType: 'url'
    // },
    {
        id: 'twitter',
        title: 'TWITTER',
        iconClass: 'fa-twitter', // Changed from fa-folder
        iconColor: 'rgb(33, 111, 156)',
        initialTop: '150px',
        initialLeft: '350px',
        initialWidth: '500px',
        initialHeight: '500px',
        contentURL: 'https://x.com/majedaltaemi',
        contentType: 'url'
    },
    {
        id: 'instagram',
        title: 'INSTAGRAM',
        iconClass: 'fa-instagram', // Changed from fa-folder
        iconColor: 'rgb(129, 0, 108)',
        initialTop: '170px',
        initialLeft: '400px',
        initialWidth: '500px',
        initialHeight: '500px',
        contentURL: 'https://www.instagram.com/majedaltaemi/',
        contentType: 'url'
    }
];

// Function to create a single window element
function createWindowElement(data, index) {
    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    windowEl.dataset.windowId = data.id; // Link element to data
    windowEl.dataset.windowIndex = index; // Store index if needed
    windowEl.style.top = data.initialTop;
    windowEl.style.left = data.initialLeft;
    windowEl.style.width = data.initialWidth;
    windowEl.style.height = data.initialHeight;
    windowEl.style.display = 'none'; // Initially hidden
    windowEl.style.zIndex = 1; // Default z-index

    windowEl.innerHTML = `
        <div data-user-action="MOVE" class="draggable" draggable="true">
            <i style="font-size: 20px; margin-right: 5px;" class="fa ${data.iconClass}"></i> ${data.title}
        </div>
        <button class="close-button" data-action="close">✖</button>
        <button class="max-button" data-action="toggle-maxmin">▢</button>
        <div class="frame" style="width:100%; height:calc(100% - 30px);"></div>
        <span data-user-action="RESIZE-LT" class="edge lt"></span>
        <span data-user-action="RESIZE-RT" class="edge rt"></span>
        <span data-user-action="RESIZE-LB" class="edge lb"></span>
        <span data-user-action="RESIZE-RB" class="edge rb"></span>
        <span data-user-action="RESIZE-L" class="edge l"></span>
        <span data-user-action="RESIZE-T" class="edge t"></span>
        <span data-user-action="RESIZE-B" class="edge b"></span>
        <span data-user-action="RESIZE-R" class="edge r"></span>
        <div class="max" style="display: none;">min</div> <!-- Helper for max/min state -->
    `;
    return windowEl;
}

// Function to create a single side panel icon element
function createIconElement(data, index) {
    const iconEl = document.createElement('div');
    iconEl.className = 'icon';
    iconEl.dataset.windowId = data.id; // Link element to data
    iconEl.dataset.windowIndex = index; // Store index
    iconEl.dataset.action = 'toggle'; // Action for event listener

    iconEl.innerHTML = `
        <i style="font-size: 50px; color: ${data.iconColor};" class="fa ${data.iconClass}"></i>
        <i class="icon-text">${data.title}</i>
    `;
    return iconEl;
}

// Function to render all windows and icons
function renderWindowsAndIcons(dataArray, windowContainer, iconContainer) {
    dataArray.forEach((data, index) => {
        const windowEl = createWindowElement(data, index);
        windowContainer.appendChild(windowEl);

        const iconEl = createIconElement(data, index);
        iconContainer.appendChild(iconEl);
    });
}

// Get references to static containers
const windowContainer = document.getElementById('window-container');
const sidePanelContainer = document.getElementById('side-panel-container');
const mobileViewContainer = document.getElementById('mobile-content-view');
const mobileContentFrame = document.getElementById('mobile-content-frame');
const mobileBackButton = document.getElementById('mobile-back-button');

//check if mobile or not
var isMobile = false;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
    document.body.classList.add('mobile-view'); // Add class to trigger mobile CSS
}

// Render windows and icons on load
// Windows are created hidden by default
if (!isMobile) { // Only render desktop windows if not mobile
    renderWindowsAndIcons(windowData, windowContainer, sidePanelContainer);
} else { // Only render icons for mobile
    windowData.forEach((data, index) => {
        const iconEl = createIconElement(data, index);
        sidePanelContainer.appendChild(iconEl);
    });
}

// Function to get a specific window element by index
function getWindowByIndex(index) {
    // Note: This relies on the order remaining consistent. Using IDs might be more robust.
    return windowContainer.querySelector(`.window[data-window-index="${index}"]`);
}

// Function to get window data by index
function getWindowDataByIndex(index) {
    return windowData[index];
}

//show youtube window (index 0) - DESKTOP ONLY
if (!isMobile) {
    const initialWindow = getWindowByIndex(0);
    if (initialWindow) {
        initialWindow.style.display = 'block';
        const initialData = getWindowDataByIndex(0);
        if (initialData && initialData.contentType === 'iframe') {
            const frame = initialWindow.querySelector('.frame');
            if (frame) frame.innerHTML = initialData.contentHTML;
        }
        BringToFront(initialWindow); // Bring initially shown window to front
    }
}

//hide everything on mobile except for youtube frame // *** REMOVED - Replaced by CSS and new logic ***
//and scale it correctly
// if (isMobile) {
//     const spContainer = document.getElementById('side-panel-container'); // Use ID
//     if (spContainer) spContainer.style.display = 'none';
//     const firstWindow = getWindowByIndex(0);
//     if (firstWindow) { // ... rest of old mobile logic ... }
// }

// --- Event Listeners (Refactor to use Event Delegation) ---

// --- DESKTOP Event Listeners ---
if (!isMobile) {
    // Add listener to the window container for close, max/min, drag start, focus
    windowContainer.addEventListener('mousedown', (e) => {
        const target = e.target;
        const windowEl = target.closest('.window');
        if (!windowEl) return; // Click wasn't inside a window

        BringToFront(windowEl); // Bring window to front on any click inside

        // Handle specific actions based on clicked element
        const action = target.dataset.action;
        const userAction = target.dataset.userAction; // For drag/resize

        if (action === 'close') {
            const index = parseInt(windowEl.dataset.windowIndex, 10);
            AddRemove(windowEl, index); // Desktop AddRemove
        } else if (action === 'toggle-maxmin') {
            MaxMinWindow(windowEl);
        } else if (userAction === 'MOVE' && target.classList.contains('draggable')) {
            dragMouseDown(e, windowEl); // Pass the window element
        } else if (userAction && userAction.startsWith('RESIZE-') && target.classList.contains('edge')) {
            onMouseDownResize(e);
        }
    });

    // Add listener to the window container for double-click on title bar
    windowContainer.addEventListener('dblclick', (e) => {
        const target = e.target;
        if (target.classList.contains('draggable') || target.closest('.draggable')) {
            const windowEl = target.closest('.window');
            if (windowEl) {
                MaxMinWindow(windowEl);
            }
        }
    });
}

// --- MOBILE & DESKTOP Side Panel Listener ---
sidePanelContainer.addEventListener('click', (e) => {
    const iconEl = e.target.closest('.icon');
    if (!iconEl) return;

    const index = parseInt(iconEl.dataset.windowIndex, 10);
    const data = getWindowDataByIndex(index);
    if (!data) return;

    if (isMobile) {
        // --- Mobile icon click logic ---
        if (data.contentType === 'url') {
            window.location.href = data.contentURL; // Open in same window
        } else if (data.contentType === 'iframe') {
            // Push a state *before* showing the view
            try {
                history.pushState({ mobileView: 'open' }, '', window.location.pathname);
            } catch (e) {
                console.error("History API pushState not supported or failed:", e);
            }
            mobileContentFrame.innerHTML = data.contentHTML; // Load iframe content
            mobileViewContainer.style.display = 'block'; // Show the mobile view
            // Hide icon panel and top bar
            sidePanelContainer.style.display = 'none';
            document.querySelector('.top-panel').style.display = 'none';
        }
    } else {
        // --- Desktop icon click logic ---
        const windowEl = getWindowByIndex(index);
        if (windowEl) {
            AddRemove(windowEl, index); // Use desktop AddRemove
        }
    }
});

// --- MOBILE Back Button Listener ---
if (isMobile) {
    mobileBackButton.addEventListener('click', () => {
        // Check if the view is actually open before going back
        if (mobileViewContainer.style.display !== 'none') {
            mobileViewContainer.style.display = 'none'; // Hide the mobile view
            mobileContentFrame.innerHTML = ''; // Clear the content
            // Show icon panel and top bar again
            sidePanelContainer.style.display = 'flex'; // Restore side panel display
            document.querySelector('.top-panel').style.display = 'flex'; // Restore top panel display

            // Go back in history to remove the state we pushed
            // Only go back if the current state likely corresponds to our pushed state
            if (history.state && history.state.mobileView === 'open') {
                history.back();
            }
        }
    });

    // --- MOBILE Popstate Listener (Browser Back Button) ---
    window.addEventListener('popstate', (event) => {
        // Check if the mobile view is currently visible
        // This listener fires *after* the history has changed
        if (mobileViewContainer.style.display !== 'none') {
            // If the view is visible, the popstate likely means the user pressed back
            // from the state we pushed. We just need to hide the view.
            // We don't need to check event.state here typically, 
            // because if the view is open, any back navigation should close it.
            mobileViewContainer.style.display = 'none';
            mobileContentFrame.innerHTML = '';
            sidePanelContainer.style.display = 'flex';
            document.querySelector('.top-panel').style.display = 'flex';
            // Do NOT call history.back() here, as the event already represents the back action.
        }
        // If mobileViewContainer was *not* displayed, the popstate is unrelated
        // to our view, so we let the browser handle it normally.
    });
}

// --- Desktop Window Functions (Should not be called if isMobile is true) ---

function MaxMinWindow(elmnt) {
    // Max
    const maxStateDiv = elmnt.querySelector('.max'); // Find max state div within the element
    const edges = elmnt.querySelectorAll('.edge'); // Find edges within the element

    // Use getComputedStyle to check current state reliably if needed,
    // but the '.max' div state seems intended for this.
    // const isMinimized = elmnt.style.width === '500px'; // Less reliable
    const isMinimized = maxStateDiv ? maxStateDiv.innerHTML === 'min' : true;


    if (isMinimized) { // Maximize
        BringToFront(elmnt);
        if (maxStateDiv) maxStateDiv.innerHTML = 'max';

        // Store previous state before maximizing (important for restoring)
        elmnt.dataset.prevWidth = elmnt.style.width || elmnt.offsetWidth + 'px';
        elmnt.dataset.prevHeight = elmnt.style.height || elmnt.offsetHeight + 'px';
        elmnt.dataset.prevTop = elmnt.style.top || elmnt.offsetTop + 'px';
        elmnt.dataset.prevLeft = elmnt.style.left || elmnt.offsetLeft + 'px';

        // Apply maximized styles
        elmnt.style.width = "calc(100% - 80px)"; // Adjust width considering side panel
        elmnt.style.height = "calc(100% - 40px)"; // Adjust height considering top panel
        elmnt.style.left = "70px"; // Position next to side panel
        elmnt.style.top = "30px"; // Position below top panel
        // elmnt.style.zIndex = '10'; // BringToFront already handles z-index

        // Hide resize handles when maximized
        edges.forEach(edge => edge.style.display = 'none');

    } else { // Restore (Minimize)
        if (maxStateDiv) maxStateDiv.innerHTML = 'min';

        // Restore previous dimensions and position from data attributes
        elmnt.style.width = elmnt.dataset.prevWidth || '500px'; // Fallback
        elmnt.style.height = elmnt.dataset.prevHeight || '500px'; // Fallback
        elmnt.style.top = elmnt.dataset.prevTop || '50px'; // Fallback
        elmnt.style.left = elmnt.dataset.prevLeft || '100px'; // Fallback

        // Show resize handles when restored
        edges.forEach(edge => edge.style.display = 'block');
    }
}

//here iframe data is toggled in or off the div
function AddRemove(elmnt, index) {
    const data = getWindowDataByIndex(index);
    if (!data) return; // Safety check

    const frame = elmnt.querySelector('.frame'); // Get frame specific to this window

    if (data.contentType === 'url') {
        window.open(data.contentURL, "_blank");
        // Don't toggle display for URL types, maybe focus if already open?
        if (elmnt.style.display !== 'none') {
            BringToFront(elmnt);
        }
    } else if (data.contentType === 'iframe') {
        if (elmnt.style.display === 'none') {
            // Show the window and load iframe
            elmnt.style.opacity = 0; // Start faded out
            elmnt.style.display = 'block'; // Make it visible for unfade
            BringToFront(elmnt); // Bring to front when opening
            if (frame) {
                // Check if content needs loading/reloading
                if (!frame.innerHTML || frame.innerHTML.trim() === '') {
                    frame.innerHTML = data.contentHTML;
                }
            }
            // Restore position if it was closed while maximized
            if (elmnt.querySelector('.max')?.innerHTML === 'max') {
                MaxMinWindow(elmnt); // Call MaxMin to reset to minimized state
            }
            // Make sure position is reasonable (might have been closed then browser resized)
            // TODO: Add logic to ensure window is within viewport bounds on show?
            unfade(elmnt);
        } else {
            // Hide the window and clear iframe
            fade(elmnt, () => { // Pass callback to clear content after fade
                if (frame) {
                    frame.innerHTML = ''; // Clear content after hidden
                }
            });
        }
    }
}


function BringToFront(elmnt) {
    if (isMobile) return; // Don't run on mobile
    // Find all window elements within the container
    const allWindows = windowContainer.querySelectorAll('.window');
    let maxZ = 0;
    allWindows.forEach(win => {
        const currentZ = parseInt(win.style.zIndex) || 0;
        if (currentZ > maxZ) {
            maxZ = currentZ;
        }
        // Optional: Reset border/styles for inactive windows
        win.style.borderStyle = 'solid'; // Assuming default is solid now? Check CSS
        win.style.borderColor = 'rgb(100, 100, 100)'; // Example inactive border
    });

    // Set the target element's z-index higher than all others
    elmnt.style.zIndex = maxZ + 1;
    // Optional: Apply active styles
    elmnt.style.borderStyle = 'solid';
    elmnt.style.borderColor = 'rgb(0, 255, 0)'; // Example active border
}

// --- Drag Logic Adaptation --- // DESKTOP ONLY
let draggedElement = null;
let offsetX = 0, offsetY = 0;

function dragMouseDown(e, elmnt) {
    if (isMobile) return;
    // Ensure drag is initiated by the left mouse button
    if (e.button !== 0) return;

    // Prevent drag if maximized? Or allow drag even when maximized? Currently allows.
    // const maxStateDiv = elmnt.querySelector('.max');
    // if (maxStateDiv && maxStateDiv.innerHTML === 'max') return; // Uncomment to prevent dragging maximized windows

    e.preventDefault();
    draggedElement = elmnt; // The window element itself
    BringToFront(draggedElement); // Bring to front on drag start

    // Calculate the offset from the element's top-left corner
    const rect = draggedElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;


    // Add listeners to the document to track mouse movement and release
    document.addEventListener('mousemove', elementDrag);
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mouseleave', closeDragElement); // Stop if mouse leaves window

    // Style the dragged element (optional)
    draggedElement.style.cursor = 'grabbing';
    // You might add a class for visual feedback
    // draggedElement.classList.add('dragging');
}

function elementDrag(e) {
    if (isMobile || !draggedElement) return;
    e.preventDefault();

    // Restore window if it was maximized before dragging starts
    const maxStateDiv = draggedElement.querySelector('.max');
    if (maxStateDiv && maxStateDiv.innerHTML === 'max') {
        MaxMinWindow(draggedElement); // Restore to normal size first
        // Recalculate offset after resize might be needed if MaxMinWindow changes size/pos drastically
        const rect = draggedElement.getBoundingClientRect();
        offsetX = Math.min(e.clientX - rect.left, rect.width); // Keep offset reasonable
        offsetY = Math.min(e.clientY - rect.top, rect.height); // Keep offset reasonable
    }

    // Calculate new position
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // TODO: Add boundary checks to keep window within viewport?

    // Set the element's new position
    draggedElement.style.left = newLeft + "px";
    draggedElement.style.top = newTop + "px";
}

function closeDragElement() {
    if (isMobile) return;
    if (draggedElement) {
        draggedElement.style.cursor = 'grab'; // Reset cursor
        // draggedElement.classList.remove('dragging');
    }
    // Remove the global listeners
    document.removeEventListener('mousemove', elementDrag);
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mouseleave', closeDragElement);
    draggedElement = null; // Clear the dragged element reference
}


// --- Fade/Unfade Functions (Modified to accept optional callback) ---
// Used by Desktop AddRemove
function fade(element, callback) {
    var op = 1; // initial opacity
    element.style.opacity = op; // Ensure opacity is set before interval starts
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            element.style.display = 'none';
            element.style.opacity = 1; // Reset opacity for next time
            element.style.filter = ''; // Reset filter
            if (callback) callback(); // Execute callback after fadeout
        } else {
            op -= op * 0.1;
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ')';
        }
    }, 15); // Faster fade? Original was 15
}

function unfade(element, callback) {
    var op = 0.1; // initial opacity
    element.style.opacity = op; // Set initial opacity
    element.style.display = 'block'; // Make sure it's displayed before fading in
    var timer = setInterval(function () {
        if (op >= 1) {
            clearInterval(timer);
            element.style.opacity = 1; // Ensure fully opaque
            element.style.filter = ''; // Reset filter
            if (callback) callback(); // Execute callback after fadein
        } else {
            op += op * 0.1;
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ')';
        }
    }, 15); // Faster fade? Original was 15
}


// --- Resize Logic --- // DESKTOP ONLY
let resizeTarget = null;
let resizeAction = null;
let startX, startY, startWidth, startHeight, startLeft, startTop;

function onMouseDownResize(e) {
    if (isMobile) return;
    const edge = e.target;
    if (!edge.classList.contains('edge')) return;
    if (e.button !== 0) return; // Only left click

    resizeTarget = edge.closest('.window');
    if (!resizeTarget) return;

    // Prevent resize if maximized
    const maxStateDiv = resizeTarget.querySelector('.max');
    if (maxStateDiv && maxStateDiv.innerHTML === 'max') return;


    resizeAction = edge.dataset.userAction; // e.g., "RESIZE-RB"
    e.preventDefault();
    BringToFront(resizeTarget); // Bring to front

    startX = e.clientX;
    startY = e.clientY;
    startWidth = resizeTarget.offsetWidth;
    startHeight = resizeTarget.offsetHeight;
    startLeft = resizeTarget.offsetLeft;
    startTop = resizeTarget.offsetTop;

    document.addEventListener('mousemove', onMouseMoveResize);
    document.addEventListener('mouseup', onMouseUpResize);
    document.addEventListener('mouseleave', onMouseUpResize); // Stop if mouse leaves window
}

function onMouseUpResize(e) {
    if (isMobile) return;
    document.removeEventListener('mousemove', onMouseMoveResize);
    document.removeEventListener('mouseup', onMouseUpResize);
    document.removeEventListener('mouseleave', onMouseUpResize);
    resizeTarget = null;
    resizeAction = null;
}

function onMouseMoveResize(e) {
    if (isMobile || !resizeTarget || !resizeAction) return;
    e.preventDefault();

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    // Adjust dimensions and position based on the edge being dragged
    if (resizeAction.includes('R')) {
        newWidth = startWidth + dx;
    } else if (resizeAction.includes('L')) {
        newWidth = startWidth - dx;
        newLeft = startLeft + dx;
    }

    if (resizeAction.includes('B')) {
        newHeight = startHeight + dy;
    } else if (resizeAction.includes('T')) {
        newHeight = startHeight - dy;
        newTop = startTop + dy;
    }

    // Basic minimum size constraint
    const minWidth = 150;
    const minHeight = 100;

    if (newWidth < minWidth) {
        if (resizeAction.includes('L')) {
            newLeft = startLeft + startWidth - minWidth;
        }
        newWidth = minWidth;
    }
    if (newHeight < minHeight) {
        if (resizeAction.includes('T')) {
            newTop = startTop + startHeight - minHeight;
        }
        newHeight = minHeight;
    }

    // Apply the new styles
    resizeTarget.style.width = `${newWidth}px`;
    resizeTarget.style.height = `${newHeight}px`;
    resizeTarget.style.left = `${newLeft}px`;
    resizeTarget.style.top = `${newTop}px`;
}


// Original functions potentially needed by resize logic (verify/remove if unused)
/*
function focusElement(dom, width, height, sx, sy, tx, ty) {
    // ... (Original implementation - likely needs adaptation or removal) ...
}

function blurElement() {
    // ... (Original implementation - likely needs adaptation or removal) ...
}

function getMovement(sx, sy) {
    // ... (Original implementation - likely needs adaptation or removal) ...
}

function move(sx, sy) {
    // ... (Original implementation - likely needs adaptation or removal) ...
}

function resize(sx, sy) {
    // ... (Original implementation - likely needs adaptation or removal) ...
}
*/