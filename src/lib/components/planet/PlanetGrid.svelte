<script lang="ts">
	import { t } from 'svelte-i18n';
	import PlanetFace from './PlanetFace.svelte';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * СІТКА — імена видно завжди, і скільки б їх не було.
	 *
	 * ## Що вирішує
	 *
	 * Це протилежний край рішення від «Орбіт»: планета лишається малюнком у
	 * шапці, а люди стоять картками. Перекриття тут неможливе не тому, що ми його
	 * порахували, а тому, що сітка його не вміє: `auto-fill` кладе стільки
	 * стовпців, скільки влазить, і переносить решту.
	 *
	 * Масштабується без стелі — ні двадцять, ні двісті нічого не змінюють,
	 * сторінка просто довша. Ціною метафори: тут немає «планети, на якій стоять
	 * учні», тут перелік. Саме тому варіантів три, а не один.
	 *
	 * ## Чому картка, а не рядок
	 *
	 * Обличчя головне: у планети немає років і груп, за якими читають рядок, —
	 * є люди. Квадратна картка з великим колом читається як «клас на фото», а
	 * рядок списку — як таблиця.
	 */
	interface Props {
		/* `readonly`: реєстр приходить сталим переліком, і компонент його не міняє. */
		students: readonly GraduateIndexEntry[];
		onopen: (student: GraduateIndexEntry) => void;
		testIdPrefix?: string;
	}

	let { students, onopen, testIdPrefix = 'creativity-planet' }: Props = $props();
</script>

<div class="grid-view">
	<!--
		Планета лишається — але як знак розділу, а не як розкладка. Вона тут
		декоративна: `aria-hidden`, бо все, що вона повідомляє, уже сказано
		заголовком сторінки.
	-->
	<div class="badge" aria-hidden="true"></div>

	<ul class="grid" data-testid="{testIdPrefix}-list">
		{#each students as учень (учень.id)}
			<li>
				<button
					type="button"
					class="card"
					onclick={() => onopen(учень)}
					data-testid="{testIdPrefix}-{учень.slug}-btn"
				>
					<PlanetFace student={учень} />
					<span class="card__name">{учень.name}</span>
				</button>
			</li>
		{/each}
	</ul>

	{#if students.length === 0}
		<p class="empty">{$t('planet.empty')}</p>
	{/if}
</div>

<style>
	.grid-view {
		display: grid;
		justify-items: center;
		gap: 1.5rem;
		width: 100%;
	}

	/* Та сама куля, що на орбітах, тільки маленька: вона тут підпис розділу. */
	.badge {
		width: min(30vmin, 190px);
		aspect-ratio: 1;
		border-radius: 50%;
		border: 1px solid var(--border-main);
		background:
			radial-gradient(
				circle at 32% 28%,
				color-mix(in srgb, var(--accent-primary) 45%, transparent),
				transparent 58%
			),
			radial-gradient(
				circle at 68% 78%,
				color-mix(in srgb, var(--accent-secondary) 38%, transparent),
				transparent 62%
			),
			linear-gradient(
				160deg,
				color-mix(in srgb, var(--accent-primary) 16%, var(--bg-surface)),
				var(--bg-surface)
			);
		box-shadow: var(--shadow-main);
	}

	/*
	 * `auto-fill` із `minmax` — розкладка сама вирішує, скільки стовпців. Тому
	 * той самий код дає чотири картки на телефоні й дванадцять на широкому
	 * екрані, і жодного правила під ширину тут не потрібно.
	 */
	.grid {
		display: grid;
		/* `min(108px, 100%)`, а не гола довжина: у вужчому контейнері гола
		   довжина лишається підлогою й жене сторінку боком (FLUID-SIZING-v9). */
		grid-template-columns: repeat(auto-fill, minmax(min(108px, 100%), 1fr));
		gap: 1.1rem 0.75rem;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		--face: clamp(64px, 9vw, 84px);
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.6rem 0.35rem;
		border: 1px solid transparent;
		border-radius: var(--radius-lg, 12px);
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		transition:
			background var(--transition-base),
			border-color var(--transition-base),
			transform var(--transition-base);
	}
	.card:hover,
	.card:focus-visible {
		background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
		border-color: var(--border-main);
		transform: translateY(-2px);
	}

	.card__name {
		color: var(--text-main);
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.25;
		text-align: center;
		/* Довге ім'я переноситься, а не ріже сусіда: у сітці для цього є місце. */
		overflow-wrap: anywhere;
	}

	.empty {
		margin: 0;
		color: var(--text-muted);
	}
</style>
