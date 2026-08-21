import { CanvasEngine } from './CanvasEngine';

/**
 * Зіркове поле для «Галактики випускників»: зірки летять зліва направо.
 *
 * ## Чому окремий рушій, а не ParticlesEngine
 *
 * `ParticlesEngine` малює те саме, але рухає частинки випадково в усі боки й
 * тягне паралакс від прокрутки. Тут потрібен спрямований рух і три шари глибини
 * — інакше поле читається як шум, а не як проліт.
 *
 * ## Чому саме тут НЕ малюються фотографії
 *
 * Фотографії випускників — це DOM-кнопки поверх цього канваса, не піксели на
 * ньому. Причина не в зручності: ціль на canvas неможливо ані сфокусувати з
 * клавіатури, ані озвучити читалкою, ані виміряти гейтом розміру цілі дотику
 * (`e2e/touch-targets.spec.ts`), а зображення втратило б `srcset` і на телефоні
 * з DPR 3 стало б мутним. Canvas тут відповідає рівно за фон.
 */
interface Star {
	x: number;
	y: number;
	/** px/с. Далекі зірки повільніші — цим і тримається глибина. */
	speed: number;
	radius: number;
	/** Базова прозорість; мерехтіння коливає її навколо цього значення. */
	alpha: number;
	twinkleOffset: number;
	twinkleSpeed: number;
}

/** Три шари глибини: частка зірок, множник швидкості, множник розміру. */
const LAYERS = [
	{ share: 0.55, speed: 0.35, size: 0.8 },
	{ share: 0.3, speed: 0.8, size: 1.15 },
	{ share: 0.15, speed: 1.6, size: 1.6 }
] as const;

/** Базова швидкість найшвидшого шару, px/с. */
const BASE_SPEED = 26;

/** Щільність: одна зірка на стільки квадратних пікселів. */
const AREA_PER_STAR = 9000;

/** Стеля кількості — на 4K-екрані інакше вийшло б понад тисячу. */
const MAX_STARS = 220;

export class StarfieldEngine extends CanvasEngine {
	private stars: Star[] = [];
	private lastFrame = 0;
	private glowSprite: HTMLCanvasElement | null = null;
	private cachedPrimary = '';

	private getGlowSprite(primary: string): HTMLCanvasElement | null {
		if (typeof document === 'undefined') return null;
		if (this.glowSprite && this.cachedPrimary === primary) {
			return this.glowSprite;
		}
		const size = 32;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const sCtx = canvas.getContext('2d');
		if (!sCtx) return null;
		const center = size / 2;
		const grad = sCtx.createRadialGradient(center, center, 0, center, center, center);
		grad.addColorStop(0, `${primary}0.5)`);
		grad.addColorStop(1, `${primary}0)`);
		sCtx.fillStyle = grad;
		sCtx.beginPath();
		sCtx.arc(center, center, center, 0, Math.PI * 2);
		sCtx.fill();
		this.glowSprite = canvas;
		this.cachedPrimary = primary;
		return canvas;
	}

	protected init() {
		const count = Math.min(MAX_STARS, Math.floor((this.width * this.height) / AREA_PER_STAR));
		this.stars = [];
		this.lastFrame = 0;

		for (const layer of LAYERS) {
			const layerCount = Math.round(count * layer.share);
			for (let i = 0; i < layerCount; i++) {
				this.stars.push({
					x: Math.random() * this.width,
					y: Math.random() * this.height,
					speed: BASE_SPEED * layer.speed * (0.75 + Math.random() * 0.5),
					radius: (0.6 + Math.random() * 0.9) * layer.size,
					alpha: 0.25 + Math.random() * 0.5,
					twinkleOffset: Math.random() * Math.PI * 2,
					twinkleSpeed: 0.4 + Math.random() * 1.1
				});
			}
		}
	}

	protected draw() {
		if (!this.ctx) return;

		const now = performance.now();
		// Перший кадр і повернення з фону дають величезну різницю часу — обрізаємо
		// її, інакше зірки стрибнули б через півекрана одним кадром.
		const delta = this.lastFrame === 0 ? 0 : Math.min((now - this.lastFrame) / 1000, 0.05);
		this.lastFrame = now;

		const { primary } = this.getColors();
		const time = now / 1000;
		const sprite = this.getGlowSprite(primary);

		this.ctx.clearRect(0, 0, this.width, this.height);

		for (const star of this.stars) {
			star.x += star.speed * delta;
			// Вийшла праворуч — заходить ліворуч на випадковій висоті, щоб поле не
			// вклалося в помітні горизонтальні смуги.
			if (star.x - star.radius > this.width) {
				star.x = -star.radius;
				star.y = Math.random() * this.height;
			}

			const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.35 + 0.65;
			const alpha = Math.min(1, star.alpha * twinkle);

			// Світіння навколо ядра: кешований спрайт замість створення нового градієнта щокадру
			if (sprite) {
				const glowRadius = star.radius * 4;
				const glowDiameter = glowRadius * 2;
				this.ctx.globalAlpha = alpha;
				this.ctx.drawImage(
					sprite,
					star.x - glowRadius,
					star.y - glowRadius,
					glowDiameter,
					glowDiameter
				);
			}

			// Ядро зірки
			this.ctx.globalAlpha = alpha;
			this.ctx.beginPath();
			this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
			this.ctx.fillStyle = `${primary}1)`;
			this.ctx.fill();
		}

		this.ctx.globalAlpha = 1;
	}
}
