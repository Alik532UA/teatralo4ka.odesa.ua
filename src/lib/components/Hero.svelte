<script lang="ts">
	import Wave from "./Wave.svelte";
	import { t } from "svelte-i18n";
	import { base } from "$app/paths";
	import { onMount } from "svelte";

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
</script>

<section class="hero" id="hero-section" aria-label="Головна секція">

	<div class="hero__content container">
		<!-- 1. Social Links (Left) -->
		<div class="hero__social">
			<a href={$t("footer.facebook")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="Facebook" data-testid="hero-social-fb">
				<img src={`${base}/social_media/facebook-se-512-50.png`} alt="FB" />
			</a>
			<a href={$t("footer.instagram")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="Instagram" data-testid="hero-social-ig">
				<img src={`${base}/social_media/instagram-se-512-50.png`} alt="IG" />
			</a>
			<a href={$t("footer.telegram")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="Telegram" data-testid="hero-social-tg">
				<img src={`${base}/social_media/Telegram-se-320px-50q.png`} alt="TG" />
			</a>
			<a href={$t("footer.youtube")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="YouTube" data-testid="hero-social-yt">
				<img src={`${base}/social_media/YouTube-se-512px-50q.png`} alt="YT" />
			</a>
			<a href={$t("footer.tiktok")} target="_blank" rel="noopener noreferrer" class="hero__social-btn" aria-label="TikTok" data-testid="hero-social-tt">
				<img src={`${base}/social_media/TikTok-se-512-50.png`} alt="TT" />
			</a>
		</div>

		<!-- 2. Text Content (Middle) -->
		<div class="hero__text">
			<h1 class="hero__title" id="hero-title">
				{$t("hero.title")}
			</h1>
			<p class="hero__subtitle">{$t("hero.subtitle")}</p>
		</div>

		<!-- 3. Image (Right) -->
		<div class="hero__image-wrap">
			<div class="hero__image" id="hero-image">
				{#each images as img, i}
					<img
						src={img}
						alt=""
						width="1200"
						height="900"
						loading="eager"
						fetchpriority="high"
						decoding="async"
						class:active={currentImageIndex === i}
					/>
				{/each}
			</div>
			<!-- Decorative blue cloud shapes -->
			<div class="hero__cloud hero__cloud--1" aria-hidden="true"></div>
			<div class="hero__cloud hero__cloud--2" aria-hidden="true"></div>
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
			var(--color-white) 100%
		);
		padding: calc(var(--header-height) + var(--space-4xl)) 0
			var(--space-4xl);
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
		gap: var(--space-2xl);
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
		from { opacity: 0; transform: translateX(-20px); }
		to { opacity: 1; transform: translateX(0); }
	}

	/* Text — Highest Layer */
	.hero__text {
		position: relative;
		z-index: 10;
		animation: fadeInUp 0.8s ease-out;
	}

	.hero__title {
		font-family: var(--font-heading);
		font-size: clamp(2.2rem, 5vw, 3.5rem);
		font-weight: 900;
		text-transform: uppercase;
		color: var(--color-deep-ocean);
		line-height: 1.1;
		margin-bottom: var(--space-lg);
		letter-spacing: -0.01em;
	}

	.hero__subtitle {
		font-family: var(--font-heading);
		font-size: clamp(1rem, 2vw, 1.25rem);
		font-weight: 500;
		color: var(--color-body-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-xl);
	}

	/* Image area — Lower than seagulls */
	.hero__image-wrap {
		position: relative;
		z-index: 2;
		animation: fadeInUp 0.8s ease-out 0.2s both;
	}

	.hero__image {
		width: 100%;
		aspect-ratio: 4 / 3;
		min-height: 300px;
		border-radius: 40px;
		overflow: hidden;
		box-shadow: var(--theme-image-shadow);
		cursor: pointer;
		position: relative;
	}

	.hero__image img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 1.2s ease-in-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		opacity: 0;
	}

	.hero__image img.active {
		opacity: 1;
	}

	.hero__image:hover img.active {
		transform: scale(1.08);
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

	/* Responsive */
	@media (max-width: 1024px) {
		.hero__content {
			grid-template-columns: 1fr 1.2fr;
			gap: var(--space-xl);
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
			padding-top: calc(var(--header-height) + var(--space-2xl));
			min-height: auto;
		}

		.hero__content {
			display: flex;
			flex-direction: column;
			gap: var(--space-xl);
			text-align: center;
		}

		.hero__text {
			display: contents; /* Allows children to participate in flex layout */
		}

		.hero__title {
			order: 1;
			margin-bottom: 0;
		}

		.hero__image-wrap {
			order: 2;
		}

		.hero__subtitle {
			order: 3;
			margin-top: 0;
			margin-bottom: 0;
		}

		.hero__social {
			position: static;
			justify-content: center;
			order: 4;
			margin-top: var(--space-md);
			margin-bottom: 0;
		}

		.hero__image {
			min-height: 220px;
		}
	}
</style>
