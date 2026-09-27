<script lang="ts">
	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'hexameter' }: Props = $props();

	type VersionKey = 'tkach' | 'ten';

	let activeVersion = $state<VersionKey>('tkach');
	let showCaesura = $state(false);

	const TKACH_LINES = [
		{ num: 1, text: 'Музо, повідай мені про бувалого мужа, що довго', caesura: 'Музо, повідай мені // про бувалого мужа, що довго' },
		{ num: 2, text: 'Світом блукав з того дня, як святий Іліон їм був знищен', caesura: 'Світом блукав з того дня, // як святий Іліон їм був знищен' },
		{ num: 3, text: 'Різних людей надивився і бачив міста їх та звички,', caesura: 'Різних людей надивився // і бачив міста їх та звички,' },
		{ num: 4, text: 'В морі ж багато біди він і тілом зазнав, і душею,', caesura: 'В морі ж багато біди // він і тілом зазнав, і душею,' },
		{ num: 5, text: 'Щоб повернутись додому із друзями разом та марно', caesura: 'Щоб повернутись додому // із друзями разом та марно' },
		{ num: 6, text: 'Прагнув своє товариство від гніву богів врятувати', caesura: 'Прагнув своє товариство // від гніву богів врятувати' },
		{ num: 7, text: 'Отже, загинули всі через власне зухвальство безтямне:', caesura: 'Отже, загинули всі // через власне зухвальство безтямне:' },
		{ num: 8, text: "З'ївши волів Геліоса, безумні, за те бог позбавив", caesura: "З'ївши волів Геліоса, // безумні, за те бог позбавив" },
		{ num: 9, text: 'Дня їх повернення у рідний край, то ж, богиня, повідай', caesura: 'Дня їх повернення у рідний край, // то ж, богиня, повідай' },
		{ num: 10, text: 'Що небудь нам, о Зевеса дочкА, Доброзичлива Муза!', caesura: 'Що небудь нам, // о Зевеса дочкА, Доброзичлива Муза!' }
	];

	const TEN_LINES = [
		{ num: 1, text: 'Музо, повідай мені про бувалого мужа, що довго', caesura: 'Музо, повідай мені // про бувалого мужа, що довго' },
		{ num: 2, text: 'Світом блукав, священну столицю троян зруйнувавши,', caesura: 'Світом блукав, // священну столицю троян зруйнувавши,' },
		{ num: 3, text: 'Всяких людей надивився, міста їх і звичаї бачив,', caesura: 'Всяких людей надивився, // міста їх і звичаї бачив,' },
		{ num: 4, text: 'В морі ж багато біди і тілом зазнав, і душею,', caesura: 'В морі ж багато біди // і тілом зазнав, і душею,' },
		{ num: 5, text: 'Щоб і себе врятувать, і друзів додому вернути.', caesura: 'Щоб і себе врятувать, // і друзів додому вернути.' },
		{ num: 6, text: 'Та не вберіг він свого товариства, хоч як того прагнув.', caesura: 'Та не вберіг він свого товариства, // хоч як того прагнув.' },
		{ num: 7, text: 'Марно загинули всі через власне зухвальство безтямне:', caesura: 'Марно загинули всі // через власне зухвальство безтямне:' },
		{ num: 8, text: "З'їли, безумні, волів вони Гелія Гіперіона,", caesura: "З'їли, безумні, волів // вони Гелія Гіперіона," },
		{ num: 9, text: 'Що понад нами, — за те дня повернення він їх позбавив.', caesura: 'Що понад нами, — за те // дня повернення він їх позбавив.' },
		{ num: 10, text: 'Дещо, богине, і нам розкажи про них, Зевсова доню.', caesura: 'Дещо, богине, і нам розкажи про них, // Зевсова доню.' }
	];

	const currentLines = $derived(activeVersion === 'tkach' ? TKACH_LINES : TEN_LINES);
</script>

