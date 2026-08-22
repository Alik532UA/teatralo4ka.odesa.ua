<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { ChevronRight, Camera } from 'lucide-svelte';
	import StaticPage from '$lib/components/StaticPage.svelte';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';
	import PrayingHands from '$lib/components/icons/PrayingHands.svelte';
	import { masterProfilePath, type MasterCategory } from '$lib/data/masters';
	import { adultsVisibility } from '$lib/services/adultsVisibility.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const allMasters = $derived(data.masters ?? []);

	interface CategoryConfig {
		key: MasterCategory;
		icon: string;
		title: string;
		subtitle: string;
	}

	const categoryConfigs: CategoryConfig[] = [
		{
			key: 'administration',
			icon: '🏛️',
			title: 'Керівництво та адміністрація',
			subtitle: 'Команда, яка спрямовує розвиток та організовує життя школи'
		},
		{
			key: 'pedagogues',
			icon: '🎭',
			title: 'Майстри курсів та педагоги',
			subtitle: 'Викладачі Одеської театральної школи, які виховали покоління талановитих випускників'
		},
		{
			key: 'production',
			icon: '🎬',
			title: 'Художньо-технічна служба',
			subtitle: 'Майстри звуку, художнього світла та сцени'
		},
		{
			key: 'it',
			icon: '💻',
			title: 'IT та цифрові технології',
			subtitle: 'Цифрова інфраструктура, розробка та технологічний супровід школи'
		},
		{
			key: 'support',
			icon: '☕',
			title: 'Служба турботи та затишку',
			subtitle: 'Люди, які щодня дбають про безпеку, чистоту та домашній затишок у школі'
		},
		{
			key: 'honorary',
			icon: '🕯️',
			title: "Світла пам'ять",
			subtitle: 'Викладачі та майстри, які назавжди залишаються в серці нашої школи'
		},
		{
			key: 'history',
			icon: '📜',
			title: 'Історія школи',
			subtitle: 'Педагоги та наставники, які творили історію Одеської театральної школи'
		}
	];

	const groups = $derived(
		categoryConfigs
			.map((cfg) => {
				const items = allMasters.filter((m) => {
					if (cfg.key === 'honorary') return m.status === 'honorary' || m.category === 'honorary';
					if (cfg.key === 'history') return m.status === 'history' || m.category === 'history';
					if (cfg.key === 'pedagogues') return m.category === 'pedagogues' || (!m.category && (!m.status || m.status === 'active'));
					return m.category === cfg.key;
				});

				return {
					key: cfg.key,
					icon: cfg.icon,
					title: $t(`galaxy.categories.${cfg.key}`, { default: cfg.title }),
					subtitle: $t(`galaxy.categories.${cfg.key}Subtitle`, { default: cfg.subtitle }),
					items
				};
			})
			.filter((g) => g.items.length > 0)
	);
</script>

