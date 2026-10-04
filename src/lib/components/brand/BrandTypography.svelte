<script lang="ts">
	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'brand-typography' }: Props = $props();

	let sampleText = $state('Театр починається з дитинства та натхнення');
	let fontSize = $state(28);

	const weights = [
		{
			weight: '700',
			name: 'Bold (700)',
			role: 'Головні заголовки сторінок (H1, H2), афіші, дати премʼєр та акцентні цифри.',
			sample: 'Одеська дитяча театральна школа'
		},
		{
			weight: '500',
			name: 'Medium (500)',
			role: 'Підзаголовки (H3, H4), навігаційне меню, назви ролей, кнопки дій та бейджі.',
			sample: 'Акторська майстерність, сценічна мова та вокал'
		},
		{
			weight: '400',
			name: 'Regular (400)',
			role: 'Основний масив тексту, описи вистав, біографії випускників та документація.',
			sample: 'Школа відкриває двері у світ театрального мистецтва та високої культури.'
		}
	];

	const alphabetUk = 'Аа Бб Вв Гг Ґґ Дд Ее Єє Жж Зз Ии Іі Її Йй Кк Лл Мм Нн Оо Пп Рр Сс Тт Уу Фф Хх Цц Чч Шш Щщ Ьь Юю Яя';
	const alphabetEn = 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789';
</script>

<div class="brand-type-card" data-testid={`${testIdPrefix}-card`}>
	<div class="section-heading">
		<span class="badge">Шрифт</span>
		<h2 class="section-title">Типографіка — e-Ukraine</h2>
		<p class="section-desc">
			Офіційною гарнітурою сайту та фірмового стилю є <strong>e-Ukraine</strong> — сучасний, виразний та відкритий український геометричний гротеск.
		</p>
	</div>

	<div class="weights-showcase">
		{#each weights as w (w.weight)}
			<div class="weight-row" data-testid={`${testIdPrefix}-weight-row-${w.weight}`}>
				<div class="weight-meta">
					<strong class="weight-name">{w.name}</strong>
					<span class="weight-role">{w.role}</span>
				</div>
				<p class="weight-sample" style:font-weight={w.weight}>
					{w.sample}
				</p>
			</div>
		{/each}
	</div>

	<div class="interactive-tester">
		<div class="tester-header">
			<label for="sample-text-input" class="tester-label">Інтерактивний перегляд шрифту:</label>
			<div class="slider-group">
				<span class="size-label">{fontSize}px</span>
				<input
					type="range"
					min="16"
					max="48"
					bind:value={fontSize}
					class="size-slider"
					aria-label="Розмір шрифту перегляду"
				/>
			</div>
		</div>

		<input
			id="sample-text-input"
			type="text"
			bind:value={sampleText}
			class="tester-input"
			placeholder="Введіть свій текст для перевірки шрифту..."
		/>

		<div class="tester-preview-box">
			<p class="preview-text preview-bold" style:font-size="{fontSize}px">
				{sampleText || ' '}
			</p>
			<p class="preview-text preview-medium" style:font-size="{Math.max(14, fontSize - 6)}px">
				{sampleText || ' '}
			</p>
		</div>
	</div>

	<div class="glyphs-box">
		<span class="glyphs-title">Абетка та символи:</span>
		<p class="glyphs-row">{alphabetUk}</p>
		<p class="glyphs-row glyphs-en">{alphabetEn}</p>
	</div>
</div>

<style>
	.brand-type-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1.25rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
	}
	.section-heading {
		margin-bottom: 2rem;
	}
	.badge {
		background: var(--palette-blue);
		color: var(--palette-black);
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
	}
	.section-title {
		margin: 0.5rem 0 0.25rem;
		font-size: clamp(1.4rem, 2.5vw, 1.8rem);
		font-weight: 800;
		color: var(--text-title);
	}
	.section-desc {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text-muted);
		max-width: 720px;
	}
	.weights-showcase {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		margin-bottom: 2.5rem;
	}
	.weight-row {
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.weight-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.weight-name {
		color: var(--accent-text);
		font-size: 0.95rem;
	}
	.weight-role {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.weight-sample {
		margin: 0;
		font-size: clamp(1.05rem, 1.8vw, 1.25rem);
		line-height: 1.4;
		color: var(--text-title);
	}
	.interactive-tester {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 1.25rem;
		margin-bottom: 2rem;
	}
	.tester-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.tester-label {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-title);
	}
	.slider-group {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.size-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
		min-width: 38px;
		text-align: right;
	}
	.size-slider {
		width: 100px;
		accent-color: var(--palette-blue);
		cursor: pointer;
	}
	.tester-input {
		width: 100%;
		padding: 0.65rem 0.9rem;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--bg-card);
		font-size: 0.95rem;
		color: var(--text-main);
		margin-bottom: 1rem;
		box-sizing: border-box;
	}
	.tester-preview-box {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1.25rem;
		overflow-x: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.preview-text {
		margin: 0;
		color: var(--text-title);
		line-height: 1.35;
		word-break: break-word;
	}
	.preview-bold {
		font-weight: 700;
	}
	.preview-medium {
		font-weight: 500;
		color: var(--text-muted);
	}
	.glyphs-box {
		border-top: 1px solid var(--color-border);
		padding-top: 1.25rem;
	}
	.glyphs-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		display: block;
		margin-bottom: 0.5rem;
	}
	.glyphs-row {
		margin: 0 0 0.35rem;
		font-size: 1rem;
		line-height: 1.6;
		letter-spacing: 0.08em;
		color: var(--text-main);
	}
	.glyphs-en {
		color: var(--text-muted);
		font-size: 0.92rem;
	}
</style>
