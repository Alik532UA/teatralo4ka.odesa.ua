import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

interface CropOverride {
	size?: number;
	sx?: number;
	sy?: number;
}

const AVATAR_OVERRIDES: Record<string, CropOverride> = {
	'mykola-baldin': {
		size: 1800,
		sx: 400,
		sy: 550
	},
	// На знімку двоє, і центральне обрізання давало жінку праворуч, а не Карена.
	// Джерело 1280×720, його обличчя близько x=315, y=200; жінка починається
	// приблизно з x=590, тож праву межу тримаємо лівіше за неї.
	'karen-petikian': {
		size: 460,
		sx: 85,
		sy: 55
	},
	// Концертний знімок на всю сцену: центральне обрізання бере його правильно,
	// але цілком — а в списку аватар має 96px, і з такого плану лишається пляма.
	// Тому кадр стягнутий на постать. Портрет лишається широким: там 720×1080, і
	// сцена навколо музиканта саме доречна.
	'andrii-klymenko': {
		size: 380,
		sx: 450,
		sy: 70
	},
	// Знімок на площі, людина на повний зріст: центральне обрізання взяло б усі
	// 960 пікселів ширини разом із фонтаном і ратушею, а в списку аватар має
	// 96px — з такого плану лишилася б пляма. Кадр стягнутий на голову й плечі.
	// Джерело 960×1280, обличчя близько x=565, y=390; квадрат 460 від (335, 280)
	// лишає над головою місце, як і в решти аватарів.
	'hanna-podzihun': {
		size: 460,
		sx: 335,
		sy: 280
	}
};

const PORTRAIT_OVERRIDES: Record<string, { sx?: number; sy?: number; sw?: number; sh?: number }> = {
	'mykola-baldin': {
		// Centered full portrait for Baldin
		sx: 0,
		sy: 0,
		sw: 2848,
		sh: 4272
	},
	// Та сама причина, що й в аватарі: кадруємо на чоловіка ліворуч. 480×720 —
	// найбільший прямокутник 2:3, який вміщається у висоту 720 джерела.
	'karen-petikian': {
		sx: 75,
		sy: 0,
		sw: 480,
		sh: 720
	}
};

