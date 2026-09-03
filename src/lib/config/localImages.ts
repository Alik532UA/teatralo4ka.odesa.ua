/**
 * Власні розміри файлів зі `static/` — щоб кожен `<img>` міг заявити
 * `width`/`height` (PERFORMANCE-v8 § 3.2, § 10.2).
 *
 * ## Навіщо взагалі
 *
 * Без атрибутів браузер до завантаження файлу не знає його пропорції й відводить
 * під нього нуль. Коли файл приходить, розкладка стрибає — це CLS, і на
 * повільному звʼязку його бачить кожен. Заміряно 2026-08-26: із 49 тегів `<img>`
 * у проєкті 20 не мали жодного з двох атрибутів.
 *
 * ## Чому мапою, а не числами в розмітці
 *
 * Число, вписане поруч із тегом, живе окремо від файлу й старіє мовчки: знімок
 * замінили — атрибут лишився. Так уже сталося тут. `HeroSection` заявляв
 * `width="1200" height="900"` (4:3) на два РІЗНІ знімки, у яких насправді
 * 1280×804 (1,59) і 4068×3070 (1,33). Тобто одне число не могло бути правильним
 * для обох за побудовою, і жодна перевірка цього не бачила.
 *
 * Мапа має власний інваріант (`localImages.test.ts`): кожен запис звіряється з
 * ЗАГОЛОВКОМ файлу на диску. Заміна знімка тепер валить прогін замість того, щоб
 * лишити неправильну пропорцію.
 *
 * ## Чому не всі зображення проєкту тут
 *
 * Тут лише те, що лежить у репозиторії. Обкладинки статей і фотографії галереї
 * приходять із Firestore, і їхнього розміру в коді не існує в принципі — під них
 * місце відводить CSS контейнера (`aspect-ratio` або фіксовані пікселі). Перелік
 * таких місць і причина для кожного — у `src/image-dimensions.test.ts`.
 */

export interface ImageSize {
	width: number;
	height: number;
}

/**
 * Ключ — шлях від кореня `static/`, тобто рівно те, що йде в `asset()`.
 *
 * `as const satisfies` навмисно: `satisfies` перевіряє форму значень, а `as
 * const` лишає точні літерали ключів. Із них нижче виводиться тип `LocalImage`,
 * і шлях поза мапою стає помилкою `svelte-check`, а не тихим `undefined` у
 * розмітці.
 */
