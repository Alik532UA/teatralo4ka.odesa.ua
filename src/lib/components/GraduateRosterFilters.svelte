<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Check } from 'lucide-svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import FilterDropdown from '$lib/components/ui/FilterDropdown.svelte';
	import type { SelectOption } from '$lib/components/ui/select';
	import { getMasterById } from '$lib/data/masters';
	import type { Department } from '$lib/data/graduates';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';

	interface Props {
		departments: readonly Department[];
		/** Обрані майстри курсу — за `id`, порожньо означає «усі». */
		masters: readonly string[];
		/**
		 * Майстри, у яких є хоч один випускник, від найбільшого до найменшого.
		 * Рахує їх `courseMasterCounts` — тут лише показуємо.
		 */
		masterOptions: readonly { id: string; count: number }[];
		photo: 'all' | 'with' | 'without';
		ondepartmentschange: (value: Department[]) => void;
		onmasterschange: (value: string[]) => void;
		onphotochange: (value: 'all' | 'with' | 'without') => void;
	}

	let {
		departments = [],
		masters = [],
		masterOptions = [],
		photo = 'all',
		ondepartmentschange,
		onmasterschange,
		onphotochange
	}: Props = $props();

	const allDeptKeys: Department[] = ['theatre', 'intensive', 'music', 'vocal', 'piano', 'guitar', 'art'];


	function toggleDepartment(key: Department) {
		if (departments.includes(key)) {
			ondepartmentschange(departments.filter((d) => d !== key));
		} else {
			ondepartmentschange([...departments, key]);
		}
	}

	function toggleAllDepartments() {
		ondepartmentschange([]);
	}

	const isAllSelected = $derived(
		departments.length === 0 || allDeptKeys.every((k) => departments.includes(k))
	);

	const deptLabel = $derived.by(() => {
		if (isAllSelected) {
			return $t('galaxy.filterAllDepts', { default: 'Усі відділення' });
		}
		if (departments.length === 1) {
			return $t(`galaxy.departments.${departments[0]}`, { default: departments[0] });
		}
		if (departments.length === 2 && departments.includes('theatre') && departments.includes('intensive')) {
			return $t('galaxy.departments.theatre');
		}
		return `${$t('galaxy.filterAllDepts', { default: 'Відділення' })} (${departments.length})`;
	});

	/*
	 * Другий випадайний список — за тим самим прикладом, що відділення:
	 * та сама кнопка, та сама підкладка, ті самі чекбокси. Різниця лише в
	 * тому, що варіанти не вписані руками, а приходять із даних: майстрів
	 * курсів двадцять сім, і перелічувати їх у розмітці означало б правити
	 * її щоразу, коли з'явиться новий.
	 */

	function toggleMaster(id: string) {
		if (masters.includes(id)) {
			onmasterschange(masters.filter((m) => m !== id));
		} else {
			onmasterschange([...masters, id]);
		}
	}

	/** Ім'я з РЕЄСТРУ: у зв'язку лежить самий `id`. */
	function masterName(id: string): string {
		return getMasterById(id)?.displayName ?? id;
	}

	const masterLabel = $derived.by(() => {
		if (masters.length === 0) {
			return $t('galaxy.filterAllMasters', { default: 'Усі майстри курсів' });
		}
		if (masters.length === 1) return masterName(masters[0]);
		return `${$t('galaxy.filterMastersShort', { default: 'Майстри' })} (${masters.length})`;
	});

	const photoOptions = $derived<SelectOption[]>([
		{ value: 'all', label: $t('galaxy.filterAllProfiles', { default: 'Усі випускники' }) },
		{ value: 'with', label: $t('galaxy.filterWithProfile', { default: 'З анкетою' }) },
		{ value: 'without', label: $t('galaxy.filterWithoutProfile', { default: 'Без анкети' }) }
	]);
</script>

