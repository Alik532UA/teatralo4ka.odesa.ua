import { CanvasEngine } from './CanvasEngine';

/**
 * Зіркове поле для «Галактики випускників»: зірки летять зліва направо, а поле
 * реагує на курсор — паралакс глибини, аура, розхід зірок і нитки до найближчих.
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
 *
 * ## Реакція на курсор і `prefers-reduced-motion`
 *
 * Слухачі вішаються завжди, а рухається поле лише поки крутиться цикл кадрів —
 * а його `CanvasEngine` при `prefers-reduced-motion` не запускає взагалі
 * (ACCESSIBILITY-v8 § 7). Тобто окремої перевірки тут немає й не потрібно:
 * без циклу `mouseIntensity` лишається нулем, і жоден ефект курсора не
 * обчислюється.
 */
interface Star {
	x: number;
	y: number;
	/** Зсув від курсора: накопичується від штовхання й гаситься тертям щокадру. */
	vx: number;
	vy: number;
	/** px/с. Далекі зірки повільніші — цим і тримається глибина. */
	speed: number;
	radius: number;
	/** Базова прозорість; мерехтіння коливає її навколо цього значення. */
	alpha: number;
	twinkleOffset: number;
	twinkleSpeed: number;
	/** Множник шару (`LAYERS`): що ближче зірка, то дужче її веде курсор. */
	layerSpeed: number;
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

	// Координати та інтенсивність курсора
	private mouseX = -1000;
	private mouseY = -1000;
	private targetMouseX = -1000;
	private targetMouseY = -1000;
	private mouseActive = false;
	private mouseIntensity = 0;

	private handlePointerMoveBound = (e: PointerEvent) => this.handlePointerMove(e);
	private handlePointerLeaveBound = () => this.handlePointerLeave();

	public override mount(canvas: HTMLCanvasElement) {
		super.mount(canvas);
		if (typeof window !== 'undefined') {
			window.addEventListener('pointermove', this.handlePointerMoveBound, { passive: true });
			window.addEventListener('pointerleave', this.handlePointerLeaveBound, { passive: true });
		}
	}

	public override unmount() {
		if (typeof window !== 'undefined') {
			window.removeEventListener('pointermove', this.handlePointerMoveBound);
			window.removeEventListener('pointerleave', this.handlePointerLeaveBound);
		}
		super.unmount();
	}

	private handlePointerMove(e: PointerEvent) {
		if (!this.canvas) return;
		const rect = this.canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		if (x >= -40 && x <= rect.width + 40 && y >= -40 && y <= rect.height + 40) {
			this.targetMouseX = x;
			this.targetMouseY = y;
			this.mouseActive = true;
		} else {
			this.mouseActive = false;
		}
	}

	private handlePointerLeave() {
		this.mouseActive = false;
	}

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
					vx: 0,
					vy: 0,
					speed: BASE_SPEED * layer.speed * (0.75 + Math.random() * 0.5),
					radius: (0.6 + Math.random() * 0.9) * layer.size,
					alpha: 0.25 + Math.random() * 0.5,
					twinkleOffset: Math.random() * Math.PI * 2,
					twinkleSpeed: 0.4 + Math.random() * 1.1,
					layerSpeed: layer.speed
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

		// Плавна зміна сили реакції на курсор
		if (this.mouseActive) {
			this.mouseIntensity += (1 - this.mouseIntensity) * 0.08;
		} else {
			this.mouseIntensity += (0 - this.mouseIntensity) * 0.04;
		}

		if (this.mouseIntensity > 0.005) {
			this.mouseX += (this.targetMouseX - this.mouseX) * 0.12;
			this.mouseY += (this.targetMouseY - this.mouseY) * 0.12;
		}

		const cx = this.width * 0.5;
		const cy = this.height * 0.5;
		const relX = cx > 0 ? (this.mouseX - cx) / cx : 0;
		const relY = cy > 0 ? (this.mouseY - cy) / cy : 0;

		this.ctx.clearRect(0, 0, this.width, this.height);

