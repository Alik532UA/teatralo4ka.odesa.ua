import { browser } from '$app/environment';
import { storage } from './storage';
import { AA_NORMAL, contrast, parseColor, type Rgb } from '$lib/utils/contrast';
import { THEME_CYCLE } from '$lib/config/themes';

/**
 * ЛАБОРАТОРІЯ КОЛЬОРІВ — дизайнер вписує колір і одразу бачить сайт.
 *
 * ## Навіщо, коли є DevTools
 *
 * Правити змінні вміє й браузер, безкоштовно. Але він не знає двох речей, які
 * тут вирішальні.
 *
 * ПЕРШЕ — які саме змінні. Їх тринадцять, у кожної своя роль, і половина ролей
 * не вгадується з назви: `--accent-primary` — це ТЛО кнопки, а `--accent-text`
 * — колір напису, і плутати їх коштувало проєкту двох переробок тем.
 *
 * ДРУГЕ, і це головне — ЧИ ПРОЙДЕ. У проєкті стоїть гейт контрасту, який міряє
 * кожну пару «тло + текст» у КОЖНІЙ темі за WCAG AA і валить збірку. Дизайнер
 * про нього дізнавався востаннє: назвав чотири кольори, розробник розклав їх по
 * ролях, гейт почервонів, кольори довелося міняти. Тут вердикт видно одразу, і
 * рахує його ТА САМА формула, що й гейт (`utils/contrast`).
 *
 * ## Що це НЕ
 *
 * Не редактор тем сайту. Правки живуть у браузері дизайнера й нікому більше не
 * видні: сервер про них не знає, інші відвідувачі теж. Результат віддається
 * кнопкою «Скопіювати CSS» — готовим блоком у файл теми. Тобто інструмент
 * закінчується там, де починається код.
 *
 * ## Чому правки лишаються після закриття панелі
 *
 * Панель закривають, щоб ПОДИВИТИСЯ на сайт без неї — власне заради цього все й
 * робилося. Тому закриття не скасовує кольори; скасовує «Скинути все». Правки
 * переживають і перезавантаження: інакше кожен перехід сторінкою з'їдав би
 * роботу.
 */

/** Токен, який можна правити, і його роль людською мовою. */
export interface LabToken {
	name: string;
	role: string;
}

/**
 * ТРИНАДЦЯТЬ СМИСЛОВИХ ТОКЕНІВ — рівно ті, з яких складена будь-яка тема.
 *
 * Не всі змінні проєкту, а саме ці: решта (`--header-nav-link`, `--btn-all-bg`,
 * `--footer-text`…) виводяться з них або стосуються одного компонента, і
 * пропонувати їх дизайнерові означало б пропонувати тринадцять рішень і сім
 * наслідків одним списком.
 */
export const LAB_TOKENS: readonly LabToken[] = [
	{ name: '--bg-page', role: 'тло всієї сторінки' },
	{ name: '--bg-surface', role: 'смуги й панелі: поля, врізки, поверхні' },
	{ name: '--bg-card', role: 'картки поверх сторінки' },
	{ name: '--bg-header', role: 'шапка' },
	{ name: '--bg-footer', role: 'підвал' },
	{ name: '--text-main', role: 'основний текст' },
	{ name: '--text-title', role: 'заголовки' },
	{ name: '--text-muted', role: 'другорядне: підписи, дати' },
	{ name: '--text-on-accent', role: 'текст ПОВЕРХ акцентної заливки' },
	{ name: '--accent-primary', role: 'заливка кнопок, активні стани' },
	{ name: '--accent-secondary', role: 'другий акцент' },
	{ name: '--accent-text', role: 'акцент як КОЛІР ТЕКСТУ' },
	{ name: '--border-main', role: 'межі полів і карток' }
];

/** Пара «що на чому», яку міряє гейт — і яку тому міряє й панель. */
export interface LabPair {
	fg: string;
	bg: string;
	label: string;
}

/**
 * Вісім пар, а не всі можливі сорок.
 *
 * Це саме ті сполучення, які справді трапляються в розмітці: текст на сторінці,
 * текст на піднятій поверхні, напис на акцентній кнопці. Показувати ще
 * тридцять теоретичних означало б утопити вісім важливих.
 */
