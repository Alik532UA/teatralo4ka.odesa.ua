---
Назва: AGENTS.md — контекст проєкту teatralo4ka.odesa.ua
Опис: Канонічні інструкції для будь-якого AI-асистента в цьому репозиторії
---

# AGENTS.md — teatralo4ka.odesa.ua

> **Спершу прочитай [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md).** Там персональний
> шар пакета v8: усі прийняті рішення з датами й причинами, легасі-зони, списки
> винятків і перелік того, що тут **не** перевіряється автоматично. Цей файл —
> коротка витримка для щоденної роботи.
>
> Загальні стандарти живуть у `sveltekit-canon/selection_criteria/v8`. Тут — лише
> те, що специфічне для цього репозиторію.

## Що це

Сайт театральної студії: публічні сторінки українською й англійською плюс
адмін-панель на Firebase. Опорний проєкт пакета — більшість інваріантів канону
народилися саме тут, тож перш ніж вигадувати перевірку, подивись, чи її вже
немає в `src/*.test.ts`.

## Архітектура

- **Фреймворк:** SvelteKit 2 + Svelte 5 (**виключно** руни).
- **Профіль:** `static`, власний домен, `base = ''`. Серверного рантайму немає:
  ні form actions, ні `+server.ts`, ні `hooks.server.ts`. Дані — з Firestore на
  клієнті й із prerendered вмісту.
- **Стан:** класи-контролери в `.svelte.ts`. Module-level синглтон — панівна
  форма; `$effect` у його конструкторі кидає `effect_orphan`.
- **Сховище:** фасад `src/lib/services/storage.ts`, префікс `teatralo4ka_`
  (`src/lib/config/storage.ts`).
- **Дані:** усе, що приходить із Firestore, проходить `zod`-схему зі
  `src/lib/schemas/`. Схеми **відкидають** непридатне й нічого не підставляють —
  типові значення живуть в одному місці, у `DEFAULT_*`.
- **HTML із бази:** лише через `isomorphic-dompurify`. Звичайний `dompurify`
  падає під час prerender.
- **i18n:** `svelte-i18n` + типізована `schema.ts`. Мова — префікс шляху
  (`/en/…`, `uk` на голому), реалізований хуком `reroute` у `src/hooks.ts`.

## Локальні пастки

| Пастка | Що саме |
|---|---|
| Мовний префікс — це `reroute`, а не група маршрутів | `/en/about` рендериться маршрутом `/about`. Каталогів `[[lang]]` немає й не має з'явитися: перехід на групу переписав би 72 виклики `resolve()` одним комітом |
| `svelte/no-navigation-without-resolve` | шість файлів винесені в окремий блок `files:` конфіга з причинами. Точковий `eslint-disable-next-line` між атрибутами тега **ламає компіляцію** — HTML-коментар там недопустимий |
| Інлайн-скрипти в `app.html` | лишається лише тема (інакше миготіння); її хеш рахується зі збірки. `perf` і `splash` винесені у `static/`, бо `csp.mode: 'auto'` хешує тільки власні скрипти SvelteKit |
| `vitest.config.ts` бере `svelte()`, а не `sveltekit()` | `sveltekit()` додає власні аліаси `$app/*` і `$lib`, які перекривають заглушку `firebase/config`, без якої тести падають у CI без секретів |
| Компонентних тестів немає | плагін дає лише компіляцію рун. Монтувати `.svelte` нічим — не пиши тестів, що рендерять компоненти (AI-AGENT-PITFALLS-v8 § 1.3) |
| `husky` не встановлено | авто-bump версії не діє; бамп вручну через `npm run bump-version`. `static/app-version.json` мусить збігатися з `package.json` — це те, що тягне браузер відвідувача, і розходження або гасить оновлення, або жене всіх на неіснуючу версію. Тримає `src/version.test.ts` |
| CI має ДВА workflow, і вони перевіряють різне | `gates.yml` жене `check`, `lint`, `test`, `audit`, `validate-content` на кожен pull request і на push у будь-яку гілку, крім `main`. `deploy.yml` (тільки `main`) додає збірку, E2E і розгортання. Збірки в `gates.yml` немає навмисно: вона вимагає секретів `VITE_FIREBASE_*`, яких Dependabot-PR не отримує. До 2026-08-20 усі гейти були лише в `deploy.yml`, і в `dev` не перевірялося нічого — `npm run lint` там був червоний |
| Гейти збірки живуть у `prebuild`/`postbuild`, а не у плагіні Vite | плагін `smart-static-build-tools` прибрано 2026-08-16: його `catch` знижував падіння sitemap до попередження, і `vite build` виходив із кодом 0. Нові перевірки над `build/` додаються в `postbuild` — там їхній код виходу доходить до `npm run build` |
| Node **22** у трьох місцях | `engines.node`, `.nvmrc` і `node-version` у workflow мусять збігатися; розбіжність валить `src/dependencies.test.ts` |
| Адреса сайту — лише `src/lib/config/site.ts` | другий літерал `'https://teatralo4ka.odesa.ua'` у джерелах валить `src/site-origin.test.ts`. `robots.txt` звіряється тим самим тестом |

