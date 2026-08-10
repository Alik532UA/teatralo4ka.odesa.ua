/**
 * Тип пункту для `Select.svelte`.
 *
 * Живе окремим файлом, а не `export interface` у самому компоненті: компілятор
 * Svelte таке приймає, а `svelte2tsx`, яким працює `svelte-check`, ламається —
 * і повідомляє про це як «`<script>` was left open» у кінці файлу, тобто вказує
 * зовсім не туди. Прямий `parse()` при цьому проходить, тож помилку видно лише
 * через `npm run check`.
 */
export interface SelectOption {
	value: string;
	label: string;
	/** Друга мова або уточнення — праворуч, тьмяно. */
	hint?: string;
	disabled?: boolean;
}
