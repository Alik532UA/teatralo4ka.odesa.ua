import { ensureFontsReady } from '$lib/utils/fonts';
import { POSTER_THEMES, DEFAULT_POSTER_THEME, type PosterId } from '$lib/data/posters';

export type PosterExportFormat = 'pdf' | 'png' | 'jpg' | 'webp';

export interface PosterExportOptions {
	posterId?: PosterId;
	themeId?: string;
	filename?: string;
	pixelRatio?: number;
}

/**
 * Отримує колір тла для обраної теми та постера, щоб уникнути
 * появи чорних пікселів у JPG при прозорості.
 */
export function getPosterBackgroundColor(themeId: string = DEFAULT_POSTER_THEME): string {
	const found = POSTER_THEMES.find((t) => t.id === themeId);
	if (found && !found.color.includes('gradient')) {
		return found.color;
	}
	if (themeId === 'uart-dark' || themeId === 'theatre-dark') return '#171118';
	if (themeId === 'uart-black') return '#000000';
	if (themeId === 'uart-light' || themeId === 'paper-white' || themeId === 'galaxy-print-light') return '#ffffff';
	if (themeId === 'warm-cream') return '#fffbeb';
	if (themeId === 'theatre-gold') return '#fef08a';
	if (themeId === 'galaxy-space') return '#0c122c';
	if (themeId === 'galaxy-gold') return '#171103';
	return '#ffed00'; // Фірмовий жовтий за замовчуванням
}

/**
 * Ініціює завантаження Blob у браузері
 */
function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Експортує DOM-вузол постера у растровий формат (PNG, JPG, WebP)
 * із високою роздільною здатністю (pixelRatio = 2.5).
 */
export async function exportPosterAsImage(
	containerEl: HTMLElement,
	format: 'png' | 'jpg' | 'webp',
	options: PosterExportOptions = {}
): Promise<void> {
	await ensureFontsReady();

	// Знаходимо власне вузол постера
	const posterEl =
		containerEl.querySelector<HTMLElement>(
			'.anniversary-poster, .digital-poster, .dance-poster, .poetry-poster, .galaxy-award-card, .booklet-sheet, .a1-poster, article'
		) ||
		(containerEl.firstElementChild as HTMLElement) ||
		containerEl;

	// Чекаємо готовності всіх вкладених зображень
	const images = Array.from(posterEl.querySelectorAll('img'));
	await Promise.all(
		images.map((img) => {
			if (img.complete && img.naturalWidth > 0) return Promise.resolve();
			return new Promise<void>((resolve) => {
				const done = () => {
					img.onload = null;
					img.onerror = null;
					resolve();
				};
				img.onload = done;
				img.onerror = done;
			});
		})
	);

	const { toCanvas } = await import('html-to-image');

	const pixelRatio = options.pixelRatio ?? 2.5;
	const bgColor = getPosterBackgroundColor(options.themeId);

	// Рендеримо в canvas
	const canvas = await toCanvas(posterEl, {
		pixelRatio,
		backgroundColor: format === 'jpg' ? bgColor : undefined,
		cacheBust: true,
		style: {
			transform: 'none',
			margin: '0'
		}
	});

	const posterId = options.posterId || 'poster';
	const ext = format === 'jpg' ? 'jpg' : format;
	const filename = options.filename || `teatralo4ka-${posterId}.${ext}`;

	if (format === 'jpg') {
		// Для JPG створюємо новий canvas із гарантовано непрозорим тлом
		const jpgCanvas = document.createElement('canvas');
		jpgCanvas.width = canvas.width;
		jpgCanvas.height = canvas.height;
		const ctx = jpgCanvas.getContext('2d');
		if (ctx) {
			ctx.fillStyle = bgColor;
			ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
			ctx.drawImage(canvas, 0, 0);
		}
		const finalCanvas = ctx ? jpgCanvas : canvas;
		const blob = await new Promise<Blob | null>((resolve) =>
			finalCanvas.toBlob(resolve, 'image/jpeg', 0.95)
		);
		if (blob) {
			downloadBlob(blob, filename);
		}
	} else if (format === 'webp') {
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/webp', 0.95)
		);
		if (blob) {
			downloadBlob(blob, filename);
		}
	} else {
		// PNG
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/png')
		);
		if (blob) {
			downloadBlob(blob, filename);
		}
	}
}