## НЕ РОБИ

| Заборонено | Замість цього |
|---|---|
| `writable()`, `readable()`, `derived()` зі `svelte/store` | `$state` / `$derived` у класі-контролері |
| `import { page } from '$app/stores'` | `$app/state` |
| `localStorage.getItem(...)` напряму | `storage` із `$lib/services/storage` |
| `{@html}` над даними з Firestore без санітизації | `isomorphic-dompurify`, і `eslint-disable-next-line` із причиною поруч |
| `${base}/шлях` для посилань | `resolve('/шлях')` з `$app/paths` |
| `${base}/images/x.svg` для файлів | `asset('/images/x.svg')` |
| `toLocaleString()` без аргументу | явна локаль: без неї береться локаль **системи**, а не мова сайту |
| `any` | конкретний тип, `unknown` або дженерик |
| `console.log` у коді застосунку | `errorLogger.logError()` / `.logWarning()` / `.logInfo()`. Правило `error`; у `scripts/` і конфігах воно вимкнене — там `console` і є виводом |
| Голий `Set` / `Map` як реактивний стан | `SvelteSet` / `SvelteMap` зі `svelte/reactivity` |

Кожен рядок цієї таблиці — правило ESLint. Вимкнути правило можна лише разом із
записаною поруч причиною (CODE-QUALITY-v8 § 6.4.1); інваріант
`src/eslint-baseline.test.ts` падає, якщо хтось вимкне його мовчки.

## Архітектура розділу «Дорослі» (/residents/adults)

- **7 категорій персоналу та майстрів:**
  1. `administration` («Керівництво та адміністрація»)
  2. `pedagogues` («Майстри курсів та педагоги»)
  3. `production` («Художньо-технічна служба»)
  4. `it` («IT та цифрові технології» — окрема категорія для Аліка Запольнова)
  5. `support` («Служба турботи та затишку»)
  6. `honorary` («Світла пам'ять» — з плавним 10-секундним зникненням ч/б фільтра при hover)
  7. `history` («Історія школи»)
- **3 режими відображення:** `cards` (Картки, за замовчуванням), `gallery` (Театральні вертикальні постери 2:3 `720×1080 px`), `compact` (Мінімалістична сітка аватарів з hover popover). Стан зберігається в `localStorage` (`adults_view_mode`).
- **Конвеєр фотографій викладачів:**
  - Повноформатні вихідники 1:1 зберігаються в `assets/masters-raw/{id}.webp` (WebP q=50).
  - Команда `npm run build:masters` генерує квадратні аватари `static/masters/{id}.webp` (480×480) та вертикальні постери `static/masters/portraits/{id}.webp` (720×1080), автоматично оновлюючи `masters.index.json` та `static/masters/profiles/*.json`.
- **Правило тестування користувача:** Користувач сам візуально перевіряє інтерфейс у браузері. НЕ використовувати `browser_subagent` для візуального тестування UI.

## Конвенції

- **Іменування:** компоненти `PascalCase.svelte`, утиліти `camelCase.ts`,
  контролери з рунами — обов'язково `.svelte.ts`.
- **`data-testid`:** стратегія **B — зберігати в production** (плагіна видалення
  немає, тож це записано, а не вдається за A). Конвенція — у
  TESTID-AND-NAMING-v8; перевірки: `src/testid-conventions.test.ts` статично,
  `e2e/testid.spec.ts` у рантаймі.
- **Тести:** Vitest під `src/` і `vitest/support/`, Playwright — у `e2e/`, проти
  **зібраного** сайту (`npm run test:e2e` спершу робить `build`).

## Команди перевірки та збірки

```
npm run check          # svelte-check, має бути 0 помилок і 0 попереджень
npm run lint           # eslint, має бути 0 помилок
npm test               # юніт-інваріанти vitest (усі 63 тест-файли)
npm run build:masters  # збірка веб-аватарів та постерів із assets/masters-raw/
npm run bump-version   # автоінкремент версії
npm run build          # збірка сайту; postbuild перевіряє sitemap і бандл
npm run test:e2e       # Playwright проти build/
```

Локально ці п'ять команд — те саме, що робить CI. Різниця одна: `npm run build`
і Playwright у CI виконуються лише в `deploy.yml` на `main`, тож перед пушем
туди їх варто прогнати руками — на pull request їх не буде.

**Результат треба побачити, а не припустити.** Твердження «правило виконано»
робиться після прогону, а не замість нього. Частину дефектів цього проєкту видно
**лише** у `build/` — саме тому `postbuild` існує окремо
(AI-AGENT-PITFALLS-v8 § 2).
