<script lang="ts">
	import { base } from '$app/paths';
	import { t } from 'svelte-i18n';

	const departments = [
		{
			id: 'music',
			title: () => $t('departmentsSection.depItems.music.title'),
			description: () => $t('departmentsSection.depItems.music.desc'),
			image: `${base}/png/MusicDepartment.png`,
			href: `${base}/departments/music`
		},
		{
			id: 'theatre',
			title: () => $t('departmentsSection.depItems.theatre.title'),
			description: () => $t('departmentsSection.depItems.theatre.desc'),
			image: `${base}/png/TheaterDepartment.png`,
			href: `${base}/departments/theatre`
		},
		{
			id: 'aesthetic',
			title: () => $t('departmentsSection.depItems.aesthetic.title'),
			description: () => $t('departmentsSection.depItems.aesthetic.desc'),
			image: `${base}/png/AestheticDepartment.png`,
			href: `${base}/departments/aesthetic`
		},
		{
			id: 'art',
			title: () => $t('departmentsSection.depItems.art.title'),
			description: () => $t('departmentsSection.depItems.art.desc'),
			image: `${base}/png/ArtDepartment.png`,
			href: `${base}/departments/art`
		}
	];

	const residents = [
		{
			id: 'adults',
			title: () => $t('departmentsSection.resItems.adults.title'),
			description: () => $t('departmentsSection.resItems.adults.desc'),
			image: `${base}/png/Teacher1.png`,
			href: `${base}/residents/adults`
		},
		{
			id: 'kids',
			title: () => $t('departmentsSection.resItems.kids.title'),
			description: () => $t('departmentsSection.resItems.kids.desc'),
			image: `${base}/png/Students1.png`,
			href: `${base}/residents/kids`
		},
		{
			id: 'graduates',
			title: () => $t('departmentsSection.resItems.graduates.title'),
			description: () => $t('departmentsSection.resItems.graduates.desc'),
			image: `${base}/png/Graduates3.png`,
			href: `${base}/residents/graduates`
		}
	];

	const info = [
		{
			id: 'admission',
			title: () => $t('departmentsSection.infoItems.admission.title'),
			description: () => $t('departmentsSection.infoItems.admission.desc'),
			image: `${base}/png/AdmissionForm.png`,
			href: `${base}/admission`
		},
		{
			id: 'contacts',
			title: () => $t('departmentsSection.infoItems.contacts.title'),
			description: () => $t('departmentsSection.infoItems.contacts.desc'),
			image: `${base}/png/Contacts2.png`,
			href: `${base}/contacts`
		},
		{
			id: 'history',
			title: () => $t('departmentsSection.infoItems.history.title'),
			description: () => $t('departmentsSection.infoItems.history.desc'),
			image: `${base}/png/History3.png`,
			href: `${base}/history`
		}
	];
</script>