		// М'яка космічна аура навколо курсора
		if (this.mouseIntensity > 0.05) {
			const auraRadius = 140;
			const aura = this.ctx.createRadialGradient(
				this.mouseX, this.mouseY, 0,
				this.mouseX, this.mouseY, auraRadius
			);
			aura.addColorStop(0, `${primary}0.08)`);
			aura.addColorStop(0.5, `${primary}0.02)`);
			aura.addColorStop(1, `${primary}0)`);
			this.ctx.fillStyle = aura;
			this.ctx.beginPath();
			this.ctx.arc(this.mouseX, this.mouseY, auraRadius, 0, Math.PI * 2);
			this.ctx.fill();
		}

		// 15 градусів нахилу: рух зліва-знизу у правий верхній кут
		const cos15 = 0.9659;
		const sin15 = 0.2588;

		for (const star of this.stars) {
			star.x += star.speed * cos15 * delta;
			star.y -= star.speed * sin15 * delta;

			// Вийшла праворуч або зверху — повертаємо ліворуч або знизу
			if (star.x - star.radius > this.width || star.y + star.radius < 0) {
				if (Math.random() < 0.5) {
					star.x = -star.radius;
					star.y = Math.random() * this.height;
				} else {
					star.x = Math.random() * this.width;
					star.y = this.height + star.radius;
				}
				star.vx = 0;
				star.vy = 0;
			}

			let proximityFlare = 0;
			let proximityGlow = 1;

			if (this.mouseIntensity > 0.01) {
				const dx = (star.x + star.vx) - this.mouseX;
				const dy = (star.y + star.vy) - this.mouseY;
				const distSq = dx * dx + dy * dy;
				const effectRadius = 140;
				const effectRadiusSq = effectRadius * effectRadius;

				if (distSq < effectRadiusSq && distSq > 4) {
					const dist = Math.sqrt(distSq);
					const norm = dist / effectRadius;
					const forceFactor = Math.cos(norm * Math.PI * 0.5) * this.mouseIntensity;
					const pushForce = forceFactor * (8 + star.layerSpeed * 14);
					star.vx += (dx / dist) * pushForce * 0.15;
					star.vy += (dy / dist) * pushForce * 0.15;
					proximityFlare = forceFactor * 0.55;
					proximityGlow = 1 + forceFactor * 1.5;

					// Тонкі нитки сузір'їв біля курсора (до 85px)
					if (dist < 85) {
						const lineAlpha = (1 - dist / 85) * 0.2 * this.mouseIntensity;
						this.ctx.strokeStyle = `${primary}${lineAlpha.toFixed(3)})`;
						this.ctx.lineWidth = 0.6;
						this.ctx.beginPath();
						this.ctx.moveTo(star.x + star.vx, star.y + star.vy);
						this.ctx.lineTo(this.mouseX, this.mouseY);
						this.ctx.stroke();
					}
				}
			}

			star.vx *= 0.88;
			star.vy *= 0.88;

			// 3D-паралакс глибини залежно від шару
			const px = relX * star.layerSpeed * 10 * this.mouseIntensity;
			const py = relY * star.layerSpeed * 7 * this.mouseIntensity;
			const finalX = star.x + star.vx + px;
			const finalY = star.y + star.vy + py;

			const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.35 + 0.65;
			const alpha = Math.min(1, star.alpha * twinkle + proximityFlare);

			// Світіння навколо ядра: кешований спрайт замість створення нового градієнта щокадру
			if (sprite) {
				const glowRadius = star.radius * 4 * proximityGlow;
				const glowDiameter = glowRadius * 2;
				this.ctx.globalAlpha = alpha;
				this.ctx.drawImage(
					sprite,
					finalX - glowRadius,
					finalY - glowRadius,
					glowDiameter,
					glowDiameter
				);
			}

			// Ядро зірки
			this.ctx.globalAlpha = alpha;
			this.ctx.beginPath();
			this.ctx.arc(finalX, finalY, star.radius * (1 + proximityFlare * 0.3), 0, Math.PI * 2);
			this.ctx.fillStyle = `${primary}1)`;
			this.ctx.fill();
		}

		this.ctx.globalAlpha = 1;
	}
}
