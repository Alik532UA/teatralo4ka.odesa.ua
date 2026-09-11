<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { localizedPath } from '$lib/i18n/routing';
	import { asset } from '$app/paths';
	import {
		Theater,
		Users,
		GraduationCap,
		Calendar,
		Trophy
	} from 'lucide-svelte';
	import { showsCountryName } from '$lib/data/festivals';
	import type { PageData } from './$types';
	import { graduationCaption, rosterOrder } from '$lib/data/graduates';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import {
		closeGraduateModal,
		graduateFromPageState,
		openGraduateModal
	} from '$lib/services/graduateModal.svelte';
	import GroupPersonCard from '$lib/components/GroupPersonCard.svelte';
	import GroupPlaysTimeline from '$lib/components/GroupPlaysTimeline.svelte';
	import GroupPhotoBanner from '$lib/components/GroupPhotoBanner.svelte';
	import PhotoLightbox from '$lib/components/PhotoLightbox.svelte';
	import { imageSize, type LocalImage } from '$lib/config/localImages';
	import EditContactButton from '$lib/components/EditContactButton.svelte';
	import VerificationNoticeBanner from '$lib/components/VerificationNoticeBanner.svelte';
	import GalaxyBreadcrumb from '$lib/components/galaxy/GalaxyBreadcrumb.svelte';
	import GraduateVideoButton from '$lib/components/GraduateVideoButton.svelte';
	import FestivalVideoPreview from '$lib/components/galaxy/FestivalVideoPreview.svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';

	let { data }: { data: PageData } = $props();

	const isEn = $derived($locale === 'en');
	const currentLang = $derived<'uk' | 'en'>(isEn ? 'en' : 'uk');

	/*
	 * Вибір живе в СТАНІ СТОРІНКИ, а не в локальному `$state`: тоді відкрита
	 * картка має власну адресу, «назад» її закриває, а посилання можна
	 * скопіювати. Те саме рішення, що й на сторінці групи.
	 */
	const selectedGraduate = $derived(graduateFromPageState());

	/**
	 * Склад поїздки щоразу в новому порядку — але ВСЕРЕДИНІ своєї групи.
	 *
	 * Прохання автора — чотири групи, кожна перемішана всередині себе: у
	 * галактиці з фотографією, у галактиці без неї, поза галактикою з
	 * фотографією, поза галактикою без. Розбір самих груп — у `rosterOrder`.
	 *
	 * Тому два кроки, і порядок між ними значущий: спершу Фішер—Йейтс на всьому
	 * списку, потім СТІЙКЕ сортування за `rosterOrder`. Стійкість тут і є
	 * механізмом: вона зберігає вже перемішаний порядок усередині кожної групи,
	 * тож випадковість лишається, а групи не змішуються. Сортувати перед
	 * перемішуванням не можна — друге зруйнувало б перше.
	 *
	 * Перемішування живе в `$effect`, а НЕ в тілі компонента, і це не стиль:
	 * сторінка потрапляє в prerender, тож на сервері порядок мусить лишитися тим
	 * самим, що й у готовому HTML. Перемішай його там — і гідратація побачить
	 * іншу розмітку, ніж прийшла з мережі. Ефект виконується вже в браузері.
	 *
	 * Групи при цьому правильні ще ДО ефекту: `+page.ts` віддає список уже
	 * посортованим тим самим `rosterOrder`. Тобто перший кадр і прередерений HTML
	 * показують той самий поділ, а ефект лише тасує людей усередині нього.
	 *
	 * Фішер—Йейтс, а не `sort(() => Math.random() - 0.5)`: другий дає нерівний
	 * розподіл (порівняння не транзитивне) і в частині рушіїв майже не рухає
	 * початок списку — тобто «випадковість», якої насправді немає.
	 *
	 * Викладачів це не стосується: їх у поїздці двоє-п'ятеро, і порядок там —
	 * той, у якому їх назвали.
	 */
	/** Скільки людей у розділі «Учасники»: випускники плюс працівники-учасники. */
	const учасників = $derived(data.members.length + data.memberMasters.length);

	let shuffled = $state<typeof data.members | null>(null);

	$effect(() => {
		const list = [...data.members];
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		shuffled = list.sort((a, b) => rosterOrder(a) - rosterOrder(b));
	});

	const members = $derived(shuffled ?? data.members);

	/**
	 * Дипломи в лайтбоксі — свій стан, а не спільний із банером знімків.
	 *
	 * Банер угорі має власний лайтбокс усередині себе, і він знає лише свої
	 * знімки. Спільний індекс на дві різні стопки давав би «наступний» із
	 * фотографії поїздки на диплом — тобто гортання між речами, які саме тому
	 * й розділені на два блоки.
	 */
	/**
	 * Чи є з чого зробити прев'ю запису.
	 *
	 * Не «чи є посилання»: кадр дає лише YouTube статичною адресою, Vimeo без
	 * свого API — ні. Порожній прямокутник ліворуч від каруселі був би гірший
	 * за кнопку, тож без кадру шапка лишається старою.
	 */
	const videoPreview = $derived(Boolean(parseVideoUrl(data.festival.videoUrl)?.posterUrl));

	let diplomaOpen = $state(false);
	let diplomaIndex = $state(0);

	const diplomaImages = $derived(
		(data.festival.diplomas ?? []).map((src) => ({
			src: asset(src),
			alt: `${$t('galaxy.festivalDiplomas')} — ${festivalTitle}`,
			title: festivalTitle
		}))
	);

	const festivalTitle = $derived(
		isEn && data.festival.nameEn ? data.festival.nameEn : data.festival.name
	);
	const yearsStr = $derived([...data.festival.years].sort((a, b) => a - b).join(', '));
