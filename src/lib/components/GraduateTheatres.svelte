<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { theatrePath, type Theatre, type TheatreMember } from '$lib/data/theatres';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';

	interface Props {
		theatres: { theatre: Theatre; member: TheatreMember }[];
		testIdPrefix?: string;
		showTitle?: boolean;
	}

	let {
		theatres,
		testIdPrefix = 'galaxy-card-theatres',
		showTitle = true
	}: Props = $props();

	const isEn = $derived($locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	function yearsOf(member: TheatreMember): string {
		if (member.since && member.until) {
			return `${member.since}–${member.until}`;
		}
		if (member.since) {
			return isEn ? `from ${member.since}` : `з ${member.since}`;
		}
		if (member.until) {
			return isEn ? `until ${member.until}` : `до ${member.until}`;
		}
		return '';
	}

	function roleOrNote(member: TheatreMember): string {
		const parts = [member.role, member.note].filter(Boolean);
		return parts.join(', ');
	}
</script>

{#snippet flagsOf(theatre: Theatre)}
	<span class="fests__flags">
		{#each theatre.countries as code (code)}
			<CountryFlag {code} />
		{/each}
	</span>
{/snippet}

{#if theatres.length}
	<div class="fests" data-testid="{testIdPrefix}-list">
		{#if showTitle}
			<span class="galaxy-block-title">{$t('galaxy.theatresTitle', { default: 'Театри' })}</span>
		{/if}
		<ul class="fests__list">
			{#each theatres as { theatre, member } (theatre.slug)}
				{@const years = yearsOf(member)}
				{@const meta = roleOrNote(member)}
				<li class="fests__row">
					<a
						class="fests__link"
						href={localizedPath(theatrePath(theatre.slug), lang)}
						data-testid="{testIdPrefix}-link-{theatre.slug}"
					>
						{#if years}
							<span class="fests__years">{years}</span>
						{/if}
						<span class="fests__name">
							{isEn && theatre.nameEn ? theatre.nameEn : theatre.name}
						</span>
						{#if meta}
							<span class="fests__meta">({meta})</span>
						{/if}
						{@render flagsOf(theatre)}
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.fests {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		container-type: inline-size;
	}

	.fests__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.fests__row {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
	}

	.fests__link {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
		flex: 1 1 auto;
		padding: 0.35rem 0.6rem;
		border-radius: var(--radius-md, 12px);
		background: var(--fest-surface, var(--bg-surface));
		border: var(--hairline-width) solid var(--fest-border, var(--border-main));
		color: var(--fest-text, var(--text-main));
		text-decoration: none;
		font-size: 0.88rem;
		transition:
			border-color var(--transition-base),
			transform var(--transition-base);
	}

	.fests__link:hover {
		border-color: var(--fest-accent, var(--accent-primary));
		transform: translateX(3px);
	}

	.fests__name {
		font-weight: 600;
		color: var(--fest-title, var(--text-title));
	}

	.fests__years {
		font-variant-numeric: tabular-nums;
		color: var(--fest-muted, var(--text-muted));
		font-size: 0.82rem;
	}

	.fests__meta {
		color: var(--fest-muted, var(--text-muted));
		font-size: 0.82rem;
		font-weight: 400;
	}

	.fests__flags {
		margin-left: auto;
		flex-shrink: 0;
		font-size: 1rem;
		line-height: 1;
		letter-spacing: normal;
	}
</style>
