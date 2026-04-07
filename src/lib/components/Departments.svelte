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
			href: `${base}/contacts`
		},
		{
			title: 'ІСТОРІЯ',
			description: 'Історія створення школи, цінності та основні етапи розвитку',
			image: `${base}/png/Історія3.png`,
			href: `${base}/history`
		}
	];
</script>

<section class="deps" id="departments" data-testid="departments-section">
	<div class="deps__container" data-testid="departments-container">
		<div class="deps__block" data-testid="info-block">
			<h2 class="deps__heading sr-only">Корисна інформація</h2>
			<div class="deps__grid" data-testid="info-grid">
				{#each info as item, i}
				   <article class="deps__card deps__card--compact" data-testid={`info-card-${i}`}>
					   <div class="deps__media" aria-hidden="true">
						   <img src={item.image} alt={item.title} class="deps__img" />
					   </div>
					   <div class="deps__content">
						   <h3 class="deps__title">{item.title}</h3>
						   <p class="deps__desc">{item.description}</p>
						   <a href={item.href} class="deps__btn" data-testid={`info-btn-${i}`}>дізнатися більше</a>
					   </div>
				   </article>
				{/each}
			</div>
		</div>

		<div class="deps__block" data-testid="departments-block">
			<h2 class="deps__heading">Відділення</h2>
			<div class="deps__grid deps__grid--wide" data-testid="departments-grid">
				{#each departments as dep, i}
				   <article class="deps__card" data-testid={`department-card-${i}`}>
					   <div class="deps__media" aria-hidden="true">
						   <img src={dep.image} alt={dep.title} class="deps__img" />
					   </div>
					   <div class="deps__content">
						   <h3 class="deps__title">{dep.title}</h3>
						   <p class="deps__desc">{dep.description}</p>
						   <a href={dep.href} class="deps__btn" data-testid={`department-btn-${i}`}>дізнатися більше</a>
					   </div>
				   </article>
				{/each}
			</div>
		</div>

		<div class="deps__block" data-testid="residents-block">
			<h2 class="deps__heading">Мешканці</h2>
			<div class="deps__grid" data-testid="residents-grid">
				{#each residents as resident, i}
				   <article class="deps__card deps__card--compact" data-testid={`resident-card-${i}`}>
					   <div class="deps__media" aria-hidden="true">
						   <img src={resident.image} alt={resident.title} class="deps__img" />
					   </div>
					   <div class="deps__content">
						   <h3 class="deps__title">{resident.title}</h3>
						   <p class="deps__desc">{resident.description}</p>
						   <a href={resident.href} class="deps__btn" data-testid={`resident-btn-${i}`}>дізнатися більше</a>
					   </div>
				   </article>
				{/each}
			</div>
		</div>

		<div class="deps__block" data-testid="projects-block">
			<h2 class="deps__heading">Проєкти</h2>
			<div class="deps__grid" data-testid="projects-grid">
				{#each projects as project, i}
				   <article class="deps__card deps__card--compact" data-testid={`project-card-${i}`}>
					   <div class="deps__media" aria-hidden="true">
						   <img src={project.image} alt={project.title} class="deps__img" />
					   </div>
					   <div class="deps__content">
						   <h3 class="deps__title">{project.title}</h3>
						   <p class="deps__desc">{project.description}</p>
						   <a href={project.href} class="deps__btn" data-testid={`project-btn-${i}`}>дізнатися більше</a>
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

	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
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
		animation: fadeInUp 0.8s ease-out both;
	}

	.deps__card:nth-child(1) { animation-delay: 0.1s; }
	.deps__card:nth-child(2) { animation-delay: 0.2s; }
	.deps__card:nth-child(3) { animation-delay: 0.3s; }
	.deps__card:nth-child(4) { animation-delay: 0.4s; }
	.deps__card:nth-child(5) { animation-delay: 0.5s; }
	.deps__card:nth-child(6) { animation-delay: 0.6s; }

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
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}

		.deps__card {
			min-height: auto;
			border-radius: 20px;
		}

		/* Центрування останньої картки, якщо кількість непарна */
		.deps__card:last-child:nth-child(odd) {
			grid-column: 1 / -1;
			width: calc(50% - 0.375rem); /* Половина ширини з урахуванням gap 0.75rem */
			margin: 0 auto;
		}

		.deps__content {
			padding: 1rem 0.5rem;
			gap: 0.5rem;
		}

		.deps__title {
			font-size: 0.95rem;
		}

		.deps__desc {
			font-size: 0.8rem;
			display: -webkit-box;
			-webkit-line-clamp: 3;
			line-clamp: 3;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.deps__btn {
			padding: 0.4rem 0.8rem;
			font-size: 0.75rem;
			border-radius: 10px;
		}
	}
</style>
