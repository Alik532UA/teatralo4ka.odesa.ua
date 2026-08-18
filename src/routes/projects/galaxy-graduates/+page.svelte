<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import GraduateGalaxy from '$lib/components/GraduateGalaxy.svelte';
	import GraduateCard from '$lib/components/GraduateCard.svelte';
	import { graduatePhoto, graduatePhotoSrcset, type GraduateIndexEntry } from '$lib/data/graduates';

	let { data } = $props();

	let selected = $state<GraduateIndexEntry | null>(null);
	let year = $state<number | 'all'>('all');

	const shown = $derived(
		year === 'all' ? data.graduates : data.graduates.filter((g) => g.graduationYear === year)
	);

	/**
	 * Локаль передається явно.
	 *
	 * `toLocaleString()` без аргументу бере локаль СИСТЕМИ, а не мову сайту — це
	 * заборонено правилом ESLint у цьому проєкті, і не даремно: помилку не видно
	 * саме там, де її шукають (у розробника система й сайт українською).
	 */
	const numberFormat = $derived(new Intl.NumberFormat($locale ?? 'uk'));
</script>

<svelte:head>
	<title>{$t('galaxy.title')} — {$t('seo.brandTitle')}</title>
	<meta name="description" content={$t('galaxy.description')} />
</svelte:head>

<section class="page-content container" data-testid="galaxy-page-section">
	<h1 data-testid="galaxy-page-title">{$t('galaxy.title')}</h1>
	<p class="lead" data-testid="galaxy-page-text">{$t('galaxy.description')}</p>

	<GraduateGalaxy onselect={(graduate) => (selected = graduate)} />

	<!--
		Перелік усіх випускників поруч із галактикою, а не замість неї.

		Галактика гарна для розглядання й безпорадна для «де мій однокурсник з
		2014 року». Плюс саме цей перелік потрапляє у прередерений HTML: вісімдесят
		імен, які бачить пошук, і повна клавіатурна доступність без жодного JS.
	-->
	<div class="roster" data-testid="galaxy-roster-section">
		<div class="roster__head">
			<h2 data-testid="galaxy-roster-title">
				{$t('galaxy.all')} <span class="roster__count" data-testid="galaxy-roster-count">{numberFormat.format(shown.length)}</span>
			</h2>

			<label class="roster__filter" for="galaxy-year">
				<span>{$t('galaxy.filterYear')}</span>
				<select
					id="galaxy-year"
					bind:value={year}
					data-testid="galaxy-year-select"
				>
					<option value="all">{$t('galaxy.allYears')}</option>
					{#each data.years as value (value)}
						<option {value}>{value}</option>
					{/each}
				</select>
			</label>
		</div>

		<ul class="roster__list" data-testid="galaxy-roster-list">
			{#each shown as graduate (graduate.slug)}
				<li data-testid="galaxy-roster-list-item-{graduate.slug}">
					<button
						type="button"
						class="roster__item"
						onclick={() => (selected = graduate)}
						data-testid="galaxy-roster-{graduate.slug}-btn"
					>
						<img
							class="roster__photo"
							src={graduatePhoto(graduate.slug, 96)}
							srcset={graduatePhotoSrcset(graduate.slug)}
							sizes="56px"
							width="56"
							height="56"
							loading="lazy"
							decoding="async"
							alt=""
						/>
						<span class="roster__name">{graduate.name}</span>
						{#if graduate.graduationYear}
							<span class="roster__year">{graduate.graduationYear}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</section>

<GraduateCard graduate={selected} onclose={() => (selected = null)} />

<style>
	.lead {
		max-width: 60ch;
		margin-bottom: 1.5rem;
	}

	.roster {
		margin-top: 2rem;
	}

	.roster__head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.roster__count {
		/* Токен, а не `opacity`. Прозорість тут виглядала «тихіше» й ламала
		   контраст: axe знайшов `color-contrast` на роках у переліку. Це той самий
		   клас, що вже записаний у PROJECT-CONTEXT — напівпрозорий текст дає
		   колір, якого в темах немає, і жоден замір токенів його не покриває. */
		color: var(--text-muted);
		font-weight: 400;
	}

	.roster__filter {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.roster__filter select {
		/* 44px — власний стандарт цілі дотику; гейт e2e/touch-targets це міряє. */
		min-height: 44px;
		padding: 0 0.5rem;
	}

	.roster__list {
		display: grid;
		/* min() навколо порога: гола довжина в minmax — це ПІДЛОГА, а не поріг,
		   і колонка лишалася б 240px у контейнері 200px (FLUID-SIZING-v8 § 1.1). */
		grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
		gap: 0.5rem;
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}

	.roster__item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		/* min-width: 0 — без нього нуль у minmax не має ефекту: флекс-елемент за
		   замовчуванням не стискається менше за вміст. */
		min-width: 0;
		min-height: 44px;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--color-border, #d0d5dd);
		border-radius: 0.6rem;
		background: none;
		color: inherit;
		cursor: pointer;
		text-align: left;
	}

	.roster__item:hover {
		border-color: var(--accent-primary, #00b5ec);
	}

	.roster__photo {
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
	}

	.roster__name {
		/* Довге прізвище не має розпирати картку — воно переноситься. */
		min-width: 0;
		overflow-wrap: anywhere;
		font-weight: 600;
	}

	.roster__year {
		margin-left: auto;
		flex-shrink: 0;
		/* Див. `.roster__count`: тут була `opacity: 0.6`, і саме на цих роках axe
		   і впав із [serious] color-contrast. */
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
