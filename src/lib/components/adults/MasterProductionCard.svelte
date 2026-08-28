<script lang="ts">
	import { t } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { Video, ExternalLink, Calendar, Users, Award } from 'lucide-svelte';
	import type { MasterProduction } from '$lib/data/masters';
	import { graduateProfilePath, type GraduateIndexEntry } from '$lib/data/graduates';
	import { masterProfilePath, getAllMasters, type Master } from '$lib/data/masters';
	import graduatesIndex from '$lib/data/graduates.index.json';
	import type { ResolvedPathname } from '$app/paths';

	interface Props {
		prod: MasterProduction;
		index: number;
		isEn?: boolean;
	}

	let { prod, index, isEn = false }: Props = $props();

	const graduatesList = graduatesIndex as GraduateIndexEntry[];
	const gradMap: Record<string, GraduateIndexEntry> = {};
	for (const g of graduatesList) gradMap[g.name.toLowerCase().trim()] = g;

	const allMasters = getAllMasters();
	const masterMap: Record<string, Master> = {};
	for (const m of allMasters) {
		masterMap[m.fullName.toLowerCase().trim()] = m;
		masterMap[m.displayName.toLowerCase().trim()] = m;
	}

	function participantLink(name: string): { href?: ResolvedPathname; type: 'graduate' | 'master' | 'plain' } {
		const clean = name.replace(/[+()]/g, '').trim().toLowerCase();
		const g = gradMap[clean];
		if (g?.code) return { href: localizedPath(graduateProfilePath(g.code), isEn ? 'en' : 'uk'), type: 'graduate' };
		const m = masterMap[clean];
		if (m) return { href: masterProfilePath(m.slug, isEn ? 'en' : 'uk'), type: 'master' };
		return { type: 'plain' };
	}
</script>

