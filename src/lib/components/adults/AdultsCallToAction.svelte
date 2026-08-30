<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import type { ResolvedPathname } from '$app/types';
	import ContactAskButton from '$lib/components/ContactAskButton.svelte';

	/**
	 * Кнопки під проханням на сторінці викладачів.
	 *
	 * Сам текст лишається в `residents-adults.md` (обидві мови, `i18n/pages`) —
	 * це контент, і місце йому там, де решта сторінок. Тут лише те, чого
	 * markdown не вміє: три дії, з яких третя відкриває меню месенджерів.
	 *
	 * Меню розкривається ВНИЗ: блок стоїть угорі сторінки, і вгору воно пішло б
	 * за верхній край екрана.
	 */
	const lang = $derived($locale === 'en' ? ('en' as const) : ('uk' as const));

	/**
	 * Приведення типу — те саме, що в `GraduateYears`: шлях уже пройшов
	 * `localizedPath`, а рядок запиту резолвити нема чого, він не частина
	 * маршруту.
	 */
	const galaxyHref = $derived(localizedPath('/projects/galaxy-graduates/', lang));
	const formHref = $derived(`${galaxyHref}?form=open` as ResolvedPathname);
</script>

<div class="cta" data-testid="residents-adults-cta-container">
	<a class="cta__btn cta__btn--main" href={formHref} data-testid="residents-adults-form-link">
		{$t('galaxy.fillProfile', { default: 'Заповнити анкету' })}
	</a>

	<a class="cta__btn" href={galaxyHref} data-testid="residents-adults-galaxy-link">
		{$t('galaxy.title')}
	</a>

	<ContactAskButton
		label={$t('galaxy.askQuestion', { default: 'Написати' })}
		hint={$t('galaxy.askHint', { default: 'Привіт!) Питання, правки, анкета — напиши мені' })}
		placement="below"
		buttonClass="cta__btn"
	/>
</div>

<style>
	.cta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem;
		margin: 1.25rem 0 0;
	}
	/*
	 * Друга половина селектора — для кнопки, яку малює `ContactAskButton`.
	 *
	 * Клас передається їй пропом, але scoped-стилі Svelte підписані хешем ЦЬОГО
	 * компонента, а елемент народжується в дочірньому й дістає його хеш. Правило
	 * просто не збігалося: кнопка виходила без рамки й тла, заввишки 16px замість
	 * 46 (заміряно). `:global` під власним контейнером повертає її у вигляд
	 * сусідів і нікуди за межі блоку не тече.
	 */
	.cta__btn,
	.cta :global(.cta__btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		max-width: 100%;
		padding: 0.4rem 1.1rem;
		border: 1px solid var(--border-main);
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		color: var(--text-main);
		font: inherit;
		font-weight: 600;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}
	.cta__btn:hover,
	.cta :global(.cta__btn:hover) {
		border-color: var(--accent-primary);
	}
	/*
	 * Текст — `--text-on-accent`, а не `--bg-page`.
	 *
	 * Тло сторінки випадково збігається з читабельним кольором лише в частині
	 * тем: на жовтій виходило 2.00:1, на світлій 2.38:1 при потрібних 4.5
	 * (заміряно `contrast.test.ts`). Токен на те й є, що кожна тема вирішує це
	 * питання за себе.
	 */
	/*
	 * Селектор складений навмисно. Базове правило вище — теж складене
	 * (`.cta :global(.cta__btn)`), і одинокий `.cta__btn--main` програвав йому
	 * за специфічністю: головна кнопка малювалася звичайною і нічим не
	 * відрізнялася від сусідніх (заміряно — тло бралося з `--bg-surface`).
	 */
	.cta .cta__btn--main {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: var(--text-on-accent);
	}
</style>
