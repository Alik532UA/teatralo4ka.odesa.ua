<script lang="ts">
	import { Paperclip } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	/**
	 * Рядок переліку контенту — оболонка, спільна для ОБОХ джерел.
	 *
	 * ## Чому оболонка окремо, а дії — знімками
	 *
	 * Стаття з бази й новина з коду виглядають однаково (знімок, плашка, дата,
	 * назва, анотація) і РОБЛЯТЬ різне: у статті — правка, видалення й публікація
	 * двома мовами; у новини з коду — приховати, замінити копією, відкрити на
	 * сайті. Якби рядок робився двома копіями розмітки, вони роз'їхалися б на
	 * першій же зміні оформлення, і помітити це можна було б лише оком.
	 *
	 * Тому спільне — тут, різне — у знімках `status` і `actions`, які пише
	 * сторінка. Стилі того, що написано на сторінці, лишаються НА СТОРІНЦІ: у
	 * Svelte область стилю визначає місце, де елемент написаний, а не де його
	 * показано.
	 *
	 * ## Прапорець вибору
	 *
	 * З'явився заради одного: «я хочу виділити всі і зняти чекбокси з тимчасових
	 * новин», а далі — зберегти вибране одним файлом. Тому він саме тут, у
	 * найлівішій колонці рядка, а не в окремому режимі: відбір іде під час
	 * звичайного перегляду переліку, з увімкненими фільтрами.
	 */

	interface Props {
		coverUrl?: string;
		badgeLabel: string;
		badgeClass: string;
		category?: string;
		date: string;
		title: string;
		excerpt?: string;
		/**
		 * Ключ рядка. Сам `data-testid` збирається ТУТ, і саме тому сюди їде
		 * ключ, а не готовий префікс: у зібраному з двох шматків рядку гейт
		 * `testid-conventions` не бачить канонічного типу «row» — він бачить
		 * лише те, що написано в розмітці.
		 */
		rowKey: string;
		/** Прапорця немає зовсім, коли рядок не можна відібрати (новина з коду). */
		selectable?: boolean;
		selected?: boolean;
		selectLabel?: string;
		/**
		 * Стан прапорця приходить ЗВЕРХУ, а не живе тут.
		 *
		 * Відібране сторінка тримає одним набором — інакше «виділити всі» довелося б
		 * розсилати по рядках, а зняти виділення після збереження стало б нічим.
		 */
		onSelect?: (вибрано: boolean) => void;
		status?: Snippet;
		actions?: Snippet;
	}

	let {
		coverUrl = '',
		badgeLabel,
		badgeClass,
		category = '',
		date,
		title,
		excerpt = '',
		rowKey,
		selectable = false,
		selected = false,
		selectLabel = '',
		onSelect,
		status,
		actions
	}: Props = $props();
</script>

