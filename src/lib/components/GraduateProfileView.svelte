<script lang="ts">
	import { onMount } from "svelte";
	import { t, locale } from "svelte-i18n";
	import { ArrowRight, FileText } from "lucide-svelte";
	import { browser } from "$app/environment";
	import { asset } from "$app/paths";
	import { safeUrl } from "$lib/utils/safeUrl";
	import DepartmentIcon from "$lib/components/icons/DepartmentIcon.svelte";
	import RichTextWithFlags from "$lib/components/RichTextWithFlags.svelte";
	import GraduatePlayRow from "$lib/components/GraduatePlayRow.svelte";
	import GraduateFormModal from "$lib/components/GraduateFormModal.svelte";
	import GraduateVideoButton from "$lib/components/GraduateVideoButton.svelte";
	import GraduateYears from "$lib/components/GraduateYears.svelte";
	import { customScroll } from "$lib/utils/customScroll";
	import { scrollFade } from "$lib/utils/scrollFade";
	import {
		getMasterById,
		masterProfilePath,
		relationSubjects,
	} from "$lib/data/masters";
	import { localizedPath } from "$lib/i18n/routing";
	import { linkedMasterId } from "$lib/data/dualRole";
	import { getGroupsByMember } from "$lib/data/groups";
	import { masterLabelKey, dualRoleMasterLabelKey } from '$lib/utils/masterLabel';
	import GraduateFestivals from "$lib/components/GraduateFestivals.svelte";
	import GroupMatesRow from "$lib/components/GroupMatesRow.svelte";
	import GraduateBlockEmpty from "$lib/components/GraduateBlockEmpty.svelte";
	import { getFestivalsByMember } from "$lib/data/festivals";
	import { groupPlayRows } from "$lib/data/playRowGroups";
	import {
		graduatePhoto,
		graduatePhotoSrcset,
		allGraduatePhotos,
		type Department,
		type GraduateIndexEntry,
		type GraduateProfile,
		hasProfile,
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

	let playsListEl = $state<HTMLUListElement | null>(null);

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
	 * Кнопка на СВОЮ сторінку працівника — у того, хто тепер тут працює.
	 *
	 * Одинадцять людей зі 530; перелік і причини — у `data/dualRole.ts`. Звідти ж
	 * і правило видимості: на працівника рівня `direct` зв'язок не веде, тож
	 * окремої перевірки тут немає й бути не мусить — інакше вона
	 * розійшлася б із такою самою перевіркою на сторінці працівника.
	 *
	 * Читається `graduate.id`, а не `slug`: ключем зв'язків у цьому проєкті є
	 * саме `id`, і `slug` законно змінюється (докблок `GraduateIndexEntry.id`).
	 */
	const alsoMaster = $derived.by(() => {
		const id = linkedMasterId(graduate.id);
		return id ? (getMasterById(id) ?? null) : null;
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

	/*
	 * Ключ підпису рахується з ЗАПИСІВ реєстру, а не з `normalizedMasters`: там
	 * імена вже локалізовані, а рід визначається по батькові й прізвищу —
	 * українськими, яких в англійському варіанті немає.
	 */
	const masterLabel = $derived(
		masterLabelKey(
			rawMasters
				.map((m) => (typeof m === "string" ? m : m.id))
				.map((id) => (id ? getMasterById(id) : undefined))
				.filter((m) => m !== undefined),
		),
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
	/** Рядки одного вечора — одним рядком переліку; правило й заміри в `playRowGroups.ts`. */
	const playGroups = $derived(groupPlayRows(profile?.plays ?? []));
	const hasBio = $derived(
		Boolean(
			profile &&
				(profile.duringStudies ||
					profile.afterGraduation ||
					profile.bio.length > 0 ||
					profile.festivals.length > 0),
		),
	);

	/*
	 * Майстри й викладачі — ЗАВЖДИ власні плашки.
	 *
	 * Доти вони при малій кількості жили всередині основної плашки, а при
	 * великій виділялися в окремі, ще й переїжджали між колонками за трьома
	 * різними умовами. Це те саме «рівномірне заповнення», тільки записане
	 * навмання підібраними числами (`> 4`, `> 2`) і без жодного заміру. Тепер
	 * рішення одне й на всіх: плашка є плашка, а куди її покласти — рахує
	 * `distribute` за справжніми висотами.
	 */

	/*
	 * ── Розподіл плашок по колонках ────────────────────────────────────────
	 *
	 * Плашки більше не прибиті до колонок у розмітці. Колонка — просто
	 * контейнер, а що в ній лежить, вирішує розподіл: інакше «рівномірно
	 * заповнити» неможливо в принципі, бо в одного випускника двадцять вистав,
	 * а в іншого три.
	 *
	 * Схему першої плашки кожної колонки задав замовник, і вона різна для
	 * різної кількості колонок. Решта — «дивитися для рівномірного заповнення»,
	 * тобто саме те, що робить `distribute` нижче.
	 */
	type BlockKey =
		| "main"
		| "masters"
		| "teachers"
		| "plays"
		| "festivals"
		| "bio";

	/** Порядок читання, коли колонка одна. Він же — черга для решти плашок. */
	const SINGLE_ORDER: BlockKey[] = [
		"main",
		"masters",
		"teachers",
		"plays",
		"festivals",
		"bio",
	];

	/** Чим ПОЧИНАЄТЬСЯ кожна колонка. Далі йде вирівнювання. */
	const SEEDS: Record<number, BlockKey[][]> = {
		1: [SINGLE_ORDER],
		2: [["main"], ["masters", "teachers"]],
		3: [["plays"], ["main", "masters"], ["bio"]],
		4: [["plays"], ["main"], ["masters", "teachers"], ["bio"]],
	};

	/** Театральне відділення — саме там роль у виставі очікувана. */
	const isTheatre = $derived(Boolean(graduate.departments?.includes("theatre")));

	/**
	 * Чи є ще про що просити САМУ людину.
	 *
	 * Знімок і рік вступу приходять з анкети, тобто від неї. Решта — вистави,
	 * майстри, група — наші дані, і просити їх у випускника нема сенсу: він їх
	 * не заповнює.
	 *
	 * Одна величина на два місця: кнопку «Заповнити анкету» під іменем і олівець
	 * у порожніх плашках. Дві копії цієї умови розійшлися б на першій правці, і
	 * сторінка просила б анкету в одному місці й не просила в іншому.
	 */
	const askForForm = $derived(!graduate.hasPhoto || !graduate.enrollmentYears?.length);

	/**
	 * Які плашки показувати.
	 *
	 * Дві з них показуються ЗАВЖДИ, навіть порожніми, і це не недогляд.
	 *
	 * «Про себе» — бо доти сторінка без розповіді просто не мала такого блока, і
	 * з екрана було не відрізнити «людина нічого не написала» від «ми не питали».
	 * Порожня плашка з олівцем каже прямо: місце є, слова чекають.
	 *
	 * «Вистави» — те саме, але лише для театрального відділення: у 413 із 530
	 * роль у виставі очікувана, а в художника чи піаніста порожній список вистав
	 * не питання до людини, а неправда про те, чим вона тут займалася.
	 *
	 * «Викладачі» — теж завжди. Доти вони зникали порожніми з міркуванням
	 * «це наші дані, питати про них нема кого», і те міркування було правдою
	 * лише поки порожня плашка вміла єдине: просити анкету в самої людини.
	 * Тепер порожня плашка веде до вікна адміністратора, тобто спитати ЯК
	 * РАЗ є кого — школу. А сорок сім учнів Балдіна проти чотирьохсот без
	 * жодного вписаного викладача показують, що дані тут не «наші повні», а
	 * «наші початі».
	 *
	 * Майстри курсу й фестивалі порожніми й далі зникають: там прохання
	 * «додати» стосувалося б не цієї людини, а всієї групи чи всього
	 * фестивалю, і ставити його на сторінці однієї людини означало б
	 * запитувати не в того.
	 */
	const presentBlocks = $derived(
		SINGLE_ORDER.filter((key) => {
			if (key === "main") return true;
			if (key === "masters") return normalizedMasters.length > 0;
			if (key === "plays") return hasPlays || isTheatre;
			if (key === "festivals") return hasFestivals;
			return true;
		}),
	);

	/**
	 * Скільки колонок вміщає ширина. Межі — з переліку пристроїв замовника:
	 * 375 → одна, 768 і 820 → дві, 1024 і звичайний десктоп → три, 4K → чотири.
	 */
	function columnsForWidth(width: number): number {
		if (width < 768) return 1;
		if (width < 1024) return 2;
		if (width < 1900) return 3;
		return 4;
	}

	/*
	 * Три, а не одна, доки не виміряно ширину.
	 *
	 * Пререндер ширини не знає, і хибний здогад видно оком: сторінка блимає
	 * іншою розкладкою до гідратації. Три обрано тому, що на вузькому екрані
	 * колонки СТАЮТЬ ОДНА ПІД ОДНУ (нижче 768 розкладка — звичайний стовпчик),
	 * тож для телефона три контейнери й один контейнер виглядають однаково.
	 * Хибним здогад лишається тільки в порядку плашок, і лише на мить.
	 */
	let columnCount = $state(3);

	/**
	 * Чи вже пораховано розкладку за справжньою шириною.
	 *
	 * Позначка потрібна перевіркам: до гідратації в розмітці стоїть здогад, і
	 * гейт, що заміряв би її, звітував би про три колонки на планшеті — тобто
	 * про те, чого людина не бачить довше за мить.
	 */
	let widthKnown = $state(false);

	$effect(() => {
		if (!browser) return;
		const apply = () => {
			columnCount = columnsForWidth(window.innerWidth);
			widthKnown = true;
		};
		apply();
		window.addEventListener("resize", apply);
		return () => window.removeEventListener("resize", apply);
	});

	/** Заміряні висоти плашок. Порожньо — розподіл іде на самих лише схемах. */
	let blockHeights = $state<Partial<Record<BlockKey, number>>>({});

	/**
	 * Жадібний розподіл: спершу схема замовника, далі найвища плашка з тих, що
	 * лишилися, — у найнижчу на цей момент колонку.
	 *
	 * Це класична евристика для розкладання на купи рівної ваги, і саме вона
	 * дає «рівномірне заповнення» без жодного числа, прив'язаного до конкретної
	 * людини: у кого вистав три, у того плашка вистав легка й поїде туди, де
	 * місця більше.
	 */
	function distribute(
		count: number,
		present: BlockKey[],
		heights: Partial<Record<BlockKey, number>>,
		wideFirst = false,
	): BlockKey[][] {
		const seeds = SEEDS[count] ?? SEEDS[1];
		const columns = seeds.map((seed) =>
			seed.filter((key) => present.includes(key)),
		);
		if (count <= 1) return columns;

		/*
		 * Незаміряній плашці дається середня вага, а не нуль: із нулем усі вони
		 * на першому кадрі падали б в одну колонку, і перший же замір розкидав
		 * би їх — тобто розкладка сіпалася б у всіх, у кого немає JS-заміру.
		 */
		const weight = (key: BlockKey) => heights[key] ?? 240;
		const placed = new Set(columns.flat());
		const totals = columns.map((column) =>
			column.reduce((sum, key) => sum + weight(key), 0),
		);

		/*
		 * Широка перша колонка НІКОГО більше не приймає.
		 *
		 * Уся ця евристика тримається на тому, що колонки рівні завширшки: тоді
		 * висота плашки не залежить від того, у якій вона колонці, і новий замір
		 * не суперечить попередньому. Щойно перша колонка ширша за решту, це
		 * перестає бути правдою — плашка, що переїхала в неї, стає нижчою,
		 * розподіл змінюється, вона їде назад, і так по колу. Нескінченна вага
		 * закриває колонку для решти й тим лишає припущення в силі.
		 */
		if (wideFirst) totals[0] = Number.POSITIVE_INFINITY;

		const rest = present
			.filter((key) => !placed.has(key))
			.sort((a, b) => weight(b) - weight(a));

		for (const key of rest) {
			let target = 0;
			for (let i = 1; i < totals.length; i += 1) {
				if (totals[i] < totals[target]) target = i;
			}
			columns[target].push(key);
			totals[target] += weight(key);
		}

		/*
		 * ПОРОЖНІ колонки викидаються, і це не косметика.
		 *
		 * Схема на три колонки — `[[plays], [main], [bio]]` — розрахована на
		 * заповнену анкету. У кого анкети немає, є сама лише основна плашка, і
		 * дві колонки лишалися порожніми. Сітка ж ділила ширину натроє однаково:
		 * заміряно на картці Дар'ї Майстренко — `--cols: 3`, три колонки по
		 * 42 px, картка завширшки 181 px, ім'я в ній переносилося по літерах.
		 *
		 * Анкети немає у 427 випускників із 517, тобто зламаною була картка
		 * більшості людей на сайті.
		 */
		const filled = columns.filter((column) => column.length > 0);
		return filled.length > 0 ? filled : columns.slice(0, 1);
	}

	/**
	 * Для якої кількості колонок уже вирішено, що вистав багато. `-1` — не
	 * вирішено ні для якої.
	 *
	 * ## Чому не число вистав
	 *
	 * Бо не число вистав переповнює колонку, а висота: у рядку від однієї до
	 * трьох ліній залежно від довжини назви з роллю. Заміряно на анкеті Аліка
	 * Запольнова при вікні 1280×800: 22 рядки — від 32 до 75 пікселів, зміст
	 * 1161 при колонці 752.
	 *
	 * ## Чому рішення ухвалюється РАЗ і не скасовується
	 *
	 * Щільність робить плашку нижчою — і вона починає вміщатися. Скасувавши
	 * рішення, ми повернули б їй висоту, вона знову не вмістилася б, і так по
	 * колу на кожному кадрі. Тому рішення ухвалюється один раз на кожну
	 * кількість колонок: змінилася ширина вікна настільки, що колонок стало
	 * більше — питання ставиться заново, вже на новому просторі.
	 */
	let denseCols = $state(-1);

	/** Вистав більше, ніж уміщає колонка: плашка щільніша, а колонка ширша. */
	const densePlays = $derived(denseCols === columnCount);

	$effect(() => {
		const cols = columnCount;
		const висота = blockHeights.plays;
		if (!layoutEl || cols < 3 || !висота) return;
		if (denseCols === cols) return;
		if (висота > layoutEl.clientHeight) denseCols = cols;
	});

	const columns = $derived(
		distribute(columnCount, presentBlocks, blockHeights, densePlays),
	);

	/**
	 * Ширини колонок рядком, а не `repeat()`.
	 *
	 * `repeat()` вимагає цілого числа й не приймає `calc(var(--cols) - 1)`, тож
	 * «одна колонка ширша, решта рівні» через нього не виражається взагалі.
	 *
	 * Ширша саме перша й саме тоді, коли в ній вистави: у схемах на три й
	 * чотири колонки вистави стоять першими самі, а плашка «основне» поруч
	 * віддає ці пікселі без шкоди — заміряно, при 1280px вона стає 348 замість
	 * 393 і фотографія з ім'ям вміщаються так само.
	 *
	 * 1.5 — із заміру: 1.3 давало зміст 1070 замість 1161, а 1.5 — 1010.
	 */
	const gridColumns = $derived(
		columns
			.map((keys, index) =>
				densePlays && index === 0 && keys[0] === "plays"
					? "minmax(280px, 1.5fr)"
					: "minmax(280px, 1fr)",
			)
			.join(" "),
	);

	let layoutEl = $state<HTMLElement | null>(null);

	/*
	 * Замір висот — і захист від зациклення.
	 *
	 * Перенос плашки міняє висоту колонки, а висота колонки впливає на перенос:
	 * саме так зациклюється наївна версія. Рятує те, що колонки РІВНІ ЗАВШИРШКИ
	 * (`repeat(N, minmax(0, 1fr))`), тож висота плашки не залежить від того, у
	 * якій вона колонці, — а отже новий замір не суперечить попередньому.
	 *
	 * Поріг у 6 px додано понад це: без нього дробові пікселі підпису лічилися б
	 * за зміну й тримали б спостерігача в постійній роботі.
	 */
	$effect(() => {
		if (!browser || !layoutEl) return;
		const _ = columns;

		const measure = () => {
			const next: Partial<Record<BlockKey, number>> = {};
			for (const el of layoutEl!.querySelectorAll<HTMLElement>(
				"[data-block]",
			)) {
				next[el.dataset.block as BlockKey] = el.offsetHeight;
			}
			const changed = (Object.keys(next) as BlockKey[]).some(
				(key) => Math.abs((blockHeights[key] ?? 0) - next[key]!) > 6,
			);
			if (changed) blockHeights = next;
		};

		measure();
		const ro = new ResizeObserver(measure);
		for (const el of layoutEl.querySelectorAll("[data-block]")) ro.observe(el);
		return () => ro.disconnect();
	});

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
	<div class="bento-card bento-card--festivals" data-block="festivals" data-testid="galaxy-card-festivals-card">
		<!--
			Палітра галактики — обгорткою, а не всередині `GraduateFestivals`: той
			самий список стоїть ще й на сторінці викладача, де тема сайту правильна.
			Пояснення змінних — у докблоці стилів того компонента.
		-->
		<div class="fests-galaxy">
			<GraduateFestivals festivals={getFestivalsByMember(graduate.id)} />
		</div>
	</div>
{/snippet}

{#snippet mastersContent()}
	<div class="masters-container" data-testid="galaxy-card-masters-text">
		<!--
			Підпис у роді й числі: «Майстриня курсу» для однієї, «Майстер курсу»
			для одного, «Майстри курсу» для кількох. Заміряно: майстер один у 243
			випускників із 332, і в 202 із них це жінка — тобто стала множина була
			неправильною в трьох випадках із чотирьох. Правило — у `masterLabel`.
		-->
		<span class="galaxy-block-title"
			>{$t(masterLabel, { default: "Майстри курсу" })}:</span
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
		<span class="galaxy-block-title"
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

<!--
	Обгортка існує заради ОДНОГО: контейнерний запит не може питати про самого
	себе, а розкладка має залежати від ширини КАРТКИ, а не вікна. Картка
	відкривається і модалкою, і окремою сторінкою — ширини там різні.
-->
<!--
	Плашки лежать у сніпетах, а колонки нижче — просто цикл по тому, що
	нарахував `distribute`. Доти кожна плашка була прибита до своєї колонки, і
	«рівномірно заповнити» було ніяк: розкладка не мала жодного способу
	переставити довгий список туди, де є місце.
-->
{#snippet playsCard()}
			<section
				class="bento-card bento-card--plays"
				class:bento-card--plays-dense={densePlays}
				data-block="plays"
				data-testid="galaxy-card-plays-section"
			>
				{#if !hasPlays}
					<!-- Заголовок, а під ним «інформація відсутня» і «+ додати». -->
					<div class="block">
						<h3 class="block__title galaxy-block-title">{$t("galaxy.playsTitle")}</h3>
						<GraduateBlockEmpty
							base="galaxy-card-plays"
							{askForForm}
							hasPhoto={!!graduate.hasPhoto}
							onform={openForm}
						/>
					</div>
				{:else}
				<h3 class="block__title galaxy-block-title">{$t("galaxy.playsTitle")}</h3>
				<ul
					class="plays"
					bind:this={playsListEl}
					{@attach customScroll({
						alignThumb: "right",
						rightOffset: -28,
						parentLevel: 2,
					})}
				>
					{#each playGroups as group, index (index)}
						<GraduatePlayRow
							{group}
							{index}
							memberId={graduate.id}
							showYear={hasAnyPlayYear}
							dense={densePlays}
						/>
					{/each}
				</ul>
				{/if}
			</section>
{/snippet}

{#snippet mainCard()}
		<div
			class="bento-card bento-card--main"
			data-block="main"
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
									style="--stack-offset: {i -
									activePhotoIndex}; --stack-depth: {Math.abs(
									i - activePhotoIndex
								)}"
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
						<!--
							Одне відділення — знак І НАЗВА; кілька — самі знаки з
							власною підказкою.

							Причина в тому, що назви довгі («Театральне відділення»,
							«Інструментальне відділення»), і три такі поспіль не
							вміщаються в жодну колонку. Коли ж відділення одне,
							ховати його назву за наведенням нема сенсу: місця
							вистачає, а знак сам по собі мало кому щось каже.
						-->
						<div
							class="dept-badges"
							class:dept-badges--single={departments.length === 1}
							data-testid="galaxy-card-dept-badges"
						>
							{#each departments as dept, index (dept)}
								{@const label = $t(`galaxy.departments.${dept}`, {
									default: dept,
								})}
								<span
									class="dept-badge"
									class:dept-badge--tip-left={departments.length > 1 &&
										index < departments.length / 2}
									role="img"
									aria-label={label}
									data-testid="galaxy-card-dept-badge-{dept}"
								>
									<DepartmentIcon
										department={dept}
										size={18}
									/>
									{#if departments.length === 1}
										<span class="dept-badge__name">{label}</span>
									{:else}
										<!--
											Підказка виїжджає НАЗОВНІ від ряду: знак із
											лівої половини розкриває її ліворуч, із
											правої — праворуч. Усередину не можна —
											там сусідні знаки, і підказка лягала б
											просто на них.
										-->
										<span class="dept-badge__tip" aria-hidden="true">{label}</span>
									{/if}
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

			<!--
				ОДРАЗУ під іменем, перед соцмережами: це друга роль тієї самої
				людини, тобто продовження того, хто вона, а не ще одна ознака в
				переліку. Нижче, під роками, воно губилося між ними й групою.

				І не в переліку майстрів: там ідеться про ЧУЖИХ людей, у яких ця
				людина вчилася, і посилання на неї саму читалося б як «вона
				вчилася в себе».
			-->
			{#if alsoMaster}
				<a
					href={masterProfilePath(alsoMaster.slug, isEn ? "en" : "uk")}
					class="teacher-page-link"
					data-testid="galaxy-card-teacher-page-link"
				>
					<span
						>{$t(dualRoleMasterLabelKey(alsoMaster), {
							default: "Сторінка викладача",
						})}</span
					>
					<ArrowRight size={16} aria-hidden="true" />
				</a>
			{/if}

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
				kind={graduate.kind}
				{isEn}
			/>

			<!--
				Кнопка з'являється за ДВОМА ознаками: немає знімка або невідомий рік
				вступу. Це навмисно не «мало даних узагалі»: у кого є фото й рік
				вступу, тому нема про що нагадувати, навіть якщо решта скупа —
				решту заповнює школа, а не він.
			-->
			{#if askForForm}
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
					<span class="galaxy-block-title">{$t("galaxy.group")}:</span>
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
									<!--
										`showAll`: половина складу тут гірша за високий чип. Груп
										більше за одинадцять людей у базі немає, тож найгірший
										випадок — два поверхи облич.

										`openInPlace` лише в МОДАЛЦІ (`heading === "h2"`): там картку
										малює `GraduateCard`, і однокурсник законно підмінює
										поточного. На власній сторінці (`h1`) картка сама і є
										сторінкою, малювати нову нікому — тому там звичайний перехід.
									-->
									<GroupMatesRow
										groupSlug={item.slug}
										excludeId={graduate.id}
										showAll
										openInPlace={heading === "h2"}
									/>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

<!--
				Чекати можна лише на те, що справді існує.

				Умова пережила дві неправильні версії. Спершу це був
				`graduate.hasPhoto` — фото правило за ознаку анкети, а портрет є в
				багатьох, у кого анкети немає, і в них картка вічно писала
				«Завантаження…». Потім `graduate.code` — уже ближче, бо код
				адресував файл, але й він не про те: коди має 90 людей, а анкети
				93, тож троє (Ілля Трифонов, Михайло Прядко, Олена Белугіна)
				чекали молча, поки їхня анкета вантажилася.

				Ознака наявності анкети одна й називається `hasProfile`.
			-->
			{#if !profile && hasProfile(graduate)}
				<p class="row" data-testid="galaxy-card-loading-status">
					{$t("common.loading")}
				</p>
			{/if}
		</div>
{/snippet}

{#snippet mastersCard()}
			<div
				class="bento-card bento-card--faculty"
				data-block="masters"
				data-testid="galaxy-card-masters-card"
			>
				{@render mastersContent()}
			</div>
{/snippet}

{#snippet teachersCard()}
			<div
				class="bento-card bento-card--faculty"
				data-block="teachers"
				data-testid="galaxy-card-teachers-card"
			>
				{#if normalizedTeachers.length > 0}
					{@render teachersContent()}
				{:else}
					<div class="block">
						<h3 class="block__title galaxy-block-title">
							{$t("galaxy.teachers", { default: "Викладачі" })}:
						</h3>
						<GraduateBlockEmpty
							base="galaxy-card-teachers"
							{askForForm}
							hasPhoto={!!graduate.hasPhoto}
							onform={openForm}
						/>
					</div>
				{/if}
			</div>
{/snippet}


{#snippet bioCard()}
				<div
					class="bento-card bento-card--bio"
					data-block="bio"
					data-testid="galaxy-card-bio-section"
				>
					{#if !hasBio}
						<section class="block">
							<h3 class="block__title galaxy-block-title">{$t("galaxy.about")}</h3>
							<GraduateBlockEmpty
								base="galaxy-card-bio"
								{askForForm}
								hasPhoto={!!graduate.hasPhoto}
								onform={openForm}
							/>
						</section>
					{/if}

					{#if profile?.duringStudies}
						<section class="block">
							<h3 class="block__title galaxy-block-title">
								{$t("galaxy.duringStudies")}
							</h3>
							<p class="para">
								<RichTextWithFlags
									text={profile!.duringStudies}
								/>
							</p>
						</section>
					{/if}

					{#if profile?.afterGraduation}
						<section class="block">
							<h3 class="block__title galaxy-block-title">
								{$t("galaxy.afterGraduation")}
							</h3>
							<p class="para">
								<RichTextWithFlags
									text={profile!.afterGraduation}
								/>
							</p>
						</section>
					{/if}

					{#if profile && profile.bio.length > 0}
						<section class="block">
							<h3 class="block__title galaxy-block-title">{$t("galaxy.about")}</h3>
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

					{#if profile && profile.festivals.length > 0}
						<section
							class="block"
							data-testid="galaxy-card-festivals-section"
						>
							<h3 class="block__title galaxy-block-title">
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
{/snippet}

{#snippet blockOf(key: string)}
	{#if key === "main"}{@render mainCard()}
	{:else if key === "plays"}{@render playsCard()}
	{:else if key === "masters"}{@render mastersCard()}
	{:else if key === "teachers"}{@render teachersCard()}
	{:else if key === "festivals"}{@render festivalsCard()}
	{:else if key === "bio"}{@render bioCard()}{/if}
{/snippet}

<div class="layout-scope">
	<div
		class="profile-layout"
		style="--cols: {columns.length}; --grid-cols: {gridColumns}"
		bind:this={layoutEl}
		data-measured={widthKnown ? "yes" : "no"}
		data-testid="galaxy-profile-container"
	>
		{#each columns as keys, index (index)}
			<div
				class="col"
				{@attach customScroll({ alignThumb: "right", rightOffset: -10 })}
				{@attach scrollFade()}
				data-testid="galaxy-profile-column-panel-{index}"
			>
				{#each keys as key (key)}
					{@render blockOf(key)}
				{/each}
			</div>
		{/each}
	</div>
</div>

<GraduateFormModal isOpen={formModalOpen} onclose={closeForm} />


<style>
	/*
	 * БЕЗ `container-type`, хоч це й напрошувалося.
	 *
	 * Заміряно: усередині `.card__inner`, у якого `width: fit-content`, розмірний
	 * контейнер має ширину НУЛЬ — containment каже браузеру, що розмір не
	 * залежить від вмісту, а батько водночас стискається до вмісту. Тому
	 * контейнерні запити тут неможливі без відмови від fit-content у модалці, і
	 * межі рахуються від вікна.
	 */
	/*
	 * Обгортка передає висоту вниз: від картки до колонок.
	 *
	 * Без `min-height: 0` жодна стеля згори сюди не доходить — типове
	 * `min-height: auto` у флекс-елемента означає «не менше за зміст», і колонки
	 * розпихали б картку замість того, щоб прокручуватися всередині неї.
	 */
	.layout-scope {
		width: 100%;
		flex: 1 1 auto;
		min-height: 0;
		/*
		 * Флекс, а не відсотки. Заміряно: `height: 100%` на розкладці не діяв
		 * зовсім — навіть інлайном, — бо власна висота обгортки прийшла від
		 * флексу батька, і відсоток проти такої висоти не резолвиться.
		 * Флексовий ланцюг такої вимоги не має: він роздає доступне місце за
		 * фактично використаною висотою.
		 */
		display: flex;
		flex-direction: column;
	}
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
	/*
	 * Класів `col--left/center/right` більше немає: колонка не знає, що в ній
	 * лежить. Порядок плашок задає розподіл у скрипті, а вигляд — класи самих
	 * плашок.
	 */

	/*
	 * Стала палітра галактики для плашки фестивалів. Значення ті самі, що в
	 * сусідніх блоках картки: тло напівпрозоре біле, рамка блакитна, текст
	 * `--galaxy-*`.
	 */
	.fests-galaxy {
		--fest-surface: rgb(255 255 255 / 0.07);
		--fest-border: rgb(140 190 255 / 0.25);
		--fest-text: var(--galaxy-text);
		--fest-title: var(--galaxy-text);
		--fest-muted: var(--galaxy-muted);
		--fest-accent: var(--galaxy-accent);
	}
	.bento-card {
		width: 100%;
		box-sizing: border-box;
	}

	@media (min-width: 768px) {
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
		/*
		 * Скільки колонок — вирішує скрипт і передає числом у `--cols`.
		 *
		 * Медіазапитами це не робиться: сітка тут не самоціль, а наслідок
		 * розподілу плашок, і те саме число потрібне обом. Два джерела правди про
		 * кількість колонок вже призводили до розбіжності — CSS давав три колонки
		 * там, де змісту вистачало на дві.
		 *
		 * Колонки РІВНІ — це умова, без якої розподіл зациклюється: висота
		 * плашки не сміє залежати від того, у яку колонку вона потрапила.
		 *
		 * Але нижня межа в 280 px обов'язкова. З `minmax(0, 1fr)` колонка
		 * схлопувалася до мінімального вмісту, бо картка навколо має
		 * `width: fit-content`, і ширина виходила круговою: колонка питає ширину
		 * в картки, картка — у вмісту. Заміряно на картці без анкети: колонка
		 * 42 px, ім'я переносилося по літерах. У кого анкета заповнена, цього не
		 * було видно — там мінімальний вміст сам по собі широкий.
		 */
		.profile-layout {
			grid-template-columns: var(--grid-cols, repeat(var(--cols, 3), minmax(280px, 1fr)));
			width: 100%;
			/*
			 * `stretch`, а не `start`: інакше кожна колонка має висоту свого
			 * змісту, і «прокручується та, у якої не вмістилося» перетворюється
			 * на «прокручується та, у якої найдовший список», незалежно від
			 * того, скільки місця на екрані.
			 */
			align-items: stretch;
			/*
			 * Один рядок на всю висоту. `auto` дав би рядку висоту НАЙДОВШОГО
			 * змісту (заміряно: 980 px при 852 доступних), і колонки вилазили б
			 * за картку замість того, щоб прокручуватися всередині.
			 */
			grid-template-rows: minmax(0, 1fr);
			flex: 1 1 auto;
			min-height: 0;
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
			/*
			 * Кожна колонка прокручується САМА — прохання замовника, і воно
			 * узгоджується з правилом «прокрутка потрібна, коли місця немає»
			 * рівно за однієї умови: колонка мусить займати ВСЮ доступну висоту.
			 *
			 * Саме цього тут бракувало двічі. Спершу стояли магічні 820 px, потім
			 * `calc(100dvh - 130px)` — обидва рази число не збігалося з дійсним
			 * відступом зверху й не могло збігатися: у модалці він один, на
			 * власній сторінці інший. Заміряно на iPad Pro 1024×1366: колонки
			 * закінчувалися на 952, 980 і 1368 — три різні низи, третій за екраном,
			 * і при цьому список вистав ховав 665 px.
			 *
			 * Тепер числа немає взагалі. Висоту дає ланцюг: картка обмежена вікном,
			 * розкладка розтягується на неї (`height: 100%`), а `stretch` у сітці
			 * робить усі колонки однаково високими. Скролиться та, чий зміст
			 * справді довший за екран, — і рівно вона.
			 */
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

		/*
		 * Осьове вирівнювання належить ПЛАШЦІ, а не колонці: основна плашка й
		 * плашки майстрів центровані де завгодно, бо тепер вони можуть опинитися
		 * у будь-якій колонці.
		 */
		.bento-card--main,
		.bento-card--faculty {
			text-align: center;
		}
		/*
		 * Мірило для назви відділення — ПЛАШКА, а не ряд значків.
		 *
		 * Спершу `container-type` стояв на самому ряду, і це повторило пастку,
		 * уже описану вище біля `.layout-scope`: containment робить ширину
		 * незалежною від вмісту, а ряд лежить у `.photo-container`, який
		 * стискається до вмісту. Заміряно: ряд мав ширину НУЛЬ, кола
		 * перетворилися на овали 20×32 і розповзлися на три рядки. У плашки
		 * ширина справжня — `width: 100%` колонки.
		 */
		.bento-card--main {
			container-type: inline-size;
		}
		.bento-card {
			padding: clamp(1.1rem, 2.2vh, 1.6rem);
		}
		.bento-card--main .photo-container {
			margin: 0 auto 1.1rem;
		}
		.bento-card--main .photo,
		.bento-card--main .photo-stack {
			width: clamp(100px, 40vw, 175px);
			height: clamp(100px, 40vw, 175px);
		}
		.bento-card--main .name {
			font-size: clamp(1.3rem, 3.5dvh, 1.7rem);
			margin: 0 0 0.5rem;
		}
		.bento-card--main .socials {
			margin: 0.2rem 0 0.8rem;
		}
		.bento-card--main .social__img {
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
		.bento-card--main :global(.years) {
			font-size: 0.95rem;
			margin: 0 0 0.9rem;
		}
		.bento-card--main .groups-container {
			font-size: 0.95rem;
			margin: 0 0 1rem;
		}
		.bento-card--main .masters-container {
			margin: 0 0 1.1rem;
		}
		.bento-card--faculty .masters-container {
			margin-bottom: 0;
		}
		.bento-card--main .master-item,
		.bento-card--faculty .master-item {
			padding: 0;
		}
		.bento-card--main .master-link-wrapper,
		.bento-card--faculty .master-link-wrapper {
			padding: 0.25rem 0.75rem;
		}
		.bento-card--main .master-name,
		.bento-card--faculty .master-name {
			font-size: 0.92rem;
		}
		.bento-card--bio {
			font-size: 0.95rem;
		}
		.bento-card--bio {
			padding: clamp(1.1rem, 2.2vh, 1.6rem);
		}
		.bento-card--bio .block {
			margin-top: 0;
			margin-bottom: 1.25rem;
		}
		.bento-card--bio .block__title {
			margin: 0 0 0.5rem;
		}
		.bento-card--bio .para {
			font-size: 0.95rem;
			line-height: 1.55;
			margin: 0 0 0.6rem;
		}
		.bento-card--bio .block:last-child {
			margin-bottom: 0;
		}

		.bento-card {
			background: var(--galaxy-card-bg);
			border: 1px solid rgb(140 190 255 / 0.2);
			border-radius: 1.5rem;
			box-shadow: 0 16px 48px rgb(0 0 0 / 0.4);
			padding: clamp(1.1rem, 2.2vh, 1.6rem);
		}
		/*
		 * Останнє магічне число, що лишалося після зняття стель у колонках:
		 * `max-height: min(88dvh, 820px)`. Заміряно на iPad Pro 1024×1366 —
		 * список вистав показував 734 px із 1399, тобто ховав 665 px, і робив це
		 * тоді, коли під карткою лишалося порожнє місце. Саме це видно на
		 * скріншоті замовника: смуга прокрутки в першій колонці й порожнеча
		 * знизу. Картка більше нічого не обрізає.
		 */
		.bento-card--plays {
			display: flex;
			flex-direction: column;
		}
		.bento-card--plays .block__title {
			flex-shrink: 0;
			margin: 0 0 0.5rem;
		}
		.bento-card--plays .plays {
			font-size: 0.92rem;
			line-height: 1.35;
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
		z-index: 20;
		opacity: 1;
		transform: translate(0, 0) rotate(0deg) scale(1);
	}
	/*
	 * Зсув ПРОПОРЦІЙНИЙ відстані до активного знімка, а не просто «ліворуч /
	 * праворуч».
	 *
	 * Доти `--stack-offset` мав лише три значення — 0, −1 і +1, — тож усі знімки
	 * з одного боку лягали точно один на одного. При трьох фото стопка виглядала
	 * як дві, хоч перемикання й крапки працювали правильно: третій знімок був, але
	 * рівно під другим.
	 *
	 * `--stack-depth` (модуль тієї самої відстані) дає порядок перекриття: ближчий
	 * знімок лежить над дальшим. Без нього всі «за» мали однаковий `z-index`, і
	 * хто з них видимий, вирішував порядок у розмітці.
	 *
	 * Розліт помірний навмисно: у реєстрі максимум три знімки (заміряно), тобто
	 * крайній відходить на 36px і 8°. Ширшого віяла коробка 175px не витримає.
	 */
	.photo--behind {
		z-index: calc(10 - var(--stack-depth));
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

	/*
	 * ВЛАСНА підказка замість рідної.
	 *
	 * Рідна не вміє двох речей, потрібних саме тут: з'явитися одразу (вона
	 * чекає близько секунди, і за цей час курсор устигає піти) і відкритися в
	 * потрібний бік.
	 *
	 * Точка відліку — РЯД знаків, а не сам знак, і це головне рішення тут.
	 * Прив'язана до знака підказка виходила за картку: заміряно на 375 — від
	 * крайнього знака до краю лишається кілька десятків пікселів, і навіть
	 * стиснута до 46 % ширини вона вилазила на 33 px. Прив'язана до ряду вона
	 * впирається в його ж край, тобто за побудовою лишається всередині; а
	 * `max-width` рахується від половини ряду за відніманням половини самого стовпчика
	 * знаків, тож не наїжджає й на них.
	 *
	 * `max-width: 0` у спокої, а не `display: none`: назву треба ВИМІРЯТИ, щоб
	 * розкриття було плавним, а зникле з розкладки не міряється.
	 */
	.dept-badges {
		position: relative;
		/*
		 * На всю ширину, а не до вмісту.
		 *
		 * `.photo-container` — флекс, тож ряд знаків ужимався до 109 px, тобто
		 * рівно до трьох кіл. Через це «край ряду», до якого чіпляється
		 * підказка, збігався з краєм крайнього знака, і вона лягала просто на
		 * нього. Розтягнутий ряд дає їй справжній край картки.
		 */
		width: 100%;
	}
	/*
	 * Знак перестає бути точкою відліку, коли відділень кілька: інакше
	 * підказка, попри `right: 0`, сідає просто на нього — заміряно, вона
	 * перекривала знак у всіх шести перевірених випадках.
	 */
	.dept-badges:not(.dept-badges--single) .dept-badge {
		position: static;
	}
	.dept-badge__tip {
		position: absolute;
		left: auto;
		right: 0;
		top: 50%;
		translate: 0 -50%;
		z-index: 5;
		max-width: 0;
		overflow: hidden;
		/*
		 * Текст ПЕРЕНОСИТЬСЯ, а не обрізається: назви на кшталт «Відділення
		 * сольного співу» одним рядком у відведене місце не вміщаються, а
		 * обрізаний текст не читається взагалі.
		 */
		white-space: normal;
		text-align: center;
		text-wrap: balance;
		line-height: 1.25;
		font-size: 0.72rem;
		font-weight: 600;
		color: #eaf2ff;
		background: rgb(3 6 20 / 0.92);
		border: 1px solid rgb(140 190 255 / 0.4);
		border-radius: var(--radius-full, 9999px);
		padding: 0.3rem 0;
		opacity: 0;
		pointer-events: none;
		transition:
			max-width 0.22s ease,
			padding 0.22s ease,
			opacity 0.18s ease;
	}
	/* Знак із лівої половини ряду розкриває підказку до ЛІВОГО краю. */
	.dept-badge--tip-left .dept-badge__tip {
		right: auto;
		left: 0;
	}
	.dept-badge:hover .dept-badge__tip,
	.dept-badge:focus-visible .dept-badge__tip {
		/*
		 * Половина ряду мінус половина стовпчика знаків: три кола по 32 з
		 * проміжками 6.4 займають 108 px, тобто 54 з кожного боку від центру.
		 */
		max-width: calc(50% - 3.6rem);
		padding: 0.3rem 0.6rem;
		opacity: 1;
	}

	/*
	 * Одне відділення — пілюля з назвою, а не коло зі знаком.
	 *
	 * Ширина тут `auto`, а кегль стискається до `clamp`: назви бувають довгі
	 * («Інструментальне відділення»), а рядок мусить лишитися ОДИН — перенесена
	 * навпіл назва в пілюлі читається як дві різні.
	 */
	.dept-badges--single .dept-badge {
		width: auto;
		gap: 0.35rem;
		padding: 0 0.7rem;
		border-radius: var(--radius-full, 9999px);
		max-width: 100%;
	}
	.dept-badge__name {
		/*
		 * Кегль СТИСКАЄТЬСЯ лише коли треба: 4.6 % ширини картки дає повні
		 * 0.8rem уже на 280 px і опускається до 0.62rem тільки у вузькій
		 * колонці. З 2.4 % назва виходила 9.92 px навіть на десктопі, де місця
		 * вистачало з надлишком (заміряно: 145 px вільних праворуч).
		 */
		font-size: clamp(0.62rem, 4.6cqw, 0.8rem);
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
		color: #cfe4ff;
	}

	.dept-badge {
		position: relative;
		/*
		 * НЕ стискатися: без цього плашки ужималися до 20 px при висоті 32,
		 * тобто кола ставали овалами, а потім і зовсім переносилися по одній на
		 * рядок. Заміряно саме так — 20×32 у трьох рядках.
		 */
		flex-shrink: 0;
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
			box-shadow 0.2s ease,
			border-color 0.2s ease,
			background 0.2s ease;
	}
	/*
	 * БЕЗ `transform` під курсором — і це не смак.
	 *
	 * Трансформований елемент стає системою координат для своїх абсолютних
	 * нащадків, `position: static` того не скасовує. Через це підказка, якій
	 * велено стати біля краю РЯДУ, з'являлася впритул до самого знака — і саме
	 * тоді, коли на нього наводять, тобто рівно в мить, коли її видно.
	 * Заміряно: `left: 0` обчислювався в нуль, а по факту підказка стояла на
	 * 665 px при лівому краї ряду на 520.
	 *
	 * Збільшення замінене на сяйво: воно каже те саме («ця плашка жива»), але
	 * нічого не робить із координатами.
	 */
	.dept-badge:hover {
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.6);
		color: #fff;
		box-shadow: 0 0 0 3px rgb(140 190 255 / 0.18);
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
	/*
	 * Мова та сама, що у `.fill-profile-btn` поряд: картка завжди темна, тож
	 * кольори тут літеральні, а не з тем (сусідній селектор так само). Але
	 * рамка тонша й без тіні — це перехід, а не заклик до дії, і поводитися
	 * помітніше за «Заповнити анкету» він не мусить.
	 */
	.teacher-page-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding: 0.45rem 1rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.08);
		border: 1px solid rgb(140 190 255 / 0.45);
		color: #ffffff;
		text-decoration: none;
		font-size: 0.88rem;
		font-weight: 600;
		transition:
			background 0.2s ease,
			transform 0.2s ease;
	}

	.teacher-page-link:hover {
		background: rgb(255 255 255 / 0.16);
		transform: translateX(3px);
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
	/* Порожня плашка: заголовок і олівець в один рядок, без порожнечі під ними. */


	.block {
		margin-top: 1.1rem;
		text-align: left;
	}

	/*
	 * Рядки вистав малює `GraduatePlayRow` зі своїми стилями (Svelte скоупить їх
	 * по компоненту). Тут лишаються `.plays`, `.play` і `.play__text`, бо тими
	 * самими класами верстається ще й перелік фестивалів нижче.
	 */
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
	/*
	 * Щільний режим плашки вистав: менший шрифт тут, тісніші рядки — пропом
	 * `dense` у `GraduatePlayRow`. Увімкнений лише там, де зміст не вміщався
	 * (див. `denseCols`), тобто від трьох колонок — а це від 1024px. На телефоні
	 * картка й так один стовпчик, що прокручується сторінкою: дрібніший шрифт
	 * там нічого не виграв би, а читати було б важче.
	 *
	 * Числа з заміру на анкеті Аліка Запольнова, вікно 1280×800, колонка
	 * вміщає 752:
	 *
	 *   як було ....................... 1161
	 *   ширша колонка (1.5fr) ......... 1010
	 *   + шрифт 0.84rem ................ 956
	 *   + відступи рядків 0.22rem ....... 853
	 *
	 * Прокрутка не зникає — переповнення падає з 409 до 101 пікселя.
	 */
	.bento-card--plays-dense .plays {
		font-size: 0.84rem;
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
