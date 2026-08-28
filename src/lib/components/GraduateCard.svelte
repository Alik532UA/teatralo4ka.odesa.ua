<script lang="ts">
	import { t } from "svelte-i18n";
	import { getAbortSignal } from "svelte";
	import { fly } from "svelte/transition";
	import { X, Pencil } from "lucide-svelte";
	import { asset } from "$app/paths";
	import { focusTrap } from "$lib/utils/focusTrap";
	import type {
		GraduateIndexEntry,
		GraduateProfile,
	} from "$lib/data/graduates";
	import {
		cachedGraduateProfile,
		ensureGraduateProfile,
	} from "$lib/services/graduateProfiles.svelte";
	import GraduateProfileView from "./GraduateProfileView.svelte";

	import { browser } from "$app/environment";

	interface Props {
		graduate: GraduateIndexEntry | null;
		/**
		 * Анкета, якщо сторінка вже має її на руках (галактика тримає власний
		 * стан, сторінка профілю дістає файл під час prerender). Не передали —
		 * картка прочитає її сама, і тоді виклик зводиться до одного `graduate`.
		 */
		profile?: GraduateProfile | null;
		onclose: () => void;
	}

	let { graduate, profile, onclose }: Props = $props();
	const id = $props.id();

	/**
	 * Анкету дістає САМА картка, коли її не передали.
	 *
	 * Це те, що робить компонент придатним для будь-якої сторінки: доки читання
	 * файлу жило тільки в галактиці, решта показувала спрощений вигляд без
	 * подробиць — і людина з заповненою анкетою виглядала як незаповнена.
	 * Хто коду не має, анкети не має за визначенням: `ensureGraduateProfile`
	 * на порожньому коді нічого не робить, і картка чесно показує сам запис.
	 */
	$effect(() => {
		const code = graduate?.code;
		if (code && profile === undefined && browser) {
			ensureGraduateProfile(code, getAbortSignal());
		}
	});

	const shownProfile = $derived(
		profile !== undefined ? profile : cachedGraduateProfile(graduate?.code),
	);

	let innerEl = $state<HTMLElement | null>(null);
	let shiftY = $state(0);

	function updateShift() {
		if (!browser || window.innerWidth < 769 || !innerEl) {
			shiftY = 0;
			return;
		}
		const availGap = window.innerHeight - innerEl.offsetHeight;
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
		if (!innerEl || !browser) return;
		const _ = graduate?.slug;
		updateShift();
		const ro = new ResizeObserver(() => updateShift());
		ro.observe(innerEl);
		window.addEventListener("resize", updateShift);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", updateShift);
		};
	});

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

	let contactOpen = $state(false);
	let contactWrapEl: HTMLDivElement | undefined = $state();

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
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!graduate) return;
		if (event.key === "Escape") {
			if (contactOpen) {
				if (closeTimeout) {
					clearTimeout(closeTimeout);
					closeTimeout = undefined;
				}
				contactOpen = false;
				event.stopPropagation();
				return;
			}
			event.preventDefault();
			onclose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (
			contactOpen &&
			contactWrapEl &&
			!contactWrapEl.contains(e.target as Node)
		) {
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				closeTimeout = undefined;
			}
			contactOpen = false;
		}
		onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if graduate}
	<div
		class="backdrop"
		onclick={handleBackdropClick}
		role="presentation"
		data-testid="galaxy-card-backdrop"
	></div>

	<div
		class="card"
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		{@attach focusTrap()}
		style="--shift-y: {shiftY}px"
		data-testid="galaxy-card-modal"
	>
		<div
			class="card__inner"
			bind:this={innerEl}
			data-testid="galaxy-card-inner"
		>
			<div class="card__toolbar" data-testid="galaxy-card-toolbar">
				{#if graduate.hasPhoto}
					<div
						class="contact-wrap"
						bind:this={contactWrapEl}
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
								data-testid="galaxy-card-contact-menu"
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
									data-testid="galaxy-card-contact-admin-img"
								/>
								<p
									class="contact-popup__hint"
									data-testid="galaxy-card-contact-hint"
								>
									Привіт!) Щоб внести правки — напиши мені
								</p>
								<div class="contact-popup__icons">
									{#each contacts as c (c.name)}
										<!-- rel="external" — див. GraduateProfileView: саме за ним
										     правило визнає посилання зовнішнім. -->
										<a
											href={c.url}
											target="_blank"
											rel="external noopener noreferrer"
											class="contact-popup__link"
											aria-label={c.name}
											title={c.name}
											onclick={(e) => e.stopPropagation()}
											data-testid="galaxy-card-contact-link-{c.name.toLowerCase()}"
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

				<button
					type="button"
					class="card__action card__close"
					onclick={onclose}
					aria-label={$t("common.close")}
					data-testid="galaxy-card-close-btn"
				>
					<X size={20} aria-hidden="true" />
				</button>
			</div>

			<GraduateProfileView
				{graduate}
				profile={shownProfile}
				headingId="{id}-title"
				heading="h2"
			/>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgb(3 6 20 / 0.72);
		backdrop-filter: blur(3px);
	}
	.card {
		position: fixed;
		z-index: 61;
		left: 50%;
		top: 50%;
		translate: -50% calc(-50% + var(--shift-y, 0px));
		width: min(1760px, 96vw);
		max-height: min(calc(100dvh - 90px), 840px);
		overflow: visible;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: transparent;
		color: var(--galaxy-text);
		border: none;
		box-shadow: none;
		padding: 0;
		pointer-events: none;
	}
	.card__inner {
		position: relative;
		width: fit-content;
		max-width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0;
		pointer-events: none;
	}
	.card__inner :global(.profile-layout),
	.card__inner :global(.col) {
		pointer-events: none;
	}
	.card__inner :global(.bento-card),
	.card__inner :global(.custom-scroll-track),
	.card__inner :global(.custom-scroll-thumb) {
		pointer-events: auto;
	}
	.card__toolbar {
		position: absolute;
		top: -3.25rem;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 10;
		pointer-events: auto;
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
		.card {
			width: min(560px, calc(100vw - 2rem));
			height: auto;
			max-height: min(90dvh, 820px);
			overflow-y: auto;
			background: var(--galaxy-card-bg);
			border-radius: 1.75rem;
			box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
			padding: clamp(1rem, 3dvh, 1.5rem);
			pointer-events: auto;
		}
		.card__inner {
			padding-top: 0;
			pointer-events: auto;
		}
		.card__inner :global(.profile-layout),
		.card__inner :global(.col) {
			pointer-events: auto;
		}
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
</style>
