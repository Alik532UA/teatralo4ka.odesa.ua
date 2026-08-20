// @vitest-environment node
// Перевірка лише читає файли — DOM їй не потрібен, а jsdom стоїть не в кожному
// з проєктів. Закріплення середовища тут прибирає цю залежність.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Перевірка конвенцій data-testid за TESTID-AND-NAMING-v8.md § 1.9.1.
 *
 * Читає джерела, а не DOM, і тому бачить усі testid — включно з тими, що
 * всередині {#if}, модалок і гілок помилок, куди браузерна перевірка після
 * page.goto() не дістається ніколи. Це єдина з двох перевірок, що взагалі
 * здатна валідувати суфікси; рантайм-дублікати ловить Playwright-інваріант.
 */

const CANON = new Set([
	// інтерактивні
	"btn", "link", "input", "textarea", "checkbox", "radio", "select", "toggle", "slider", "option",
	// форми
	"form", "fieldset", "label", "error", "hint",
	// оверлеї
	"modal", "drawer", "backdrop", "overlay", "tooltip", "toast",
	// структура
	"card", "list", "item", "row", "cell", "tabs", "tab", "panel",
	"section", "header", "footer", "nav", "banner", "menu", "toolbar", "container",
	// медіа
	"icon", "img",
	// read-only контент
	"title", "text", "message", "warning", "value", "count", "status",
	"badge", "progress", "spinner", "skeleton"
]);

/**
 * Заборонено в позиції типу — тобто останнім статичним сегментом.
 *
 * Саме в позиції, а не будь-де: ці слова цілком легітимні як частина назви
 * фічі. `block-mode-toggle` у грі — це режим блокування ходів, а не «блок»;
 * `rich-text-editor` — назва редактора. Заборона в будь-якій позиції зробила б
 * перевірку такою, що бореться з предметною областю.
 */
const BANNED_AS_TYPE: Record<string, string> = {
	wrapper: "container",
	wrap: "container",
	box: "container",
	root: "container",
	block: "section",
	area: "section",
	group: "fieldset | toolbar | section",
	content: "panel",
	grid: "list",
	widget: "card | panel | section",
	display: "value",
	switcher: "select | toggle | tabs",
	trigger: "btn",
	help: "hint",
	dialog: "modal",
	popup: "modal",
	step: "item",
	dot: "item | badge",
	subtab: "tab"
};

/**
 * Заборонено в будь-якій позиції: щойно в проєкті співіснують `-btn` і
 * `-button`, кожен локатор стає здогадкою про те, який з двох обрав автор.
 */
const BANNED_ANYWHERE: Record<string, string> = { button: "btn", buttons: "btn | toolbar" };

/**
 * Легасі-id, що чекають на міграцію (§ 1.10). Список тільки скорочується.
 * Порожній = міграцію завершено.
 */
const LEGACY_ALLOWED = new Set<string>([]);

/**
 * Свідомі повтори в межах одного файлу: той самий елемент у взаємовиключних
 * гілках `{#if}/{:else}`, коли тесту потрібен один локатор незалежно від гілки
 * (той самий підсумковий рахунок у компактному й звичайному режимі).
 *
 * Не плутати з реальним дублікатом, коли обидва елементи в DOM одночасно —
 * такий треба розводити, а не вносити сюди. Список видно в кожному diff.
 */
const ALLOWED_DUPLICATES = new Set<string>([]);

/**
 * Чим замінюємо `{…}` та `${…}` перед розбором. Саме літера, а не порожній
 * рядок: інакше `news-card-${id}` перетворюється на `news-card-`, і перевірка
 * kebab-case падає на висячому дефісі, якого в коді немає.
 */
const DYNAMIC = "x";

function svelteFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			if (["node_modules", ".svelte-kit", "build"].includes(entry)) continue;
			svelteFiles(full, out);
		} else if (entry.endsWith(".svelte")) out.push(full);
	}
	return out;
}

/**
 * Прибирає те, що не є розміткою: `<style>` (там testid трапляється в
 * селекторах `:global([data-testid="…"])`) і HTML-коментарі (там лишаються
 * старі назви та пояснення). Без цього перевірка рахує їх за окремі елементи
 * і повідомляє про дублікати, яких у DOM немає.
 */
