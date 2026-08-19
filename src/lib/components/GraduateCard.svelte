<script lang="ts">
	import { t } from 'svelte-i18n';
	import { ExternalLink, X } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import type { GraduateIndexEntry, GraduateProfile } from '$lib/data/graduates';
	import GraduateProfileView from './GraduateProfileView.svelte';

	interface Props {
		graduate: GraduateIndexEntry | null;
		/** Подробиці. `null` — ще вантажаться або людина не заповнила анкету. */
		profile: GraduateProfile | null;
		/** Адреса власної сторінки випускника — вона ж стоїть у рядку браузера. */
		pageHref: string | null;
		onclose: () => void;
	}

	let { graduate, profile, pageHref, onclose }: Props = $props();

	const id = $props.id();

	/**
	 * Escape закриває картку.
	 *
	 * `focusTrap` тримає Tab у межах модалки й повертає фокус після закриття, але
	 * Escape він не обробляє — знайдено прогоном, а не читанням: картка
	 * відкривалася, фокус ішов на кнопку закриття, і Escape не робив нічого. Той
	 * самий обробник у `PhotoLightbox.svelte` — беру ту саму форму, щоб у проєкті
	 * не з'явився другий спосіб закривати вікно.
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (!graduate) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if graduate}
	<!--
		Клік по тлу лише ДУБЛЮЄ кнопку закриття, яка є нижче й доступна з
		клавіатури; Tab тримає `focusTrap`, Escape — обробник у скрипті. Тому
		клавіатурного еквівалента саме для тла не потрібно, і `role="presentation"`
		тут не косметика: саме він і знімає a11y-попередження компілятора.
	-->
	<div class="backdrop" onclick={onclose} role="presentation" data-testid="galaxy-card-backdrop"
	></div>

	<div
		class="card"
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		{@attach focusTrap()}
		data-testid="galaxy-card-modal"
	>
		<button
			type="button"
			class="card__close"
			onclick={onclose}
			aria-label={$t('common.close')}
			data-testid="galaxy-card-close-btn"
		>
			<X size={20} aria-hidden="true" />
		</button>

		<GraduateProfileView {graduate} {profile} headingId="{id}-title" heading="h2" />

		{#if pageHref}
			<!--
				Та сама адреса, що вже стоїть у рядку браузера. Посилання лишається
				потрібним: воно дає сторінку без галактики — щоб роздрукувати,
				поділитися або відкрити в новій вкладці середнім кліком.
			-->
			<!--
				`pageHref` складений вручну: шлях зі `graduateProfilePath()` плюс мовний
				префікс від `withLocale()`. `resolve()` тут не підходить у принципі — під
				SSR він віддає ВІДНОСНИЙ шлях, і префікс поверх нього дав би
				`/en../../../projects/…` (замір і наслідки — у докблоці
				`graduateProfilePath` у `$lib/data/graduates`). Та сама форма винятку вже
				стоїть двічі в `routes/projects/galaxy-graduates/+page.svelte`.
			-->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a class="card__page" href={pageHref} data-testid="galaxy-card-page-link">
				<ExternalLink size={16} aria-hidden="true" />
				{$t('galaxy.ownPage')}
			</a>
		{/if}
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
		translate: -50% -50%;
		/* max-height обов'язковий: без нього центрована картка вилазить в обидва
		   боки, і кнопка закриття опиняється над екраном (FLUID-SIZING-v8 § 4).
		   Ширша, ніж була (440px): тепер у картці ще й вистави та біографія. */
		width: min(560px, calc(100vw - 2rem));
		max-height: min(90dvh, 820px);
		overflow-y: auto;
		padding: clamp(1rem, 3dvh, 1.75rem);
		border-radius: 1.75rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
		text-align: center;
	}

	.card__close {
		position: sticky;
		top: 0;
		float: right;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.12);
		color: inherit;
		cursor: pointer;
	}

	.card__close:hover {
		background: rgb(255 255 255 / 0.22);
	}

	.card__page {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		margin-top: 1rem;
		padding: 0 1rem;
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: 999px;
		color: inherit;
		text-decoration: none;
	}

	.card__page:hover {
		border-color: rgb(140 190 255 / 0.7);
		background: rgb(140 190 255 / 0.14);
	}
</style>