</script>

<svelte:head>
	<title>{festivalTitle} — {$t('galaxy.festivalsTitle')} | {$t('hero.title')}</title>
</svelte:head>

<main class="fest-page" data-testid="festival-panel">
	<div class="container">
				<GalaxyBreadcrumb
			withTrail
			trailTestId="festival-from-link"
			backHref={localizedPath('/projects/galaxy-graduates/festivals/', currentLang)}
			backLabel={$t('galaxy.backToFestivals')}
			backTestId="festival-back-link"
			forwardHref={localizedPath('/projects/galaxy-graduates/', currentLang)}
			forwardLabel={$t('galaxy.title')}
			forwardTestId="festival-galaxy-link"
		/>

		<VerificationNoticeBanner status={data.festival.verificationStatus} />

		<header class="fest-header">
			<!--
				ЗАПИС І ЗНІМКИ — ПОРУЧ, а не кнопкою під назвою.

				Прохання автора: «там, де основна верхня карусель, ліворуч відео
				прев'ю, а праворуч фотографії карусель». Доти кнопка «Дивитися
				запис» стояла під заголовком — тобто головне, що є про поїздку
				(її запис), виглядало як виноска, а місце над ним займали самі
				знімки.

				Пара показується лише тоді, коли запис СПРАВДІ розпізнався:
				`videoPreview` віддає кадр лише для платформ, які дають його
				статичною адресою (сьогодні YouTube). Без запису шапка лишається
				такою, якою була, — банер на всю ширину, — і жодна сторінка без
				відео від цієї зміни не поїхала.
			-->
			{#if videoPreview}
				<div class="fest-media">
					<div class="fest-media__video">
						<FestivalVideoPreview
							videoUrl={data.festival.videoUrl}
							title={festivalTitle}
							testid="festival-video-btn"
						/>
					</div>
					<div class="fest-media__photos">
						<GroupPhotoBanner photos={data.festival.photos ?? []} title={festivalTitle} />
					</div>
				</div>
			{:else}
				<GroupPhotoBanner photos={data.festival.photos ?? []} title={festivalTitle} />
			{/if}

			<div class="fest-header__badges">
				<!--
					Кожна країна — ВЛАСНА плашка, а не всі в одній через роздільник.
					Три країни в одному овалі читалися як одне місце; окремі плашки
					одразу показують, що поїздка була до трьох різних країн.
				-->
				{#if data.festival.city}
					<span class="fest-badge" data-testid="festival-city-badge">{data.festival.city}</span>
				{/if}
				{#each data.festival.countries as code (code)}
					<span class="fest-badge" data-testid="festival-where-badge-{code}">
						<!--
							Ані підпису, ані підказки для країн зі списку «лише прапор»:
							`title` малюється браузером при наведенні, тобто це той самий
							написаний текст, якого просили не писати. Без нього
							`CountryFlag` озвучує сам код — «RU», а не назву.
						-->
						<CountryFlag
							{code}
							title={showsCountryName(code) ? $t(`galaxy.country.${code}`) : undefined}
						/>
						{#if showsCountryName(code)}
							{$t(`galaxy.country.${code}`)}
						{/if}
					</span>
				{/each}
				<span class="fest-badge" data-testid="festival-years-badge">
					<Calendar size={14} aria-hidden="true" />
					{yearsStr}
				</span>

				<!--
					Кнопка правок у тому самому рядку, що й плашки. Саме на цих
					сторінках вона потрібна найбільше: учасників фестивалів
					відновлювали листуванням, і помилку в прізвищі помітить той,
					хто там був.
				-->
				<span class="fest-header__edit">
					<EditContactButton
						testIdPrefix="festival-page-contact"
						openTo="down"
						hasPhoto={(data.festival.photos ?? []).length > 0}
					/>
				</span>
			</div>

			<h1 class="fest-header__title" data-testid="festival-title">{festivalTitle}</h1>

			{#if isEn && data.festival.name !== festivalTitle}
				<p class="fest-header__subtitle-uk">{data.festival.name}</p>
			{/if}

			<!--
				Кнопки запису тут БІЛЬШЕ НЕМАЄ — вона переїхала в пару з
				каруселлю вище (розбір там). Лишається вона лише для запису, з
				якого не виходить кадру: тоді показувати ліворуч нічого, і
				пілюля під назвою — єдиний спосіб не втратити посилання.
			-->
			{#if !videoPreview}
				<GraduateVideoButton
					videoUrl={data.festival.videoUrl}
					title={festivalTitle}
					testid="festival-video-btn"
				/>
			{/if}

			{#if data.festival.bio?.length}
				<div class="fest-header__bio">
					{#each data.festival.bio as paragraph (paragraph)}
						<p>{paragraph}</p>
					{/each}
				</div>
			{/if}
		</header>

		{#if учасників > 0}
			<section class="fest-section" aria-labelledby="section-members-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Users size={20} aria-hidden="true" /></span>
					<h2 id="section-members-title" class="section-heading__title">
						{$t('galaxy.festivalMembers')}
					</h2>
					<span class="section-heading__count">{учасників}</span>
				</div>

				<!--
					Випускник відкривається КАРТКОЮ тут, а не переходом у галактику:
					людина прийшла дивитися фестиваль, і посилання забирало б її зі
					сторінки, з якої вона щойно почала.
				-->
				<div class="people-grid" data-testid="festival-members-list">
					{#each members as member, idx (member.id)}
						{@const photoSrc = member.hasPhoto ? asset(`/graduates/${member.slug}-192.webp`) : null}
						<GroupPersonCard
							name={member.name}
							photo={photoSrc}
							subtitle={graduationCaption(member, $t)}
							onclick={() => openGraduateModal(member)}
							splitName
							index={idx}
							testid="festival-member-card-{member.slug}"
						/>
					{/each}
					<!--
						Працівники, які поїхали УЧАСНИКАМИ. Картка веде на їхню сторінку
						в «Дорослих», а не відкриває вікно випускника: вікна в них немає,
						і робити його заради одного розділу означало б другий показ тієї
						самої людини.
					-->
					{#each data.memberMasters as master, idx (master.id)}
						<GroupPersonCard
							name={isEn ? master.displayNameEn : master.displayName}
							photo={master.photo ? asset(master.photo) : null}
							href={localizedPath(`/residents/adults/${master.slug}`, currentLang)}
							splitName
							index={data.members.length + idx}
							testid="festival-member-card-{master.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!--
			Викладачі, що їздили. GraduationCap — та сама іконка, що й на розділі
			майстрів курсу: у словнику вона означає курс, тобто людей, які вчать.
		-->
		{#if data.masters.length > 0}
			<section class="fest-section" aria-labelledby="section-faculty-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"
						><GraduationCap size={20} aria-hidden="true" /></span
					>
					<h2 id="section-faculty-title" class="section-heading__title">
						{$t('galaxy.festivalTeachers')}
					</h2>
					<span class="section-heading__count">{data.masters.length}</span>
				</div>

				<!--
					Без підпису під іменем: `roleTitle` у працівників — це повна посада
					(«викладач акторської майстерності вищої категорії, методист, …»), і
					в картці 150 px вона перетворюється на стіну тексту. Хто це такі,
					каже сам заголовок розділу.
				-->
				<div class="people-grid" data-testid="festival-teachers-list">
					{#each data.masters as master, idx (master.id)}
						<GroupPersonCard
							name={isEn ? master.displayNameEn : master.displayName}
							photo={master.photo ? asset(master.photo) : null}
							href={localizedPath(`/residents/adults/${master.slug}`, currentLang)}
							index={учасників + idx}
							testid="festival-teacher-card-{master.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.plays.length > 0}
			<section class="fest-section" aria-labelledby="section-plays-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Theater size={20} aria-hidden="true" /></span>
					<h2 id="section-plays-title" class="section-heading__title">
						{$t('galaxy.festivalPlays')}
					</h2>
					<span class="section-heading__count">{data.plays.length}</span>
				</div>

				<GroupPlaysTimeline plays={data.plays} />
			</section>
		{/if}

		<!--
			ДИПЛОМИ — ОКРЕМИМ розділом, і ПІДРЯД, а не по черзі.

			Два прохання автора, і друге виправляє моє ж перше рішення. Спершу:
			«думаю основні зображення та дипломи мають бути в різних блоках» —
			причина змістовна, бо на знімок поїздки дивляться, а диплом читають.
			Потім, побачивши результат: «в два рази менше, і без каруселі, просто
			підряд ідуть».

			Карусель була помилкою саме тут. Вона створена для знімків, яких
			БАГАТО й які рівноцінні: гортання економить висоту сторінки. Дипломів
			двоє-троє, вони різні (різні номінації, різні люди), і сховати другий
			за стрілкою означає сховати половину нагород поїздки. Підряд усі
			видно одразу, і висоти це коштує менше, ніж здається: аркуш удвічі
			нижчий за банер.

			Лайтбокс лишається — без нього диплом на 300 px нечитабельний, а
			читають його саме заради тексту.
		-->
		{#if data.festival.diplomas?.length}
			<section class="fest-section" aria-labelledby="section-diplomas-title">
				<div class="section-heading">
					<span class="icon-wrap icon-wrap--primary"><Trophy size={20} aria-hidden="true" /></span>
					<h2 id="section-diplomas-title" class="section-heading__title">
						{$t('galaxy.festivalDiplomas')}
					</h2>
					<span class="section-heading__count">{data.festival.diplomas.length}</span>
				</div>

				<ul class="diplomas" data-testid="festival-diplomas-list">
					{#each data.festival.diplomas as diploma, i (diploma)}
						{@const size = imageSize(diploma as LocalImage)}
						<li>
							<button
								type="button"
								class="diplomas__btn"
								onclick={() => {
									diplomaIndex = i;
									diplomaOpen = true;
								}}
								data-testid="festival-diploma-btn-{i}"
							>
								<img
									src={asset(diploma)}
									alt="{$t('galaxy.festivalDiplomas')} — {festivalTitle}"
									width={size.width}
									height={size.height}
									loading="lazy"
									decoding="async"
								/>
							</button>
						</li>
					{/each}
				</ul>

				<PhotoLightbox
					images={diplomaImages}
					currentIndex={diplomaIndex}
					isOpen={diplomaOpen}
					onclose={() => (diplomaOpen = false)}
				/>
			</section>
		{/if}

		<!--
			Склад і показ вносять поступово, тож сторінка може лишитися без обох.
			Порожня сторінка мовчки — гірше за сторінку, яка каже, чого на ній ще
			немає: інакше читач вирішить, що зламалося.
		-->
		{#if data.members.length === 0 && data.masters.length === 0 && data.plays.length === 0}
			<p class="fest-empty" data-testid="festival-empty-text">
				{$t('galaxy.festivalEmpty')}
			</p>
		{/if}
	</div>
</main>

<!-- Та сама картка, що й у галактиці та на сторінці групи. -->
<GraduateCard showGalaxyLink graduate={selectedGraduate} onclose={closeGraduateModal} />

<style>
	.fest-page {
		position: relative;
		min-height: 100dvh;
		padding: 2rem 1rem 5rem;
		color: var(--text-main, #f0f2f5);
	}

	/*
	 * БЕЗ `display: flex`, і це не смак, а виправлення поломки.
	 *
	 * Перша редакція центрувала банер флексом — і аркуші зникли зовсім:
	 * лишилися заголовок, стрілки й крапки над порожнечею. Причина в будові
	 * самого банера: всі знімки в ньому `position: absolute`, тобто власного
	 * вмісту в коробки немає, а висоту їй дає `aspect-ratio`. Блоковий елемент
	 * від цього не страждає — він займає ширину батька. Флекс-елемент натомість
	 * міряється вмістом, а вмісту нуль, тож ширина стала нульовою разом із
	 * висотою.
	 *
	 * Центрування банер робить сам — `margin: 0 auto` всередині нього. Тут
	 * потрібен лише звичайний блок.
	 *
	 * Мій власний замір це показував і був прочитаний неправильно: перевірка в
	 * прихованій панелі браузера віддала ширину 0, а я списав її на відому ваду
	 * панелі (вона справді віддає нуль для всієї сторінки). Урок: нуль від
	 * панелі не доводить нічого, але й не спростовує — перевіряти треба
	 * величину, яка від ширини панелі не залежить, наприклад `offsetHeight`
	 * коробки або видимість знімка.
	 */
	/**
	 * Пара «запис — знімки»: дві колонки, що стають одна під одною.
	 *
	 * Частки 1fr на кадр і 1.2fr на карусель, а не порівну: у кадру YouTube
	 * стала пропорція 16:9, а стопка знімків має свою на кожен кадр і серед
	 * них бувають ВЕРТИКАЛЬНІ — при рівних колонках такий знімок ставав удвічі
	 * нижчим за сусідній кадр. Трохи ширша права колонка вирівнює їх на око.
	 *
	 * Межа переходу в стовпчик — 860 px, а не типові 768: нижче цього кадр
	 * стає надто дрібним, щоб на ньому щось розібрати, і два елементи один під
	 * одним читаються краще, ніж два стиснуті поруч.
	 */
	.fest-media {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 1.25rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	@media (max-width: 860px) {
		.fest-media {
			grid-template-columns: 1fr;
		}
	}

	/* Банер усередині пари не тримає власної стелі 820 px: колонка вже вужча. */
	.fest-media__photos :global(.banner) {
		max-width: 100%;
	}

	/**
	 * Аркуші підряд, а не стопкою з гортанням.
	 *
	 * `flex-wrap` замість сітки з фіксованим числом колонок: дипломів буває
	 * один, два або п'ять, і колонка, задана наперед, у першому випадку лишає
	 * порожнє місце, а в останньому ріже рядок навпіл. Обгортання розкладає
	 * стільки, скільки влізло, і центрує залишок.
	 *
	 * 300 px — «удвічі менше», як просив автор: банер віддавав аркушу 600.
	 */
	.diplomas {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.25rem;
	}

	.diplomas__btn {
		display: block;
		padding: 0;
		border: none;
		background: none;
		cursor: zoom-in;
		border-radius: 10px;
	}

	.diplomas__btn:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 4px;
	}

	.diplomas img {
		display: block;
		height: 300px;
		width: auto;
		max-width: 100%;
		border-radius: 10px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
		transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.diplomas__btn:hover img,
	.diplomas__btn:focus-visible img {
		transform: scale(1.03);
	}

	@media (max-width: 560px) {
		.diplomas img {
			height: 220px;
		}
	}

	/* Складений добір: сам модифікатор має ту саму вагу, що й правило вище. */
	.fest-header {
		margin-bottom: 3rem;
		text-align: center;
	}
	.fest-header__edit {
		display: inline-flex;
		margin-left: auto;
	}
	.fest-header__badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem;
		margin-bottom: 1rem;
	}
	.fest-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.85rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 600;
	}
	.fest-header__title {
		margin: 0;
		font-size: clamp(1.8rem, 5vw, 3rem);
		font-weight: 800;
		color: var(--text-title);
		text-wrap: balance;
	}
	.fest-header__subtitle-uk {
		margin: 0.4rem 0 0;
		font-size: 1rem;
		color: var(--text-muted);
	}
	.fest-header__bio {
		max-width: 65ch;
		margin: 1.2rem auto 0;
		text-align: left;
		color: var(--text-main);
		line-height: 1.65;
	}

	.fest-section {
		margin-bottom: 3.5rem;
	}
	.section-heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.section-heading__title {
		margin: 0;
		font-size: clamp(1.2rem, 3vw, 1.6rem);
		font-weight: 700;
		color: var(--text-title);
	}
	.section-heading__count {
		display: grid;
		place-items: center;
		min-width: 1.8rem;
		height: 1.8rem;
		padding: 0 0.45rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.82rem;
		font-weight: 700;
	}
	.icon-wrap {
		display: inline-grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: var(--radius-md, 12px);
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
	}
	.icon-wrap--primary {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
	}
	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
		gap: 1rem;
	}

	/*
	 * На телефоні — рівно ДВОЄ в рядок, як на сторінці групи.
	 *
	 * `auto-fill` із мінімумом у 150px мав би пускати двох і сюди, але не
	 * пускав: грид-елемент із типовим `min-width: auto` не вужчий за свій
	 * найдовший рядок, а складені прізвища цей мінімум перекривають —
	 * найдовше ім'я реєстру, «Олександра Індічанська (Морозова)», має 33
	 * знаки. Через це двадцять чотири учасники займали двадцять чотири рядки,
	 * тоді як у групі поруч ті самі картки стояли парами.
	 *
	 * Тут ширину задає не мінімум, а саме число колонок.
	 */
	@media (max-width: 767px) {
		.people-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}
	}

	.fest-empty {
		max-width: 55ch;
		margin: 0 auto;
		text-align: center;
		color: var(--text-muted);
		line-height: 1.6;
	}
</style>
