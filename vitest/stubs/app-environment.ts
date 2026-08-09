/**
 * Заглушка `$app/environment` для юніт-тестів.
 *
 * `browser: false` — це не довільний вибір, а найкорисніший для перевірок:
 * саме серверна гілка ловить помилки, які в браузері непомітні. Так уже
 * траплялося зі звичайним `dompurify`, у якого без DOM немає навіть методу
 * `sanitize`.
 *
 * Тесту, якому потрібна саме браузерна гілка, слід перевизначити це через
 * `vi.mock('$app/environment', ...)` у самому тесті — явно й локально.
 */
export const browser = false;
export const dev = false;
export const building = false;
export const version = 'test';
