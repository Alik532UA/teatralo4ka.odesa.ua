<script lang="ts">
	import { onMount } from "svelte";
	import { t, locale } from "svelte-i18n";
	import { FileText } from "lucide-svelte";
	import { browser } from "$app/environment";
	import { asset } from "$app/paths";
	import { safeUrl } from "$lib/utils/safeUrl";
	import DepartmentIcon from "$lib/components/icons/DepartmentIcon.svelte";
	import RichTextWithFlags from "$lib/components/RichTextWithFlags.svelte";
	import GraduateFormModal from "$lib/components/GraduateFormModal.svelte";
	import GraduateVideoButton from "$lib/components/GraduateVideoButton.svelte";
	import GraduateYears from "$lib/components/GraduateYears.svelte";
	import { customScroll } from "$lib/utils/customScroll";
	import {
		getMasterById,
		masterProfilePath,
		relationSubjects,
	} from "$lib/data/masters";
	import { localizedPath } from "$lib/i18n/routing";
	import { getGroupsByMember } from "$lib/data/groups";
	import GraduateFestivals from "$lib/components/GraduateFestivals.svelte";
	import GroupMatesRow from "$lib/components/GroupMatesRow.svelte";
	import { getFestivalsByMember } from "$lib/data/festivals";
	import {
		graduatePhoto,
		graduatePhotoSrcset,
		allGraduatePhotos,
		type Department,
		type GraduateIndexEntry,
		type GraduateProfile,
	} from "$lib/data/graduates";

	interface Props {
		/** Запис з індексу — є завжди, навіть коли подробиць немає. */
		graduate: GraduateIndexEntry;
		/** Подробиці зі `static/graduates/profiles`. `null` — ще не прийшли або їх немає. */
		profile: GraduateProfile | null;
		/** Id заголовка: модалка підв'язує до нього `aria-labelledby`. */
		headingId?: string;
		/** `h2` у модалці, `h1` на власній сторінці. */
		heading?: "h1" | "h2";
	}

	let { graduate, profile, headingId, heading = "h2" }: Props = $props();

	let formModalOpen = $state(false);

	/** Мультифото: стопка на профілі з кліком для циклу. */
	const photoCount = $derived(graduate.photoCount ?? 1);
	const profilePhotos = $derived(
		photoCount > 1 ? allGraduatePhotos(graduate.slug, photoCount, 480) : [],
	);
	let activePhotoIndex = $state(0);

	// Починаємо з основного (поточного) фото — останнє в масиві
	$effect(() => {
		if (profilePhotos.length > 0) {
			activePhotoIndex = profilePhotos.length - 1;
		}
	});

	function cyclePhoto() {
		if (profilePhotos.length <= 1) return;
		activePhotoIndex = (activePhotoIndex + 1) % profilePhotos.length;
	}

	function setPhoto(index: number) {
		activePhotoIndex = index;
	}

	function syncFormUrl(open: boolean) {
		if (!browser) return;
		const url = new URL(window.location.href);
		if (open) {
			url.searchParams.set("form", "open");
		} else {
			url.searchParams.delete("form");
		}
		window.history.replaceState(window.history.state, "", url.href);
	}

	onMount(() => {
		if (browser) {
			const param = new URL(window.location.href).searchParams.get(
				"form",
			);
			if (param === "open" || param === "true") {
				formModalOpen = true;
			}
		}
	});

	function openForm() {
		formModalOpen = true;
		syncFormUrl(true);
	}

	function closeForm() {
		formModalOpen = false;
		syncFormUrl(false);
	}

	let playsCardEl = $state<HTMLElement | null>(null);
	let playsListEl = $state<HTMLUListElement | null>(null);

	let rightColEl = $state<HTMLElement | null>(null);

	let centerColEl = $state<HTMLElement | null>(null);

	const isEn = $derived($locale === "en");
	const enrollmentYears = $derived(
		profile?.enrollmentYears ?? graduate.enrollmentYears ?? [],
	);
	/**
	 * Групи беруться зі ЗВ'ЯЗКУ, а не з рядка в анкеті.
	 *
	 * Доти картка малювала назви, які людина вписала, і шукала до них групу за
	 * назвою — з 83 таких згадок на наявну групу вели 54. Решта малювалися
	 * простим текстом, і виглядало це так само, як робоче посилання.
	 *
	 * Тепер справжні групи приходять із `memberIds`, тож кожна з них — посилання.
	 * Слідом ідуть назви, яким сторінки ще немає: вони лишаються текстом, але
	 * тепер це видно й у даних, а не лише на екрані.
	 */
	const hasFestivals = $derived(getFestivalsByMember(graduate.id).length > 0);

	/*
	 * Фестивалі їдуть у ту колонку, де більше місця.
	 *
	 * Заміряються НЕ самі колонки, а їхній решта вміст: плашка вистав ліворуч
	 * проти плашок «Про себе» й викладачів праворуч. Це не педантизм —
	 * інакше перенос замкнув би сам себе: поставлений ліворуч блок робить ліву
	 * колонку вищою, наступний замір відправив би його назад, і так по колу.
	 *
	 * У Чалчинського вісім вистав і довге «Про себе» — фестивалі стають
	 * ліворуч; в Аліка вистав двадцять, і ліворуч місця немає — лишаються
	 * праворуч.
	 */
	let festivalsInLeft = $state(false);

	function recalcFestivalsColumn() {
		if (!browser || !hasFestivals) return;
		// На вузькому екрані колонки одна під одною — переносити нема куди.
		if (window.innerWidth < 769 || !playsCardEl || !rightColEl) {
			festivalsInLeft = false;
			return;
		}
		const left = playsCardEl.offsetHeight;
		const right = [...rightColEl.children]
			.filter((el) => !el.classList.contains("bento-card--festivals"))
			.reduce((sum, el) => sum + (el as HTMLElement).offsetHeight, 0);
		// Запас, щоб блок не стрибав від різниці в десяток пікселів.
		festivalsInLeft = left > 0 && left + 120 < right;
	}

	/*
	 * Спостерігач, а не один замір на монтуванні.
	 *
	 * Перший замір трапляється, коли висоти ще не усталилися — шрифти й портрети
	 * лише вантажаться, а `recalcPlaysFitting` узагалі стискає список ПІСЛЯ
	 * нього. Заміряно на цьому й попалося: в Аліка блок їхав ліворуч, дарма що
	 * ліва плашка 792 px проти 742 px праворуч.
	 *
	 * Замкнутися спостерігач не може: жодна з двох величин, які порівнюються,
	 * від переїзду блока не залежить.
	 */
	$effect(() => {
		if (!browser) return;
		const _ = profile?.plays?.length;
		const __ = profile?.bio?.length;
		const ___ = normalizedTeachers.length;

		recalcFestivalsColumn();
		const ro = new ResizeObserver(() => recalcFestivalsColumn());
		if (playsCardEl) ro.observe(playsCardEl);
		if (rightColEl) ro.observe(rightColEl);
		const onResize = () => recalcFestivalsColumn();
		window.addEventListener("resize", onResize);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", onResize);
		};
	});

	/*
	 * Довга назва групи в пілюлі ламається на три рядки й розпихає картку.
	 * Порядок дій той самий, що зробила б людина: спершу взяти коротку назву,
	 * якої група й так уже має («Захисники театральних куліс» → «ЗТК»), а якщо
	 * її немає — зменшити кегль. Повна назва лишається в `title`, тож нічого не
	 * втрачається.
	 */
	const LONG_NAME = 18;
	const groupLinks = $derived<
		{ name: string; full: string; slug?: string; long: boolean }[]
	>([
		...getGroupsByMember(graduate.id).map((g) => {
			const full = isEn && g.nameEn ? g.nameEn : g.name;
			const name = full.length > LONG_NAME && g.abbr ? g.abbr : full;
			return { name, full, slug: g.slug, long: name.length > LONG_NAME };
		}),
		...(profile?.unlinkedGroups ?? []).map((name) => ({
			name,
			full: name,
			long: name.length > LONG_NAME,
		})),
	]);
	const departments = $derived<Department[]>(
		profile?.departments && profile.departments.length > 0
			? profile.departments
			: (graduate.departments ?? []),
	);

	const rawMasters = $derived(profile?.masters ?? graduate.masters ?? []);
	const normalizedMasters = $derived(
		rawMasters.map((m) => {
			const id =
				typeof m === "object" && m.id
					? m.id
					: typeof m === "string"
						? m
						: undefined;
			const masterInfo = id ? getMasterById(id) : undefined;
			const isEn = $locale === "en";
			const displayName = masterInfo
				? isEn
					? masterInfo.displayNameEn
					: masterInfo.displayName
				: typeof m === "string"
					? m
					: m.name;
			const fullName = masterInfo
				? isEn
					? masterInfo.fullNameEn
					: masterInfo.fullName
				: typeof m === "string"
					? m
					: m.name;
			const dept =
				typeof m === "object" && m.department
					? m.department
					: (masterInfo?.departments[0] ?? null);
			const slug = masterInfo?.slug ?? id;
			const href = slug
				? masterProfilePath(slug, isEn ? "en" : "uk")
				: null;
			return {
				id,
				slug,
				displayName,
				fullName,
				department: dept,
				photo: masterInfo?.photo ?? null,
				href
			};
		}),
	);

	const rawTeachers = $derived(profile?.teachers ?? graduate.teachers ?? []);
	const normalizedTeachers = $derived(
		rawTeachers.map((t) => {
			const id =
				typeof t === "object" && t.id
					? t.id
					: typeof t === "string"
						? t
						: undefined;
			const masterInfo = id ? getMasterById(id) : undefined;
			const isEn = $locale === "en";
			const displayName = masterInfo
				? isEn
					? masterInfo.displayNameEn
					: masterInfo.displayName
				: typeof t === "string"
					? t
					: t.name;
			const fullName = masterInfo
				? isEn
					? masterInfo.fullNameEn
					: masterInfo.fullName
				: typeof t === "string"
					? t
					: t.name;
			const dept =
				typeof t === "object" && t.department
					? t.department
					: (masterInfo?.departments[0] ?? null);
			/*
			 * Предмети САМЕ ЦЬОГО зв'язку, а не все, що майстер викладає.
			 *
			 * Порядок джерел важливий і саме в такому вигляді виправляє скаргу
			 * автора: у профілі випускника поруч з Імасом стояло «(Риторика та
			 * поетика, акторська майстерність)», хоча цей випускник мав у нього
			 * лише риторику. Причина була не в показі, а в даних — у записі
			 * зв'язку лежала рукописна копія повного переліку майстра, — але поки
			 * зв'язок мав вільний рядок, зіставити його з переліком майстра не міг
			 * ніхто. Тепер обидві сторони описані переліком.
			 *
			 * Останній рядок — власний перелік майстра — це ФОЛБЕК на випадок «у
			 * зв'язку не записано». Він каже «ось що ця людина викладає», а не «ось
			 * що вона викладала цьому випускникові»; різницю тримає інваріант
			 * `src/faculty-relations.test.ts`, який не дає з'явитися зв'язку з
			 * предметом, якого в майстра немає.
			 */
			const subject =
				typeof t === "object" && relationSubjects(t).length > 0
					? relationSubjects(t).join(", ")
					: (masterInfo?.subjects?.join(", ") ?? null);
			const slug = masterInfo?.slug ?? id;
			const href = slug
				? masterProfilePath(slug, isEn ? "en" : "uk")
				: null;
			return {
				id,
				slug,
				displayName,
				fullName,
				department: dept,
				subject,
				photo: masterInfo?.photo ?? null,
				href,
			};
		}),
	);

	// Лише з профілю: в індексі посилань більше немає, і запасний шлях звідти
	// був би мертвим кодом, який мовчки показує порожньо.
	const socials = $derived(profile?.socials ?? []);
	const hasPlays = $derived(Boolean(profile && profile.plays.length > 0));
	const hasAnyPlayYear = $derived(
		Boolean(profile?.plays.some((p) => Boolean(p.year))),
	);
	const hasBio = $derived(
		Boolean(
			profile &&
				(profile.duringStudies ||
					profile.afterGraduation ||
					profile.bio.length > 0 ||
					profile.festivals.length > 0),
		),
	);

	const totalFaculty = $derived(
		normalizedMasters.length + normalizedTeachers.length,
	);
	// Якщо майстри + викладачі > 4 або майстрів > 2 — виділяємо в окремі Bento-плашки
	const shouldSplitFaculty = $derived(
		totalFaculty > 4 || normalizedMasters.length > 2,
	);
	/*
	 * Викладачі їдуть у ТРЕТЮ колонку, щойно їх забагато для середньої.
	 *
	 * Умова `hasBio` тут стояла й ламала саме те, заради чого перенос
	 * робився. Виглядало це так: у кого «Про себе» заповнене, у того викладачі
	 * охайно ставали праворуч; у кого ні — лишалися в середній колонці й
	 * розпирали її до прокрутки. Тобто розкладка залежала не від кількості
	 * викладачів, а від того, чи людина написала про себе абзац.
	 *
	 * Третя колонка існує сама по собі: `{#if hasBio || canRelocateTeachersToBio}`
	 * нижче створює її й без біо, і всередині тоді лишається сама плашка
	 * викладачів.
	 */
	const canRelocateTeachersToBio = $derived(
		normalizedTeachers.length > 0 && shouldSplitFaculty,
	);
	const hasSeparateTeachersCardInCenter = $derived(
		shouldSplitFaculty &&
			normalizedTeachers.length > 0 &&
			!canRelocateTeachersToBio,
	);

	function getSocialIcon(network: string): string | null {
		const lower = network.toLowerCase();
		if (lower.includes("facebook") || lower === "fb")
			return asset("/social_media/facebook-se-512-50.png");
		if (lower.includes("instagram") || lower === "ig")
			return asset("/social_media/instagram-se-512-50.png");
		if (lower.includes("telegram") || lower === "tg")
			return asset("/social_media/Telegram-se-320px-50q.png");
		if (lower.includes("youtube") || lower === "yt")
			return asset("/social_media/YouTube-se-512px-50q.png");
		if (lower.includes("tiktok") || lower === "tt")
			return asset("/social_media/TikTok-se-512-50.png");
		return null;
	}
