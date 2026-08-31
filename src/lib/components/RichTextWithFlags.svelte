<script lang="ts">
	import CountryFlag from '$lib/components/icons/CountryFlag.svelte';
	import { parseContentWithFlags } from '$lib/utils/formatFlags';
	import { safeUrl } from '$lib/utils/safeUrl';

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
</script>

{#each tokens as token, index (index)}
	{#if token.type === 'flag'}
		<CountryFlag code={token.code} title={token.emoji} />
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
		<a class="rich-link" href={safeUrl(token.href)} target={external ? '_blank' : undefined} rel={external ? 'external noopener noreferrer' : undefined} data-testid="{linkTestIdPrefix}-link-{index}">{token.label}</a>
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
</style>
