import { browser } from '$app/environment';
import { untrack } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';
import { ui } from './ui.svelte';

/**
 * Зациклена головна: сторінка не закінчується, а починається спочатку.
 *
 * ## Як це влаштовано
 *
 * Смуга вмісту головної (`[data-endless-band]`, тобто `.home-content`) лишається
 * ОДНА й лишається живою. Обабіч неї стоять дві **смуги розгону** — порожні
 * контейнери з `+layout.svelte`, які цей контролер заповнює мертвими копіями
 * смуги й обрізає `overflow: hidden`:
 *
 * ```
 *   [ розгін ↑ ]  показує КІНЕЦЬ смуги      висота R
 *   [  смуга   ]  справжня, жива            висота H
 *   [ розгін ↓ ]  показує ПОЧАТОК смуги     висота R
 * ```
 *
 * Читач завжди тримається в межах `[lapTop, lapTop + H)`. Щойно він виходить за
 * край — сторінка миттєво переставляється на H пікселів назад. Перестановка
 * непомітна за побудовою: у мить переходу видно рівно ту саму картинку, бо
 * розгін і є копія того, що буде після стрибка.
 *
 * ## Чому розгін потрібен З ОБОХ боків
 *
 * Униз перестановка спрацьовує, коли ВЕРХ вікна перетнув кінець смуги, тобто
 * коли вікно цілком усередині нижнього розгону — йому треба `висота вікна`
 * плюс запас на перельот. Угору навпаки: перестановка спрацьовує, коли верх
 * вікна пішов вище початку смуги, і видно лише вузьку стрічку розгону.
 *
 * Висота обом дана однакова, і це свідомо: копія DOM робиться ціла (обрізає її
 * `overflow`), тож вужчий верхній розгін НЕ заощадив би жодного вузла — лише
 * зменшив би запас на перельот. Симетрія натомість лишає в коді одну величину
 * замість двох.
 *
 * ## Чому копії, а не другий екземпляр компонентів
 *
 * Другий живий екземпляр смуги мав би ВЛАСНИЙ стан: свій номер знімка в
 * слайдшоу героя (перемикається кожні 10 с), свій слайд у каруселях новин і
 * проєктів (автопрокрутка кожні 7 с). Стани розійшлися б за секунди — і саме
 * та перестановка, яку тут ховають, стала б видимою як стрибок вмісту. Мертва
 * копія цієї вади не має: її переробляють із живої смуги щоразу, коли та
 * змінилася, і завжди поки розгін ЗА межами вікна.
 *
 * Ціна названа прямо: копія не інтерактивна. Атрибут `inert` на контейнері
 * робить це чесним — знімок у розгоні не фокусується, читалка його не бачить,
 * і клік по ньому не «зникає», а не існує. Видно розгін не довше одного
 * вікна прокрутки, і рівно в цей час поруч уже їде справжня смуга.
 *
 * ## Чому `id` і `data-testid` знімаються
 *
 * Той самий доказ, що й у `Minimap.buildClone()`: на головній 1496 `data-testid`
 * і 7 `id` усередині `main`. Друга копія кожного зламала б `getElementById`,
 * а `e2e/testid.spec.ts` і правило `duplicate-id` в axe впали б — і мали б
 * рацію.
 */

/** Сенсорні пристрої лишаються з нативною прокруткою — там жест, а не колесо. */
const canHover = new MediaQuery('(hover: hover) and (pointer: fine)');
/**
 * З 1025 px підвал стає `fixed` (`FooterSection.svelte`), тобто перестає бути
 * кінцем сторінки. Нижче цієї межі він звичайний блок заввишки 380 px, і коло
 * або зробило б його недосяжним, або повторювало б копірайт щокола. Тому
 * зациклення — рівно там, де підвал і так не в потоці.
 */
const footerIsFixed = new MediaQuery('(min-width: 1025px)');

