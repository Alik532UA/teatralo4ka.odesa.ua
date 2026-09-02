<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import EditContactButton from '$lib/components/EditContactButton.svelte';
	import VerificationNoticeBanner from '$lib/components/VerificationNoticeBanner.svelte';
	import { localizedPath } from '$lib/i18n/routing';
	import { ArrowLeft, ArrowRight, Camera } from 'lucide-svelte';
	import { graduateCardHref } from '$lib/data/graduates';
	import DepartmentIcon from '$lib/components/icons/DepartmentIcon.svelte';
	import MasterGraduateFlow from '$lib/components/MasterGraduateFlow.svelte';
	import MasterFestivals from '$lib/components/adults/MasterFestivals.svelte';
	import MasterGroups from '$lib/components/adults/MasterGroups.svelte';
	import MasterProductions from '$lib/components/adults/MasterProductions.svelte';
	import { playsByIds } from '$lib/data/plays';
	import { yearsOfService, pluralKey } from '$lib/data/masters';
	import { bioParagraphs } from '$lib/utils/bioParagraphs';
	import RichTextWithFlags from '$lib/components/RichTextWithFlags.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * Вистави майстра розгортаються з ключів реєстру.
	 *
	 * Доти вони лежали в самому профілі — назва, рік, група, склад, — і та сама
	 * вистава жила окремим записом у кожного, хто про неї згадував. Тепер запис
	 * один, а профіль лише каже, які з них його.
	 */
	const masterPlays = $derived(playsByIds(data.master.playIds ?? []));

	const isEn = $derived($locale === 'en');
	const masterName = $derived(isEn ? data.master.fullNameEn : data.master.fullName);

	const paragraphs = $derived(bioParagraphs(data.master.bio));
	const displayName = $derived(isEn ? data.master.displayNameEn : data.master.displayName);
	// Одна перевірка одного факту: доти `isHonorary` і `status` перевірялися
	// поряд, хоч означали те саме.
	const isHonorary = $derived(data.master.status === 'honorary');
	/*
	 * Рік читається тут, а не всередині `yearsOfService`: незакритий термін
	 * міряється «до сьогодні», а сторінка пререндерена. Функція, яка сама дивиться
	 * на годинник, дала б у зібраному HTML одне число, а після гідратації — інше.
	 */
	const yearsInSchool = $derived(yearsOfService(data.master.periods, new Date().getFullYear()));

	/*
	 * Кнопка на СВОЮ сторінку випускника — у того, хто цю школу закінчував.
	 *
	 * Сторінки лишаються дві навмисно: `code` випускника (`Alik`,
	 * `nadiia-rybakova`) — це сама адреса зі старого сайту, і третьої на ту саму
	 * людину бути не мусить. Причини й перелік — у `data/dualRole.ts`.
	 *
	 * `graduateCardHref`, а не `graduateProfilePath`: у шести з одинадцяти цих
	 * людей власної сторінки немає, і адресу картки в галактиці дає лише він.
	 */
	const graduateHref = $derived(
		data.alsoGraduate ? graduateCardHref(data.alsoGraduate, isEn ? 'en' : 'uk') : null
	);

	/*
	 * Стану контактних меню тут БІЛЬШЕ НЕМАЄ: і те, що біля портрета, і те, що
	 * в куті картки, веде `EditContactButton`. Разом із ним пішли дві копії
	 * розмітки, дві копії стилів, два таймери закриття й спільний обробник
	 * кліку повз меню — усе це жило тут у двох примірниках, які встигли
	 * розійтися.
	 */
</script>

<svelte:head>
	<title>{masterName} — {$t('nav.residents', { default: 'Резиденти' })} — Одеська театральна школа</title>
	<meta
		name="description"
		content="{masterName}, майстер курсу Одеської театральної школи."
	/>
</svelte:head>

