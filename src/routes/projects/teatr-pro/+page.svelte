<script lang="ts">
	import StaticPage from '$lib/components/StaticPage.svelte';
	import { resolve } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { MapPinned, Users } from 'lucide-svelte';
	import { TEATR_PRO_FESTIVALS, festivalPath } from '$lib/data/festivals';
	import { localizedPath } from '$lib/i18n/routing';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';

	/**
	 * Загальна сторінка фестивалю — про сам фестиваль, а не про його випуск.
	 *
	 * Доти вона змішувала обидва: під заголовком «що таке Театр.PRO» одразу
	 * стояли «ІV-й», «5–6 червня 2026» і заявки того року. Тобто сторінка
	 * старіла разом із набором, і читач не міг зрозуміти, він дивиться на
	 * фестиваль чи на оголошення, яке вже минуло.
	 *
	 * Тепер випуски живуть у реєстрі фестивалів окремими записами, а тут —
	 * перелік із посиланнями. Список НЕ повторює сторінку всіх поїздок: там
	 * фільтри, пошук і перемикачі вигляду на сотню записів, а тут три рядки
	 * про одну й ту саму подію в різні роки.
	 */

	let { data } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
</script>

<StaticPage
	{data}
	testPrefix="teatr-pro"
	backHref={resolve('/projects')}
	backLabel={$t('projects.backToProjects')}
/>

{#if TEATR_PRO_FESTIVALS.length > 0}
	<section class="fests container" aria-labelledby="teatr-pro-fests-title">
		<h2 class="fests__title" id="teatr-pro-fests-title" data-testid="teatr-pro-editions-title">
			{$t('teatrPro.editions')}
		</h2>

		<ul class="fests__list" data-testid="teatr-pro-editions-list">
			{#each TEATR_PRO_FESTIVALS as fest (fest.slug)}
				<li>
					<a
						class="fests__item"
						href={localizedPath(festivalPath(fest.slug), currentLang)}
						data-testid="teatr-pro-edition-{fest.slug}-link"
					>
						<span class="fests__year">{Math.max(...fest.years)}</span>
						<span class="fests__body">
							<span class="fests__name">{isEn ? (fest.nameEn ?? fest.name) : fest.name}</span>
							<span class="fests__meta">
								{#if fest.city}
									<span class="fests__place">
										<MapPinned size={14} aria-hidden="true" />
										{fest.city}
									</span>
								{:else if fest.note}
									<!-- Шпильки тут немає навмисно: онлайн — це не точка на мапі. -->
									<span class="fests__place">{fest.note}</span>
								{/if}
								{#each fest.countries as code (code)}
									<CountryFlag {code} />
								{/each}
								{#if fest.memberIds.length > 0}
									<span class="fests__count">
										<Users size={14} aria-hidden="true" />
										{fest.memberIds.length}
									</span>
								{/if}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.fests {
		margin: 0 auto 4rem;
	}

	.fests__title {
		font-family: var(--font-heading, sans-serif);
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		margin: 0 0 1rem;
		color: var(--text-title);
	}

	.fests__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.fests__item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.1rem;
		border-radius: var(--radius-lg);
		background: var(--bg-surface);
		border: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
		transition:
			transform var(--transition-base),
			border-color var(--transition-base);
	}

	.fests__item:hover,
	.fests__item:focus-visible {
		transform: translateY(-2px);
		border-color: var(--accent-primary);
	}

	.fests__year {
		font-family: var(--font-heading, sans-serif);
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--accent-primary);
		/* Своя колонка: роки різної ширини інакше зсували б назви одна відносно
		   одної, і перелік читався б драбинкою. */
		min-width: 4ch;
	}

	.fests__body {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	.fests__name {
		font-weight: 600;
	}

	.fests__meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.fests__place,
	.fests__count {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
</style>
