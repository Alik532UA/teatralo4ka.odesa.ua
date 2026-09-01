<script lang="ts">
	import { t } from 'svelte-i18n';
	import { fly } from 'svelte/transition';
	import { Pencil, Plus } from 'lucide-svelte';
	import { asset } from '$app/paths';

	/**
	 * Кнопка-олівець «внести правки» з контактами адміністратора.
	 *
	 * Окремим компонентом, бо той самий блок потрібен уже на чотирьох сторінках:
	 * викладача, випускника, навчальної групи й фестивалю. Дві копії він прожив
	 * — і копії встигли розійтися: у картці випускника меню відкривалося ЗА
	 * ЕКРАН на телефоні (заміряно: 389 px завширшки, початок на 259 при екрані
	 * 375), а на сторінці викладача ні, бо там воно прив'язане до іншого краю.
	 * Полагодити в одній копії й не помітити другої — рівно те, що вже сталося
	 * з магічною стелею `840px`.
	 *
	 * Копій було ТРИ, і всі зведено сюди: сторінки групи, фестивалю, викладача
	 * (там їх було дві — біля портрета й у куті картки) і випускника. Різну
	 * геометрію дає `openTo`, різні `data-testid` — `testIdPrefix` разом із
	 * окремим `buttonTestId`: у викладача кнопка зветься `master-profile-edit-btn`,
	 * а її меню — `master-profile-card-contact-menu`, тобто префікси в них
	 * розійшлися ще до злиття, і перевірки адресують саме ці імена.
	 *
	 * Адресу для листування зашито тут, а не в даних, свідомо: адміністратор
	 * сайту один, і винесення його контактів у реєстр створило б порожню
	 * абстракцію з одним записом.
	 */
	interface Props {
		/**
		 * Початок `data-testid` для МЕНЮ та його вмісту: `<prefix>-menu`,
		 * `<prefix>-hint`, `<prefix>-admin-img`, `<prefix>-link-<мережа>`.
		 */
		testIdPrefix: string;
		/**
		 * `data-testid` самої кнопки — окремо від меню.
		 *
		 * Не примха: на сторінці викладача кнопка зветься
		 * `master-profile-edit-btn`, а меню — `master-profile-card-contact-menu`.
		 * Спільного початку в них немає, і перевірки шукають саме ці імена.
		 */
		buttonTestId?: string;
		/**
		 * Чи є на сторінці фотографія. Від цього залежить сам текст прохання:
		 * там, де фото немає, його заразом і просять.
		 */
		hasPhoto?: boolean;
		/**
		 * Куди розкривати меню.
		 *
		 * `up` — кнопка в нижньому куті картки; `down` — у шапці сторінки, бо
		 * там угорі екрана вже немає; `side` — прямокутним вікном ліворуч від
		 * кнопки, коли та кругла й стоїть у рядку (блокові олівці всередині
		 * картки випускника); `card` — смужкою ліворуч, точно як у картці
		 * випускника в галактиці.
		 *
		 * `side` і `card` різняться не лише виглядом: смужка `card` не
		 * складається, тож потребує місця вздовж себе. Усередині вузького
		 * блока вона обрізалася б — там `side`.
		 */
		openTo?: 'up' | 'down' | 'side' | 'card';
		/**
		 * `button` — олівець, що розкриває меню; `inline` — те саме меню
		 * розгорнутим, без кнопки.
		 *
		 * Другий режим існує для місць, де ховати нічого: у плитці «додати
		 * групу» вже стоїть прохання написати, і олівець поруч із ним питав
		 * удруге те саме, до того ж ховаючи відповідь за ще одним натисканням.
		 */
		mode?: 'button' | 'inline';
		/**
		 * Який знак на кнопці. `plus` стоїть там, де просять ДОДАТИ те, чого
		 * немає (портрет викладача без фотографії), `pencil` — де правлять уже
		 * наявне. Різниця не косметична: перше читається як запрошення, друге —
		 * як виправлення помилки.
		 */
		icon?: 'pencil' | 'plus';
		/** Свій підпис кнопки, коли типове «внести правки» тут не про те. */
		label?: string;
		/**
		 * Відкривати меню вже на НАВЕДЕННІ, не чекаючи натискання.
		 *
		 * Так поводилася копія в тулбарі картки випускника, і не дарма: там
		 * кнопка одна з двох у куті, і людина наводить на неї, щоб зрозуміти, що
		 * це. Решті місць це зайве — меню вискакувало б від випадкового руху
		 * повз аватар.
		 */
		openOnHover?: boolean;
		/**
		 * Вигляд кнопки. `accent` — суцільне коло кольору акценту (плитка
		 * «додати групу», кут картки викладача); `ghost` — темне прозоре коло зі
		 * світлою рамкою, як сусідній «закрити» в тулбарі картки випускника.
		 *
		 * Другий існує саме заради тієї сусідки: дві кнопки поруч у тому самому
		 * куті мусять виглядати парою, і після переїзду в спільний компонент
		 * одна з них стала яскраво-синьою, а друга лишилася темною.
		 */
		variant?: 'accent' | 'ghost';
	}

	let {
		testIdPrefix,
		buttonTestId,
		hasPhoto = true,
		openTo = 'up',
		mode = 'button',
		icon = 'pencil',
		label: ownLabel,
		openOnHover = false,
		variant = 'accent'
	}: Props = $props();

	const contacts = [
		{ name: 'Telegram', url: 'https://t.me/alik532', icon: 'telegram.svg' },
		{ name: 'Viber', url: 'viber://chat?number=%2B380937251208', icon: 'viber.svg' },
		{ name: 'WhatsApp', url: 'https://wa.me/380937251208', icon: 'whatsapp.svg' },
		{ name: 'LinkedIn', url: 'https://linkedin.com/in/alik-qa-engineer', icon: 'linkedin.svg' }
	];

	let open = $state(false);
	let closeTimeout: ReturnType<typeof setTimeout> | null = null;

	function toggle(event: MouseEvent) {
		event.stopPropagation();
		open = !open;
	}

	/*
	 * Затримка на виході, а не миттєве закриття: між кнопкою й меню є проміжок,
	 * і без неї меню зникало рівно тоді, коли курсор ішов до нього.
	 */
	function handleMouseEnter() {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
		if (openOnHover) open = true;
	}

	function handleMouseLeave() {
		closeTimeout = setTimeout(() => {
			open = false;
		}, 300);
	}

	let wrapEl = $state<HTMLElement | null>(null);

	/*
	 * Клік ПОВЗ меню закриває його.
	 *
	 * Наведення тут головне, але на дотику `mouseleave` не настає ніколи, і без
	 * цього меню лишалося б відкритим, доки не натиснуть саму кнопку ще раз.
	 * Так поводилися обидві копії до злиття.
	 */
	/** Escape закриває меню, не чіпаючи того, що під ним. */
	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !open) return;
		event.stopPropagation();
		open = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!open || !wrapEl) return;
		if (wrapEl.contains(event.target as Node)) return;
		open = false;
	}

	const label = $derived(
		ownLabel ??
			$t('common.contact', { default: "Внести правки або зв'язатися з адміністратором" })
	);
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div
	class="edit-wrap"
	bind:this={wrapEl}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group"
	aria-label={label}
