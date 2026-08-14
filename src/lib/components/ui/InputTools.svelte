<script lang="ts">
	/**
	 * Кнопки поля вводу: вставити, скопіювати, стерти.
	 *
	 * ## Чому окремий компонент, а не три кнопки в кожному полі
	 *
	 * Полів у проєкті десяток. Три кнопки, чотири рівні прозорості, обробка
	 * відмови буфера обміну й повернення фокусу — скопійовані в десять місць,
	 * вони розійдуться на першій же правці, і розійдуться тихо: кнопка, яка
	 * втратила `input?.focus()`, виглядає працюючою.
	 *
	 * ## Чому очищення позначене ластиком
	 *
	 * Хрестик у полі вводу читається двозначно: у тому ж рядку часто стоїть
	 * хрестик закриття вікна. Дві однакові позначки поруч із різними наслідками
	 * — помилка за замовчуванням. Ластик не схожий на закриття й прямо каже, що
	 * саме зникне.
	 *
	 * ## Чому набір кнопок задається ззовні
	 *
	 * «Скопіювати» доречне там, звідки вміст ЗАБИРАЮТЬ: запит пошуку, адреса,
	 * текст статті. У формі входу забирати нічого — там вводять. А для пароля
	 * кнопка копіювання ще й шкідлива: вона кладе пароль у буфер обміну, звідки
	 * його може прочитати будь-яка інша сторінка з відповідним дозволом, і
	 * лежатиме він там, доки щось не перезапише.
	 *
	 * Вставку, навпаки, пароль потребує найбільше: довгі згенеровані паролі
	 * вводять саме вставкою.
	 *
	 * ## Чому кнопки поза порядком табуляції
	 *
	 * `Tab` із поля має вести до НАСТУПНОГО ПОЛЯ, а не до трьох дрібних кнопок
	 * усередині поточного. У формі входу це особливо помітно: пошта → пароль →
	 * «увійти» — звичний шлях, і три зупинки посередині його ламають.
	 *
	 * Клавіатура при цьому нічого не втрачає: кожна кнопка дублює дію, яка вже є
	 * в самому полі — `Ctrl+V`, `Ctrl+C`, виділення й `Delete`. Тобто це
	 * зручність для миші й дотику, а не єдиний шлях до дії.
	 */
	import { ClipboardPaste, Copy, Eraser } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { toast } from '$lib/controllers/toast.svelte';

	type Tool = 'paste' | 'copy' | 'clear';

	interface Props {
		/** Значення поля. Кнопки «вставити» й «стерти» його змінюють. */
		value: string;
		/** Саме поле — щоб повернути в нього фокус після дії. */
		input?: HTMLInputElement | HTMLTextAreaElement | null;
		/** Які кнопки показати. Порядок у розмітці фіксований, не залежить від цього. */
		tools?: Tool[];
		/** Область для локаторів: `{scope}-paste-btn` тощо. */
		scope: string;
		/**
		 * Класти кнопки ПОВЕРХ поля, а не поруч із ним.
		 *
		 * Потрібно там, де рамку малює сам `input`, а не його обгортка: у такому
		 * полі кнопки-сусіди опиняються ЗА рамкою, візуально поза полем. У
		 * рядкових полях (пошук), де рамка на обгортці, накладання не потрібне.
		 */
		overlay?: boolean;
		/**
		 * Назва поля для підпису кнопки. Без неї диктор прочитає «Вставити» на
		 * кожному полі сторінки однаково, і вибрати з них буде неможливо.
		 */
		fieldLabel?: string;
	}

	let {
		value = $bindable(),
		input = null,
		tools = ['paste', 'copy', 'clear'],
		scope,
		fieldLabel,
		overlay = false
	}: Props = $props();

	let pasteBtn = $state<HTMLButtonElement | null>(null);
	let copyBtn = $state<HTMLButtonElement | null>(null);

	/**
	 * Звичайна константа, не стан: підтримка буфера не змінюється за час життя
	 * сторінки. Поза HTTPS `navigator.clipboard` відсутній зовсім, і кнопка
	 * вставки була б мертвою — клік нічого не робив би, а причину видно лише в
	 * консолі. На сервері `navigator` немає, тож під час пререндеру кнопки в
	 * розмітці не буде; вона з'явиться при гідратації.
	 */
	const canPaste = browser && typeof navigator.clipboard?.readText === 'function';

	const label = (action: string) => (fieldLabel ? `${action}: ${fieldLabel}` : action);

	const showPaste = $derived(tools.includes('paste') && canPaste);
	/** Копіювати нічого й стирати нема чого, поки поле порожнє. */
	const showCopy = $derived(tools.includes('copy') && value.length > 0);
	const showClear = $derived(tools.includes('clear') && value.length > 0);

	async function paste() {
		try {
			const text = await navigator.clipboard.readText();
			// Порожній буфер — не помилка й не привід для повідомлення: людина
			// просто нічого не копіювала. Тихо лишаємо поле як є.
			if (text) value = text;
			input?.focus();
		} catch {
			// Найчастіша причина — відмова в дозволі, і це не збій застосунку.
			// Тост біля кнопки: підказка потрібна там, куди щойно клікнули.
			toast.info($t('common.pasteDenied'), 5000, undefined, pasteBtn ?? undefined);
		}
	}

	async function copy() {
		if (!navigator.clipboard?.writeText) return;
		try {
			await navigator.clipboard.writeText(value);
			toast.success($t('common.copied'), 4000, undefined, copyBtn ?? undefined);
		} catch {
			toast.info($t('common.copyDenied'), 5000, undefined, copyBtn ?? undefined);
		}
	}

	function clear() {
		value = '';
		// Фокус повертається в поле: інакше після очищення клавіатурний
		// користувач лишається на кнопці, якої вже немає, і `Tab` починає з нуля.
		input?.focus();
	}
</script>

<!--
	Обгортка потрібна саме як ОБЛАСТЬ наведення: прозорість кнопок підвищується,
	щойно курсор входить сюди, ще до влучання в саму кнопку. Рівні прозорості
	живуть у global.css — див. пояснення там, чому вони на кнопках, а не тут.
-->
<div class="input-tools" class:input-tools--overlay={overlay}>
	{#if showPaste}
		<button
			type="button"
			class="input-tools__btn"
			tabindex="-1"
			bind:this={pasteBtn}
			onclick={paste}
			aria-label={label($t('common.paste'))}
			title={label($t('common.paste'))}
			data-testid="{scope}-paste-btn"
		>
			<ClipboardPaste size={16} aria-hidden="true" />
		</button>
	{/if}

	{#if showCopy}
		<button
			type="button"
			class="input-tools__btn"
			tabindex="-1"
			bind:this={copyBtn}
			onclick={copy}
			aria-label={label($t('common.copy'))}
			title={label($t('common.copy'))}
			data-testid="{scope}-copy-btn"
		>
			<Copy size={16} aria-hidden="true" />
		</button>
	{/if}

	{#if showClear}
		<button
			type="button"
			class="input-tools__btn"
			tabindex="-1"
			onclick={clear}
			aria-label={label($t('common.clear'))}
			title={label($t('common.clear'))}
			data-testid="{scope}-clear-btn"
		>
			<Eraser size={16} aria-hidden="true" />
		</button>
	{/if}
</div>