/**
 * Запас розгону понад висоту вікна, px.
 *
 * Перестановка спрацьовує на ПОДІЇ прокрутки, тобто не частіше ніж раз на
 * кадр. За кадр швидкий ривок тачпада проходить кількасот пікселів — саме
 * стільки розгону й треба понад вікно, інакше в мить перельоту край вікна
 * зазирнув би за копію, у порожній відступ `main`.
 */
const SLACK = 400;

/** Не частіше за це переробляємо копії — вони змінюються від кожного знімка. */
const REFRESH_MS = 250;

type Side = 'head' | 'tail';

class EndlessState {
	#band: HTMLElement | null = null;
	#hosts: Record<Side, HTMLElement | null> = { head: null, tail: null };
	#stale: Record<Side, boolean> = { head: true, tail: true };
	#refreshedAt = 0;
	#resize: ResizeObserver | null = null;
	#mutations: MutationObserver | null = null;

	/** Висота однієї смуги вмісту, px. Довжина кола. */
	bandHeight = $state(0);
	/** Висота розгону з кожного боку, px. */
	runwayHeight = $state(0);
	viewportHeight = $state(0);
	/** Верх смуги в координатах документа, px. */
	bandTop = $state(0);

	/**
	 * Не «хочемо», а «стоїть».
	 *
	 * Окреме поле, а не `$derived` від настройки: між бажанням і встановленням
	 * лежать вимір, копії та переставлена прокрутка, і всі споживачі геометрії
	 * мусять перемкнутися саме тоді, коли розгін уже в документі. Похідне
	 * значення перемкнуло б їх на кадр раніше — на геометрію, якої ще немає.
	 */
	active = $state(false);

	/** Чи є де вмикати: десктоп із мишею й підвалом поза потоком. */
	readonly supported = $derived(browser && canHover.current && footerIsFixed.current);

	/**
	 * Верх поточного кола. Споживачам він потрібен як нуль сторінки: саме сюди
	 * веде «нагору», і від нього рахується глибина.
	 */
	get lapTop(): number {
		return this.active ? this.bandTop : 0;
	}

	/**
	 * Глибина ВСЕРЕДИНІ кола з сирого `window.scrollY`.
	 *
	 * Єдиний спосіб, яким решта сайту дізнається про зациклення. Шапка,
	 * кнопка «нагору», власна смуга й мінімапа просять цю величину замість
	 * `window.scrollY` — і поводяться так, ніби сторінка звичайна й одна.
	 */
	lapY(y: number): number {
		return this.active ? Math.max(y - this.bandTop, 0) : y;
	}

	/**
	 * Глибина останнього екрана кола — туди веде «кінець сторінки».
	 *
	 * Це НЕ кінець шкали (див. `pageHeight`), і різниця в одну висоту вікна тут
	 * навмисна: за останнім екраном лежить шов, який читач проходить прокруткою,
	 * але цілитися в який немає сенсу — там уже видно початок наступного кола.
	 */
	get lastScreen(): number {
		return Math.max(this.bandHeight - this.viewportHeight, 0);
	}

	/**
	 * Висота сторінки, яку бачать малювальники положення: смуга плюс вікно.
	 *
	 * Тобто шкала покриває ВСЕ коло, включно зі швом. Це вирішує дефект, який
	 * було видно найкраще: при шкалі завдовжки рівно зі смугу повзунок на шві
	 * ЗАМИРАВ — останню висоту вікна читач прокручував, а індикатор стояв
	 * унизу, ніби сторінка скінчилася й нічого не відбувається.
	 *
	 * Тепер він проходить шов до кінця й з'являється згори — тобто показує те,
	 * що насправді сталося: коло замкнулося.
	 */
	pageHeight(raw: number): number {
		return this.active ? this.bandHeight : raw;
	}

