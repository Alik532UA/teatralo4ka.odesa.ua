<script lang="ts">
	import { t } from "svelte-i18n";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { page } from "$app/state";
	import { fly } from "svelte/transition";
	import { Pencil } from "lucide-svelte";
	import { asset } from "$app/paths";
	import GraduateProfileView from "$lib/components/GraduateProfileView.svelte";
	import { localeFromPath, withLocale } from "$lib/i18n/routing";

	let { data } = $props();

	const galaxyHref = $derived(
		withLocale(
			"/projects/galaxy-graduates",
			localeFromPath(page.url.pathname),
		),
	);

	let isDesktop = $state(false);
	let contactOpen = $state(false);
	let contactEl: HTMLDivElement | undefined = $state();

	const contacts = [
		{ name: "Telegram", url: "https://t.me/alik532", icon: "telegram.svg" },
		{
			name: "Viber",
			url: "viber://chat?number=%2B380937251208",
			icon: "viber.svg",
		},
		{
			name: "WhatsApp",
			url: "https://wa.me/380937251208",
			icon: "whatsapp.svg",
		},
		{
			name: "LinkedIn",
			url: "https://linkedin.com/in/alik-qa-engineer",
			icon: "linkedin.svg",
		},
	];

	let hoverOpenedAt = 0;
	let closeTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleMouseEnter() {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = undefined;
		}
		if (!contactOpen) {
			contactOpen = true;
			hoverOpenedAt = Date.now();
		}
	}

	function handleMouseLeave() {
		if (contactOpen) {
			closeTimeout = setTimeout(() => {
				contactOpen = false;
				closeTimeout = undefined;
			}, 2000);
		}
	}

	function toggleContact(e: Event) {
		e.stopPropagation();
		if (contactOpen && Date.now() - hoverOpenedAt < 1000) {
			return;
		}
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = undefined;
		}
		contactOpen = !contactOpen;
		if (contactOpen) {
			hoverOpenedAt = 0;
		}
	}

	function handleContactKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			toggleContact(e);
		}
		if (e.key === "Escape" && contactOpen) {
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				closeTimeout = undefined;
			}
			contactOpen = false;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (contactOpen && contactEl && !contactEl.contains(e.target as Node)) {
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				closeTimeout = undefined;
			}
			contactOpen = false;
		}
	}

	onMount(() => {
		const mql = window.matchMedia("(min-width: 769px)");
		isDesktop = mql.matches;
		if (isDesktop) document.body.classList.add("page-galaxy");

		const update = (e: MediaQueryListEvent) => {
			isDesktop = e.matches;
			if (isDesktop) document.body.classList.add("page-galaxy");
			else document.body.classList.remove("page-galaxy");
		};
		mql.addEventListener("change", update);

		return () => {
			if (closeTimeout) clearTimeout(closeTimeout);
			document.body.classList.remove("page-galaxy");
			mql.removeEventListener("change", update);
		};
	});
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<title>{data.graduate.name} — {$t("galaxy.title")}</title>
</svelte:head>