<div class="cl-card" data-testid={`admin-content-row-${rowKey}-container`}>
	{#if selectable}
		<label class="cl-pick">
			<input
				type="checkbox"
				checked={selected}
				onchange={(e) => onSelect?.(e.currentTarget.checked)}
				aria-label={selectLabel}
				data-testid={`admin-content-row-${rowKey}-checkbox`}
			/>
		</label>
	{/if}

	<div class="cl-thumb" class:cl-thumb-empty={!coverUrl}>
		{#if coverUrl}
			<img src={coverUrl} alt="" loading="lazy" />
		{:else}
			<Paperclip size={24} opacity={0.3} />
		{/if}
	</div>

	<div class="cl-info">
		<div class="cl-info-top">
			<span class="cl-type-badge {badgeClass}">{badgeLabel}</span>
			{#if category}
				<span class="cl-category" data-testid={`admin-content-row-${rowKey}-category`}>{category}</span>
			{/if}
			<span class="cl-date" data-testid={`admin-content-row-${rowKey}-date`}>{date}</span>
		</div>
		<h3 class="cl-item-title" data-testid={`admin-content-row-${rowKey}-title`}>{title}</h3>
		{#if excerpt}<p class="cl-excerpt">{excerpt}</p>{/if}
	</div>

	{@render status?.()}
	{@render actions?.()}
</div>

<style>
.cl-card {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	background: var(--bg-card);
	border: 1px solid var(--color-border);
	border-radius: 24px;
	padding: 1.25rem;
	transition: all 0.2s;
}
.cl-card:hover {
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
	border-color: var(--accent-primary-light, #3aacce);
}

/* Прапорець вибору */
.cl-pick {
	display: flex;
	align-items: center;
	justify-content: center;
	/* Ціль дотику 44×44 (WCAG 2.2 SC 2.5.8): сам квадратик менший, тож
	   розмір дає підпис навколо нього. */
	min-width: 44px;
	min-height: 44px;
	margin: -0.5rem 0 -0.5rem -0.5rem;
	cursor: pointer;
}
.cl-pick input {
	width: 20px;
	height: 20px;
	accent-color: var(--accent-primary);
	cursor: pointer;
}

/* Знімок */
.cl-thumb {
	width: 84px;
	height: 84px;
	border-radius: 16px;
	overflow: hidden;
	flex-shrink: 0;
	background: var(--color-border);
}
.cl-thumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.cl-thumb-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--bg-surface);
	color: var(--color-muted-text);
}

/* Опис */
.cl-info {
	flex: 1;
	min-width: 0;
}
.cl-info-top {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.5rem;
	flex-wrap: wrap;
}
.cl-type-badge {
	font-size: 0.68rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	padding: 3px 10px;
	border-radius: 20px;
}
.cl-type-article {
	background: rgba(59, 130, 246, 0.1);
	color: #2563eb;
}
.cl-type-page {
	background: rgba(16, 185, 129, 0.1);
	color: #059669;
}
.cl-type-project {
	background: rgba(168, 85, 247, 0.1);
	color: #7c3aed;
}
.cl-type-code {
	background: rgba(245, 158, 11, 0.12);
	color: #b45309;
}
:global(.dark-theme) .cl-type-article {
	background: rgba(96, 165, 250, 0.15);
	color: #93bbfd;
}
:global(.dark-theme) .cl-type-page {
	background: rgba(52, 211, 153, 0.15);
	color: #6ee7b7;
}
:global(.dark-theme) .cl-type-project {
	background: rgba(192, 132, 252, 0.15);
	color: #c4b5fd;
}
:global(.dark-theme) .cl-type-code {
	background: rgba(251, 191, 36, 0.18);
	color: #fcd34d;
}
.cl-category {
	font-size: 0.7rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--accent-primary);
	background: rgba(33, 150, 186, 0.08);
	padding: 3px 12px;
	border-radius: 20px;
}
.cl-date {
	font-size: 0.8rem;
	font-weight: 600;
	color: var(--color-muted-text);
	opacity: 0.8;
}
.cl-item-title {
	font-size: 1.15rem;
	font-weight: 700;
	color: var(--color-dark-text);
	margin: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.3;
}
.cl-excerpt {
	font-size: 0.88rem;
	line-height: 1.5;
	opacity: 0.5;
	margin-top: 0.4rem;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

@media (max-width: 640px) {
	/*
	 * Ділянки `status` і `actions` заповнює розмітка СТОРІНКИ, і правила для неї
	 * лишилися там: область стилю в Svelte — це місце, де елемент написаний.
	 */
	.cl-card {
		display: grid;
		grid-template-columns: 60px 1fr;
		grid-template-areas:
			"thumb info"
			"thumb status"
			"actions actions";
		gap: 0.75rem;
		padding: 1rem;
		align-items: start;
	}
	.cl-card:has(.cl-pick) {
		grid-template-columns: 32px 60px 1fr;
		grid-template-areas:
			"pick thumb info"
			"pick thumb status"
			"actions actions actions";
	}
	.cl-pick { grid-area: pick; min-width: 32px; margin: 0; }
	.cl-thumb { width: 60px; height: 60px; border-radius: 12px; grid-area: thumb; }
	.cl-info { grid-area: info; min-width: 0; }
	.cl-item-title { font-size: 1rem; white-space: normal; }
	.cl-excerpt { display: none; }
	.cl-info-top { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
}
</style>
