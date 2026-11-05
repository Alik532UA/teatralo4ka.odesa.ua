<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale } from 'svelte-i18n';

	const isEn = $derived($locale === 'en');

	interface CastPerson {
		roleUk: string;
		roleEn: string;
		name: string;
		nameEn: string;
		slug?: string;
		masterSlug?: string;
	}

	const castList: CastPerson[] = [
		{ roleUk: 'Настя', roleEn: 'Nastya', name: 'Катерина Тютюнник', nameEn: 'Kateryna Tiutiunnyk', slug: 'kateryna-tiutiunnyk' },
		{ roleUk: 'Ліза', roleEn: 'Liza', name: 'Анастасія Загородна', nameEn: 'Anastasiia Zahorodna', slug: 'anastasiia-zahorodnia' },
		{ roleUk: 'Аліна', roleEn: 'Alina', name: 'Кіра Любинська', nameEn: 'Kira Liubynska', slug: 'kira-liubynska' },
		{ roleUk: 'Іванка', roleEn: 'Ivanka', name: 'Поліна Койчева', nameEn: 'Polina Koicheva', slug: 'polina-koicheva' },
		{ roleUk: 'Ніна', roleEn: 'Nina', name: 'Софія Подьякова', nameEn: 'Sofiia Podiakova', slug: 'sofiia-podiakova' },
		{ roleUk: 'Яна', roleEn: 'Yana', name: 'Маргарита Ковтун', nameEn: 'Marharyta Kovtun', slug: 'marharyta-kovtun' },
		{ roleUk: 'Віра', roleEn: 'Vira', name: 'Крістіна Садоєва', nameEn: 'Kristina Sadoieva', slug: 'khrystyna-sadoieva' },
		{ roleUk: 'Олюня', roleEn: 'Oliunia', name: 'Тетяна Чупровська', nameEn: 'Tetiana Chuprovska', slug: 'tetiana-chuprovska' },
		{
			roleUk: 'Вчителька, Макс, батько, хлопець, мама, лікар',
			roleEn: 'Teacher, Max, father, boyfriend, mother, doctor',
			name: 'Павло Примак',
			nameEn: 'Pavlo Prymak',
			masterSlug: 'pavlo-prymak'
		}
	];
</script>

<div class="cast-box">
	<h4 class="cast-title">{isEn ? 'Cast & Roles' : 'Дійові особи та виконавці'}</h4>
	<div class="cast-chips">
		{#each castList as m (m.name)}
			{#if m.slug}
				<a
					href={resolve('/projects/galaxy-graduates/[address]', { address: m.slug })}
					class="cast-chip cast-chip--link"
					data-testid="uart-cast-graduate-{m.slug}-link"
				>
					<span class="cast-chip__role">{isEn ? m.roleEn : m.roleUk}</span>
					<span class="cast-chip__sep">—</span>
					<span class="cast-chip__name">{isEn ? m.nameEn : m.name}</span>
				</a>
			{:else if m.masterSlug}
				<a
					href={resolve('/residents/adults/[slug]', { slug: m.masterSlug })}
					class="cast-chip cast-chip--link"
					data-testid="uart-cast-master-{m.masterSlug}-link"
				>
					<span class="cast-chip__role">{isEn ? m.roleEn : m.roleUk}</span>
					<span class="cast-chip__sep">—</span>
					<span class="cast-chip__name">{isEn ? m.nameEn : m.name}</span>
				</a>
			{:else}
				<span class="cast-chip">
					<span class="cast-chip__role">{isEn ? m.roleEn : m.roleUk}</span>
					<span class="cast-chip__sep">—</span>
					<span class="cast-chip__name">{isEn ? m.nameEn : m.name}</span>
				</span>
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
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.825rem;
		padding: 0.35rem 0.75rem;
		border-radius: 9999px;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-main);
		text-decoration: none;
		line-height: 1.3;
	}
	.cast-chip__role {
		font-weight: 700;
		color: var(--accent-text);
	}
	.cast-chip__sep {
		opacity: 0.6;
	}
	.cast-chip__name {
		font-weight: 600;
	}
	.cast-chip--link {
		transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
	}
	.cast-chip--link:hover {
		background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
		border-color: var(--accent-text);
		transform: translateY(-1px);
	}
</style>
