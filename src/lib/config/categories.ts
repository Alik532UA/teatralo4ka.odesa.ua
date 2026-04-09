export const ARTICLE_CATEGORIES = {
  news: { uk: "Новина", en: "News" },
  announcement: { uk: "Оголошення", en: "Announcement" },
  article: { uk: "Стаття", en: "Article" },
  competition: { uk: "Конкурс", en: "Competition" },
  festival: { uk: "Фестиваль", en: "Festival" },
  concert: { uk: "Концерт", en: "Concert" },
  performance: { uk: "Вистава", en: "Performance" },
  charity: { uk: "Благодійність", en: "Charity" },
  celebration: { uk: "Святкування", en: "Celebration" },
  event: { uk: "Захід", en: "Event" },
  attention: { uk: "Увага", en: "Attention" },
  memory: { uk: "Пам'ять", en: "Memorial" },
  masterclass: { uk: "Майстер-клас", en: "Masterclass" },
  exhibition: { uk: "Виставка", en: "Exhibition" },
  contest: { uk: "Змагання", en: "Contest" },
  enrollment: { uk: "Набір у групи", en: "Enrollment" },
  fundraiser: { uk: "Збір коштів", en: "Fundraiser" },
  volunteering: { uk: "Волонтерство", en: "Volunteering" },
  achievement: { uk: "Досягнення", en: "Achievement" },
  report: { uk: "Звіт", en: "Report" },
  interview: { uk: "Інтерв'ю", en: "Interview" },
  success_story: { uk: "Історія успіху", en: "Success Story" },
  tips: { uk: "Корисні поради", en: "Tips" },
  training: { uk: "Тренінг", en: "Training" },
  seminar: { uk: "Семінар", en: "Seminar" },
  grants: { uk: "Гранти", en: "Grants" },
  excursion: { uk: "Екскурсія", en: "Excursion" },
  olympiad: { uk: "Олімпіада", en: "Olympiad" },
  poster: { uk: "Афіша", en: "Poster" },
  flashmob: { uk: "Флешмоб", en: "Flashmob" },
  partnership: { uk: "Партнерство", en: "Partnership" }
} as const;

export type ArticleCategory = keyof typeof ARTICLE_CATEGORIES;

/**
 * Resolve the display label of a category for the given locale.
 * Standard categories are looked up in ARTICLE_CATEGORIES.
 * Custom bilingual categories are stored as "ukText||enText".
 */
export function getCategoryLabel(category: string | undefined, locale: 'uk' | 'en' = 'uk'): string {
  if (!category) return '';
  if (category in ARTICLE_CATEGORIES) {
    return ARTICLE_CATEGORIES[category as ArticleCategory][locale];
  }
  if (category.includes('||')) {
    const [uk, en] = category.split('||');
    return locale === 'en' ? (en || uk || category) : (uk || category);
  }
  return category;
}
