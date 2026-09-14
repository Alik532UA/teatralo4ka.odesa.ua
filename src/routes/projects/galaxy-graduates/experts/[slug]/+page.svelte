<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { Gavel, Dumbbell, Star } from 'lucide-svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import type { PageData } from './$types';

	/**
	 * Сторінка запрошеного фахівця фестивалю.
	 *
	 * ## Чому вона взагалі є
	 *
	 * Рішення автора: показувати таких людей окремими сторінками, як випускників.
	 * Сама сторінка при цьому набагато простіша — у фахівця немає ні вистав, ні
	 * групи, ні майстрів курсу. Лишається те, що про нього справді відомо: ім'я,
	 * місто, посади за роками й фестивалі, на які він приїздив.
	 *
	 * ## Чому посади переліком, а не одним рядком
	 *
	 * Бо вони змінюються, і в наших даних це видно: Станіслав Жирков 2018-го вів
	 * «Золоті ворота», а 2021-го — театр драми і комедії на лівому березі Дніпра.
	 * Одна посада на людину змусила б вибирати, котру з двох правд показати.
	 * Перелік показує обидві й сам собою стає короткою хронологією.
	 */

	let { data }: { data: PageData } = $props();

	const currentLang = $derived(($locale as string) === 'en' ? 'en' : 'uk');
	const isEn = $derived(currentLang === 'en');
	const name = $derived(isEn && data.expert.nameEn ? data.expert.nameEn : data.expert.name);

	/** Посади від найсвіжішої: теперішнє цікавить першим. */
	const titles = $derived([...data.expert.titles].sort((a, b) => b.year - a.year));

	const roleLabel: Record<string, string> = {
		experts: 'galaxy.festivalExperts',
		coaches: 'galaxy.festivalCoaches',
		guests: 'galaxy.festivalGuests'
	};
</script>

<section class="expert container" data-testid="expert-page-section">
	<GalaxyBreadcrumb />

	<header class="expert__header">
		<h1 class="expert__name" data-testid="expert-name-title">{name}</h1>
		{#if data.expert.city}
			<p class="expert__city" data-testid="expert-city-text">{data.expert.city}</p>
		{/if}
	</header>

	{#if titles.length > 0}
		<ul class="expert__titles" data-testid="expert-titles-list">
			{#each titles as title (title.year)}
				<li class="expert__title">
					<span class="expert__year">{title.year}</span>
					<span class="expert__role">{title.text}</span>
				</li>
			{/each}
		</ul>
	{/if}

	{#if data.appearances.length > 0}
		<h2 class="expert__section-title" data-testid="expert-festivals-title">
			{$t('galaxy.festivals')}
		</h2>
		<ul class="expert__festivals" data-testid="expert-festivals-list">
			{#each data.appearances as item (item.slug)}
				<li>
					<a
						href={localizedPath(item.href, currentLang)}
						class="expert__festival"
						data-testid="expert-festival-link-{item.slug}"
					>
						<span class="expert__festival-icon" aria-hidden="true">
							{#if item.role === 'experts'}<Gavel size={16} />
							{:else if item.role === 'coaches'}<Dumbbell size={16} />
							{:else}<Star size={16} />{/if}
						</span>
						<span class="expert__festival-name">
							{isEn && item.nameEn ? item.nameEn : item.name}
							<span class="expert__festival-year">{item.year}</span>
						</span>
						<span class="expert__festival-role">{$t(roleLabel[item.role])}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.expert {
		padding: var(--page-pad-top) 24px var(--page-pad-bottom);
		max-width: 800px;
	}

	.expert__header {
		margin-bottom: 2rem;
	}

	.expert__name {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 5vw, 2.6rem);
		color: var(--text-title);
		margin: 0;
	}

	.expert__city {
		margin: 0.35rem 0 0;
		color: var(--color-muted-text);
	}

	.expert__titles {
		list-style: none;
		margin: 0 0 2.5rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.expert__title {
		display: grid;
		grid-template-columns: 4rem 1fr;
		gap: 1rem;
		align-items: start;
	}

	.expert__year {
		font-weight: 800;
		color: var(--accent-alt);
	}

	.expert__role {
		color: var(--text-main);
		line-height: 1.6;
	}

	.expert__section-title {
		font-family: var(--font-heading);
		font-size: 1.3rem;
		color: var(--text-title);
		margin: 0 0 1rem;
	}

	.expert__festivals {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.expert__festival {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: var(--hairline-width) solid var(--border-main);
		border-radius: var(--radius-lg);
		background: var(--bg-card);
		color: var(--text-main);
		text-decoration: none;
		transition: border-color 0.2s ease;
	}

	.expert__festival:hover {
		border-color: var(--accent-alt);
	}

	.expert__festival-icon {
		display: grid;
		place-items: center;
		color: var(--accent-alt);
		flex-shrink: 0;
	}

	.expert__festival-name {
		flex: 1;
		font-weight: 700;
	}

	.expert__festival-year {
		font-weight: 400;
		color: var(--color-muted-text);
		margin-left: 0.4rem;
	}

	.expert__festival-role {
		font-size: 0.85rem;
		color: var(--color-muted-text);
	}

	/*
	 * На вузькому екрані роль переїжджає під назву: в один рядок вони не
	 * вміщаються, і назва фестивалю обрізалася б першою — тобто зникало б саме
	 * те, заради чого рядок існує.
	 */
	@media (max-width: 560px) {
		.expert__festival {
			flex-wrap: wrap;
		}

		.expert__festival-name {
			flex-basis: calc(100% - 2rem);
		}
	}
</style>
