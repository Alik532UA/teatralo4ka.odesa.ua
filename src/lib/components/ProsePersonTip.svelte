<script lang="ts">
	import { t } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import MASTERS_INDEX from '$lib/data/masters.index.json';
	import INSTITUTIONS_DATA from '$lib/data/institutions.data.json';
	import EXPERTS_DATA from '$lib/data/experts.data.json';
	import type { GraduateIndexEntry } from '$lib/data/graduates';

	/**
	 * Картка під курсором: хто ця людина, не відводячи читача зі сторінки.
	 *
	 * Окремим компонентом, а не рядками в `ProsePeopleLinks`, і шов тут не
	 * формальний: батько має одну роботу — знайти в чужій розмітці посилання на
	 * людину, поставити перед ним обличчя й перехопити натискання. ЩО саме
	 * розповісти про людину — інша робота, і вона тягне за собою три реєстри
	 * (майстри, заклади, фахівці), потрібні лише тут.
	 *
	 * Розділено тоді, коли батько переріс свою стелю в 300 рядків SLOC: розмір
	 * назвав шов, але не вигадав його.
	 */
	type Майстер = { slug: string; displayName: string; photo?: string };
	type Заклад = {
		name: string;
		students: { id: string; year?: number; masterSlug?: string }[];
	};
	type Фахівець = { slug: string; name: string; photo?: string };

	interface Props {
		/** Координати лівого краю картки у вікні. */
		x: number;
		y: number;
		/** Картка стоїть ПІД посиланням; інакше відраховується від свого низу. */
		знизу: boolean;
		/** Кого описуємо: ім'я, знімок і запис реєстру, з якого рахується решта. */
		особа: { name: string; photo?: string; випускник: GraduateIndexEntry };
	}

	let { x, y, знизу, особа }: Props = $props();

	interface Зміст {
		/** «випуск 2018» — або нічого, коли року в реєстрі немає. */
		випуск?: string;
		/** Майстри курсу НАШОЇ школи, з обличчями. */
		майстри: { name: string; photo?: string }[];
		/** Куди вступив: «КНУТКіТ, вступ 2018». */
		заклад?: string;
		/**
		 * Майстер курсу В ЦЬОМУ ЗАКЛАДІ — окремим рядком під його назвою.
		 *
		 * Не плутати з майстрами вище: ті вчили людину в НАШІЙ школі. Тому
		 * майстер ВНЗ і стоїть під закладом, а не в спільному списку — інакше
		 * виходило б, ніби всі вони вчили в одному місці.
		 */
		майстерВНЗ?: { name: string; photo?: string };
	}

	/**
	 * Що показує підказка. Рахується НА НАВЕДЕННЯ, а не наперед для всіх
	 * посилань: на сторінці їх буває півтора десятка, а розкриють одне-два.
	 */
	function зміст(g: GraduateIndexEntry): Зміст {
		const майстри = (g.masters ?? [])
			// Майстер в анкеті буває рядком-ключем або записом із `id` — реєстр
			// зберігав обидві форми, і звужувати його заради підказки ні до чого.
			.map((m) => (typeof m === 'string' ? m : m.id))
			.map((id) => (MASTERS_INDEX as Майстер[]).find((x) => x.slug === id))
			.filter((m) => m !== undefined)
			.map((m) => ({ name: m.displayName, photo: m.photo ? asset(m.photo) : undefined }));

		/*
		 * Заклад шукається ЗА РЕБРОМ «людина + рік», а не полем в анкеті: у
		 * реєстрі закладів саме там живе вступ, і розбір цього рішення — у
		 * докблоці `data/institutions`.
		 */
		let заклад: string | undefined;
		let майстерВНЗ: { name: string; photo?: string } | undefined;
		for (const з of INSTITUTIONS_DATA as Заклад[]) {
			const студент = з.students.find((st) => st.id === g.id);
			if (!студент) continue;
			заклад = студент.year
				? `${з.name}, ${$t('galaxy.institutionEnrolled', { values: { year: студент.year } })}`
				: з.name;
			/*
			 * Ім'я береться у ФАХІВЦЯ, а не з поля `master`: там воно в родовому
			 * відмінку («О. Замятіна»), бо підставляється в «курс …». Окремим
			 * рядком це читалося б як помилка.
			 */
			const ф = студент.masterSlug
				? (EXPERTS_DATA as Фахівець[]).find((x) => x.slug === студент.masterSlug)
				: undefined;
			if (ф) майстерВНЗ = { name: ф.name, photo: ф.photo ? asset(ф.photo) : undefined };
			break;
		}

		return {
			випуск: g.graduationYear ? `${$t('galaxy.graduated')} ${g.graduationYear}` : undefined,
			майстри,
			заклад,
			майстерВНЗ
		};
	}


	const зміст_ = $derived(зміст(особа.випускник));
