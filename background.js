const font = new FontFace('SaudiWeb', 'url(fonts/SaudiWeb-Bold.woff)');

font.load().then(function (loadedFont) {
	// Add the loaded font to the document
	document.fonts.add(loadedFont);

	const canvas = document.getElementById('Matrix');
	const context = canvas.getContext('2d');


	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const arabic = 'سذضصثقفغعهخحجدطكمنتالبيسشئءؤرلاىةوزظا';
	const latin = 'QWERTYUIOPASDFGHJKLZXCVBNM';
	const nums = '0123456789';

	const alphabet = arabic;// + latin + nums;

	const fontSize = 13;
	const columns = canvas.width / fontSize;

	const rainDrops = [];

	var mColor = '#0F0';

	for (let x = 0; x < columns; x++) {
		rainDrops[x] = 1;
	}


	const draw = () => {
		context.fillStyle = 'rgba(0, 0, 0, 0.05)';
		context.fillRect(0, 0, canvas.width, canvas.height);

		context.font = fontSize + 'px SaudiWeb';

		for (let i = 0; i < rainDrops.length; i++) {
			// If the current character is one of the letters "VOIDWAE", set the fill style to white.
			// Otherwise, set it to green.
			const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
			context.fillStyle = mColor;
			context.fillText(text, i * fontSize, rainDrops[i] * fontSize);

			if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
				rainDrops[i] = 0;
			}
			rainDrops[i]++;
		}
	};

	setInterval(draw, 40);
});