export const LOCAL_IMAGE_SIZES = {
	'/photo/DSC_1405.jpg': { width: 1280, height: 804 },
	'/photo/DJI_0759 v02.jpg': { width: 4068, height: 3070 },
	// Галерея головної. П'ять із шести — 1280×913 (1,402), шосте 1280×960
	// (1,333), а в розмітці всі шість роками стояли як 1200×900. Місце під них
	// відводить `aspect-ratio: 4/3` контейнера, тож видимого стрибка не було —
	// але саме так число й доживає до дня, коли контейнер перепишуть.
	'/photo/013.jpg': { width: 1280, height: 913 },
	'/photo/035.jpg': { width: 1280, height: 913 },
	'/photo/059.jpg': { width: 1280, height: 913 },
	'/photo/125.jpg': { width: 1280, height: 913 },
	'/photo/495.jpg': { width: 1280, height: 913 },
	'/photo/5.jpg': { width: 1280, height: 960 },
	'/social_media/facebook-se-512-50.png': { width: 511, height: 512 },
	'/social_media/instagram-se-512-50.png': { width: 511, height: 512 },
	'/social_media/Telegram-se-320px-50q.png': { width: 320, height: 320 },
	'/social_media/YouTube-se-512px-50q.png': { width: 511, height: 512 },
	'/social_media/TikTok-se-512-50.png': { width: 511, height: 512 },
	'/moment-of-silence/Lesser_Coat_of_Arms_of_Ukraine_(bw).svg': { width: 330, height: 460 },
	'/png/MusicDepartment.png': { width: 900, height: 900 },
	'/png/TheaterDepartment.png': { width: 820, height: 820 },
	'/png/AestheticDepartment.png': { width: 940, height: 940 },
	'/png/ArtDepartment.png': { width: 900, height: 900 },
	'/png/Teacher1.png': { width: 960, height: 960 },
	'/png/Students1.png': { width: 1100, height: 1100 },
	'/png/Graduates3.png': { width: 2048, height: 2048 },
	'/png/AdmissionForm.png': { width: 1000, height: 1000 },
	'/png/Contacts2.png': { width: 1000, height: 1000 },
	'/png/History3.png': { width: 1200, height: 1200 },
	'/groups/zakhysnyky-teatralnykh-kulis.webp': { width: 1280, height: 720 },
	'/groups/zakhysnyky-teatralnykh-kulis-2.webp': { width: 768, height: 576 },
	'/groups/zakhysnyky-teatralnykh-kulis-3.webp': { width: 787, height: 576 },
	'/groups/tv-prodakshn.webp': { width: 1079, height: 720 },
	'/groups/alter-ego.webp': { width: 1078, height: 720 },
	'/groups/pakhlava.webp': { width: 1079, height: 720 },
	'/groups/anshlah-devishnik.webp': { width: 1079, height: 720 },
	'/groups/anshlah-devishnik-2.webp': { width: 1079, height: 720 },
	'/groups/mamarada.webp': { width: 1079, height: 720 },
	'/festivals/kvitucha-chekhiia-2.webp': { width: 1278, height: 720 },
	'/festivals/kvitucha-chekhiia-3.webp': { width: 1278, height: 720 },
	'/festivals/kvitucha-chekhiia.webp': { width: 1278, height: 720 },
	'/festivals/mrii-dim-2012.webp': { width: 960, height: 720 },
	'/festivals/mrii-dim-2012-2.webp': { width: 697, height: 720 },
	'/festivals/mrii-dim-2013.webp': { width: 1087, height: 720 },
	'/festivals/slovianskyi-vinok-2.webp': { width: 960, height: 720 },
	'/festivals/slovianskyi-vinok-3.webp': { width: 960, height: 720 },
	'/festivals/slovianskyi-vinok.webp': { width: 960, height: 720 },
	// Афіша вистави: показується цілком, тож пропорція банера — це пропорція файлу.
	'/plays/uryvky-z-klasyky-2013.webp': { width: 1200, height: 896 },
	// Програмка «Уривків з класики» 2015: обкладинка й розворот із ролями.
	'/plays/uryvky-z-klasyky-2015.webp': { width: 1200, height: 896 },
	'/plays/uryvky-z-klasyky-2015-2.webp': { width: 1200, height: 896 },
	'/groups/akuna-matata-2.webp': { width: 1920, height: 1281 },
	'/groups/akuna-matata.webp': { width: 1280, height: 850 },
	'/groups/akvarel.webp': { width: 1280, height: 850 },
	'/groups/art-kids.webp': { width: 1280, height: 850 },
	'/groups/assorti-2.webp': { width: 1920, height: 1281 },
	'/groups/assorti.webp': { width: 1280, height: 955 },
	'/groups/bantyky.webp': { width: 1920, height: 1281 },
	'/groups/bdzhilky.webp': { width: 1920, height: 1281 },
	'/groups/bulbashky.webp': { width: 1920, height: 1281 },
	'/groups/chainyky-2013.webp': { width: 1920, height: 1281 },
	'/groups/chainyky-2016.webp': { width: 1280, height: 850 },
	'/groups/cheloveky.webp': { width: 1280, height: 850 },
	'/groups/feierverk.webp': { width: 1280, height: 914 },
	'/groups/fliston.webp': { width: 1280, height: 850 },
	'/groups/freedom.webp': { width: 1920, height: 1281 },
	'/groups/freestyle.webp': { width: 1920, height: 1281 },
	'/groups/gang.webp': { width: 1280, height: 850 },
	'/groups/hranuly.webp': { width: 1280, height: 850 },
	'/groups/kapytoshky.webp': { width: 1280, height: 850 },
	'/groups/karandashi.webp': { width: 1280, height: 850 },
	'/groups/kedy.webp': { width: 1280, height: 850 },
	'/groups/kharizmatyky.webp': { width: 1280, height: 850 },
	'/groups/kofeiny4ky.webp': { width: 1920, height: 1281 },
	'/groups/komanda.webp': { width: 1920, height: 1281 },
	'/groups/krasyvi-liudy.webp': { width: 1280, height: 850 },
	'/groups/krokoziabryky.webp': { width: 1920, height: 1281 },
	'/groups/kuvyrkom.webp': { width: 1280, height: 850 },
	'/groups/mamarada-2.webp': { width: 1280, height: 914 },
	'/groups/multyashky.webp': { width: 1920, height: 1281 },
	'/groups/nadoptiany.webp': { width: 1280, height: 914 },
	'/groups/paradoks.webp': { width: 1281, height: 1920 },
	'/groups/pauza.webp': { width: 1280, height: 914 },
	'/groups/pizza.webp': { width: 1280, height: 850 },
	'/groups/plius.webp': { width: 1920, height: 1281 },
	'/groups/ptenchyky.webp': { width: 1920, height: 1275 },
	'/groups/raduzhni-koty.webp': { width: 1280, height: 850 },
	'/groups/rezonans.webp': { width: 1280, height: 914 },
	'/groups/romantyky.webp': { width: 1920, height: 1281 },
	'/groups/rost-ok.webp': { width: 1281, height: 1920 },
	'/groups/rostochek.webp': { width: 1280, height: 903 },
	'/groups/shchaslyffchyky.webp': { width: 1920, height: 1281 },
	'/groups/shevchushky.webp': { width: 1280, height: 850 },
	'/groups/shpylky.webp': { width: 1280, height: 850 },
	'/groups/shut.webp': { width: 1920, height: 1281 },
	'/groups/smaily-2.webp': { width: 1920, height: 1281 },
	'/groups/smaily.webp': { width: 1280, height: 850 },
	'/groups/svitliachky.webp': { width: 1280, height: 850 },
	'/groups/teatralni-metelyky.webp': { width: 1920, height: 1281 },
	'/groups/teatrashky.webp': { width: 1920, height: 1281 },
	'/groups/telemilytriamyky.webp': { width: 1920, height: 1281 },
	'/groups/tsn.webp': { width: 1920, height: 1281 },
	'/groups/tu-154-2.webp': { width: 1920, height: 1275 },
	'/groups/tu-154.webp': { width: 1280, height: 850 },
	'/groups/tv-prodakshn-2.webp': { width: 1280, height: 850 },
	'/groups/ukhtyshky.webp': { width: 1280, height: 914 },
	'/groups/vertykultiapy.webp': { width: 1920, height: 1281 },
	'/groups/veseli-cholovichky.webp': { width: 1920, height: 1281 },
	'/groups/vverkh-tormashkamy.webp': { width: 1280, height: 914 },
	'/groups/zhemchuzhynky.webp': { width: 1280, height: 850 },
	'/groups/zrobleno-v-ukraini.webp': { width: 1280, height: 850 },
	'/history/kolektyv-dtsh-2016.webp': { width: 1280, height: 913 },
	'/history/muzychne-viddilennia-2016.webp': { width: 1280, height: 850 },
} as const satisfies Record<string, ImageSize>;

/** Шляхи, розмір яких відомий. Усе інше — помилка типів, а не порожній атрибут. */
export type LocalImage = keyof typeof LOCAL_IMAGE_SIZES;

/**
 * Розміри для розгортання прямо в тег: `<img {...imageSize('/png/x.png')} …>`.
 *
 * Повертає новий обʼєкт, а не запис мапи: значення в ній `readonly`, і Svelte
 * розгорнув би його в атрибути з `readonly`-типом, що не збігається з
 * `HTMLImgAttributes`.
 */
export function imageSize(path: LocalImage): ImageSize {
	const { width, height } = LOCAL_IMAGE_SIZES[path];
	return { width, height };
}