	/**
	 * Вмикання й вимикання одним викликом з `+layout.svelte`.
	 *
	 * Усі залежності читаються ТУТ, синхронно, тому `$effect`, що його кличе,
	 * сам перезапускається і від перемикача в меню смуги, і від зміни ширини
	 * вікна, і від переходу на іншу сторінку. Повернена функція — прибирання
	 * того ж ефекту.
	 */
	install = (head: HTMLElement | null, tail: HTMLElement | null, onHome: boolean) => {
		if (!browser || !onHome || !this.supported || !ui.endlessScroll) return;
		if (!head || !tail) return;
		/*
		 * Далі — `untrack`, і без нього механізм не працює взагалі.
		 *
		 * Вище читаються САМЕ ті величини, від яких ефект має перезапускатися:
		 * настройка, придатність пристрою, маршрут. Нижче ж уся геометрія кола
		 * і читається, і ПИШЕТЬСЯ. Без `untrack` ефект підписався б на власні
		 * записи — і Svelte 5 обірвав би його `effect_update_depth_exceeded`.
		 *
		 * Реактивності споживачів це не забирає: `lapY()` і `pageHeight()`
		 * читають ті самі поля вже з ЇХНІХ ефектів, тож смуга й мінімапа
		 * перемірюються, щойно розгін стає на місце.
		 */
		return untrack(() => this.#setUp(head, tail));
	};

	#setUp(head: HTMLElement, tail: HTMLElement) {
		const band = document.querySelector<HTMLElement>('[data-endless-band]');
		if (!band) return;

		this.#band = band;
		this.#hosts = { head, tail };

		// Глибина ДО вставки розгону: нижче вона стане глибиною в колі.
		const before = window.scrollY;
		this.#measure();

		// Смуга, коротша за вікно, не прокручується — зациклювати нічого.
		if (this.bandHeight <= this.viewportHeight) {
			this.#hosts = { head: null, tail: null };
			this.#band = null;
			return;
		}

		this.#dress();
		this.active = true;
		this.#refresh(true);
		this.#measure();
		this.#go(this.bandTop + (before % this.bandHeight));

		window.addEventListener('scroll', this.#onScroll, { passive: true });
		window.addEventListener('resize', this.#onResize);
		window.addEventListener('keydown', this.#onKey);

		/*
		 * Спостерігач за РОЗМІРОМ смуги, бо вона росте вже після вставки:
		 * доїжджають знімки, розділ «Відділення» приходить лінивим завантаженням,
		 * новини й проєкти — з Firestore. Довжина кола мусить іти за нею, інакше
		 * перестановка почала б промахуватися рівно на приріст.
		 */
		this.#resize = new ResizeObserver(this.#onResize);
		this.#resize.observe(band);
		/*
		 * І за ДОКУМЕНТОМ окремо. Смуга може не змінити власної висоти, а
		 * поїхати: `main` має відступ згори з `--ticker-height`, і поява рядка
		 * новин зсуває початок кола. Спостерігач за самою смугою про це не
		 * дізнається ніколи, а перестановка почала б промахуватися рівно на
		 * висоту рядка.
		 */
		this.#resize.observe(document.documentElement);

		/*
		 * Спостерігач за ЗМІСТОМ смуги лише зводить прапорець — переробка копії
		 * відкладається до найближчої прокрутки, і то поки розгін за межами
		 * вікна. Інакше кожен перегорнутий слайд каруселі клонував би півтори
		 * тисячі вузлів просто під рукою в читача.
		 */
		this.#mutations = new MutationObserver(() => {
			this.#stale = { head: true, tail: true };
		});
		this.#mutations.observe(band, {
			subtree: true,
			childList: true,
			attributes: true,
			characterData: true
		});