</script>

<!--
	Значок людини: МІНІАТЮРА, а якщо фотографії немає — знак відділення.

	Знак відділення однаковий у всіх, хто на ньому працює, тож у списку з семи
	викладачів він не розрізняв нікого — сім однакових масок поспіль. Обличчя
	розрізняє одразу. Заміряно: фотографія є у 103 із 140 працівників, тому
	запасний знак лишається й досі потрібен доволі часто.
-->
{#snippet personBadge(photo: string | null, department: string | null)}
	{@const label = department
		? $t(`galaxy.departments.${department}`, { default: department })
		: undefined}
	<span class="master-badge" role="img" title={label} aria-label={label}>
		{#if photo}
			<img
				class="master-badge__photo"
				src={photo}
				alt=""
				width="22"
				height="22"
				loading="lazy"
				decoding="async"
			/>
		{:else}
			<DepartmentIcon {department} size={16} />
		{/if}
	</span>
{/snippet}

<!--
	Плашка фестивалів — сніпетом, бо малюється у ДВОХ місцях: ліворуч або
	праворуч, залежно від того, де більше місця. Написана двічі, вона давала
	один  двічі в одному компоненті — і гейт це справедливо ловив.
-->
{#snippet festivalsCard()}
	<div class="bento-card bento-card--festivals" data-testid="galaxy-card-festivals-card">
		<GraduateFestivals memberId={graduate.id} />
	</div>
{/snippet}

{#snippet mastersContent()}
	<div class="masters-container" data-testid="galaxy-card-masters-text">
		<span class="masters-title"
			>{$t("galaxy.masters", { default: "Майстри курсу" })}:</span
		>
		<ul class="masters-list">
			{#each normalizedMasters as master, index (index)}
				<li class="master-item">
					{#if master.href}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={master.href}
							class="master-link-wrapper"
							title={master.fullName}
							data-testid="galaxy-card-master-link-{master.slug ||
								index}"
						>
							{@render personBadge(master.photo, master.department)}
							<span class="master-name">
								{master.displayName}
							</span>
						</a>
					{:else}
						<div class="master-link-wrapper">
							{@render personBadge(master.photo, master.department)}
							<span class="master-name" title={master.fullName}
								>{master.displayName}</span
							>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

{#snippet teachersContent()}
	<div
		class="masters-container teachers-container"
		data-testid="galaxy-card-teachers-text"
	>
		<span class="masters-title"
			>{$t("galaxy.teachers", { default: "Викладачі" })}:</span
		>
		<ul class="masters-list teachers-list">
			{#each normalizedTeachers as teacher, index (index)}
				<li class="master-item teacher-item">
					{#if teacher.href}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={teacher.href}
							class="teacher-link-wrapper"
							title={teacher.fullName}
							data-testid="galaxy-card-teacher-link-{teacher.slug ||
								index}"
						>
							{@render personBadge(teacher.photo, teacher.department)}
							<div class="teacher-info">
								<span class="master-name">
									{teacher.displayName}
								</span>
								{#if teacher.subject}
									<span class="teacher-subject"
										>{teacher.subject}</span
									>
								{/if}
							</div>
						</a>
					{:else}
						<div class="teacher-link-wrapper">
							{@render personBadge(teacher.photo, teacher.department)}
							<div class="teacher-info">
								<span class="master-name" title={teacher.fullName}
									>{teacher.displayName}</span
								>
								{#if teacher.subject}
									<span class="teacher-subject"
										>{teacher.subject}</span
									>
								{/if}
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

<div
	class="profile-layout"
	class:has-plays={hasPlays}
	class:has-bio={hasBio || canRelocateTeachersToBio}
	data-testid="galaxy-profile-container"
>
	<!-- ЛІВА КОЛОНКА: Вистави та ролі -->
	{#if hasPlays}
		<div class="col col--left">
			<section
				class="bento-card bento-card--plays"
				bind:this={playsCardEl}
				data-testid="galaxy-card-plays-section"
			>
				<h3 class="block__title">{$t("galaxy.playsTitle")}</h3>
				<ul
					class="plays"
					bind:this={playsListEl}
					{@attach customScroll({
						alignThumb: "right",
						rightOffset: -28,
						parentLevel: 2,
					})}
				>
					{#each profile!.plays as play, index (index)}
						<li
							class="play"
							data-testid="galaxy-card-play-item-{index}"
						>
							{#if hasAnyPlayYear}
								<span class="play__year">{play.year ?? ""}</span
								>
							{/if}
							<span class="play__text"
								><RichTextWithFlags text={play.text} /></span
							>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Фестивалі ПІД виставами: головне в колонці — репертуар, а поїздки
			     до нього додаток, а не заголовок над ним. -->
			{#if hasFestivals && festivalsInLeft}
				{@render festivalsCard()}
			{/if}
		</div>
	{/if}

	<!-- ЦЕНТРАЛЬНА КОЛОНКА: Фото, ім'я, роки, група, майстри, викладачі, соцмережі -->
	<div
		class="col col--center"
		bind:this={centerColEl}
		{@attach customScroll({ alignThumb: "right", rightOffset: -10 })}
	>
		<div
			class="bento-card bento-card--main"
			data-testid="galaxy-card-main-info"
		>
			{#if graduate.hasPhoto}
				<div class="photo-container">
					{#if photoCount > 1}
						<!-- Клік по стопці фото циклічно перемикає наступну світлину -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="photo-stack"
							onclick={cyclePhoto}
							data-testid="galaxy-card-photo-stack"
						>
							{#each profilePhotos as photo, i (i)}
								<img
									class="photo photo--stacked"
									class:photo--active={i === activePhotoIndex}
									class:photo--behind={i !== activePhotoIndex}
									style="--stack-offset: {i ===
									activePhotoIndex
										? 0
										: i < activePhotoIndex
											? -1
											: 1}"
									src={photo.src}
									srcset={photo.srcset}
									sizes="(max-width: 520px) 40vw, 175px"
									width="175"
									height="175"
									alt={i === activePhotoIndex
										? graduate.name
										: ""}
									loading={i === 0 ? "eager" : "lazy"}
									data-testid="galaxy-card-img-{i}"
								/>
							{/each}
						</div>
						<div
							class="photo-dots"
							data-testid="galaxy-card-photo-dots"
						>
							{#each profilePhotos as _, i (i)}
								<button
									type="button"
									class="photo-dot"
									class:photo-dot--active={i ===
										activePhotoIndex}
									onclick={(e) => {
										e.stopPropagation();
										setPhoto(i);
									}}
									aria-label="Photo {i + 1}"
									data-testid="galaxy-card-photo-btn-{i}"
								></button>
							{/each}
						</div>
					{:else}
						<img
							class="photo"
							src={graduatePhoto(graduate.slug, 480)}
							srcset={graduatePhotoSrcset(graduate.slug)}
							sizes="(max-width: 520px) 40vw, 175px"
							width="175"
							height="175"
							alt={graduate.name}
							data-testid="galaxy-card-img"
						/>
					{/if}
					{#if departments.length > 0}
						<div
							class="dept-badges"
							data-testid="galaxy-card-dept-badges"
						>
							{#each departments as dept (dept)}
								<span
									class="dept-badge"
									role="img"
									title={$t(`galaxy.departments.${dept}`, {
										default: dept,
									})}
									aria-label={$t(
										`galaxy.departments.${dept}`,
										{ default: dept },
									)}
								>
									<DepartmentIcon
										department={dept}
										size={18}
									/>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="star" aria-hidden="true"></div>
			{/if}

			<svelte:element
				this={heading}
				class="name"
				id={headingId}
				data-testid="galaxy-card-title"
			>
				{graduate.name}
			</svelte:element>

			{#if socials.length > 0}
				<ul class="socials" data-testid="galaxy-card-socials-list">
					{#each socials as social (social.network + social.url)}
						{@const icon = getSocialIcon(social.network)}
						<li>
							<!--
								`rel="external"` — не косметика: це те, за чим
								`svelte/no-navigation-without-resolve` визнає посилання
								зовнішнім. Тут воно й справді зовнішнє (соцмережі з
								профілю), а точковий `eslint-disable-next-line` перед
								`<a>` не працює — правило звітує на рядку атрибута
								`href`, а HTML-коментар між атрибутами недопустимий.
							-->
							<a
								href={safeUrl(social.url)}
								class="social"
								target="_blank"
								rel="external noopener noreferrer"
								title={social.network}
								aria-label={social.network}
								data-testid="galaxy-card-social-link-{social.network}"
							>
								{#if icon}
									<img
										src={icon}
										alt={social.network}
										width="34"
										height="34"
										class="social__img"
									/>
								{:else}
									<span class="social__text"
										>{social.network}</span
									>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			<GraduateVideoButton videoUrl={profile?.videoUrl} title={graduate.name} />

			<GraduateYears
				enrollmentYears={[...enrollmentYears]}
				graduationYear={graduate.graduationYear}
				graduationLabelKey={profile?.graduationLabelKey ??
					graduate.graduationLabelKey}
				{isEn}
			/>

			{#if !graduate.hasPhoto}
				<div class="fill-profile-wrap">
					<button
						type="button"
						class="fill-profile-btn"
						onclick={openForm}
						data-testid="galaxy-card-fill-form-btn"
					>
						<FileText size={16} aria-hidden="true" />
						<span
							>{$t("galaxy.fillProfile", {
								default: "Заповнити анкету",
							})}</span
						>
					</button>
				</div>
			{/if}

			{#if groupLinks.length}
				<div class="groups-container" data-testid="galaxy-card-group-text">
					<span class="groups-title">{$t("galaxy.group")}:</span>
					<ul class="groups-list">
						{#each groupLinks as item (item.full)}
							{@const groupName = item.name}
							<li class="group-item">
								{#if item.slug}
									<a
										href={localizedPath(`/projects/galaxy-graduates/groups/${item.slug}`, isEn ? "en" : "uk")}
										class="group-link-wrapper"
										title={item.full}
										data-testid="galaxy-card-group-link"
									>
										<span class="group-badge" role="img" aria-label="theatre">
											<DepartmentIcon department="theatre" size={14} />
										</span>
										<span class="group-name-text" class:group-name-text--long={item.long}>
											{groupName}
										</span>
									</a>
								{:else}
									<div
										class="group-link-wrapper group-link-wrapper--static"
										title={item.full}
									>
										<span class="group-badge" role="img" aria-label="theatre">
											<DepartmentIcon department="theatre" size={14} />
										</span>
										<span class="group-name-text" class:group-name-text--long={item.long}>
											{groupName}
										</span>
									</div>
								{/if}

								<!--
									Однокурсники під самою назвою: група — це передусім люди,
									поруч із якими вчилися, а не рядок у картці. Рядок є лише
									там, де в групи справді є сторінка: без неї й складу немає.
								-->
								{#if item.slug}
									<GroupMatesRow groupSlug={item.slug} excludeId={graduate.id} />
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Якщо розділення не потрібне — показуємо майстрів та викладачів тут всередині -->
			{#if !shouldSplitFaculty}
				{#if normalizedMasters.length > 0}
					{@render mastersContent()}
				{/if}
				{#if normalizedTeachers.length > 0}
					{@render teachersContent()}
				{/if}
			{/if}

<!--
				Чекати можна лише на те, що справді існує.

				Доти умовою було `graduate.hasPhoto`, тобто фото правило за ознаку
				наявності анкети — а це різні речі: портрет є в багатьох, у кого
				анкети немає, і в них картка вічно писала «Завантаження…», хоча
				вантажити не було чого. Адресує анкету саме `code`
				(`graduateProfileJson`), тож і чекати треба лише за ним.
			-->
			{#if !profile && graduate.code}
				<p class="row" data-testid="galaxy-card-loading-status">
					{$t("common.loading")}
				</p>
			{/if}
		</div>

		<!-- Окрема Bento-плашка для Майстрів курсу (коли розділено) -->
		{#if shouldSplitFaculty && normalizedMasters.length > 0}
			<div
				class="bento-card bento-card--faculty"
				data-testid="galaxy-card-masters-card"
			>
				{@render mastersContent()}
			</div>
		{/if}

		<!-- Окрема Bento-плашка для Викладачів (якщо вони залишились у центрі) -->
		{#if hasSeparateTeachersCardInCenter}
			<div
				class="bento-card bento-card--faculty"
				data-testid="galaxy-card-teachers-card"
			>
				{@render teachersContent()}
			</div>
		{/if}
	</div>

	<!-- ПРАВА КОЛОНКА: Про себе, під час навчання, після випуску, фестивалі (+ Викладачі, якщо перенесені) -->
	{#if hasBio || canRelocateTeachersToBio}
		<div
			class="col col--right"
			bind:this={rightColEl}
			{@attach customScroll({ alignThumb: "right", rightOffset: -10 })}
		>
			{#if hasBio}
				<div
					class="bento-card bento-card--bio"
					data-testid="galaxy-card-bio-section"
				>
					{#if profile!.duringStudies}
						<section class="block">
							<h3 class="block__title">
								{$t("galaxy.duringStudies")}
							</h3>
							<p class="para">
								<RichTextWithFlags
									text={profile!.duringStudies}
								/>
							</p>
						</section>
					{/if}

					{#if profile!.afterGraduation}
						<section class="block">
							<h3 class="block__title">
								{$t("galaxy.afterGraduation")}
							</h3>
							<p class="para">
								<RichTextWithFlags
									text={profile!.afterGraduation}
								/>
							</p>
						</section>
					{/if}

					{#if profile!.bio.length > 0}
						<section class="block">
							<h3 class="block__title">{$t("galaxy.about")}</h3>
							{#each profile!.bio as paragraph, index (index)}
								<p
									class="para"
									data-testid="galaxy-card-bio-item-{index}"
								>
									<RichTextWithFlags text={paragraph} />
								</p>
							{/each}
						</section>
					{/if}

					{#if profile!.festivals.length > 0}
						<section
							class="block"
							data-testid="galaxy-card-festivals-section"
						>
							<h3 class="block__title">
								{$t("galaxy.festivals")}
							</h3>
							<ul class="plays">
								{#each profile!.festivals as festival, index (index)}
									<li class="play">
										<span class="play__text"
											><RichTextWithFlags
												text={festival}
											/></span
										>
									</li>
								{/each}
							</ul>
						</section>
					{/if}
				</div>
			{/if}

			<!--
				Фестивалі — ВЛАСНА плашка, а не рядок в основній інформації: це не
				властивість людини, як рік випуску чи відділення, а перелік подій, і
				кожна з них веде на свою сторінку.
			-->
			{#if hasFestivals && !festivalsInLeft}
				{@render festivalsCard()}
			{/if}

			<!-- Bento-плашка для Викладачів під блоком «Про себе» -->
			{#if canRelocateTeachersToBio}
				<div
					class="bento-card bento-card--faculty"
					data-testid="galaxy-card-teachers-bio-card"
				>
					{@render teachersContent()}
				</div>
			{/if}
		</div>
	{/if}
</div>

<GraduateFormModal isOpen={formModalOpen} onclose={closeForm} />


<style>
	.profile-layout {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		background: var(--galaxy-card-bg);
		border: 1px solid rgb(140 190 255 / 0.18);
		border-radius: 1.75rem;
		box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
		padding: clamp(1.25rem, 3vh, 1.75rem);
	}
	.col {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.col--center {
		order: 1;
		text-align: center;
	}
	.col--left {
		order: 2;
	}
	.col--right {
		order: 3;
	}

	.bento-card {
		width: 100%;
		box-sizing: border-box;
	}

	@media (min-width: 769px) {
		.profile-layout {
			display: grid;
			grid-template-columns: minmax(280px, 420px);
			justify-content: center;
			align-items: start;
			gap: clamp(1rem, 2vw, 1.75rem);
			text-align: left;
			min-height: 0;
			width: fit-content;
			max-width: 100%;
			margin: 0 auto;
			background: transparent;
			border: none;
			box-shadow: none;
			padding: 0;
		}
		/*
		 * `1fr`, а не `max-content`: друге не вміє звужуватися, і на планшеті
		 * колонки лишалися на своїх мінімумах, а зміст обрізався. Заміряно на
		 * iPad Air 820: три колонки 340/260/280 при 787 px картки — упритул.
		 */
		.profile-layout.has-plays.has-bio {
			grid-template-columns: minmax(280px, 1.2fr) minmax(260px, 300px) minmax(280px, 1fr);
		}
		.profile-layout.has-plays:not(.has-bio) {
			grid-template-columns: minmax(280px, 1.2fr) minmax(260px, 300px);
		}
		.profile-layout.has-bio:not(.has-plays) {
			grid-template-columns: minmax(260px, 300px) minmax(280px, 1fr);
		}

		/*
		 * Без стелі висоти й без прокрутки в колонках.
		 *
		 * Доти стояло `min(100dvh - 90px, 820px)`, і 820 було магічним числом:
		 * заміряно на iPad Pro 1024×1366 — 273 px порожні знизу, а 543 px змісту
		 * сховано всередині колонок, які скролилися. Тобто картка сама вкорочувала
		 * себе на екрані, де місця вдосталь.
		 *
		 * Тепер колонки ростуть, а прокрутку бере на себе сама модалка.
		 */
		.col {
			min-height: 0;
			background: transparent;
			border: none;
			box-shadow: none;
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: clamp(0.75rem, 1.5vh, 1.25rem);
			scrollbar-width: none;
		}
		.col::-webkit-scrollbar {
			display: none;
			width: 0;
			height: 0;
		}

		.col--left {
			order: 1;
			max-width: min(920px, 60vw);
			overflow: visible;
		}
		.col--center {
			order: 2;
			text-align: center;
			gap: clamp(0.75rem, 1.5vh, 1.25rem);
		}
		.col--center .bento-card {
			padding: clamp(1.1rem, 2.2vh, 1.6rem);
		}
		.col--center .photo-container {
			margin: 0 auto 1.1rem;
		}
		.col--center .photo,
		.col--center .photo-stack {
			width: clamp(100px, 40vw, 175px);
			height: clamp(100px, 40vw, 175px);
		}
		.col--center .name {
			font-size: clamp(1.3rem, 3.5dvh, 1.7rem);
			margin: 0 0 0.5rem;
		}
		.col--center .socials {
			margin: 0.2rem 0 0.8rem;
		}
		.col--center .social__img {
			width: 34px;
			height: 34px;
		}
		/*
		 * `:global` тут обов'язковий: рядок років переїхав у `GraduateYears`,
		 * і scoping Svelte більше не позначає його класом цього компонента.
		 * Саме правило лишається ТУТ, бо воно частина стискання центральної
		 * колонки — розміри рахує `recalc*` цього ж файлу й роздає через
		 * `--center-years-*`.
		 */
		.col--center :global(.years) {
			font-size: 0.95rem;
			margin: 0 0 0.9rem;
		}
		.col--center .groups-container {
			font-size: 0.95rem;
			margin: 0 0 1rem;
		}
		.col--center .bento-card--main .masters-container {
			margin: 0 0 1.1rem;
		}
		.col--center .bento-card--faculty .masters-container {
			margin-bottom: 0;
		}
		.col--center .master-item {
			padding: 0;
		}
		.col--center .master-link-wrapper {
			padding: 0.25rem 0.75rem;
		}
		.col--center .master-name {
			font-size: 0.92rem;
		}
		.col--right {
			order: 3;
			max-width: min(580px, 42vw);
			font-size: 0.95rem;
		}
		.col--right .bento-card {
			padding: clamp(1.1rem, 2.2vh, 1.6rem);
		}
		.col--right .block {
			margin-top: 0;
			margin-bottom: 1.25rem;
		}
		.col--right .block__title {
			margin: 0 0 0.5rem;
		}
		.col--right .para {
			font-size: 0.95rem;
			line-height: 1.55;
			margin: 0 0 0.6rem;
		}
		.col--right .block:last-child {
			margin-bottom: 0;
		}

		.bento-card {
			background: var(--galaxy-card-bg);
			border: 1px solid rgb(140 190 255 / 0.2);
			border-radius: 1.5rem;
			box-shadow: 0 16px 48px rgb(0 0 0 / 0.4);
			padding: clamp(1.1rem, 2.2vh, 1.6rem);
		}
		.bento-card--plays {
			display: flex;
			flex-direction: column;
			max-height: min(88dvh, 820px);
			overflow: visible;
		}
		.bento-card--plays .block__title {
			flex-shrink: 0;
			margin: 0 0 0.5rem;
		}
		.bento-card--plays .plays {
			min-height: 0;
			overflow-y: auto;
			font-size: 0.92rem;
			line-height: 1.35;
			scrollbar-width: none;
		}
		.bento-card--plays .plays::-webkit-scrollbar {
			display: none;
			width: 0;
			height: 0;
		}
		.bento-card--plays .play {
			padding: 0.35rem 0;
			gap: 0.5rem;
		}
		.bento-card--faculty {
			text-align: center;
		}
		.bento-card--faculty .masters-container {
			margin-bottom: 0;
		}
	}

	.photo-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 auto 1.1rem;
	}
	.photo {
		display: block;
		width: clamp(100px, 40vw, 175px);
		height: auto;
		aspect-ratio: 1;
		margin: 0 0 0.65rem;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgb(140 190 255 / 0.55);
	}

	/* Стопка фото: клікабельний контейнер із накладеними фото */
	.photo-stack {
		position: relative;
		width: clamp(100px, 40vw, 175px);
		height: clamp(100px, 40vw, 175px);
		margin: 0 0 0.65rem;
		cursor: pointer;
	}
	.photo--stacked {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		transition:
			transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.35s ease,
			z-index 0s;
	}
	.photo--active {
		z-index: 2;
		opacity: 1;
		transform: translate(0, 0) rotate(0deg) scale(1);
	}
	.photo--behind {
		z-index: 1;
		opacity: 0.7;
		transform: translate(
				calc(var(--stack-offset) * 18px),
				calc(var(--stack-offset) * 6px)
			)
			rotate(calc(var(--stack-offset) * 4deg)) scale(0.92);
		filter: brightness(0.8);
	}
	.photo-stack:hover .photo--behind {
		opacity: 0.85;
		transform: translate(
				calc(var(--stack-offset) * 22px),
				calc(var(--stack-offset) * 8px)
			)
			rotate(calc(var(--stack-offset) * 5deg)) scale(0.94);
	}

	/* Точки-індикатори під стопкою фото */
	.photo-dots {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
		margin: 0 0 0.4rem;
	}
	.photo-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1.5px solid rgb(140 190 255 / 0.5);
		background: transparent;
		padding: 0;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}
	.photo-dot--active {
		background: rgb(140 190 255 / 0.85);
		border-color: rgb(140 190 255 / 0.9);
		transform: scale(1.2);
	}
	.photo-dot:hover:not(.photo-dot--active) {
		background: rgb(140 190 255 / 0.35);
		border-color: rgb(140 190 255 / 0.7);
	}

	.dept-badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
	}
	.dept-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgb(140 190 255 / 0.12);
		border: 1px solid rgb(140 190 255 / 0.35);
		color: #bfe0ff;
		transition:
			transform 0.2s ease,
			background 0.2s ease;
	}
	.dept-badge:hover {
		transform: scale(1.1);
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.6);
		color: #fff;
	}
	.star {
		width: 96px;
		height: 96px;
		margin: 0 auto 0.5rem;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgb(234 242 255 / 0.95) 0 6px,
			rgb(180 214 255 / 0.35) 12px,
			transparent 70%
		);
	}
	.name {
		margin: 0 0 0.5rem;
		font-size: clamp(1.3rem, 3.5dvh, 1.7rem);
		text-align: center;
		color: var(--galaxy-accent);
	}
	.fill-profile-wrap {
		display: flex;
		justify-content: center;
		margin: 0.2rem 0 1rem;
	}
	.fill-profile-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.6rem 1.25rem;
		border-radius: 999px;
		background: linear-gradient(
			135deg,
			rgb(140 190 255 / 0.22) 0%,
			rgb(0 150 255 / 0.38) 100%
		);
		border: 1px solid rgb(140 190 255 / 0.55);
		color: #ffffff;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 16px rgb(0 120 255 / 0.25);
		transition:
			transform 0.2s ease,
			background 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}
	.fill-profile-btn:hover {
		transform: translateY(-2px);
		background: linear-gradient(
			135deg,
			rgb(140 190 255 / 0.38) 0%,
			rgb(0 150 255 / 0.6) 100%
		);
		border-color: rgb(140 190 255 / 0.85);
		box-shadow: 0 6px 20px rgb(0 150 255 / 0.45);
		color: #ffffff;
	}
	.groups-container {
		margin: 0 0 1.1rem;
		color: var(--galaxy-text);
		text-align: center;
	}
	.groups-title {
		display: block;
		font-size: 0.92rem;
		color: var(--galaxy-muted);
		margin-bottom: 0.4rem;
	}
	.groups-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
		width: 100%;
	}
	/*
	 * Колонкою, а не рядком: однокурсники стають ПІД назвою групи. Доти тут було
	 * `inline-flex` у рядок, і ряд мініатюр ставав праворуч від назви, тиснучись
	 * у половину ширини та розсипаючись на три ряди.
	 */
	.group-item {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 0;
		background: rgb(255 255 255 / 0.06);
		border-radius: 6px;
		border: 1px solid rgb(255 255 255 / 0.1);
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.15s ease;
	}
	.group-item:has(a:hover) {
		background: rgb(255 255 255 / 0.12);
		border-color: rgb(140 190 255 / 0.4);
		transform: translateY(-1px);
	}
	.group-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		color: inherit;
		text-decoration: none;
		border-radius: inherit;
		width: 100%;
	}
	.group-link-wrapper--static {
		cursor: default;
	}
	.group-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #93c5fd;
		flex-shrink: 0;
	}
	.group-name-text {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
	/*
	 * Запасний хід для довгої назви, у якої немає короткої. Складений добір, а
	 * не самотній модифікатор: у Svelte обидва мають вагу (0,1,0), і правило
	 * перемагало б лише порядком у файлі.
	 */
	.group-item .group-name-text--long {
		font-size: 0.8rem;
		letter-spacing: 0;
	}
	.row {
		margin: 0 0 0.5rem;
		color: var(--galaxy-text);
		text-align: center;
	}
	.masters-container {
		margin: 0 0 1.1rem;
		color: var(--galaxy-text);
		text-align: center;
	}
	.masters-title {
		display: block;
		font-size: 0.92rem;
		color: var(--galaxy-muted);
		margin-bottom: 0.4rem;
	}
	.masters-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
		width: 100%;
	}
	.teachers-list {
		display: grid;
		/* min(): гола довжина тут — підлога колонки, а не поріг переносу
		   (FLUID-SIZING-v8 § 1.1). Картка, у якій лежить список, на вузькому
		   екрані вужча за 180px разом із власними відступами. */
		grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
		gap: 0.45rem 0.6rem;
		width: 100%;
		max-width: 100%;
		margin: 0;
	}
	.master-item {
		display: inline-flex;
		align-items: stretch;
		padding: 0;
		background: rgb(255 255 255 / 0.06);
		border-radius: 6px;
		border: 1px solid rgb(255 255 255 / 0.1);
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.15s ease;
	}
	.master-item:has(a:hover) {
		background: rgb(255 255 255 / 0.12);
		border-color: rgb(140 190 255 / 0.4);
		transform: translateY(-1px);
	}
	.master-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		color: inherit;
		text-decoration: none;
		border-radius: inherit;
		width: 100%;
	}
	.teacher-item {
		display: flex;
		align-items: stretch;
		width: 100%;
		box-sizing: border-box;
		text-align: left;
		padding: 0;
		border-radius: 8px;
		background: rgb(255 255 255 / 0.04);
		border: 1px solid rgb(255 255 255 / 0.07);
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.15s ease;
	}
	.teacher-item:has(a:hover) {
		background: rgb(255 255 255 / 0.08);
		border-color: rgb(140 190 255 / 0.3);
		transform: translateY(-1px);
	}
	.teacher-link-wrapper {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.35rem 0.6rem;
		width: 100%;
		box-sizing: border-box;
		text-align: left;
		color: inherit;
		text-decoration: none;
		border-radius: inherit;
	}
	.teacher-item .master-badge {
		margin-top: 2px;
		flex-shrink: 0;
	}
	.teacher-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		min-width: 0;
		flex: 1;
	}
	.master-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #8cb4ff;
	}
	.master-badge__photo {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		object-fit: cover;
		display: block;
		border: 1px solid rgb(140 180 255 / 0.35);
	}
	.master-name {
		font-size: 0.92rem;
		font-weight: 500;
		color: #ffffff;
		text-decoration: none;
		transition: color 0.2s ease;
	}
	.master-link-wrapper:hover .master-name,
	.teacher-link-wrapper:hover .master-name {
		color: #bfe0ff;
	}
	.teacher-subject {
		font-size: 0.78rem;
		color: var(--galaxy-muted);
		line-height: 1.25;
		margin-top: 0.15rem;
		word-break: break-word;
	}
	.socials {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin: 0.2rem 0 0.8rem;
		padding: 0;
		list-style: none;
	}
	.social {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		text-decoration: none;
		transition:
			transform 0.2s ease,
			filter 0.2s ease;
	}
	.social:hover {
		transform: scale(1.18);
		filter: drop-shadow(0 0 10px rgb(140 190 255 / 0.6));
	}
	.social__img {
		display: block;
		width: 34px;
		height: 34px;
		object-fit: contain;
	}
	.block {
		margin-top: 1.1rem;
		text-align: left;
	}
	.block__title {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		color: var(--galaxy-accent);
		border-bottom: 1px solid rgb(140 190 255 / 0.2);
		padding-bottom: 0.3rem;
	}
	.plays {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.play {
		display: flex;
		gap: 0.6rem;
		padding: 0.35rem 0;
		border-top: 1px solid rgb(255 255 255 / 0.08);
	}
	.play:first-child {
		border-top: none;
	}
	.play__year {
		flex-shrink: 0;
		min-width: 3.2rem;
		color: var(--galaxy-muted);
		font-variant-numeric: tabular-nums;
	}
	.play__text {
		min-width: 0;
		color: var(--galaxy-text);
		overflow-wrap: anywhere;
	}
	.para {
		margin: 0 0 0.6rem;
		line-height: 1.55;
		color: var(--galaxy-text);
		overflow-wrap: anywhere;
	}
</style>
