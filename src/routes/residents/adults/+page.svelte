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
		// Останній навмисно: розділ технічний — про те, чого ми ще не знаємо, а не
		// про людей, і не мусить відтісняти змістові розділи вгору.
		{
			key: 'needsClarification',
			icon: '❓',
			title: 'Потребують уточнення',
			subtitle: 'Записи з нез’ясованою роллю та ті, що чекають на підтвердження'
		}
	];

	/*
	 * Фіксований порядок керівництва: директорка, заступниця, далі бухгалтерія.
	 *
	 * `liliia-velychko` прибрана 2026-08-24: вона переїхала в «Історію школи», і
	 * запис тут лишався мертвим — `indexOf` віддавав −1, тобто рядок нічого не
	 * робив.
	 * Так само 2026-08-27 прибрана `liubov-frankovska`: вона переїхала в той
	 * самий розділ, а роль лишилася адміністрацією — тобто перевірка «рядок
	 * мертвий, якщо категорія інша» його б не спіймала. Умову гейта тому
	 * переписано на РОЗДІЛ (`masterSection`), а не на поле `category`. Тоді ж троє завідувачок (`svitlana-ryskina`, `vira-koval`,
	 * `hanna-nikolaieva`) поїхали у власний розділ `heads`, тож із цього переліку
	 * вони прибрані: залишений тут запис так само нічого не робив би, бо
	 * сортування бачить лише записи свого розділу.
	 */
	const ADMIN_ORDER = ['olena-tkach', 'oksana-panchenko', 'natalia-shalashna', 'tetiana-korenchuk', 'sofiia-tkach'];

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

	/*
	 * Порядок у розділі: спершу кількість учнів, далі фотографія, далі абетка.
	 *
	 * Кількість учнів — `graduatesCount`, якого в `masters.index.json` немає ні в
	 * кого: його додає `+page.ts` із `getGraduatesByMaster`. Порівняння ЖИВЕ —
	 * заміряно 2026-08-24: учні є у 26 зі 118 майстрів, від 1 до 37 (Риськіна 37,
	 * Ісачкіна 27, Ткач Ф. 16). Двоє наступних порівнянь розсуджують решту, у кого
	 * нуль. «З фотографією вперед» — косметика, і єдина: 42 записи без знімка
	 * розкидані тепер по всіх розділах (правило «без фото — у технічний» прибрано
	 * 2026-08-24), тож у голові кожного розділу стоятимуть ті, кого видно. Абетка
	 * розсуджує тих, у кого й учнів, і фотографій однаково.
	 */
	function byStudentsThenPhotoThenName(a: (typeof allMasters)[number], b: (typeof allMasters)[number]) {
		const countA = a.graduatesCount ?? 0;
		const countB = b.graduatesCount ?? 0;
		if (countB !== countA) return countB - countA;
		const photoA = a.photo ? 0 : 1;
		const photoB = b.photo ? 0 : 1;
		if (photoA !== photoB) return photoA - photoB;
		return a.fullName.localeCompare(b.fullName, 'uk');
	}

	/*
	 * Фіксований порядок — ЛИШЕ в керівництві, решта розділів рахує учнів.
	 *
	 * До 2026-08-24 фіксованими були ще два: завідувачі (театральне → художнє →
	 * музичне) і служба турботи (Стоянова першою). Обидва прибрано на прохання
	 * автора: у керівництві порядок — це службова ієрархія, яку нізвідки не
	 * вивести, а в решті розділів місце людини задає її внесок, і ручний перелік
	 * лише перекривав би його, старіючи з кожною правкою даних випускників.
	 */
	function sortCategoryItems(category: MasterSection, items: typeof allMasters) {
		if (category === 'administration') return byFixedOrder(ADMIN_ORDER, items);
		return [...items].sort(byStudentsThenPhotoThenName);
	}

	const groups = $derived(
		categoryConfigs
			.map((cfg) => {
				/*
				 * Один виклик замість чотирьох умов: розділ ОБЧИСЛЮЄТЬСЯ зі
				 * статусу, ролі та явного винятку (`masterSection`, там же заміри
				 * й причини). Доти тут стояла драбинка з `category` і резервів за
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
