export interface PageMetadata {
  title: string;
  date: string;
  lastModified?: string;
  author?: string;
  category: 'about' | 'history' | 'admission' | 'news' | 'contacts' | 'departments' | 'residents' | 'projects' | 'general';
  lang: 'uk' | 'en';
  seo: {
    title: string;
    description: string;
    keywords?: string;
    ogImage?: string;
  };
  status: 'published' | 'draft' | 'archived';
  version: string;
  excerpt?: string;
  coverUrl?: string;
  readingTime?: number;
  toc?: boolean;
}

export interface TableOfContents {
  level: number;
  title: string;
  anchor: string;
}

export interface PageContent {
  metadata: PageMetadata;
  html: string;
  markdown: string;
  slug: string;
  toc?: TableOfContents[];
}