<article class="prod-card" class:prod-card--has-award={prod.awards?.length} data-testid="master-production-card-{prod.number ?? index}">
	<div class="prod-card__header">
		<div class="prod-card__meta">
			{#if prod.number}<span class="num-badge" title="Номер вистави в ДТШ">#{prod.number}</span>{/if}
			<span class="year-badge">
				<Calendar size={13} aria-hidden="true" />
				<span>{prod.year}{prod.dateNote ? ` · ${prod.dateNote}` : ''}</span>
			</span>
			{#if prod.theatreGroup}<span class="group-badge">{prod.theatreGroup}</span>{/if}
		</div>
		{#if prod.isDtsh === false && prod.institution}<span class="institution-badge">{prod.institution}</span>{/if}
	</div>

	<h3 class="prod-card__title">{prod.title}</h3>
	{#if prod.originalAuthor}<p class="prod-card__author">{prod.originalAuthor}</p>{/if}

	{#if prod.awards?.length}
		<div class="prod-card__awards" data-testid="master-production-awards-list">
			{#each prod.awards as award (award)}
				<div class="award-item"><Award size={16} aria-hidden="true" /><span>{award}</span></div>
			{/each}
		</div>
	{/if}

	{#if prod.videoUrl}
		<div class="prod-card__video-wrap">
			<a href={prod.videoUrl} target="_blank" rel="external noopener noreferrer" class="video-btn" data-testid="master-production-video-link">
				<Video size={15} aria-hidden="true" />
				<span>{$t('galaxy.watchVideo', { default: 'Дивитися відео' })}</span>
				<ExternalLink size={13} aria-hidden="true" />
			</a>
		</div>
	{/if}

	{#if prod.participants?.length}
		<div class="prod-card__participants">
			<div class="participants-header">
				<Users size={14} aria-hidden="true" />
				<span>{$t('galaxy.participants', { default: 'Учасники' })}:</span>
			</div>
			<div class="participants-tags">
				{#each prod.participants as part, partIdx (part + partIdx)}
					{@const link = participantLink(part)}
					{#if link.href}
						<a href={link.href} class="part-tag part-tag--link" class:part-tag--grad={link.type === 'graduate'} class:part-tag--master={link.type === 'master'} title={link.type === 'graduate' ? 'Переглянути профіль випускника' : 'Переглянути профіль викладача'} data-testid="master-production-participant-link-{partIdx}">{part}</a>
					{:else}
						<span class="part-tag">{part}</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</article>

<style>
	.prod-card {
		display: flex; flex-direction: column; background: var(--bg-card);
		border: 1px solid var(--border-main); border-radius: var(--radius-xl, 20px);
		padding: 1.35rem; box-shadow: var(--shadow-sm);
		transition: transform var(--transition-base, 0.25s ease), border-color var(--transition-base, 0.25s ease), box-shadow var(--transition-base, 0.25s ease);
	}
	.prod-card:hover { transform: translateY(-3px); border-color: var(--accent-primary); box-shadow: var(--shadow-main); }
	.prod-card--has-award {
		border-color: rgba(217, 119, 6, 0.35);
		background: linear-gradient(180deg, var(--bg-card) 0%, rgba(217, 119, 6, 0.04) 100%);
	}
	.prod-card__header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.75rem; }
	.prod-card__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
	.num-badge { padding: 0.2rem 0.55rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); color: var(--text-title); font-size: 0.75rem; font-weight: 700; }
	.year-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); color: var(--text-main); font-size: 0.8rem; font-weight: 600; }
	.group-badge { padding: 0.2rem 0.6rem; border-radius: var(--radius-sm, 6px); background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); color: #2563eb; font-size: 0.8rem; font-weight: 600; }
	:global(.theme-dark) .group-badge, :global(.theme-dark-cyan) .group-badge { color: #60a5fa; background: rgba(37, 99, 235, 0.2); }
	.institution-badge { padding: 0.2rem 0.55rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); color: var(--text-muted); font-size: 0.75rem; }
	.prod-card__title { margin: 0.2rem 0 0.4rem; font-size: 1.2rem; font-weight: 700; color: var(--text-title); line-height: 1.3; }
	.prod-card__author { margin: 0 0 0.85rem; font-size: 0.88rem; color: var(--text-muted); font-style: italic; line-height: 1.4; }
	.prod-card__awards { margin-bottom: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem; }
	.award-item { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-md, 10px); background: rgba(217, 119, 6, 0.08); border: 1px solid rgba(217, 119, 6, 0.25); color: #b45309; font-size: 0.84rem; font-weight: 600; line-height: 1.35; }
	:global(.theme-dark) .award-item, :global(.theme-dark-cyan) .award-item { color: #fbbf24; background: rgba(217, 119, 6, 0.15); }
	.prod-card__video-wrap { margin-bottom: 0.85rem; }
	.video-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.4rem 0.8rem; border-radius: var(--radius-md, 8px); background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.25); color: #dc2626; font-size: 0.82rem; font-weight: 600; text-decoration: none; transition: all var(--transition-base, 0.2s ease); }
	.video-btn:hover { background: #dc2626; color: #ffffff; border-color: #dc2626; }
	.prod-card__participants { margin-top: auto; padding-top: 0.85rem; border-top: 1px dashed var(--border-main); }
	.participants-header { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.45rem; }
	.participants-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
	.part-tag { display: inline-block; padding: 0.18rem 0.5rem; border-radius: var(--radius-sm, 6px); background: var(--bg-surface); border: 1px solid var(--border-main); font-size: 0.78rem; color: var(--text-main); text-decoration: none; line-height: 1.3; }
	.part-tag--link { cursor: pointer; transition: all var(--transition-base, 0.18s ease); }
	.part-tag--grad:hover { background: rgba(220, 38, 38, 0.1); border-color: var(--accent-primary); color: var(--accent-primary); transform: translateY(-1px); }
	.part-tag--master { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: #059669; }
	:global(.theme-dark) .part-tag--master, :global(.theme-dark-cyan) .part-tag--master { color: #34d399; }
	.part-tag--master:hover { background: rgba(16, 185, 129, 0.2); border-color: #10b981; transform: translateY(-1px); }
</style>