<section class="deps" id="departments" data-testid="departments-section">
	<div class="deps__container" data-testid="departments-container">
		<div class="deps__block" data-testid="info-block">
			<h2 class="deps__heading sr-only" data-testid="info-section-heading">{$t('departmentsSection.info')}</h2>
			<div class="deps__grid" data-testid="info-grid">
				{#each info as item, i}
					<a href={item.href} class="deps__card" data-testid={`info-card-${item.id}`} style="animation-delay: {i * 0.1}s">
						<div class="deps__image-wrap" data-testid={`info-card-image-wrap-${item.id}`}>
							<img src={item.image} alt={item.title()} class="deps__image" loading="lazy" data-testid={`info-card-img-${item.id}`} />
							<div class="deps__overlay"></div>
						</div>
						<div class="deps__content" data-testid={`info-card-content-${item.id}`}>
							<h3 class="deps__card-title">{item.title()}</h3>
							<p class="deps__card-description">{item.description()}</p>
						<button class="deps__link" data-testid={`info-btn-${item.id}`}>
							{$t('departmentsSection.learnMore')}
						</button>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<div class="deps__block" data-testid="departments-block">
			<h2 class="deps__heading" data-testid="departments-section-heading">{$t('departmentsSection.departments')}</h2>
			<div class="deps__grid deps__grid--wide" data-testid="departments-grid">
				{#each departments as dep, i}
					<a href={dep.href} class="deps__card" data-testid={`department-card-${dep.id}`} style="animation-delay: {i * 0.1}s">
						<div class="deps__image-wrap" data-testid={`department-card-image-wrap-${dep.id}`}>
							<img src={dep.image} alt={dep.title()} class="deps__image" loading="lazy" data-testid={`department-card-img-${dep.id}`} />
							<div class="deps__overlay"></div>
						</div>
						<div class="deps__content" data-testid={`department-card-content-${dep.id}`}>
							<h3 class="deps__card-title">{dep.title()}</h3>
							<p class="deps__card-description">{dep.description()}</p>
							<button class="deps__link" data-testid={`department-btn-${dep.id}`}>
								{$t('departmentsSection.learnMore')}
							</button>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<div class="deps__block" data-testid="residents-block">
			<h2 class="deps__heading" data-testid="residents-section-heading">{$t('departmentsSection.residents')}</h2>
			<div class="deps__grid" data-testid="residents-grid">
				{#each residents as resident, i}
					<a href={resident.href} class="deps__card" data-testid={`resident-card-${resident.id}`} style="animation-delay: {i * 0.1}s">
						<div class="deps__image-wrap" data-testid={`resident-card-image-wrap-${resident.id}`}>
							<img src={resident.image} alt={resident.title()} class="deps__image" loading="lazy" data-testid={`resident-card-img-${resident.id}`} />
							<div class="deps__overlay"></div>
						</div>
						<div class="deps__content" data-testid={`resident-card-content-${resident.id}`}>
							<h3 class="deps__card-title">{resident.title()}</h3>
							<p class="deps__card-description">{resident.description()}</p>
							<button class="deps__link" data-testid={`resident-btn-${resident.id}`}>
								{$t('departmentsSection.learnMore')}
							</button>
						</div>
					</a>
				{/each}
			</div>
		</div>

	</div>
</section>

<style>
	.deps {
		padding: 5rem 1.5rem;
		background: var(--bg-card);
		position: relative;
		transition: background 800ms ease-in-out;
	}

	:global(.app.with-dynamic-bg) .deps {
		background: transparent;
	}

	.deps__container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--space-xl);
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
		color: var(--text-title);
		margin: 0 0 2rem;
		text-transform: uppercase;
		text-align: center;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.deps__grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
	}

	.deps__grid .deps__card {
		flex: 0 1 calc(33.333% - 1rem);
		min-width: 300px;
	}

	.deps__grid--wide .deps__card {
		flex: 0 1 calc(25% - 1.125rem);
		min-width: 260px;
	}

	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.deps__card {
		background: var(--color-surface);
		border-radius: 30px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		animation: fadeInUp 0.8s ease-out both;
		text-decoration: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
	}

	:global(.dark-theme) .deps__card {
		background: color-mix(in srgb, var(--color-surface), transparent 88%);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
	}

	.deps__card:hover {
		transform: translateY(-10px);
		box-shadow: 0 0 10px var(--accent-primary);
	}

	.deps__image-wrap {
		position: relative;
		aspect-ratio: 5 / 4;
		overflow: hidden;
		background: var(--bg-surface);
	}

	.deps__image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 1.5rem;
		transition: transform 0.5s ease;
	}

	.deps__card:hover .deps__image {
		transform: scale(1.05);
	}

	.deps__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, color-mix(in srgb, var(--accent-primary), transparent 90%), transparent);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.deps__card:hover .deps__overlay {
		opacity: 1;
	}

	.deps__content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		background: var(--color-surface);
		align-items: center;
		text-align: center;
	}

	:global(.dark-theme) .deps__content {
		background: color-mix(in srgb, var(--color-surface), transparent 20%);
	}

	.deps__card-title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-title);
		line-height: 1.2;
		margin: 0;
	}

	:global(.dark-theme) .deps__card-title {
		color: var(--accent-primary);
	}

	.deps__card-description {
		font-size: 0.9rem;
		color: var(--color-body-text);
		line-height: 1.5;
		margin: 0;
		opacity: 0.8;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.deps__link {
		margin-top: auto;
		display: inline-block;
		padding: 0.75rem 2rem;
		font-weight: 700;
		color: var(--text-on-accent);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--accent-primary);
		border: none;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.deps__link:hover {
		box-shadow: 0 10px 20px color-mix(in srgb, var(--accent-primary), transparent 80%);
		transform: translateY(-2px);
	}

	/* Responsive Breakpoints */
	@media (max-width: 1200px) {
		.deps__grid .deps__card {
			flex: 0 1 calc(50% - 1rem);
		}
		
		.deps__grid--wide .deps__card {
			flex: 0 1 calc(50% - 1rem);
		}
	}

	@media (max-width: 900px) {
		.deps__grid .deps__card,
		.deps__grid--wide .deps__card {
			flex: 0 1 calc(50% - 1rem);
			min-width: 200px;
		}
	}

	@media (max-width: 600px) {
		.deps {
			padding: 3rem 0;
		}

		.deps__grid {
			gap: 0.75rem;
		}

		.deps__grid .deps__card,
		.deps__grid--wide .deps__card {
			flex: 0 1 calc(50% - 0.375rem);
			min-width: 140px;
			border-radius: 20px;
		}

		.deps__content {
			padding: 1rem 0.5rem;
			gap: 0.5rem;
		}

		.deps__image-wrap {
			height: 140px;
		}

		.deps__card-title {
			font-size: 0.9rem;
			text-align: center;
		}

		.deps__card-description {
			display: none; /* Hide description on very small screens to save space */
		}

		.deps__link {
			display: none; /* Hide link text on mobile cards */
		}
	}
</style>