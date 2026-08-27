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
	import { customScroll } from "$lib/utils/customScroll";
	import {
		getMasterById,
		masterProfilePath,
		relationSubjects,
	} from "$lib/data/masters";
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

	function recalcPlaysFitting() {
		if (!playsCardEl || !playsListEl || !browser) return;
		if (window.innerWidth < 769) {
			playsListEl.style.removeProperty("--plays-padding-y");
			playsListEl.style.removeProperty("--plays-font-size");
			playsListEl.style.removeProperty("--plays-line-height");
			return;
		}

		// Скидаємо стилі для чистого заміру природної висоти
		playsListEl.style.removeProperty("--plays-padding-y");
		playsListEl.style.removeProperty("--plays-font-size");
		playsListEl.style.removeProperty("--plays-line-height");

		// Гранична доступна висота для колонки на десктопі
		const maxColH = Math.min(window.innerHeight - 90, 820);

		const titleEl = playsCardEl.querySelector(
			".block__title",
		) as HTMLElement | null;
		const titleH = titleEl
			? titleEl.offsetHeight +
				(parseFloat(getComputedStyle(titleEl).marginBottom) || 0)
			: 35;

		const cardStyle = getComputedStyle(playsCardEl);
		const padY =
			(parseFloat(cardStyle.paddingTop) || 0) +
			(parseFloat(cardStyle.paddingBottom) || 0);

		// Доступна висота для списку при розтягненні до стелі екрана
		const maxListH = maxColH - padY - titleH;

		const naturalListH = playsListEl.scrollHeight;
		if (maxListH <= 0 || naturalListH <= 0) return;

		// Якщо список у стандартному розмірі повністю вміщається — нічого не стискаємо
		if (naturalListH <= maxListH) {
			return;
		}

		const fitRatio = maxListH / naturalListH;
		// Якщо вміщається >= 75% — стискаємо рівно настільки, щоб заповнити всю висоту без скролу
		if (fitRatio >= 0.75) {
			const padYRem = Math.max(0.12, 0.35 * fitRatio * 0.94);
			const fontRem = Math.max(0.8, 0.92 * Math.pow(fitRatio, 0.5));
			const lineH = Math.max(1.2, 1.35 * Math.pow(fitRatio, 0.3));
			playsListEl.style.setProperty(
				"--plays-padding-y",
				`${padYRem.toFixed(2)}rem`,
			);
			playsListEl.style.setProperty(
				"--plays-font-size",
				`${fontRem.toFixed(2)}rem`,
			);
			playsListEl.style.setProperty(
				"--plays-line-height",
				`${lineH.toFixed(2)}`,
			);
		}
	}

	let rightColEl = $state<HTMLElement | null>(null);

	function recalcBioFitting() {
		if (!rightColEl || !browser) return;
		if (window.innerWidth < 769) {
			rightColEl.style.removeProperty("--bio-font-size");
			rightColEl.style.removeProperty("--bio-line-height");
			rightColEl.style.removeProperty("--bio-card-padding");
			rightColEl.style.removeProperty("--bio-block-margin");
			rightColEl.style.removeProperty("--bio-para-margin");
			rightColEl.style.removeProperty("--bio-title-margin");
			return;
		}

		// Скидаємо стилі для чистого заміру природної висоти
		rightColEl.style.removeProperty("--bio-font-size");
		rightColEl.style.removeProperty("--bio-line-height");
		rightColEl.style.removeProperty("--bio-card-padding");
		rightColEl.style.removeProperty("--bio-block-margin");
		rightColEl.style.removeProperty("--bio-para-margin");
		rightColEl.style.removeProperty("--bio-title-margin");

		const maxColH = Math.min(window.innerHeight - 90, 820);
		const naturalH = rightColEl.scrollHeight;
		if (maxColH <= 0 || naturalH <= 0) return;

		// Якщо вміщається у стандартному розмірі — нічого не зменшуємо
		if (naturalH <= maxColH) {
			return;
		}

		const fitRatio = maxColH / naturalH;
		// Якщо вміщається >= 75% — адаптивно стискаємо шрифт, line-height та відступи, щоб усе вмістилося без скролу
		if (fitRatio >= 0.75) {
			const fontRem = Math.max(0.82, 0.95 * Math.pow(fitRatio, 0.5));
			const lineH = Math.max(1.24, 1.55 * Math.pow(fitRatio, 0.35));
			const cardPadRem = Math.max(0.75, 1.35 * fitRatio * 0.9);
			const blockMarginRem = Math.max(0.45, 1.25 * fitRatio * 0.75);
			const paraMarginRem = Math.max(0.28, 0.6 * fitRatio * 0.75);
			const titleMarginRem = Math.max(0.25, 0.5 * fitRatio * 0.75);

			rightColEl.style.setProperty("--bio-font-size", `${fontRem.toFixed(2)}rem`);
			rightColEl.style.setProperty("--bio-line-height", `${lineH.toFixed(2)}`);
			rightColEl.style.setProperty("--bio-card-padding", `${cardPadRem.toFixed(2)}rem`);
			rightColEl.style.setProperty("--bio-block-margin", `${blockMarginRem.toFixed(2)}rem`);
			rightColEl.style.setProperty("--bio-para-margin", `${paraMarginRem.toFixed(2)}rem`);
			rightColEl.style.setProperty("--bio-title-margin", `${titleMarginRem.toFixed(2)}rem`);
		}
	}

	$effect(() => {
		if (!playsCardEl || !playsListEl || !browser) return;
		const _ = profile?.plays?.length;

		recalcPlaysFitting();

		const ro = new ResizeObserver(() => {
			recalcPlaysFitting();
		});
		ro.observe(playsCardEl);
		return () => ro.disconnect();
	});

	let centerColEl = $state<HTMLElement | null>(null);

	function recalcCenterFitting() {
		if (!centerColEl || !browser) return;
		if (window.innerWidth < 769) {
			centerColEl.style.removeProperty("--center-col-gap");
			centerColEl.style.removeProperty("--center-card-padding");
			centerColEl.style.removeProperty("--center-photo-margin");
			centerColEl.style.removeProperty("--center-photo-size");
			centerColEl.style.removeProperty("--center-name-size");
			centerColEl.style.removeProperty("--center-name-margin");
			centerColEl.style.removeProperty("--center-socials-margin");
			centerColEl.style.removeProperty("--center-social-img-size");
			centerColEl.style.removeProperty("--center-years-size");
			centerColEl.style.removeProperty("--center-years-margin");
			centerColEl.style.removeProperty("--center-group-size");
			centerColEl.style.removeProperty("--center-group-margin");
			centerColEl.style.removeProperty("--center-masters-margin");
			centerColEl.style.removeProperty("--center-item-padding");
			centerColEl.style.removeProperty("--center-master-name-size");
			return;
		}

		// Скидаємо стилі для чистого заміру природної висоти
		centerColEl.style.removeProperty("--center-col-gap");
		centerColEl.style.removeProperty("--center-card-padding");
		centerColEl.style.removeProperty("--center-photo-margin");
		centerColEl.style.removeProperty("--center-photo-size");
		centerColEl.style.removeProperty("--center-name-size");
		centerColEl.style.removeProperty("--center-name-margin");
		centerColEl.style.removeProperty("--center-socials-margin");
		centerColEl.style.removeProperty("--center-social-img-size");
		centerColEl.style.removeProperty("--center-years-size");
		centerColEl.style.removeProperty("--center-years-margin");
		centerColEl.style.removeProperty("--center-group-size");
		centerColEl.style.removeProperty("--center-group-margin");
		centerColEl.style.removeProperty("--center-masters-margin");
		centerColEl.style.removeProperty("--center-item-padding");
		centerColEl.style.removeProperty("--center-master-name-size");

		const maxColH = Math.min(window.innerHeight - 90, 820);
		const naturalH = centerColEl.scrollHeight;
		if (maxColH <= 0 || naturalH <= 0) return;

		if (naturalH <= maxColH) {
			return;
		}

		const fitRatio = maxColH / naturalH;
		// Якщо вміщається >= 70% — адаптивно та із запасом стискаємо, щоб гарантовано усунути скрол
		if (fitRatio >= 0.7) {
			const effectiveRatio = fitRatio * 0.92;
			const photoSizePx = Math.max(
				110,
				Math.round(175 * Math.pow(effectiveRatio, 0.8)),
			);
			const photoMarginRem = Math.max(0.35, 1.1 * effectiveRatio * 0.7);
			const nameSizeRem = Math.max(
				1.15,
				1.5 * Math.pow(effectiveRatio, 0.4),
			);
			const nameMarginRem = Math.max(0.2, 0.5 * effectiveRatio * 0.7);
			const socialsMarginRem = Math.max(
				0.25,
				0.8 * effectiveRatio * 0.7,
			);
			const socialImgPx = Math.max(
				24,
				Math.round(34 * Math.pow(effectiveRatio, 0.5)),
			);
			const yearsSizeRem = Math.max(
				0.8,
				0.95 * Math.pow(effectiveRatio, 0.4),
			);
			const yearsMarginRem = Math.max(0.3, 0.9 * effectiveRatio * 0.7);
			const groupSizeRem = Math.max(
				0.8,
				0.95 * Math.pow(effectiveRatio, 0.4),
			);
			const groupMarginRem = Math.max(0.3, 1.0 * effectiveRatio * 0.7);
			const cardPadRem = Math.max(0.7, 1.35 * effectiveRatio * 0.85);
			const colGapRem = Math.max(0.45, 1.0 * effectiveRatio * 0.75);
			const mastersMarginRem = Math.max(
				0.35,
				1.1 * effectiveRatio * 0.7,
			);
			const itemPadYRem = Math.max(0.1, 0.25 * effectiveRatio * 0.75);
			const masterNameRem = Math.max(
				0.8,
				0.92 * Math.pow(effectiveRatio, 0.4),
			);

			centerColEl.style.setProperty(
				"--center-photo-size",
				`${photoSizePx}px`,
			);
			centerColEl.style.setProperty(
				"--center-photo-margin",
				`${photoMarginRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-name-size",
				`${nameSizeRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-name-margin",
				`${nameMarginRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-socials-margin",
				`${socialsMarginRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-social-img-size",
				`${socialImgPx}px`,
			);
			centerColEl.style.setProperty(
				"--center-years-size",
				`${yearsSizeRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-years-margin",
				`${yearsMarginRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-group-size",
				`${groupSizeRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-group-margin",
				`${groupMarginRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-card-padding",
				`${cardPadRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-col-gap",
				`${colGapRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-masters-margin",
				`${mastersMarginRem.toFixed(2)}rem`,
			);
			centerColEl.style.setProperty(
				"--center-item-padding",
				`${itemPadYRem.toFixed(2)}rem 0.65rem`,
			);
			centerColEl.style.setProperty(
				"--center-master-name-size",
				`${masterNameRem.toFixed(2)}rem`,
			);
		}
	}

	$effect(() => {
		if (!rightColEl || !browser) return;
		const _ = profile?.bio?.length;
		const __ = profile?.duringStudies;
		const ___ = profile?.afterGraduation;
		const ____ = profile?.festivals?.length;

		recalcBioFitting();

		const ro = new ResizeObserver(() => {
			recalcBioFitting();
		});
		ro.observe(rightColEl);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!centerColEl || !browser) return;
		const _ = graduate.slug;
		const __ = normalizedMasters.length;
		const ___ = normalizedTeachers.length;

		recalcCenterFitting();

		const ro = new ResizeObserver(() => {
			recalcCenterFitting();
		});
		ro.observe(centerColEl);
		return () => ro.disconnect();
	});

	const enrollmentYears = $derived(
		profile?.enrollmentYears ?? graduate.enrollmentYears ?? [],
	);
	const enrollmentText = $derived(
		enrollmentYears.length > 0
			? `${$t("galaxy.enrolled")} ${enrollmentYears.join(", ")}`
			: null,
	);
	const graduationText = $derived(
		graduate.graduationYear
			? `${$t("galaxy.graduated")} ${graduate.graduationYear}`
			: null,
	);

	const group = $derived(
		profile?.group ?? graduate.group?.name ?? graduate.group?.abbr ?? null,
	);
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
			return { id, slug, displayName, fullName, department: dept, href };
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
				href,
			};
		}),
	);

	const socials = $derived(profile?.socials ?? graduate.socials ?? []);
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
	// Якщо майстрів/викладачів багато і є колонка Біо — переносимо викладачів під Біо
	const canRelocateTeachersToBio = $derived(
		hasBio && normalizedTeachers.length > 0 && shouldSplitFaculty,
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

{#snippet mastersContent()}
	<div class="masters-container" data-testid="galaxy-card-masters-text">
		<span class="masters-title"
			>{$t("galaxy.masters", { default: "Майстри курсу" })}:</span
		>
		<ul class="masters-list">
			{#each normalizedMasters as master, index (index)}
				<li class="master-item">
					<span
						class="master-badge"
						role="img"
						title={master.department
							? $t(`galaxy.departments.${master.department}`, {
									default: master.department,
								})
							: undefined}
						aria-label={master.department
							? $t(`galaxy.departments.${master.department}`, {
									default: master.department,
								})
							: undefined}
					>
						<DepartmentIcon
							department={master.department}
							size={16}
						/>
					</span>
					{#if master.href}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={master.href}
							class="master-name master-link"
							title={master.fullName}
							data-testid="galaxy-card-master-link-{master.slug ||
								index}"
						>
							{master.displayName}
						</a>
					{:else}
						<span class="master-name" title={master.fullName}
							>{master.displayName}</span
						>
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
					<span
						class="master-badge"
						role="img"
						title={teacher.department
							? $t(`galaxy.departments.${teacher.department}`, {
									default: teacher.department,
								})
							: undefined}
						aria-label={teacher.department
							? $t(`galaxy.departments.${teacher.department}`, {
									default: teacher.department,
								})
							: undefined}
					>
						<DepartmentIcon
							department={teacher.department}
							size={16}
						/>
					</span>
					<div class="teacher-info">
						{#if teacher.href}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={teacher.href}
								class="master-name master-link"
								title={teacher.fullName}
								data-testid="galaxy-card-teacher-link-{teacher.slug ||
									index}"
							>
								{teacher.displayName}
							</a>
						{:else}
							<span class="master-name" title={teacher.fullName}
								>{teacher.displayName}</span
							>
						{/if}
						{#if teacher.subject}
							<span class="teacher-subject"
								>({teacher.subject})</span
							>
						{/if}
					</div>
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

			{#if enrollmentText || graduationText}
				<div class="years" data-testid="galaxy-card-years-text">
					{#if enrollmentText}<span class="years__item"
							>{enrollmentText}</span
						>{/if}
					{#if enrollmentText && graduationText}<span
							class="years__sep"
							aria-hidden="true">·</span
						>{/if}
					{#if graduationText}<span class="years__item"
							>{graduationText}</span
						>{/if}
				</div>
			{/if}

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

			{#if group}
				<div class="group" data-testid="galaxy-card-group-text">
					<span class="group__label">{$t("galaxy.group")}:</span>
					<strong class="group__name">{group}</strong>
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

			{#if !profile && graduate.hasPhoto}
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
		.profile-layout.has-plays.has-bio {
			grid-template-columns:
				minmax(340px, max-content) minmax(260px, 300px)
				minmax(280px, max-content);
		}
		.profile-layout.has-plays:not(.has-bio) {
			grid-template-columns: minmax(340px, max-content) minmax(
					260px,
					300px
				);
		}
		.profile-layout.has-bio:not(.has-plays) {
			grid-template-columns: minmax(260px, 300px) minmax(
					280px,
					max-content
				);
		}

		.col {
			max-height: min(calc(100dvh - 90px), 820px);
			min-height: 0;
			overflow-y: auto;
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
			gap: var(--center-col-gap, clamp(0.75rem, 1.5vh, 1.25rem));
		}
		.col--center .bento-card {
			padding: var(--center-card-padding, clamp(1.1rem, 2.2vh, 1.6rem));
		}
		.col--center .photo-container {
			margin: 0 auto var(--center-photo-margin, 1.1rem);
		}
		.col--center .photo,
		.col--center .photo-stack {
			width: var(--center-photo-size, clamp(100px, 40vw, 175px));
			height: var(--center-photo-size, clamp(100px, 40vw, 175px));
		}
		.col--center .name {
			font-size: var(--center-name-size, clamp(1.3rem, 3.5dvh, 1.7rem));
			margin: 0 0 var(--center-name-margin, 0.5rem);
		}
		.col--center .socials {
			margin: 0.2rem 0 var(--center-socials-margin, 0.8rem);
		}
		.col--center .social__img {
			width: var(--center-social-img-size, 34px);
			height: var(--center-social-img-size, 34px);
		}
		.col--center .years {
			font-size: var(--center-years-size, 0.95rem);
			margin: 0 0 var(--center-years-margin, 0.9rem);
		}
		.col--center .group {
			font-size: var(--center-group-size, 0.95rem);
			margin: 0 0 var(--center-group-margin, 1rem);
		}
		.col--center .bento-card--main .masters-container {
			margin: 0 0 var(--center-masters-margin, 1.1rem);
		}
		.col--center .bento-card--faculty .masters-container {
			margin-bottom: 0;
		}
		.col--center .master-item {
			padding: var(--center-item-padding, 0.25rem 0.75rem);
		}
		.col--center .master-name {
			font-size: var(--center-master-name-size, 0.92rem);
		}
		.col--right {
			order: 3;
			max-width: min(580px, 42vw);
			font-size: var(--bio-font-size, 0.95rem);
		}
		.col--right .bento-card {
			padding: var(--bio-card-padding, clamp(1.1rem, 2.2vh, 1.6rem));
		}
		.col--right .block {
			margin-top: 0;
			margin-bottom: var(--bio-block-margin, 1.25rem);
		}
		.col--right .block__title {
			margin: 0 0 var(--bio-title-margin, 0.5rem);
		}
		.col--right .para {
			font-size: var(--bio-font-size, 0.95rem);
			line-height: var(--bio-line-height, 1.55);
			margin: 0 0 var(--bio-para-margin, 0.6rem);
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
			font-size: var(--plays-font-size, 0.92rem);
			line-height: var(--plays-line-height, 1.35);
			scrollbar-width: none;
		}
		.bento-card--plays .plays::-webkit-scrollbar {
			display: none;
			width: 0;
			height: 0;
		}
		.bento-card--plays .play {
			padding: var(--plays-padding-y, 0.35rem) 0;
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
	.years {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.2rem 0.45rem;
		margin: 0 0 0.9rem;
		color: var(--galaxy-muted);
		font-variant-numeric: tabular-nums;
		text-align: center;
		font-size: 0.95rem;
		line-height: 1.35;
	}
	.years__item {
		white-space: nowrap;
	}
	.years__sep {
		opacity: 0.5;
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
	.group {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.25rem 0.45rem;
		margin: 0 0 1rem;
		color: var(--galaxy-text);
		text-align: center;
		font-size: 0.95rem;
		line-height: 1.35;
	}
	.group__label {
		color: var(--galaxy-muted);
		white-space: nowrap;
	}
	.group__name {
		color: var(--galaxy-text);
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
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		background: rgb(255 255 255 / 0.06);
		border-radius: 6px;
		border: 1px solid rgb(255 255 255 / 0.1);
	}
	.teacher-item {
		display: flex;
		align-items: flex-start;
		width: 100%;
		box-sizing: border-box;
		text-align: left;
		gap: 0.5rem;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		background: rgb(255 255 255 / 0.04);
		border: 1px solid rgb(255 255 255 / 0.07);
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}
	.teacher-item:hover {
		background: rgb(255 255 255 / 0.08);
		border-color: rgb(140 190 255 / 0.3);
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
	.master-name {
		font-size: 0.92rem;
		font-weight: 500;
	}
	.teacher-subject {
		font-size: 0.78rem;
		color: var(--galaxy-muted);
		line-height: 1.25;
		margin-top: 0.15rem;
		word-break: break-word;
	}
	.master-link {
		color: #bfe0ff;
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: rgb(140 190 255 / 0.45);
		transition:
			color 0.2s ease,
			text-decoration-color 0.2s ease;
	}
	.master-link:hover {
		color: #ffffff;
		text-decoration-color: #ffffff;
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
