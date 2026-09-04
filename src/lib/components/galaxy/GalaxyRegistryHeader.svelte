<script lang="ts">
	import type { Snippet } from 'svelte';
	import SearchField from '$lib/components/SearchField.svelte';
	import MasterViewToggle, { type ViewOption } from '$lib/components/adults/MasterViewToggle.svelte';

	/**
	 * Шапка сторінки-переліку: назва, число, перемикач вигляду, пошук.
	 *
	 * ## ЧОМУ ЦЕЙ КОМПОНЕНТ Є
	 *
	 * Автор порівняв шапки п'яти переліків і виписав різницю: «знову не
	 * уніфікований елемент, рядок пошуку… різний розмір на різних сторінках,
	 * різне положення… вибір виду в різних місцях… на різних сторінках різні
	 * відступи між елементами».
	 *
	 * Так і було, і виміряти це легко. Вистави, групи й фестивалі ставили
	 * перемикач у РЯДОК НАЗВИ праворуч, а поле пошуку — окремим рядком нижче,
	 * шириною до 460 px. Заклади й театри ставили пошук і перемикач в ОДИН рядок
	 * під зверненням «Додати», тобто пошук виходив вужчим і стояв нижче за все
	 * інше. Відступ під шапкою був 2 rem у чотирьох сторінок і 1,25 rem у
	 * вистав.
	 *
	 * Причина та сама, що й у першої половини цієї роботи: шапка була написана
	 * п'ять разів. Правило «однакові за призначенням елементи поводяться
	 * однаково» (UI-ELEMENTS-v8 § 1) не тримається переписуванням.
	 *
	 * ## Що взято за канон
	 *
	 * Вигляд трьох старших сторінок — не тому, що їх більше, а тому, що там
	 * перемикач стоїть там, де його шукають (правий край рядка назви, як на
	 * сторінці майстра), а пошук має свій рядок і не стискається до третини
	 * ширини. Значення скопійовані з фестивалів дослівно; єдина зміна — вистави
	 * отримали ті самі 2 rem під шапкою замість 1,25.
	 */
	interface Props {
		title: string;
		titleTestId: string;
		/** Число поруч із назвою: скільки всього в реєстрі. */
		count: number;
		countTestId?: string;
		/** Рядок під назвою — є лише в закладів і театрів. */
		hint?: string;
		hintTestId?: string;

		searchValue: string;
		onSearch: (value: string) => void;
		/** Скільком запис відповідає зараз — поле саме підписує результат. */
		found: number;
		placeholderKey: string;
		nothingKey: string;
		searchTestId: string;

		viewMode: string;
		onView: (mode: string) => void;
		viewOptions: ReadonlyArray<ViewOption>;
		viewTestId: string;

		/**
		 * Рядок області показу («Показано 27 з 87») — є в груп і вистав.
		 *
		 * Сніпетом, а не пропами: у вистав він стоїть УСЕРЕДИНІ першого розділу,
		 * а не під пошуком, і зводити обидва випадки до одного набору полів
		 * означало б завести прапорець «де саме показувати».
		 */
		scope?: Snippet;
	}

	let {
		title,
		titleTestId,
		count,
		countTestId,
		hint,
		hintTestId,
		searchValue,
		onSearch,
		found,
		placeholderKey,
		nothingKey,
		searchTestId,
		viewMode,
		onView,
		viewOptions,
		viewTestId,
		scope
	}: Props = $props();
</script>

<header class="reg-header">
	<h1 class="reg-header__title" data-testid={titleTestId}>{title}</h1>
	<p class="reg-header__count" data-testid={countTestId}>{count}</p>

	<!-- Перемикач до правого краю — там, де його шукають на сторінці майстра. -->
	<div class="reg-header__view">
		<MasterViewToggle {viewMode} onchange={onView} options={viewOptions} testIdPrefix={viewTestId} />
	</div>
</header>

{#if hint}
	<p class="reg-hint" data-testid={hintTestId}>{hint}</p>
{/if}

<div class="reg-search">
	<SearchField
		value={searchValue}
		onchange={onSearch}
		{found}
		{placeholderKey}
		{nothingKey}
		testid={searchTestId}
	/>
</div>

{#if scope}{@render scope()}{/if}

<style>
	.reg-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.reg-header__view {
		margin-left: auto;
	}
	.reg-header__title {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.reg-header__count {
		margin: 0;
		display: grid;
		place-items: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.5rem;
		border-radius: var(--radius-full, 9999px);
		background: var(--bg-surface);
		border: 1px solid var(--border-main);
		color: var(--text-muted);
		font-size: 0.9rem;
		font-weight: 700;
	}

	/*
	 * Рядок під назвою підіймається ВГОРУ, до самої назви: він її пояснює.
	 * Від'ємний відступ, бо шапка вже віддала свої 2 rem нижньому краю — інакше
	 * між назвою та її ж поясненням був би розрив, більший за той, що під ним.
	 */
	.reg-hint {
		margin: -1.5rem 0 1.25rem;
		max-width: 62ch;
		color: var(--text-muted);
		font-size: 0.92rem;
		line-height: 1.5;
	}

	/* 460 px — те саме, що на трьох старших сторінках: поле шириною на весь
	   контейнер читається як форма, а не як пошук у переліку. */
	.reg-search {
		margin-bottom: 2rem;
		max-width: 460px;
	}
</style>
