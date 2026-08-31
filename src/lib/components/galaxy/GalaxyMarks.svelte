<script lang="ts">
	import type { GalaxyMark } from './galaxyRow';

	/**
	 * Плашки праворуч у рядку.
	 *
	 * Окремо від `GalaxyRows` із двох причин, і обидві практичні: рядок разом із
	 * ними переростав стелю `structure.test.ts`, а плашки — це єдине, що
	 * відрізняється між трьома сторінками (у вистави нагороди й запис, у групи
	 * майстри, у фестивалю країни). Тримати їх в одному файлі з сіткою рядка
	 * означало б правити сітку щоразу, коли з'являється нова плашка.
	 *
	 * Форма приходить готовою — див. `GalaxyMark`. Тут лише показ.
	 */
	interface Props {
		marks: readonly GalaxyMark[];
		/** Початок `data-testid`; свій на кожному рядку. */
		testIdPrefix: string;
	}

	let { marks, testIdPrefix }: Props = $props();
</script>

{#if marks.length}
	<span class="marks">
		<!--
			Ключ — ІНДЕКС, а не `mark.text`: назви курсів у рядку бувають однакові, і
			текст як ключ валив би сторінку збігом. Індекс тут безпечний, бо набір
			перебудовується цілком і порядок у ньому заданий сталим списком, а не
			сортуванням — тобто пункт під номером не «переїжджає» на чужий.
		-->
		{#each marks as mark, i (i)}
			{#if mark.href}
				<!--
					Зовнішнє посилання — саме тому без `resolve`: адреса запису живе на
					YouTube, і проганяти її через маршрутизатор нема куди. Так само
					позначений запис у репертуарі майстра.
				-->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					class="mark mark--{mark.tone ?? 'plain'}"
					href={mark.href}
					target="_blank"
					rel="external noopener noreferrer"
					title={mark.title}
					data-testid="{testIdPrefix}-mark-link-{i}"
				>
					{#if mark.icon}<mark.icon size={13} aria-hidden="true" />{/if}
					{#if mark.text}<span>{mark.text}</span>{/if}
				</a>
			{:else}
				<span class="mark mark--{mark.tone ?? 'plain'}" title={mark.title}>
					{#if mark.icon}<mark.icon size={13} aria-hidden="true" />{/if}
					{#if mark.text}<span>{mark.text}</span>{/if}
				</span>
			{/if}
		{/each}
	</span>
{/if}

<style>
	.marks {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.3rem;
	}

	.mark {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1rem 0.45rem;
		border-radius: var(--radius-sm, 6px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		text-decoration: none;
	}

	/* Назва курсу — тихіша за решту: вона повторюється в сусідніх рядках, і
	   рівний із нагородою контраст робив би з неї головне в рядку. */
	.mark--group {
		background: transparent;
		color: var(--text-main);
	}

	.mark--award {
		color: var(--text-title);
		border-color: var(--accent-primary);
	}

	.mark--video {
		color: var(--text-title);
	}
	.mark--video:hover {
		border-color: var(--accent-primary);
	}
</style>