export const LAB_PAIRS: readonly LabPair[] = [
	{ fg: '--text-main', bg: '--bg-page', label: 'текст на сторінці' },
	{ fg: '--text-main', bg: '--bg-surface', label: 'текст на поверхні' },
	{ fg: '--text-title', bg: '--bg-page', label: 'заголовок на сторінці' },
	{ fg: '--text-title', bg: '--bg-card', label: 'заголовок на картці' },
	{ fg: '--text-muted', bg: '--bg-page', label: 'другорядне на сторінці' },
	{ fg: '--text-muted', bg: '--bg-surface', label: 'другорядне на поверхні' },
	{ fg: '--text-on-accent', bg: '--accent-primary', label: 'напис на кнопці' },
	{ fg: '--accent-text', bg: '--bg-surface', label: 'акцентний напис на поверхні' }
];

/**
 * Адреса як другий вхід: `?theme-lab=1` відкриває, `?theme-lab=0` закриває.
 *
 * Через дефіс, як `data-*` атрибути й решта параметрів у рядку запиту; ключ
 * сховища при цьому через підкреслення (`theme_lab`) — так само, як
 * `galaxy_festivals_view` і `planet_view` поруч.
 */
export const THEME_LAB_URL_PARAM = 'theme-lab';

const КЛЮЧ = 'theme_lab';

/**
 * ТРИ СТАНИ, а не два.
 *
 * `hidden` — лабораторії немає взагалі; `open` — вікно розгорнуте; `mini` —
 * згорнуте в кнопку, яка стоїть на екрані й розгортається одним дотиком.
 *
 * Третій стан з'явився на прохання автора й закриває реальну незручність:
 * хрестик у першій редакції ховав лабораторію ЦІЛКОМ, і повернути її можна було
 * лише сімома натисканнями `D` — тобто на планшеті ніяк. Тепер хрестик згортає,
 * а прибирає зовсім або жест, або хрестик на самій кнопці.
 */
export type LabMode = 'hidden' | 'mini' | 'open';

/** Місце вікна на екрані — ліворуч-згори, у пікселях. */
export interface LabSpot {
	x: number;
	y: number;
}

/** Що зберігається між заходами. */
interface Збережене {
	mode: LabMode;
	colors: Record<string, string>;
	spot: LabSpot | null;
}

function прочитати(): Збережене {
	const порожньо: Збережене = { mode: 'hidden', colors: {}, spot: null };
	if (!browser) return порожньо;
	const raw = storage.get(КЛЮЧ);
	if (!raw) return порожньо;
	try {
		const дані = JSON.parse(raw) as Partial<Збережене>;
		const кольори: Record<string, string> = {};
		/* Беремо лише ВІДОМІ токени: у сховищі міг лишитися ключ від старої
		   редакції переліку, і вставляти його в документ немає підстав. */
		for (const { name } of LAB_TOKENS) {
			const значення = дані.colors?.[name];
			if (typeof значення === 'string' && значення) кольори[name] = значення;
		}
		const режим: LabMode =
			дані.mode === 'open' || дані.mode === 'mini' ? дані.mode : 'hidden';
		const місце =
			дані.spot && Number.isFinite(дані.spot.x) && Number.isFinite(дані.spot.y)
				? { x: дані.spot.x, y: дані.spot.y }
				: null;
		return { mode: режим, colors: кольори, spot: місце };
	} catch {
		// Зіпсований запис — не привід падати: лабораторія просто почнеться чистою.
		return порожньо;
	}
}

/**
 * Поточне значення токена в документі — щоб поля відкрилися заповненими.
 *
 * Через пробний елемент, а не `getPropertyValue`: той віддає ЗАПИСАНЕ значення,
 * тобто `light-dark(var(…), var(…))`, і показати таке в полі кольору не можна.
 * Кінцевий колір знає лише рушій.
 */
export function currentColor(token: string): string {
	if (!browser) return '';
	const зонд = document.createElement('span');
	зонд.style.display = 'none';
	зонд.style.color = `var(${token})`;
	document.body.appendChild(зонд);
	const обчислене = getComputedStyle(зонд).color;
	зонд.remove();
	const rgb = parseColor(обчислене);
	if (!rgb) return '';
	return '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');
}

class ThemeLab {
	/** Стан вікна. Кольори від нього не залежать — див. докблок модуля. */
	mode = $state<LabMode>('hidden');
	/** Що дизайнер переписав. Порожньо — тема сайту без змін. */
	colors = $state<Record<string, string>>({});
	/** Куди його перетягнули. `null` — ще не рухали, стане праворуч згори. */
	spot = $state<LabSpot | null>(null);