<div class="adults-page">
	<StaticPage {data} testPrefix="residents-adults" />

	{#if adultsVisibility.isVisible && allMasters.length > 0}
		<section class="masters-section" aria-labelledby="masters-title" data-testid="residents-adults-masters-section">
			<div class="container masters-container">
				<header class="masters-header">
					<h2 id="masters-title" class="masters-title" data-testid="residents-adults-masters-title">
						{$t('galaxy.mastersSectionTitle', { default: 'Наша команда' })}
					</h2>
					<p class="masters-subtitle" data-testid="residents-adults-masters-text">
						{$t('galaxy.mastersSectionSubtitle', { default: 'Педагоги, майстри та команда однодумців Одеської театральної школи' })}
					</p>
				</header>

				<div class="masters-groups" data-testid="residents-adults-masters-container">
					{#each groups as group (group.key)}
						<div class="masters-group" data-testid="residents-adults-group-section-{group.key}">
							<div class="masters-group__header">
								<h3 class="masters-group__title" data-testid="residents-adults-group-title-{group.key}">
									<span class="masters-group__icon" aria-hidden="true">{group.icon}</span>
									<span>{group.title}</span>
								</h3>
								{#if group.subtitle}
									<p class="masters-group__subtitle">{group.subtitle}</p>
								{/if}
							</div>

							<div class="masters-grid" data-testid="residents-adults-masters-list-{group.key}">
								{#each group.items as m (m.id)}
									{@const href = masterProfilePath(m.slug, isEn ? 'en' : 'uk')}
									{@const name = isEn ? m.fullNameEn : m.fullName}
									{@const dispName = isEn ? m.displayNameEn : m.displayName}
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
									<a
										{href}
										class="master-card"
										title={name}
										data-testid="residents-adults-master-card-{m.slug}"
									>
										<div class="master-card__avatar-wrap">
											{#if m.photo}
												<img
													src={m.photo}
													alt={name}
													class="master-card__avatar"
													class:master-card__avatar--honorary={m.isHonorary || m.status === 'honorary' || m.category === 'honorary'}
													width="80"
													height="80"
													loading="lazy"
												/>
											{:else}
												<div class="master-card__avatar-placeholder" aria-hidden="true">
													<Camera size={32} aria-hidden="true" />
												</div>
											{/if}
										</div>

										<div class="master-card__content">
											<h3 class="master-card__name">{dispName}</h3>

											{#if m.roleTitle}
												<p class="master-card__role-title">{m.roleTitle}</p>
											{/if}

											{#if m.isHonorary || m.status === 'honorary' || m.category === 'honorary'}
												<span class="master-card__honorary-badge">
													<span>{$t('galaxy.honoraryShort', { default: "Світлої пам'яті" })}</span>
												</span>
											{/if}

											{#if m.departments && m.departments.length > 0}
												<div class="master-card__footer">
													<div class="master-card__depts">
														{#each m.departments as dept (dept)}
															<span class="master-card__dept-badge" title={$t(`galaxy.departments.${dept}`, { default: dept })}>
																<DepartmentIcon department={dept} size={15} />
															</span>
														{/each}
													</div>
												</div>
											{/if}
										</div>

										<div class="master-card__arrow" aria-hidden="true">
											<ChevronRight size={20} />
										</div>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</div>

<style>
	.adults-page {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-bottom: 4rem;
	}

	.masters-section {
		padding: 2.5rem 0 3.5rem;
		border-top: 1px solid var(--border-main);
	}

	.masters-container {
		max-width: var(--max-width, 1200px);
		margin: 0 auto;
		padding: 0 1rem;
	}

	.masters-header {
		margin-bottom: 2.5rem;
		text-align: center;
	}

	.masters-title {
		margin: 0 0 0.75rem;
		font-size: clamp(1.6rem, 3.2vw, 2.4rem);
		font-weight: 700;
		color: var(--text-title);
	}

	.masters-subtitle {
		margin: 0 auto;
		max-width: 680px;
		font-size: 1.05rem;
		color: var(--text-muted);
		line-height: 1.55;
	}

	.masters-groups {
		display: flex;
		flex-direction: column;
		gap: 3.5rem;
	}

	.masters-group {
		display: flex;
		flex-direction: column;
	}

	.masters-group__header {
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-main);
		padding-bottom: 0.6rem;
	}

	.masters-group__title {
		margin: 0 0 0.35rem;
		font-size: clamp(1.3rem, 2.5vw, 1.8rem);
		font-weight: 700;
		color: var(--text-title);
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.masters-group__icon {
		font-size: 1.4rem;
	}

	.masters-group__subtitle {
		margin: 0;
		font-size: 0.95rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	.masters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.master-card {
		display: flex;
		align-items: flex-start;
		gap: 1.25rem;
		padding: 1.25rem 1.4rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-xl, 20px);
		color: var(--text-main);
		text-decoration: none;
		box-shadow: var(--shadow-main);
		transition: transform var(--transition-base, 0.25s ease), border-color var(--transition-base, 0.25s ease), box-shadow var(--transition-base, 0.25s ease);
	}

	.master-card:hover {
		transform: translateY(-4px);
		border-color: var(--accent-primary);
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
	}

	.master-card__avatar-wrap {
		position: relative;
		width: 72px;
		height: 72px;
		flex-shrink: 0;
	}

	.master-card__avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--accent-primary);
	}

	.master-card__avatar--honorary {
		filter: grayscale(100%);
		transition: filter 10s ease;
	}

	.master-card:hover .master-card__avatar--honorary,
	.master-card__avatar--honorary:hover {
		filter: grayscale(0%);
	}

	.master-card__avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-surface);
		border: 2px dashed var(--border-main);
		color: var(--accent-text);
	}

	.master-card__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.master-card__name {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}

	.master-card__role-title {
		margin: 0.2rem 0 0.25rem;
		font-size: 0.85rem;
		line-height: 1.35;
		color: var(--text-muted);
		font-weight: 500;
	}

	.master-card__honorary-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 500;
		width: fit-content;
		margin-top: 0.15rem;
	}

	.master-card__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.35rem;
	}

	.master-card__depts {
		display: flex;
		gap: 0.35rem;
	}

	.master-card__dept-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
	}

	.master-card__arrow {
		color: var(--border-main);
		transition: transform 0.2s ease, color 0.2s ease;
		align-self: center;
	}

	.master-card:hover .master-card__arrow {
		transform: translateX(4px);
		color: var(--accent-primary);
	}
</style>
