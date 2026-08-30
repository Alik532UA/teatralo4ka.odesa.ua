<script lang="ts">
	import { t } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { mastersByMentions, pluralKey } from '$lib/data/masters';

	/**
	 * Демонстрація до пункту «Порядок викладачів залежить від ваших анкет».
	 *
	 * Доти пункт доводилося брати на віру: він розповідав про правило, якого
	 * ніде не було видно. Тут воно показане просто — самі викладачі, у тому
	 * самому порядку, у якому їх ставить це правило, і з числом, яке його
	 * задає.
	 *
	 * Скільки їх показувати — питання не смаку, а МІСЦЯ: рівно стільки, скільки
	 * вміщається в один рядок. Перенос тут був би гірший за обрізання, бо
	 * порядок читається зліва направо, і другий рядок казав би, що показано
	 * «всіх», хоча показано перших.
	 */
	const ranked = mastersByMentions();

	/** Діаметр значка й проміжок між ними — ті самі числа, що в CSS нижче. */
	const SIZE = 34;
	const GAP = 6;

	let rowEl = $state<HTMLElement | null>(null);
	let fits = $state(0);

	$effect(() => {
		const el = rowEl;
		if (!el) return;

		/*
		 * Рахуємо від ШИРИНИ, а не від медіазапитів: те саме вікно відкривається
		 * і на телефоні, і на екрані 4K, а всередині ще й має власні відступи —
		 * жоден поріг у пікселях вікна не сказав би, скільки значків туди
		 * справді влізе.
		 */
		const measure = () => {
			const width = el.clientWidth;
			if (width <= 0) return;
			fits = Math.max(1, Math.floor((width + GAP) / (SIZE + GAP)));
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});

	const shown = $derived(ranked.slice(0, fits));

	/**
	 * Кого зараз роздивляються. Рідну підказку браузера тут замінено власною
	 * з простої причини: у неї не можна покласти кнопку, а саме кнопка й
	 * потрібна — впізнавши свого викладача, людина має куди про це написати.
	 */
	let hovered = $state<string | null>(null);
	let closeTimeout: ReturnType<typeof setTimeout> | null = null;

	/**
	 * З якого боку відкривати підказку.
	 *
	 * Не примха: значки стоять у ряд до самого правого краю, і в останнього
	 * підказка з лівою прив'язкою виходила за екран на 88 px разом із двома
	 * кнопками з чотирьох (заміряно на 375). Тому для значків із правої
	 * половини екрана вона чіпляється правим краєм.
	 */
	let flip = $state(false);

	function show(id: string, slot: HTMLElement) {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
		const box = slot.getBoundingClientRect();
		flip = box.left + box.width / 2 > window.innerWidth / 2;
		hovered = id;
	}

	/*
	 * Затримка на виході: між значком і підказкою є проміжок, і без неї
	 * підказка зникала б рівно тоді, коли курсор іде до кнопки в ній.
	 */
	function hide() {
		closeTimeout = setTimeout(() => {
			hovered = null;
		}, 260);
	}

	const CONTACTS = [
		{ name: 'Telegram', url: 'https://t.me/alik532', icon: 'telegram.svg' },
		{ name: 'Viber', url: 'viber://chat?number=%2B380937251208', icon: 'viber.svg' },
		{ name: 'WhatsApp', url: 'https://wa.me/380937251208', icon: 'whatsapp.svg' },
		{ name: 'LinkedIn', url: 'https://linkedin.com/in/alik-qa-engineer', icon: 'linkedin.svg' }
	];

	function mentionLabel(mentions: number): string {
		return $t(`galaxy.mentions${pluralKey(mentions)}`, { values: { count: mentions } });
	}

	/** Для диктора — те саме, що бачить око: ім'я й число. */
	function caption(displayName: string, mentions: number): string {
		return `${displayName} — ${mentionLabel(mentions)}`;
	}
</script>

<!--
	`title`, а не власна підказка: вікно вже прокручується, значки стоять у
	нижньому рядку пункту, і власна спливаюча підказка мусила б рахувати, з
	якого боку відкритися, щоб не вилізти за край. Рідна підказка браузера це
	вміє сама, а на дотику її замінює `aria-label` для диктора.
-->
<div class="row" bind:this={rowEl} data-testid="galaxy-update-teachers-row-list">
	{#each shown as entry (entry.master.id)}
		{@const label = caption(entry.master.displayName, entry.mentions)}
		<span
			class="row__slot"
			onmouseenter={(event) => show(entry.master.id, event.currentTarget)}
			onmouseleave={hide}
			role="presentation"
		>
			<span
				class="row__badge"
				role="img"
				aria-label={label}
				data-testid="galaxy-update-teacher-badge-{entry.master.slug}"
			>
				{#if entry.master.photo}
					<img src={entry.master.photo} alt="" width={SIZE} height={SIZE} loading="lazy" />
				{:else}
					<span class="row__letter" aria-hidden="true">{entry.master.displayName.charAt(0)}</span>
				{/if}
			</span>

			{#if hovered === entry.master.id}
				<!--
					Підказка виходить ЗА межі рядка, тому рядок не сміє її обрізати:
					`overflow: hidden` там лишається задля значків, тож підказка
					висить у `position: fixed`-подібному шарі — абсолютно від слоту,
					а сам слот виведено з-під обрізання власним `z-index`.
				-->
				<span
					class="tip"
					class:tip--flip={flip}
					data-testid="galaxy-update-teacher-tip-panel"
				>
					<!--
						Ліворуч — сам викладач, на всю висоту підказки: підказка
						відповідає на питання «хто це?», і відповідь має бути
						видима, а не підписана. Значок у рядку 34 px, і роздивитися
						обличчя на ньому неможливо.
					-->
					{#if entry.master.photo}
						<img
							src={entry.master.photo}
							alt=""
							class="tip__portrait"
							loading="lazy"
							data-testid="galaxy-update-teacher-tip-photo-img"
						/>
					{/if}

					<span class="tip__body">
						<span class="tip__name">{entry.master.displayName}</span>
						<span class="tip__count">{mentionLabel(entry.mentions)}</span>

						<!--
							Прохання написати — ОКРЕМИЙ контейнер усередині підказки.
							Верх її розповідає про викладача, низ — про те, що з цим
							робити, і це різні речі: без візуального шва фотографія
							адміністратора читалася як ще одна фотографія викладача.
						-->
						<span class="tip__ask">
							<img
								src={asset('/graduates/alik-zapolnov-96.webp')}
								alt="Алік Запольнов"
								width="28"
								height="28"
								class="tip__admin"
								loading="lazy"
								data-testid="galaxy-update-teacher-tip-admin-img"
							/>
							<span class="tip__cta">{$t('galaxy.myTeacher')}</span>
							<span class="tip__icons">
								{#each CONTACTS as contact (contact.name)}
									<a
										href={contact.url}
										target="_blank"
										rel="external noopener noreferrer"
										class="tip__link"
										aria-label="{$t('galaxy.myTeacher')} — {contact.name}"
										title={contact.name}
										data-testid="galaxy-update-teacher-tip-link-{contact.name.toLowerCase()}"
									>
										<img
											src={asset(`/social_media/${contact.icon}`)}
											alt={contact.name}
											width="24"
											height="24"
											loading="lazy"
										/>
									</a>
								{/each}
							</span>
						</span>
					</span>
				</span>
			{/if}
		</span>
	{/each}
</div>

<style>
	.row {
		display: flex;
		min-width: 0;
		/*
		 * Підказка виходить за верхній край рядка, тож обрізати можна лише по
		 * горизонталі. `clip` замість `hidden` саме для цього й існує:
		 * `overflow-x: clip` ріже зайві значки, а `overflow-y: visible` лишає
		 * підказці вийти вгору. З `hidden` браузер обрізав би обидві осі — це
		 * його правило, а не наше рішення.
		 */
		overflow-x: clip;
		overflow-y: visible;
		/*
		 * Без переносу — і без прокрутки. Показано рівно те, що вміщається;
		 * решта не ховається за краєм, а не малюється взагалі, бо кількість
		 * рахується від ширини цього ж рядка.
		 */
		flex-wrap: nowrap;
		gap: 6px;
		margin-top: 0.55rem;
	}
	.row__slot {
		position: relative;
		flex: 0 0 auto;
		display: block;
	}
	.row__slot:hover {
		/* Піднімаємо слот над сусідами, щоб підказка не йшла під них. */
		z-index: 3;
	}
	.row__badge {
		display: block;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		overflow: hidden;
		display: grid;
		place-items: center;
		background: rgb(140 190 255 / 0.12);
		border: 1px solid rgb(140 190 255 / 0.3);
	}
	.row__badge img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.row__letter {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--galaxy-accent);
	}

	/*
	 * Власна підказка замість рідної: у `title` не можна покласти кнопку, а
	 * саме вона тут головна — упізнавши свого викладача, людина має куди про це
	 * написати. Рідна підказка лишилася б і поверх власної, тому атрибута
	 * `title` на значку більше немає взагалі.
	 *
	 * Відкривається ВГОРУ: рядок стоїть унизу пункту, і вниз місця немає.
	 * По горизонталі підказка тримається лівого краю значка й обмежена вікном —
	 * значки стоять і біля правого краю теж.
	 */
	.tip {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 0;
		z-index: 4;
		display: flex;
		align-items: stretch;
		gap: 0.55rem;
		width: max-content;
		max-width: min(300px, calc(100vw - 2rem));
		padding: 0.5rem;
		border-radius: 0.9rem;
		background: var(--galaxy-card-bg);
		border: 1px solid rgb(140 190 255 / 0.35);
		box-shadow: 0 12px 30px rgb(0 0 0 / 0.45);
		color: var(--galaxy-text);
		text-align: left;
	}
	.tip--flip {
		left: auto;
		right: 0;
	}
	/*
	 * Портрет тягнеться на всю висоту підказки, а не має свого розміру: висота
	 * тут задається текстом праворуч, і будь-яке власне число розійшлося б із
	 * нею на першому ж довгому імені.
	 */
	.tip__portrait {
		flex: 0 0 auto;
		width: 62px;
		align-self: stretch;
		height: auto;
		object-fit: cover;
		border-radius: 0.65rem;
		border: 1px solid rgb(140 190 255 / 0.25);
	}
	.tip__body {
		display: grid;
		gap: 0.2rem;
		min-width: 0;
	}
	.tip__name {
		font-weight: 700;
		font-size: 0.9rem;
		line-height: 1.2;
	}
	.tip__count {
		font-size: 0.78rem;
		color: var(--galaxy-muted);
	}
	/*
	 * Власний контейнер із власним тлом: це вже не про викладача, а про те, до
	 * кого писати. Без шва обидві фотографії читалися як дві фотографії
	 * викладача.
	 */
	.tip__ask {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.15rem 0.4rem;
		margin-top: 0.2rem;
		padding: 0.4rem 0.45rem;
		border-radius: 0.65rem;
		background: rgb(140 190 255 / 0.1);
		border: 1px solid rgb(140 190 255 / 0.22);
	}
	.tip__admin {
		border-radius: 50%;
		flex-shrink: 0;
	}
	.tip__cta {
		font-size: 0.78rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--galaxy-accent);
	}
	.tip__icons {
		grid-column: 1 / -1;
		display: flex;
		gap: 0.3rem;
		margin-top: 0.15rem;
	}
	.tip__link {
		display: grid;
		place-items: center;
		border-radius: 50%;
		transition: transform var(--transition-fast);
	}
	.tip__link:hover,
	.tip__link:focus-visible {
		transform: scale(1.12);
	}
</style>
