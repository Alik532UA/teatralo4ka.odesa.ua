<script lang="ts">
	import { t } from 'svelte-i18n';
	import { fly } from 'svelte/transition';
	import { Pencil } from 'lucide-svelte';
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
	 * Звідси ним користуються сторінки групи й фестивалю. Сторінки викладача й
	 * випускника поки лишаються на власних копіях: у них своя геометрія
	 * (кнопка в куті картки проти кнопки в шапці) і свої `data-testid`, за
	 * якими їх адресують наявні перевірки. Це борг, а не задум.
	 *
	 * Адресу для листування зашито тут, а не в даних, свідомо: адміністратор
	 * сайту один, і винесення його контактів у реєстр створило б порожню
	 * абстракцію з одним записом.
	 */
	interface Props {
		/**
		 * Початок `data-testid` — свій на кожній сторінці, бо перевірки цих
		 * сторінок писалися окремо й адресують кнопку по-різному.
		 */
		testIdPrefix: string;
		/**
		 * Чи є на сторінці фотографія. Від цього залежить сам текст прохання:
		 * там, де фото немає, його заразом і просять.
		 */
		hasPhoto?: boolean;
		/**
		 * Куди розкривати меню. Угору — коли кнопка стоїть у нижньому куті
		 * картки; вниз — коли вона в шапці сторінки, бо там угорі екрана вже
		 * немає.
		 */
		openTo?: 'up' | 'down';
	}

	let { testIdPrefix, hasPhoto = true, openTo = 'up' }: Props = $props();

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
	}

	function handleMouseLeave() {
		closeTimeout = setTimeout(() => {
			open = false;
		}, 300);
	}

	const label = $derived(
		$t('common.contact', { default: "Внести правки або зв'язатися з адміністратором" })
	);
</script>

<div
	class="edit-wrap"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group"
	aria-label={label}
>
	<button
		type="button"
		class="edit-btn"
		onclick={toggle}
		aria-expanded={open}
		aria-label={label}
		title={label}
		data-testid="{testIdPrefix}-edit-btn"
	>
		<Pencil size={17} aria-hidden="true" />
	</button>

	{#if open}
		<div
			class="edit-popup"
			class:edit-popup--down={openTo === 'down'}
			transition:fly={{ y: -8, duration: 180 }}
			data-testid="{testIdPrefix}-contact-menu"
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
			<p class="edit-popup__hint" data-testid="{testIdPrefix}-contact-hint">
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
						data-testid="{testIdPrefix}-contact-link-{contact.name.toLowerCase()}"
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