const markupOnly = (text: string) =>
	text.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<!--[\s\S]*?-->/g, "");

function collect(): { id: string; file: string }[] {
	const found: { id: string; file: string }[] = [];
	for (const file of svelteFiles("src")) {
		const text = markupOnly(readFileSync(file, "utf8"));
		const re = /data-testid=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text))) {
			found.push({ id: m[1] ?? m[2] ?? m[3] ?? m[4], file: file.replace(/\\/g, "/") });
		}
	}
	return found;
}

/**
 * Динаміку замінюємо на `-x-`, а не просто на `x`: вставка трапляється без
 * дефіса (`…-all-link{suffix}`), і без штучної межі тип злипався б із нею в
 * один сегмент `linkx`, якого в каноні немає — перевірка сварилась би на
 * цілком правильний id.
 */
const segmentsOf = (id: string) =>
	id.replace(/\$?\{[^}]*\}/g, `-${DYNAMIC}-`).split("-").filter(Boolean);

/** Останній сегмент, що не є динамічним чи числовим дискримінатором. */
function typeSegment(id: string): string {
	const segs = segmentsOf(id);
	while (segs.length && (segs.at(-1) === DYNAMIC || /^\d+$/.test(segs.at(-1) as string))) segs.pop();
	return segs.at(-1) ?? "";
}

describe("data-testid conventions (v8)", () => {
	const all = collect();
	const checked = all.filter(({ id }) => !LEGACY_ALLOWED.has(id));

	it("знаходить testid у джерелах — сама перевірка жива", () => {
		expect(all.length).toBeGreaterThan(0);
	});

	it("не вживає заборонених слів у позиції типу (§ 1.4)", () => {
		const bad = checked
			.filter(({ id }) => typeSegment(id) in BANNED_AS_TYPE)
			.map(({ id, file }) => `${id}  (${file}) — «${typeSegment(id)}» → ${BANNED_AS_TYPE[typeSegment(id)]}`);
		expect(bad, `Заборонений тип:\n${bad.join("\n")}`).toEqual([]);
	});

	it("не змішує -btn і -button (§ 1.4)", () => {
		const bad = checked
			.filter(({ id }) => segmentsOf(id).some((s) => s in BANNED_ANYWHERE))
			.map(({ id, file }) => `${id}  (${file}) — «button» → btn`);
		expect(bad, `Заборонене слово в будь-якій позиції:\n${bad.join("\n")}`).toEqual([]);
	});

	it("кожен testid має канонічний тип (§ 1.3)", () => {
		const bad = checked
			.filter(({ id }) => !segmentsOf(id).some((s) => CANON.has(s)))
			.map(({ id, file }) => `${id}  (${file})`);
		expect(bad, `Без канонічного типу:\n${bad.join("\n")}`).toEqual([]);
	});

	/**
	 * Тип має відповідати HTML-семантиці, а не візуальному враженню (§ 1.3).
	 *
	 * Перевіряється саме `label`, бо це єдиний тип, чию правильність видно з
	 * розмітки однозначно: `-label` означає підпис поля, тобто елемент `<label>`.
	 * До цієї перевірки в проєкті було 40 `-label` на `<p>`, `<h1>`, `<span>` і
	 * `<time>` — заголовки, порожні стани й індикатори завантаження. Канонічна
	 * перевірка § 1.9.1 їх не бачила: `label` є в CANON, тому формально все
	 * сходилося. Це рівно та частина § 1.3, яку канон віддає код-рев'ю; для
	 * `label` її вдається зробити машинною.
	 *
	 * Решту типів так перевіряти не можна: `-btn` законно стоїть на `<a role>`,
	 * `-card` на `<article>`, `-value` на будь-чому. Тому одне правило, а не
	 * таблиця відповідностей.
	 */
	it("тип -label стоїть лише на елементі <label> (§ 1.3)", () => {
		const bad: string[] = [];
		for (const file of svelteFiles("src")) {
			const text = markupOnly(readFileSync(file, "utf8"));
			// Тег і його атрибути до `data-testid`; `[^>]*?` не перетинає межу тегу.
			const re = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?data-testid=(?:"([^"]*)"|\{`([^`]*)`\})/g;
			let m: RegExpExecArray | null;
			while ((m = re.exec(text))) {
				const tag = m[1].toLowerCase();
				const id = m[2] ?? m[3];
				if (typeSegment(id) === "label" && tag !== "label") {
					bad.push(`${id}  (<${tag}> у ${file.replace(/\\/g, "/")}) — тип за змістом: -title / -text / -message / -status / -value`);
				}
			}
		}
		expect(bad, `Тип -label не на <label>:\n${bad.join("\n")}`).toEqual([]);
	});

	it("тільки kebab-case ASCII (§ 1.2)", () => {
		const bad = all
			.filter(({ id }) => /[A-Z]|[Ѐ-ӿ]|--|^-|-$/.test(id.replace(/\$?\{[^}]*\}/g, DYNAMIC)))
			.map(({ id, file }) => `${id}  (${file})`);
		expect(bad, `Порушення kebab-case:\n${bad.join("\n")}`).toEqual([]);
	});

	it("немає недетермінованих id (§ 1.6)", () => {
		const bad = all
			.filter(({ id }) => /randomUUID|Math\.random|Date\.now/.test(id))
			.map(({ id, file }) => `${id}  (${file})`);
		expect(bad, `Недетерміновані id:\n${bad.join("\n")}`).toEqual([]);
	});

	it("немає дублікатів у межах одного компонента (§ анти-патерн HIGH)", () => {
		const byFile = new Map<string, string[]>();
		// Динамічні id пропускаємо: той самий шаблон у двох циклах дає різні
		// значення в DOM, тому це не колізія. Статичний id, повторений у файлі,
		// колізія завжди — компонент рендериться цілком.
		for (const { id, file } of all) {
			if (id.includes("{") || ALLOWED_DUPLICATES.has(id)) continue;
			byFile.set(file, [...(byFile.get(file) ?? []), id]);
		}

		const dupes: string[] = [];
		for (const [file, ids] of byFile) {
			const seen = new Set<string>();
			for (const id of ids) {
				if (seen.has(id)) dupes.push(`${id}  (${file})`);
				seen.add(id);
			}
		}
		expect(dupes, `Дублікати в одному файлі:\n${dupes.join("\n")}`).toEqual([]);
	});
});

