<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { coGroupsForPlay, groupProfilePath } from '$lib/data/groups';
	import { balancedRows } from '$lib/utils/balancedRows';

	/**
	 * Плашка «разом з …» у рядку вистави анкети: з якими групами грала людина.
	 *
	 * ## Чому плашка, а не текст руками
	 *
	 * Доти «разом з групою ЗТК» стояло просто в тексті однієї анкети. Заміряно:
	 * таких рядків у базі 124, а примітку мав рівно один — тобто 123 рядки про це
	 * мовчали. Тепер відповідь приходить із реєстру (`coGroupsForPlay`) і
	 * з'являється в усіх рядках, де вона чесна.
	 *
	 * ## Де стоїть: у тому ж рядку, якщо вміщається, інакше — рядком нижче
	 *
	 * Обидва крайні варіанти вже були, і обидва не годилися. Праворуч від тексту
	 * ЗАВЖДИ — у вузькій картці плашка забирала під себе смугу, і назва з роллю
	 * тислася в колонку з двох слів («Уявно / хворий», / Тома / Діафуарус»).
	 * Рядком нижче ЗАВЖДИ — короткі назви лишали біля себе порожній хвіст рядка,
	 * і перелік ставав вищим без потреби (знімок автора, 2026-09-02).
	 *
	 * Тому рядок анкети — флекс із переносом (`GraduatePlayRow`): плашка разом із
	 * кнопкою запису — хвіст рядка — стоїть у тому самому рядку, притиснута
	 * праворуч, а коли не вміщається — переноситься, не тиснучи назву. Усе це
	 * робить батько; тут — сама плашка.
	 *
	 * ## Багато груп: перенос РІВНОМІРНИЙ, а не «залишок в останній рядок»
	 *
	 * У «Уривках з класики» 2016 груп чотири й більше, і доти зайві просто
	 * зникали за краєм картки — обрізані, без жодної ознаки, що вони є (знімок
	 * автора, 2026-09-03). Тепер плашка переноситься, а розкладку рахує
	 * `balancedRows`: кожен наступний рядок не коротший за попередній (3 → 1+2,
	 * 4 → 2+2, 5 → 2+3). Природний `flex-wrap` дав би навпаки — повний перший
	 * рядок і одиноку плашку під ним.
	 *
	 * Скільки плашок влазить у рядок, знає лише браузер, тож `perRow` міряється:
	 * беруться справжні ширини вже відрендерених плашок. До першого заміру всі
	 * стоять одним рядком — саме так, як було; тобто розкладка лише
	 * ПОЛІПШУЄТЬСЯ, а не з'являється з нічого.
	 *
	 * Напис «разом з» звужує ПЕРШИЙ рядок, і `perRow` його не враховує навмисно:
	 * правило автора й так віддає першому рядку найменше позицій, тож місце під
	 * напис береться саме там, де воно є.
	 */
	interface Props {
		/** Ключ вистави. Немає — немає й плашки. */
		playId?: string;
		/** `id` випускника: від його власних груп залежить, які групи «чужі». */
		memberId: string;
		/** Точковий вимикач плашки для цього рядка (`GraduatePlay.hideCoGroups`). */
		hideCoGroups?: boolean;
		/** Основа для `data-testid`; тип додається тут. */
		testidBase: string;
	}

	let { playId, memberId, hideCoGroups = false, testidBase }: Props = $props();

	const isEn = $derived($locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
	const coGroups = $derived(playId && !hideCoGroups ? coGroupsForPlay(playId, memberId) : []);

	let wrapEl = $state<HTMLElement | null>(null);
	/** Скільки плашок влазить у рядок. `0` — ще не міряли, тобто всі в один. */
	let perRow = $state(0);

	const rows = $derived(
		balancedRows(coGroups, perRow > 0 ? perRow : coGroups.length)
	);

	/**
	 * Замір ширин — і чому він не зациклюється.
	 *
	 * Ширина плашки не залежить від того, у якому рядку вона стоїть (текст
	 * `nowrap`), а доступна ширина — від картки, не від розкладки. Тому новий
	 * `perRow` дає ту саму відповідь при повторному замірі, і `$effect`
	 * зупиняється після одного проходу. Той самий клас пастки, від якого
	 * застерігає докблок `denseCols` у `GraduateProfileView`, — там ішлося саме
	 * про замір, що змінює те, що міряє.
	 *
	 * `ResizeObserver`, а не один замір на монтуванні: картка випускника
	 * розкладається по колонках уже після появи, та ще й змінює ширину разом із
	 * вікном — без спостерігача перша (найвужча) відповідь лишалася б назавжди.
	 */
	$effect(() => {
		const el = wrapEl;
		if (!el || coGroups.length < 2 || typeof ResizeObserver === 'undefined') return;

		const measure = () => {
			const chips = [...el.querySelectorAll<HTMLElement>('.groups__link')];
			if (chips.length === 0) return;
			const available = el.clientWidth;
			if (available <= 0) return;

			const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
			let used = 0;
			let fit = 0;
			for (const chip of chips) {
				const next = used + (fit > 0 ? gap : 0) + chip.getBoundingClientRect().width;
				if (fit > 0 && next > available) break;
				used = next;
				fit += 1;
			}
			perRow = Math.max(1, fit);
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

{#if coGroups.length > 0}
	<span class="groups" bind:this={wrapEl}>
		{#each rows as row, index (index)}
			<span class="groups__row">
				{#if index === 0}
					<span class="groups__label">{$t('galaxy.playTogetherWith')}</span>
				{/if}
				{#each row as group (group.slug)}
					<a
						class="groups__link"
						href={localizedPath(groupProfilePath(group.slug), lang)}
						data-testid="{testidBase}-cogroup-link-{group.slug}"
					>
						{group.abbr || (isEn && group.nameEn ? group.nameEn : group.name)}
					</a>
				{/each}
			</span>
		{/each}
	</span>
{/if}

<style>
	/*
	 * Колонка рядків, притиснута праворуч: рядків буває кілька, і кожен наступний
	 * не коротший за попередній (`balancedRows`).
	 *
	 * `column-gap` оголошений тут, бо з нього ж бере крок замір: одна властивість
	 * — одне джерело, і зміна відступу не розійдеться з розрахунком.
	 */
	.groups {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		column-gap: 0.3rem;
		row-gap: 0.15rem;
		/* Плашка не розпирає рядок: коли груп багато, вона переноситься сама. */
		min-width: 0;
	}

	.groups__row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.groups__label {
		color: var(--galaxy-muted);
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.groups__link {
		padding: 0.05rem 0.4rem;
		border: 1px solid rgb(140 190 255 / 0.35);
		border-radius: 999px;
		color: #cfe4ff;
		font-size: 0.78rem;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}

	.groups__link:hover,
	.groups__link:focus-visible {
		background: rgb(12 22 56 / 0.85);
		border-color: rgb(140 190 255 / 0.6);
	}
</style>