<div class="master-page" data-testid="master-profile-section">
	<div class="container master-page__container">
		<!-- Хлібні крихти / Навігація назад -->
		<div class="master-page__nav clears-logo">
			<a
				href={localizedPath('/residents/adults/', isEn ? 'en' : 'uk')}
				class="back-btn"
				data-testid="master-profile-back-link"
			>
				<ArrowLeft size={18} aria-hidden="true" />
				<span>{$t('galaxy.allTeachers', { default: 'Всі дорослі' })}</span>
			</a>

			<a
				href={localizedPath('/projects/galaxy-graduates/', isEn ? 'en' : 'uk')}
				class="back-btn back-btn--forward"
				data-testid="master-profile-galaxy-link"
			>
				<span>{$t('galaxy.title')}</span>
				<ArrowRight size={18} aria-hidden="true" />
			</a>
		</div>

		<VerificationNoticeBanner status={data.master.verificationStatus} />

		<div class="master-page__layout">
			<!-- ЛІВА КОЛОНКА: Інформація про майстра курсу -->
			<article class="master-card" data-testid="master-profile-card">
				<div class="master-header">
					<!-- Аватар майстра / заглушка камера з кнопкою + якщо фото немає -->
					<div class="avatar-container">
						{#if data.master.photo}
							<img
								src={data.master.photo}
								alt={masterName}
								class="avatar-img"
								class:avatar-img--honorary={isHonorary}
								width="160"
								height="160"
								data-testid="master-profile-avatar-img"
							/>
						{:else}
							<div
								class="avatar-placeholder"
								aria-label={$t('galaxy.noPhoto', { default: 'Фото очікується' })}
								data-testid="master-profile-avatar-icon"
							>
								<Camera size={48} aria-hidden="true" />
							</div>

							<!--
								Кнопка «+» біля фото: її показують лише там, де фото
								немає, і просить вона саме фото, а не правки.
							-->
							<span class="avatar-add">
								<EditContactButton
									testIdPrefix="master-profile-contact"
									buttonTestId="master-profile-add-btn"
									icon="plus"
									openTo="down"
									hasPhoto={false}
									label={$t('common.contact', {
										default: "Додати фото або зв'язатися з адміністратором"
									})}
								/>
							</span>
						{/if}
					</div>

					<div class="master-title-wrap">
						<h1 class="master-name" data-testid="master-profile-title">{displayName}</h1>

						{#if data.master.roleTitle}
							<p class="master-role-title" data-testid="master-profile-role-title">
								{data.master.roleTitle}
							</p>
						{/if}

						{#if isHonorary}
							<span class="honorary-badge" data-testid="master-profile-honorary-badge">
								<span>{$t('galaxy.honoraryMaster', { default: "Світлої пам'яті викладача" })}</span>
							</span>
						{/if}

						{#if data.master.departments.length > 0}
							<div class="dept-list" data-testid="master-profile-dept-list">
								{#each data.master.departments as dept (dept)}
									<span class="dept-pill">
										<DepartmentIcon department={dept} size={16} />
										<span>{$t(`galaxy.departments.${dept}`, { default: dept })}</span>
									</span>
								{/each}
							</div>
						{/if}

						{#if data.master.subjects && data.master.subjects.length > 0}
							<p class="master-subjects" data-testid="master-profile-subjects-text">
								{data.master.subjects.join(' · ')}
							</p>
						{/if}

						<!--
							Сума років, а не самі роки: терміни бувають із перервою
							(«2012–2016, 2022 — дотепер»), і перелік діапазонів читається
							як службовий запис, а не як факт про людину. `null` означає
							«термінів не записано» — тоді рядка немає взагалі, а не «0».
						-->
						{#if yearsInSchool !== null}
							<p class="master-years" data-testid="master-profile-years-text">
								{$t(`galaxy.yearsInSchool${pluralKey(yearsInSchool)}`, {
									values: { count: yearsInSchool },
									default: `${yearsInSchool} р. у школі`
								})}
							</p>
						{/if}

						<!--
							Тут, а не в хлібних крихтах: це факт про саму людину («я тут
							учився»), а не навігація по розділах сайту. У крихтах він стояв
							би третьою стрілкою поряд із «Всі дорослі» й «Галактика», тобто
							читався б як ще один розділ.
						-->
						{#if graduateHref && data.alsoGraduate}
							<a
								href={graduateHref}
								class="graduate-link"
								data-testid="master-profile-graduate-link"
							>
								<span>{$t('galaxy.graduatePageLink', { default: 'Сторінка випускника' })}</span>
								{#if data.alsoGraduate.graduationYear}
									<span class="graduate-link__year">{data.alsoGraduate.graduationYear}</span>
								{/if}
								<ArrowRight size={16} aria-hidden="true" />
							</a>
						{/if}
					</div>
				</div>

				{#if paragraphs.length}
					<div class="master-bio" data-testid="master-profile-bio-section">
						<h2 class="master-bio__title">{$t('galaxy.bioTitle', { default: 'Про викладача' })}</h2>
						<!--
							Ключ — індекс, і це свідомо: абзаци не додаються, не зникають і не
							міняються місцями, бо весь перелік перечитується з одного рядка
							`bio`. Іншого ключа тут просто немає — сам текст абзацу в ролі
							ключа впав би на двох однакових абзацах.
						-->

						<!--
							Текст абзацу йде через `RichTextWithFlags`, а не в шаблон
							напряму: у біографіях бувають посилання — у Михайла Дроботова
							це сайт театру, де він тридцять років грав. Голий рядок показав
							би `[назва](адреса)` дослівно, а `{@html}` тут неприйнятний. Той
							самий компонент малює прапори країн в анкетах випускників, тож
							розбір розмітки в проєкті один.
						-->
						{#each paragraphs as paragraph, index (index)}
							<p class="master-bio__text" data-testid="master-profile-bio-item-{index}">
								<RichTextWithFlags
									text={paragraph}
									linkTestIdPrefix="master-profile-bio-item-{index}"
								/>
							</p>
						{/each}
					</div>
				{/if}

				<!-- Кнопка «олівець» у нижньому правому куті картки. -->
				<div class="card-edit-wrap">
					<EditContactButton
						testIdPrefix="master-profile-card-contact"
						buttonTestId="master-profile-edit-btn"
						openTo="up"
						hasPhoto={!!data.master.photo}
					/>
				</div>
			</article>

			<!-- ПРАВА КОЛОНКА: Вертикальний потік учнів знизу-вверх -->
			<div class="master-flow-wrapper">
				<MasterGraduateFlow students={data.students} {masterName} />
			</div>
		</div>

		{#if data.groups.length > 0}
			<div class="master-section-layer">
				<MasterGroups groups={data.groups} {isEn} />
			</div>
		{/if}

		<!-- Порожній перелік секцію не малює — умова всередині компонента. -->
		<div class="master-section-layer">
			<MasterFestivals masterId={data.master.id} />
		</div>

		{#if masterPlays.length > 0}
			<div class="master-section-layer">
				<MasterProductions productions={masterPlays} {isEn} />
			</div>
		{/if}
	</div>
</div>

<style>
	.master-page {
		padding: clamp(1.5rem, 3.5vw, 3rem) 0 4rem;
		min-height: 80dvh;
	}

	.master-page__container {
		max-width: var(--max-width, 1200px);
		margin: 0 auto;
		padding: 0 1rem;
	}

	/*
	 * Два шляхи, а не один: назад до переліку дорослих і вперед до галактики.
	 * `wrap` — бо разом підписи довші за вузький екран, і на iPhone SE другий
	 * лягає на свій рядок замість того, щоб вилізти за край.
	 */
	.master-page__nav {
		position: relative;
		z-index: 2;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		text-decoration: none;
		font-size: 0.92rem;
		font-weight: 600;
		box-shadow: var(--shadow-main);
		transition: background var(--transition-base, 0.25s ease), transform var(--transition-base, 0.25s ease), border-color var(--transition-base, 0.25s ease);
	}

	.back-btn:hover {
		border-color: var(--accent-primary);
		transform: translateX(-3px);
	}

	/*
	 * Складений добір, а не самотній модифікатор: у Svelte `.back-btn:hover`
	 * має ту саму вагу, і правило нижче лише випадково перемагало б порядком.
	 */
	.master-page__nav .back-btn--forward:hover {
		transform: translateX(3px);
	}

	.master-page__layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		align-items: start;
	}

	@media (min-width: 860px) {
		.master-page__layout {
			grid-template-columns: 1.15fr 0.85fr;
			gap: 2.5rem;
		}
	}

	/* Master Card */
	.master-card {
		position: relative;
		z-index: 2;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: var(--radius-xl, 24px);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		padding-bottom: 4.5rem;
		box-shadow: var(--shadow-main);
	}

	.master-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 580px) {
		.master-header {
			flex-direction: row;
			align-items: center;
			text-align: left;
		}
	}

	/* Avatar Container & Button */
	.avatar-container {
		position: relative;
		width: 140px;
		height: 140px;
		flex-shrink: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--accent-primary);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.avatar-img--honorary {
		filter: grayscale(100%);
		transition: filter 10s ease;
	}

	.avatar-container:hover .avatar-img--honorary,
	.avatar-img--honorary:hover {
		filter: grayscale(0%);
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-surface);
		border: 2px dashed var(--border-main);
		color: var(--accent-text);
	}

	/* Card Edit Button in bottom right */
	.card-edit-wrap {
		position: absolute;
		bottom: 1.25rem;
		right: 1.25rem;
		left: auto;
		z-index: 20;
	}

	/* Titles */
	.master-title-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.master-name {
		margin: 0;
		font-size: clamp(1.5rem, 3vw, 2.2rem);
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}

	.master-role-title {
		margin: 0.2rem 0 0.4rem;
		font-size: 1rem;
		line-height: 1.45;
		color: var(--text-muted);
		font-weight: 500;
	}

	.honorary-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.2rem;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 500;
		width: fit-content;
	}

	.dept-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}

	.dept-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.75rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-title);
		font-size: 0.88rem;
		font-weight: 500;
	}

	.master-years {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	/*
	 * Акцентна рамка, а не типова `--border-main`, як у `.dept-pill`: пілюлі
	 * поряд — це ПІДПИСИ (відділення, предмети, роки), і посилання, вбране так
	 * само, читалося б як ще один підпис. Решта — з `.back-btn`, бо це та сама
	 * річ: перехід на іншу сторінку.
	 */
	.graduate-link {
		display: inline-flex;
		align-items: center;
		/* Батько — колонка-flex, тож `inline-flex` сам по собі розтягується на
		   всю ширину картки й пілюля перестає бути пілюлею. */
		align-self: flex-start;
		gap: 0.5rem;
		margin-top: 0.7rem;
		padding: 0.45rem 1rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-card);
		border: 1px solid var(--accent-primary);
		color: var(--text-title);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background var(--transition-base, 0.25s ease), transform var(--transition-base, 0.25s ease);
	}

	.graduate-link:hover {
		background: var(--bg-surface);
		transform: translateX(3px);
	}

	.graduate-link__year {
		color: var(--text-muted);
		font-weight: 500;
	}

	.master-subjects {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	.master-bio {
		border-top: 1px solid var(--border-main);
		padding-top: 1.5rem;
	}

	.master-bio__title {
		margin: 0 0 0.75rem;
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-title);
	}

	.master-bio__text {
		margin: 0;
		font-size: 1rem;
		line-height: 1.65;
		color: var(--text-main);
	}

	/*
	 * Відступ між СУСІДНІМИ абзацами, а не на кожному.
	 *
	 * `margin: 0` вище лишається: доки біографія була одним рядком, це прибирало
	 * зайвий проміжок під заголовком «Про викладача». Щойно абзаців стало сім,
	 * той самий нуль склеїв їх у суцільну плиту тексту — заміряно на сторінці
	 * Володимира Туманова. Сусідній селектор додає проміжок лише там, де він і
	 * потрібен: МІЖ абзацами, не перед першим і не після останнього.
	 */
	.master-bio__text + .master-bio__text {
		margin-top: 0.8rem;
	}

	.master-flow-wrapper {
		display: flex;
		justify-content: center;
	}
	.master-section-layer {
		position: relative;
		z-index: 2;
	}
</style>
