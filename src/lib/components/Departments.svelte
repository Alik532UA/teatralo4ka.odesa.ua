<script lang="ts">
	import { Music, Theater, Sparkles, Palette, UserRound, Baby, GraduationCap, Drama, CalendarDays, Trophy, PenLine, Phone, ScrollText } from 'lucide-svelte';

	const departments = [
		{
			title: 'Музичне',
			description: 'Вокал, хор, фортепіано, гітара',
			icon: 'music'
		},
		{
			title: 'Театральне',
			description: 'Акторська майстерність, сценічна мова, танець',
			icon: 'theater'
		},
		{
			title: 'Відділення естетичного виховання',
			description: 'Розвиток смаку, етикету, творчого мислення та культурної впевненості',
			icon: 'aesthetic'
		},
		{
			title: 'Художнє',
			description: 'Живопис, композиція, малювання',
			icon: 'art'
		}
	];

	const residents = [
		{
			title: 'Дорослі',
			description: 'Програми творчого розвитку та сценічної впевненості для дорослих',
			icon: 'adult'
		},
		{
			title: 'Діти',
			description: 'Заняття у легкому форматі гри, уяви та перших сценічних кроків',
			icon: 'kids'
		},
		{
			title: 'Випускники',
			description: 'Спільнота випускників, події, майстер-класи і творчі зустрічі',
			icon: 'alumni'
		}
	];

	const projects = [
		{
			title: 'ТеатрPRO',
			description: 'Практичний проєкт для сценічної практики та командної роботи',
			icon: 'theaterpro'
		},
		{
			title: 'ВЕСНА.ОДЕСА.ТЕАТР',
			description: 'Сезонний культурний проєкт із відкритими показами та подіями',
			icon: 'spring'
		},
		{
			title: 'ФЕСТИВАЛЬ',
			description: 'Фестивальний напрям із виступами, конкурсами та творчим обміном',
			icon: 'festival'
		}
	];

	const info = [
		{
			title: 'ВСТУПИТИ',
			description: 'Умови вступу, програми навчання та покрокова подача заявки',
			icon: 'apply'
		},
		{
			title: 'КОНТАКТИ',
			description: 'Телефон, пошта та актуальні способи звʼязку зі школою',
			icon: 'contacts'
		},
		{
			title: 'ІСТОРІЯ',
			description: 'Історія створення школи, цінності та основні етапи розвитку',
			icon: 'history'
		}
	];
</script>

<section class="deps" id="departments">
	<div class="deps__container">
		<div class="deps__block">
			<h2 class="deps__heading">Відділення</h2>
			<div class="deps__grid deps__grid--wide">
				{#each departments as dep}
					<article class="deps__card">
						<div class="deps__media" aria-hidden="true">
							{#if dep.icon === 'music'}
								<Music size={44} strokeWidth={1.8} />
							{:else if dep.icon === 'theater'}
								<Theater size={44} strokeWidth={1.8} />
							{:else if dep.icon === 'aesthetic'}
								<Sparkles size={44} strokeWidth={1.8} />
							{:else}
								<Palette size={44} strokeWidth={1.8} />
							{/if}
						</div>
						<h3 class="deps__title">{dep.title}</h3>
						<p class="deps__desc">{dep.description}</p>
						<a href="#signup" class="deps__btn">дізнатися більше</a>
					</article>
				{/each}
			</div>
		</div>

		<div class="deps__block">
			<h2 class="deps__heading">Мешканці</h2>
			<div class="deps__grid">
				{#each residents as resident}
					<article class="deps__card deps__card--compact">
						<div class="deps__media" aria-hidden="true">
							{#if resident.icon === 'adult'}
								<UserRound size={44} strokeWidth={1.8} />
							{:else if resident.icon === 'kids'}
								<Baby size={44} strokeWidth={1.8} />
							{:else}
								<GraduationCap size={44} strokeWidth={1.8} />
							{/if}
						</div>
						<h3 class="deps__title">{resident.title}</h3>
						<p class="deps__desc">{resident.description}</p>
						<a href="#signup" class="deps__btn">дізнатися більше</a>
					</article>
				{/each}
			</div>
		</div>

		<div class="deps__block">
			<h2 class="deps__heading">Проєкти</h2>
			<div class="deps__grid">
				{#each projects as project}
					<article class="deps__card deps__card--compact">
						<div class="deps__media" aria-hidden="true">
							{#if project.icon === 'theaterpro'}
								<Drama size={44} strokeWidth={1.8} />
							{:else if project.icon === 'spring'}
								<CalendarDays size={44} strokeWidth={1.8} />
							{:else}
								<Trophy size={44} strokeWidth={1.8} />
							{/if}
						</div>
						<h3 class="deps__title">{project.title}</h3>
						<p class="deps__desc">{project.description}</p>
						<a href="#signup" class="deps__btn">дізнатися більше</a>
					</article>
				{/each}
			</div>
		</div>

		<div class="deps__block">
			<h2 class="deps__heading">Корисна інформація</h2>
			<div class="deps__grid">
				{#each info as item}
					<article class="deps__card deps__card--compact">
						<div class="deps__media" aria-hidden="true">
							{#if item.icon === 'apply'}
								<PenLine size={44} strokeWidth={1.8} />
							{:else if item.icon === 'contacts'}
								<Phone size={44} strokeWidth={1.8} />
							{:else}
								<ScrollText size={44} strokeWidth={1.8} />
							{/if}
						</div>
						<h3 class="deps__title">{item.title}</h3>
						<p class="deps__desc">{item.description}</p>
						<a href="#signup" class="deps__btn">дізнатися більше</a>
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.deps {
		padding: 5rem 1.5rem;
		background: var(--color-white);
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .deps {
		background: transparent;
	}

	.deps__container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.deps__block {
		margin-bottom: 3.5rem;
	}

	.deps__block:last-child {
		margin-bottom: 0;
	}

	.deps__heading {
		font-family: var(--font-heading);
		font-size: clamp(1.7rem, 4vw, 2.4rem);
		font-weight: 900;
		color: var(--color-deep-ocean);
		margin: 0 0 1.5rem;
		text-transform: uppercase;
	}

	.deps__grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.25rem;
	}

	.deps__grid--wide {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.deps__card {
		background: white;
		border-radius: 30px;
		padding: 1.6rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		min-height: 240px;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		border: 1px solid rgba(0,0,0,0.03);
	}

	.deps__card:hover {
		transform: translateY(-8px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}

	.deps__title {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--color-deep-ocean);
		margin: 0;
	}

	.deps__desc {
		font-size: 0.95rem;
		color: var(--color-body-text);
		line-height: 1.55;
		margin: 0;
		opacity: 0.8;
	}

	.deps__media {
		width: 80px;
		height: 80px;
		border-radius: 20px;
		background: var(--color-light-blue);
		color: var(--color-deep-ocean);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		transition: transform 0.3s ease;
	}

	.deps__card:hover .deps__media {
		transform: scale(1.1);
	}

	.deps__btn {
		display: inline-block;
		align-self: center;
		background: var(--color-deep-ocean);
		color: white;
		text-decoration: none;
		padding: 0.6rem 1.2rem;
		border-radius: 16px;
		font-weight: 700;
		font-size: 0.85rem;
		letter-spacing: 0.2px;
		transition: background 0.25s, transform 0.2s;
	}

	.deps__btn:hover {
		background: var(--color-sea-blue);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		.deps__grid,
		.deps__grid--wide {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.deps__grid,
		.deps__grid--wide {
			grid-template-columns: 1fr;
		}

		.deps__card {
			min-height: auto;
			padding: 2rem;
		}
	}
</style>