		return () => this.#uninstall();
	}

	#uninstall() {
		const lap = this.lapY(window.scrollY);

		window.removeEventListener('scroll', this.#onScroll);
		window.removeEventListener('resize', this.#onResize);
		window.removeEventListener('keydown', this.#onKey);
		this.#resize?.disconnect();
		this.#mutations?.disconnect();
		this.#resize = null;
		this.#mutations = null;

		for (const side of ['head', 'tail'] as Side[]) this.#hosts[side]?.replaceChildren();
		this.#undress();
		this.active = false;

		// Читач лишається там, де стояв: у координатах уже звичайної сторінки
		// його місце — це глибина в колі.
		this.#go(Math.max(lap, 0));

		this.#hosts = { head: null, tail: null };
		this.#band = null;
		this.#stale = { head: true, tail: true };
	}

	#measure() {
		this.viewportHeight = window.innerHeight;
		this.runwayHeight = this.viewportHeight + SLACK;
		this.bandHeight = this.#band ? Math.round(this.#band.getBoundingClientRect().height) : 0;
		this.bandTop = this.#band
			? Math.round(this.#band.getBoundingClientRect().top + window.scrollY)
			: 0;
	}

	/** Розгін живе інлайновою висотою: у спокої контейнери нульові й нічого не важать. */
	#dress() {
		for (const side of ['head', 'tail'] as Side[]) {
			const host = this.#hosts[side];
			if (host) host.style.height = `${this.runwayHeight}px`;
		}
	}

	#undress() {
		for (const side of ['head', 'tail'] as Side[]) {
			const host = this.#hosts[side];
			if (host) host.style.height = '';
		}
	}

	/**
	 * Мертва копія смуги, зсунута так, щоб у вікні розгону було потрібне місце.
	 *
	 * Верхній розгін показує КІНЕЦЬ смуги, тож копія піднята на `H − R`;
	 * нижній показує ПОЧАТОК, тож лежить від нуля.
	 */
	#fill(side: Side) {
		const host = this.#hosts[side];
		const band = this.#band;
		if (!host || !band) return;

		const copy = band.cloneNode(true) as HTMLElement;
		copy.removeAttribute('data-endless-band');
		for (const el of copy.querySelectorAll('[id], [data-testid], [tabindex]')) {
			el.removeAttribute('id');
			el.removeAttribute('data-testid');
			el.removeAttribute('tabindex');
		}

		copy.style.position = 'absolute';
		copy.style.left = '0';
		copy.style.right = '0';
		copy.style.top = side === 'head' ? `${this.runwayHeight - this.bandHeight}px` : '0';

		/*
		 * Пряма правка DOM повз Svelte — і це той самий виняток, що в
		 * `Minimap.buildClone()`: контейнер у розмітці порожній, Svelte
		 * усередині нього нічим не керує, а вміст є копією, яку шаблоном не
		 * виразити. Придушення `svelte/no-dom-manipulating` тут не стоїть
		 * навмисно: правило працює лише в `.svelte`, і директива в цьому файлі
		 * була б «невикористаним придушенням», тобто новим боргом ESLint.
		 */
		host.replaceChildren(copy);
		this.#stale[side] = false;
	}

	/** Розгін ЗА межами вікна — тільки такий можна переробляти без миготіння. */
	#offscreen(side: Side): boolean {
		const y = window.scrollY;
		return side === 'head'
			? y >= this.bandTop
			: y + this.viewportHeight <= this.bandTop + this.bandHeight;
	}

	#refresh(force: boolean) {
		const now = Date.now();
		if (!force && now - this.#refreshedAt < REFRESH_MS) return;
		this.#refreshedAt = now;
		for (const side of ['head', 'tail'] as Side[]) {
			/*
			 * Видимий розгін не перебудовуємо НІКОЛИ, навіть на `force`.
			 *
			 * Вставка копії запускає в ній CSS-анімації з нуля, тож перебудова
			 * під рукою в читача — це видима поява героя посеред прокрутки.
			 * Після перестановки ВГОРУ нижній розгін якраз лишається в кадрі, і
			 * перша редакція оновлювала його саме там.
			 */
			if (!this.#offscreen(side)) continue;
			if (force || this.#stale[side]) this.#fill(side);
		}
	}

	/**
	 * `behavior: 'instant'`, а не `'auto'`.
	 *
	 * `'auto'` означає «взяти значення з CSS», а в `global.css` стоїть
	 * `scroll-behavior: smooth` — і перестановка перетворилася б на плавну
	 * анімацію через усю сторінку, тобто на рівно той видимий стрибок, якого
	 * тут уникають. Та сама пастка вже ловилася у власній смузі й у мінімапі.
	 */
	#go(top: number) {
		window.scrollTo({ top, behavior: 'instant' });
	}

	#onScroll = () => {
		if (!this.active || this.bandHeight <= 0) return;
		const y = window.scrollY;
		const top = this.bandTop;

		if (y >= top + this.bandHeight) {
			this.#go(y - this.bandHeight);
			// Одразу після стрибка ОБИДВА розгони за межами вікна — найкраща
			// мить, щоб забрати в копії свіжий стан живої смуги.
			this.#refresh(true);
			return;
		}
		if (y < top) {
			this.#go(y + this.bandHeight);
			this.#refresh(true);
			return;
		}
		this.#refresh(false);
	};

	/**
	 * `Home` і `End` мусять означати початок і кінець СТОРІНКИ, а не документа.
	 *
	 * Без цього обидві клавіші поводилися неправильно, і по-різному. `Home` веде
	 * в нуль документа — а нуль лежить усередині верхнього розгону, тобто в
	 * мертвій копії: читач опинявся в кінці смуги, який не можна ані прокрутити
	 * вгору, ані натиснути. `End` веде в кінець документа, тобто за кінець
	 * смуги, — і перестановка миттєво повертала його на початок кола. Тобто
	 * `End` працював як `Home`.
	 *
	 * Тут вони отримують ті самі два місця, що й на звичайній сторінці: верх
	 * смуги й останній екран смуги.
	 *
	 * Плавність — `smooth`, як у нативної поведінки з `scroll-behavior` у
	 * `global.css`. Перестановки цей рух не запускає: обидві мети лежать
	 * усередині кола.
	 */
	#onKey = (e: KeyboardEvent) => {
		if (!this.active || this.bandHeight <= 0) return;
		if (e.key !== 'Home' && e.key !== 'End') return;
		if (e.altKey || e.shiftKey) return;

		/*
		 * Клавіатура належить тому, хто зараз на екрані. Поле вводу забирає
		 * `Home`/`End` собі під курсор у тексті, а всередині власної зони
		 * прокрутки — модалки, випадайки, списку — обидві клавіші мусять гортати
		 * ЇЇ, а не сторінку під нею.
		 */
		const node = e.target instanceof Element ? e.target : document.activeElement;
		if (node instanceof HTMLElement && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName))) return;
		for (let el = node; el && el !== document.body; el = el.parentElement) {
			const style = getComputedStyle(el);
			if (el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(style.overflowY)) return;
		}

		e.preventDefault();
		window.scrollTo({
			top: this.bandTop + (e.key === 'Home' ? 0 : this.lastScreen),
			behavior: 'smooth'
		});
	};

	/**
	 * Прокрутку ПЕРЕСТАВЛЯЄМО лише тоді, коли змінилося вікно.
	 *
	 * Смуга росте й сама — від знімків, що доїхали, і від даних із Firestore.
	 * Той приріст браузер компенсує власним якорем прокрутки, і наша третя рука
	 * тут дала б ривок на кожне завантажене зображення. Вікно ж міняє висоту
	 * розгону, тобто зсуває саму смугу, — і от це компенсувати мусимо ми.
	 */
	#onResize = () => {
		if (!this.active) return;
		const changed = window.innerHeight !== this.viewportHeight;
		const lap = changed ? this.lapY(window.scrollY) : -1;

		this.#measure();
		this.#dress();
		this.#stale = { head: true, tail: true };

		if (lap >= 0) {
			this.#measure();
			this.#go(this.bandTop + Math.min(Math.max(lap, 0), Math.max(this.bandHeight - 1, 0)));
		}
	};
}

export const endless = new EndlessState();
