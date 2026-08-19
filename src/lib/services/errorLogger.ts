/**
 * Клієнтський логер: буфер останніх подій плюс вивід у консоль.
 *
 * Точки входу: `handleError` у `hooks.client.ts` (неперехоплені помилки
 * клієнта), `onerror` у `ErrorBoundary` (помилки рендеру всередині межі) і
 * прямі виклики `warn`/`info` з сервісів.
 *
 * ## Чому рівні, а не лише `logError`
 *
 * DEBUGGING-v8 і ERROR-HANDLING-v8 обидва вимагають того самого: очікуваний
 * збій (офлайн, скасований запит, недоступний сторонній сервіс) логується
 * рівнем `warn`, а не `error`. Виконати це правило було НІЧИМ — у логера
 * існував один метод, `logError`. Тому близько двадцяти місць у проєкті писали
 * в консоль напряму, і жодне з них не потрапляло ні в буфер, ні під маскування
 * PII. Тобто правило стояло в стандарті, а в коді не могло бути виконане в
 * принципі.
 *
 * Рівень і `severity` — різні речі й лишаються різними полями. Рівень задає
 * ТОЙ, ХТО ЛОГУЄ: він знає, чи ця подія очікувана. `severity` рахується з
 * тексту евристикою і лишається лише для помилок — вона відповідає на інше
 * питання, «наскільки погано», і вгадує його, тоді як рівень не вгадує нічого.
 */

/** Канал події. Задає викликач, бо лише він знає, чи збій очікуваний. */
export type LogLevel = 'info' | 'warn' | 'error';

