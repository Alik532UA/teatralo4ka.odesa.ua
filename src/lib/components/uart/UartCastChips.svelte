<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale } from 'svelte-i18n';

	const isEn = $derived($locale === 'en');

	const castList = [
		{ name: 'Кіра Любинська', nameEn: 'Kira Liubynska' },
		{ name: 'Софія Подьякова', nameEn: 'Sofiia Podiakova', slug: 'sofiia-podiakova' },
		{ name: 'Христина Садоєва', nameEn: 'Khrystyna Sadoieva', slug: 'khrystyna-sadoieva' },
		{ name: 'Поліна Койчева', nameEn: 'Polina Koicheva', slug: 'polina-koicheva' },
		{ name: 'Тетяна Чупровська', nameEn: 'Tetiana Chuprovska', slug: 'tetiana-chuprovska' },
		{ name: 'Марія Дацюк', nameEn: 'Mariia Datsiuk', slug: 'mariia-datsiuk' },
		{ name: 'Ніколь Онищенко', nameEn: 'Nikol Onyshchenko' },
		{ name: 'Павло Примак', nameEn: 'Pavlo Prymak', masterSlug: 'pavlo-prymak' }
	];
</script>

<div class="cast-box">
	<h4 class="cast-title">{isEn ? 'Course Cast' : 'Акторський склад'}</h4>
	<div class="cast-chips">
		{#each castList as m (m.name)}
			{#if m.slug}
				<a
					href={resolve('/projects/galaxy-graduates/[address]', { address: m.slug })}
					class="cast-chip cast-chip--link"
					data-testid="uart-cast-graduate-{m.slug}-link"
				>
					{isEn ? m.nameEn : m.name}
				</a>
			{:else if m.masterSlug}
				<a
					href={resolve('/residents/adults/[slug]', { slug: m.masterSlug })}
					class="cast-chip cast-chip--link"
					data-testid="uart-cast-master-{m.masterSlug}-link"
				>
					{isEn ? m.nameEn : m.name}
				</a>
			{:else}
				<span class="cast-chip">{isEn ? m.nameEn : m.name}</span>
			{/if}
		{/each}
	</div>
</div>

<style>
	.cast-box {
		margin-top: 1.25rem;
	}
	.cast-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin: 0 0 0.65rem;
	}
	.cast-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}
	.cast-chip {
		display: inline-block;
		font-size: 0.825rem;
		font-weight: 600;
		padding: 0.3rem 0.65rem;
		border-radius: 8px;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-main);
		text-decoration: none;
	}
	.cast-chip--link {
		color: var(--accent-text);
		text-decoration: underline;
		text-underline-offset: 2px;
		transition: background 0.2s ease;
	}
	.cast-chip--link:hover {
		background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
	}
</style>
