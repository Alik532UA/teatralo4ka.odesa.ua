/**
 * Розміри файлів навчального календаря — окремо від решти медіа.
 *
 * Причина та сама, що в `localGalleryImages.ts`: календар — окремий розділ зі
 * своїм набором файлів (фони плаката, маски, прикраси панелі канікул), і кожен
 * новий фон додає рядок. У спільному `localImages.ts` це перекидало б файл
 * через стелю § 7 на рівному місці.
 *
 * Мапа лишається ОДНА: `localImages.ts` домішує цей запис до себе, тож
 * `imageSize()` і звірка з диском (`localImages.test.ts`) про поділ не знають.
 * Перша редакція писала розміри числами навмання — у масок 145×100 при файлі
 * 2008×1216, тобто не та пропорція.
 */
export const CALENDAR_IMAGE_SIZES = {
	'/calendar/calendar-bg-geometry.webp': { width: 1920, height: 1080 },
	'/calendar/calendar-bg-blue-hall.webp': { width: 1024, height: 1024 },
	'/calendar/calendar-bg-orange-hall.webp': { width: 1280, height: 731 },
	'/calendar/calendar-bg-fairy-stage.webp': { width: 1280, height: 731 },
	'/calendar/calendar-bg-dark.webp': { width: 2752, height: 1536 },
	'/calendar/calendar-bg-green.webp': { width: 2752, height: 1536 },
	'/calendar/calendar-bg-orange-purple.webp': { width: 2752, height: 1536 },
	'/calendar/calendar-bg-winter.webp': { width: 2752, height: 1536 },
	'/calendar/calendar-masks-logo.png': { width: 2008, height: 1216 },
	'/calendar/dec-maple-orange.svg': { width: 67, height: 67 },
	'/calendar/dec-leaf-yellow.svg': { width: 57, height: 45 },
	'/calendar/dec-maple-red.svg': { width: 63, height: 61 },
	'/calendar/dec-leaf-lime.svg': { width: 49, height: 40 },
	'/calendar/dec-leaf-drop.svg': { width: 20, height: 18 },
	'/calendar/dec-snow-top.svg': { width: 54, height: 46 },
	'/calendar/dec-snow-mid.svg': { width: 54, height: 46 },
	'/calendar/dec-snow-bot.svg': { width: 54, height: 46 },
	'/calendar/dec-leaf-green.svg': { width: 53, height: 53 },
	'/calendar/dec-green-mid.svg': { width: 46, height: 72 },
	'/calendar/dec-green-bot.svg': { width: 48, height: 59 }
} as const;