>
	{#if mode === 'button'}
		<button
			type="button"
			class="edit-btn"
			class:edit-btn--ghost={variant === 'ghost'}
			onclick={toggle}
			aria-expanded={open}
			aria-label={label}
			title={label}
			data-testid={buttonTestId ?? `${testIdPrefix}-edit-btn`}
		>
			{#if icon === 'plus'}
				<Plus size={18} aria-hidden="true" />
			{:else}
				<Pencil size={17} aria-hidden="true" />
			{/if}
		</button>
	{/if}

	{#if open || mode === 'inline'}
		<div
			class="edit-popup"
			class:edit-popup--down={openTo === 'down'}
			class:edit-popup--side={openTo === 'side'}
			class:edit-popup--card={openTo === 'card'}
			class:edit-popup--inline={mode === 'inline'}
			transition:fly={{ y: -8, duration: mode === 'inline' ? 0 : 180 }}
			data-testid="{testIdPrefix}-menu"
		>
			<img
				src={asset('/graduates/alik-zapolnov-96.webp')}
				alt="Алік Запольнов"
				width="32"
				height="32"
				class="edit-popup__avatar"
				loading="lazy"
				data-testid="{testIdPrefix}-contact-admin-img"
			/>
			<p class="edit-popup__hint" data-testid="{testIdPrefix}-hint">
				{#if hasPhoto}
					Привіт!)<br />
					Щоб внести правки<br />
					— напиши мені
				{:else}
					Привіт!)<br />
					Щоб надати фото чи внести<br />
					правки&nbsp;— напиши мені
				{/if}
			</p>
			<div class="edit-popup__icons">
				{#each contacts as contact (contact.name)}
					<a
						href={contact.url}
						target="_blank"
						rel="external noopener noreferrer"
						class="edit-popup__link"
						aria-label={contact.name}
						title={contact.name}
						onclick={(event) => event.stopPropagation()}
						data-testid="{testIdPrefix}-link-{contact.name.toLowerCase()}"
					>
						<img
							src={asset(`/social_media/${contact.icon}`)}
							alt={contact.name}
							width="28"
							height="28"
							loading="lazy"
						/>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.edit-wrap {
		position: relative;
	}
	.edit-btn {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--accent-primary);
		border: 2px solid var(--bg-card);
		color: var(--text-on-accent);
		cursor: pointer;
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.2);
		transition:
			transform var(--transition-fast),
			filter var(--transition-fast);
	}
	.edit-btn:hover,
	.edit-btn:focus-visible {
		transform: scale(1.06);
		filter: brightness(1.06);
	}
	/* Та сама пара чисел і кольорів, що в сусідньої кнопки «закрити». */
	.edit-btn--ghost {
		width: 44px;
		height: 44px;
		background: rgb(3 6 20 / 0.75);
		border: 1px solid rgb(140 190 255 / 0.35);
		color: #cfe4ff;
		box-shadow: none;
		backdrop-filter: blur(8px);
	}
	.edit-btn--ghost:hover,
	.edit-btn--ghost:focus-visible {
		transform: none;
		filter: none;
		background: rgb(140 190 255 / 0.25);
		border-color: rgb(140 190 255 / 0.7);
		color: #fff;
	}
	/*
	 * Меню розкривається ВГОРУ й до правого краю кнопки: кнопка стоїть у
	 * нижньому правому куті картки, тож інші напрямки виводять його за екран.
	 * Ширина обмежена вікном, а не батьком, бо батько тут — сама кнопка.
	 */
	.edit-popup {
		position: absolute;
		bottom: calc(100% + 12px);
		right: 0;
		left: auto;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		max-width: calc(100vw - 2rem);
		flex-wrap: wrap;
		justify-content: flex-end;
		padding: 0.45rem 0.7rem;
		border-radius: 1.1rem;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
	}
	.edit-popup--down {
		bottom: auto;
		top: calc(100% + 12px);
	}
	.edit-popup--side {
		bottom: auto;
		top: 50%;
		right: calc(100% + 0.65rem);
		translate: 0 -50%;
	}

	/*
	 * `card` — та сама СМУЖКА, що в картці випускника.
	 *
	 * Окремим варіантом, а не правкою `side`, і це не смак. `side` стоїть у
	 * блокових олівцях («Вистави», «Про себе»), а їхні блоки вужчі за смужку й
	 * обрізають її: заміряно — 389 пікселів смужки проти блока, і половина
	 * підпису зникала. Прямокутне вікно, що складається, там доречне саме тим,
	 * що вміщається.
	 *
	 * `nowrap` тут не косметика, а те, ЧИМ смужка тримається. Заміряно: зі
	 * спадковим `flex-wrap: wrap` меню склалося в блок 168×145 замість смужки.
	 * Причина — не екран, а прив'язка: абсолютний блок із заданим `right`
	 * стискається до мінімальної ширини свого контейнера, а контейнер тут —
	 * кругла кнопка 36 пікселів. `nowrap` робить мінімальною шириною увесь
	 * рядок, і меню виходить за кнопку, як і має. Карткова версія
	 * (`GraduateCardContactMenu`) тримається рівно на цьому.
	 */
	.edit-popup--card {
		bottom: auto;
		top: 50%;
		right: calc(100% + 0.65rem);
		translate: 0 -50%;
		gap: 0.65rem;
		padding: 0.35rem 0.65rem;
		background: rgb(3 6 20 / 0.88);
		border-color: rgb(140 190 255 / 0.28);
		border-radius: 999px;
		box-shadow: 0 8px 28px rgb(0 0 0 / 0.55);
		backdrop-filter: blur(14px);
		flex-wrap: nowrap;
		white-space: nowrap;
	}

	/*
	 * Вміст смужки — теж як у картці: аватар 28, підпис у три щільні рядки
	 * блакитним, іконки 38.
	 *
	 * Ці значення існують з однієї причини: те саме віконце «напиши мені»
	 * малюють ДВА компоненти — цей і `GraduateCardContactMenu`. Доки їх два,
	 * значення доводиться зводити руками, і саме через це на сторінці
	 * випускника підпис був білий і розріджений, а в його ж картці — блакитний
	 * і щільний. Правильне рішення — один компонент на обидва місця; воно
	 * більше за цю правку, бо тягне за собою `data-testid` восьми місць
	 * виклику.
	 */
	.edit-popup--card .edit-popup__avatar {
		width: 28px;
		height: 28px;
	}
	.edit-popup--card .edit-popup__hint {
		font-size: 0.84rem;
		line-height: 1;
		color: rgb(180 210 255 / 0.85);
	}
	.edit-popup--card .edit-popup__link {
		width: 38px;
		height: 38px;
	}

	/*
	 * На вузькому екрані смужка НЕ вміщається — і тоді меню падає вниз.
	 *
	 * Заміряно на 375 пікселях: смужка має 343 пікселі й виїжджає за лівий край
	 * на 99. Це та сама вада, від якої в тулбарі випускника колись і поставили
	 * `down`. Смужці потрібно 343 плюс сама кнопка (36) плюс проміжок (10) плюс
	 * поле сторінки — близько 405 пікселів вікна, тому межа 560: на планшеті
	 * (768) смужка стоїть, на телефоні — ні.
	 *
	 * Звузити смужку нічим: 152 пікселі з неї — це чотири іконки месенджерів,
	 * решта — підпис у три рядки й аватар.
	 */
	@media (max-width: 560px) {
		.edit-popup--card {
			top: calc(100% + 12px);
			right: 0;
			bottom: auto;
			translate: none;
			flex-wrap: wrap;
			white-space: normal;
			border-radius: 1.1rem;
			padding: 0.45rem 0.7rem;
		}
		.edit-popup--card .edit-popup__hint {
			line-height: 1.3;
		}
	}
	/*
	 * Убік від кнопки, а не над нею: там, де кнопка кругла й стоїть у рядку
	 * (портрет викладача, тулбар випускника), угору відкриватися нікуди —
	 * над нею вже край картки.
	 */
	/*
	 * Розгорнутий режим: меню перестає бути накладкою й стає звичайним рядком.
	 * Тло й рамку теж знято — воно стоїть усередині плитки, у якої вони вже є,
	 * і друга рамка читалася б як вкладена картка.
	 */
	.edit-popup--inline {
		position: static;
		max-width: none;
		padding: 0;
		border: none;
		background: none;
		box-shadow: none;
		justify-content: flex-start;
	}
	.edit-popup__avatar {
		border-radius: 50%;
		flex-shrink: 0;
	}
	.edit-popup__hint {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.3;
		color: var(--text-main);
		white-space: nowrap;
	}
	.edit-popup__icons {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.edit-popup__link {
		display: grid;
		place-items: center;
		border-radius: 50%;
		transition: transform var(--transition-fast);
	}
	.edit-popup__link:hover,
	.edit-popup__link:focus-visible {
		transform: scale(1.1);
	}
</style>
