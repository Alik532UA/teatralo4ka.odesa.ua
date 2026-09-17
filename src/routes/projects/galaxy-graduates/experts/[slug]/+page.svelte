<script lang="ts">
	import { asset } from '$app/paths';
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { Gavel, Dumbbell, Star } from 'lucide-svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
import { graduationCaption } from '$lib/data/graduates';
import { openGraduateModal } from '$lib/services/graduateModal.svelte';
	import type { PageData } from './$types';

	/**
	 * Сторінка запрошеного фахівця фестивалю.
	 *
	 * ## Чому вона взагалі є
	 *
	 * Рішення автора: показувати таких людей окремими сторінками, як випускників.
	 * Сама сторінка при цьому набагато простіша — у фахівця немає ні вистав, ні
	 * групи, ні майстрів курсу. Лишається те, що про нього справді відомо: ім'я,
	 * місто, посади за роками й фестивалі, на які він приїздив.
	 *
	 * ## Чому посади переліком, а не одним рядком
	 *
	 * Бо вони змінюються, і в наших даних це видно: Станіслав Жирков 2018-го вів
	 * «Золоті ворота», а 2021-го — театр драми і комедії на лівому березі Дніпра.
	 * Одна посада на людину змусила б вибирати, котру з двох правд показати.
	 * Перелік показує обидві й сам собою стає короткою хронологією.
	 */

	let { data }: { data: PageData } = $props();

	const currentLang = $derived(($locale as string) === 'en' ? 'en' : 'uk');
	const isEn = $derived(currentLang === 'en');
	const name = $derived(isEn && data.expert.nameEn ? data.expert.nameEn : data.expert.name);

	/** Посади від найсвіжішої: теперішнє цікавить першим. */
	const titles = $derived([...data.expert.titles].sort((a, b) => b.year - a.year));

	const roleLabel: Record<string, string> = {
		experts: 'galaxy.festivalExperts',
		coaches: 'galaxy.festivalCoaches',
		guests: 'galaxy.festivalGuests'
	};
</script>

