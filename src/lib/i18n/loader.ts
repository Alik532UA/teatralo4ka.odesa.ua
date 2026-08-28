import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { pageMetadataSchema } from './schema';
import type { PageContent, PageMetadata, TableOfContents } from './types';
import { DOMPURIFY_HTML_CONFIG, configureMarkedRenderer } from '$lib/utils/markedConfig';
import { plainTextFromMarkdown } from '$lib/utils/siteSearch';

// Initialize shared marked renderer for server-side usage
configureMarkedRenderer();

// Pre-import all markdown files using Vite's glob import
// This allows the loader to work both on server (prerendering) and in the browser
const pagesUk = import.meta.glob('/src/lib/i18n/pages/uk/*.md', { eager: true, query: '?raw', import: 'default' });
const pagesEn = import.meta.glob('/src/lib/i18n/pages/en/*.md', { eager: true, query: '?raw', import: 'default' });

/**
 * Map of pre-loaded page content by language and slug.
 */
const PAGES: Record<string, Record<string, string>> = {
  uk: Object.entries(pagesUk).reduce((acc, [path, content]) => {
    const slug = path.split('/').pop()?.replace('.md', '') || '';
    acc[slug] = content as string;
    return acc;
  }, {} as Record<string, string>),
  en: Object.entries(pagesEn).reduce((acc, [path, content]) => {
    const slug = path.split('/').pop()?.replace('.md', '') || '';
    acc[slug] = content as string;
    return acc;
  }, {} as Record<string, string>)
};

type FrontmatterScalar = string | number | boolean;
type FrontmatterValue = FrontmatterScalar | Record<string, FrontmatterScalar>;

/**
 * Simple browser-compatible frontmatter parser to avoid Node.js 'Buffer' dependency.
 * Supports nested objects like 'seo' by looking at indentation.
 */
function parseFrontmatter(fileContent: string) {
  const regex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = fileContent.match(regex);
  if (!match) return { data: {}, content: fileContent };

  const yamlBlock = match[1];
  const content = fileContent.slice(match[0].length).trim();
  const data: Record<string, FrontmatterValue> = {};
  
  let currentKey: string | null = null;

  yamlBlock.split('\n').forEach(line => {
    if (!line.trim() || line.trim().startsWith('#')) return;

    const indent = line.search(/\S/);
    const parts = line.trim().split(':');
    const key = parts[0].trim();
    const value = parts.slice(1).join(':').trim();

    // Basic type conversion
    const processValue = (v: string): FrontmatterScalar => {
      v = v.replace(/^['"](.*)['"]$/, '$1');
      if (v === 'true') return true;
      if (v === 'false') return false;
      if (!isNaN(Number(v)) && v !== '') return Number(v);
      return v;
    };

    if (indent === 0) {
      if (value === '') {
        data[key] = {};
        currentKey = key;
      } else {
        data[key] = processValue(value);
        currentKey = null;
      }
    } else if (indent > 0 && currentKey) {
      const target = data[currentKey];
      if (target && typeof target === 'object') {
        target[key] = processValue(value);
      }
    }
  });

  return { data, content };
}

/**
 * Назва й звичайний текст сторінки — для пошуку по сайту.
 *
 * Свідомо НЕ використовує `loadPageWithMetadata`: той рендерить markdown у HTML
 * і проганяє через DOMPurify, а для зіставлення рядків це і зайве, і дороге —
 * сімнадцять сторінок двома мовами за кожне відкриття пошуку. Тут лише
 * frontmatter і зняття розмітки.
 *
 * Повертає `null`, якщо файлу немає або сторінка в архіві: архівну сторінку
 * показувати не можна, отже й знаходити не треба.
 */
export function loadPageForSearch(
  lang: string,
  slug: string
): { title: string; text: string } | null {
  const fileContent = PAGES[lang]?.[slug];
  if (!fileContent) return null;

  const { data, content } = parseFrontmatter(fileContent);
  if (data.status === 'archived') return null;

  const title = typeof data.title === 'string' && data.title.trim() ? data.title : slug;
  return { title, text: plainTextFromMarkdown(content) };
}

/** Слуги, які справді є на диску — для перевірки повноти переліку пошуку. */
export function listPageSlugs(lang: string): string[] {
  return Object.keys(PAGES[lang] ?? {});
}

/**
 * Loads page content from pre-loaded memory (Vite glob).
 * This function works both on server and client.
 */
export function loadPageWithMetadata(lang: string, slug: string): PageContent | null {
  const fileContent = PAGES[lang]?.[slug];

  if (!fileContent) {
    console.warn(`Content not found for lang: ${lang}, slug: ${slug}`);
    return null;
  }

  const { data: rawMetadata, content: markdown } = parseFrontmatter(fileContent);

  // Validate frontmatter through Zod
  const metadata = pageMetadataSchema.parse(rawMetadata) as PageMetadata;

  // Skip archived pages
  if (metadata.status === 'archived') {
    return null;
  }

  // Parse markdown to HTML and sanitize
  const rawHtml = marked.parse(markdown) as string;
  const html = DOMPurify.sanitize(rawHtml, DOMPURIFY_HTML_CONFIG);

  // Extract Table of Contents if enabled
  const toc = metadata.toc ? extractTableOfContents(markdown) : undefined;

  // Calculate reading time (~200 words per minute)
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  metadata.readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    metadata,
    html,
    markdown,
    slug,
    toc
  };
}

function extractTableOfContents(markdown: string): TableOfContents[] {
  const headingRegex = /^(#{2,6})\s+(.+)$/gm;
  const toc: TableOfContents[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2];
    const anchor = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0400-\u04ff-]/g, ''); // supports cyrillic

    toc.push({ level, title, anchor });
  }

  return toc;
}
