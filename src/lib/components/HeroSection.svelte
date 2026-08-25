<script lang="ts">
	import { t } from "svelte-i18n";
	import { asset } from '$app/paths';
	import { onMount } from "svelte";
	import { MapPinned, Phone, Mail } from "lucide-svelte";
	import { ui } from "$lib/controllers/ui.svelte";
	import { imageSize, type LocalImage } from "$lib/config/localImages";

	/**
	 * Шлях і його ВЛАСНИЙ розмір разом (PERFORMANCE-v8 § 3.2).
	 *
	 * Доти обидва знімки ділили один жорсткий `width="1200" height="900"`, хоч
	 * мають 1280×804 і 4068×3070 — тобто одне число не могло бути правильним для
	 * обох. Тут воно береться з мапи, яку звіряють із заголовками файлів.
	 */
	const heroPhotos = ['/photo/DSC_1405.jpg', '/photo/DJI_0759 v02.jpg'] as const satisfies readonly LocalImage[];

	const socialIcons = [
		{ id: 'fb', label: 'Facebook', alt: 'FB', href: 'footer.facebook', file: '/social_media/facebook-se-512-50.png' },
		{ id: 'ig', label: 'Instagram', alt: 'IG', href: 'footer.instagram', file: '/social_media/instagram-se-512-50.png' },
		{ id: 'tg', label: 'Telegram', alt: 'TG', href: 'footer.telegram', file: '/social_media/Telegram-se-320px-50q.png' },
		{ id: 'yt', label: 'YouTube', alt: 'YT', href: 'footer.youtube', file: '/social_media/YouTube-se-512px-50q.png' },
		{ id: 'tt', label: 'TikTok', alt: 'TT', href: 'footer.tiktok', file: '/social_media/TikTok-se-512-50.png' }
	] as const satisfies readonly { id: string; label: string; alt: string; href: string; file: LocalImage }[];

	let currentImageIndex = $state(0);

	onMount(() => {
		const interval = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % heroPhotos.length;
		}, 10000);

		return () => clearInterval(interval);
	});

</script>