<div class="filters" data-testid="galaxy-roster-filters-container">
	<FilterDropdown label={masterLabel} testIdPrefix="galaxy-roster-master">
		{#snippet options()}
				<button
					type="button"
					class="filter-option filter-option--main"
					class:selected={masters.length === 0}
					onclick={() => onmasterschange([])}
					data-testid="galaxy-roster-master-opt-all-btn"
				>
					<span class="filter-checkbox" class:checked={masters.length === 0}>
						{#if masters.length === 0}
							<Check size={12} strokeWidth={3} />
						{/if}
					</span>
					<span class="filter-option__text"
						>{$t('galaxy.filterAllMasters', { default: 'Усі майстри курсів' })}</span
					>
				</button>

				<div class="filter-divider" role="separator"></div>

				{#each masterOptions as option (option.id)}
					<button
						type="button"
						class="filter-option filter-option--main"
						class:selected={masters.includes(option.id)}
						onclick={() => toggleMaster(option.id)}
						data-testid="galaxy-roster-master-opt-{option.id}-btn"
					>
						<span class="filter-checkbox" class:checked={masters.includes(option.id)}>
							{#if masters.includes(option.id)}
								<Check size={12} strokeWidth={3} />
							{/if}
						</span>
						<span class="filter-option__text filter-option__text--main">{masterName(option.id)}</span>
						<!-- Скільком людям він майстер: без числа вибір із двадцяти семи
						     імен нічого не підказує про те, що за ним стоїть. -->
						<span class="filter-option__count">{option.count}</span>
					</button>
				{/each}
		{/snippet}
	</FilterDropdown>

	<FilterDropdown label={deptLabel} testIdPrefix="galaxy-roster-dept">
		{#snippet options()}
				<!-- 0. Усі відділення -->
				<button
					type="button"
					class="filter-option filter-option--main"
					class:selected={isAllSelected}
					onclick={toggleAllDepartments}
					data-testid="galaxy-roster-dept-opt-all-btn"
				>
					<span class="filter-checkbox" class:checked={isAllSelected}>
						{#if isAllSelected}
							<Check size={12} strokeWidth={3} />
						{/if}
					</span>
					<span class="filter-option__text">{$t('galaxy.filterAllDepts', { default: 'Усі відділення' })}</span>
				</button>

				<div class="filter-divider" role="separator"></div>

				<!-- 1. Театральне відділення -->
				<div class="filter-group">
					<button
						type="button"
						class="filter-option filter-option--main"
						class:selected={departments.includes('theatre')}
						onclick={() => toggleDepartment('theatre')}
						data-testid="galaxy-roster-dept-opt-theatre-btn"
					>
						<span class="filter-checkbox" class:checked={departments.includes('theatre')}>
							{#if departments.includes('theatre')}
								<Check size={12} strokeWidth={3} />
							{/if}
						</span>
						<DepartmentIcon department="theatre" size={16} class="filter-option__icon" />
						<span class="filter-option__text filter-option__text--main">{$t('galaxy.departments.theatre')}</span>
					</button>

					<!-- Напрямок: Інтенсивний курс -->
					<button
						type="button"
						class="filter-option filter-option--sub"
						class:selected={departments.includes('intensive')}
						onclick={() => toggleDepartment('intensive')}
						data-testid="galaxy-roster-dept-opt-intensive-btn"
					>
						<span class="filter-checkbox" class:checked={departments.includes('intensive')}>
							{#if departments.includes('intensive')}
								<Check size={12} strokeWidth={3} />
							{/if}
						</span>
						<DepartmentIcon department="intensive" size={14} class="filter-option__icon" />
						<span class="filter-option__text">{$t('galaxy.departments.intensive')}</span>
					</button>
				</div>

				<div class="filter-divider" role="separator"></div>

				<!-- 2. Музичне відділення -->
				<div class="filter-group">
					<button
						type="button"
						class="filter-option filter-option--main"
						class:selected={departments.includes('music')}
						onclick={() => toggleDepartment('music')}
						data-testid="galaxy-roster-dept-opt-music-btn"
					>
						<span class="filter-checkbox" class:checked={departments.includes('music')}>
							{#if departments.includes('music')}
								<Check size={12} strokeWidth={3} />
							{/if}
						</span>
						<DepartmentIcon department="music" size={16} class="filter-option__icon" />
						<span class="filter-option__text filter-option__text--main">{$t('galaxy.departments.music')}</span>
					</button>

					<!-- Напрямок: Відділення сольного співу -->
					<button
						type="button"
						class="filter-option filter-option--sub"
						class:selected={departments.includes('vocal')}
						onclick={() => toggleDepartment('vocal')}
						data-testid="galaxy-roster-dept-opt-vocal-btn"
					>
						<span class="filter-checkbox" class:checked={departments.includes('vocal')}>
							{#if departments.includes('vocal')}
								<Check size={12} strokeWidth={3} />
							{/if}
						</span>
						<DepartmentIcon department="vocal" size={14} class="filter-option__icon" />
						<span class="filter-option__text">{$t('galaxy.departments.vocal')}</span>
					</button>

					<!-- Інструментальний напрямок -->
					<div class="filter-subgroup-label">
						<span class="filter-subgroup-title">{$t('galaxy.departments.instrumental', { default: 'Інструментальне відділення' })}</span>
					</div>

					<!-- Фортепіано -->
					<button
						type="button"
						class="filter-option filter-option--nested"
						class:selected={departments.includes('piano')}
						onclick={() => toggleDepartment('piano')}
						data-testid="galaxy-roster-dept-opt-piano-btn"
					>
						<span class="filter-checkbox" class:checked={departments.includes('piano')}>
							{#if departments.includes('piano')}
								<Check size={12} strokeWidth={3} />
							{/if}
						</span>
						<DepartmentIcon department="piano" size={14} class="filter-option__icon" />
						<span class="filter-option__text">{$t('galaxy.departments.piano')}</span>
					</button>

					<!-- Гітара -->
					<button
						type="button"
						class="filter-option filter-option--nested"
						class:selected={departments.includes('guitar')}
						onclick={() => toggleDepartment('guitar')}
						data-testid="galaxy-roster-dept-opt-guitar-btn"
					>
						<span class="filter-checkbox" class:checked={departments.includes('guitar')}>
							{#if departments.includes('guitar')}
								<Check size={12} strokeWidth={3} />
							{/if}
						</span>
						<DepartmentIcon department="guitar" size={14} class="filter-option__icon" />
						<span class="filter-option__text">{$t('galaxy.departments.guitar')}</span>
					</button>
				</div>

				<div class="filter-divider" role="separator"></div>

				<!-- 3. Художнє відділення -->
				<button
					type="button"
					class="filter-option filter-option--main"
					class:selected={departments.includes('art')}
					onclick={() => toggleDepartment('art')}
					data-testid="galaxy-roster-dept-opt-art-btn"
				>
					<span class="filter-checkbox" class:checked={departments.includes('art')}>
						{#if departments.includes('art')}
							<Check size={12} strokeWidth={3} />
						{/if}
					</span>
					<DepartmentIcon department="art" size={16} class="filter-option__icon" />
					<span class="filter-option__text filter-option__text--main">{$t('galaxy.departments.art')}</span>
				</button>
		{/snippet}
	</FilterDropdown>

	<Select
		value={photo}
		options={photoOptions}
		testId="galaxy-roster-photo-filter"
		ariaLabel={$t('galaxy.filterAllProfiles', { default: 'Анкета' })}
		onchange={(val) => onphotochange(val as 'all' | 'with' | 'without')}
		class="roster-filter-select"
	/>
</div>

<style>
	.filters {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-shrink: 0;
	}









	/* Число праворуч, приглушене: воно підказка, а не сама назва. */
	.filter-option__count {
		margin-left: auto;
		padding-left: 0.5rem;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}

	.filter-divider {
		height: 1px;
		margin: 0.2rem 0.4rem;
		background: rgba(255, 255, 255, 0.1);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.filter-subgroup-label {
		display: flex;
		align-items: center;
		padding: 0.25rem 0.75rem 0.15rem 2rem;
	}

	.filter-subgroup-title {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: rgba(168, 191, 224, 0.65);
	}

	.filter-option {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.45rem 0.75rem;
		border: none;
		border-radius: 10px;
		background: none;
		color: #eaf2ff;
		font-family: inherit;
		font-size: 0.86rem;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.filter-option--main {
		font-weight: 600;
	}

	.filter-option--sub {
		padding-left: 1.65rem;
		font-size: 0.83rem;
		color: #d0e0f8;
	}

	.filter-option--nested {
		padding-left: 2.35rem;
		font-size: 0.83rem;
		color: #d0e0f8;
	}

	.filter-option:hover {
		background: rgba(140, 190, 255, 0.1);
	}

	.filter-option.selected {
		background: rgba(140, 190, 255, 0.15);
		color: #ffffff;
	}

	.filter-checkbox {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: 1.5px solid rgba(255, 255, 255, 0.35);
		border-radius: 5px;
		background: rgba(255, 255, 255, 0.05);
		color: #ffffff;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.filter-checkbox.checked {
		background: var(--accent-primary, #00b4d8);
		border-color: var(--accent-primary, #00b4d8);
	}

	:global(.filter-option__icon) {
		opacity: 0.85;
		color: #a8bfe0;
		flex-shrink: 0;
	}

	.filter-option__text {
		flex: 1;
		white-space: nowrap;
	}

	.filter-option__text--main {
		font-weight: 600;
	}

	:global(.roster-filter-select) {
		border-radius: 999px !important;
		min-height: 44px;
		background: rgb(255 255 255 / 0.06) !important;
		border: 1px solid rgb(255 255 255 / 0.18) !important;
		color: var(--galaxy-text, #eaf2ff) !important;
		font-size: 0.86rem;
		padding: 0 0.85rem !important;
		transition: border-color 0.2s ease, background 0.2s ease;
	}

	:global(.roster-filter-select:hover),
	:global(.roster-filter-select:focus-visible) {
		border-color: rgb(140 190 255 / 0.6) !important;
		background: rgb(255 255 255 / 0.12) !important;
	}

	@media (max-width: 900px) {
		/*
		 * `flex-shrink: 0` тут тримався на тому, що поруч було вдосталь місця.
		 * У згорнутій панелі телефона його немає: два списки природною шириною
		 * дають 310px на 280 доступних, і другий виходив за правий край аркуша.
		 * Тепер вони діляться порівну, а довгий підпис усередині обрізається —
		 * `.filter-trigger__label` це вже вміє.
		 */
		.filters {
			flex-wrap: wrap;
			flex-shrink: 1;
			width: 100%;
		}
	}
</style>
