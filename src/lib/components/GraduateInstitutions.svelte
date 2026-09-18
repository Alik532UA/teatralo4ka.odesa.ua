<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { asset } from '$app/paths';
	import { School } from 'lucide-svelte';
	import { institutionPath, institutionsOfGraduate } from '$lib/data/institutions';
	import { expertPath, getExpertBySlug, type Expert } from '$lib/data/experts';
	import RichTextWithFlags from '$lib/components/RichTextWithFlags.svelte';

	interface Props {
		/**
		 * Ключ людини, а не готовий перелік.
		 *
		 * Тут навпаки, ніж у `GraduateFestivals`: там перелік приходить пропом,
		 * бо той самий показ потрібен ще й сторінці викладача, де людей шукають
		 * ІНШИМ полем (`masterIds`). Заклад же знає лише студентів, іншого поля
		 * з людьми в нього немає, і другого місця показу теж — тож зайвий
		 * проп-режим був би вигаданим.
		 */
		graduateId: string;
		/**
		 * Те саме поле анкети, з якого зібрано реєстр закладів.
		 *
		 * Приходить сюди, бо АБО одне, АБО друге — і вибір мусить робити той,
		 * хто знає обидва. «Після випуску» — поле вільного тексту: у чотирнадцяти
		 * людей це вступ до закладу («Вступ 2026: КНУКіМ, акторський, курс
		 * О. Печериці»), а взагалі там може стояти будь-що інше. Тому там, де
		 * заклад у реєстрі знайшовся, показується рядок із реєстру — з
		 * посиланням на сторінку закладу; де ні — та сама проза, що й доти.
		 */
		afterGraduation?: string | null;
		/** Початок `data-testid`: блок мусить бути унікальним у межах сторінки. */
		testIdPrefix?: string;
	}

	let {
		graduateId,
		afterGraduation = null,
		testIdPrefix = 'galaxy-card-institutions'
	}: Props = $props();

	const isEn = $derived($locale === 'en');
	const lang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');
	const вступи = $derived(institutionsOfGraduate(graduateId));

	/**
	 * «курс » і те, що стоїть після імені, — ОКРЕМО, щоб посиланням стало саме
	 * ім'я майстра, а не весь рядок.
	 *
	 * Речення збирається зі словника (`курс {master}` / `course of {master}`), і
	 * порядок слів у мовах різний: в англійській ім'я йде після «course of».
	 * Тому шаблон розрізається по місцю підстановки, а не склеюється руками —
	 * інакше англійський варіант довелося б писати вдруге тут.
	 */
	const МІТКА = '@@';
	const шматки = $derived(
		$t('galaxy.institutionCourse', { values: { master: МІТКА } }).split(МІТКА)
	);

	/** Перша літера імені для кружечка-заглушки: у фахівця, а не з відмінка. */
	const літера = (slug: string | undefined, запасне: string) =>
		((slug ? getExpertBySlug(slug)?.name : undefined) ?? запасне).replace(/[^\p{L}]/gu, '').slice(0, 1);

	/** Форматує ім'я майстра: без скорочення, прізвище ВЕЛИКИМИ літерами. */
	function formatMasterName(expert: Expert | undefined, fallback: string): string {
		const rawName = (isEn && expert?.nameEn ? expert.nameEn : expert?.name) ?? fallback;
		const trimmed = rawName.trim();
		const parts = trimmed.split(/\s+/);
		if (parts.length === 1) return parts[0].toUpperCase();
		const last = parts.pop()!;
		return `${parts.join(' ')} ${last.toUpperCase()}`;
	}
</script>

<!--
	Заклад НАЗВОЮ-ПОСИЛАННЯМ усередині рядка, а не окремою плашкою під ним.

	Перша редакція ставила під прозою чип «КНУКіМ вступ 2026» — і виходило, що
	один факт написаний тричі: заголовком, реченням і плашкою. Автор на це й
	вказав. Тепер речення одне, збирається з реєстру (рік, напрям, майстер
	лежать на ребрі «людина + заклад»), а натиснути можна саму назву закладу —
	те, що в цьому рядку єдине веде далі.
