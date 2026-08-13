<script lang="ts">
	import { toast, type ToastMessage } from '$lib/controllers/toast.svelte';
	import { CheckCircle2, AlertCircle, Info, X, Play, ExternalLink } from 'lucide-svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';
	import { fly, fade } from 'svelte/transition';
	import { MediaQuery } from 'svelte/reactivity';
	import { t } from 'svelte-i18n';

	/**
	 * Два розміщення (NOTIFICATIONS-v8 § 5): глобальний стек у кутку для подій,
	 * не пов'язаних із конкретною кнопкою, і анкорний тост біля тригера.
	 *
	 * Потреба конкретна: підтвердження «адресу скопійовано» в кутку екрана
	 * відірване від місця, куди відвідувач щойно клікнув, — на довгій сторінці
	 * воно взагалі поза полем зору.
	 *
	 * На вузьких екранах анкор ігнорується: там кут передбачуваніший, а місця
	 * поруч із посиланням однаково немає.
	 */
	const isNarrow = new MediaQuery('(max-width: 600px)');

	/**
	 * Адреса новини з проханням одразу відкрити плеєр.
	 *
	 * Відео грає на сторінці новини, а не в самому сповіщенні. Сповіщення — це
	 * кутик екрана: щоб умістити плеєр, воно мусило б рознести себе мало не на
	 * пів сторінки, тобто перетворитися на те, від чого тост і відрізняється.
	 * На сторінці новини для відео вже є місце й кнопка, тому натиск веде туди.
	 */
	function videoHref(href: string): string {
		return href.includes('?') ? `${href}&video=1` : `${href}?video=1`;
	}

	/**
	 * Наскільки підвал заліз у вікно знизу.
	 *
	 * Тост із `position: fixed` не знає про потік сторінки, тому в самому низу
	 * лягав просто поверх підвала — поверх телефонів, пошти й кнопок соцмереж.
	 * Тут рахується, на скільки підвал уже видно, і тост стає рівно над ним.
	 *
	 * Слухач на `scroll`, а не IntersectionObserver: потрібне не «видно/не
	 * видно», а точна величина перекриття, і вона змінюється щокадру прокрутки.
	 */
	let footerLift = $state(0);

	$effect(() => {
		const update = () => {
			const footer = document.getElementById('main-footer');
			if (!footer) {
				footerLift = 0;
				return;
			}
			const top = footer.getBoundingClientRect().top;
			footerLift = Math.max(0, window.innerHeight - top);
		};
		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	});

	/** Кут гарячих новин задає адміністратор; усі вони приходять з тим самим. */
	const hotCorner = $derived(
		toast.messages.find((m) => m.placement === 'hot')?.corner ?? 'bottomRight'
	);

	/**
	 * Власний контейнер гарячим новинам потрібен НЕ завжди.
	 *
	 * Глобальний стек тостів стоїть у правому нижньому куті. Якщо адміністратор
	 * обрав той самий кут, другий контейнер із `position: fixed` не став би поруч
	 * — він накрив би перший, і відповідь «адресу скопійовано» на щойно зроблений
	 * клік зникла б під сповіщенням про новину. Тому в спільному куті вони йдуть
	 * одним стеком.
	 *
	 * Те саме на телефоні за будь-якого налаштування: там кожен кут — це та сама
	 * смуга внизу на всю ширину.
	 */
	const hotSeparate = $derived(!isNarrow.current && hotCorner !== 'bottomRight');
	const hotMsgs = $derived(
		hotSeparate ? toast.messages.filter((m) => m.placement === 'hot') : []
	);
	const cornerMsgs = $derived(
		hotSeparate ? toast.messages.filter((m) => m.placement !== 'hot') : toast.messages
	);

	const globalMsgs = $derived(cornerMsgs.filter((m) => !m.anchor || isNarrow.current));
	const anchoredMsgs = $derived(cornerMsgs.filter((m) => m.anchor && !isNarrow.current));

	/**
	 * Ставить тост біля свого посилання.
	 *
	 * Переворот за половиною вьюпорта: тригер у нижній половині — тост зверху,
	 * у верхній — знизу. Далі кламп за ВИМІРЯНИМ розміром тоста, інакше він
	 * вилазить за край, і сенс анкорності зникає.
	 */
	function positionAnchored(node: HTMLElement, anchor: HTMLElement) {
		const place = () => {
			const a = anchor.getBoundingClientRect();
			const w = node.getBoundingClientRect();
			const gap = 10;
			const margin = 8;

			const above = a.top + a.height / 2 > window.innerHeight / 2;
			let top = above ? a.top - gap - w.height : a.bottom + gap;
			top = Math.max(margin, Math.min(top, window.innerHeight - w.height - margin));

			let left = a.left + a.width / 2 - w.width / 2;
			left = Math.max(margin, Math.min(left, window.innerWidth - w.width - margin));

			node.style.top = `${Math.round(top)}px`;
			node.style.left = `${Math.round(left)}px`;
		};
		place();
		return { update: place };
	}

	/**
	 * Позиція рахується один раз, тож при прокрутці тост «відклеївся» б від
	 * посилання. Замість того, щоб їздити за ним, він просто закривається.
	 * Поріг у кілька пікселів — щоб випадковий субпіксельний зсув не гасив
	 * тост одразу після появи.
	 */
	$effect(() => {
		if (anchoredMsgs.length === 0) return;
		const startX = window.scrollX;
		const startY = window.scrollY;
		const closeAnchored = () => {
			for (const m of toast.messages) if (m.anchor) toast.remove(m.id);
		};
		const onScroll = () => {
			if (Math.abs(window.scrollX - startX) < 6 && Math.abs(window.scrollY - startY) < 6) return;
			closeAnchored();
		};
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
		window.addEventListener('resize', closeAnchored);
		return () => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', closeAnchored);
		};
	});