async function main() {
	const rawDir = path.join('assets', 'masters-raw');
	const avatarDir = path.join('static', 'masters');
	const portraitDir = path.join('static', 'masters', 'portraits');

	if (!fs.existsSync(rawDir)) {
		console.error(`❌ Raw directory not found: ${rawDir}`);
		process.exit(1);
	}
	if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
	if (!fs.existsSync(portraitDir)) fs.mkdirSync(portraitDir, { recursive: true });

	const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.webp'));
	console.log(`🔨 Building web assets (480x480 avatars & 720x1080 portraits) from ${files.length} raw sources...`);

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.setContent('<html><body></body></html>');

	let totalAvatarBytes = 0;
	let totalPortraitBytes = 0;

	for (const file of files) {
		const id = path.basename(file, '.webp');
		const rawPath = path.join(rawDir, file);
		const avatarPath = path.join(avatarDir, `${id}.webp`);
		const portraitPath = path.join(portraitDir, `${id}.webp`);

		const buf = fs.readFileSync(rawPath);
		const dataUrl = `data:image/webp;base64,${buf.toString('base64')}`;
		const avatarOverride = AVATAR_OVERRIDES[id] || {};
		const portraitOverride = PORTRAIT_OVERRIDES[id] || {};

		const result = await page.evaluate(
			async ({ dataUrl, avatarOverride, portraitOverride }) => {
				return new Promise<{ avatarB64: string; portraitB64: string }>((resolve, reject) => {
					const img = new Image();
					img.onload = () => {
						try {
							// 1. Build 480x480 square avatar
							const avatarCanvas = document.createElement('canvas');
							avatarCanvas.width = 480;
							avatarCanvas.height = 480;
							const avatarCtx = avatarCanvas.getContext('2d');
							if (!avatarCtx) return reject(new Error('no avatar ctx'));

							const minDim = Math.min(img.naturalWidth, img.naturalHeight);
							const cropSize = avatarOverride.size ?? minDim;
							const extraY = img.naturalHeight - cropSize;

							let sx = avatarOverride.sx;
							if (sx === undefined) {
								sx = (img.naturalWidth - cropSize) / 2;
							}

							let sy = avatarOverride.sy;
							if (sy === undefined) {
								sy = extraY > 0 ? extraY * 0.12 : 0;
							}

							avatarCtx.imageSmoothingEnabled = true;
							avatarCtx.imageSmoothingQuality = 'high';
							avatarCtx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 480, 480);

							const avatarB64 = avatarCanvas.toDataURL('image/webp', 0.85).split(',')[1];
							avatarCanvas.width = 0;
							avatarCanvas.height = 0;

							// 2. Build 720x1080 vertical portrait (2:3 aspect ratio)
							const portraitCanvas = document.createElement('canvas');
							portraitCanvas.width = 720;
							portraitCanvas.height = 1080;
							const portraitCtx = portraitCanvas.getContext('2d');
							if (!portraitCtx) return reject(new Error('no portrait ctx'));

							const targetRatio = 720 / 1080; // 2/3
							const sourceRatio = img.naturalWidth / img.naturalHeight;

							let pSx = portraitOverride.sx;
							let pSy = portraitOverride.sy;
							let pSw = portraitOverride.sw;
							let pSh = portraitOverride.sh;

							if (pSw === undefined || pSh === undefined) {
								if (sourceRatio > targetRatio) {
									// Source is wider than 2:3
									pSh = img.naturalHeight;
									pSw = pSh * targetRatio;
									pSx = (img.naturalWidth - pSw) / 2;
									pSy = 0;
								} else {
									// Source is narrower or equal to 2:3
									pSw = img.naturalWidth;
									pSh = pSw / targetRatio;
									const extraPortY = img.naturalHeight - pSh;
									pSx = 0;
									pSy = extraPortY > 0 ? extraPortY * 0.08 : 0;
								}
							}
							if (pSx === undefined) pSx = 0;
							if (pSy === undefined) pSy = 0;

							portraitCtx.imageSmoothingEnabled = true;
							portraitCtx.imageSmoothingQuality = 'high';
							portraitCtx.drawImage(img, pSx, pSy, pSw, pSh, 0, 0, 720, 1080);

							const portraitB64 = portraitCanvas.toDataURL('image/webp', 0.75).split(',')[1];
							portraitCanvas.width = 0;
							portraitCanvas.height = 0;

							resolve({ avatarB64, portraitB64 });
						} catch (e) {
							reject(e);
						}
					};
					img.onerror = reject;
					img.src = dataUrl;
				});
			},
			{ dataUrl, avatarOverride, portraitOverride }
		);

		const avatarOutBuf = Buffer.from(result.avatarB64, 'base64');
		fs.writeFileSync(avatarPath, avatarOutBuf);
		totalAvatarBytes += avatarOutBuf.length;

		const portraitOutBuf = Buffer.from(result.portraitB64, 'base64');
		fs.writeFileSync(portraitPath, portraitOutBuf);
		totalPortraitBytes += portraitOutBuf.length;

		console.log(`✅ ${id} -> Avatar: ${(avatarOutBuf.length / 1024).toFixed(1)} KB | Portrait: ${(portraitOutBuf.length / 1024).toFixed(1)} KB`);
	}

	console.log(`\n🎉 Built ${files.length} avatars (${(totalAvatarBytes / 1024 / 1024).toFixed(2)} MB) and ${files.length} portraits (${(totalPortraitBytes / 1024 / 1024).toFixed(2)} MB).`);
	await browser.close();

	// Sync portrait paths to masters.index.json and profile JSONs
	const indexPath = path.join('src', 'lib', 'data', 'masters.index.json');
	const indexList: Array<{ id: string; portrait?: string; [key: string]: unknown }> = JSON.parse(
		fs.readFileSync(indexPath, 'utf8')
	);

	for (const m of indexList) {
		const portraitFile = path.join(portraitDir, `${m.id}.webp`);
		if (fs.existsSync(portraitFile)) {
			m.portrait = `/masters/portraits/${m.id}.webp`;
		}
		const profilePath = path.join('static', 'masters', 'profiles', `${m.id}.json`);
		if (fs.existsSync(profilePath)) {
			const prof: Record<string, unknown> = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
			if (m.portrait) prof.portrait = m.portrait;
			fs.writeFileSync(profilePath, JSON.stringify(prof, null, '\t') + '\n', 'utf8');
		}
	}

	fs.writeFileSync(indexPath, JSON.stringify(indexList, null, '\t') + '\n', 'utf8');
	console.log('✅ Synchronized portrait paths in masters.index.json and profile files.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
