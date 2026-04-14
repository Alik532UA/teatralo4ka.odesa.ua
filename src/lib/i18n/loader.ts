import matter from 'gray-matter';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { pageMetadataSchema } from './schema';
import type { PageContent, PageMetadata, TableOfContents } from './types';
import { DOMPURIFY_HTML_CONFIG, configureMarkedRenderer } from '$lib/utils/markedConfig';

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

  const { data: rawMetadata, content: markdown } = matter(fileContent);

  // Validate frontmatter through Zod
  const metadata = pageMetadataSchema.parse(rawMetadata) as PageMetadata;

  // Skip non-published pages (draft, archived)
  if (metadata.status !== 'published') {
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
