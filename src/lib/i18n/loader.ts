import type { PageContent } from './types';

// Імпортуємо всі MD файли як готові об'єкти (завдяки нашому Vite плагіну)
const mdFiles = import.meta.glob('./pages/**/*.md', { eager: true });

export async function loadPageContent(lang: string, slug: string): Promise<PageContent | null> {
  const filePath = `./pages/${lang}/${slug}.md`;
  const module = mdFiles[filePath] as any;

  if (!module || !module.default) {
    console.error(`Page not found: ${filePath}`);
    return null;
  }

  const content = module.default;

  // Розраховуємо час читання в рантаймі (це швидко і не потребує бібліотек)
  const readingTime = Math.ceil(content.markdown.split(/\s+/).length / 200);

  return {
    ...content,
    metadata: {
      ...content.metadata,
      readingTime
    },
    slug
  };
}
