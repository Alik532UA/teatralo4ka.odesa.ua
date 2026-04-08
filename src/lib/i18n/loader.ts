import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { pageMetadataSchema } from './schema';
import type { PageContent, PageMetadata, TableOfContents } from './types';

/**
 * Loads page content from a Markdown file.
 * This function uses Node.js 'fs' and 'path' APIs, so it MUST only be used
 * in a server-side context (e.g., +page.server.ts).
 */
export function loadPageWithMetadata(lang: string, slug: string): PageContent | null {
  const filePath = path.join(process.cwd(), `src/lib/i18n/pages/${lang}/${slug}.md`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: rawMetadata, content: markdown } = matter(fileContent);

  // Validate frontmatter through Zod
  const metadata = pageMetadataSchema.parse(rawMetadata) as PageMetadata;

  // Parse markdown to HTML and sanitize
  const rawHtml = marked.parse(markdown) as string;
  const html = DOMPurify.sanitize(rawHtml);

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
