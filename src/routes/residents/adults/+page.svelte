<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import StaticPage from '$lib/components/StaticPage.svelte';
	import MasterCard from '$lib/components/adults/MasterCard.svelte';
	import MasterPoster from '$lib/components/adults/MasterPoster.svelte';
	import MasterCompact from '$lib/components/adults/MasterCompact.svelte';
	import MasterViewToggle, { type ViewMode } from '$lib/components/adults/MasterViewToggle.svelte';
	import { masterSection, type MasterSection } from '$lib/data/masters';
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
		key: MasterSection;
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
		// Одразу після керівництва й перед педагогами: завідувачка веде відділення
		// (тобто частину школи) і водночас викладає — між цими двома розділами вона
		// й стоїть.
		{
			key: 'heads',
			icon: '🎓',
			title: 'Завідувачі відділення',
			subtitle: 'Педагоги, які ведуть відділення школи та власні предмети'
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
			subtitle: 'Записи без фотографії або без повного імені — уточнюємо'
		}
	];

	/*
	 * Фіксований порядок керівництва: директорка, заступниця, далі бухгалтерія.
	 *
	 * `liliia-velychko` прибрана 2026-08-24: вона переїхала в «Історію школи», і
	 * запис тут лишався мертвим — `indexOf` віддавав −1, тобто рядок нічого не
	 * робив. Тоді ж троє завідувачок (`svitlana-ryskina`, `vira-koval`,
	 * `hanna-nikolaieva`) поїхали у власний розділ `heads`, тож із цього переліку
	 * вони прибрані: залишений тут запис так само нічого не робив би, бо
	 * сортування бачить лише записи свого розділу.
	 */
	const ADMIN_ORDER = ['olena-tkach', 'oksana-panchenko', 'natalia-shalashna', 'liubov-frankovska', 'tetiana-korenchuk'];

	/*
	 * Завідувачі — так само фіксовано, і порядок узятий не з абетки: він
	 * успадкований із того, як троє стояли в керівництві до розділення
	 * (театральне → художнє → музичне). Без цього переліку порядок визначався б
	 * кількістю учнів, і Риськіна з 37 учнями завжди була б першою, а решта двоє
	 * перескакували б місцями від кожної правки в даних випускників.
	 */
	const HEADS_ORDER = ['svitlana-ryskina', 'vira-koval', 'hanna-nikolaieva'];

	/** Порядок за наперед заданим переліком; невідомі — у хвіст, між собою рівні. */
	function byFixedOrder(order: string[], items: typeof allMasters) {
		return [...items].sort((a, b) => {
			const ia = order.indexOf(a.id);
			const ib = order.indexOf(b.id);
			if (ia !== -1 && ib !== -1) return ia - ib;
			if (ia !== -1) return -1;
			if (ib !== -1) return 1;
			return 0;
		});
	}

	function sortCategoryItems(category: MasterSection, items: typeof allMasters) {
		if (category === 'administration') return byFixedOrder(ADMIN_ORDER, items);
		if (category === 'heads') return byFixedOrder(HEADS_ORDER, items);

		if (category === 'support') {
			return [...items].sort((a, b) => {
				if (a.id === 'natalia-stoianova') return -1;
				if (b.id === 'natalia-stoianova') return 1;
				return 0;
			});
		}

		/*
		 * Спершу за кількістю учнів, і це порівняння ЖИВЕ.
		 *
		 * Поля `graduatesCount` у `masters.index.json` справді немає ні в кого —
		 * його додає `+page.ts` із `getGraduatesByMaster`. Заміряно 2026-08-24:
		 * учні є у 26 зі 118 майстрів, від 1 до 37 (Риськіна 37, Ісачкіна 27,
		 * Ткач Ф. 16), тобто перше порівняння визначає порядок у голові списку, а
		 * «з фотографією вперед» і алфавіт розсуджують решту — тих, у кого нуль.
		 * Доти тут стояло, що це порівняння завжди дає нуль і не додає нічого; це
		 * було неправдою й описувало сортування, якого немає.
		 */
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
		 * Не за кількістю учнів, як у сусідніх двох розділах, і не «з фотографією
		 * вперед»: у цей розділ запис потрапляє саме за брак фотографії або
		 * повного імені, тож обидві ознаки тут майже однакові для всіх і
		 * розділили б людей на купи ні за чим.
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
				/*
				 * Один виклик замість чотирьох умов: розділ ОБЧИСЛЮЄТЬСЯ з ролі,
				 * статусу й повноти даних (`masterSection`, там же заміри й
				 * причини). Доти тут стояла драбинка з `category` і резервів за
				 * `status`, і вона могла показати одну людину в двох розділах —
				 * саме тому, що поле `category` відповідало на три різних питання.
				 */
				const items = allMasters.filter((m) => masterSection(m) === cfg.key);

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