<section class="expert container" data-testid="expert-page-section">
	<!--
		Тепер звідси є куди «назад»: доти сторінка фахівця була глухим кутом —
		зайти в неї можна було лише зі сторінки поїздки, а вийти нікуди.
	-->
	<GalaxyBreadcrumb
		withTrail
		trailTestId="expert-from-link"
		backHref={localizedPath('/projects/galaxy-graduates/experts/', currentLang)}
		backLabel={$t('galaxy.backToExperts')}
		backTestId="expert-experts-link"
		forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
		forwardLabel={$t('galaxy.title')}
		forwardTestId="expert-galaxy-link"
	/>

	<header class="expert__header">
		<!--
			Портрет — коли він є, і не інакше. Фахівці приходять до нас на кілька
			днів фестивалю, і знімок є далеко не в кожного; порожній кружечок з
			ініціалом тут читався б як «ми не встигли», хоча насправді ми просто
			не маємо права публікувати чуже фото без дозволу.
		-->
		{#if data.expert.photo}
			<img
				class="expert__photo"
				src={asset(data.expert.photo)}
				width="160"
				height="160"
				alt={name}
			/>
		{/if}
		<h1 class="expert__name" data-testid="expert-name-title">{name}</h1>
		{#if data.expert.city}
			<p class="expert__city" data-testid="expert-city-text">{data.expert.city}</p>
		{/if}
	</header>

	{#if titles.length > 0}
		<ul class="expert__titles" data-testid="expert-titles-list">
			{#each titles as title (title.year)}
				<li class="expert__title">
					<span class="expert__year">{title.year}</span>
					<span class="expert__role">{title.text}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<!--
		ЗАКЛАД — рядком під посадами, а не карткою.

		Це не окремий розділ сторінки, а уточнення до посади: «майстер курсу» без
		назви закладу — половина факту. Розділ із заголовком і рамкою робив би з
		одного рядка подію.
	-->
	{#if data.institutions.length > 0}
		<p class="expert__institutions" data-testid="expert-institutions-row">
			<span class="expert__institutions-label">{$t('galaxy.masterOne')}</span>
			{#each data.institutions as заклад, i (заклад.slug)}
				{#if i > 0}<span class="expert__institutions-sep" aria-hidden="true">·</span>{/if}
				<a
					href={localizedPath(заклад.href, currentLang)}
					data-testid="expert-institution-link-{заклад.slug}"
				>
					{заклад.name}
				</a>
			{/each}
		</p>
	{/if}

	{#if data.appearances.length > 0}
		<h2 class="expert__section-title" data-testid="expert-festivals-title">
			{$t('galaxy.festivals')}
		</h2>
		<ul class="expert__festivals" data-testid="expert-festivals-list">
			{#each data.appearances as item (item.slug)}
				<li>
					<a
						href={localizedPath(item.href, currentLang)}
						class="expert__festival"
						data-testid="expert-festival-link-{item.slug}"
					>
						<span class="expert__festival-icon" aria-hidden="true">
							{#if item.role === 'experts'}<Gavel size={16} />
							{:else if item.role === 'coaches'}<Dumbbell size={16} />
							{:else}<Star size={16} />{/if}
						</span>
						<span class="expert__festival-name">
							{isEn && item.nameEn ? item.nameEn : item.name}
							<span class="expert__festival-year">{item.year}</span>
						</span>
						<span class="expert__festival-role">{$t(roleLabel[item.role])}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<!--
		ВИПУСКНИКИ, ЧИЙ ВІН МАЙСТЕР КУРСУ — тією ж сіткою, що на сторінці поїздки.

		Зв'язок доти був однобічний: зі сторінки випускника було видно майстра
		курсу, а звідси — нікого. Сітка взята та сама навмисно: людина, що ходить
		галактикою, бачить однакові картки людей у поїздці, у групі й тут, і не
		мусить щоразу вгадувати, що перед нею.
	-->
	{#if data.students.length > 0}
		<h2 class="expert__section-title" data-testid="expert-students-title">
			{$t('galaxy.festivalAlumni')}
		</h2>
		<div class="people-grid" data-testid="expert-students-list">
			{#each data.students as person, idx (person.id)}
				<GroupPersonCard
					name={person.name}
					photo={person.hasPhoto ? asset(`/graduates/${person.slug}-192.webp`) : null}
					subtitle={graduationCaption(person, $t)}
					onclick={() => openGraduateModal(person)}
					splitName
					index={idx}
					testid="expert-student-card-{person.slug}"
				/>
			{/each}
		</div>
	{/if}

	<!--
		Рядками, а не плитками: зріз возить лише назву й дату, обкладинки в ньому
		немає, і плитка з самим заголовком читалася б як картка, що не
		завантажилась. Те саме рішення — у поїздки й в анкеті випускника.
	-->
	{#if data.news.length > 0}
		<h2 class="expert__section-title" data-testid="expert-news-title">{$t('nav.news')}</h2>
		<ul class="expert__news" data-testid="expert-news-list">
			{#each data.news as новина (новина.id)}
				<li>
					<a
						class="expert__news-item"
						href={localizedPath(`/news/${новина.id}`, currentLang)}
						data-testid="expert-news-link-{новина.id}"
					>
						<span class="expert__news-title">{новина.title[currentLang]}</span>
						<time class="expert__news-date" datetime={новина.date}>{новина.date}</time>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.expert {
		padding: var(--page-pad-top) 24px var(--page-pad-bottom);
		max-width: 800px;
	}

	.expert__header {
		margin-bottom: 2rem;
	}

	.expert__photo {
		width: 160px;
		height: 160px;
		border-radius: 50%;
		object-fit: cover;
		border: var(--hairline-width) solid var(--border-main);
	}

	.expert__name {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 5vw, 2.6rem);
		color: var(--text-title);
		margin: 0;
	}

	.expert__city {
		margin: 0.35rem 0 0;
		color: var(--color-muted-text);
	}

	.expert__titles {
		list-style: none;
		margin: 0 0 2.5rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.expert__title {
		display: grid;
		grid-template-columns: 4rem 1fr;
		gap: 1rem;
		align-items: start;
	}

	.expert__year {
		font-weight: 800;
		color: var(--accent-alt);
	}

	.expert__role {
		color: var(--text-main);
		line-height: 1.6;
	}

	.expert__section-title {
		font-family: var(--font-heading);
		font-size: 1.3rem;
		color: var(--text-title);
		margin: 0 0 1rem;
	}

	.expert__festivals {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.expert__festival {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: var(--hairline-width) solid var(--border-main);
		border-radius: var(--radius-lg);
		background: var(--bg-card);
		color: var(--text-main);
		text-decoration: none;
		transition: border-color 0.2s ease;
	}

	.expert__festival:hover {
		border-color: var(--accent-alt);
	}

	.expert__festival-icon {
		display: grid;
		place-items: center;
		color: var(--accent-alt);
		flex-shrink: 0;
	}

	.expert__festival-name {
		flex: 1;
		font-weight: 700;
	}

	.expert__festival-year {
		font-weight: 400;
		color: var(--color-muted-text);
		margin-left: 0.4rem;
	}

	.expert__festival-role {
		font-size: 0.85rem;
		color: var(--color-muted-text);
	}

	/*
	 * На вузькому екрані роль переїжджає під назву: в один рядок вони не
	 * вміщаються, і назва фестивалю обрізалася б першою — тобто зникало б саме
	 * те, заради чого рядок існує.
	 */
	@media (max-width: 560px) {
		.expert__festival {
			flex-wrap: wrap;
		}

		.expert__festival-name {
			flex-basis: calc(100% - 2rem);
		}
	}
	/*
	 * `.people-grid` — ТРЕТЯ копія тих самих восьми рядків (поїздка, група, тут).
	 *
	 * Копія свідома, і борг названий там, де його вперше зважили, — у докблоці
	 * сторінки поїздки: класи розділу живуть у скоупі СТОРІНКИ, тож компонент до
	 * них не дістає (`component-styles.test.ts` це й каже), а винести їх у
	 * `global.css` означає зачепити заразом сторінку груп. Третя копія — привід
	 * це нарешті зробити, але не посеред внесення зв'язків фахівця.
	 */
	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
		gap: 1rem;
	}
	/* На телефоні — рівно двоє в рядок. Чому не `auto-fill`: складені прізвища
	   перекривають мінімум, і двадцять карток ставали двадцятьма рядками. */
	@media (max-width: 767px) {
		.people-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}
	}

	.expert__institutions {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		margin: -0.5rem 0 2rem;
		font-size: 0.95rem;
	}
	.expert__institutions-label {
		color: var(--text-muted);
	}
	.expert__institutions-sep {
		color: var(--text-muted);
	}

	.expert__news {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.expert__news-item {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md, 12px);
		background: var(--bg-surface);
		border: var(--hairline-width) solid var(--border-main);
		color: var(--text-main);
		text-decoration: none;
	}
	.expert__news-item:hover {
		border-color: var(--accent-primary);
	}
	.expert__news-date {
		color: var(--text-muted);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}
</style>
