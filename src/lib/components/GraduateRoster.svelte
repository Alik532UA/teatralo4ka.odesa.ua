<script lang="ts">
	import { t } from 'svelte-i18n';
	import { X } from 'lucide-svelte';
	import { focusTrap } from '$lib/utils/focusTrap';
	import {
		GRADUATION_YEARS,
		graduatePhoto,
		graduatePhotoSrcset,
		type GraduateIndexEntry
	} from '$lib/data/graduates';
	import { filterGraduates } from '$lib/utils/graduateGalaxy';

	interface Props {
		graduates: readonly GraduateIndexEntry[];
		open: boolean;
		onclose: () => void;
		onselect: (graduate: GraduateIndexEntry) => void;
	}

	let { graduates, open, onclose, onselect }: Props = $props();

	const id = $props.id();

	let year = $state<number | 'all'>('all');
	let query = $state('');

	// Пошук за іменем поруч із фільтром за роком: галактика гарна для розглядання
	// й безпорадна для «де мій однокурсник з 2014 року». На 482 записах це вже не
	// зручність, а умова того, щоб переліком можна було користуватися.
	const shown = $derived(filterGraduates(graduates, { year, query }));

	/** Escape — той самий обробник, що в `PhotoLightbox`: один спосіб закривати. */
	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!--
		Клік по тлу лише ДУБЛЮЄ кнопку закриття, яка є нижче й доступна з
		клавіатури; Tab тримає `focusTrap`, Escape — обробник вище. Тому
		`role="presentation"`: він і знімає a11y-попередження компілятора.
	-->
	<div class="backdrop" onclick={onclose} role="presentation" data-testid="galaxy-roster-backdrop"
	></div>

	<div
		class="sheet"
		role="dialog"
		aria-modal="true"
		aria-labelledby="{id}-title"
		{@attach focusTrap()}
		data-testid="galaxy-roster-modal"
	>
		<header class="sheet__head">
			<h2 class="sheet__title" id="{id}-title" data-testid="galaxy-roster-title">
				{$t('galaxy.all')}
				<span class="sheet__count" data-testid="galaxy-roster-count">{shown.length}</span>
			</h2>

			<button
				type="button"
				class="sheet__close"
				onclick={onclose}
				aria-label={$t('common.close')}
				data-testid="galaxy-roster-close-btn"
			>
				<X size={20} aria-hidden="true" />
			</button>
		</header>

		<div class="sheet__filters">
			<label class="sheet__field" for="{id}-search">
				<span class="sr-only">{$t('galaxy.searchName')}</span>
				<input
					id="{id}-search"
					type="search"
					bind:value={query}
					placeholder={$t('galaxy.searchName')}
					data-testid="galaxy-roster-search-input"
				/>
			</label>

			<label class="sheet__field" for="{id}-year">
				<span class="sr-only">{$t('galaxy.filterYear')}</span>
				<select id="{id}-year" bind:value={year} data-testid="galaxy-roster-year-select">
					<option value="all">{$t('galaxy.allYears')}</option>
					{#each GRADUATION_YEARS as value (value)}
						<option {value}>{value}</option>
					{/each}
				</select>
			</label>
		</div>

		<ul class="sheet__list" data-testid="galaxy-roster-list">
			{#each shown as graduate (graduate.slug)}
				<li data-testid="galaxy-roster-list-item-{graduate.slug}">
					<button
						type="button"
						class="row"
						onclick={() => onselect(graduate)}
						data-testid="galaxy-roster-{graduate.slug}-btn"
					>
						{#if graduate.hasPhoto}
							<img
								class="row__photo"
								src={graduatePhoto(graduate.slug, 96)}
								srcset={graduatePhotoSrcset(graduate.slug)}
								sizes="44px"
								width="44"
								height="44"
								loading="lazy"
								decoding="async"
								alt=""
							/>
						{:else}
							<!-- Та сама зірка без обличчя, що й у галактиці: анкети ще немає. -->
							<span class="row__dot" aria-hidden="true"></span>
						{/if}
						<span class="row__name">{graduate.name}</span>
						{#if graduate.graduationYear}
							<span class="row__year">{graduate.graduationYear}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>

		{#if shown.length === 0}
			<p class="sheet__empty" data-testid="galaxy-roster-empty-message">{$t('galaxy.nothingFound')}</p>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
		background: rgb(3 6 20 / 0.72);
		backdrop-filter: blur(3px);
	}

	.sheet {
		position: fixed;
		z-index: 71;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		display: flex;
		flex-direction: column;
		/* max-height обов'язковий: без нього центроване вікно вилазить в обидва
		   боки, і кнопка закриття опиняється над екраном (FLUID-SIZING-v8 § 4). */
		width: min(720px, calc(100vw - 1.5rem));
		max-height: min(86dvh, 820px);
		padding: clamp(0.75rem, 2.5dvh, 1.25rem);
		border-radius: 1rem;
		background: var(--galaxy-card-bg);
		color: var(--galaxy-text);
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
	}

	.sheet__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.sheet__title {
		margin: 0;
		font-size: clamp(1rem, 2.6dvh, 1.3rem);
	}

	.sheet__count {
		opacity: 0.65;
		font-weight: 400;
	}

	.sheet__close {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.08);
		color: inherit;
		cursor: pointer;
	}

	.sheet__close:hover {
		background: rgb(255 255 255 / 0.16);
	}

	.sheet__filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0.75rem 0;
	}

	.sheet__field {
		flex: 1 1 12rem;
		/* min-width: 0 — без нього флекс-елемент не стискається менше за вміст. */
		min-width: 0;
	}

	.sheet__field input,
	.sheet__field select {
		width: 100%;
		min-height: 44px;
		padding: 0 0.6rem;
		border: 1px solid rgb(255 255 255 / 0.18);
		border-radius: 0.5rem;
		background: rgb(255 255 255 / 0.06);
		color: inherit;
		font: inherit;
	}

	.sheet__list {
		display: grid;
		/* min() навколо порога: гола довжина в minmax — це ПІДЛОГА, а не поріг,
		   і колонка лишалася б 220px у вужчому контейнері (FLUID-SIZING-v8 § 1.1). */
		grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		list-style: none;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		min-width: 0;
		min-height: 44px;
		padding: 0.3rem 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.5rem;
		background: none;
		color: inherit;
		cursor: pointer;
		text-align: left;
	}

	.row:hover {
		border-color: rgb(140 190 255 / 0.5);
		background: rgb(255 255 255 / 0.05);
	}

	.row__photo {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		object-fit: cover;
	}

	.row__dot {
		flex-shrink: 0;
		/* Займає стільки ж місця, як портрет, щоб рядки не стрибали по ширині. */
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: radial-gradient(circle, rgb(200 226 255 / 0.85) 0 3px, transparent 4px);
	}

	.row__name {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.9rem;
	}

	.row__year {
		margin-left: auto;
		flex-shrink: 0;
		opacity: 0.6;
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}

	.sheet__empty {
		margin: 1rem 0 0;
		opacity: 0.7;
		text-align: center;
	}
</style>