	/**
	 * Якими токени були ДО правок — знімок теми на момент відкриття.
	 *
	 * Потрібен двом речам: підказці «було таке» біля зміненого поля й самому
	 * поняттю «змінено». Доти панель знала лише, що значення переписане, але не
	 * могла сказати, чим воно було, — а саме це питання й виникає першим, коли
	 * колір не подобається.
	 *
	 * Знімок НЕ зберігається між заходами: тема могла змінитися, і вчорашній
	 * знімок брехав би. Береться при гідрації, до застосування правок.
	 */
	baseline = $state<Record<string, string>>({});

	/**
	 * Історія для скасування — до двадцяти кроків.
	 *
	 * Доти відкотити невдалий колір можна було лише «Скинути все», тобто
	 * втратити дванадцять вдалих рішень через одне невдале. Для інструмента, у
	 * якому колір підбирають ітераціями, це робило кожен експеримент дорогим —
	 * і тому експериментів не робили.
	 *
	 * Зберігаються ЗНІМКИ всієї мапи, а не окремі дії: мапа мала (тринадцять
	 * рядків), а знімок не треба вміти обертати — його просто повертають.
	 * Двадцять кроків — стільки, скільки людина пам'ятає про свій же сеанс.
	 */
	private історія: Array<Record<string, string>> = [];
	private повтор: Array<Record<string, string>> = [];

	get canUndo(): boolean {
		return this.історія.length > 0;
	}

	get canRedo(): boolean {
		return this.повтор.length > 0;
	}

	/** Скільки токенів переписано — для підпису на кнопці скидання. */
	get changedCount(): number {
		return Object.keys(this.colors).length;
	}

	/**
	 * Читання сховища — РІВНО ОДИН раз за життя сторінки.
	 *
	 * Прапорець тут, а не в тому, хто кличе: перша редакція викликала `hydrate()`
	 * з `$effect`, і той падав із `effect_update_depth_exceeded` — ефект читав
	 * стан, який сам же й записував. Захист усередині означає, що метод
	 * безпечний, хай би звідки його покликали.
	 */
	private гідровано = false;

	hydrate() {
		if (!browser || this.гідровано) return;
		this.гідровано = true;
		const збережене = прочитати();
		/* Знімок ДО застосування правок — інакше «було» показувало б те саме, що
		   й «стало». */
		const знімок: Record<string, string> = {};
		for (const { name } of LAB_TOKENS) знімок[name] = currentColor(name);
		this.baseline = знімок;

		this.colors = збережене.colors;
		this.mode = збережене.mode;
		this.spot = збережене.spot;
		this.applyAll();
	}

	private зберегти() {
		if (!browser) return;
		storage.set(
			КЛЮЧ,
			JSON.stringify({ mode: this.mode, colors: this.colors, spot: this.spot })
		);
	}

	/**
	 * Інлайновий стиль на `html`, а не клас чи вставлений `<style>`.
	 *
	 * Оголошення в атрибуті `style` переважує будь-який селектор без `!important`
	 * — тобто перекриває і `:root`, і `.dark-theme`, і `light-dark()` усередині
	 * них. Це рівно та сила, яка тут потрібна: панель мусить перебити тему, хай
	 * би яка стояла, і не мусить нічого знати про те, як саме її зібрано.
	 */
	private applyAll() {
		if (!browser) return;
		for (const { name } of LAB_TOKENS) {
			const значення = this.colors[name];
			if (значення) document.documentElement.style.setProperty(name, значення);
			else document.documentElement.style.removeProperty(name);
		}
	}

	/** Запам'ятати поточний стан перед зміною. Порожній крок не пишеться. */
	private запам_ятати() {
		this.історія.push({ ...this.colors });
		if (this.історія.length > 20) this.історія.shift();
		this.повтор = [];
	}

	undo() {
		const попереднє = this.історія.pop();
		if (!попереднє) return;
		this.повтор.push({ ...this.colors });
		if (this.повтор.length > 20) this.повтор.shift();
		this.colors = попереднє;
		this.applyAll();
		this.зберегти();
	}

	redo() {
		const наступне = this.повтор.pop();
		if (!наступне) return;
		this.історія.push({ ...this.colors });
		if (this.історія.length > 20) this.історія.shift();
		this.colors = наступне;
		this.applyAll();
		this.зберегти();
	}

