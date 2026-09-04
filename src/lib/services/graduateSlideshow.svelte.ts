import { browser } from '$app/environment';
import { storage } from './storage';

/**
 * Слайдшоу зі сторінок випускників — стан, налаштування й вибірка.
 *
 * ## Що просив автор
 *
 * «Ліворуч від кнопки повного екрана зробити ще одну кнопку "play" чи "show";
 * при натисканні відкриваються сторінки випускників що мають фотографію в
 * профілі, і сторінка міняється раз в 7 секунд з плавною повільною анімацією.
 * Таке собі слайдшоу зі сторінок випускників. Зверху налаштування, де можна
 * поміняти скільки секунд на випускника, як швидко міняються анкети на екрані,
 * і фільтр… Кнопки налаштування видно тільки якщо курсор рухається, а якщо
 * курсор не рухається то приховувати кнопки прозорістю 1%».
 *
 * ## Чому це СЕРВІС, а не стан сторінки
 *
 * Стан слайдшоу читають троє: панель керування сценою (кнопка «play»), рядок
 * налаштувань і сама сторінка галактики, яка міняє картку. Тримати його в
 * сторінці означало б протягувати п'ять пропів через два компоненти, а
 * налаштування — ще й зберігати окремо.
 *
 * Тут же лежить і те, що робить слайдшоу слайдшоу: три числа й вибірка. Самого
 * ТАЙМЕРА тут немає навмисно — його заводить сторінка, бо лише вона знає, коли
 * картка справді змінилася, і лише в ній є `$effect` із прибиранням.
 *
 * ## Налаштування зберігаються
 *
 * Ті самі три ключі, що й режим показу переліків (`galaxyViewMode`): людина
 * підкрутила швидкість — вона мусить лишитися такою й наступного разу. Через
 * підкреслення в ключах: `storage` додає свій префікс, а ключі з дефісами
 * читалися б як інша родина налаштувань.
 */

/** Скільки секунд на одного випускника. Межі — щоб слайдшоу лишалося слайдшоу. */
export const SLIDE_SECONDS = { min: 2, max: 60, default: 7 } as const;

/**
 * Скільки триває сама зміна, у мілісекундах.
 *
 * «Плавною повільною» з прохання — це саме воно. Типове 1200 мс: заміряно на
 * око по сусідніх переходах проєкту (`--transition-base` це 0,3 с, і на повний
 * розмір картки такий перехід читається як стрибок).
 */
export const SLIDE_FADE_MS = { min: 200, max: 4000, default: 1200 } as const;

/**
 * Кого показувати.
 *
 * `withPhoto` — типовий, як і просив автор. `all` — усі, з фотографією чи без:
 * у прохання перші два пункти написані майже однаково («всі випускники з
 * фотографією» і «випускники з фотографією (за замовчуванням)»), і різниця між
 * ними може бути лише в слові «всі». `artPath` — ті, у кого є творчий заклад
 * освіти або робота в театрі, незалежно від фотографії.
 */
export const SLIDESHOW_FILTERS = ['withPhoto', 'all', 'artPath'] as const;

export type SlideshowFilter = (typeof SLIDESHOW_FILTERS)[number];

const КЛЮЧ_СЕКУНДИ = 'galaxy_slideshow_seconds';
const КЛЮЧ_ПЕРЕХІД = 'galaxy_slideshow_fade';
const КЛЮЧ_ФІЛЬТР = 'galaxy_slideshow_filter';

/**
 * Число зі сховища в межах — або типове.
 *
 * ПОРОЖНЄ значення перевіряється ОКРЕМО, і це виправлення дефекту, який показав
 * замір: `Number(null)` дорівнює нулю, а нуль — скінченне число, тож перша
 * редакція проходила перевірку `Number.isFinite` і затискала нуль до мінімуму.
 * Наслідок був видимий одразу: слайдшоу відкрилося з 2 секундами на анкету й
 * 0,2 секунди на зміну замість 7 і 1,2 — тобто типові значення, яких автор
 * просив, не працювали ЖОДНОГО разу до першого руху повзунка.
 */
function числоЗіСховища(ключ: string, межі: { min: number; max: number; default: number }): number {
	if (!browser) return межі.default;
	const сире = storage.get(ключ);
	if (сире === null || сире === '') return межі.default;
	const збережене = Number(сире);
	if (!Number.isFinite(збережене)) return межі.default;
	return Math.min(межі.max, Math.max(межі.min, збережене));
}

function фільтрЗіСховища(): SlideshowFilter {
	if (!browser) return 'withPhoto';
	const збережений = storage.get(КЛЮЧ_ФІЛЬТР);
	return (SLIDESHOW_FILTERS as readonly string[]).includes(збережений ?? '')
		? (збережений as SlideshowFilter)
		: 'withPhoto';
}

/**
 * Один стан на застосунок.
 *
 * Не фабрика, як у режимів показу: слайдшоу буває одне — воно займає весь
 * екран. Два незалежні означали б два таймери на одній картці.
 */
class GraduateSlideshow {
	/** Чи слайдшоу зараз іде. */
	active = $state(false);
	/** Скільки секунд на випускника. */
	seconds = $state<number>(SLIDE_SECONDS.default);
	/** Скільки мілісекунд триває зміна. */
	fadeMs = $state<number>(SLIDE_FADE_MS.default);
	filter = $state<SlideshowFilter>('withPhoto');
	/**
	 * Чи картка зараз пригашена.
	 *
	 * Половина «плавної зміни»: сторінка гасить картку, під час згасання
	 * підміняє випускника й запалює знову. Прапорець тут, а не в сторінці, бо
	 * пригашення читає й `GraduateCard`.
	 */
	dimmed = $state(false);

	constructor() {
		this.seconds = числоЗіСховища(КЛЮЧ_СЕКУНДИ, SLIDE_SECONDS);
		this.fadeMs = числоЗіСховища(КЛЮЧ_ПЕРЕХІД, SLIDE_FADE_MS);
		this.filter = фільтрЗіСховища();
	}

	/* Наскрізний запис у мутаторах, без `$effect` (SVELTE-CORE-v8 § 1.9): ефект
	   зберігав би й перше обчислення, тобто те, чого людина не вибирала. */
	setSeconds(value: number) {
		this.seconds = Math.min(SLIDE_SECONDS.max, Math.max(SLIDE_SECONDS.min, Math.round(value)));
		if (browser) storage.set(КЛЮЧ_СЕКУНДИ, String(this.seconds));
	}

	setFadeMs(value: number) {
		this.fadeMs = Math.min(SLIDE_FADE_MS.max, Math.max(SLIDE_FADE_MS.min, Math.round(value)));
		if (browser) storage.set(КЛЮЧ_ПЕРЕХІД, String(this.fadeMs));
	}

	setFilter(value: string) {
		if (!(SLIDESHOW_FILTERS as readonly string[]).includes(value)) return;
		this.filter = value as SlideshowFilter;
		if (browser) storage.set(КЛЮЧ_ФІЛЬТР, this.filter);
	}

	stop() {
		this.active = false;
		this.dimmed = false;
	}
}

export const slideshow = new GraduateSlideshow();

/** Чи людина підходить під фільтр. Ознаки приходять зовні — реєстрів тут немає. */
export function matchesSlideshowFilter(
	filter: SlideshowFilter,
	person: { hasPhoto?: boolean; hasArtPath?: boolean }
): boolean {
	if (filter === 'all') return true;
	if (filter === 'artPath') return Boolean(person.hasArtPath);
	return Boolean(person.hasPhoto);
}
