<script lang="ts">
	import { t } from "svelte-i18n";
	import { X, RotateCcw } from "lucide-svelte";
	import type { Department } from "$lib/data/graduates";
	import DepartmentIcon from "./icons/DepartmentIcon.svelte";

	interface Props {
		hasActiveFilters: boolean;
		year: number | "all";
		photo: "all" | "with" | "without";
		departments: readonly Department[];
		query: string;
		onyearchange: (year: number | "all") => void;
		onphotochange: (photo: "all" | "with" | "without") => void;
		ondepartmentschange: (departments: Department[]) => void;
		onquerychange: (query: string) => void;
		onreset: () => void;
	}

	let {
		hasActiveFilters,
		year,
		photo,
		departments,
		query,
		onyearchange,
		onphotochange,
		ondepartmentschange,
		onquerychange,
		onreset,
	}: Props = $props();
</script>

<div class="empty-state" data-testid="galaxy-roster-empty-container">
	<p class="empty-state__message" data-testid="galaxy-roster-empty-message">
		{hasActiveFilters
			? $t("galaxy.nothingFoundByFilters")
			: $t("galaxy.nothingFound")}
	</p>

	{#if hasActiveFilters}
		<div
			class="empty-state__chips"
			data-testid="galaxy-roster-empty-filters-toolbar"
		>
			{#if year !== "all"}
				<button
					type="button"
					class="filter-chip"
					onclick={() => onyearchange("all")}
					aria-label="{$t('galaxy.removeFilter')}: {year}"
					data-testid="galaxy-roster-empty-filter-year-btn"
				>
					<span>{year}</span>
					<X size={13} strokeWidth={2.5} aria-hidden="true" />
				</button>
			{/if}

			{#if photo !== "all"}
				<button
					type="button"
					class="filter-chip"
					onclick={() => onphotochange("all")}
					aria-label="{$t('galaxy.removeFilter')}: {photo === 'with'
						? $t('galaxy.filterWithProfile')
						: $t('galaxy.filterWithoutProfile')}"
					data-testid="galaxy-roster-empty-filter-photo-btn"
				>
					<span>
						{photo === "with"
							? $t("galaxy.filterWithProfile")
							: $t("galaxy.filterWithoutProfile")}
					</span>
					<X size={13} strokeWidth={2.5} aria-hidden="true" />
				</button>
			{/if}

			{#each departments as dept (dept)}
				<button
					type="button"
					class="filter-chip"
					onclick={() =>
						ondepartmentschange(departments.filter((d) => d !== dept))}
					aria-label="{$t('galaxy.removeFilter')}: {$t(
						'galaxy.departments.' + dept,
					)}"
					data-testid="galaxy-roster-empty-filter-dept-{dept}-btn"
				>
					<DepartmentIcon department={dept} size={14} />
					<span>{$t("galaxy.departments." + dept)}</span>
					<X size={13} strokeWidth={2.5} aria-hidden="true" />
				</button>
			{/each}

			{#if query.trim().length > 0}
				<button
					type="button"
					class="filter-chip"
					onclick={() => onquerychange("")}
					aria-label="{$t('galaxy.removeFilter')}: {query.trim()}"
					data-testid="galaxy-roster-empty-filter-query-btn"
				>
					<span>«{query.trim()}»</span>
					<X size={13} strokeWidth={2.5} aria-hidden="true" />
				</button>
			{/if}
		</div>

		<button
			type="button"
			class="empty-state__reset-btn"
			onclick={onreset}
			data-testid="galaxy-roster-empty-reset-btn"
		>
			<RotateCcw size={14} strokeWidth={2.2} aria-hidden="true" />
			<span>{$t("galaxy.resetFilters")}</span>
		</button>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1 1 auto;
		min-width: 0;
		min-height: 240px;
		padding: 2.5rem 1.5rem;
		text-align: center;
		gap: 1.25rem;
	}

	.empty-state__message {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 500;
		color: #ffffff;
		opacity: 0.85;
	}

	.empty-state__chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		max-width: 540px;
	}

	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 34px;
		padding: 0 0.85rem;
		border: 1px solid rgba(140, 190, 255, 0.35);
		border-radius: 999px;
		background: rgba(140, 190, 255, 0.12);
		color: #eaf2ff;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease,
			transform 0.15s ease;
	}

	.filter-chip:hover {
		background: rgba(239, 68, 68, 0.18);
		border-color: rgba(239, 68, 68, 0.5);
		color: #fca5a5;
		transform: translateY(-1px);
	}

	.filter-chip :global(svg) {
		flex-shrink: 0;
		opacity: 0.8;
		transition: opacity 0.15s ease;
	}

	.filter-chip:hover :global(svg) {
		opacity: 1;
	}

	.empty-state__reset-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 40px;
		padding: 0 1.2rem;
		border: 1px solid rgba(255, 255, 255, 0.22);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
		font-family: inherit;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.empty-state__reset-btn:hover {
		background: rgba(140, 190, 255, 0.2);
		border-color: rgba(140, 190, 255, 0.6);
		transform: translateY(-1px);
	}
</style>
