# Система управління контентом (Markdown + i18n)

Ця система дозволяє керувати текстовим контентом сторінок через Markdown файли з підтримкою багатомовності та SEO метаданих.

## Структура папок

- `pages/uk/` — контент українською мовою.
- `pages/en/` — контент англійською мовою.
- `loader.ts` — завантажувач контенту.
- `schema.ts` — Zod-схема для валідації метаданих.
- `types.ts` — TypeScript інтерфейси.

## Як додати сторінку

1. Створіть `.md` файл у папці потрібної мови (наприклад, `pages/uk/new-page.md`).
2. Додайте обов'язковий Frontmatter (YAML блок на початку файлу):

```yaml
---
title: "Заголовок сторінки"
date: "2026-04-04"
author: "Автор"
category: "about"
lang: "uk"
seo:
  title: "SEO Заголовок"
  description: "SEO Опис сторінки"
status: "published"
version: "1.0.0"
toc: true
---
```

3. Використовуйте Markdown для написання тексту.

## Використання в коді

```svelte
<script>
  import { loadPageContent } from '$lib/i18n/loader';
  let content = $state(null);

  $effect(() => {
    loadPageContent('uk', 'slug').then(res => content = res);
  });
</script>

{#if content}
  <article class="prose">
    {@html content.html}
  </article>
{/if}
```

## Валідація
Перед кожним білдом запускається скрипт `npm run validate-content`, який перевіряє всі файли на коректність метаданих.