<div class="hexameter-card" data-testid={`${testIdPrefix}-section`}>
	<div class="card-header">
		<div class="title-group">
			<span class="exercise-badge">Вправа 1</span>
			<h2 class="exercise-title">Гекзаметр</h2>
		</div>
		<p class="exercise-source">
			{#if activeVersion === 'tkach'}
				Гомер — «Одіссея» (заспів, адаптація від «Ткач Перекладач»)
			{:else}
				Гомер — «Одіссея» (заспів, переклад Бориса Тена)
			{/if}
		</p>
	</div>

	<div class="version-tabs" role="tablist" aria-label="Вибір версії тексту">
		<button
			type="button"
			role="tab"
			aria-selected={activeVersion === 'ten'}
			class="tab-btn"
			class:tab-btn--active={activeVersion === 'ten'}
			onclick={() => (activeVersion = 'ten')}
			data-testid={`${testIdPrefix}-version-ten-btn`}
		>
			переклад Бориса Тена
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={activeVersion === 'tkach'}
			class="tab-btn"
			class:tab-btn--active={activeVersion === 'tkach'}
			onclick={() => (activeVersion = 'tkach')}
			data-testid={`${testIdPrefix}-version-tkach-btn`}
		>
			адаптація від «Ткач Перекладач»
		</button>
	</div>

	<div class="guide-box">
		<div class="guide-title">
			<span class="guide-icon" aria-hidden="true">💨</span>
			<strong>Методика сценічної мови:</strong>
		</div>
		<ul class="guide-list">
			<li><strong>Дихання на опорі:</strong> один рядок читається на єдиному плавному видиху.</li>
			<li><strong>Цезура (пауза):</strong> всередині рядка відчуйте природну ритмічну цезуру для добору повітря.</li>
			<li><strong>Античний метр:</strong> дотримуйтесь урочистого, хвилеподібного дактилічного ритму.</li>
		</ul>
		<div class="guide-actions">
			<label class="toggle-label">
				<input
					type="checkbox"
					checked={showCaesura}
					onchange={(e) => (showCaesura = (e.target as HTMLInputElement).checked)}
					data-testid={`${testIdPrefix}-caesura-toggle`}
				/>
				<span>Позначити цезури (ритмічні паузи <code>//</code>)</span>
			</label>
		</div>
	</div>

	<div class="verses-container" data-testid={`${testIdPrefix}-verses-list`}>
		{#each currentLines as line (line.num)}
			<div class="verse-row">
				<span class="verse-num">{line.num}.</span>
				<p class="verse-text">
					{#if showCaesura}
						{line.caesura}
					{:else}
						{line.text}
					{/if}
				</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.hexameter-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1.25rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
	}
	.card-header { margin-bottom: 1.25rem; }
	.title-group { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
	.exercise-badge {
		background: var(--palette-blue);
		color: var(--palette-black);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
	}
	.exercise-title {
		margin: 0;
		font-size: clamp(1.4rem, 2.5vw, 1.8rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.exercise-source {
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
		color: var(--text-muted);
		font-style: italic;
	}
	.version-tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
		padding: 0.35rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		width: fit-content;
	}
	.tab-btn {
		background: transparent;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.tab-btn:hover { color: var(--text-title); }
	.tab-btn--active {
		background: var(--palette-blue);
		color: var(--palette-black);
		font-weight: 700;
		box-shadow: 0 2px 8px rgba(0, 181, 236, 0.25);
	}
	.guide-box {
		background: var(--color-surface);
		border-left: 4px solid var(--palette-blue);
		border-radius: 8px 12px 12px 8px;
		padding: 1rem 1.25rem;
		margin-bottom: 2rem;
	}
	.guide-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-title);
		font-size: 0.95rem;
		margin-bottom: 0.5rem;
	}
	.guide-list {
		margin: 0 0 1rem;
		padding-left: 1.25rem;
		font-size: 0.88rem;
		color: var(--text-main);
		line-height: 1.6;
	}
	.guide-actions { padding-top: 0.5rem; border-top: 1px dashed var(--color-border); }
	.toggle-label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-title);
		cursor: pointer;
	}
	.toggle-label input { accent-color: var(--palette-blue); cursor: pointer; }
	.toggle-label code {
		background: rgba(0, 0, 0, 0.06);
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		color: var(--palette-red);
		font-weight: bold;
	}
	.verses-container { display: flex; flex-direction: column; gap: 0.85rem; }
	.verse-row {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		transition: background 0.15s ease;
	}
	.verse-row:hover { background: var(--color-surface); }
	.verse-num {
		min-width: 24px;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--palette-blue);
		text-align: right;
		user-select: none;
	}
	.verse-text {
		margin: 0;
		font-size: clamp(1rem, 1.8vw, 1.15rem);
		line-height: 1.6;
		color: var(--text-main);
		font-weight: 500;
		letter-spacing: 0.01em;
	}
</style>
