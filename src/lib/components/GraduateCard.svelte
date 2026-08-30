<script lang="ts">
	import { getAbortSignal } from "svelte";
	import { page } from "$app/state";
	import { focusTrap } from "$lib/utils/focusTrap";
	import { overlayFade, overlayPop } from "$lib/utils/overlayTransition";
	import {
		type GraduateIndexEntry,
		type GraduateProfile,
	} from "$lib/data/graduates";
	import { localeFromPath, localizedPath } from "$lib/i18n/routing";
	import {
		cachedGraduateProfile,
		ensureGraduateProfile,
	} from "$lib/services/graduateProfiles.svelte";
	import GraduateProfileView from "./GraduateProfileView.svelte";
	import GraduateCardToolbar from "./GraduateCardToolbar.svelte";

	import { browser } from "$app/environment";

	interface Props {
		graduate: GraduateIndexEntry | null;
		/**
		 * Анкета, якщо сторінка вже має її на руках (галактика тримає власний
		 * стан, сторінка профілю дістає файл під час prerender). Не передали —
		 * картка прочитає її сама, і тоді виклик зводиться до одного `graduate`.
		 */
		profile?: GraduateProfile | null;
		/**
		 * Показати кнопку «летіти до галактики». Її вмикають там, де картка
		 * відкрилася ПОЗА галактикою — на сторінці майстра чи навчальної групи:
		 * доти з такої картки ходу в саму галактику не було взагалі. На самій
		 * галактиці прапорець лишається знятим, бо вести звідти нікуди.
		 */
		showGalaxyLink?: boolean;
		onclose: () => void;
	}

	let {
		graduate,
		profile,
		showGalaxyLink = false,
		onclose,
	}: Props = $props();
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

	/**
	 * Адреса САМОЇ галактики, а не цього ж випускника.
	 *
	 * Доти кнопка вела на власну сторінку людини, чия картка відкрита, — тобто
	 * рівно на те, що читач уже бачить перед собою. «Летіти до галактики» має
	 * везти в галактику.
	 *
	 * Навести галактику на конкретну зірку вона не вміє: параметр `at` там —
	 * рік для списку, а не людина. Тому адреса одна для всіх.
	 */
	const galaxyHref = $derived.by(() => {
		if (!showGalaxyLink) return null;
		return localizedPath("/projects/galaxy-graduates/", localeFromPath(page.url.pathname));
	});

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

	/**
	 * Стан меню контактів лишився ТУТ, хоч саме меню поїхало в тулбар: Escape
	 * ловить `svelte:window` нижче, і перше натискання має закривати меню, а не
	 * всю картку. Тому проп двобічний.
	 */
	let contactOpen = $state(false);

	function handleKeydown(event: KeyboardEvent) {
		if (!graduate) return;
		if (event.key === "Escape") {
			if (contactOpen) {
				contactOpen = false;
				event.stopPropagation();
				return;
			}
			event.preventDefault();
			onclose();
		}
	}

	/**
	 * Перевірки «клік не всередині меню» тут більше немає: підкладка лежить
	 * НИЖЧЕ меню, тож клік по самому меню до неї й не доходив — умова була
	 * завжди істинною. `onclose()` викликається так само, і картка зникає
	 * разом з усім своїм станом.
	 */
	function handleBackdropClick() {
		contactOpen = false;
		onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if graduate}
	<div
		class="backdrop"
		transition:overlayFade
		onclick={handleBackdropClick}
		role="presentation"
		data-testid="galaxy-card-backdrop"
	></div>

	<div
		class="card"
		transition:overlayPop
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
			<GraduateCardToolbar
				hasPhoto={!!graduate.hasPhoto}
				{galaxyHref}
				bind:open={contactOpen}
				{onclose}
			/>

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
		z-index: var(--z-modal-backdrop);
		background: rgb(3 6 20 / 0.72);
		backdrop-filter: blur(3px);
	}
	.card {
		position: fixed;
		z-index: var(--z-modal);
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
	}
</style>
