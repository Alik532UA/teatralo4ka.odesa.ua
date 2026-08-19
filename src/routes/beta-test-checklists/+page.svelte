<script lang="ts">
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { ui } from '$lib/controllers/ui.svelte';
	import {
		BETA_TABS,
		COVERAGE_ORDER,
		UI_TEXT,
		type Coverage,
		type Localized
	} from '$lib/data/betaChecklist';
	import {
		buildReport,
		clearMarks,
		countFresh,
		isStale,
		loadMarks,
		saveMarks,
		toggleMark,
		type Marks,
		type Vote
	} from '$lib/services/betaProgress';

	/**
	 * Службова сторінка для живих тестувальників (BETA-CHECKLIST-v8).
	 *
	 * Поза індексом і поза меню: `noindex` малює layout за переліком
	 * `config/hiddenRoutes.ts`, у мапі сайту її немає, у `robots.txt` стоїть
	 * `Disallow`. Це не таємниця — просто вона не для відвідувачів.
	 *
	 * ЛОКАТОРИ ВІДРІЗНЯЮТЬСЯ ВІД ТАБЛИЦІ КАНОНУ, і це не недогляд. Канон радить
	 * `beta-check-item` та `beta-vote-ok-btn` без ідентифікатора пункта — на цій
	 * сторінці такі назви дали б по двадцять три елементи на один локатор, а
	 * проєкт має гейт проти рантайм-дублікатів (`e2e/testid.spec.ts`). Тому
	 * ідентифікатор пункта входить у назву.
	 */
	const { data }: { data: { appVersion: string } } = $props();

	// `$derived`, а не копія: копія пропа — знімок першого значення
	// (SVELTE-CORE-v8 `SC-PROP-SNAPSHOT`; `svelte-check` про це попереджає).
	const version = $derived(data.appVersion);
	const lang = $derived(($locale as string) === 'en' ? 'en' : 'uk');
	const say = (text: Localized) => text[lang as 'uk' | 'en'];

	// Читається одразу, а не в `$effect`: `$state({})` плюс `$effect`, який його
	// перезаписує, — два кроки там, де достатньо одного. Умова `browser` не
	// декоративна: Node 25 має власний `localStorage`, тож під prerender читання
	// спрацювало б і запекло в HTML позначки з МАШИНИ ЗБІРКИ.
	let marks = $state<Marks>(browser ? loadMarks() : {});
	let activeTab = $state(BETA_TABS[0].id);
	let reportFallback = $state('');
	let reportHint = $state('');
	let clearArmed = $state(false);

	const tab = $derived(BETA_TABS.find((t) => t.id === activeTab) ?? BETA_TABS[0]);

	/**
	 * Порядок рівнів — `manual → testable → covered`, а всередині рівня
	 * зберігається порядок оголошення: він тематичний, і сортування «як
	 * зручніше» розсипало б розділи.
	 */
	const groups = $derived(
		COVERAGE_ORDER.map((level: Coverage) => ({
			level,
			checks: tab.checks.filter((c) => c.coverage === level)
		})).filter((g) => g.checks.length > 0)
	);

	const total = $derived(BETA_TABS.reduce((n, t) => n + t.checks.length, 0));
	const fresh = $derived(countFresh(marks, version));

	function vote(id: string, value: Vote) {
		marks = toggleMark(marks, id, value, version);
		saveMarks(marks);
	}

	async function copyReport() {
		const text = buildReport(marks, {
			version,
			nowIso: new Date().toISOString(),
			userAgent: navigator.userAgent,
			lang,
			theme: ui.theme
		});

		// Запасний шлях обов'язковий (§ 6.2). `navigator.clipboard` відмовляє
		// буденно: вкладка не у фокусі, немає дозволу, сторінка не через https. У
		// такому разі звіт мусить з'явитися текстом у полі поруч — інакше кнопка
		// виглядає натиснутою, а вся робота тестувальника зникає на останньому кроці.
		try {
			if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
			await navigator.clipboard.writeText(text);
			reportFallback = '';
			reportHint = say(UI_TEXT.reportCopied);
		} catch {
			reportFallback = text;
			reportHint = say(UI_TEXT.reportFallback);
		}
	}

	function doClear() {
		if (!clearArmed) {
			clearArmed = true;
			return;
		}
		clearMarks();
		marks = {};
		clearArmed = false;
		reportFallback = '';
		reportHint = '';
	}
</script>

<svelte:head>
	<title>{say(UI_TEXT.pageTitle)}</title>
</svelte:head>