-->
{#if вступи.length}
	<section class="inst-block" data-testid="{testIdPrefix}-section">
		<h3 class="galaxy-block-title">{$t('galaxy.institutionBlockTitle')}</h3>
		{#each вступи as { institution, student } (institution.slug)}
			<p class="line" data-testid="{testIdPrefix}-item-{institution.slug}">
				{#if student.year}<span class="line__year">{student.year}</span>{/if}
				<a
					class="inst-button"
					href={localizedPath(institutionPath(institution.slug), lang)}
					title={institution.fullName || (isEn && institution.nameEn ? institution.nameEn : institution.name)}
					data-testid="{testIdPrefix}-link-{institution.slug}"
				><span class="inst-badge" aria-hidden="true"><School size={15} /></span><span class="inst-name">{isEn && institution.nameEn ? institution.nameEn : institution.name}</span></a>{#if student.note}&nbsp;({student.note}){/if}{#if student.programme}, {student.programme}{/if}{#if student.master}, {шматки[0]}<span class="master-item">{#if student.masterSlug}{@const expert = getExpertBySlug(student.masterSlug)}<!-- eslint-disable-next-line svelte/no-navigation-without-resolve --><a
							class="master-link-wrapper"
							href={localizedPath(expertPath(student.masterSlug), lang)}
							title={expert ? (isEn && expert.nameEn ? expert.nameEn : expert.name) : student.master}
							data-testid="{testIdPrefix}-master-link-{student.masterSlug}"
						><span class="master-badge">{#if expert?.photo}<img
									class="master-badge__photo"
									src={asset(expert.photo)}
									width="22"
									height="22"
									alt=""
									loading="lazy"
									decoding="async"
								/>{:else}<span
									class="person-face person-face--letter"
									aria-hidden="true"
									data-letter={літера(student.masterSlug, student.master)}
								></span>{/if}</span><span class="master-name">{formatMasterName(expert, student.master)}</span></a>{:else}<span class="master-link-wrapper"><span class="master-badge"><span
								class="person-face person-face--letter"
								aria-hidden="true"
								data-letter={літера(undefined, student.master)}
							></span></span><span class="master-name">{formatMasterName(undefined, student.master)}</span></span>{/if}</span>{шматки[1] ?? ''}{/if}
			</p>
		{/each}
	</section>
{:else if afterGraduation}
	<section class="inst-block">
		<h3 class="galaxy-block-title">{$t('galaxy.afterGraduation')}</h3>
		<p class="line"><RichTextWithFlags text={afterGraduation} /></p>
	</section>
{/if}

<style>
	/*
	 * Кнопка майстра курсу — за зразком плашок майстрів школи
	 * (`data-testid="galaxy-card-master-link-*"` у `GraduateProfileView`).
	 * `vertical-align: middle` вирівнює її всередині речення біля слова «курс».
	 */
	.master-item {
		display: inline-flex;
		vertical-align: middle;
		align-items: stretch;
		padding: 0;
		background: var(--fest-surface, rgb(255 255 255 / 0.07));
		border-radius: var(--radius-md, 12px);
		border: var(--hairline-width) solid var(--fest-border, rgb(140 190 255 / 0.25));
		color: var(--fest-text, var(--galaxy-text));
		transition:
			background var(--transition-base, 0.2s ease),
			border-color var(--transition-base, 0.2s ease),
			transform var(--transition-base, 0.2s ease);
	}
	.master-item:has(a:hover) {
		background: rgb(255 255 255 / 0.12);
		border-color: var(--galaxy-accent, #8cc4ff);
		transform: translateX(3px);
	}
	.master-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.7rem;
		color: inherit;
		text-decoration: none;
		border-radius: inherit;
	}
	.master-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--galaxy-accent, #8cc4ff);
		flex-shrink: 0;
	}
	.master-badge__photo {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		object-fit: cover;
		display: block;
		border: var(--hairline-width) solid color-mix(in srgb, var(--galaxy-accent, #8cc4ff), transparent 65%);
	}
	.master-name {
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--galaxy-text, #eaf2ff);
		text-decoration: none;
		transition: color 0.2s ease;
	}
	.master-link-wrapper:hover .master-name {
		color: var(--galaxy-accent, #8cc4ff);
	}

	/*
	 * `.block` і `.line` — власні, хоч у батька є такі самі.
	 *
	 * Svelte скоупить стилі по компоненту, тож успадкувати `.block`/`.para` з
	 * `GraduateProfileView` не можна, а оголошувати ЧУЖИЙ клас компонентові
	 * забороняє `src/component-styles.test.ts` — і він на цьому й спіймав першу
	 * редакцію: у заголовку поруч зі спільним класом стояв ще й приватний клас
	 * батька (той, що з модифікатором `__title`). Значення взяті з батьківських
	 * правил дослівно, щоб блок стояв у тому самому ритмі, що сусідні, а імена
	 * свої — `.inst-block` і `.line` замість `.block` і `.para`, аби нікому не
	 * здалося, що це ті самі класи.
	 *
	 * Назву чужого класу тут НЕ написано буквально навмисно: перевірка читає
	 * джерело як текст і не відрізняє згадки в коментарі від справжнього
	 * використання — вона впала саме на такій згадці.
	 *
	 * Заголовок — інша річ: `.galaxy-block-title` оголошений у `global.css`
	 * саме тому, що два таких заголовки живуть в іншому компоненті
	 * (`GraduateFestivals`). Тут використовується той самий спільний клас.
	 */
	.inst-block {
		margin-top: 1.1rem;
		text-align: left;
	}
	.line {
		margin: 0 0 0.6rem;
		line-height: 1.55;
		color: var(--galaxy-text, var(--text-main));
		overflow-wrap: anywhere;
	}
	/* Рік перед назвою: у трьох із чотирнадцяти він не дорівнює рокові випуску
	   зі школи, тож мусить читатися першим і не зливатися з назвою. */
	.line__year {
		margin-right: 0.35rem;
		font-variant-numeric: tabular-nums;
		color: var(--galaxy-muted, var(--text-muted));
	}
	.inst-button {
		display: inline-flex;
		vertical-align: middle;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.7rem;
		border-radius: var(--radius-md, 12px);
		background: var(--fest-surface, rgb(255 255 255 / 0.07));
		border: var(--hairline-width) solid var(--fest-border, rgb(140 190 255 / 0.25));
		color: var(--galaxy-accent, #8cc4ff);
		text-decoration: none;
		transition:
			background var(--transition-base, 0.2s ease),
			border-color var(--transition-base, 0.2s ease),
			color var(--transition-base, 0.2s ease),
			transform var(--transition-base, 0.2s ease);
	}
	.inst-button:hover {
		background: rgb(255 255 255 / 0.12);
		border-color: var(--galaxy-accent, #8cc4ff);
		color: #ffffff;
		transform: translateX(3px);
	}
	.inst-button:focus-visible {
		outline: 2px solid var(--galaxy-accent, #8cc4ff);
		outline-offset: 2px;
	}
	.inst-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--galaxy-accent, #8cc4ff);
		flex-shrink: 0;
	}
	.inst-button:hover .inst-badge {
		color: #ffffff;
	}
	.inst-name {
		font-size: 0.92rem;
		font-weight: 600;
		color: inherit;
		text-decoration: none;
	}
</style>
