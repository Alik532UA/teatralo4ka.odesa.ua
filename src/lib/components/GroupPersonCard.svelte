<script lang="ts">
	import { User } from 'lucide-svelte';
	import type { ResolvedPathname } from '$app/types';

	interface Props {
		name: string;
		/** Готова адреса портрета; `null` — показуємо силует. */
		photo?: string | null;
		/** Другий рядок: роль майстра або рік випуску. */
		subtitle?: string | null;
		/**
		 * Є адреса — картка стає посиланням, інакше кнопкою з `onclick`.
		 *
		 * Саме `ResolvedPathname`, а не `string`: за цим типом
		 * `svelte/no-navigation-without-resolve` визнає адресу перевіреною.
		 * Зі звичайним рядком правило червоніє, і описка в шляху перестала б
		 * ловитися компіляцією.
		 */
		href?: ResolvedPathname;
		onclick?: () => void;
		/**
		 * Наскрізний номер картки НА СТОРІНЦІ — від нього рахується затримка
		 * хвилі. Саме наскрізний, а не в межах секції: інакше кожна секція
		 * пульсує власною хвилею, і між ними читається пауза.
		 */
		index?: number;
		testid?: string;
	}

	let { name, photo = null, subtitle = null, href, onclick, index = 0, testid }: Props = $props();
</script>

<!--
	Одна картка на майстрів і на випускників.

	Доти майстер малювався власним блоком стилів — і він розійшовся з картками
	випускників (рядок замість стовпчика, інший розмір портрета). Той самий клас
	дефекту, що й дубль картки випускника: два описи одного, які розходяться
	мовчки. Тому вигляд тут один, а різниця лише в даних.

	Посилання й кнопка — справжні теги, а не div з обробником: обидва мусять
	лишатися доступними з клавіатури.
-->
{#snippet body()}
	<span class="person-card__avatar">
		{#if photo}
			<img src={photo} alt={name} class="person-card__img" loading="lazy" width="80" height="80" />
		{:else}
			<span class="person-card__placeholder">
				<User size={36} aria-hidden="true" />
			</span>
		{/if}
	</span>
	<span class="person-card__meta">
		<strong class="person-card__name">{name}</strong>
		{#if subtitle}
			<span class="person-card__subtitle">{subtitle}</span>
		{/if}
	</span>
{/snippet}

{#if href}
	<a
		{href}
		class="person-card"
		style="--card-order: {index}"
		data-testid={testid}
	>
		{@render body()}
	</a>
{:else}
	<button
		type="button"
		class="person-card"
		style="--card-order: {index}"
		{onclick}
		aria-haspopup="dialog"
		data-testid={testid}
	>
		{@render body()}
	</button>
{/if}

<style>
	.person-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		width: 100%;
		box-sizing: border-box;
		padding: 1.5rem 1rem 1.25rem;
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.06);
		text-decoration: none;
		color: inherit;
		font-family: inherit;
		cursor: pointer;
		position: relative;
		transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
		/*
		 * Хвиля пульсації замість підпису «→».
		 *
		 * Напис прибрано: він повторював те, що вже видно з курсора й наведення.
		 * Натомість карткою прокочується короткий сплеск — те саме рішення, що й
		 * у `sidebar-icons` DigitalWorkshop: довгий цикл, щоб рух не набридав, і
		 * затримка за номером картки, щоб він ішов хвилею, а не мигав хором.
		 *
		 * Затримка РОСТЕ з номером — хвиля йде зліва направо й далі рядок за
		 * рядком. У DigitalWorkshop формула була дзеркальна
		 * (`total - 1 - order`), бо там колонка мала котитися знизу вгору.
		 *
		 * Вимикати під `prefers-reduced-motion` тут не треба: global.css гасить
		 * анімації глобально.
		 */
		animation: person-card-wave 15s infinite ease-in-out;
		animation-delay: calc(var(--card-order, 0) * 0.15s);
	}

	/*
	 * Анімуються лише `transform` і `box-shadow`.
	 *
	 * `border-color` навмисно не чіпається: у світлій темі межа інша, і кадр
	 * хвилі повертав би її до темного значення — тобто тихо ламав би тему
	 * рівно на час анімації, тобто завжди.
	 */
	@keyframes person-card-wave {
		0%,
		8%,
		100% {
			transform: scale(1);
			box-shadow: none;
		}
		4% {
			transform: scale(1.03);
			box-shadow: 0 6px 18px rgba(99, 102, 241, 0.25);
		}
	}

	.person-card:focus-visible {
		outline: 2px solid #818cf8;
		outline-offset: 2px;
	}

	/* Наведення важливіше за хвилю: інакше вона зсувала б картку з-під курсора. */
	.person-card:hover {
		animation: none;
		background: rgba(255, 255, 255, 0.07);
		border-color: rgba(99, 102, 241, 0.4);
		transform: translateY(-4px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
	}

	.person-card__avatar {
		display: block;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		overflow: hidden;
		margin-bottom: 0.85rem;
		border: 2px solid rgba(255, 255, 255, 0.12);
		background: #1e293b;
		flex-shrink: 0;
		transition:
			transform 0.25s ease,
			border-color 0.25s ease;
	}

	.person-card:hover .person-card__avatar {
		transform: scale(1.05);
		border-color: #818cf8;
	}

	.person-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.person-card__placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #64748b;
	}

	.person-card__meta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		width: 100%;
	}

	.person-card__name {
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.3;
		color: var(--text-main, #f8fafc);
	}

	.person-card__subtitle {
		font-size: 0.8rem;
		color: var(--text-muted, #94a3b8);
	}

	:global(.light-theme) .person-card {
		background: #ffffff;
		border-color: rgba(0, 0, 0, 0.08);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	:global(.light-theme) .person-card:hover {
		background: #f8fafc;
		border-color: rgba(99, 102, 241, 0.4);
	}

	:global(.light-theme) .person-card__name {
		color: #1e293b;
	}
</style>
