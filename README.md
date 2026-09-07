# بسم الله الرحمن الرحيم

# voidwave.com
Majed Altaemi - Game Developer Portfolio
the website is designed to look like a desktop environment

majed@voidwave.com

## Desktop portfolio

Serve `index.html` over HTTP for the complete experience. No build step is
needed. The default Dither Waves wallpaper uses a JavaScript module, which
requires HTTP hosting rather than a file URL. Embedded services may also
require an internet connection.

- `desktop.js` contains the app registry, window manager, portfolio content,
	terminal commands, and locally saved appearance preferences.
- `desktop.css` styles the Linux-inspired desktop and mobile home screen.
	Layouts switch at 760px and windows adapt to their own width.
- `dither-wallpaper.html` hosts the original, unchanged dither simulation in
	an isolated background frame. Appearance offers Dither Waves (default),
	Otherworld, and Graphite. The live frame unloads when unselected or when
	the tab is hidden; reduced-motion users receive the static image fallback.
- `img/desktop-wallpaper.jpg` and `img/hydrogen-preview.jpg` are optimized
	derivatives. The original artwork is unchanged.
- Existing project, gallery, video, and demo pages remain available through
	the app launcher and Project Archive.
- `projects.html` and `youtube_projects.html` share the themed app-grid
	viewer in `scripts/project-library.js` and `styles/experiments.css`.
- `dev-videos.html` displays the development playlist with a scrollable
	queue from YouTube's IFrame API. Titles load from YouTube oEmbed as items
	approach view. No API key or build step is required; YouTube access is.

Desktop windows support dragging, corner resizing, minimize/restore, and
maximize. Mobile apps use a full-width view with browser Back support. The
terminal supports `help`, `about`, `projects`, `open <app>`, `date`, `whoami`,
and `clear`, plus command history and unambiguous Tab completion.

Smoke checks: test the launcher search, window controls, folder filters,
terminal, appearance settings, and mobile Back at 320px, 390px, and desktop
widths. Confirm embedded services separately over HTTP before publishing.