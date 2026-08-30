<script lang="ts">
	import { localizedPath, type Locale } from '$lib/i18n/routing';
	import type { ResolvedPathname } from '$app/types';
	import ContactAskButton from './ContactAskButton.svelte';

	interface Props {
		rosterLabel: string;
		formLabel: string;
		askLabel: string;
		/** Підпис у спливаючому меню месенджерів. */
		askHint: string;
		lang: Locale;
	}

	let { rosterLabel, formLabel, askLabel, askHint, lang }: Props = $props();

	/**
	 * Обидві кнопки — ПОСИЛАННЯ в нову вкладку, а не виклики, що відкривають
	 * вікна поверх цього.
	 *
	 * До оголошення приходять за надісланим посиланням, і кнопки виклику в
	 * інтерфейсі воно не має. Той, хто пішов звідси в реєстр, назад уже не
	 * повернеться: закривши реєстр, він побачить галактику, а не оголошення.
	 *
	 * Приведення типу — те саме, що в `GraduateYears`: шлях уже пройшов
	 * `localizedPath`, а рядок запиту резолвити нема чого, він не частина
	 * маршруту.
	 */
	const galaxyHref = $derived(localizedPath('/projects/galaxy-graduates/', lang));
	const rosterHref = $derived(`${galaxyHref}?roster=open` as ResolvedPathname);
	const formHref = $derived(`${galaxyHref}?form=open` as ResolvedPathname);
</script>

<div class="actions">
	<a
		class="btn btn--main"
		href={rosterHref}
		target="_blank"
		rel="noopener"
		data-testid="galaxy-update-roster-link"
	>
		{rosterLabel}
	</a>

	<a
		class="btn"
		href={formHref}
		target="_blank"
		rel="noopener"
		data-testid="galaxy-update-form-link"
	>
		{formLabel}
	</a>

	<ContactAskButton label={askLabel} hint={askHint} placement="above" />
</div>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem;
		margin-top: 1.2rem;
	}
	/*
	 * Друга половина селектора — для кнопки, яку малює `ContactAskButton`.
	 *
	 * Клас передається їй пропом, але scoped-стилі Svelte підписані хешем ЦЬОГО
	 * компонента, а елемент народжується в дочірньому й дістає його хеш. Правило
	 * просто не збігалося: кнопка виходила без рамки й тла, заввишки 16px замість
	 * 46. `:global` під власним контейнером повертає її у вигляд
	 * сусідів і нікуди за межі блоку не тече.
	 */
	.btn,
	.actions :global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/*
		 * Висота ГНУЧКА, а не фіксована: на телефоні «Переглянути список
		 * випускників» в один рядок не стає й вилазило за екран (заміряно:
		 * правий край 441 при ширині 375). Тепер напис переноситься, а кнопка
		 * росте вниз.
		 */
		min-height: 44px;
		max-width: 100%;
		text-align: center;
		/*
		 * Без цього рядка гнучка висота вище не працювала: глобальний `.btn`
		 * ставить `white-space: nowrap`, і напис не переносився, а просто вилазив
		 * за кнопку. Заміряно на 375px: кнопка 21…354, текст 5…370 — по обидва
		 * боки назовні.
		 */
		white-space: normal;
		padding: 0.4rem 1.1rem;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.06);
		color: var(--galaxy-text);
		font: inherit;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}
	.btn:hover,
	.actions :global(.btn:hover) {
		background: rgb(140 190 255 / 0.22);
		border-color: rgb(140 190 255 / 0.6);
	}
	/*
	 * Складений селектор — з тієї ж причини, що й у `AdultsCallToAction`:
	 * базове правило вище теж складене, і одинокий `.btn--main` програвав йому
	 * за специфічністю, тож головна кнопка нічим не відрізнялася від сусідніх.
	 */
	/*
	 * На телефоні напис «Переглянути список випускників» не ставав у рядок, і
	 * кнопка росла вдвічі: три такі з'їдали третину екрана, а картці лишалося
	 * місця на півтора пункти. Менший кегль і тісніший трекінг повертають
	 * кожну кнопку до одного рядка; перенос вище лишається запобіжником для
	 * ще вужчих екранів і довших перекладів.
	 */
	@media (max-width: 480px) {
		.actions {
			margin-top: 0.9rem;
		}
		.btn,
		.actions :global(.btn) {
			font-size: 0.85rem;
			letter-spacing: 0.4px;
			padding-inline: 0.9rem;
		}
	}
	.actions .btn--main {
		background: rgb(140 190 255 / 0.28);
		border-color: rgb(140 190 255 / 0.6);
		color: #fff;
	}
</style>
