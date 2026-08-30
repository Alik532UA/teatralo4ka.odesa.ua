<script lang="ts">
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { t } from "svelte-i18n";

	let { size = 'large' }: { size?: 'large' | 'small' } = $props();

	const dimensions = {
		large: { width: 140, height: 140 },
		small: { width: 80, height: 80 }
	};

	const d = $derived(dimensions[size]);
	
	// status: 'hidden' -> 'appearing' -> 'idle'
	let status = $state<'hidden' | 'appearing' | 'idle'>('hidden');

	/**
	 * Логотип з'являється синхронно з завершенням заставки.
	 *
	 * Подію `splash-logo-start` шле ЛИШЕ `+page.svelte`, тобто головна. Через це
	 * на холодному першому візиті одразу на внутрішню сторінку — а це рівно те,
	 * що робить відвідувач із результатів пошуку — логотип лишався
	 * `data-status="hidden"` з `opacity: 0` НАЗАВЖДИ. Перевірено в браузері:
	 * очистити localStorage, перейти на `/about` — логотипа в шапці немає.
	 *
	 * Чому саме так: `splash.js` ховає заставку одразу лише за наявності
	 * `homeSettings` у сховищі (теплий старт). На холодному вона в DOM, і
	 * `onMount` цього компонента бачить її раніше, ніж `$effect` у
	 * `+layout.svelte` встигає її прибрати. Отже спрацьовував випадок 3 —
	 * очікування події, якої на цьому маршруті не буде.
	 *
	 * Тому тут не одна умова, а страховка: перевірка ще раз на наступному кадрі
	 * (заставку саме прибирає лейаут) плюс жорсткий запас часу. Заставка лежить
	 * поверх усього з `z-index: 10000`, тож показати логотип під нею зарано —
	 * невидимо для відвідувача, а не показати взагалі — видимий дефект.
	 */
	const IDLE_FALLBACK_MS = 3000;

	onMount(() => {
		if (!browser) return;

		const timers: ReturnType<typeof setTimeout>[] = [];
		let done = false;

		const toIdle = () => {
			if (done) return;
			done = true;
			status = 'idle';
		};

		const handleExit = () => {
			if (done) return;
			done = true;
			status = 'appearing';
			// 0.4s delay + 0.8s duration = 1.2s sequence. Buffer to 1.5s.
			timers.push(setTimeout(() => { status = 'idle'; }, 1500));
		};

		const splash = document.getElementById('app-splash');

		// Case 1: Splash is not in DOM or explicitly hidden (warm start)
		if (!splash || splash.style.display === 'none') {
			toIdle();
			return;
		}

		// Case 2: Splash is already exiting (triggered in +page.svelte)
		if (splash.classList.contains('splash-exit')) {
			handleExit();
			return;
		}

		// Case 3: Wait for the event from the homepage — плюс дві страховки.
		window.addEventListener('splash-logo-start', handleExit, { once: true });

		// Наступний кадр: якщо заставки вже немає, її прибрав лейаут, бо це не
		// головна. Події не буде — показуємо логотип без анімації появи.
		const frame = requestAnimationFrame(() => {
			if (!document.getElementById('app-splash')) toIdle();
		});

		// Останній рубіж на будь-який інший шлях, який ми не передбачили.
		timers.push(setTimeout(toIdle, IDLE_FALLBACK_MS));

		return () => {
			window.removeEventListener('splash-logo-start', handleExit);
			cancelAnimationFrame(frame);
			timers.forEach(clearTimeout);
		};
	});
</script>

<div 
	class="logo-container" 
	style="width: {d.width}px; height: {d.height}px;"
	data-status={status}
>
	<img
		src="{base}/logo/svg/t4_logo_IndividualParticles_MaskRed_2026.svg"
		alt={$t('common.logoAlt')}
		class="logo-svg logo-red"
		width={d.width}
		height={d.height}
	/>
	<img
		src="{base}/logo/svg/t4_logo_IndividualParticles_MaskBlue_2026.svg"
		alt={$t('common.logoAlt')}
		class="logo-svg logo-blue"
		width={d.width}
		height={d.height}
	/>
</div>

<style>
	/*
	 * Натискання ловить САМ ЗНАК, а не його коробка.
	 *
	 * Коробка логотипа квадратна (140×140), а знак у ній широкий і низький —
	 * при масштабі 1.4 це 196px проти 133 видимих. Різниця в 63px нічого не
	 * малює, але лишалася частиною посилання на головну й ковтала натискання:
	 * заміряно на 414px — клік у центр кнопки «назад» під логотипом потрапляв
	 * у `.logo-container`, а не в кнопку.
	 *
	 * Вигляд не змінюється: `pointer-events` не малює нічого. Наведення на сам
	 * знак і далі піднімається до `.header__logo-area` з її збільшенням.
	 */
	.logo-container {
		position: relative;
		flex-shrink: 0;
		opacity: 0;
		pointer-events: none;
	}

	.logo-container .logo-svg {
		pointer-events: auto;
	}

	/* Show container only when not 'hidden' */
	.logo-container[data-status="appearing"],
	.logo-container[data-status="idle"] {
		opacity: 1;
	}

	.logo-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	/* ── IDLE STATE (Constant Pulse) ─────────────────────────────────── */
	.logo-container[data-status="idle"] .logo-svg {
		animation: logo-pulse 4s ease-in-out infinite;
	}
	.logo-container[data-status="idle"] .logo-red {
		animation-delay: 0.1s;
	}

	/* ── APPEARING STATE (One-time Animation) ────────────────────────── */
	/* We use 'both' to ensure opacity:0 during delay and opacity:1 after finish */
	.logo-container[data-status="appearing"] .logo-blue {
		animation: logo-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.logo-container[data-status="appearing"] .logo-red {
		animation: logo-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
	}

	@keyframes logo-appear {
		0% { opacity: 0; transform: scale(0.8); }
		100% { opacity: 1; transform: scale(1); }
	}

	@keyframes logo-pulse {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.02); opacity: 0.95; }
	}
</style>
