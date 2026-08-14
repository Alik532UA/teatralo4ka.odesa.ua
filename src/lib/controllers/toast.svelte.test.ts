import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast } from './toast.svelte';

/**
 * Перший тест контролера в цьому проєкті.
 *
 * До появи плагіна Svelte у `vitest.config.ts` таких тестів не могло існувати:
 * `$state` у класі — синтаксис, який без компіляції падає на розборі. Тобто всі
 * п'ять контролерів, а це весь стан застосунку, лежали поза перевірками, і в
 * PROJECT-CONTEXT це стояло як «середовище компонентних тестів ще не обрано».
 *
 * Перевіряється тут не «поле присвоїлося», а те, у чому справді буває помилка:
 * облік часу при паузі й СМЕРТЬ ТАЙМЕРІВ при скиданні. Друге — тихий клас
 * дефекту: живий таймер від закритого тоста знімає наступний тост із тим самим
 * id, і виглядає це як «сповіщення іноді блимає і зникає».
 */

describe('ToastState', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		toast.reset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('додає повідомлення й знімає його після власної тривалості', () => {
		toast.success('готово', 1000);
		expect(toast.messages).toHaveLength(1);

		vi.advanceTimersByTime(999);
		expect(toast.messages, 'зник раніше за свою тривалість').toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(toast.messages).toHaveLength(0);
	});

	it('пауза на наведенні спиняє автозникнення (WCAG 2.2.1)', () => {
		const id = toast.add('info', 'текст', 1000);

		vi.advanceTimersByTime(500);
		toast.pauseTimer(id);

		// Хоч скільки часу з наведеним курсором — тост лишається.
		vi.advanceTimersByTime(10_000);
		expect(toast.messages, 'зник під курсором').toHaveLength(1);
	});

	it('після паузи таймер продовжується з місця, а не з початку', () => {
		const id = toast.add('info', 'текст', 1000);

		vi.advanceTimersByTime(600);
		toast.pauseTimer(id);
		vi.advanceTimersByTime(5000);
		toast.resumeTimer(id);

		// Лишалося 400 мс, не 1000: рестарт із повної тривалості — окремий
		// анти-патерн у NOTIFICATIONS-v8, бо тост «залипає» тим довше, чим
		// частіше по ньому проводять мишею.
		vi.advanceTimersByTime(399);
		expect(toast.messages, 'таймер почався заново').toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(toast.messages).toHaveLength(0);
	});

	it('наведення й фокус разом: відпускання одного не знімає паузу', () => {
		const id = toast.add('info', 'текст', 1000);

		// Курсор і фокус — два незалежні тримачі (`holds`).
		toast.pauseTimer(id);
		toast.pauseTimer(id);
		toast.resumeTimer(id);

		vi.advanceTimersByTime(10_000);
		expect(toast.messages, 'пауза знялася від одного тримача з двох').toHaveLength(1);

		toast.resumeTimer(id);
		vi.advanceTimersByTime(1000);
		expect(toast.messages).toHaveLength(0);
	});

	it('ліміт одночасних тостів рахується в межах розміщення', () => {
		for (let i = 0; i < 6; i++) toast.add('info', `кутовий ${i}`, 10_000);
		expect(toast.messages.length, 'ліміт MAX_TOASTS не тримається').toBeLessThanOrEqual(4);

		// Сповіщення про новину стоїть в іншому кутку й витісняти кутові не повинне.
		const cornerCount = toast.messages.length;
		toast.push({ type: 'info', message: 'новина', duration: 10_000, placement: 'hot' });
		expect(toast.messages.filter((m) => m.placement === 'corner')).toHaveLength(cornerCount);
	});

	describe('reset', () => {
		it('прибирає всі повідомлення', () => {
			toast.add('info', 'a', 10_000);
			toast.add('info', 'b', 10_000);
			toast.reset();
			expect(toast.messages).toHaveLength(0);
		});

		it('ГАСИТЬ таймери, а не лише чистить список', () => {
			// Ось той дефект, через який reset() не зводиться до `messages = []`.
			// Живий таймер від скинутого тоста спрацював би за id, і оскільки
			// nextId монотонний, він зняв би НЕ той тост — але доки id ще малі й
			// збігаються після повторного відкриття, знімає саме новий.
			toast.add('info', 'старий', 1000);
			toast.reset();

			toast.add('info', 'новий', 10_000);
			vi.advanceTimersByTime(1500);

			expect(
				toast.messages.map((m) => m.message),
				'таймер скинутого тоста зняв новий'
			).toEqual(['новий']);
		});

		it('закриває незавершену обіцянку confirm() відповіддю false', async () => {
			const answer = toast.confirm('видалити?');
			expect(toast.isConfirmOpen).toBe(true);

			toast.reset();

			// Без цього `await toast.confirm(...)` не продовжився б НІКОЛИ: це не
			// витік пам'яті, а зависла гілка коду, і для користувача вона
			// виглядає як «кнопка нічого не робить».
			await expect(answer).resolves.toBe(false);
			expect(toast.isConfirmOpen).toBe(false);
			expect(toast.confirmMessage).toBe('');
		});
	});
});
