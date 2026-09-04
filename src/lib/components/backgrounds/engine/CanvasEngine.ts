import { browser } from "$app/environment";

export abstract class CanvasEngine {
	protected canvas: HTMLCanvasElement | null = null;
	protected ctx: CanvasRenderingContext2D | null = null;
	protected width = 0;
	protected height = 0;
	protected scrollY = 0;
	protected theme: "light" | "dark" = "light";
	protected color: string = "#0071e3";

	private animationId: number = 0;
	private lastWidth = 0;

	/**
	 * Чи цей рушій зараз показується.
	 *
	 * `DynamicBackground` тримає всі чотири шари змонтованими заради плавного
	 * перетікання між фонами — і до 2026-08-16 це означало, що ЧОТИРИ цикли
	 * `requestAnimationFrame` крутилися завжди, зокрема коли фон вибрано «немає»:
	 * там змінювалася лише прозорість. Невидимий рушій тепер не малює.
	 */
	private active = true;

	/** `prefers-reduced-motion` — ACCESSIBILITY-v8 § 7. */
	private reducedMotion = false;

	constructor(initialTheme: "light" | "dark", initialColor: string = "#0071e3") {
		this.theme = initialTheme;
		this.color = initialColor;
	}

	public mount(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		if (browser) {
			this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

			this.resizeCanvas();
			this.init();

			// За «зменшити рух» малюємо ОДИН кадр і на цьому все: фон лишається
			// картинкою, а не анімацією. Порожній екран був би гіршим за обидва
			// варіанти — вимога стандарту про рух, не про наявність.
			if (this.reducedMotion) this.draw();
			else this.startLoop();

			window.addEventListener("resize", this.handleResizeBound);
			window.addEventListener("scroll", this.handleScrollBound);
			document.addEventListener("visibilitychange", this.handleVisibilityBound);
		}
	}

	public unmount() {
		this.stopLoop();
		if (browser) {
			window.removeEventListener("resize", this.handleResizeBound);
			window.removeEventListener("scroll", this.handleScrollBound);
			document.removeEventListener("visibilitychange", this.handleVisibilityBound);
		}
		this.canvas = null;
		this.ctx = null;
	}

	public setTheme(theme: "light" | "dark", color?: string) {
		this.theme = theme;
		if (color) {
			this.color = color;
		}
	}

	/**
	 * Показувати цей рушій чи ні. Невидимий не малює.
	 *
	 * Останній намальований кадр лишається на канвасі, тому 800-мілісекундне
	 * зникнення виглядає так само, як і раніше: фони тут повільні, і завмерлий
	 * кадр під час згасання оком не відрізнити від живого.
	 */
	public setActive(active: boolean) {
		if (this.active === active) return;
		this.active = active;
		if (active && !this.reducedMotion) this.startLoop();
		else this.stopLoop();
	}

	/**
	 * Розмір канваса з урахуванням щільності екрана.
	 *
	 * Заміряно 2026-08-16: буфер канваса дорівнював розміру в CSS-пікселях при
	 * `devicePixelRatio` 1.25, тобто зображення масштабувалося браузером угору.
	 * Для розмитих плям це прощалося; для нового зіркового фону — ні, а надто на
	 * телефоні з DPR 3.
	 *
	 * `setTransform` лишає підклаcам ту саму систему координат у CSS-пікселях,
	 * тож жоден із чотирьох наявних рушіїв правити не довелося.
	 */
	private resizeCanvas() {
		if (!this.canvas || !this.ctx) return;

		const dpr = Math.min(browser ? window.devicePixelRatio || 1 : 1, 2);
		this.width = this.canvas.clientWidth;
		this.height = this.canvas.clientHeight;
		this.canvas.width = Math.round(this.width * dpr);
		this.canvas.height = Math.round(this.height * dpr);
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this.lastWidth = this.width;
	}

	private startLoop() {
		if (this.animationId) return;
		const loop = () => {
			if (!this.canvas || !this.ctx) return;
			this.draw();
			this.animationId = requestAnimationFrame(loop);
		};
		loop();
	}

	private stopLoop() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = 0;
		}
	}

	private handleResizeBound = () => this.handleResize();
	private handleScrollBound = () => this.handleScroll();
	private handleVisibilityBound = () => this.handleVisibility();

	private handleResize() {
		if (!this.canvas) return;

		// Лише зміна ШИРИНИ: на мобільних згортання панелі браузера змінює
		// висоту постійно, і реагувати на це означало б перебудовувати фон на
		// кожній прокрутці.
		if (this.canvas.clientWidth === this.lastWidth) return;

		this.resizeCanvas();
		this.init();
		if (this.reducedMotion) this.draw();
	}

	/**
	 * У згорнутій вкладці не малюємо.
	 *
	 * Браузер і сам душить `requestAnimationFrame` у фоні, але не завжди й не
	 * одразу: на другому екрані або в неактивному вікні кадри йдуть далі. Ціна —
	 * заряд телефона за фон, якого ніхто не бачить.
	 */
	private handleVisibility() {
		if (this.reducedMotion) return;
		if (document.hidden) this.stopLoop();
		else if (this.active) this.startLoop();
	}

	private handleScroll() {
		if (browser) {
			this.scrollY = window.scrollY;
		}
	}

	protected abstract init(): void;
	protected abstract draw(): void;

	protected hexToRgb(hex: string): string {
		if (!hex) return "0, 113, 227";
		let r = 0,
			g = 0,
			b = 0;
		try {
			if (hex.length === 4) {
				r = parseInt(hex[1] + hex[1], 16);
				g = parseInt(hex[2] + hex[2], 16);
				b = parseInt(hex[3] + hex[3], 16);
			} else if (hex.length === 7) {
				r = parseInt(hex.substring(1, 3), 16);
				g = parseInt(hex.substring(3, 5), 16);
				b = parseInt(hex.substring(5, 7), 16);
			}
		} catch {
			return "0, 113, 227";
		}
		return `${r}, ${g}, ${b}`;
	}

	private colorsCache: { key: string; value: { primary: string; secondary: string } } | null = null;

	/**
	 * Кольори кадру. Кеш — на рядок `this.color`.
	 *
	 * Кожен рушій кличе це раз на кадр, а тіло розбирало HEX по символах і
	 * будувало два рядки — тобто 60 разів на секунду на однаковому вході. Тема
	 * міняється натисканням, не щокадру, тож ключем досить самого кольору.
	 */
	protected getColors() {
		if (this.colorsCache?.key === this.color) return this.colorsCache.value;
		const rgb = this.hexToRgb(this.color);
		const primary = `rgba(${rgb}, `;
		const value = { primary, secondary: primary };
		this.colorsCache = { key: this.color, value };
		return value;
	}
}
