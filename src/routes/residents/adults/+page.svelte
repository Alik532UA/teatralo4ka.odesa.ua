<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import StaticPage from '$lib/components/StaticPage.svelte';
	import MasterCard from '$lib/components/adults/MasterCard.svelte';
	import MasterPoster from '$lib/components/adults/MasterPoster.svelte';
	import MasterCompact from '$lib/components/adults/MasterCompact.svelte';
	import MasterViewToggle, { type ViewMode } from '$lib/components/adults/MasterViewToggle.svelte';
	import type { MasterCategory } from '$lib/data/masters';
	import { adultsVisibility } from '$lib/services/adultsVisibility.svelte';
	import { adultsViewMode } from '$lib/services/adultsViewMode.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const allMasters = $derived(data.masters ?? []);

	// Стан і збереження — у контролері: ключ мусить нести префікс проєкту, бо
	// origin спільний із рештою проєктів (STORAGE-NAMESPACE-v8).
	const viewMode = $derived(adultsViewMode.current);

	function handleViewChange(mode: ViewMode) {
		adultsViewMode.set(mode);
	}

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
		},
		// Останній навмисно: розділ технічний, він про повноту даних, а не про
		// людей, і не мусить відтісняти змістові розділи вгору.
		{
			key: 'needsClarification',
			icon: '❓',
			title: 'Потребують уточнення',
			subtitle: 'Записи, яким не хватає даних — насамперед фотографії; уточнюємо'
		}
	];

	/*
	 * Фіксований порядок керівництва.
	 *
	 * `liliia-velychko` прибрана: вона переїхала в «Історію школи», і запис тут
	 * лишався мертвим — `indexOf` віддавав −1, тобто рядок нічого не робив.
	 * `hanna-nikolaieva` стала на її місце пʼятою: вона тепер завідувачка
	 * музичним відділенням, а без запису в цьому переліку опинялася ОСТАННЬОЮ —
	 * невідомі йдуть у хвіст. Заміряно в браузері: до правки була восьмою.
	 */
	const ADMIN_ORDER = [
		'olena-tkach',
		'oksana-panchenko',
		'svitlana-ryskina',
		'vira-koval',
		'hanna-nikolaieva',
		'natalia-shalashna',
		'liubov-frankovska',
		'tetiana-korenchuk'
	];

	function sortCategoryItems(category: MasterCategory, items: typeof allMasters) {
		if (category === 'administration') {
			return [...items].sort((a, b) => {
				const idxA = ADMIN_ORDER.indexOf(a.id);
				const idxB = ADMIN_ORDER.indexOf(b.id);
				if (idxA !== -1 && idxB !== -1) return idxA - idxB;
				if (idxA !== -1) return -1;
				if (idxB !== -1) return 1;
				return 0;
			});
		}

		if (category === 'support') {
			return [...items].sort((a, b) => {
				if (a.id === 'natalia-stoianova') return -1;
				if (b.id === 'natalia-stoianova') return 1;
				return 0;
			});
		}

		if (category === 'pedagogues' || category === 'history') {
			return [...items].sort((a, b) => {
				const countA = a.graduatesCount ?? 0;
				const countB = b.graduatesCount ?? 0;
				if (countB !== countA) return countB - countA;
				const photoA = a.photo ? 0 : 1;
				const photoB = b.photo ? 0 : 1;
				if (photoA !== photoB) return photoA - photoB;
				return a.fullName.localeCompare(b.fullName, 'uk');
			});
		}

		/*
		 * «Потребують уточнення» — АЛФАВІТ, і тільки він.
		 *
		 * Не за `graduatesCount`, як у сусідніх двох розділах, і причина
		 * заміряна: цього поля немає НІ В ОДНОГО зі 118 записів (`graduatesCount`
		 * мають 0 зі 118). Тобто в `pedagogues` і `history` перше порівняння
		 * завжди дає нуль, і фактично там працюють два наступні — «з фотографією
		 * вперед», далі алфавіт. У цьому розділі перше з них теж безсенсовне:
		 * більшість записів тут саме тому, що фотографії немає, тож воно
		 * розділило б людей на дві купи за ознакою, яка для всього розділу
		 * однакова.
		 *
		 * Лишається алфавіт за `fullName` — єдиний передбачуваний порядок, який
		 * не залежить від повноти даних і не змінюється, поки не зміниться імʼя.
		 */
		if (category === 'needsClarification') {
			return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, 'uk'));
		}

		return items;
	}

	const groups = $derived(
		categoryConfigs
			.map((cfg) => {
				const items = allMasters.filter((m) => {
					/*
					 * Явна `category` — головна, а `status` лишається резервом.
					 *
					 * Доти `honorary` і `history` бралися ще й за `status`, і це
					 * працювало рівно тому, що обидва поля збігалися в усіх 118
					 * записах (перевірено: розбіжностей нуль). З появою розділу
					 * «Потребують уточнення» вони РОЗІЙШЛИСЯ навмисно: 21 запис
					 * переїхав із «Історії школи», але `status: 'history'` у них
					 * лишився — це факт про період, у якому людина працювала, а не
					 * про розділ, у якому її показують. За старою умовою кожен із
					 * цих 21 показувався б У ДВОХ РОЗДІЛАХ одночасно.
					 *
					 * Резервні правила за `status` лишаються для записів без
					 * `category` — таких зараз нуль, але поле необовʼязкове в типі.
					 */
					if (m.category) return m.category === cfg.key;
					if (cfg.key === 'honorary') return m.status === 'honorary';
					if (cfg.key === 'history') return m.status === 'history';
					if (cfg.key === 'pedagogues') return !m.status || m.status === 'active';
					return false;
				});

				return {
					key: cfg.key,
					icon: cfg.icon,
					title: $t(`galaxy.categories.${cfg.key}`, { default: cfg.title }),
					subtitle: $t(`galaxy.categories.${cfg.key}Subtitle`, { default: cfg.subtitle }),
					items: sortCategoryItems(cfg.key, items)
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
					<div class="masters-header__text">
						<h2 id="masters-title" class="masters-title" data-testid="residents-adults-masters-title">
							{$t('galaxy.mastersSectionTitle', { default: 'Наша команда' })}
						</h2>
						<p class="masters-subtitle" data-testid="residents-adults-masters-text">
							{$t('galaxy.mastersSectionSubtitle', { default: 'Педагоги, майстри та команда однодумців Одеської театральної школи' })}
						</p>
					</div>

					<MasterViewToggle {viewMode} onchange={handleViewChange} />
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

							{#if viewMode === 'cards'}
								<div class="masters-grid masters-grid--cards" data-testid="residents-adults-masters-list-{group.key}">
									{#each group.items as m (m.id)}
										<MasterCard master={m} {isEn} />
									{/each}
								</div>
							{:else if viewMode === 'gallery'}
								<div class="masters-grid masters-grid--gallery" data-testid="residents-adults-masters-list-{group.key}">
									{#each group.items as m (m.id)}
										<MasterPoster master={m} {isEn} />
									{/each}
								</div>
							{:else}
								<div class="masters-grid masters-grid--compact" data-testid="residents-adults-masters-list-{group.key}">
									{#each group.items as m (m.id)}
										<MasterCompact master={m} {isEn} />
									{/each}
								</div>
							{/if}
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 2.5rem;
		text-align: center;
	}

	@media (min-width: 768px) {
		.masters-header {
			flex-direction: row;
			text-align: left;
		}
	}

	.masters-header__text {
		flex: 1;
	}

	.masters-title {
		margin: 0 0 0.5rem;
		font-size: clamp(1.6rem, 3.2vw, 2.4rem);
		font-weight: 700;
		color: var(--text-title);
	}

	.masters-subtitle {
		margin: 0;
		max-width: 620px;
		font-size: 1.02rem;
		color: var(--text-muted);
		line-height: 1.5;
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
		gap: 1.5rem;
	}

	.masters-grid--cards {
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	}

	.masters-grid--gallery {
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1.75rem;
	}

	.masters-grid--compact {
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 1.75rem 1.25rem;
	}
</style>
