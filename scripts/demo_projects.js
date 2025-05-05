const youtubeProjectData = [
    {
        title: 'Al-Quran.js',
        imageUrl: 'img/JavaScript-logo.png',
        iframeContent: '<iframe style="width:100%; height:100%; border: none;" src="Quran/index.html"></iframe>'
    },
    {
        title: 'Quran Scroll',
        imageUrl: 'img/quran.png',
        iframeContent: '<iframe style="width:100%; height:100%; border: none;" src="Quran/quran.html"></iframe>'
    },
    {
        title: 'Prime Jinn Sandbox (2017)',
        imageUrl: 'img/voidwave_RGB.png',
        iframeContent: '<iframe style="width:100%; height:100%; border: none;" src="primejinn/index.html"></iframe>'
    },
    {
        title: 'AI PRERENDERED BACKGROUNDS (2024)',
        imageUrl: 'img/voidwave-white-qr-code.png',
        iframeContent: '<iframe style="width:100%; height:100%; border: none;" src="genai-webgpu/index.html"></iframe>'
    },
];

const filesContainer = document.getElementById('Files');
// const view = document.getElementById('View'); // Remove reference to view
//const backButton = document.getElementById('backButton');

// Function to generate project icons
function renderProjectIcons(projects) {
    filesContainer.innerHTML = ''; // Clear existing content
    filesContainer.style.display = 'grid'; // Ensure grid display for icons
    // Add a class for styling the icon grid view if preferred
    // filesContainer.classList.remove('iframe-view');
    // filesContainer.classList.add('icon-grid-view');

    projects.forEach((project, index) => {
        const projectIcon = document.createElement('div');
        projectIcon.className = 'project-icon';
        projectIcon.style.backgroundImage = `url('${project.imageUrl}')`;

        const titleElement = document.createElement('p');
        titleElement.textContent = project.title;
        projectIcon.appendChild(titleElement);

        projectIcon.addEventListener('click', () => openProject(index), false);
        filesContainer.appendChild(projectIcon);
    });
}

// Function to open a project directly in the #Files container
function openProject(index) {
    if (index >= 0 && index < youtubeProjectData.length) {
        filesContainer.innerHTML = youtubeProjectData[index].iframeContent; // Load iframe into #Files
        filesContainer.style.display = 'block'; // Change display for single iframe
        // Add a class for styling the iframe view if preferred
        // filesContainer.classList.remove('icon-grid-view');
        // filesContainer.classList.add('iframe-view');

        // Make the iframe fill the container (adjust height as needed)
        const iframe = filesContainer.querySelector('iframe');
        if (iframe) {
            iframe.style.width = '100%';
            iframe.style.height = 'calc(100vh - 40px)'; // Example: Adjust based on top panel height
            // Or set height relative to parent: iframe.style.height = '100%';
            // Requires #Files to have a defined height when in this mode.
        }

        //backButton.style.display = 'block'; // Show the specific back button
    } else {
        console.error('Invalid project index:', index);
    }
}

// Function to close the project view and show the icon list again
function closeProject() {
    // Re-render the icons
    renderProjectIcons(youtubeProjectData);
    //backButton.style.display = 'none'; // Hide the specific back button
}

// Initial setup
// view.style.display = 'none'; // Remove view logic
// backButton.style.display = 'none'; // Hide the back button initially
// backButton.addEventListener('click', closeProject, false);

// Render the YouTube project icons on load
renderProjectIcons(youtubeProjectData); 