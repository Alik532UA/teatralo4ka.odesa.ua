<script lang="ts">
	import { locale, t } from 'svelte-i18n';
	import { Newspaper } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import type { FestivalNewsItem } from '$lib/data/newsBacklinks';

	/**
	 * Новини, у яких згадали цього працівника.
	 *
	 * ## Чому цього розділу доти не було
	 *
	 * Не «не дійшли руки». Зріз новин про людей рахує
	 * `scripts/build-news-backlinks.ts`, і шукав він ЛИШЕ адреси випускників —
	 * один сегмент після `galaxy-graduates`. Адреса викладача має інший корінь
	 * (`/residents/adults/…`), тож шість посилань на викладачів, які вже стояли
	 * в новинах, не потрапляли в зріз узагалі. Розділ і не міг з'явитися, поки
	 * не полагодили генератор.
	 *
	 * ## Чому рядками, а не плитками
	 *
	 * Зріз возить назву й дату — обкладинки в ньому немає. Плитка з самим
	 * заголовком читалася б як картка, що не завантажилась. Те саме рішення й
	 * тими самими словами — у поїздки, в анкеті випускника й у фахівця.
	 *
	 * Заголовок і рамка іконки взяті з `MasterFestivals` дослівно, включно з
	 * `--text-title` замість акценту: `contrast.test.ts` назвав акцент на
	 * `--bg-surface` у темах «yellow» і «light».
	 */
	interface Props {
		news: FestivalNewsItem[];
	}

	let { news }: Props = $props();

	const lang = $derived(($locale as string) === 'en' ? 'en' : 'uk');
</script>

{#if news.length}
	<section class="news-section" data-testid="master-news-section">
		<div class="section-header">
			<div class="section-icon">
				<Newspaper size={24} aria-hidden="true" />
			</div>
			<h2 class="section-title" data-testid="master-news-title">
				{$t('nav.news')}
			</h2>
		</div>

		<ul class="master-news" data-testid="master-news-list">
			{#each news as новина (новина.id)}
				<li>
					<a
						class="master-news__item"
						href={localizedPath(`/news/${новина.id}`, lang)}
						data-testid="master-news-link-{новина.id}"
					>
						<span class="master-news__title">{новина.title[lang]}</span>
						<time class="master-news__date" datetime={новина.date}>{новина.date}</time>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.news-section {
		margin-top: clamp(1.5rem, 3vw, 2.5rem);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.section-icon {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border-radius: var(--radius-lg, 16px);
		background: var(--bg-surface);
		border: var(--hairline-width) solid var(--border-main);
		color: var(--text-title);
		flex-shrink: 0;
	}

	.section-title {
		margin: 0;
		font-size: clamp(1.15rem, 2.2vw, 1.5rem);
		font-weight: 700;
		color: var(--text-title);
	}

	.master-news {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	.master-news__item {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md, 12px);
		background: var(--bg-surface);
		border: var(--hairline-width) solid var(--border-main);
		color: var(--text-main);
		text-decoration: none;
	}

	.master-news__item:hover {
		border-color: var(--accent-primary);
	}

	.master-news__date {
		color: var(--text-muted);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}
</style>
