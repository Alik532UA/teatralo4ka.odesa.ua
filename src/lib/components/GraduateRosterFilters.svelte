<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Check, ChevronDown } from 'lucide-svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { SelectOption } from '$lib/components/ui/select';
	import { placePanel } from '$lib/utils/dropdownPlace';
	import type { Department } from '$lib/data/graduates';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';

	interface Props {
		departments: readonly Department[];
		photo: 'all' | 'with' | 'without';
		ondepartmentschange: (value: Department[]) => void;
		onphotochange: (value: 'all' | 'with' | 'without') => void;
	}

	let {
		departments = [],
		photo = 'all',
		ondepartmentschange,
		onphotochange
	}: Props = $props();

	const allDeptKeys: Department[] = ['theatre', 'intensive', 'music', 'vocal', 'piano', 'guitar', 'art'];

	let deptOpen = $state(false);
	let deptTrigger = $state<HTMLButtonElement | null>(null);
	let deptPos = $state({ left: 0, top: 0, minWidth: 0, maxWidth: 0, maxHeight: 420, above: false });
	let deptOffset = $state({ x: 0, y: 0 });

	function getContainingBlockOffset(el: HTMLElement): { x: number; y: number } {
		if (typeof window === 'undefined') return { x: 0, y: 0 };
		let curr = el.parentElement;
		while (curr && curr !== document.body && curr !== document.documentElement) {
			const style = window.getComputedStyle(curr);
			if (
				style.transform !== 'none' ||
				style.translate !== 'none' ||
				style.rotate !== 'none' ||
				style.scale !== 'none' ||
				style.filter !== 'none' ||
				style.perspective !== 'none' ||
				(style.contain && (style.contain.includes('paint') || style.contain.includes('layout')))
			) {
				const rect = curr.getBoundingClientRect();
				return { x: rect.left, y: rect.top };
			}
			curr = curr.parentElement;
		}
		return { x: 0, y: 0 };
	}

	function placeDeptPanel() {
		if (!deptTrigger) return;
		deptOffset = getContainingBlockOffset(deptTrigger);
		const raw = placePanel(deptTrigger.getBoundingClientRect(), {
			width: window.innerWidth,
			height: window.innerHeight
		});
		deptPos = {
			...raw,
			left: raw.left - deptOffset.x,
			top: raw.top - deptOffset.y
		};
	}

	function toggleDeptPanel() {
		if (deptOpen) {
			deptOpen = false;
		} else {
			placeDeptPanel();
			deptOpen = true;
		}
	}

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

	const photoOptions = $derived<SelectOption[]>([
		{ value: 'all', label: $t('galaxy.filterAllProfiles', { default: 'Усі випускники' }) },
		{ value: 'with', label: $t('galaxy.filterWithProfile', { default: 'З анкетою' }) },
		{ value: 'without', label: $t('galaxy.filterWithoutProfile', { default: 'Без анкети' }) }
	]);
</script>

<div class="filters" data-testid="galaxy-roster-filters-container">
	<div class="multi-select">
		<button
			type="button"
			class="filter-trigger"
			class:open={deptOpen}
			bind:this={deptTrigger}
			onclick={toggleDeptPanel}
			aria-expanded={deptOpen}
			aria-haspopup="listbox"
			data-testid="galaxy-roster-dept-filter-btn"
		>
			<span class="filter-trigger__label">{deptLabel}</span>
			<ChevronDown
				size={14}
				strokeWidth={2.5}
				class="filter-trigger__chevron {deptOpen ? 'open' : ''}"
				aria-hidden="true"
			/>
		</button>

		{#if deptOpen}
			<div
				class="filter-backdrop"
				role="presentation"
				style={deptOffset.x !== 0 || deptOffset.y !== 0
					? `left: -${deptOffset.x}px; top: -${deptOffset.y}px; width: 100vw; height: 100vh;`
					: ''}
				onpointerdown={() => (deptOpen = false)}
				oncontextmenu={(e) => {
					e.preventDefault();
					deptOpen = false;
				}}
			></div>

			<div
				class="filter-panel"
				style="left: {deptPos.left}px; top: {deptPos.top}px; min-width: {deptPos.minWidth}px; max-width: {deptPos.maxWidth}px; max-height: {deptPos.maxHeight}px;"
				role="listbox"
				aria-multiselectable="true"
				data-testid="galaxy-roster-dept-dropdown-menu"
			>
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
			</div>
		{/if}
	</div>

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

	.multi-select {
		position: relative;
		display: inline-flex;
	}

	.filter-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 0.85rem;
		border: 1px solid rgb(255 255 255 / 0.18);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.06);
		color: var(--galaxy-text, #eaf2ff);
		font-family: inherit;
		font-size: 0.86rem;
		font-weight: 600;
		cursor: pointer;
		outline: none;
		transition: border-color 0.2s ease, background 0.2s ease;
	}

	.filter-trigger:hover,
	.filter-trigger:focus-visible,
	.filter-trigger.open {
		border-color: rgb(140 190 255 / 0.6);
		background: rgb(255 255 255 / 0.12);
	}

	.filter-trigger__label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.filter-trigger__chevron) {
		flex-shrink: 0;
		opacity: 0.8;
		transition: transform 0.2s ease;
	}

	:global(.filter-trigger__chevron.open) {
		transform: rotate(180deg);
	}

	.filter-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9400;
	}

	.filter-panel {
		position: fixed;
		z-index: 9401;
		width: max-content;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.4rem;
		overflow-y: auto;
		border-radius: 16px;
		background: #0b1330;
		border: 1px solid rgba(255, 255, 255, 0.18);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
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
		.filters {
			flex-wrap: wrap;
		}
	}
</style>
