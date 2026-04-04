<script lang="ts">
	import { base } from '$app/paths';

	const departments = [
		{
			title: 'Музичне',
			description: 'Вокал, хор, фортепіано, гітара',
			image: `${base}/png/МузичнеВідділення.png`,
			href: `${base}/departments/music`
		},
		{
			title: 'Театральне',
			description: 'Акторська майстерність, сценічна мова, танець',
			image: `${base}/png/ТеатральнеВідділення.png`,
			href: `${base}/departments/theatre`
		},
		{
			title: 'Відділення естетичного виховання',
			description: 'Развиток смаку, етикету, творчого мислення та культурної впевненості',
			image: `${base}/png/ЕстетичнеВідділення.png`,
			href: `${base}/departments/aesthetic`
		},
		{
			title: 'Художнє',
			description: 'Живопис, композиція, малювання',
			image: `${base}/png/ХудожнеВідділення.png`,
			href: `${base}/departments/art`
		}
	];

	const residents = [
		{
			title: 'Дорослі',
			description: 'Програми творчого розвитку та сценічної впевненості для дорослих',
			image: `${base}/png/Викладачка1.png`,
			href: `${base}/residents/adults`
		},
		{
			title: 'Діти',
			description: 'Заняття у легкому форматі гри, уяви та перших сценічних кроків',
			image: `${base}/png/Учні1.png`,
			href: `${base}/residents/kids`
		},
		{
			title: 'Випускники',
			description: 'Спільнота випускників, події, майстер-класи і творчі зустрічі',
			image: `${base}/png/Випускники3.png`,
			href: `${base}/residents/graduates`
		}
	];

	const projects = [
		{
			title: 'ТеатрPRO',
			description: 'Практичний проєкт для сценічної практики та командної роботи',
			image: `${base}/png/Новини1.png`,
			href: `${base}/projects/teatr-pro`
		},
		{
			title: 'ВЕСНА.ОДЕСА.ТЕАТР',
			description: 'Сезонний культурний проєкт із відкритими показами та подіями',
			image: `${base}/png/Новини1.png`,
			href: `${base}/projects/spring-odessa-theatre`
		},
		{
			title: 'ФЕСТИВАЛЬ',
			description: 'Фестивальний напрям із виступами, конкурсами та творчим обміном',
			image: `${base}/png/Новини1.png`,
			href: `${base}/projects/festival`
		}
	];

	const info = [
		{
			title: 'ВСТУПИТИ',
			description: 'Умови вступу, програми навчання та покрокова подача заявки',
			image: `${base}/png/АнкетаВступника.png`,
			href: `${base}/admission`
		},
		{
			title: 'КОНТАКТИ',
			description: 'Телефон, пошта та актуальні способи звʼязку зі школою',
			image: `${base}/png/Контакти2.png`,
			href: `${base}/competitions`
		},
		{
			title: 'ІСТОРІЯ',
			description: 'Історія створення школи, цінності та основні етапи розвитку',
			image: `${base}/png/Історія3.png`,
			href: `${base}/history`
		}
	];
</script>

<section class="deps" id="departments">
	<div class="deps__container">
		<div class="deps__block">
			<h2 class="deps__heading sr-only">Корисна інформація</h2>
			<div class="deps__grid">
				{#each info as item}
					<article class="deps__card deps__card--compact">
						<div class="deps__media" aria-hidden="true">
							<img src={item.image} alt={item.title} class="deps__img" />
						</div>
						<div class="deps__content">
							<h3 class="deps__title">{item.title}</h3>
							<p class="deps__desc">{item.description}</p>
							<a href={item.href} class="deps__btn">дізнатися більше</a>
						</div>
					</article>
				{/each}
			</div>
		</div>

		<div class="deps__block">
			<h2 class="deps__heading">Відділення</h2>
			<div class="deps__grid deps__grid--wide">
				{#each departments as dep}
					<article class="deps__card">
						<div class="deps__media" aria-hidden="true">
							<img src={dep.image} alt={dep.title} class="deps__img" />
						</div>
						<div class="deps__content">
							<h3 class="deps__title">{dep.title}</h3>
							<p class="deps__desc">{dep.description}</p>
							<a href={dep.href} class="deps__btn">дізнатися більше</a>
						</div>
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
							<img src={resident.image} alt={resident.title} class="deps__img" />
						</div>
						<div class="deps__content">
							<h3 class="deps__title">{resident.title}</h3>
							<p class="deps__desc">{resident.description}</p>
							<a href={resident.href} class="deps__btn">дізнатися більше</a>
						</div>
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
							<img src={project.image} alt={project.title} class="deps__img" />
						</div>
						<div class="deps__content">
							<h3 class="deps__title">{project.title}</h3>
							<p class="deps__desc">{project.description}</p>
							<a href={project.href} class="deps__btn">дізнатися більше</a>
						</div>
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
		margin: 0 0 2rem;
		text-transform: uppercase;
		text-align: center;
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
		background: var(--color-white);
		border-radius: 30px;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		border: 1px solid rgba(0,0,0,0.05);
	}

	:global(.dark-theme) .deps__card {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	}

	.deps__card:hover {
		transform: scale(1.02);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-sea-blue);
	}

	.deps__media {
		width: 100%;
		aspect-ratio: 1 / 1;
		background: var(--color-light-blue);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		transition: transform 0.5s ease;
		overflow: hidden;
	}

	:global(.dark-theme) .deps__media {
		background: rgba(0, 95, 174, 0.1);
	}

	.deps__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.deps__card:hover .deps__img {
		transform: scale(1.1);
	}

	.deps__content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		flex: 1;
		text-align: center;
		justify-content: flex-start;
	}

	.deps__title {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--color-deep-ocean);
		margin: 0;
		transition: color 0.3s ease;
	}

	:global(.dark-theme) .deps__title {
		color: var(--color-dark-text);
	}

	.deps__desc {
		font-size: 0.95rem;
		color: var(--color-body-text);
		line-height: 1.55;
		margin: 0;
		opacity: 0.8;
	}

	.deps__btn {
		margin-top: auto;
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
		transition: all 0.3s ease;
	}

	:global(.dark-theme) .deps__btn {
		background: var(--color-sea-blue);
	}

	.deps__btn:hover {
		background: var(--color-sea-blue);
		transform: scale(1.03);
		box-shadow: 0 5px 15px rgba(0, 95, 174, 0.3);
	}

	:global(.dark-theme) .deps__btn:hover {
		background: var(--color-sky-blue);
		color: var(--color-deep-ocean);
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
