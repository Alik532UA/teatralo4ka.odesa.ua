<script lang="ts">
	import { t } from 'svelte-i18n';

	/**
	 * Зміст сторінки — швидка навігація розділами, збоку від тексту.
	 *
	 * ## Звідки беруться пункти
	 *
	 * Із самої сторінки: компонент читає `h2[id]` усередині `.prose` вже після
	 * того, як її вміст вставлено. Перелік НЕ дублюється в коді й не задається
	 * пропсом, і це головне рішення тут: сторінка з markdown — це текст, який
	 * правлять окремо від застосунку, і другий перелік розділів розійшовся б із
	 * ним на першій же правці. Якщо автор додасть розділ у markdown — він
	 * з'явиться у змісті, не торкаючись жодного `.svelte`.
	 *
	 * Якорі проставлені В САМОМУ тексті (`<h2 id="…">`), а не дописані звідси, і
	 * теж навмисно: так посилання `/history#nashi-pedahohy` працює одразу з
	 * пререндереного HTML — до того, як виконається бодай рядок JavaScript, і
	 * навіть якщо він не виконається взагалі.
	 *
	 * ## Як визначається активний розділ
	 *
	 * Позицією заголовків, перерахованою на прокрутці раз на кадр. Спроба
	 * зробити це `IntersectionObserver`ом описана нижче разом із тим, чому вона
	 * не працює — це не очевидно й варте рядків.
	 */

	interface Item {
		id: string;
		text: string;
	}

	let items = $state<Item[]>([]);
	let activeId = $state('');
	let host = $state<HTMLElement | null>(null);

	/**
	 * Перелік будується в `$effect`, а не в `onMount`: вміст `.prose` приходить
	 * із `{@html}` того самого кадру, а при зміні мови замінюється цілком. Ефект
	 * перезапускається від зміни `host`, тобто рівно тоді, коли є що читати.
	 */
	$effect(() => {
		if (!host) return;

		const article = host.closest('article') ?? document;
		const heads = [...article.querySelectorAll<HTMLElement>('.prose h2[id]')];
		items = heads.map((h) => ({ id: h.id, text: (h.textContent ?? '').trim() }));
		if (heads.length === 0) return;

		/*
		 * Активний розділ визначає ПОЗИЦІЯ заголовків, і перераховується вона на
		 * прокрутці — по одному разу на кадр.
		 *
		 * Дві попередні редакції були розумніші й обидві хибні, тому варто назвати,
		 * чому саме:
		 *
		 * 1. «Активний — той заголовок, що ЗАРАЗ у смузі» (IntersectionObserver).
		 *    Між двома заголовками в смузі немає жодного, тож підсвітка застрягала
		 *    на попередньому значенні.
		 * 2. Те саме, але з перерахунком за позицією в обробнику спостерігача.
		 *    Краще, і все одно ні: спостерігач будиться лише тоді, коли ціль МІНЯЄ
		 *    стан перетину. При стрибку через кілька розділів заголовки пролітають
		 *    смугу цілком — стан до і після однаковий, події немає. Заміряно:
		 *    перехід на 5200 і 7900 лишав підсвіченим розділ, пройдений давно.
		 *
		 * Тому звичайний слухач прокрутки. «Він спрацьовує на кожен піксель» —
		 * правда лише без обмеження по кадру; з ним замірів рівно стільки, скільки
		 * кадрів, а `getBoundingClientRect` на дев'яти заголовках коштує менше за
		 * один рядок тексту. Той самий прийом стоїть у кнопці «нагору» поруч.
		 */
		const sync = () => {
			const line = window.innerHeight * 0.35;
			let current = heads[0];
			for (const h of heads) {
				if (h.getBoundingClientRect().top > line) break;
				current = h;
			}
			activeId = current.id;
		};

		let queued = false;
		const onScroll = () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				sync();
				queued = false;
			});
		};

		sync();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};

	});
</script>

<!--
	`aria-label` замість заголовка-`h2`: власний заголовок у змісті став би ще
	одним пунктом у переліку заголовків сторінки й зламав би їхню ієрархію для
	читалки. Підпис зверху — декоративний, тому `aria-hidden`.
-->
<nav
	class="page-toc"
	bind:this={host}
	aria-label={$t('common.tableOfContents')}
	data-testid="page-toc-nav"
>
	{#if items.length > 0}
		<span class="page-toc__title" aria-hidden="true">{$t('common.tableOfContents')}</span>
		<ol class="page-toc__list" data-testid="page-toc-list">
			{#each items as item (item.id)}
				<li>
					<!--
						Звичайне посилання на якір, без перехоплення кліку: плавність дає
						`scroll-behavior: smooth` із `global.css`, а адреса в рядку
						браузера лишається такою, якою її можна переслати. Обробник
						`preventDefault` + `scrollIntoView` виглядав би так само й забрав
						би обидві ці властивості.

						`svelte/no-navigation-without-resolve` тут не діє: це якір у межах
						тієї самої сторінки, а не перехід між маршрутами.
					-->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a
						href="#{item.id}"
						class="page-toc__link"
						class:active={activeId === item.id}
						aria-current={activeId === item.id ? 'true' : undefined}
						data-testid="page-toc-link-{item.id}"
					>
						{item.text}
					</a>
				</li>
			{/each}
		</ol>
	{/if}
</nav>

<style>
	.page-toc {
		/*
		 * Липкий збоку від тексту. Відступ згори — висота шапки плюс запас, бо
		 * шапка `fixed` і перекрила б перші пункти.
		 */
		position: sticky;
		top: calc(var(--header-height, 72px) + var(--ticker-height, 0px) + 1.5rem);
		align-self: start;
		max-height: calc(100dvh - var(--header-height, 72px) - 6rem);
		overflow-y: auto;
		/* Смуга прокрутки всередині змісту — власна, як у решти зон проєкту. */
		overscroll-behavior: contain;
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.page-toc__title {
		display: block;
		font-family: var(--font-heading);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-muted-text);
		margin-bottom: 0.75rem;
	}

	.page-toc__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		/*
		 * Смуга ліворуч — орієнтир, уздовж якого рухається активний пункт.
		 * Вона ж робить зміст видимою окремою колонкою, а не просто стовпчиком
		 * посилань біля тексту.
		 */
		border-left: var(--hairline-width) solid var(--border-main);
	}

	.page-toc__link {
		display: block;
		padding: 0.4rem 0.75rem;
		color: var(--color-muted-text);
		text-decoration: none;
		border-left: 3px solid transparent;
		margin-left: calc(-1 * var(--hairline-width));
		transition:
			color 0.2s ease,
			border-color 0.2s ease;
	}

	.page-toc__link:hover {
		color: var(--text-main);
	}

	.page-toc__link.active {
		color: var(--text-title);
		border-left-color: var(--accent-alt);
		font-weight: 700;
	}

	.page-toc__link:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
		border-radius: 4px;
	}

	/*
	 * На вузькому екрані зміст переїжджає НАД текст і перестає бути липким.
	 *
	 * Ховати його там було б простіше й гірше: саме на телефоні довга сторінка
	 * найнезручніша, а місця на колонку збоку немає. Тому він стає звичайним
	 * переліком на початку — його видно один раз, і далі він не заважає.
	 */
	@media (max-width: 900px) {
		.page-toc {
			position: static;
			max-height: none;
			margin-bottom: 2rem;
		}
	}

	@media print {
		.page-toc {
			display: none;
		}
	}
</style>