</script>

	<!--
		Підказка стоїть у `body`-координатах (`position: fixed`), бо посилання
		живе в тексті, а текст — у колонці з власною прокруткою й обрізанням.
		Вкласти її поруч із посиланням нема куди: розмітку пише markdown.
	-->
	<div
		class="tip"
		class:tip--above={!знизу}
		style="left: {x}px; top: {y}px"
		data-testid="prose-person-tip-card"
	>
		{#if особа.photo}
			<img class="tip__face" src={особа.photo} width="48" height="48" alt="" />
		{:else}
			<span
				class="tip__face tip__face--letter"
				aria-hidden="true"
				data-letter={особа.name.slice(0, 1)}
			></span>
		{/if}
		<span class="tip__body">
			<span class="tip__name">{особа.name}</span>
			{#if зміст_.випуск}
				<span class="tip__line">{зміст_.випуск}</span>
			{/if}

			<!--
				Майстри курсу — У СТОВПЕЦЬ і з обличчями, а не рядком через кому.
				Кома зліплювала двох різних людей в один рядок, який ще й
				переносився посередині прізвища; обличчя ж тут те саме, що й
				скрізь на сайті, — воно впізнається швидше за підпис.
			-->
			{#each зміст_.майстри as майстер (майстер.name)}
				<span class="tip__master">
					{#if майстер.photo}
						<img class="tip__mini" src={майстер.photo} width="20" height="20" alt="" />
					{:else}
						<span
							class="tip__mini tip__mini--letter"
							aria-hidden="true"
							data-letter={майстер.name.slice(0, 1)}
						></span>
					{/if}
					<span class="tip__line">{майстер.name}</span>
				</span>
			{/each}

			<!--
				РОЗДІЛЬНИК перед закладом — не оформлення, а виправлення неправди.
				Майстер курсу в НАШІЙ школі й заклад, куди людина вступила
				ПОТІМ, — різні речі, а стоячи впритул вони читалися як «майстер
				курсу в КНУТКіТ». У самого закладу свій майстер курсу є, і він у
				даних поки не живе.
			-->
			{#if зміст_.заклад}
				{#if зміст_.майстри.length}
					<span class="tip__rule" aria-hidden="true"></span>
				{/if}
				<span class="tip__line">{зміст_.заклад}</span>
				<!--
					Майстер курсу ВНЗ — одразу під назвою закладу, бо він належить
					саме йому. Той самий рядок із обличчям, що у майстрів школи
					вище: одна річ малюється одним способом.
				-->
				{#if зміст_.майстерВНЗ}
					<span class="tip__master">
						{#if зміст_.майстерВНЗ.photo}
							<img
								class="tip__mini"
								src={зміст_.майстерВНЗ.photo}
								width="20"
								height="20"
								alt=""
							/>
						{:else}
							<span
								class="tip__mini tip__mini--letter"
								aria-hidden="true"
								data-letter={зміст_.майстерВНЗ.name.replace(/[^\p{L}]/gu, '').slice(0, 1)}
							></span>
						{/if}
						<span class="tip__line">{зміст_.майстерВНЗ.name}</span>
					</span>
				{/if}
			{/if}
		</span>
	</div>

<style>
	.tip {
		position: fixed;
		/*
		 * Під модалкою, але над усім іншим: підказка живе на сторінці, а не
		 * поверх картки, яку відкриває натискання. Власної змінної для підказок
		 * у палітрі немає, і заводити її заради одного місця ні до чого.
		 */
		z-index: calc(var(--z-modal) - 1);
		display: flex;
		gap: 0.6rem;
		width: 260px;
		padding: 0.6rem 0.7rem;
		border-radius: 0.8rem;
		background: var(--bg-card);
		border: var(--hairline-width) solid var(--border-main);
		box-shadow: 0 12px 30px rgb(0 0 0 / 0.35);
		pointer-events: none;
	}
	/* Піднята підказка відраховується від СВОГО низу, а не від верху. */
	.tip--above {
		translate: 0 -100%;
	}
	.tip__face {
		flex: none;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-surface);
	}
	.tip__face--letter {
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.tip__body {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}
	.tip__name {
		font-weight: 700;
		color: var(--text-title);
	}
	.tip__line {
		font-size: 0.82rem;
		line-height: 1.35;
		color: var(--text-muted);
	}
	.tip__master {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.15rem;
	}
	.tip__mini {
		flex: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
		border: var(--hairline-width) solid var(--border-main);
		background: var(--bg-surface);
	}
	/* Літера атрибутом, а не текстом: інакше вона лізе в `innerText` підказки.
	   Розбір — там само, де кружечок у тексті новини. */
	.tip__mini--letter::before,
	.tip__face--letter::before {
		content: attr(data-letter);
	}
	.tip__mini--letter {
		display: grid;
		place-items: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.tip__rule {
		height: var(--hairline-width);
		margin: 0.35rem 0 0.25rem;
		background: var(--border-main);
	}
</style>
