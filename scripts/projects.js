// This file is no longer used for projects.html directly.
// The logic has been moved to youtube_projects.js and other_projects.js

const projectData = [
    {
        title: 'AI PRERENDERED DEMO (2024)',
        imageUrl: 'img/vw-qr-100.jpg',
        iframeContent: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/pMM3PzSojqk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
    },
    {
        title: 'Al-Quran.js',
        imageUrl: 'img/JavaScript-logo.png',
        iframeContent: '<iframe style="width:100%; height:100%; border: none;" src="other/Quran/index.html"></iframe>'
    },
    {
        title: 'Quran Scroll',
        imageUrl: 'img/quran.png',
        iframeContent: '<iframe style="width:100%; height:100%; border: none;" src="other/Quran/quran.html"></iframe>'
    },
    {
        title: 'Prime Jinn Sandbox (2017)',
        imageUrl: 'img/voidwave_RGB.png',
        iframeContent: '<iframe style="width:100%; height:100%; border: none;" src="other/primejinn/index.html"></iframe>'
    },
    {
        title: 'Prime Jinn Video (2017)',
        imageUrl: 'img/voidwave_RGB.png',
        iframeContent: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/f48cQPfXy3I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
    },
    {
        title: 'Project Voxel Video (2016)',
        imageUrl: 'img/vw-blacknwhite.png',
        iframeContent: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/ypSCp02pHBM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
    },
    {
        title: 'FPS: Rocket Jump Video (2022)',
        imageUrl: 'img/vw-qr-100.jpg',
        iframeContent: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/lkFQ3f5EQmM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
    }
];

const view = document.getElementById('View');
//const backButton = document.getElementById('backButton');

view.style.display = 'none';
//backButton.style.display = 'none';
//backButton.addEventListener('click', () => closeProject(), false);

const filesContainer = document.getElementById('Files');

projectData.forEach((project, index) => {
    const projectIcon = document.createElement('div');
    projectIcon.className = 'project-icon';
    projectIcon.style.backgroundImage = `url('${project.imageUrl}')`;
    projectIcon.innerHTML = `<p>${project.title}</p>`;
    projectIcon.addEventListener('click', () => openProject(index), false);
    filesContainer.appendChild(projectIcon);
});

function openProject(index) {
    view.style.display = 'block';
    view.innerHTML = projectData[index].iframeContent;
    //backButton.style.display = 'block';
}

function closeProject() {
    view.style.display = 'none';
    view.innerHTML = '';
    //backButton.style.display = 'none';
} 