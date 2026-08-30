<script lang="ts">
	import { localizedPath, type Locale } from '$lib/i18n/routing';
	import type { ResolvedPathname } from '$app/types';
	import { GRADUATES, graduateProfilePath, type GraduateIndexEntry } from '$lib/data/graduates';
	import { filterGraduates } from '$lib/utils/graduateGalaxy';

	/**
	 * Пошук себе просто у вітальному вікні.
	 *
	 * Щоб людина, яка прийшла за посиланням, знайшла свою сторінку одразу, а не
	 * після «відкрийте реєстр, там угорі поле». Той самий `filterGraduates`, що
	 * й у реєстрі, а не власне порівняння рядків: він уже знає про апострофи й
	 * дівочі прізвища в дужках, і два різні пошуки на тому самому переліку
	 * розходилися б у відповідях.
	 *
	 * Окремим файлом, бо вікно з ним переросло стелю `structure.test.ts`.
	 */
	interface Props {
		placeholder: string;
		label: string;
		emptyText: string;
		/** Підпис для тих, у кого сторінки ще немає. */
		noProfileText: string;
		lang: Locale;
	}

	let { placeholder, label, emptyText, noProfileText, lang }: Props = $props();

	/** Анкета — теж у нову вкладку: див. докблок у `GalaxyUpdateActions`. */
	const formHref = $derived(
		`${localizedPath('/projects/galaxy-graduates/', lang)}?form=open` as ResolvedPathname
	);

	let query = $state('');

	/**
	 * Від двох літер: на одній збігів пів реєстру, і список під полем
	 * перетворюється на випадковий шум замість відповіді.
	 */
	const found = $derived.by(() => {
		const needle = query.trim();
		if (needle.length < 2) return [];
		return filterGraduates(GRADUATES, { query: needle }).slice(0, 6);
	});

	/** Своя сторінка є лише в тих, хто заповнив анкету, — решта без адреси. */
	function pageHref(graduate: GraduateIndexEntry) {
		return graduate.code ? localizedPath(graduateProfilePath(graduate.code), lang) : null;
	}
</script>

<label class="search">
	<span class="sr-only">{label}</span>
	<input
		type="search"
		bind:value={query}
		{placeholder}
		data-testid="galaxy-update-search-input"
	/>
</label>

{#if query.trim().length >= 2}
	{#if found.length > 0}
		<ul class="found" data-testid="galaxy-update-found-list">
			{#each found as person (person.slug)}
				{@const href = pageHref(person)}
				<li>
					<a
						class="row"
						href={href ?? formHref}
						target="_blank"
						rel="noopener"
						data-testid="galaxy-update-found-link-{person.slug}"
					>
						<span class="row__name">{person.name}</span>
						<span class="row__note">
							{href ? (person.graduationYear ?? '') : noProfileText}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty" data-testid="galaxy-update-empty-text">{emptyText}</p>
	{/if}
{/if}

<style>
	.search input {
		width: 100%;
		min-height: 44px;
		padding: 0 0.9rem;
		border: 1px solid rgb(140 190 255 / 0.3);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.06);
		color: var(--galaxy-text);
		font: inherit;
		/*
		 * Підказка довша за поле на телефоні (заміряно на 375px: 312 проти 276
		 * доступних) і обривалася просто посеред слова. Три крапки принаймні
		 * кажуть, що текст триває. Кегль тут чіпати не можна: менш ніж 16px і
		 * iOS зумить сторінку, щойно в поле стають.
		 */
		text-overflow: ellipsis;
	}
	.found {
		list-style: none;
		margin: 0.6rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.35rem;
	}
	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		padding: 0.55rem 0.85rem;
		border: 1px solid rgb(140 190 255 / 0.16);
		border-radius: 0.75rem;
		background: rgb(255 255 255 / 0.04);
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}
	.row:hover {
		border-color: rgb(140 190 255 / 0.5);
		background: rgb(140 190 255 / 0.12);
	}
	.row__name {
		font-weight: 600;
	}
	.row__note {
		flex-shrink: 0;
		font-size: 0.84rem;
		color: var(--galaxy-muted);
	}
	.empty {
		margin: 0.6rem 0 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--galaxy-muted);
	}
</style>
