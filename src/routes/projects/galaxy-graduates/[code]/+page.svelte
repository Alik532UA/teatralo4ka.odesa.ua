<script lang="ts">
	import { t } from "svelte-i18n";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { fly } from "svelte/transition";
	import { Pencil, X } from "lucide-svelte";
	import { asset } from "$app/paths";
	import GraduateProfileView from "$lib/components/GraduateProfileView.svelte";
	import { scrollFade } from "$lib/utils/scrollFade";
	import GraduateGalaxy from "$lib/components/GraduateGalaxy.svelte";
	import { localeFromPath, localizedPath } from "$lib/i18n/routing";
	import {
		graduateProfilePath,
		type GraduateIndexEntry,
	} from "$lib/data/graduates";

	let { data } = $props();

	const galaxyHref = $derived(
		localizedPath(
			"/projects/galaxy-graduates/",
			localeFromPath(page.url.pathname),
		),
	);

	let isDesktop = $state(false);
	let contactOpen = $state(false);
	let contactEl: HTMLDivElement | undefined = $state();

	let profileEl = $state<HTMLElement | null>(null);
	let shiftY = $state(0);

	function updateShift() {
		if (!browser || window.innerWidth < 769 || !profileEl) {
			shiftY = 0;
			return;
		}
		const availGap = window.innerHeight - profileEl.offsetHeight;
		if (availGap >= 220) {
			shiftY = 0;
		} else if (availGap <= 100) {
			shiftY = 26;
		} else {
			const t = (220 - availGap) / 120;
			shiftY = Math.round(t * 26);
		}
	}

	$effect(() => {
		if (!profileEl || !browser) return;
		updateShift();
		const ro = new ResizeObserver(() => updateShift());
		ro.observe(profileEl);
		window.addEventListener("resize", updateShift);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", updateShift);
		};
	});

	function handleSelectOtherGraduate(other: GraduateIndexEntry) {
		if (other.code) {
			goto(
				localizedPath(
					graduateProfilePath(other.code),
					localeFromPath(page.url.pathname),
				),
			);
		} else {
			goto(
				localizedPath(
					"/projects/galaxy-graduates/",
					localeFromPath(page.url.pathname),
				),
			);
		}
	}

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
			<GraduateGalaxy onselect={handleSelectOtherGraduate} />
		</div>
		<div class="profile-stage__backdrop" aria-hidden="true"></div>
	{/if}

	<div class="profile" data-testid="graduate-profile-container">
		<article
			class="profile__card"
			bind:this={profileEl}
			{@attach scrollFade()}
			style="--shift-y: {shiftY}px"
			data-testid="graduate-profile-card"
		>
			<div class="card__toolbar" data-testid="graduate-profile-toolbar">
				{#if data.graduate.hasPhoto}
					<div
						class="contact-wrap"
						bind:this={contactEl}
						onmouseenter={handleMouseEnter}
						onmouseleave={handleMouseLeave}
						role="group"
						aria-label={$t("common.contact", {
							default: "Контакти",
						})}
					>
						{#if contactOpen}
							<div
								class="contact-popup"
								transition:fly={{ x: 10, duration: 180 }}
								data-testid="graduate-profile-contact-menu"
							>
								<img
									src={asset(
										"/graduates/alik-zapolnov-96.webp",
									)}
									alt="Алік Запольнов"
									width="28"
									height="28"
									class="contact-popup__avatar"
									loading="eager"
									data-testid="graduate-profile-contact-admin-img"
								/>
								<p
									class="contact-popup__hint"
									data-testid="graduate-profile-contact-hint"
								>
									Привіт!)<br />
									Щоб внести правки<br />
									— напиши мені
								</p>
								<div class="contact-popup__icons">
									{#each contacts as c (c.name)}
										<!-- rel="external" — саме за ним правило визнає посилання
										     зовнішнім; точковий disable перед `<a>` не діє, бо
										     правило звітує на рядку атрибута `href`. -->
										<a
											href={c.url}
											target="_blank"
											rel="external noopener noreferrer"
											class="contact-popup__link"
											aria-label={c.name}
											title={c.name}
											onclick={(e) => e.stopPropagation()}
											data-testid="graduate-profile-contact-link-{c.name.toLowerCase()}"
										>
											<img
												src={asset(
													`/social_media/${c.icon}`,
												)}
												alt={c.name}
												width="28"
												height="28"
												loading="eager"
											/>
										</a>
									{/each}
								</div>
							</div>
						{/if}

						<button
							type="button"
							class="card__action card__contact"
							onclick={toggleContact}
							onmouseenter={handleMouseEnter}
							onkeydown={handleContactKeydown}
							aria-expanded={contactOpen}
							aria-label={$t("common.contact", {
								default: "Зв'язатися",
							})}
							title={$t("common.contact", {
								default: "Зв'язатися",
							})}
							data-testid="graduate-profile-edit-btn"
						>
							<Pencil size={20} aria-hidden="true" />
						</button>
					</div>
				{/if}

				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					href={galaxyHref}
					class="card__action card__close"
					aria-label={$t("common.close", { default: "Закрити" })}
					title={$t("galaxy.backToGalaxy", {
						default: "Повернутися до галактики",
					})}
					data-testid="graduate-profile-close-btn"
				>
					<X size={20} aria-hidden="true" />
				</a>
			</div>

			<GraduateProfileView
				graduate={data.graduate}
				profile={data.profile}
				heading="h1"
				headingId="graduate-name"
			/>
		</article>
	</div>
</div>

<style>
	.profile-stage {
		width: 100%;
	}

	.profile-stage__stars {
		display: none;
	}

	.profile-stage__backdrop {
		display: none;
	}

	.profile {
		width: min(720px, 100%);
		margin: 0 auto;
		padding: clamp(1rem, 3vh, 2rem) 0 clamp(4.5rem, 8vh, 6rem);
	}

	/* Темна картка: впізнаваність об'єкта галактики */
	.profile__card {
		position: relative;
		padding: clamp(1rem, 3vh, 1.75rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
	}

	.card__toolbar {
		position: absolute;
		top: -3.2rem;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 10;
	}

	.card__action {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 50%;
		background: rgb(3 6 20 / 0.75);
		color: #cfe4ff;
		cursor: pointer;
		backdrop-filter: blur(8px);
		text-decoration: none;
	}

	.card__contact {
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.card__contact:hover,
	.card__close:hover {
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.7);
		color: #fff;
	}

	/* Контактне випадаюче меню */
	.contact-wrap {
		position: relative;
	}

	.contact-popup {
		position: absolute;
		top: 50%;
		right: calc(100% + 0.65rem);
		transform: translateY(-50%);
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.65rem;
		padding: 0.35rem 0.65rem;
		background: rgb(3 6 20 / 0.88);
		border: 1px solid rgb(140 190 255 / 0.28);
		border-radius: 999px;
		box-shadow: 0 8px 28px rgb(0 0 0 / 0.55);
		backdrop-filter: blur(14px);
		white-space: nowrap;
	}

	.contact-popup__avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid rgb(140 190 255 / 0.4);
		flex-shrink: 0;
	}

	.contact-popup__hint {
		margin: 0;
		font-size: 0.84rem;
		color: rgb(180 210 255 / 0.85);
		line-height: 1;
	}

	.contact-popup__icons {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.35rem;
	}

	.contact-popup__link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		text-decoration: none;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			filter 0.2s ease;
	}

	.contact-popup__link:hover {
		transform: scale(1.18);
		filter: drop-shadow(0 0 8px rgb(140 190 255 / 0.5));
	}

	.contact-popup__link img {
		width: 28px;
		height: 28px;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.3));
	}

	@media (max-width: 768px) {
		.card__toolbar {
			position: sticky;
			top: 0;
			right: 0;
			float: right;
			z-index: 10;
		}

		.card__action {
			border: none;
			background: rgb(255 255 255 / 0.12);
			color: inherit;
		}

		.contact-popup {
			right: auto;
			left: 0;
			top: calc(100% + 0.4rem);
			flex-direction: row;
		}
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

		:global(body.page-galaxy) .profile-stage__backdrop {
			display: block;
			position: absolute;
			inset: 0;
			z-index: 0;
			background: rgb(3 6 20 / 0.72);
			backdrop-filter: blur(3px);
			-webkit-backdrop-filter: blur(3px);
			pointer-events: none;
		}

		:global(body.page-galaxy) .profile {
			position: relative;
			z-index: 1;
			width: min(1760px, 96vw);
			/*
			 * ДРУГА копія магічних 840. Перша жила в модалці й різала зміст;
			 * прибрали її — а тут лишилася, і власна сторінка випускника далі
			 * обрізала останні рядки. Заміряно на 1440×900: останній рядок
			 * вистав закінчувався на 988 px при вікні 900, і колесо його не
			 * діставало, бо сцена має `overflow: hidden`, а сама картка не
			 * прокручувалася взагалі.
			 *
			 * Тепер межа одна — висота сцени, а прокрутку бере картка нижче.
			 */
			max-height: 100%;
			min-height: 0;
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		:global(body.page-galaxy) .profile__card {
			position: relative;
			width: fit-content;
			max-width: 100%;
			min-height: 0;
			background: transparent;
			border: none;
			box-shadow: none;
			padding: 0;
			transform: translateY(var(--shift-y, 0px));
			/*
			 * Прокручується САМЕ картка, а не сцена: сцена — нерухоме тло на
			 * весь екран із зорями, і зсувати її не можна. Ширина картки
			 * дорівнює змісту, тож поля обабіч лишаються тлом.
			 */
			max-height: 100%;
			overflow-y: auto;
			scrollbar-width: none;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		:global(body.page-galaxy) .card__toolbar {
			top: -3.25rem;
		}
	}
</style>