<section class="beta" data-testid="beta-page-section">
	<h1 data-testid="beta-page-title">{say(UI_TEXT.pageTitle)}</h1>
	<p class="intro" data-testid="beta-intro-text">{say(UI_TEXT.intro)}</p>

	<p class="progress">
		{say(UI_TEXT.progress)}:
		<strong data-testid="beta-progress-value">{fresh} / {total}</strong>
		<span class="version">({version})</span>
	</p>

	<nav class="tabs" aria-label={say(UI_TEXT.pageTitle)}>
		{#each BETA_TABS as t (t.id)}
			<button
				type="button"
				class="tab"
				class:active={t.id === activeTab}
				aria-current={t.id === activeTab ? 'true' : undefined}
				data-testid="beta-tab-{t.id}-btn"
				onclick={() => (activeTab = t.id)}
			>
				{say(t.title)}
			</button>
		{/each}
	</nav>

	{#each groups as group (group.level)}
		<section class="level" data-testid="beta-level-{group.level}-section">
			<h2 class="level-title">{say(UI_TEXT.levels[group.level])}</h2>

			<ol class="checks">
				{#each group.checks as check (check.id)}
					{@const mark = marks[check.id]}
					<li class="check" data-testid="beta-check-{check.id}-item">
						<p class="category" data-testid="beta-check-{check.id}-category-text">
							{say(check.category)}
						</p>
						<p class="text" data-testid="beta-check-{check.id}-text">{say(check.text)}</p>

						{#if check.coverage === 'covered'}
							<p class="covered-by">{say(UI_TEXT.coveredBy)}: <code>{check.test}</code></p>
						{/if}

						<div class="votes">
							{#each ['fail', 'weird', 'ok'] as const as value (value)}
								<button
									type="button"
									class="vote vote-{value}"
									class:picked={mark?.vote === value}
									aria-pressed={mark?.vote === value}
									data-testid="beta-vote-{check.id}-{value}-btn"
									onclick={() => vote(check.id, value)}
								>
									{say(UI_TEXT.votes[value])}
								</button>
							{/each}
						</div>

						{#if isStale(mark, version)}
							<p class="stale" data-testid="beta-check-{check.id}-stale-hint">
								{say(UI_TEXT.stale)}: {mark.version}
							</p>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	<div class="actions">
		<button type="button" class="primary" data-testid="beta-report-btn" onclick={copyReport}>
			{say(UI_TEXT.report)}
		</button>
		<button type="button" class="danger" data-testid="beta-clear-btn" onclick={doClear}>
			{clearArmed ? say(UI_TEXT.clearConfirm) : say(UI_TEXT.clear)}
		</button>
	</div>

	{#if reportHint}
		<p class="report-hint" data-testid="beta-report-hint">{reportHint}</p>
	{/if}

	{#if reportFallback}
		<textarea
			class="report-input"
			readonly
			rows="12"
			data-testid="beta-report-input"
			value={reportFallback}
		></textarea>
	{/if}
</section>

<style>
	.beta {
		max-width: min(72rem, 100%);
		margin: 0 auto;
		padding: clamp(1rem, 3vw, 2.5rem);
		color: var(--text-main);
	}

	h1 {
		color: var(--text-title);
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		margin: 0 0 0.75rem;
	}

	.intro {
		max-width: 60ch;
		color: var(--text-muted);
		line-height: 1.6;
	}

	.progress {
		margin: 1.25rem 0;
	}

	.version {
		color: var(--text-muted);
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.tab {
		/* 44 px — власний стандарт проєкту для цілей дотику, а не мінімум WCAG. */
		min-height: 44px;
		padding: 0.5rem 1rem;
		border: 2px solid var(--border-main);
		border-radius: 0.5rem;
		background: var(--bg-surface);
		color: var(--text-main);
		cursor: pointer;
		font: inherit;
	}

	.tab.active {
		border-color: var(--accent-primary);
		background: var(--accent-primary);
		color: var(--text-on-accent);
		font-weight: 600;
	}

	.level {
		margin-bottom: 2rem;
	}

	.level-title {
		font-size: 1rem;
		color: var(--text-muted);
		text-transform: none;
		margin: 0 0 0.75rem;
	}

	.checks {
		list-style: decimal;
		padding-left: 1.5rem;
		margin: 0;
		display: grid;
		gap: 1rem;
	}

	.check {
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 0.75rem;
		padding: clamp(0.75rem, 2vw, 1.25rem);
		box-shadow: var(--shadow-main);
	}

	.category {
		margin: 0 0 0.25rem;
		font-size: 0.85rem;
		color: var(--accent-text);
		font-weight: 600;
	}

	.text {
		margin: 0 0 0.75rem;
		line-height: 1.6;
	}

	.covered-by {
		margin: 0 0 0.75rem;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.votes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/*
	 * Стан позначається НЕ лише кольором (ACCESSIBILITY-v8): вибраний варіант
	 * отримує ще й товщу рамку та напівжирний напис. Інакше він недоступний тому,
	 * хто кольори не розрізняє, — а це найчастіша вада зору серед чоловіків.
	 */
	.vote {
		min-height: 44px;
		padding: 0.4rem 0.9rem;
		border: 2px solid var(--border-main);
		border-radius: 0.5rem;
		background: var(--bg-surface);
		color: var(--text-main);
		cursor: pointer;
		font: inherit;
	}

	.vote.picked {
		border-width: 4px;
		font-weight: 700;
	}

	.vote-fail.picked {
		border-color: var(--warning-color);
	}

	.vote-weird.picked {
		border-color: var(--accent-text);
	}

	.vote-ok.picked {
		border-color: var(--accent-primary);
	}

	.stale {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--warning-color);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2rem;
	}

	.actions button {
		min-height: 44px;
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		border: 2px solid var(--border-main);
		background: var(--bg-surface);
		color: var(--text-main);
		cursor: pointer;
		font: inherit;
	}

	.actions .primary {
		border-color: var(--accent-primary);
		background: var(--accent-primary);
		color: var(--text-on-accent);
		font-weight: 600;
	}

	.actions .danger {
		border-color: var(--warning-color);
	}

	.report-hint {
		margin-top: 1rem;
		color: var(--accent-text);
	}

	.report-input {
		width: 100%;
		margin-top: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--border-main);
		border-radius: 0.5rem;
		background: var(--bg-surface);
		color: var(--text-main);
		font-family: monospace;
		font-size: 0.8rem;
	}
</style>