<div class="profile-stage" data-testid="graduate-profile-section">
	{#if browser && isDesktop}
		<div class="profile-stage__stars" aria-hidden="true">
			{#await import("$lib/components/backgrounds/Starfield.svelte") then { default: Starfield }}
				<Starfield />
			{/await}
		</div>
	{/if}

	<div class="profile">
		<article class="profile__card">
			<GraduateProfileView
				graduate={data.graduate}
				profile={data.profile}
				heading="h1"
				headingId="graduate-name"
			/>
		</article>
	</div>

	<!-- Панель дій у правому нижньому кутку -->
	<div class="profile__actions">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a
			class="profile__btn profile__btn--back"
			href={galaxyHref}
			data-testid="graduate-profile-back-link"
		>
			<span>{$t("galaxy.backToGalaxy")}</span>
		</a>

		<div
			class="contact-wrap"
			bind:this={contactEl}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
		>
			{#if contactOpen}
				<div
					class="contact-popup"
					transition:fly={{ y: 10, duration: 180 }}
					data-testid="graduate-profile-contact-menu"
				>
					<img
						src={asset("/graduates/alik-zapolnov-96.webp")}
						alt="Алік Запольнов"
						width="36"
						height="36"
						class="contact-popup__avatar"
						loading="eager"
						data-testid="graduate-profile-contact-admin-img"
					/>
					<p
						class="contact-popup__hint"
						data-testid="graduate-profile-contact-hint"
					>
						Привіт!) Щоб внести<br />правки — напиши мені
					</p>
					<div class="contact-popup__icons">
						{#each contacts as c (c.name)}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={c.url}
								target="_blank"
								rel="noopener noreferrer"
								class="contact-popup__link"
								aria-label={c.name}
								title={c.name}
								onclick={(e) => e.stopPropagation()}
								data-testid="graduate-profile-contact-link-{c.name.toLowerCase()}"
							>
								<img
									src={asset(`/social_media/${c.icon}`)}
									alt={c.name}
									width="32"
									height="32"
									loading="eager"
								/>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<button
				type="button"
				class="profile__btn profile__btn--contact"
				onclick={toggleContact}
				onmouseenter={handleMouseEnter}
				onkeydown={handleContactKeydown}
				aria-expanded={contactOpen}
				aria-label={$t("common.contact", { default: "Зв'язатися" })}
				title={$t("common.contact", { default: "Зв'язатися" })}
				data-testid="graduate-profile-edit-btn"
			>
				<Pencil size={18} aria-hidden="true" />
			</button>
		</div>
	</div>
</div>

<style>
	.profile-stage {
		width: 100%;
	}

	.profile-stage__stars {
		display: none;
	}

	.profile {
		width: min(720px, 100%);
		margin: 0 auto;
		padding: clamp(1rem, 3vh, 2rem) 0 clamp(4.5rem, 8vh, 6rem);
	}

	/* Темна картка: впізнаваність об'єкта галактики */
	.profile__card {
		padding: clamp(1rem, 3vh, 1.75rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
	}

	.profile__actions {
		position: fixed;
		bottom: clamp(1rem, 3vh, 1.75rem);
		right: clamp(1rem, 3vw, 1.75rem);
		z-index: 50;
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.profile__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		background: var(--galaxy-card-bg);
		border: 1px solid rgb(140 190 255 / 0.28);
		border-radius: 999px;
		color: #cfe4ff;
		text-decoration: none;
		box-shadow: 0 10px 28px rgb(0 0 0 / 0.45);
		backdrop-filter: blur(14px);
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.profile__btn:hover {
		transform: translateY(-2px);
		background: rgb(140 190 255 / 0.22);
		border-color: rgb(140 190 255 / 0.65);
		color: #fff;
	}

	.profile__btn--back {
		gap: 0.5rem;
		padding: 0 1.25rem;
		font-size: 0.95rem;
		font-weight: 500;
	}

	.profile__btn--contact {
		width: 44px;
		height: 44px;
		padding: 0;
		cursor: pointer;
	}

	/* Контактне випадаюче меню */
	.contact-wrap {
		position: relative;
	}

	.contact-popup {
		position: absolute;
		bottom: calc(100% + 0.65rem);
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.85rem;
		background: var(--galaxy-card-bg);
		border: 1px solid rgb(140 190 255 / 0.28);
		border-radius: 1rem;
		box-shadow: 0 12px 36px rgb(0 0 0 / 0.55);
		backdrop-filter: blur(14px);
		white-space: nowrap;
	}

	.contact-popup__hint {
		margin: 0;
		font-size: 0.84rem;
		color: rgb(180 210 255 / 0.85);
		line-height: 1.3;
		text-align: center;
	}

	.contact-popup__icons {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}

	.contact-popup__avatar {
		position: absolute;
		top: -14px;
		left: -14px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgb(140 190 255 / 0.55);
		box-shadow: 0 4px 14px rgb(0 0 0 / 0.6);
		background: #000;
		z-index: 2;
	}

	.contact-popup__link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		text-decoration: none;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			filter 0.2s ease;
	}

	.contact-popup__link:hover {
		transform: scale(1.15);
		filter: drop-shadow(0 0 8px rgb(140 190 255 / 0.5));
	}

	.contact-popup__link img {
		width: 32px;
		height: 32px;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.3));
	}

	@media (min-width: 769px) {
		:global(body.page-galaxy) .profile-stage {
			position: fixed;
			inset: 0;
			display: grid;
			place-items: center;
			padding: 1.5rem;
			background: var(--galaxy-bg);
			overflow: hidden;
		}

		:global(body.page-galaxy) .profile-stage__stars {
			display: block;
			position: absolute;
			inset: 0;
			z-index: 0;
		}

		:global(body.page-galaxy) .profile {
			position: relative;
			z-index: 1;
			width: min(1760px, 96vw);
			max-height: min(90dvh, 840px);
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		:global(body.page-galaxy) .profile__card {
			width: 100%;
			min-height: 0;
			background: transparent;
			border: none;
			box-shadow: none;
			padding: 0;
			overflow: visible;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
	}
</style>
