import { CanvasEngine } from "./CanvasEngine";
import { base } from "$app/paths";

interface MiniIcon {
	x: number;
	y: number;
	size: number;
	rotation: number;
	rotationSpeed: number;
	vx: number;
	vy: number;
	imgIndex: number;
	alpha: number;
}

const ICON_FILES = [
	"t4_logo_IndividualParticles_MiniIcon02_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon03_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon04_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon05_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon06_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon07_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon08_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon09_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon10_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon11_2026.svg",
	"t4_logo_IndividualParticles_MiniIcon12_2026.svg",
];

const imageCache: HTMLImageElement[] = [];

function loadImages() {
	if (imageCache.length > 0) return;
	ICON_FILES.forEach((file) => {
		const img = new Image();
		img.src = `${base}/miniIcon/svg/${file}`;
		imageCache.push(img);
	});
}

export class MiniIconsEngine extends CanvasEngine {
	private icons: MiniIcon[] = [];

	protected init() {
		loadImages();
		const count = 18; // Трохи більше, ніж у Shapes
		this.icons = [];
		for (let i = 0; i < count; i++) {
			this.icons.push({
				x: Math.random() * this.width,
				y: Math.random() * this.height,
				size: 40 + Math.random() * 50,
				rotation: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 0.008,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				imgIndex: Math.floor(Math.random() * ICON_FILES.length),
				alpha: 0.15 + Math.random() * 0.15,
			});
		}
	}

	protected draw() {
		if (!this.ctx) return;
		const time = Date.now() * 0.001;
		const scrollRotation = this.scrollY * 0.0003;

		this.ctx.clearRect(0, 0, this.width, this.height);

		this.icons.forEach((icon) => {
			icon.x += icon.vx;
			icon.y += icon.vy;
			icon.rotation += icon.rotationSpeed;

			if (icon.x < -icon.size) icon.x = this.width + icon.size;
			if (icon.x > this.width + icon.size) icon.x = -icon.size;
			if (icon.y < -icon.size) icon.y = this.height + icon.size;
			if (icon.y > this.height + icon.size) icon.y = -icon.size;

			const pulse = Math.sin(time * 0.6 + icon.rotation) * 0.15 + 0.85;
			const currentAlpha = icon.alpha * pulse;

			const img = imageCache[icon.imgIndex];
			if (!img || !img.complete) return;

			this.ctx!.save();
			this.ctx!.translate(icon.x, icon.y);
			this.ctx!.rotate(icon.rotation + scrollRotation);
			this.ctx!.globalAlpha = currentAlpha;

			// У темній темі можна додати невелике світіння або інверсію, 
			// але PNG зазвичай кольорові. Для гармонії з темою можемо 
			// регулювати яскравість через filter, якщо потрібно.
			if (this.theme === "dark") {
				this.ctx!.filter = "brightness(0.8) contrast(1.2)";
			}

			this.ctx!.drawImage(
				img,
				-icon.size / 2,
				-icon.size / 2,
				icon.size,
				icon.size
			);

			this.ctx!.restore();
		});
	}
}
