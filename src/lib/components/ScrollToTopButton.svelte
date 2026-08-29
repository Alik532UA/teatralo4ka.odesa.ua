<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ArrowUp } from 'lucide-svelte';
	import { browser } from '$app/environment';

	/** Поріг появи: нижче нього кнопка зайва — до верху й так рукою подати. */
	const SHOW_AFTER = 400;

	let visible = $state(false);

	/**
	 * Наскільки кнопка піднімається, щоб не лягти на підвал.
	 *
	 * Із трьох виходів із цього накладання лише цей лишає кнопку робочою.
	 * Покласти підвал вище за z-index — сховати її разом із її кліками, тобто
	 * лишити контрол, який видно, фокусується й нічого не робить. Гасити її
	 * унизу — прибрати рівно там, де вона найпотрібніша, бо низ сторінки і є
	 * причиною по неї тягнутися. Тож вона впирається в підвал і чекає там.
	 */
	let footerLift = $state(0);

	$effect(() => {
		if (!browser) return;

		const apply = () => {
			visible = window.scrollY > SHOW_AFTER;
			const footer = document.querySelector('footer');
			footerLift = footer
				? Math.max(0, window.innerHeight - footer.getBoundingClientRect().top)
				: 0;
		};

		/*
		 * Одне читання на кадр. Без цього обробник спрацьовує на кожну подію
		 * прокрутки, а `getBoundingClientRect` у ньому щоразу змушує браузер
		 * рахувати розкладку наново.
		 */
		let queued = false;
		const onScroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				apply();
				queued = false;
			});
		};

		apply();
		window.addEventListener('scroll', onScroll, { passive: true });
		// Висота сторінки міняється не лише від зміни розміру вікна: приходять
		// зображення, фільтр спорожнює список, розгортається секція.
		const observer = new ResizeObserver(onScroll);
		observer.observe(document.documentElement);

		return () => {
			window.removeEventListener('scroll', onScroll);
			observer.disconnect();
		};
	});

	function toTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<button
	type="button"
	class="to-top"
	class:to-top--visible={visible}
	style="--footer-lift: {footerLift}px"
	onclick={toTop}
	aria-label={$t('common.backToTop')}
	title={$t('common.backToTop')}
	tabindex={visible ? 0 : -1}
	data-testid="back-to-top-btn"
>
	<ArrowUp size={22} aria-hidden="true" />
</button>

<style>
	.to-top {
		position: fixed;
		/*
		 * Значення за замовчуванням, яке підміняє інлайновий стиль. Оголошене
		 * окремо, а не запасним значенням у `var()`: інакше воно й далі
		 * працювало б у той день, коли інлайновий стиль перестануть ставити, і
		 * тихо лишило б кнопку поверх підвалу.
		 */
		--footer-lift: 0px;
		right: 1.5rem;
		bottom: calc(1.5rem + var(--footer-lift));
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 1px solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		cursor: pointer;
		box-shadow: var(--shadow-main);
		/* Нижче мінімапи (9000) і модалок, вище звичайного вмісту. */
		z-index: 80;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.25s ease,
			visibility 0.25s ease,
			bottom 0.15s ease,
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.to-top--visible {
		opacity: 1;
		visibility: visible;
	}

	.to-top:hover {
		background: var(--bg-card);
		border-color: var(--accent-primary);
		transform: translateY(-2px);
	}

	.to-top:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 3px;
	}

	@media (max-width: 768px) {
		.to-top {
			right: 1rem;
			bottom: calc(1rem + var(--footer-lift));
			width: 44px;
			height: 44px;
		}
	}

	@media print {
		.to-top {
			display: none;
		}
	}
</style>
