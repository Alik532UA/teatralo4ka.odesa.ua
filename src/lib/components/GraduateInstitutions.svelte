<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { asset } from '$app/paths';
	import { institutionPath, institutionsOfGraduate } from '$lib/data/institutions';
	import { expertPath, getExpertBySlug } from '$lib/data/experts';
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
					class="line__link"
					href={localizedPath(institutionPath(institution.slug), lang)}
					data-testid="{testIdPrefix}-link-{institution.slug}"
					>{isEn && institution.nameEn ? institution.nameEn : institution.name}</a
				>{#if student.note}&nbsp;({student.note}){/if}{#if student.programme}, {student.programme}{/if}{#if student.master}, {шматки[0]}{#if student.masterSlug}<a
						class="line__master"
						href={localizedPath(expertPath(student.masterSlug), lang)}
						data-testid="{testIdPrefix}-master-link-{student.masterSlug}"
						>{#if getExpertBySlug(student.masterSlug)?.photo}<img
								class="person-face"
								src={asset(getExpertBySlug(student.masterSlug)?.photo ?? '')}
								width="20"
								height="20"
								alt=""
								loading="lazy"
							/>{:else}<span
								class="person-face person-face--letter"
								aria-hidden="true"
								data-letter={літера(student.masterSlug, student.master)}
							></span>{/if}{student.master}</a
					>{:else}{student.master}{/if}{шматки[1] ?? ''}{/if}
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
	 * Посилання на майстра курсу виглядає як решта посилань блоку — різниця
	 * лише в кружечку перед іменем. Сам кружечок описаний ГЛОБАЛЬНО
	 * (`.person-face` у `global.css`), бо те саме обличчя стоїть у тексті
	 * новин: два описи одного кружечка розійшлися б на першій же правці.
	 *
	 * `nowrap` — щоб обличчя не лишилося на попередньому рядку без імені. Та
	 * сама біда й те саме лікування, що в `.person-face-lead`.
	 */
	.line__master {
		color: inherit;
		white-space: nowrap;
	}
	.line__master:hover {
		text-decoration: underline;
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
	/*
	 * Підкреслення — не косметика, а вимога WCAG 2.2 SC 1.4.1: посилання
	 * всередині речення не має права відрізнятися від сусідніх слів ЛИШЕ
	 * кольором. Той самий дефект уже знайдено в новині 4 вересня 2026, і його
	 * стереже `e2e/link-affordance.spec.ts`.
	 */
	.line__link {
		color: var(--galaxy-accent, var(--accent-primary));
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.line__link:hover {
		text-decoration-thickness: 2px;
	}
</style>
