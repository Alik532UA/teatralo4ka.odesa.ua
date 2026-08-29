<script lang="ts">
	import { localizedPath, type Locale } from '$lib/i18n/routing';
	import type { ResolvedPathname } from '$app/types';
	import GraduateCardContactMenu from './GraduateCardContactMenu.svelte';

	/**
	 * Три кнопки внизу вітального вікна: список, анкета, питання.
	 *
	 * Окремим файлом, бо вікно з ілюстраціями переросло стелю
	 * `structure.test.ts`. Заразом сюди поїхало й меню месенджерів — воно
	 * прив'язане саме до кнопки «задати питання», а не до вікна загалом.
	 *
	 * Прикладу сторінки групи тут немає навмисно: обидві такі сторінки
	 * відкриваються прямо з пункту про групи, і повторювати їх кнопкою знизу
	 * означало б вести в те саме місце двічі.
	 */
	interface Props {
		rosterLabel: string;
		formLabel: string;
		askLabel: string;
		/** Підпис у спливаючому меню месенджерів. */
		askHint: string;
		lang: Locale;
	}

	let { rosterLabel, formLabel, askLabel, askHint, lang }: Props = $props();

	let askOpen = $state(false);

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

	<div class="ask">
		<button
			type="button"
			class="btn"
			onclick={() => (askOpen = !askOpen)}
			aria-expanded={askOpen}
			data-testid="galaxy-update-ask-btn"
		>
			{askLabel}
		</button>
		{#if askOpen}
			<GraduateCardContactMenu hint={askHint} placement="above" />
		{/if}
	</div>
</div>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.2rem;
	}
	.ask {
		position: relative;
	}
	.btn {
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
	.btn:hover {
		background: rgb(140 190 255 / 0.22);
		border-color: rgb(140 190 255 / 0.6);
	}
	.btn--main {
		background: rgb(140 190 255 / 0.28);
		border-color: rgb(140 190 255 / 0.6);
		color: #fff;
	}
</style>
