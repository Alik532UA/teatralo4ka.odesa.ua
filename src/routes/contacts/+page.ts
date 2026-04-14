import { loadPageWithMetadata } from '$lib/i18n/loader';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
  const uk = loadPageWithMetadata('uk', 'contacts');
  const en = loadPageWithMetadata('en', 'contacts');

  return {
    uk,
    en
  };
};
