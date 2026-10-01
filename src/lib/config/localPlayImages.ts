/**
 * Розміри файлів афіш та знімків вистав — окремо від решти медіа.
 *
 * Мапа лишається ОДНА: `localImages.ts` домішує цей запис до себе, тож
 * `imageSize()` і звірка з диском (`localImages.test.ts`) про поділ не знають.
 */
export const PLAY_IMAGE_SIZES = {
	// Афіші та програмки вистав: показуються цілком, тож пропорція банера — це пропорція файлу.
	'/plays/zaruchyny-2026.webp': { width: 904, height: 1280 },
	'/plays/tryvozhni-liudy-2024.webp': { width: 1280, height: 859 },
	'/plays/uryvky-z-klasyky-2013.webp': { width: 1200, height: 896 },
	'/plays/uryvky-z-klasyky-2015.webp': { width: 1200, height: 896 },
	'/plays/uryvky-z-klasyky-2015-2.webp': { width: 1200, height: 896 },
	'/plays/ia-pishov-na-viinu.webp': { width: 768, height: 1024 },
	'/plays/dumky-vholos.webp': { width: 1200, height: 675 }
} as const;
