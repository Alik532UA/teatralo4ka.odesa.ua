<script lang="ts">
	import { Download } from 'lucide-svelte';
	import { t } from 'svelte-i18n';

	/**
	 * Смуга відбору: скільки позначено, «виділити всі» і збереження одним файлом.
	 *
	 * ## Навіщо саме так
	 *
	 * Автор описав робочий хід дослівно: «коли мені треба терміново опублікувати
	 * новину, то я це роблю через адмінку… а потім коли у мене накопилися новини,
	 * то я виділяю новини які є в firebase і зберігаю на комп'ютер, і віддаю AI
	 * агенту щоб він зробив ці новини в коді». І окремо про те, чому не можна
	 * робити це автоматично: «у мене є 50 новин в firebase, а з них 2 я не хочу
	 * переносити в код, бо вони тимчасові… я хочу виділити всі і зняти чекбокси з
	 * тимчасових новин».
	 *
	 * Звідси й дві кнопки саме в такому порядку: спершу взяти все, потім зняти
	 * зайве прапорцями в самих рядках.
	 *
	 * ## Чому окремий компонент
	 *
	 * Сторінка `/admin/content` стоїть на своїй стелі розміру, а смуга —
	 * самодостатня: власна розмітка, власні стилі, жодного зв'язку з рештою
	 * переліку, крім двох чисел і двох дій.
	 */

	interface Props {
		/** Скільки статей позначено — рахує сторінка, бо набір живе там. */
		selectedCount: number;
		/** Чи позначено все ВИДИМЕ: підпис кнопки перемикається саме за цим. */
		allSelected: boolean;
		onToggleAll: () => void;
		onExport: () => void;
	}

	let { selectedCount, allSelected, onToggleAll, onExport }: Props = $props();
</script>

<div class="cl-bulk" data-testid="admin-content-bulk-toolbar">
	<span class="cl-bulk-count" data-testid="admin-content-selected-count">
		{$t('admin.content.selected', { values: { count: selectedCount } })}
	</span>
	<button class="cl-bulk-btn" onclick={onToggleAll} data-testid="admin-content-select-all-btn">
		{allSelected ? $t('admin.content.selectNone') : $t('admin.content.selectAll')}
	</button>
	<button
		class="btn btn-primary cl-bulk-save"
		onclick={onExport}
		disabled={selectedCount === 0}
		data-testid="admin-content-export-btn"
	>
		<Download size={16} aria-hidden="true" />
		{$t('admin.content.exportSelected')}
	</button>
	<span class="cl-bulk-note">{$t('admin.content.exportNote')}</span>
</div>

<style>
.cl-bulk {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
	margin-bottom: 1rem;
	padding: 0.75rem 1rem;
	border: 1px dashed var(--color-border);
	border-radius: 16px;
	background: var(--bg-surface);
}
.cl-bulk-count {
	font-weight: 800;
	font-size: 0.85rem;
}
.cl-bulk-note {
	font-size: 0.78rem;
	opacity: 0.6;
	flex: 1 1 14rem;
	min-width: 0;
}
.cl-bulk-btn {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	/* Ціль дотику 44×44 — WCAG 2.2 SC 2.5.8. */
	min-height: 44px;
	padding: 0.5rem 0.9rem;
	border: 1px solid var(--color-border);
	border-radius: 12px;
	background: var(--bg-card);
	color: inherit;
	font-weight: 700;
	font-size: 0.85rem;
	cursor: pointer;
}
.cl-bulk-btn:hover:not(:disabled) {
	border-color: var(--accent-primary);
	color: var(--accent-primary);
}
.cl-bulk-btn:disabled {
	opacity: 0.45;
	cursor: not-allowed;
}
/*
 * Головна кнопка бере ГЛОБАЛЬНИЙ вигляд `.btn.btn-primary`, а не власний.
 *
 * Своя пара кольорів тут була помилкою: білий текст на `--accent-primary` дає
 * 1.38:1 у темі «dark-blue» і 1.49:1 у «yellow» — гейт контрасту назвав обидві.
 * Глобальна кнопка вже має підібрані пари для всіх шести тем, і повторювати цю
 * роботу вручну означало б заводити сьому, яку ніхто більше не оновлює.
 */
.cl-bulk-save {
	min-height: 44px;
}
</style>