export interface ErrorEvent {
	id: string;
	/** Типово `error` — щоб наявні записи в буфері не змінили значення. */
	level: LogLevel;
	message: string;
	stack?: string;
	context: {
		component?: string;
		page?: string;
		timestamp: string;
		userAgent: string;
	};
	severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Маскування чутливого в тексті помилки (SECURITY-v8 § 10).
 *
 * Робить це ЛОГЕР, а не місця виклику. Причина проста: місць виклику стає
 * більше з часом, і достатньо одного забутого, щоб правило перестало діяти.
 * Тут же воно застосовується до всього, що входить, за визначенням.
 *
 * Що сюди реально потрапляє. Текст помилки Firebase Auth часто містить адресу
 * облікового запису; повідомлення про невдалий запит містить URL, а в ньому —
 * `token`, `key`, `access_token`; стек містить і те, і те. Кеш читається
 * методом `getCache()`, і будь-який майбутній спосіб віддати його назовні
 * (кнопка «зібрати логи», надсилання на сервер) успадкує маскування, а не
 * забуде його додати.
 */
const REDACTIONS: [RegExp, string | ((...m: string[]) => string)][] = [
	// Адреса пошти: лишається перша літера й домен — досить, щоб упізнати
	// випадок, і замало, щоб адресу переслати.
	[/\b([A-Za-z0-9])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g, '$1***@$2'],
	// Параметр запиту з чутливою назвою — разом зі значенням.
	[/([?&](?:access_?token|id_?token|refresh_?token|token|key|api_?key|password|secret|code)=)[^&\s"']+/gi, '$1[redacted]'],
	// JWT: три частини через крапку, перша завжди починається з eyJ.
	[/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g, '[jwt]'],
	// Заголовок авторизації в тексті помилки.
	[/\b(Bearer)\s+[A-Za-z0-9._~+/-]{8,}=*/gi, '$1 [redacted]'],
	// Ключ Google/Firebase у повідомленні (напр. auth/invalid-api-key з ключем).
	[/\bAIza[0-9A-Za-z_-]{35}\b/g, '[api-key]']
];

export function redact(text: string): string {
	let out = text;
	for (const [pattern, replacement] of REDACTIONS) {
		out = out.replace(pattern, replacement as string);
	}
	return out;
}

class ErrorLogger {
	private cache: ErrorEvent[] = [];
	private readonly MAX_CACHE = 50;

	/**
	 * Кого сповістити, коли записів побільшало.
	 *
	 * **Підписка, а не `$state`.** Модуль імпортують `hooks.client`, `firebase/config`
	 * і схеми налаштувань — усе звичайний TypeScript. Реактивний кеш вимагав би
	 * перейменування на `.svelte.ts` і правок у понад десяти місцях, тобто привʼязки
	 * служби логування до фреймворку заради одного лічильника на екрані.
	 */
	private listeners = new Set<() => void>();

	/** Номер збірки. Одне джерело для звіту й для табла версії. */
	readonly appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'unknown';

	/** Підписатися на зміни буфера. Повертає функцію відписки — прямо в cleanup `$effect`. */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Log an error. Returns the generated error ID.
	 */
	logError(error: Error, context: Partial<ErrorEvent['context']> = {}): string {
		return this.record('error', error.message, context, error.stack);
	}

	/**
	 * Очікуваний збій: офлайн, скасований запит, недоступний сторонній сервіс,
	 * непридатні дані, які код уміє пережити.
	 *
	 * Рівень тут не косметика. Поки такі події йшли рівнем `error`, кожен
	 * користувач без мережі додавав запис у той самий потік, де мали б бути
	 * справжні поломки — а потік перестають читати саме через такий шум.
	 *
	 * Приймає рядок, а не `Error`: очікуваний збій зазвичай не має стека, вартого
	 * зберігання, і створювати `Error` заради рівня означало б платити за стек,
	 * який ніхто не прочитає. Другий аргумент лишає можливість передати причину.
	 */
	logWarning(message: string, context: Partial<ErrorEvent['context']> = {}, cause?: unknown): string {
		const detail = cause instanceof Error ? cause.message : cause != null ? String(cause) : '';
		return this.record('warn', detail ? `${message}: ${detail}` : message, context);
	}

	/**
	 * Бізнес-подія, не збій: увійшов, зберіг, перемкнув мову.
	 *
	 * У консоль НЕ друкується, і це свідомо. По-перше, `no-console` у проєкті
	 * дозволяє лише `warn` і `error`, і робити виняток заради інформаційного
	 * рівня означало б відкрити його всім. По-друге й головне: інформаційний шум
	 * у консолі продакшну — це те, через що справжню помилку не видно. Подія
	 * лишається в буфері, і саме звідти її бере звіт.
	 */
	logInfo(message: string, context: Partial<ErrorEvent['context']> = {}): string {
		return this.record('info', message, context);
	}

	/**
	 * Єдина точка запису — саме тому маскування й обрізання буфера неможливо
	 * забути на новому рівні. Раніше тіло цього методу лежало в `logError`, і
	 * будь-який другий метод був би його копією.
	 */
	private record(
		level: LogLevel,
		rawMessage: string,
		context: Partial<ErrorEvent['context']>,
		rawStack?: string
	): string {
		// Перевіряється саме `randomUUID`, а не сам `crypto`: поза secure context
		// об'єкт існує, а методу в ньому немає. Логер викликається з `handleError`,
		// тобто вже посеред обробки помилки — виняток тут перетворив би одну
		// помилку на дві, причому другу вже нікому не ловити.
		const id =
			typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
				? crypto.randomUUID()
				: `err-${Date.now()}-${Math.round(performance.now())}`;

		const message = redact(rawMessage);

		const event: ErrorEvent = {
			id,
			level,
			message,
			stack: rawStack ? redact(rawStack) : undefined,
			context: {
				timestamp: new Date().toISOString(),
				userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
				...context,
				// Адреса теж маскується: рядок запиту з токеном приходить саме нею.
				page: redact(
					context.page ?? (typeof window !== 'undefined' ? window.location.pathname : 'unknown')
				),
			},
			// Рівень рахується від ЗАМАСКОВАНОГО тексту: інакше `500` усередині
			// прихованого токена підняло б рівень на рівному місці.
			severity: this.determineSeverity(message),
		};

		this.cache.push(event);
		// Слухачі — після обрізання буфера нижче, тобто вже за остаточним станом:
		// сповіщення перед `shift()` віддало б число, якого за мить не існує.
		if (this.cache.length > this.MAX_CACHE) {
			this.cache.shift();
		}

		const prefix = `[${level}] ${event.context.component ?? 'app'}:`;
		if (level === 'error') {
			console.error(prefix, event.message, event);
		} else if (level === 'warn') {
			console.warn(prefix, event.message);
		}
		// `info` у консоль не йде — див. `logInfo`.

		this.notify();

		return id;
	}

	private determineSeverity(message: string): ErrorEvent['severity'] {
		const lower = message.toLowerCase();
		if (lower.includes('memory') || lower.includes('outofmemory')) return 'critical';
		if (lower.includes('500') || lower.includes('database') || lower.includes('server')) return 'high';
		if (lower.includes('network') || lower.includes('fetch') || lower.includes('404')) return 'medium';
		return 'low';
	}

	getCache(): ErrorEvent[] {
		return [...this.cache];
	}

	/**
	 * Лише помилки — для звіту, який має показати поломки, а не всю історію.
	 *
	 * Окремий метод, а не фільтр у місці виклику: щойно рівнів стало три,
	 * `getCache()` перестав означати «список помилок», і кожен, хто його так
	 * читав, отримав би до звіту ще й інформаційні події.
	 */
	getErrors(): ErrorEvent[] {
		return this.cache.filter((e) => e.level === 'error');
	}

	clearCache(): void {
		this.cache = [];
		this.notify();
	}

	/**
	 * Сповістити підписників. Виняток у чужому коді не має з'їдати сам запис: логер
	 * кличуть саме тоді, коли вже зле.
	 */
	private notify(): void {
		for (const listener of this.listeners) {
			try {
				listener();
			} catch {
				/* підписник зламаний — буфер від цього не страждає */
			}
		}
	}

	/** Скільки помилок у буфері. Читає табло — через `subscribe` вище. */
	get errorCount(): number {
		return this.getErrors().length;
	}
}

export const errorLogger = new ErrorLogger();
