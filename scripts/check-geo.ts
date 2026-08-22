import fs from "fs";
import path from "path";

/**
 * Артефакти AI-пошуку в зібраному сайті (SEO-v8 § 7.5).
 *
 * ## Чому це окрема перевірка, а не рядок у `check-links`
 *
 * `check-links` розв'язує ВІДНОСНІ href зі сторінок. Посилання в `llms.txt`
 * абсолютні, лежать поза HTML і туди не потрапляють. Тобто саме той файл, який
 * читає модель, не перевіряв ніхто.
 *
 * ## Чому розбір `robots.txt` іде ПО ГРУПАХ
 *
 * Краулер обирає ОДНУ групу — найточніший збіг за `User-agent` — і виконує
 * тільки її, ігноруючи `*` цілком. Пропущений в іменованій групі `Disallow`
 * не «наслідується», а ВІДКРИВАЄ цей шлях саме названому боту. Перевірка
 * підрядком (`robots.includes('Disallow: /')`), яку пропонувала перша редакція
 * канону, цього не бачить у принципі: цей підрядок є в будь-якому
 * `Disallow: /admin/`.
 *
 * ## Найважливіша пастка цієї перевірки
 *
 * Наявність каталогу — НЕ наявність сторінки. `build/departments/` існує через
 * чотири підсторінки, а сторінки `/departments` немає, і саме таке посилання
 * стояло в `llms.txt`: модель віддала б користувачеві 404. Тому перевіряється
 * саме ФАЙЛ (`index.html` усередині або `.html` поруч), а не шлях.
 */

const BUILD_DIR = "build";

/** Агенти, від яких залежить видимість у відповідях AI (SEO-v8 § 7.2). */
const SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
];

type RobotsGroup = { agents: string[]; allow: string[]; disallow: string[] };

/**
 * Групи `robots.txt` у порядку появи. Кілька `User-agent` підряд утворюють
 * ОДНУ групу — інакше другий агент порахувався б групою без правил.
 */
function parseRobots(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === "allow") current.allow.push(value);
    if (key === "disallow") current.disallow.push(value);
  }
  return groups;
}

function htmlFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const isFile = (p: string) => fs.existsSync(p) && fs.statSync(p).isFile();

function main() {
  const problems: string[] = [];

  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`❌ немає каталогу ${BUILD_DIR}/ — спершу npm run build`);
    process.exit(1);
  }

  // --- рівно ОДИН <meta name="robots"> на сторінку (§ 7.3) ---
  //
  // `<svelte:head>` ДОПИСУЄ до `<head>`, а не заміщує в ньому: тег в
  // `app.html` і тег зі сторінки співіснують. Два теги з протилежним змістом
  // («index, follow» і «noindex») — це не помилка збірки й не попередження,
  // а мовчазна суперечність, яку розв'язує краулер на власний розсуд.
  for (const file of htmlFiles(BUILD_DIR)) {
    const tags =
      fs.readFileSync(file, "utf8").match(/<meta[^>]+name="robots"/g) ?? [];
    if (tags.length > 1) {
      problems.push(
        `${file.split(path.sep).join("/")}: <meta name="robots"> знайдено ${tags.length} разів, очікується 1`,
      );
    }
  }

  // --- llms.txt (§ 7.1) ---
  const llmsPath = path.join(BUILD_DIR, "llms.txt");
  if (!fs.existsSync(llmsPath)) {
    problems.push("llms.txt: файл відсутній у зібраному сайті");
  } else {
    const llms = fs.readFileSync(llmsPath, "utf8");
    if (!llms.startsWith("# ")) problems.push("llms.txt: немає заголовка H1");

    const urls = [...llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(
      (m) => m[1],
    );
    if (urls.length === 0) problems.push("llms.txt: немає абсолютних посилань");

    const dupes = [...new Set(urls.filter((u, i) => urls.indexOf(u) !== i))];
    if (dupes.length) {
      problems.push(
        `llms.txt: одна адреса під різними назвами: ${dupes.join(", ")}`,
      );
    }

    // Корінь сайту береться з `canonical` головної, а не з константи: так
    // перевірка не потребує налаштування й не розходиться зі збіркою.
    const home = path.join(BUILD_DIR, "index.html");
    const siteUrl = fs.existsSync(home)
      ? (fs
          .readFileSync(home, "utf8")
          .match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1] ?? "")
      : "";

    if (!siteUrl) {
      problems.push(
        "llms.txt: не знайдено canonical головної — адреси нема з чим звіряти",
      );
    } else {
      const root = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
      for (const url of new Set(urls)) {
        // Чужі домени (репозиторій, соцмережі) не наша відповідальність.
        if (!url.startsWith(root)) continue;
        const rel = url
          .slice(root.length)
          .replace(/[?#].*$/, "")
          .replace(/\/$/, "");
        const exists =
          rel === ""
            ? true
            : isFile(path.join(BUILD_DIR, rel, "index.html")) ||
              isFile(path.join(BUILD_DIR, `${rel}.html`)) ||
              isFile(path.join(BUILD_DIR, rel));
        if (!exists) problems.push(`llms.txt: адреси немає в build/ — ${url}`);
      }
    }
  }

  // --- robots.txt (§ 7.2) ---
  const robotsPath = path.join(BUILD_DIR, "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    problems.push("robots.txt: файл відсутній у зібраному сайті");
  } else {
    const groups = parseRobots(fs.readFileSync(robotsPath, "utf8"));
    const star = groups.find((g) => g.agents.includes("*"));
    if (!star) problems.push("robots.txt: немає групи User-agent: *");

    for (const agent of SEARCH_AGENTS) {
      const group = groups.find((g) => g.agents.includes(agent.toLowerCase()));
      if (!group) {
        problems.push(`robots.txt: немає групи для ${agent}`);
        continue;
      }
      if (group.disallow.includes("/")) {
        problems.push(`robots.txt: ${agent} заблокований цілком (Disallow: /)`);
      }
      for (const p of star?.disallow ?? []) {
        if (!group.disallow.includes(p)) {
          problems.push(
            `robots.txt: ${agent} не успадкує "Disallow: ${p}" з * — повторіть рядок у його групі`,
          );
        }
      }
    }
  }

  if (problems.length) {
    console.error(`❌ артефакти AI-пошуку (${problems.length}):`);
    for (const p of problems) console.error(`   ${p}`);
    process.exit(1);
  }

  console.log("🤖 GEO: llms.txt і групи robots.txt узгоджені зі збіркою");
}

main();
