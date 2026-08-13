<script lang="ts">
	/**
	 * Показ гарячих новин: бере рішення з `utils/hotNews` і перетворює його на тости.
	 *
	 * Розподіл навмисний. ЩО показати — чиста функція `selectHotNews`, покрита
	 * тестами. КОЛИ і ЯК показати — тут: затримка, черга, позначки «вже бачив».
	 * Без цього поділу правило частоти («один раз» справді один раз) можна було б
	 * перевірити лише очима в браузері, а помилку в ньому видно не одразу — вона
	 * виглядає як «щось у мене сповіщення не вискакує».
	 *
	 * Компонент нічого не малює сам: тост уже вміє таймер, прогрес-бар, паузу на
	 * наведенні й кнопку закриття. Другий такий механізм розійшовся б із першим.
	 */
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { locale } from 'svelte-i18n';
	import { toast, type ToastCard } from '$lib/controllers/toast.svelte';
	import { getCachedHotNewsSettings, getHotNewsSettings } from '$lib/services/settings';
	import { getArticleById, mapArticleToWidgetItem } from '$lib/services/articles';
	import { session, storage } from '$lib/services/storage';
	import {
		DEFAULT_HOT_NEWS,
		seenKey,
		selectHotNews,
		visibleLimit,
		type HotNewsConfig,
		type HotNewsItem
	} from '$lib/utils/hotNews';

	const SEEN_KEY = 'hotNewsSeen';

	/**
	 * Показане за це завантаження сторінки.
	 *
	 * Потрібне навіть для частоти «щоразу»: без нього перехід між сторінками
	 * сайту (клієнтський, без перезавантаження) рахувався б новим заходом, і
	 * сповіщення вискакувало б на кожному кліку в меню.
	 */
	// Множина навмисно НЕ реактивна: це пам'ять, а не стан. `SvelteSet`
	// перезапускав би ефект відбору на кожну позначку «показано» й ганяв би
	// перерахунок черги по колу.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const shownThisLoad = new Set<string>();

	let config = $state<HotNewsConfig>(DEFAULT_HOT_NEWS);
	/** Готові до показу картки — черга, з якої беруть по одній. */
	let pending = $state<{ item: HotNewsItem; card: ToastCard }[]>([]);

	const lang = $derived($locale === 'en' ? 'en' : 'uk');
	const limit = $derived(visibleLimit(config.displayMode));
	const visible = $derived(toast.messages.filter((m) => m.placement === 'hot').length);

	function seenForever(): string[] {
		return storage.getJSON<string[]>(SEEN_KEY) ?? [];
	}

	function seenSession(): string[] {
		return session.getJSON<string[]>(SEEN_KEY) ?? [];
	}

	/**
	 * Позначка «показано» ставиться в момент показу, а не після дочитування.
	 *
	 * Інакше закрита хрестиком новина вважалася б непоказаною й повернулася б на
	 * наступній сторінці — тобто саме тим, хто її не хоче, вона діставалася б
	 * найчастіше.
	 */
	function markSeen(item: HotNewsItem): void {
		const key = seenKey(item);
		shownThisLoad.add(key);
		if (item.frequency === 'once') {
			const all = seenForever();
			if (!all.includes(key)) storage.setJSON(SEEN_KEY, [...all, key]);
		} else if (item.frequency === 'session') {
			const all = seenSession();
			if (!all.includes(key)) session.setJSON(SEEN_KEY, [...all, key]);
		}
	}

	/** Стаття → картка тоста. `null`, якщо статті вже немає або вона знята з публікації. */
	async function toCard(item: HotNewsItem): Promise<ToastCard | null> {
		try {
			const article = await getArticleById(item.id);
			if (!article) return null;
			const mapped = mapArticleToWidgetItem(article, lang, 0);
			if (!mapped.title) return null; // немає перекладу цією мовою
			return {
				title: mapped.title,
				excerpt: mapped.excerpt ?? '',
				date: mapped.date ?? '',
				category: mapped.category ?? '',
				coverUrl: mapped.coverUrl ?? '',
				videoUrl: mapped.videoUrl,
				href: mapped.href ?? resolve('/news/[id]', { id: mapped.slug || mapped.id })
			};
		} catch (e) {
			// Мовчки: сповіщення про новину не варте повідомлення про помилку
			// поверх сторінки, яку відвідувач читає.
			console.warn('[hotNews] не вдалося прочитати новину', item.id, e);
			return null;
		}
	}

	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	/**
	 * Перерахунок черги: на завантаженні й на кожному переході між сторінками.
	 *
	 * Перехід має значення: новина зі scope «крім власної сторінки» мусить
	 * зникнути з черги, щойно відвідувач на цю сторінку перейшов.
	 */
	$effect(() => {
		if (!browser) return;
		const pathname = page.url.pathname;
		const cfg = config;
		const currentLang = lang;
		let cancelled = false;

		(async () => {
			const items = selectHotNews({
				config: cfg,
				pathname,
				seenForever: seenForever(),
				seenSession: seenSession()
			}).filter((i) => !shownThisLoad.has(seenKey(i)));

			if (!items.length) {
				pending = [];
				return;
			}

			// Затримка перед ПЕРШИМ показом: сповіщення, що з'являється разом із
			// вмістом сторінки, конкурує з ним за увагу й псує LCP.
			if (!shownThisLoad.size) await sleep(cfg.delayMs);
			if (cancelled) return;

			const cards = await Promise.all(items.map((item) => toCard(item)));
			if (cancelled || currentLang !== lang) return;

			pending = items
				.map((item, i) => ({ item, card: cards[i] }))
				.filter((x): x is { item: HotNewsItem; card: ToastCard } => x.card !== null);
		})();

		return () => {
			cancelled = true;
		};
	});

	/**
	 * Долив черги: щойно звільнилося місце — показуємо наступні.
	 *
	 * Береться одразу ціла партія, а не по одній. Ефект залежить від `pending`,
	 * який сам і змінює, тож кожен показ поодинці означав би стільки проходів,
	 * скільки новин у черзі, — а в режимі «усі одразу» ще й ризик упертися в
	 * межу глибини оновлень Svelte.
	 */
	$effect(() => {
		if (!browser || !pending.length || visible >= limit) return;
		const free = limit === Number.POSITIVE_INFINITY ? pending.length : limit - visible;
		const batch = pending.slice(0, Math.min(pending.length, free));
		pending = pending.slice(batch.length);
		for (const next of batch) {
			markSeen(next.item);
			toast.push({
				type: 'info',
				message: next.card.title,
				duration: config.durationMs,
				placement: 'hot',
				card: next.card,
				key: seenKey(next.item)
			});
		}
	});

	// Кеш попереднього візиту — щоб не чекати на мережу; потім свіжі налаштування.
	$effect(() => {
		if (!browser) return;
		const cached = getCachedHotNewsSettings();
		if (cached) config = cached;
		getHotNewsSettings().then((fresh) => {
			if (fresh) config = fresh;
		});
	});
</script>
