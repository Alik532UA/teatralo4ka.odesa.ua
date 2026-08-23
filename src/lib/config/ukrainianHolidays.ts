/**
 * Державні свята України — дні, коли куліси заставки стають прапором.
 *
 * ## Що це за перелік і чому саме тут
 *
 * Це не «святкові дні» в кадровому сенсі (вихідні, перенесення робочих днів) і
 * не церковний календар. Це перелік дат, які автор обрав для оформлення
 * заставки, і єдине його призначення — вирішити, чи малювати куліси синьо-жовтими
 * замість тематичних.
 *
 * Модуль лежить у `config/`, а не в `data/`: тут константа поведінки, а не
 * контент. Її ніхто не редагує через адмінку і не тягне з Firestore.
 *
 * ## ДУБЛЮВАННЯ, яке тут неминуче
 *
 * Заставка малюється ДО гідрації — у цьому весь її сенс, — тож вирішує це
 * інлайн-скрипт у `src/app.html`, а він не може нічого імпортувати. Отже той
 * самий перелік дат живе у двох місцях.
 *
 * Ціна дублювання оплачена інваріантом `src/ukrainian-holidays.test.ts`: він
 * читає `app.html` і порівняє переліки дослівно. Без нього розходження було б
 * ТИХИМ у найгіршому сенсі — воно з'явилося б рівно на один день на рік і рівно
 * тоді, коли на сайт дивиться найбільше людей.
 *
 * ## Чому дата місцева, а не UTC
 *
 * Свято — це день у людини за вікном, а не в Ґрінвічі. Для відвідувача в Одесі
 * (UTC+3) 24 серпня починається на три години раніше за UTC, і `getUTCDate()`
 * показав би прапор із запізненням на пів дня. Тому `getMonth`/`getDate` —
 * місцеві.
 */

/** Одне свято: дата у вигляді `MM-DD` і назва двома мовами. */
export interface UkrainianHoliday {
	/** `MM-DD` із нулями попереду — так само, як його формує інлайн-скрипт. */
	md: string;
	uk: string;
	en: string;
}

/**
 * Усі дати НЕРУХОМІ, і це важлива властивість переліку: жодне зі свят тут не
 * рахується від Великодня й не переноситься. Тому порівняння `MM-DD` достатньо,
 * а рік у розрахунку не бере участі зовсім.
 *
 * Порядок — за календарем від січня, щоб перелік можна було читати як календар,
 * а не як історію правок.
 */
export const UKRAINIAN_HOLIDAYS: readonly UkrainianHoliday[] = [
	{ md: '01-01', uk: 'Новий рік', en: "New Year's Day" },
	{ md: '01-22', uk: 'День Соборності України', en: 'Unity Day of Ukraine' },
	{ md: '02-19', uk: 'День Державного Герба України', en: 'Day of the State Coat of Arms of Ukraine' },
	{ md: '02-20', uk: 'День Героїв Небесної Сотні', en: 'Day of the Heroes of the Heavenly Hundred' },
	{ md: '06-28', uk: 'День Конституції України', en: 'Constitution Day of Ukraine' },
	{ md: '07-15', uk: 'День Української Державності', en: 'Day of Ukrainian Statehood' },
	{ md: '08-23', uk: 'День Державного Прапора України', en: 'Day of the State Flag of Ukraine' },
	{ md: '08-24', uk: 'День Незалежності України', en: 'Independence Day of Ukraine' },
	{
		md: '10-01',
		uk: 'День захисників і захисниць України / День українського козацтва',
		en: 'Day of the Defenders of Ukraine / Day of Ukrainian Cossacks'
	},
	{ md: '10-27', uk: 'День української писемності та мови', en: 'Day of Ukrainian Writing and Language' },
	{ md: '11-21', uk: 'День Гідності та Свободи', en: 'Day of Dignity and Freedom' },
	{ md: '12-06', uk: 'День Збройних Сил України', en: 'Day of the Armed Forces of Ukraine' },
	{ md: '12-25', uk: 'Різдво Христове', en: 'Christmas' }
] as const;

/** Лише дати, у тому ж вигляді, у якому їх порівнює інлайн-скрипт. */
export const UKRAINIAN_HOLIDAY_DATES: readonly string[] = UKRAINIAN_HOLIDAYS.map((h) => h.md);

/**
 * `MM-DD` місцевої дати.
 *
 * `padStart`, а не `toISOString().slice(5, 10)`: другий переводить у UTC, тобто
 * ввечері 23 серпня в Одесі віддав би `08-23` ще правильно, а от опівночі 24-го
 * — уже ні. Помилка на один день у перевірці, яка спрацьовує один день на рік,
 * не має шансу бути поміченою.
 */
export function monthDay(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${month}-${day}`;
}

/** Чи припадає ця місцева дата на свято з переліку. */
export function isUkrainianHoliday(date: Date): boolean {
	return UKRAINIAN_HOLIDAY_DATES.includes(monthDay(date));
}

/** Свято цієї дати, якщо воно є — щоб показати назву, а не лише прапор. */
export function ukrainianHolidayOn(date: Date): UkrainianHoliday | undefined {
	const md = monthDay(date);
	return UKRAINIAN_HOLIDAYS.find((h) => h.md === md);
}
