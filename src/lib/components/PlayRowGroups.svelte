<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { coGroupsForPlay, groupProfilePath } from '$lib/data/groups';

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
	 * і перелік ставав вищим без потреби (знімок замовника, 2026-09-02).
	 *
	 * Тому рядок анкети — флекс із переносом (`GraduatePlayRow`): плашка разом із
	 * кнопкою запису — хвіст рядка — стоїть у тому самому рядку, притиснута
	 * праворуч, а коли не вміщається — переноситься, не тиснучи назву. Усе це
	 * робить батько; тут лише сама плашка.
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
</script>

{#if coGroups.length > 0}
	<span class="groups">
		<span class="groups__label">{$t('galaxy.playTogetherWith')}</span>
		{#each coGroups as group (group.slug)}
			<a
				class="groups__link"
				href={localizedPath(groupProfilePath(group.slug), lang)}
				data-testid="{testidBase}-cogroup-link-{group.slug}"
			>
				{group.abbr || (isEn && group.nameEn ? group.nameEn : group.name)}
			</a>
		{/each}
	</span>
{/if}

<style>
	.groups {
		display: inline-flex;
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