	setColor(token: string, value: string) {
		this.запам_ятати();
		const чисте = value.trim();
		if (чисте && parseColor(чисте)) this.colors = { ...this.colors, [token]: чисте };
		else {
			const { [token]: _прибране, ...решта } = this.colors;
			void _прибране;
			this.colors = решта;
		}
		this.applyAll();
		this.зберегти();
	}

	reset() {
		this.запам_ятати();
		this.colors = {};
		this.applyAll();
		this.зберегти();
	}

	setMode(value: LabMode) {
		this.mode = value;
		this.зберегти();
	}

	/**
	 * Жест і адреса перемикають між «немає» і «розгорнуте».
	 *
	 * Згорнуте сюди не входить навмисно: у нього свій вхід — кнопка на екрані, —
	 * і якби жест гортав три стани по колу, з планшета неможливо було б дійти до
	 * потрібного, бо на планшеті жесту немає взагалі.
	 */
	toggle() {
		this.setMode(this.mode === 'hidden' ? 'open' : 'hidden');
	}

	setSpot(value: LabSpot | null) {
		this.spot = value;
		this.зберегти();
	}

	/**
	 * Готовий блок для файлу теми.
	 *
	 * Селектором береться клас ЧИННОЇ теми, бо саме її дизайнер щойно правив, і
	 * саме в цей файл піде блок. Токени, яких він не чіпав, у блок не йдуть:
	 * переписати тему цілком її ж власними значеннями означало б зробити
	 * невидимою ту частину, яку справді змінили.
	 *
	 * Тему передає ВИКЛИКАЧ, а не читає звідси `document`. Перша редакція брала
	 * її атрибутом `data-theme`, і це був тихий дефект: читання DOM нічого не
	 * повідомляє Svelte, тож після перемикання теми в блоці лишалася стара
	 * назва, аж поки вікно не перевідкриють.
	 */
	/**
	 * ЗВОРОТНИЙ БІК `toCss`: узяти готовий блок і розкласти його по полях.
	 *
	 * ## Навіщо
	 *
	 * Прохання автора: «скопіювати кольори можна, а ось знову їх вставити ні».
	 * Панель уміла лише віддавати результат, тож будь-який варіант, збережений
	 * учора, повернути було нічим — його доводилося набирати тринадцятьма
	 * полями заново. Через це варіанти й не зберігали: ціна повернення була
	 * вищою за ціну «намалювати ще раз».
	 *
	 * Разом із цим закривається й друге, про що автор не питав, але що виходить
	 * само: сюди вставляється БУДЬ-ЯКИЙ блок теми з файлів проєкту. Тобто
	 * почати правку не з чинної теми, а з сусідньої, тепер можна копіюванням.
	 *
	 * ## Що саме береться
	 *
	 * Рядки виду `--токен: значення;` — і тільки ті токени, які панель узагалі
	 * знає. Селектор, дужки, коментарі й чужі змінні ігноруються мовчки: блок
	 * прилітає з файлу теми, де поруч живуть десятки рядків, яких панель не
	 * пропонує, і падати на них означало б не приймати саме те, заради чого
	 * вставка й потрібна.
	 *
	 * Значення перевіряється тією самою `parseColor`, що й поле: непрочитане
	 * не застосовується. Повертається число застосованих — щоб панель могла
	 * сказати «взято сім», а не мовчати.
	 */
	fromCss(text: string): number {
		if (!text) return 0;
		const відомі = new Set(LAB_TOKENS.map((t) => t.name));
		const нові: Record<string, string> = {};
		for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}\r\n]+)/gi)) {
			const токен = m[1].trim();
			const значення = m[2].trim();
			if (!відомі.has(токен) || !parseColor(значення)) continue;
			нові[токен] = значення;
		}
		const скільки = Object.keys(нові).length;
		if (скільки === 0) return 0;
		this.запам_ятати();
		this.colors = { ...this.colors, ...нові };
		this.applyAll();
		this.зберегти();
		return скільки;
	}

	/**
	 * ВЛАСНІ значення кожної теми — без правок дизайнера.
	 *
	 * Панель править одну тему, а гейт контрасту в CI міряє всі шість. Щоб
	 * відповісти «а якщо ці кольори покласти в кожну», треба знати, ЩО в кожній
	 * темі зараз, — і взяти це можна лише в рушія: значення складені з
	 * `light-dark()` і кількох шарів селекторів.
	 *
	 * ## Чому тема перемикається просто на `html`
	 *
	 * Теми оголошені селекторами `html.dark-theme` і `html[data-theme='dark']`,
	 * тож пробний елемент десь усередині сторінки їх не побачить у принципі:
	 * до нього дійде тільки успадковане значення чинної теми.
	 *
	 * ## Чому цього не видно оком
	 *
	 * Увесь обхід синхронний: браузер малює кадр лише коли віддають керування, а
	 * до того моменту все вже повернуто на місце. Інлайнові правки на час читання
	 * знімаються — інакше кожна тема віддавала б їх замість свого.
	 */
	/**
	 * Замінити ВЕСЬ набір кольорів одразу — завантаження збереженого варіанта.
	 *
	 * Не тринадцять викликів `setColor`: кожен писав би свій крок в історію, і
	 * одне «скасувати» після завантаження відкочувало б лише останній токен.
	 * Завантаження — одна дія, отже один крок.
	 */
	replaceAll(colors: Record<string, string>) {
		this.запам_ятати();
		const чисті: Record<string, string> = {};
		for (const { name } of LAB_TOKENS) {
			const значення = colors[name];
			if (typeof значення === 'string' && значення && parseColor(значення)) {
				чисті[name] = значення;
			}
		}
		this.colors = чисті;
		this.applyAll();
		this.зберегти();
	}

	readThemeTokens(): Record<string, Record<string, string>> {
		if (!browser) return {};
		const root = document.documentElement;
		const булиКласи = root.className;
		const булаТема = root.getAttribute('data-theme');
		const збережені: Record<string, string> = {};
		for (const { name } of LAB_TOKENS) {
			збережені[name] = root.style.getPropertyValue(name);
			root.style.removeProperty(name);
		}

		const наслідок: Record<string, Record<string, string>> = {};
		try {
			for (const тема of THEME_CYCLE) {
				root.className = булиКласи
					.split(/\s+/)
					.filter((c) => c && !c.endsWith('-theme'))
					.concat(`${тема}-theme`)
					.join(' ');
				root.setAttribute('data-theme', тема);
				const набір: Record<string, string> = {};
				for (const { name } of LAB_TOKENS) набір[name] = currentColor(name);
				наслідок[тема] = набір;
			}
		} finally {
			root.className = булиКласи;
			if (булаТема === null) root.removeAttribute('data-theme');
			else root.setAttribute('data-theme', булаТема);
			for (const [name, значення] of Object.entries(збережені)) {
				if (значення) root.style.setProperty(name, значення);
			}
		}
		return наслідок;
	}

	toCss(theme: string): string {
		const рядки = LAB_TOKENS.filter(({ name }) => this.colors[name]).map(
			({ name }) => `\t${name}: ${this.colors[name]};`
		);
		if (рядки.length === 0) return `/* Жодного кольору не змінено (${theme}) */`;
		return `.${theme}-theme {\n${рядки.join('\n')}\n}`;
	}
}

export const themeLab = new ThemeLab();

/**
 * Контраст пари за ВЖЕ ЗІБРАНИМИ кольорами.
 *
 * Чиста функція, і це не смак. Перша редакція міряла прямо під час рендеру:
 * читала документ пробним елементом, тобто створювала й видаляла вузол на
 * кожне перемальовування панелі. Тепер кольори збирає той, хто малює, — один
 * раз при монтуванні й далі з полів, — а тут лишається сама арифметика.
 *
 * `null` означає «не порахували», а не «пройшло»: напівпрозорий колір без
 * знання того, що під ним, контрасту не має, і вигадувати його тут було б
 * гірше за мовчання.
 */
export function pairRatio(pair: LabPair, resolved: Record<string, string>): number | null {
	const fg = parseColor(resolved[pair.fg] ?? '');
	const bg = parseColor(resolved[pair.bg] ?? '');
	if (!fg || !bg) return null;
	return contrast(fg as Rgb, bg as Rgb);
}

/** Чи проходить пара поріг AA. `null` — не порахували. */
export function pairPasses(pair: LabPair, resolved: Record<string, string>): boolean | null {
	const r = pairRatio(pair, resolved);
	return r === null ? null : r >= AA_NORMAL;
}
