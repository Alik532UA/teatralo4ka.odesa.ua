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
	 * ## Показуються ВСІ, а не лише ті, у кого є портрет
	 *
	 * Заміряно на складі груп: фото є у 62 із 91 членства, тож фільтр за
	 * наявністю знімка сховав би майже третину людей. Замість портрета — перша
	 * літера імені; тьмяність кружечка означає рівно те саме, що й у списку
	 * учасників вистави: сторінки в цієї людини ще немає.
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
	}

	let { ids, excludeId = '', linked = true, testIdPrefix }: Props = $props();

	const lang = $derived<'uk' | 'en'>($locale === 'en' ? 'en' : 'uk');

	/* Пошук за `id` по повному реєстру: він і так приходить на клієнт цілком, а
	 * невідомий ключ мовчки минається — інакше одна описка в даних валила б
	 * увесь рядок. */
	const people = $derived(
		ids
			.filter((id) => id !== excludeId)
			.map((id) => GRADUATES.find((g) => g.id === id))
			.filter((g) => g !== undefined)
	);
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
	</ul>
{/if}

<style>
	.mates {
		list-style: none;
		margin: 0;
		padding: 0 0.5rem 0.4rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.3rem;
	}
	.mates__item {
		display: grid;
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
