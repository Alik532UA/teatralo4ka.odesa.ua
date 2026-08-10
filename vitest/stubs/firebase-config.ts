import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

/**
 * Заглушка `firebase/config` для юніт-тестів.
 *
 * Справжній модуль ініціалізує Firebase НА РІВНІ МОДУЛЯ: `getAuth(app)`
 * виконується самим імпортом. Через це будь-який юніт-тест, що імпортує
 * `services/settings` (а той — `db` і `auth`), тягнув за собою ініціалізацію
 * Auth. Локально це маскував `.env.local`, а в CI, де секретів для юніт-тестів
 * немає і не повинно бути, падало `auth/invalid-api-key` — «works on my
 * machine» у чистому вигляді.
 *
 * Була спроба «полагодити» це фолбеками у САМОМУ `config.ts`:
 * `apiKey: import.meta.env... || 'AIzaSy…'`. Це небезпечно, і саме тому тут
 * заглушка, а не фолбек:
 *
 * - `config.ts` виконується й під час prerender (шапка → services/settings →
 *   config). Зникнення чи перейменування секрету СЬОГОДНІ валить збірку —
 *   голосно і до деплою. З фолбеком збірка проходить, деплой зелений, а сайт
 *   їде в продакшн із фейковим ключем: Firestore і Auth мертві для відвідувачів,
 *   і жоден гейт цього не побачив. Той самий клас, що CSP-фолбек і
 *   `var(--x, #fff)`: запасне значення робить помилку невидимою;
 * - фейк був підігнаний під формат справжнього ключа (`AIza` + 35 символів),
 *   тож збігається з патерном сканерів секретів — gitleaks/GitHub secret
 *   scanning здіймали б тривогу на кожен пуш.
 *
 * Значення тут інертні: юніт-тести перевіряють чисту логіку і не мають
 * торкатися мережі. Якщо тест справді викличе Firestore через цей `db` — він
 * упаде, і це правильно: такому тесту місце в e2e, а не в юнітах.
 */
export const auth = null as unknown as Auth;
export const db = null as unknown as Firestore;
export const storage = null as unknown as FirebaseStorage;
