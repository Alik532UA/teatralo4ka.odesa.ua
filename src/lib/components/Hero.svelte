<script lang="ts">
	import Wave from "./Wave.svelte";
	import { t } from "svelte-i18n";
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { MapPinned, Phone, Mail } from "lucide-svelte";
	import { ui } from "$lib/states/ui.svelte";
	import { toast } from "$lib/states/toast.svelte";

	const images = [
		`${base}/photo/DSC_1405.jpg`,
		`${base}/photo/DJI_0759 v02.jpg`
	];

	let currentImageIndex = $state(0);

	onMount(() => {
		const interval = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % images.length;
		}, 10000);

		return () => clearInterval(interval);
	});

	function handleEmailClick(e?: MouseEvent) {
		if (e) e.preventDefault();
		const email = $t("footer.email");
		navigator.clipboard.writeText(email).then(() => {
			toast.success(
				$t("footer.emailCopied"),
				6000,
				{
					label: $t("footer.openMailClient"),
					onAction: () => {
						window.location.href = `mailto:${email}`;
					}
				}
			);
		});
	}
</script>

<section class="hero" id="hero-section" aria-label="Головна секція" data-testid="hero-section-container">
	<div class="hero__content container" data-testid="hero-content-group">
		<!-- 1. Social Links (Left) -->
		<div class="hero__social" data-testid="hero-social-links-menu">
			<a href={$t("footer.facebook")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="Facebook" data-testid="hero-social-fb-button">
				<img src={`${base}/social_media/facebook-se-512-50.png`} alt="FB" />
			</a>
			<a href={$t("footer.instagram")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="Instagram" data-testid="hero-social-ig-button">
				<img src={`${base}/social_media/instagram-se-512-50.png`} alt="IG" />
			</a>
			<a href={$t("footer.telegram")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="Telegram" data-testid="hero-social-tg-button">
				<img src={`${base}/social_media/Telegram-se-320px-50q.png`} alt="TG" />
			</a>
			<a href={$t("footer.youtube")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="YouTube" data-testid="hero-social-yt-button">
				<img src={`${base}/social_media/YouTube-se-512px-50q.png`} alt="YT" />
			</a>
			<a href={$t("footer.tiktok")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="TikTok" data-testid="hero-social-tt-button">
				<img src={`${base}/social_media/TikTok-se-512-50.png`} alt="TT" />
			</a>
		</div>

		<!-- 2. Text Content (Middle) -->
		<div class="hero__text" data-testid="hero-text-group">
			<h1 class="hero__title" id="hero-title" data-testid="hero-title-label">
				{$t("hero.title")}
			</h1>
			<p class="hero__subtitle" data-testid="hero-subtitle-label">{$t("hero.subtitle")}</p>
		</div>

		<!-- 3. Image (Right) -->
		<div class="hero__image-wrap" data-testid="hero-scene-container">
			<div class="hero__image-inner" data-testid="hero-image-inner">
				{#each images as img, i}
					<img
						src={img}
						alt=""
						width="1200"
						height="900"
						loading="eager"
						fetchpriority="high"
						decoding="async"
						class="hero__image"
						class:active={currentImageIndex === i}
						data-testid={`hero-main-image-${i}`}
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
			<a href="https://maps.app.goo.gl/ya4gki6tuZv36Tjz8" target="_blank" rel="noopener noreferrer" class="hero__contact-btn" aria-label="Карта" data-testid="hero-map-button">
				<MapPinned size={24} />
			</a>
			<button class="hero__contact-btn" onclick={() => (ui.isPhonesModalOpen = true)} aria-label="Телефони" data-testid="hero-phones-button">
				<Phone size={24} />
			</button>
			<button class="hero__contact-btn" onclick={handleEmailClick} aria-label="Email" data-testid="hero-email-button">
				<Mail size={24} />
			</button>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		background: linear-gradient(
			180deg,
			var(--color-light-blue) 0%,
			var(--color-sky-blue) 60%,
			var(--color-surface) 100%
		);
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
	}

	/* Social Links (Left Column) */
	.hero__social {
		display: flex;
		flex-direction: column;
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
		color: var(--color-deep-ocean);
		line-height: 1.1;
		margin-bottom: var(--space-lg, 2rem);
		letter-spacing: -0.01em;
	}

	.hero__subtitle {
		font-family: var(--font-heading);
		font-size: clamp(1rem, 2vw, 1.25rem);
		font-weight: 500;
		color: var(--color-body-text);
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
		box-shadow: 0 30px 60px rgba(0,0,0,0.12);
		z-index: 2;
		aspect-ratio: 4 / 3;
		/* min-height: 100px; */
		background: var(--color-light-blue);
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
		border: 15px solid color-mix(in srgb, var(--color-surface), transparent 80%);
		border-radius: inherit;
		pointer-events: none;
	}

	/* Decorative clouds */
	.hero__cloud {
		position: absolute;
		border-radius: 50%;
		z-index: -1;
	}

	.hero__cloud--1 {
		width: 200px;
		height: 200px;
		background: radial-gradient(
			circle,
			var(--theme-cloud-strong) 0%,
			transparent 70%
		);
		top: -30px;
		right: -40px;
	}

	.hero__cloud--2 {
		width: 150px;
		height: 150px;
		background: radial-gradient(
			circle,
			var(--theme-cloud-soft) 0%,
			transparent 70%
		);
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
		background: var(--color-surface);
		color: var(--color-deep-ocean);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(0,0,0,0.05);
		box-shadow: 0 8px 20px rgba(0,0,0,0.08);
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		cursor: pointer;
	}

	.hero__contact-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 25px rgba(0,0,0,0.12);
		color: var(--color-sea-blue);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.hero__content {
			grid-template-columns: 60px 1fr 1.2fr;
			gap: var(--space-xl, 2rem);
		}
		.hero__social {
			position: absolute;
			left: 24px;
			top: 0;
			flex-direction: row;
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