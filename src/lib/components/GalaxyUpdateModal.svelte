<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { X } from 'lucide-svelte';
	import { asset } from '$app/paths';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { MediaQuery } from 'svelte/reactivity';
	import { customScroll } from '$lib/utils/customScroll';
	import { overlayFade, overlayPop } from '$lib/utils/overlayTransition';
	import GalaxyUpdateSearch from './GalaxyUpdateSearch.svelte';
	import GalaxyUpdateIllustration from './GalaxyUpdateIllustration.svelte';
	import GalaxyUpdateActions from './GalaxyUpdateActions.svelte';
	import GalaxyUpdateStars from './GalaxyUpdateStars.svelte';

	/**
	 * Вітальне вікно про переїзд галактики зі старого сайту.
	 *
	 * Текст лежить у `static/galaxy/update-*.json` і ПРИХОДИТЬ ЗАПИТОМ, а не
	 * через словник i18n. Причин дві, і обидві важать:
	 *
	 *  1. Це контент, а не підписи інтерфейсу. Він довгий, змінюється окремо від
	 *     коду й читається один раз — рівно той випадок, для якого в проєкті вже
	 *     є взірець: анкети випускників теж лежать у `static` і читаються на
	 *     вимогу, тоді як в індексі — самі імена.
	 *  2. Клієнтський бандл тісний: `check-bundle-budget` тримає весь клієнтський
	 *     JS у межах 640 КБ, і перед цим вікном там лишалося 0.1 КБ. Словники
	 *     i18n потрапляють у бандл ЦІЛКОМ, тож два екрани тексту в них завалили
	 *     б збірку; у `static` вони не важать нічого.
	 */
	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();

	interface Feature {
		/** Ключ ілюстрації: `galaxy`, `photos`, `teachers`, `groups`, `form`. */
		id: string;
		title: string;
		text: string;
	}
	interface UpdateText {
		title: string;
		lead: string[];
		searchLabel: string;
		searchPlaceholder: string;
		searchEmpty: string;
		searchNoProfile: string;
		featuresTitle: string;
		features: Feature[];
		note: string;
		ctaRoster: string;
		ctaForm: string;
		ctaAsk: string;
		askHint: string;
	}

	let text = $state<UpdateText | null>(null);
	const id = $props.id();

	const lang = $derived($locale === 'en' ? 'en' : 'uk');

	$effect(() => {
		const file = asset(`/galaxy/update-${lang}.json`);
		let alive = true;
		fetch(file)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (alive) text = data;
			})
			.catch(() => {
				// Мовчки: вікно просто не з'явиться, а сторінка під ним ціла.
			});
		return () => {
			alive = false;
		};
	});

	/**
	 * На який пункт зараз наведено.
	 *
	 * Потрібно рівно одному з них: коли курсор на «Живій галактиці», затемнення
	 * й розмиття позаду плавно зникають — щоб було видно, як зірки й випускники
	 * справді летять. Розповідати про це словами й ховати саме видовище за
	 * матовим склом було б дивно.
	 */
	let hovered = $state<string | null>(null);

	/**
	 * Наскільки смуга прокрутки відходить від вікна.
	 *
	 * Значення РЕАКТИВНЕ, і це не примха: `customScroll` читає його один раз при
	 * під'єднанні, тож постійні −56 виносили смугу за правий край телефона
	 * (заміряно: 391 при екрані 375). Коли значення міняється, Svelte просто
	 * під'єднує вкладення заново — з новим зсувом.
	 */
	const wideLayout = new MediaQuery('(min-width: 769px)');
	const trackOffset = $derived(wideLayout.current ? -56 : -10);


	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if text}
	<div
		class="backdrop"
		class:backdrop--clear={hovered === 'galaxy'}
		transition:overlayFade
		onclick={onclose}
		role="presentation"
		data-testid="galaxy-update-backdrop"
	></div>

	<div
		class="sheet"
		transition:overlayPop={{ y: 18 }}
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		{@attach focusTrap()}
		data-testid="galaxy-update-modal"
	>
		<button
			type="button"
			class="sheet__close"
			onclick={onclose}
			aria-label={$t('common.close')}
			data-testid="galaxy-update-close-btn"
		>
			<X size={20} aria-hidden="true" />
		</button>

		<!--
			Скрол такий самий, як у списку вистав на картці випускника: коли
			людина обрала власну смугу прокрутки, вона має бути власною скрізь,
			а не лише на «головних» екранах.
		-->
		<div
			class="sheet__scroll"
			{@attach customScroll({
				alignThumb: 'right',
				rightOffset: trackOffset,
				parentLevel: 1
			})}
		>
			<h2 class="sheet__title" id="{id}-title" data-testid="galaxy-update-title">
				{text.title}
			</h2>

			{#each text.lead as paragraph, index (index)}
				<p class="lead" data-testid="galaxy-update-lead-item-{index}">{paragraph}</p>
			{/each}

			<h3 class="sheet__subtitle">{text.searchLabel}</h3>
			<GalaxyUpdateSearch
				label={text.searchLabel}
				placeholder={text.searchPlaceholder}
				emptyText={text.searchEmpty}
				noProfileText={text.searchNoProfile}
				{lang}
			/>

			<h3 class="sheet__subtitle">{text.featuresTitle}</h3>
			<ul class="features" data-testid="galaxy-update-list">
				{#each text.features as feature (feature.id)}
					<li
						class="feature"
						class:feature--galaxy={feature.id === 'galaxy'}
						onmouseenter={() => (hovered = feature.id)}
						onmouseleave={() => (hovered = null)}
						data-testid="galaxy-update-item-{feature.id}"
					>
						{#if feature.id === 'galaxy'}
							<GalaxyUpdateStars />
						{/if}
						<span class="feature__body">
							<strong class="feature__title">{feature.title}</strong>
							<span class="feature__text">{feature.text}</span>
						</span>
						<GalaxyUpdateIllustration
							id={feature.id}
							{lang}
							active={hovered === feature.id}
						/>
					</li>
				{/each}
			</ul>

			<p class="note" data-testid="galaxy-update-note-text">{text.note}</p>

		</div>

		<!--
			Кнопки — ПОЗА зоною прокрутки.
			Доти вони їхали разом із текстом, і спливаюче меню месенджерів
			розпирало ту зону: замість накритися поверх, воно додавало сторінці
			ще одну смугу прокрутки. Тепер вони стоять підвалом вікна, меню
			розкривається вгору й лягає поверх тексту, нічого не зсуваючи.
		-->
		<GalaxyUpdateActions
			rosterLabel={text.ctaRoster}
			formLabel={text.ctaForm}
			askLabel={text.ctaAsk}
			askHint={text.askHint}
			{lang}
		/>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal-backdrop);
		background: rgb(3 6 20 / 0.72);
		backdrop-filter: blur(3px);
		/* Удвічі повільніше за звичайний перехід: тло тут не «перемикається»,
		   а розступається, щоб дати роздивитися галактику. */
		transition:
			background 640ms ease,
			backdrop-filter 640ms ease;
	}
	.backdrop--clear {
		background: rgb(3 6 20 / 0);
		backdrop-filter: blur(0);
	}
	.sheet {
		position: fixed;
		z-index: var(--z-modal);
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		width: min(1040px, calc(100vw - 2rem));
		max-height: min(calc(100dvh - 2rem), 860px);
		display: flex;
		flex-direction: column;
		padding: clamp(1.1rem, 3vw, 1.9rem);
		border-radius: 1.5rem;
		background: var(--galaxy-card-bg);
		border: 1px solid rgb(140 190 255 / 0.22);
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.55);
		color: var(--galaxy-text);
	}
	.sheet__scroll {
		flex: 1 1 auto;
		overflow-y: auto;
		min-height: 0;
	}
	/*
	 * На телефоні хрестик лишається В КУТІ вікна: там ширина аркуша — майже
	 * весь екран, і виносити кнопку нікуди.
	 */
	.sheet__close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 50%;
		background: rgb(3 6 20 / 0.6);
		color: #cfe4ff;
		cursor: pointer;
	}
	.sheet__title {
		margin: 0 3rem 0.9rem 0;
		font-size: clamp(1.2rem, 3.4vw, 1.6rem);
		line-height: 1.25;
		color: #fff;
	}
	.sheet__subtitle {
		margin: 1.4rem 0 0.7rem;
		font-size: 1.02rem;
		color: var(--galaxy-accent);
	}
	.lead {
		margin: 0 0 0.6rem;
		line-height: 1.55;
	}
	.features {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.feature {
		transition:
			border-color var(--transition-base),
			background var(--transition-base),
			transform var(--transition-base);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 0.9rem;
		border-radius: 0.9rem;
		background: rgb(255 255 255 / 0.05);
		border: 1px solid rgb(140 190 255 / 0.14);
	}
	/* Пункт про галактику — коробка для зоряного шару під ним. */
	.feature--galaxy {
		position: relative;
		overflow: hidden;
		isolation: isolate;
	}

	.feature:hover {
		border-color: rgb(140 190 255 / 0.5);
		background: rgb(140 190 255 / 0.09);
		transform: translateY(-2px);
	}
	.feature__body {
		min-width: 0;
	}
	.feature__title {
		display: block;
		margin-bottom: 0.15rem;
		color: #fff;
	}
	/*
	 * На широкому вікно вужче на 8rem, і в цих полях стають і хрестик, і смуга
	 * прокрутки. Без запасу вони або лізли б на текст, або виходили за край.
	 *
	 * Хрестик піднято НАД верхом вікна (`top: -0.75rem`), і це не косметика:
	 * смуга починається там, де починається зона прокрутки, — на 30px нижче
	 * верху аркуша. Стоячи врівень, кнопка перекривала б початок смуги
	 * (заміряно: кнопка 52…92, смуга від 81). Тепер вона закінчується на 79 і
	 * смуга йде далі під нею — обидві праворуч від вікна, одна під одною.
	 */
	@media (min-width: 769px) {
		.sheet {
			width: min(1040px, calc(100vw - 8rem));
		}
		.sheet__close {
			top: -0.75rem;
			right: -3.5rem;
		}
	}

	/* На вузькому ілюстрація стає під текстом, а не тулиться збоку. */
	@media (max-width: 560px) {
		.feature {
			flex-direction: column;
			align-items: flex-start;
		}
	}
	.feature__text {
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--galaxy-muted);
	}
	.note {
		margin: 1.2rem 0 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--galaxy-muted);
	}
</style>