</script>

{#snippet toastCard(msg: ToastMessage)}
	<div
		class="toast-msg toast-{msg.type}"
		in:fly={{ y: 20, duration: 300 }}
		out:fade={{ duration: 200 }}
		role="alert"
		data-testid={`toast-message-${msg.type}`}
		onmouseenter={() => toast.pauseTimer(msg.id)}
		onmouseleave={() => toast.resumeTimer(msg.id)}
		onfocusin={() => toast.pauseTimer(msg.id)}
		onfocusout={() => toast.resumeTimer(msg.id)}
	>
		<!-- Значок типу — лише для текстових тостів. У картки новини свій зміст:
		     обкладинка, рубрика й заголовок уже кажуть, що це. Кружечок «i» поруч
		     із ними нічого не додає, а місце з'їдає. -->
		{#if !msg.card}
			<div class="toast-icon" data-testid={`toast-icon-${msg.type}`}>
				{#if msg.type === 'success'}
					<CheckCircle2 size={20} />
				{:else if msg.type === 'error'}
					<AlertCircle size={20} />
				{:else}
					<Info size={20} />
				{/if}
			</div>
		{/if}
		<div class="toast-content" data-testid="toast-panel">
			{#if msg.card}
				{@const video = parseVideoUrl(msg.card.videoUrl)}
				<!--
					Гаряча новина: та сама картка, що в списку новин, лише в тості.

					Корінь — блок, а не посилання: усередині є кнопка відео, а кнопка в
					посиланні — недійсна розмітка й пастка для клавіатури (axe:
					nested-interactive). Клікабельність усієї картки дає заголовок-
					посилання, розтягнуте через ::after, — той самий прийом, що в
					ContentCard.
				-->
				<div class="toast-card">
					<div class="toast-card__media">
						{#if msg.card.coverUrl}
							<img src={msg.card.coverUrl} alt="" class="toast-card__img" loading="lazy" decoding="async" />
						{/if}

						{#if video?.embeddable}
							<!-- Веде на сторінку новини з проханням одразу ввімкнути плеєр. -->
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={videoHref(msg.card.href)}
								class="toast-card__video-btn"
								onclick={() => toast.remove(msg.id)}
								data-testid="toast-card-video-link"
							>
								<Play size={13} aria-hidden="true" />
								<span>{$t('common.hasVideo')}</span>
							</a>
						{:else if video}
							<!-- Instagram і Facebook вбудовувати не дають — лише перехід. -->
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={video.url}
								target="_blank"
								rel="noopener noreferrer"
								class="toast-card__video-btn"
								aria-label={$t('common.watchVideo')}
								data-testid="toast-card-video-external-link"
							>
								<ExternalLink size={13} aria-hidden="true" />
								<span>{$t('common.hasVideo')}</span>
							</a>
						{/if}
					</div>

					<div class="toast-card__body">
						<span class="toast-card__meta">
							{#if msg.card.category}<span class="toast-card__tag">{msg.card.category}</span>{/if}
							{#if msg.card.date}<span class="toast-card__date">{msg.card.date}</span>{/if}
						</span>
						<!-- Адреса вже пройшла resolve() у HotNews.svelte або прийшла з
						     externalUrl статті, перевіреного isSafeUrl. -->
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a
							href={msg.card.href}
							class="toast-card__title toast-card__link"
							onclick={() => toast.remove(msg.id)}
							data-testid="toast-card-link"
						>
							<span data-testid="toast-card-title">{msg.card.title}</span>
						</a>
						{#if msg.card.excerpt}
							<span class="toast-card__excerpt">{msg.card.excerpt}</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="toast-message" data-testid="toast-text-label">{msg.message}</div>
			{/if}
			{#if msg.action}
				<button 
					class="toast-action" 
					onclick={() => {
						msg.action?.onAction();
						toast.remove(msg.id);
					}}
					data-testid="toast-action-btn"
				>
					{toast.getActionLabel(msg.action)}
				</button>
			{/if}
		</div>
		<button 
			class="toast-close" 
			onclick={() => toast.remove(msg.id)} 
			aria-label={$t('common.close')}
			data-testid="toast-close-btn"
		>
			<X size={16} />
		</button>
		<div
			class="toast-progress"
			style="animation-duration: {msg.duration}ms"
			data-testid="toast-progress-bar"
			aria-hidden="true"
		></div>
	</div>
{/snippet}

<!-- Глобальний стек у кутку: усе, що не прив'язане до конкретної кнопки. -->
<div
	class="toast-container"
	style="--footer-lift: {footerLift}px"
	data-testid="toast-notifications-container"
>
	{#each globalMsgs as msg (msg.id)}
		{@render toastCard(msg)}
	{/each}
</div>

<!--
	Гарячі новини — лівий нижній кут, власний стек.
	Окремо від глобального навмисно: тост «адресу скопійовано» з'являється у
	відповідь на дію відвідувача, а сповіщення про новину — саме по собі. Змішані
	в одному кутку, вони читалися б як одна черга подій, якою не є.
-->
<div
	class="toast-container toast-container--hot"
	class:at-left={hotCorner === 'bottomLeft' || hotCorner === 'topLeft'}
	class:at-top={hotCorner === 'topLeft' || hotCorner === 'topRight'}
	style="--footer-lift: {footerLift}px"
	data-testid="toast-hot-container"
>
	{#each hotMsgs as msg (msg.id)}
		{@render toastCard(msg)}
	{/each}
</div>

<!-- Анкорні: біля свого посилання, з переворотом угору/вниз (§ 5). -->
{#each anchoredMsgs as msg (msg.id)}
	<div
		class="toast-anchored"
		use:positionAnchored={msg.anchor!}
		data-testid="toast-anchored-container"
	>
		{@render toastCard(msg)}
	</div>
{/each}

<style>
	/* Анкорний тост позиціюється скриптом; ширина обмежена, щоб кламп до
	   країв вьюпорта мав із чим працювати. */
	.toast-anchored {
		position: fixed;
		top: 0;
		left: 0;
		max-width: min(450px, calc(100vw - 16px));
		z-index: 10001;
	}

	/* Ширший за звичайний тост: усередині картка з фото. */
	.toast-container--hot {
		max-width: min(400px, calc(100vw - 4rem));
	}

	.toast-container--hot.at-left {
		right: auto;
		left: 2rem;
	}

	/* Верхні кути — під шапкою, а не поверх неї: шапка фіксована, і сповіщення
	   з більшим z-index накрило б меню, яким відвідувач саме користується. */
	.toast-container--hot.at-top {
		bottom: auto;
		/* Верхні кути до підвала не дістають — підйом там зайвий. */
		top: calc(var(--header-height, 72px) + var(--ticker-height, 0px) + 1rem);
	}

	/* `stretch`, а не `flex-start`: зображення тягнеться на всю висоту картки —
	   так само, як у картці новини, де воно займає цілу колонку. Інакше під ним
	   лишалася б порожнеча заввишки з різницю між фото й текстом. */
	.toast-card {
		position: relative;
		display: flex;
		gap: 0.75rem;
		align-items: stretch;
		color: inherit;
	}

	/*
	   Зображення виходить за поля тоста, як у картці новини: там фото займає
	   цілу колонку від краю до краю, а не лежить у рамці з відступами.
	   Від'ємні поля гасять `padding` самого тоста (1rem / 1.25rem); закруглення
	   лівих кутів дає `overflow: hidden` на `.toast-msg`.

	   Ширина фіксована, висоту задає сусідній текст; мінімум — щоб на короткому
	   заголовку картинка не звузилася до смужки.
	*/
	.toast-card__media {
		position: relative;
		width: 110px;
		min-height: 130px;
		margin: -1rem 0 -1rem -1.25rem;
		overflow: hidden;
		flex-shrink: 0;
	}

	.toast-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Той самий значок, що на картці новини: значок і слово. Лежить над
	   розтягнутим посиланням, інакше клік по ньому відкривав би новину без
	   відео — тобто рівно те, чого відвідувач не просив. */
	.toast-card__video-btn {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.55rem;
		border: none;
		border-radius: var(--radius-full);
		background: var(--accent-primary);
		color: var(--text-on-accent);
		font-family: var(--font-heading);
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-decoration: none;
		cursor: pointer;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
		transition: transform var(--transition-fast);
	}

	.toast-card__video-btn:hover {
		transform: scale(1.05);
	}

	/* Клікабельна вся картка при одному посиланні: ::after накриває її цілком. */
	.toast-card__link {
		text-decoration: none;
		color: var(--text-title);
	}

	.toast-card__link::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.toast-card__body {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
		width: 100%;
	}

	.toast-card__meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Той самий вигляд, що й `.tag` у картці новини — стилі Svelte scoped,
	   тому клас доводиться повторити, а не успадкувати. */
	.toast-card__tag {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-full);
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.toast-card__date {
		font-size: 0.7rem;
		opacity: 0.7;
	}

	.toast-card__title {
		font-family: var(--font-heading);
		font-weight: 700;
		color: var(--text-title);
		line-height: 1.25;
	}

	.toast-card__excerpt {
		font-size: 0.8rem;
		opacity: 0.8;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.toast-container {
		position: fixed;
		/* Підвал відсуває тост угору, а не ховається під ним. */
		bottom: calc(2rem + var(--footer-lift, 0px));
		right: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 10000;
		pointer-events: none;
	}

	.toast-msg {
		pointer-events: auto;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem 1rem 1.25rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--bg-card), transparent 15%);
		backdrop-filter: blur(12px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		min-width: 320px;
		max-width: 450px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.toast-msg:hover .toast-progress,
	.toast-msg:focus-within .toast-progress {
		animation-play-state: paused;
	}

	/*
	   Сповіщення про новину показується в кольорах ПРОТИЛЕЖНОЇ теми: у темній
	   темі воно світле, у світлих — темне.

	   Це не примха оформлення, а спосіб зробити його помітним. Тост про новину
	   з'являється сам, без дії відвідувача, і в кольорах поточної теми зливався
	   б із карткою чи підвалом, над якими лежить, — тобто виглядав би частиною
	   сторінки, яку вже гортають. Протилежний фон читається як «це щось інше»
	   з першого погляду, і при цьому не потребує ані рамки, ані чужого кольору:
	   палітра лишається та сама, міняються місцями лише світле й темне.

	   Перевизначаються саме СЕМАНТИЧНІ змінні, а не кожне правило: заголовок,
	   опис, дата й рубрика всередині вже написані через них, тож підхоплюють
	   заміну самі. Значення взяті з `themes/light.css` і `themes/dark.css` —
	   якщо тема змінить свою палітру, змінити доведеться і тут.
	*/
	.toast-msg:has(.toast-card) {
		/* Світлі теми (зокрема жовті) → сповіщення в темних кольорах. */
		--bg-header: var(--palette-navy-900);
		--text-main: var(--palette-cyan-50);
		--text-title: var(--palette-blue);
		--text-muted: var(--palette-cyan-100);
		--accent-text: var(--palette-blue);
		--color-muted-text: var(--palette-cyan-100);

		background: var(--bg-header);
		color: var(--text-main);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: none;
	}

	:global(.dark-theme) .toast-msg:has(.toast-card) {
		/* Темна тема → сповіщення в світлих кольорах. */
		--bg-header: var(--palette-cyan-50);
		--text-main: var(--palette-navy-500);
		--text-title: var(--palette-navy-page);
		--text-muted: var(--palette-navy-500);
		--accent-text: var(--palette-navy-500);
		--color-muted-text: var(--palette-navy-500);
	}

	/* Хрестик і смуга часу теж належать сповіщенню, тому й вони з його палітри. */
	.toast-msg:has(.toast-card) .toast-close {
		color: var(--text-main);
	}

	.toast-msg:has(.toast-card) .toast-progress {
		background: var(--accent-primary);
	}

	/* ── Progress bar ── */
	@keyframes toast-shrink {
		from { transform: scaleX(1); }
		to   { transform: scaleX(0); }
	}

	.toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 3px;
		transform-origin: left center;
		animation: toast-shrink linear forwards;
		/* animation-duration is set inline per msg */
		border-radius: 0 0 0 16px;
	}

	.toast-success .toast-progress { background: #22c55e; }
	.toast-error   .toast-progress { background: #ef4444; }
	.toast-info    .toast-progress { background: #3b82f6; }

	.toast-icon {
		margin-top: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.toast-success .toast-icon { color: #22c55e; }
	.toast-error .toast-icon { color: #ef4444; }
	.toast-info .toast-icon { color: #3b82f6; }

	.toast-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.toast-message {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-title, #1a2a3a);
		word-break: break-word;
		line-height: 1.4;
	}

	.toast-action {
		background: var(--color-light-blue, #e0f2fe);
		color: var(--text-title, #1a2a3a);
		border: 1px solid rgba(0,0,0,0.05);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		align-self: flex-start;
		transition: all 0.2s;
		font-family: var(--font-heading);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.toast-action:hover {
		background: var(--color-sky-blue, #bae6fd);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--color-muted-text, #94a3b8);
		cursor: pointer;
		padding: 0.25rem;
		margin-top: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: rgba(0, 0, 0, 0.05);
		color: var(--text-title, #1a2a3a);
	}
	
	@media (max-width: 600px) {
		.toast-container {
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
			align-items: stretch;
		}
		.toast-msg {
			min-width: 0;
			max-width: 100%;
		}
	}
</style>
