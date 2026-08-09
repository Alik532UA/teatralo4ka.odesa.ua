// Винесено з app.html заради CSP. Позиція в <body> збережена, тож порядок
// виконання і доступ до розмітки сплеша не змінилися.
(function() {
	window.__perf('inline-body: splash script start');
	try {
		if (localStorage.getItem('teatralo4ka_homeSettings')) {
			document.getElementById('app-splash').style.display = 'none';
			return;
		}
	} catch(e) {}

	var lang = (navigator.language || 'uk').split('-')[0] === 'en' ? 'en' : 'uk';
	var content = {
		uk: {
			slow: 'Нестабільне підключення до інтернету...',
			intro: 'А поки браузер шукає інтернет, розкажемо цікаві факти про школу',
			facts: [
				'Ми є в багатьох соц. мережах: Facebook, Instagram, Telegram, YouTube, TikTok',
				'Одеська театральна школа має чотири відділення: Театральне, Музичне, Художнє та Відділення естетичного виховання',
				'Наразі ми Одеська театральна школа, але раніше мали назви: Дитяча театральна школа та Мистецька театральна школа',
				'У нашої школи близько 500 випускників',
				'У школі наразі навчається 420 учнів'
			]
		},
		en: {
			slow: 'Unstable internet connection...',
			intro: 'While the browser is searching for internet, let us tell you some interesting facts about our school',
			facts: [
				'We are on many social networks: Facebook, Instagram, Telegram, YouTube, TikTok',
				'Odesa Theatre School has four departments: Theater, Music, Art, and Aesthetic Education',
				'Currently we are Odesa Theatre School, but previously we were named: Children\'s Theater School and Art Theater School',
				'Our school has over 500 graduates',
				'Our school has over 200 students'
			]
		}
	};

	var c = content[lang];
	document.getElementById('sp-slow-text').textContent = c.slow;
	document.getElementById('sp-facts-intro').textContent = c.intro;
	var rotator = document.getElementById('sp-facts-rotator');
	c.facts.forEach(function(text, i) {
		var p = document.createElement('p');
		p.className = 'sp-fact';
		p.textContent = text;
		rotator.appendChild(p);
	});

	var blue = document.getElementById('app-splash-logo-blue');
	var red = document.getElementById('app-splash-logo-red');
	var slowEl = document.getElementById('app-splash-slow');
	var factsEl = document.getElementById('app-splash-facts');

	function startAnimations() {
		if (blue.classList.contains('sp-logo-animate')) return;
		blue.classList.add('sp-logo-animate');
		red.classList.add('sp-logo-animate');
	}

	var loadedCount = 0;
	function onSvgLoaded() {
		loadedCount++;
		if (loadedCount >= 2) startAnimations();
	}
	[blue, red].forEach(function(img) {
		if (img.complete && img.naturalWidth > 0) onSvgLoaded();
		else { img.addEventListener('load', onSvgLoaded); img.addEventListener('error', onSvgLoaded); }
	});

	// Messages Timings (relative to script start)
	setTimeout(function() {
		if (document.getElementById('app-splash')) slowEl.classList.add('sp-show');
	}, 3000);

	setTimeout(function() {
		var splash = document.getElementById('app-splash');
		if (!splash) return;
		factsEl.classList.add('sp-show');
		var facts = splash.querySelectorAll('.sp-fact');
		var factIndex = 0;
		if (facts.length > 0) {
			setTimeout(function() {
				if (!document.getElementById('app-splash')) return;
				facts[0].classList.add('sp-fact-active');
				setInterval(function() {
					facts[factIndex].classList.remove('sp-fact-active');
					factIndex = (factIndex + 1) % facts.length;
					facts[factIndex].classList.add('sp-fact-active');
				}, 4000);
			}, 1000);
		}
	}, 4000);
})();