/** Заміна блоку переносами: зберігає номери рядків у звітах перевірок. */
const blank = (match: string) => "\n".repeat((match.match(/\n/g) ?? []).length);

/**
 * Кожен інтерактивний елемент публічної частини має `data-testid`
 * (TESTID-AND-NAMING-v8 § 1.2, стратегія B — testid лишаються в продакшні).
 *
 * Перевірки вище валідують ІСНУЮЧІ testid. Вони за побудовою не бачать
 * протилежного дефекту: контрола, у якого testid немає ЗОВСІМ. А він
 * знаходиться саме там, де найдорожче — у гілці, яка рендериться не завжди.
 *
 * Заміряно 2026-08-20 разом із дублем кнопки «усі проєкти». Той самий контрол
 * «Детальніше» у `ContentCard` існує в чотирьох варіантах картки, і в двох із
 * них testid був, а в двох — ні. Тест, написаний проти вигляду «список», мовчки
 * націлився б на невидиму десктопну копію: локатор знаходиться, елемент має
 * `display: none`, і причину шукають не там.
 *
 * ## Чому статично, а не в браузері
 *
 * Половина цих гілок не рендериться на типовій сторінці: варіант картки
 * залежить від вигляду віджета, а вигляд — від конфігурації у Firestore.
 * Рантайм-перевірка бачила б лише те, що випало сьогодні.
 *
 * ## Чому адмінка виключена
 *
 * Там 129 таких місць (заміряно тим самим сканером), E2E туди не ходить без
 * облікових даних, і це вже записано в PROJECT-CONTEXT окремим боргом. Гейт із
 * 129 порушеннями довелося б вимкнути наступного дня, а вимкнений гірший за
 * відсутній (CODE-QUALITY-v8 § 6.4.1). Публічна частина тримається на нулі.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати `data-testid` у
 * будь-якої кнопки публічного компонента — перевірка мусить назвати рядок.
 */
