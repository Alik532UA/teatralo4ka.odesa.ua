<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { localizedPath } from '$lib/i18n/routing';
	import { GRADUATES, graduateProfilePath } from '$lib/data/graduates';

	/**
	 * Рядок мініатюр випускників — по СПИСКУ ключів, а не по одній сутності.
	 *
	 * ## Чому окремо від `GroupMatesRow`
	 *
	 * Спершу такий рядок умів лише одне: узяти склад НАВЧАЛЬНОЇ ГРУПИ за її
	 * адресою. Але той самий рядок потрібен ще в трьох місцях, і в жодному з них
	 * групи немає: склад вистави приходить зі зрізу анкет, учасники фестивалю —
	 * з реєстру фестивалів, а на сторінці викладача поряд стоять і групи, і
	 * вистави. Копіювати розмітку й стилі вчетверте означало б, що мініатюри
	 * почнуть розходитися розміром і поведінкою в сусідніх блоках однієї
	 * сторінки.
	 *
	 * Тому тут — сам рядок, який знає лише «ось ключі людей», а
	 * `GroupMatesRow` лишився тонкою обгорткою, що дістає склад групи.
	 *
	 * ## Хто показується
	 *
	 * Не лише ті, у кого є портрет: заміряно на складі груп — фото є у 62 із 91
	 * членства, тож фільтр за наявністю знімка сховав би майже третину людей.
	 * Замість портрета — перша літера імені; тьмяність кружечка означає рівно те
	 * саме, що й у списку учасників вистави: сторінки в цієї людини ще немає.
	 *
	 * Але порядок обличчями ВПЕРЕД (див. `max`), бо рядок обмежений: інакше під
	 * обмеження раз за разом потрапляли б самі літери.
	 */
	interface Props {
		/** СТІЙКІ ключі випускників (`id`), а не адреси: адресу законно виправляють. */
		ids: readonly string[];
		/** Чия це картка: сама людина серед інших не показується. */
		excludeId?: string;
		/**
		 * Чи робити кожну мініатюру посиланням.
		 *
		 * `false` потрібне там, де рядок лежить УСЕРЕДИНІ посилання — у картці
		 * переліку груп, у картці вистави. `<a>` всередині `<a>` — невалідна
		 * розмітка, і Svelte у dev валить на ній сторінку цілком
		 * (`node_invalid_placement_ssr`); гейт `e2e/nested-interactive.spec.ts`
		 * тримає нульову терпимість саме до цього випадку.
		 */
		linked?: boolean;
		/**
		 * Початок `data-testid`. Свій ОБОВ'ЯЗКОВИЙ на кожному місці показу:
		 * `e2e/testid.spec.ts` вимагає унікальності в межах сторінки, а таких
		 * рядків на сторінці стільки ж, скільки груп, вистав або фестивалів.
		 */
		testIdPrefix: string;
		/**
		 * Скільки мініатюр показати. Решта згортається в «+N».
		 *
		 * Потрібне тому, що рядок НЕ ПЕРЕНОСИТЬСЯ: 31 учасник фестивалю в повну
		 * ширину давав два рядки облич, і блок переставав читатися як один
		 * підпис до однієї поїздки. Число різне на різних місцях, бо різна
		 * ширина: картка групи на сторінці викладача стоїть третиною екрана,
		 * картка фестивалю — на всю.
		 */
		max?: number;
	}

	let { ids, excludeId = '', linked = true, testIdPrefix, max = 12 }: Props = $props();

	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');

	/* Пошук за `id` по повному реєстру: він і так приходить на клієнт цілком, а
	 * невідомий ключ мовчки минається — інакше одна описка в даних валила б
	 * увесь рядок. */
	const found = $derived(
		ids
			.filter((id) => id !== excludeId)
			.map((id) => GRADUATES.find((g) => g.id === id))
			.filter((g) => g !== undefined)
	);

	/**
	 * Порядок ДОВІЛЬНИЙ, але з обличчями попереду.
	 *
	 * Дві вимоги разом: показуємо не всіх, і в першу чергу тих, у кого є
	 * портрет — інакше під обмеження раз за разом потрапляли б самі літери, і
	 * рядок виглядав би так, ніби фото немає ні в кого. Тому перемішуються ДВІ
	 * частини окремо, а вже потім склеюються: спершу з фото, далі решта.
	 *
	 * Перемішування живе в `$effect`, а НЕ в тілі компонента, і це не стиль:
	 * сторінки пререндеряться, тож на сервері порядок мусить лишитися тим
	 * самим, що й у готовому HTML. Перемішай його там — і гідратація побачить
	 * іншу розмітку, ніж прийшла з мережі. Той самий порядок міркувань, що в
	 * переліку груп (`galaxy-graduates/groups/+page.svelte`).
	 *
	 * Фішер—Йейтс, а не `sort(() => Math.random() - 0.5)`: другий дає нерівний
	 * розподіл (порівняння не транзитивне) і в частині рушіїв майже не рухає
	 * початок списку — тобто «випадковість», якої насправді немає.
	 */
	function shuffle<T>(list: T[]): T[] {
		const out = [...list];
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	/* До гідратації — стабільний порядок: спершу з портретами, у межах кожної
	 * частини як у даних. Пререндерена розмітка мусить мати ЯКИЙСЬ порядок, і
	 * осмислений кращий за довільний, якщо скрипт не дійде. */
	const byPhoto = $derived([
		...found.filter((g) => g.hasPhoto),
		...found.filter((g) => !g.hasPhoto)
	]);

	/*
	 * `svelte/prefer-writable-derived` тут пропонує рівно те, чого робити НЕ
	 * можна: `$derived` обчислюється і на сервері, тобто перемішає порядок у
	 * пререндереному HTML, а клієнт під час гідратації перемішає інакше — і
	 * розмітка розійдеться з тією, що приїхала з мережі. Правило цього не
	 * бачить, бо не знає, що вираз недетермінований.
	 *
	 * У переліку груп той самий патерн проходить лінт без виключення лише через
	 * дрібницю: там ефект читає модульну константу `GROUPS`, а не реактивне
	 * значення, тож правило не розпізнає в ньому похідну.
	 */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let mixed = $state<typeof byPhoto | null>(null);

	$effect(() => {
		mixed = [...shuffle(found.filter((g) => g.hasPhoto)), ...shuffle(found.filter((g) => !g.hasPhoto))];
	});

	const ordered = $derived(mixed ?? byPhoto);
	const people = $derived(ordered.slice(0, max));
	const hidden = $derived(ordered.slice(max));
</script>

{#if people.length}
	<ul class="mates" data-testid="{testIdPrefix}-list">
		{#each people as mate (mate.id)}
			{@const photo = mate.hasPhoto ? asset(`/graduates/${mate.slug}-96.webp`) : null}
			<li>
				<!--
					Посилання — лише туди, де сторінка справді є: анкету заповнили не всі,
					і кнопка в нікуди гірша за спокійний кружечок.
				-->
				{#if mate.code && linked}
					<a
						class="mates__item"
						href={localizedPath(graduateProfilePath(mate.code), lang)}
						title={mate.name}
						data-testid="{testIdPrefix}-link-{mate.id}"
					>
						{#if photo}
							<img src={photo} alt={mate.name} width="26" height="26" loading="lazy" />
						{:else}
							<span class="mates__letter" aria-hidden="true">{mate.name.slice(0, 1)}</span>
							<span class="sr-only">{mate.name}</span>
						{/if}
					</a>
				{:else}
					<span class="mates__item mates__item--plain" title={mate.name}>
						{#if photo}
							<img src={photo} alt={mate.name} width="26" height="26" loading="lazy" />
						{:else}
							<span class="mates__letter" aria-hidden="true">{mate.name.slice(0, 1)}</span>
							<span class="sr-only">{mate.name}</span>
						{/if}
					</span>
				{/if}
			</li>
		{/each}
		{#if hidden.length}
			<!--
				Скільки не вмістилося — числом, а не обрізаним кружечком: обрізане
				обличчя читається як помилка показу, а «+7» — як факт. Імена
				лишаються в `title`, тож нічого не зникає безслідно.
			-->
			<li>
				<span
					class="mates__item mates__more"
					title={hidden.map((g) => g.name).join(', ')}
					data-testid="{testIdPrefix}-more-badge"
				>+{hidden.length}</span>
			</li>
		{/if}
	</ul>
{/if}

<style>
	.mates {
		list-style: none;
		margin: 0;
		padding: 0 0.5rem 0.4rem;
		display: flex;
		/* Один ряд — саме тут, а не лише обмеженням числа: у вузькому контейнері
		   навіть обрізаний набір перенісся б, і блок знову став би двоповерховим. */
		flex-wrap: nowrap;
		justify-content: center;
		gap: 0.3rem;
		overflow: hidden;
		/*
		 * Згасання праворуч — ознака, що набір не вмістився ЦІЛКОМ.
		 *
		 * Числа «+N» для цього не досить: на вузькому екрані обрізається й воно
		 * саме, бо стоїть у кінці рядка. Обрізаний різко кружечок читається як
		 * поломка показу, згаслий — як «далі ще є».
		 */
		mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 14px), transparent 100%);
	}
	.mates__item {
		display: grid;
		flex-shrink: 0;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		overflow: hidden;
		background: rgb(140 180 255 / 0.12);
		border: 1px solid rgb(140 180 255 / 0.35);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			border-color 0.2s ease;
	}
	.mates__item:hover {
		transform: translateY(-2px);
		border-color: var(--accent-primary, #8cb4ff);
	}
	.mates__item--plain {
		opacity: 0.7;
	}
	.mates__item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.mates__more {
		width: auto;
		min-width: 26px;
		padding: 0 0.35rem;
		font-size: 0.68rem;
		font-weight: 700;
		color: #bfe0ff;
		flex-shrink: 0;
	}

	.mates__letter {
		font-size: 0.72rem;
		font-weight: 700;
		color: #bfe0ff;
		line-height: 1;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
