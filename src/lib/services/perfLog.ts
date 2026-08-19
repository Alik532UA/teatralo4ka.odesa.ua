/**
 * Perf-лог: збір показників завантаження в текст, який можна скопіювати.
 *
 * **Окремий модуль, а не 55 рядків у кореневому layout.** Там воно й лежало —
 * разом із ручним створенням `textarea`, стилями в `Object.assign` і читанням
 * `performance.timing`. Layout відповідає за розкладку сторінки; збирати
 * діагностику — інша відповідальність, і саме її розмір першим уперся в стелю § 7,
 * коли поруч зʼявився службовий шар.
 *
 * Мітки в `window.__perfLog` ставить інлайн-скрипт у `app.html` — тому тут вони
 * лише читаються, а не створюються.
 */

/**
 * Показує текст у `textarea` поверх сторінки — запасний шлях, коли буфер обміну
 * відмовив.
 *
 * Чому взагалі запасний шлях: `writeText` відмовляє за нормальних умов — сторінка
 * без фокуса, відхилений дозвіл, не-HTTPS origin. Без цього виходу текст існував
 * би НІДЕ, а кнопка виглядала б натиснутою (DEBUGGING-v8 § 2.3).
 *
 * Повторний виклик прибирає попередній блок: кнопку тиснуть двічі, і два накладені
 * `textarea` виглядали б як зависання.
 */
function showPerfTextarea(text: string): void {
	const existing = document.getElementById('perf-debug-textarea');
	if (existing) {
		existing.remove();
		return;
	}
	const ta = document.createElement('textarea');
	ta.id = 'perf-debug-textarea';
	ta.value = text;
	ta.readOnly = true;
	Object.assign(ta.style, {
		position: 'fixed',
		bottom: '60px',
		left: '8px',
		right: '8px',
		zIndex: '99999',
		height: '50vh',
		fontSize: '11px',
		fontFamily: 'monospace',
		background: '#111',
		color: '#0f0',
		border: '2px solid #0f0',
		borderRadius: '8px',
		padding: '8px',
		whiteSpace: 'pre',
		overflow: 'auto'
	});
	ta.onclick = () => ta.select();
	document.body.appendChild(ta);
	ta.focus();
	ta.select();
}

/** Складає текст perf-логу з міток і показників браузера. */
export function buildPerfLog(): string {
	const log = window.__perfLog ?? [];
	const conn = (navigator as unknown as { connection?: Record<string, unknown> }).connection;
	const mem = (performance as unknown as { memory?: Record<string, number> }).memory;
	const timing = performance.timing;
	const since = (value: number) => Math.round(value - timing.navigationStart) + 'ms';

	return [
		'=== PERF LOG ===',
		'UA: ' + navigator.userAgent,
		'Time: ' + new Date().toISOString(),
		conn
			? `Connection: ${conn.effectiveType}, downlink=${conn.downlink}Mbps, rtt=${conn.rtt}ms, saveData=${conn.saveData}`
			: 'Connection API: N/A',
		mem
			? `JS Heap: ${Math.round(mem.usedJSHeapSize / 1048576)}/${Math.round(mem.jsHeapSizeLimit / 1048576)} MB`
			: 'Memory API: N/A',
		'navTiming.domContentLoaded: ' + since(timing.domContentLoadedEventEnd),
		'navTiming.loadEvent: ' + since(timing.loadEventEnd),
		'navTiming.responseEnd: ' + since(timing.responseEnd),
		'navTiming.domInteractive: ' + since(timing.domInteractive),
		'serviceWorker: ' + ('serviceWorker' in navigator ? 'supported' : 'no'),
		'indexedDB: ' + (typeof indexedDB !== 'undefined' ? 'available' : 'no'),
		'',
		...log.map((e) => '+' + e.t + 'ms  ' + e.label),
		'',
		'=== END ==='
	].join('\n');
}

/**
 * Копіює perf-лог у буфер. `onCopied` показує підтвердження — текст приходить
 * звідти, бо переклади знає компонент, а не цей модуль.
 */
export function copyPerfLog(onCopied: () => void): void {
	const text = buildPerfLog();
	if (navigator.clipboard?.writeText) {
		navigator.clipboard.writeText(text).then(onCopied, () => showPerfTextarea(text));
	} else {
		showPerfTextarea(text);
	}
}