describe("інтерактивні елементи публічної частини мають testid", () => {
	/**
	 * Скрипт, стилі й коментарі замінюються переносами, а НЕ вирізаються: інакше
	 * поїдуть номери рядків у звіті, а саме за ними знаходять місце.
	 */
	const markupPreservingLines = (text: string) =>
		text
			.replace(/<script[\s\S]*?<\/script>/g, blank)
			.replace(/<style[\s\S]*?<\/style>/g, blank)
			.replace(/<!--[\s\S]*?-->/g, blank);

	/**
	 * Відкриваючі теги. Наївний `/<a[^>]*>/` тут не працює: атрибут Svelte
	 * містить стрілку `=>`, тобто символ `>`, і тег обривається посеред
	 * обробника. Кінець тега — перший `>` поза фігурними дужками, який не є
	 * частиною `=>`.
	 */
	function openingTags(source: string): Array<{ index: number; tag: string }> {
		const tags: Array<{ index: number; tag: string }> = [];
		for (let i = 0; i < source.length; i += 1) {
			if (source[i] !== "<") continue;
			let depth = 0;
			let j = i + 1;
			for (; j < source.length; j += 1) {
				const c = source[j];
				if (c === "{") depth += 1;
				else if (c === "}") depth -= 1;
				else if (c === ">" && depth === 0 && source[j - 1] !== "=") break;
			}
			tags.push({ index: i, tag: source.slice(i, j + 1) });
			i = j;
		}
		return tags;
	}

	/**
	 * Адмінка — окремий, записаний борг. Шляху `/admin` тут недостатньо: два
	 * редактори лежать у спільній теці `ui/`, хоча імпортує їх лише
	 * `routes/admin/settings` (перевірено пошуком). Тому вони названі поіменно —
	 * інакше межа гейта неправдива, а не просто ширша.
	 */
	const ADMIN_ONLY = new Set([
		"src/lib/components/ui/MenuEditor.svelte",
		"src/lib/components/ui/LinkPicker.svelte"
	]);

	const isPublic = (file: string) => !file.includes("/admin") && !ADMIN_ONLY.has(file);

	/**
	 * Виняток один, і він не про зручність: ці `<a>` живуть у `.sr-only`-навігації
	 * зі списком усіх випускників — перелік на вісімдесят посилань, який існує
	 * для краулера й читалки. Локатор на кожне з них не дає нічого: адресується
	 * сам список, і в нього testid є.
	 */
	const ALLOWED_WITHOUT = new Set(["galaxy-graduates"]);

	const controls = (file: string) => {
		const source = markupPreservingLines(readFileSync(file, "utf8"));
		return openingTags(source)
			.filter(({ tag }) => /^<(a\b|button\b)/.test(tag))
			// `<a>` без href — це якір або обгортка, а не контрол.
			.filter(({ tag }) => !/^<a\b/.test(tag) || /\bhref[=\s]/.test(tag))
			.map(({ index, tag }) => ({
				line: (source.slice(0, index).match(/\n/g) ?? []).length + 1,
				tag
			}));
	};

	it("перевірка жива: інтерактивні елементи знайдено", () => {
		const total = svelteFiles("src").reduce((n, f) => n + controls(f).length, 0);
		expect(total, "жодного <a href>/<button> — сканер шукає не там").toBeGreaterThan(50);
	});

	it("жодного <a href> чи <button> без data-testid", () => {
		const naked: string[] = [];

		for (const file of svelteFiles("src")) {
			const path = file.replace(/\\/g, "/");
			if (!isPublic(path)) continue;
			if ([...ALLOWED_WITHOUT].some((part) => path.includes(part))) continue;

			for (const { line, tag } of controls(file)) {
				if (/\bdata-testid[=\s]/.test(tag)) continue;
				naked.push(`${path}:${line} — ${tag.split(/\s+/).slice(0, 3).join(" ")}…`);
			}
		}

		expect(
			naked,
			"контрол без testid не адресується з тесту, а сусідній варіант того самого " +
				`контрола адресується — саме так локатор і починає вказувати не туди:\n${naked.join("\n")}`
		).toEqual([]);
	});
});
