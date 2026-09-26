/**
 * Куди веде клавіша в сітці днів місяця — шаблон WAI-ARIA APG «Grid».
 *
 * Стрілки ходять на день і на тиждень, Home/End — до краю тижня. Межу місяця
 * не перетинає: кожна картка місяця — окрема сітка з однією зупинкою Tab, і
 * перескок у сусідню картку був би переходом, якого людина не просила.
 *
 * Чиста функція, а не частина компонента: компонентних тестів у проєкті немає
 * (AGENTS.md, «Локальні пастки»), а поведінку клавіатури так видно юніт-тестом.
 *
 * @param index   індекс дня серед днів місяця (0 — перше число)
 * @param key     `KeyboardEvent.key`
 * @param leading скільки клітинок першого тижня займає попередній місяць
 * @param count   скільки днів у місяці
 * @returns новий індекс; `null` — клавіша не про сітку, її треба пропустити далі
 */
export function monthGridStep(
	index: number,
	key: string,
	leading: number,
	count: number
): number | null {
	const column = (leading + index) % 7;
	const last = count - 1;
	switch (key) {
		case 'ArrowLeft':
			return Math.max(0, index - 1);
		case 'ArrowRight':
			return Math.min(last, index + 1);
		case 'ArrowUp':
			return index - 7 >= 0 ? index - 7 : index;
		case 'ArrowDown':
			return index + 7 <= last ? index + 7 : index;
		case 'Home':
			return Math.max(0, index - column);
		case 'End':
			return Math.min(last, index + (6 - column));
		default:
			return null;
	}
}
