<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { GitBranch } from 'lucide-svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { groupProfilePath } from '$lib/data/groups';
	import type { LineageLink } from '$lib/data/groupLineage';

	/**
	 * «Історія групи» — з чого група постала і чим стала далі.
	 *
	 * ## Чому окремий компонент, а не блок на сторінці
	 *
	 * `groups/[slug]/+page.svelte` має 384 SLOC при канонічній стелі 400 (§ 7).
	 * Секція з двома напрямками, посиланнями й власними стилями не вмістилася б
	 * у ці шістнадцять рядків, а піднімати стелю сторінки заради блока, який
	 * нікуди більше не дивиться, — платити структурою за зручність. Той самий
	 * вибір і з тієї самої причини вже зроблено для `PlayCastSection`.
	 *
	 * ## Чому власні стилі, а не спільні зі сторінкою
	 *
	 * `.group-section` і `.section-heading` лежать у scoped-стилях сторінки
	 * (тег style писати тут не можна: svelte2tsx закриває на ньому `script`),
	 * тобто ззовні недосяжні: Svelte додає до них свій клас. Тому заголовок тут
	 * повторений — так само, як `PlayCastSection` тримає власний `.play-heading`.
	 * Це не копія «про всяк випадок», а межа інструменту.
	 *
	 * ## Порядок напрямків
	 *
	 * Спершу «звідки», потім «куди» — так читається час. Кожен блок зникає, коли
	 * йому нічого сказати; коли зникають обидва, сторінка не показує й заголовка
	 * (умову тримає сама сторінка).
	 */
	interface Props {
		predecessors: LineageLink[];
		successors: LineageLink[];
		/** Ключі підпису — виводить `lineageOf`, а не ця розмітка. */
		beforeKey: string;
		afterKey: string;
	}

	let { predecessors, successors, beforeKey, afterKey }: Props = $props();

	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');
	const isEn = $derived(lang === 'en');

	/** Роки групи одним рядком: «2017–2018» або «2014». */
	function роки(years: readonly number[]): string {
		if (years.length === 0) return '';
		const min = Math.min(...years);
		const max = Math.max(...years);
		return min === max ? `${min}` : `${min}–${max}`;
	}
</script>

<section class="lineage" aria-labelledby="section-lineage-title">
	<div class="lineage__heading">
		<span class="lineage__icon"><GitBranch size={20} aria-hidden="true" /></span>
		<h2 id="section-lineage-title" class="lineage__title" data-testid="group-lineage-title">
			{$t('galaxy.lineageTitle')}
		</h2>
	</div>

	{#snippet напрямок(links: LineageLink[], підпис: string, testid: string)}
		<div class="lineage__block">
			<p class="lineage__label">{$t(підпис)}</p>
			<ul class="lineage__list" data-testid="{testid}-list">
				{#each links as link (link.group.slug)}
					<li>
						<a
							class="lineage__link"
							href={localizedPath(groupProfilePath(link.group.slug), lang)}
							data-testid="{testid}-link-{link.group.slug}"
						>
							<span class="lineage__name"
								>{isEn ? (link.group.nameEn ?? link.group.name) : link.group.name}</span
							>
							{#if роки(link.group.graduationYears)}
								<span class="lineage__years">{роки(link.group.graduationYears)}</span>
							{/if}
						</a>
						{#if isEn ? link.noteEn : link.note}
							<p class="lineage__note">{isEn ? link.noteEn : link.note}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/snippet}

	{#if predecessors.length > 0}
		{@render напрямок(predecessors, beforeKey, 'group-lineage-before')}
	{/if}
	{#if successors.length > 0}
		{@render напрямок(successors, afterKey, 'group-lineage-after')}
	{/if}
</section>

<style>
	.lineage {
		margin-bottom: 4rem;
	}

	.lineage__heading {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 1.75rem;
		border-bottom: 1px solid rgb(255 255 255 / 0.08);
		padding-bottom: 0.75rem;
	}

	:global([data-theme='light']) .lineage__heading {
		border-bottom-color: rgb(0 0 0 / 0.1);
	}

	.lineage__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-primary);
	}

	/* 1.45rem — те саме число, що в `.section-heading__title` сусідніх секцій
	   сторінки: заголовки одного рівня мусять бути одного розміру, а спільної
	   змінної для нього в проєкті немає. */
	.lineage__title {
		margin: 0;
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--text-main);
	}

	.lineage__block + .lineage__block {
		margin-top: 1.5rem;
	}

	.lineage__label {
		margin: 0 0 0.6rem;
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.lineage__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
	}

	.lineage__link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.5rem 0.9rem;
		border-radius: 0.75rem;
		border: 1px solid rgb(255 255 255 / 0.14);
		background: rgb(255 255 255 / 0.05);
		color: var(--text-main);
		text-decoration: none;
		transition:
			transform var(--transition-fast),
			border-color var(--transition-fast);
	}

	:global([data-theme='light']) .lineage__link {
		border-color: rgb(0 0 0 / 0.14);
		background: rgb(0 0 0 / 0.04);
	}

	.lineage__link:hover {
		transform: translateY(-2px);
		border-color: var(--accent-primary);
	}

	.lineage__name {
		font-weight: 600;
	}

	.lineage__years {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.lineage__note {
		margin: 0.35rem 0 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	@media (max-width: 640px) {
		.lineage {
			margin-bottom: 2.5rem;
		}

		.lineage__list {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
