<script lang="ts">
	import { t } from 'svelte-i18n';
	import { X } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import { safeUrl } from '$lib/utils/safeUrl';
	import { graduatePhoto, graduatePhotoSrcset, type GraduateIndexEntry } from '$lib/data/graduates';

	interface Props {
		graduate: GraduateIndexEntry | null;
		onclose: () => void;
	}

	let { graduate, onclose }: Props = $props();

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

	/**
	 * Блоки з'являються ЛИШЕ за наявності даних — рішення автора, і воно
	 * спирається на замір: «Після випуску» є в 7 випускників із 80, «Під час
	 * навчання» — в одного. Фіксований шаблон із прочерками читався б як
	 * незаповнена анкета в 91% карток.
	 */
	const years = $derived(
		graduate
			? [
					graduate.enrollmentYears.length > 0
						? `${$t('galaxy.enrolled')} ${graduate.enrollmentYears.join(', ')}`
						: null,
					graduate.graduationYear ? `${$t('galaxy.graduated')} ${graduate.graduationYear}` : null
				].filter(Boolean)
			: []
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if graduate}
	<!--
		Клік по тлу лише ДУБЛЮЄ кнопку закриття, яка є нижче й доступна з
		клавіатури; Tab тримає `focusTrap`, Escape — обробник у скрипті. Тому
		клавіатурного еквівалента саме для тла не потрібно, і `role="presentation"`
		тут не косметика: саме він і знімає a11y-попередження компілятора.

		Жодного `svelte-ignore` тут НЕ треба, і це перевірено, а не вирішено:
		спершу я поставив два — обидва виявилися зайвими, бо попереджень немає
		взагалі. Заразом перша спроба дала 23 помилки з одного місця, бо Svelte
		вважає кожне слово після `svelte-ignore` кодом правила, і пояснення поруч
		стало 23 вигаданими кодами (AI-AGENT-PITFALLS-v8 § 5.7).
	-->
	<div
		class="backdrop"
		onclick={onclose}
		role="presentation"
		data-testid="galaxy-card-backdrop"
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

		<img
			class="card__photo"
			src={graduatePhoto(graduate.slug, 480)}
			srcset={graduatePhotoSrcset(graduate.slug)}
			sizes="(max-width: 520px) 40vw, 180px"
			width="180"
			height="180"
			alt={graduate.name}
			data-testid="galaxy-card-img"
		/>

		<h2 class="card__title" id="{id}-title" data-testid="galaxy-card-title">{graduate.name}</h2>

		{#if years.length > 0}
			<p class="card__years" data-testid="galaxy-card-years-text">{years.join(' · ')}</p>
		{/if}

		{#if graduate.group}
			<p class="card__row" data-testid="galaxy-card-group-text">
				{$t('galaxy.group')}:
				<strong>{graduate.group.name ?? graduate.group.abbr}</strong>
			</p>
		{/if}

		{#if graduate.masters.length > 0}
			<p class="card__row" data-testid="galaxy-card-masters-text">
				{$t('galaxy.masters')}: {graduate.masters.join(', ')}
			</p>
		{/if}

		{#if graduate.playCount > 0}
			<p class="card__row" data-testid="galaxy-card-plays-count">
				{$t('galaxy.plays')}: {graduate.playCount}
			</p>
		{/if}

		{#if graduate.socials.length > 0}
			<ul class="card__socials" data-testid="galaxy-card-socials-list">
				{#each graduate.socials as social (social.network)}
					<li>
						<!--
							`safeUrl` обов'язковий: адреси прийшли з чужого сайту, а Svelte
							екранує текст, але НЕ значення `href` — `javascript:` у полі
							соцмережі був би працюючим XSS. Те саме правило вже діє для
							адрес із Firestore.
						-->
						<!--
							Адреса приходить із даних, тож `resolve()` тут неможливий за
							визначенням — це чужий домен. Тег і атрибут `href` в ОДНОМУ рядку
							навмисно: правило звітує про рядок атрибута, а не тега, а
							HTML-коментар МІЖ атрибутами ламає компіляцію Svelte — обидві
							пастки вже записані в PROJECT-CONTEXT.
						-->
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={safeUrl(social.url)}
							class="card__social"
							target="_blank"
							rel="noopener noreferrer"
							data-testid="galaxy-card-social-link-{social.network}"
						>
							{social.network}
						</a>
					</li>
				{/each}
			</ul>
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
		   боки, і кнопка закриття опиняється над екраном (FLUID-SIZING-v8 § 4). */
		width: min(440px, calc(100vw - 2rem));
		max-height: min(90dvh, 720px);
		overflow-y: auto;
		padding: clamp(1rem, 3dvh, 1.75rem);
		border-radius: 1rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
		text-align: center;
	}

	.card__close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		cursor: pointer;
	}

	.card__close:hover {
		background: rgb(255 255 255 / 0.16);
	}

	.card__photo {
		width: clamp(120px, 40vw, 180px);
		height: clamp(120px, 40vw, 180px);
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 0 0 2px rgb(140 190 255 / 0.4);
	}

	.card__title {
		margin: 0.75rem 0 0.25rem;
		font-size: clamp(1.15rem, 3.4dvh, 1.5rem);
	}

	.card__years {
		margin: 0 0 0.75rem;
		opacity: 0.75;
		font-size: 0.9rem;
	}

	.card__row {
		margin: 0.35rem 0;
		font-size: 0.9rem;
	}

	.card__socials {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}

	.card__social {
		display: inline-flex;
		align-items: center;
		/* 44px висоти — власний стандарт цілі дотику для тач-пристроїв. */
		min-height: 44px;
		padding: 0 1rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.1);
		color: inherit;
		text-decoration: none;
		text-transform: capitalize;
	}

	.card__social:hover {
		background: rgb(255 255 255 / 0.18);
	}
</style>
