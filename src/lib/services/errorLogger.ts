/**
 * Client-side error logging service.
 * Stores recent errors in memory and prints them to the console.
 *
 * Точки входу: `handleError` у `hooks.client.ts` (неперехоплені помилки
 * клієнта) і `onerror` у `ErrorBoundary` (помилки рендеру всередині межі).
 */

export interface ErrorEvent {
	id: string;
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
	 * Log an error. Returns the generated error ID.
	 */
	logError(error: Error, context: Partial<ErrorEvent['context']> = {}): string {
		// Перевіряється саме `randomUUID`, а не сам `crypto`: поза secure context
		// об'єкт існує, а методу в ньому немає. Логер викликається з `handleError`,
		// тобто вже посеред обробки помилки — виняток тут перетворив би одну
		// помилку на дві, причому другу вже нікому не ловити.
		const id =
			typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
				? crypto.randomUUID()
				: `err-${Date.now()}-${Math.round(performance.now())}`;

		const message = redact(error.message);

		const event: ErrorEvent = {
			id,
			message,
			stack: error.stack ? redact(error.stack) : undefined,
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
		if (this.cache.length > this.MAX_CACHE) {
			this.cache.shift();
		}

		console.error(`[ErrorLogger] ${event.severity.toUpperCase()}:`, event.message, event);
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

	clearCache(): void {
		this.cache = [];
	}
}

export const errorLogger = new ErrorLogger();
