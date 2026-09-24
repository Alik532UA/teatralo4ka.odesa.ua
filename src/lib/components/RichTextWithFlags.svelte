<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import { parseContentWithFlags } from '$lib/utils/formatFlags';
	import { safeUrl } from '$lib/utils/safeUrl';
	import { withLocale } from '$lib/i18n/routing';

	interface Props {
		text: string;
		/**
		 * Початок `data-testid` для посилань усередині тексту. Кожне посилання
		 * на публічній сторінці мусить мати свій — цього вимагає
		 * `testid-conventions`, і не дарма: без нього перевірка не може
		 * послатися на конкретне з них.
		 */
		linkTestIdPrefix?: string;
	}

	let { text, linkTestIdPrefix = 'rich-text' }: Props = $props();
	const tokens = $derived(parseContentWithFlags(text));

	/**
	 * ВНУТРІШНЄ посилання дописує мовний префікс, зовнішнє лишається як є.
	 *
	 * Анкета випускника одна на дві мови: файл у `static/graduates/profiles/`
	 * не має ні `uk`, ні `en` варіанта. Доти це нічого не важило — посилання в
	 * анкетах були лише зовнішні. Відколи абзац «про себе» веде на СВОЮ
	 * сторінку театру, англійська сторінка вела б на українську: адреса
	 * існує, тож ні `check-links`, ні прогін цього не побачили б.
	 *
	 * `withLocale`, а не `localizedPath`: адреса приходить рядком із даних, і
	 * типізувати її як `Pathname` тут нічим — саме для таких випадків
	 * `withLocale` і лишили нетипізованою (розбір у її докблоці).
	 */
	const lang = $derived($locale === 'en' ? 'en' : 'uk');
	const адреса = (href: string) =>
		/^https?:/i.test(href) || !href.startsWith('/') ? href : withLocale(href, lang);

	function getSocialIcon(network: string): string | null {
		const lower = network.toLowerCase();
		if (lower.includes('facebook') || lower === 'fb')
			return asset('/social_media/facebook-se-512-50.png');
		if (lower.includes('instagram') || lower === 'ig')
			return asset('/social_media/instagram-se-512-50.png');
		if (lower.includes('telegram') || lower === 'tg')
			return asset('/social_media/Telegram-se-320px-50q.png');
		if (lower.includes('youtube') || lower === 'yt')
			return asset('/social_media/YouTube-se-512px-50q.png');
		if (lower.includes('tiktok') || lower === 'tt')
			return asset('/social_media/TikTok-se-512-50.png');
		return null;
	}
</script>

{#each tokens as token, index (index)}
	{#if token.type === 'flag'}
		<CountryFlag code={token.code} title={token.emoji} />
	{:else if token.type === 'social'}
		{@const icon = getSocialIcon(token.network)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="rich-social" href={safeUrl(token.href)} target="_blank" rel="external noopener noreferrer" title={token.network} aria-label={token.network} data-testid="{linkTestIdPrefix}-social-link-{token.network}-{index}">
			{#if icon}
				<img
					src={icon}
					alt={token.network}
					class="rich-social__icon"
					width="28"
					height="28"
					loading="lazy"
					decoding="async"
				/>
			{:else}
				<span class="rich-social__text">{token.network}</span>
			{/if}
		</a>
	{:else if token.type === 'link'}
		<!--
			Зовнішнє посилання відкривається В НОВІЙ ВКЛАДЦІ, внутрішнє — ні:
			перше веде геть із сайту, і людина, яка пішла подивитися сайт театру,
			назад на анкету вже не повернеться.

			Тег в ОДИН рядок, і це не форматування: `no-navigation-without-resolve`
			звітує на рядку атрибута `href`, тож точкове вимкнення діє лише тоді,
			коли той рядок і є початком тега. Розбитий на рядки тег уже коштував
			цьому проєкту кількох недієвих `eslint-disable`.
		-->
		{@const external = /^https?:/i.test(token.href)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="rich-link" href={safeUrl(адреса(token.href))} target={external ? '_blank' : undefined} rel={external ? 'external noopener noreferrer' : undefined} data-testid="{linkTestIdPrefix}-link-{index}">{token.label}</a>
	{:else}
		<span>{token.value}</span>
	{/if}
{/each}

<style>
	/*
	 * Підкреслення пунктиром: посилання стоїть посеред рядка анкети, і суцільна
	 * лінія читалася б як підкреслений шматок тексту, а не як окреме слово,
	 * куди можна натиснути.
	 */
	.rich-link {
		color: inherit;
		text-decoration: underline dotted;
		text-underline-offset: 0.18em;
		text-decoration-color: currentColor;
		transition: color var(--transition-fast);
	}
	.rich-link:hover,
	.rich-link:focus-visible {
		color: var(--galaxy-accent, currentColor);
		text-decoration-style: solid;
	}

	.rich-social {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		vertical-align: middle;
		min-width: 32px;
		min-height: 32px;
		margin: 0 0.15rem;
		padding: 2px;
		text-decoration: none;
		border-radius: var(--radius-sm, 6px);
		transition:
			transform 0.2s ease,
			filter 0.2s ease;
	}
	.rich-social:hover,
	.rich-social:focus-visible {
		transform: scale(1.18);
		filter: drop-shadow(0 0 8px rgb(140 190 255 / 0.6));
	}
	.rich-social__icon {
		display: block;
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
	.rich-social__text {
		color: var(--galaxy-accent, currentColor);
		text-decoration: underline dotted;
	}
</style>