<section class="hero" id="hero-section" aria-label={$t('hero.section')} data-testid="hero-section-container">
	<div class="hero__content container" data-testid="hero-content-section">
		<!-- 1. Social Links (Left) -->
		<div class="hero__social" data-testid="hero-social-links-menu">
			{#each socialIcons as icon (icon.id)}
				<a href={$t(icon.href)} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label={icon.label} data-testid="hero-social-{icon.id}-btn">
					<img src={asset(icon.file)} alt={icon.alt} {...imageSize(icon.file)} />
				</a>
			{/each}
		</div>

		<!-- 2. Text Content (Middle) -->
		<div class="hero__text" data-testid="hero-text-section">
			<h1 class="hero__title" id="hero-title" data-testid="hero-title">
				{$t("hero.title")}
			</h1>
			<p class="hero__subtitle" data-testid="hero-subtitle-text">{$t("hero.subtitle")}</p>
		</div>

		<!-- 3. Image (Right) -->
		<div class="hero__image-wrap" data-testid="hero-scene-container">
			<!--
				`fetchpriority="high"` дістається ЛИШЕ першому знімку
				(PERFORMANCE-v8 § 3.1): він і є LCP сторінки. Другий лежить поруч під
				`opacity: 0` і потрібен аж на десятій секунді, тож високий пріоритет на
				ньому не прискорював нічого, а лише ділив канал із першим — «пріоритет
				у двох» дорівнює «пріоритету в жодного». `loading` в обох лишається
				`eager`: обидва в полі зору, тож `lazy` тут однаково нічого не відклав
				би, а от `fetchpriority="low"` браузер враховує.
			-->
			<div class="hero__image-inner" data-testid="hero-image-container">
				{#each heroPhotos as photo, i (photo)}
					<img
						src={asset(photo)}
						alt=""
						{...imageSize(photo)}
						loading="eager"
						fetchpriority={i === 0 ? 'high' : 'low'}
						decoding="async"
						class="hero__image"
						class:active={currentImageIndex === i}
						data-testid={`hero-main-img-${i}`}
					/>
				{/each}
				<div class="hero__image-border"></div>
			</div>
			<!-- Decorative blue cloud shapes -->
			<div class="hero__cloud hero__cloud--1" aria-hidden="true"></div>
			<div class="hero__cloud hero__cloud--2" aria-hidden="true"></div>
		</div>

		<!-- 4. Mobile Contacts -->
		<div class="hero__contacts" data-testid="hero-mobile-contacts-menu">
			<a href="https://maps.app.goo.gl/ya4gki6tuZv36Tjz8" target="_blank" rel="noopener noreferrer" class="hero__contact-btn" aria-label={$t('hero.map')} data-testid="hero-map-btn">
				<MapPinned size={24} />
			</a>
			<button class="hero__contact-btn" onclick={() => (ui.isPhonesModalOpen = true)} aria-label={$t('hero.phones')} data-testid="hero-phones-btn">
				<Phone size={24} />
			</button>
			<!-- Саме <a>, а не <button>: без JS посилання все одно відкриє пошту,
			     а копіювання з тостом навішує делегування в кореневому лейауті. -->
			<a
				href="mailto:{$t('footer.email')}"
				class="hero__contact-btn"
				aria-label={$t('hero.email')}
				data-testid="hero-email-link"
			>
				<Mail size={24} />
			</a>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		background: var(--bg-page);
		padding: var(--space-4xl, 4rem) 0;
		overflow: hidden;
		min-height: 600px;
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .hero {
		background: transparent;
	}

	/* Content layout */
	.hero__content {
		display: grid;
		grid-template-columns: 60px 1fr 1fr;
		gap: var(--space-2xl, 3rem);
		align-items: center;
		position: relative;
		padding: 0 var(--space-xl);
	}

	/* Social Links (Left Column) */
	.hero__social {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		z-index: 10;
		animation: fadeInLeft 0.8s ease-out;
	}

	@media (min-width: 1025px) {
		.hero__social {
			display: none;
		}
		.hero__content {
			grid-template-columns: 1fr 1fr; /* Adjust grid since social is gone */
		}
	}

	.hero__social-btn {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		overflow: hidden;
	}

	.hero__social-btn img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
	}

	.hero__social-btn:hover {
		transform: scale(1.15);
	}

	@keyframes fadeInLeft {
		from { opacity: 0; transform: translateX(-30px); }
		to { opacity: 1; transform: translateX(0); }
	}

	@keyframes fadeInRight {
		from { opacity: 0; transform: translateX(30px); }
		to { opacity: 1; transform: translateX(0); }
	}

	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Text — Highest Layer */
	.hero__text {
		position: relative;
		z-index: 10;
		animation: fadeInLeft 0.8s ease-out;
	}

	.hero__title {
		font-family: var(--font-heading);
		font-size: clamp(2.2rem, 5vw, 3.5rem);
		font-weight: 900;
		text-transform: uppercase;
		color: var(--text-title);
		line-height: 1.1;
		margin-bottom: var(--space-lg, 2rem);
		letter-spacing: -0.01em;
	}

	.hero__subtitle {
		font-family: var(--font-heading);
		font-size: clamp(1rem, 2vw, 1.25rem);
		font-weight: 500;
		color: var(--text-main);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-xl, 2.5rem);
	}

	/* Image area with new styles from previous AI */
	.hero__image-wrap {
		position: relative;
		z-index: 2;
		animation: fadeInRight 0.8s ease-out 0.2s both;
	}

	.hero__image-inner {
		position: relative;
		border-radius: 40px;
		overflow: hidden;
		box-shadow: var(--shadow-main);
		z-index: 2;
		aspect-ratio: 4 / 3;
		background: var(--bg-surface);
	}

	.hero__image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 1.2s ease-in-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		opacity: 0;
	}

	.hero__image.active {
		opacity: 1;
	}

	.hero__image-inner:hover .hero__image.active {
		transform: scale(1.08);
	}

	.hero__image-border {
		position: absolute;
		inset: 0;
		border: 16px solid rgba(255, 255, 255, 0.15);
		border-radius: inherit;
		pointer-events: none;
	}

	/* Decorative clouds */
	.hero__cloud {
		position: absolute;
		border-radius: 50%;
		z-index: -1;
		opacity: 0.2;
	}

	.hero__cloud--1 {
		width: 200px;
		height: 200px;
		background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
		top: -30px;
		right: -40px;
	}

	.hero__cloud--2 {
		width: 150px;
		height: 150px;
		background: radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%);
		bottom: -20px;
		left: -30px;
	}

	/* Mobile Contacts */
	.hero__contacts {
		display: none;
		gap: var(--space-lg, 2rem);
		justify-content: center;
		z-index: 10;
		margin-top: var(--space-md, 1.5rem);
	}

	.hero__contact-btn {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--bg-surface);
		color: var(--text-title);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border-main);
		box-shadow: var(--shadow-main);
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		cursor: pointer;
	}

	.hero__contact-btn:hover {
		box-shadow: 0 12px 25px rgba(0,0,0,0.12);
		border-color: var(--accent-primary);
		/* Тло при наведенні світле — потрібен темніший акцент. */
		color: var(--accent-text);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.hero__content {
			grid-template-columns: 1fr 1.1fr;
			grid-template-areas: 
				"text image"
				"social image";
			gap: var(--space-xl, 2rem);
			align-items: center;
		}
		.hero__text {
			grid-area: text;
		}
		.hero__social {
			grid-area: social;
			flex-direction: row;
			justify-content: flex-start;
			gap: 16px;
			margin-top: -1.5rem;
			align-self: flex-start;
		}
		.hero__image-wrap {
			grid-area: image;
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding-top: var(--space-2xl, 3rem);
			min-height: auto;
		}

		.hero__content {
			display: flex;
			flex-direction: column;
			gap: var(--space-xl, 2rem);
			text-align: center;
		}

		.hero__text {
			display: contents; /* Allows children to participate in flex layout */
		}

		.hero__title {
			order: 1;
			margin-bottom: 0;
			animation: fadeInUp 0.8s ease-out both;
		}

		.hero__image-wrap {
			order: 2;
			animation: fadeInUp 0.8s ease-out 0.2s both;
			width: 100%;
			max-width: 500px;
			margin: 0 auto;
		}

		.hero__subtitle {
			order: 3;
			margin-top: 0;
			margin-bottom: 0;
			animation: fadeInUp 0.8s ease-out 0.4s both;
		}

		.hero__social {
			position: static;
			justify-content: center;
			align-self: center;
			order: 4;
			margin-top: var(--space-md, 1.5rem);
			margin-bottom: 0;
			animation: fadeInUp 0.8s ease-out 0.6s both;
		}

		.hero__contacts {
			display: flex;
			order: 5;
			animation: fadeInUp 0.8s ease-out 0.8s both;
		}
	}
</style>