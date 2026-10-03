<script lang="ts">
	interface Props {
		testIdPrefix?: string;
	}

	let { testIdPrefix = 'yarmarok' }: Props = $props();

	let highlightStress = $state(true);

	const introText = 'Захря́с майда́н…';

	const nounsText =
		'Захря́с га́рбами*, воза́ми, біда́ми*, кі́ньми, коро́вами, ві́вцями, вола́ми, теля́тами, горшка́ми, миска́ми, курми́, во́вною, лантуха́ми, хме́лем, сму́шками*, мате́рією, чобітьми́, цуке́рками, пря́никами, ква́сом, пи́вом, горі́лкою, гребі́нками*, ко́сами, шкі́рами, ре́менем*, чавуна́ми, пря́дивом, хустка́ми, полотно́м, дьо́гтем, га́сом, дра́нками, сорочка́ми, спідни́цями, килима́ми, щети́ною*, діжка́ми, ро́гами, ма́йками, во́ском, ме́дом, меля́сом*, тара́нею, оселе́дцями, коле́сами, хо́дами*, скло́м, я́йцями, запа́сками*, плахта́ми, пирога́ми, са́лом, м\'я́сом, ковбасо́ю, сма́женою ри́бою, ря́днами, скри́нями, гвіздка́ми, молотка́ми, свиньми́, крамаря́ми, цига́нами, бари́шниками, людьми́, ді́тьми і сліпця́ми…';

	const verbsText =
		'…І все це вору́шиться, ди́хає, ку́рить, гово́рить, кричи́ть, ла́ється, му́кає, ме́кає, ірже́, ігігі́кає, ремиґа́є, позіха́є, куві́кає, хре́ститься, божи́ться, матюка́ється, заприсяга́ється, па́хне, кудкуда́хтає, кво́кче, сма́лить одне́ о́дного по рука́х, гра́є на гармо́нію, на скри́пку, причиту́є*, п\'є ква́с, їсть тара́ню, "бу́дькає", лу́скає насі́ння і кру́титься на карусе́лі…';

	const glossary = [
		{ key: 'гарба', word: 'Гарба́', text: 'високий віз' },
		{ key: 'біда', word: 'Біда́', text: 'візок' },
		{ key: 'лантух', word: 'Ла́нтух', text: 'великий мішок із грубої тканини' },
		{ key: 'смушок', word: 'Сму́шок', text: 'хутро, одна шкурка' },
		{ key: 'гребінка', word: 'Гребі́нка', text: 'для розчісування волосся' },
		{ key: 'ремінь', word: 'Ре́мінь', text: 'довга смужка обробленої шкіри' },
		{ key: 'щетина', word: 'Щети́на', text: 'коротка цупка шерсть у деяких тварин' },
		{ key: 'меляс', word: 'Меля́с', text: 'кормова патока' },
		{ key: 'хід', word: 'Хі́д', text: 'нижня ходова частина воза (там подвійний наголос, але краще хода́ми)' },
		{ key: 'запаска', word: 'Запа́ска', text: 'жіночий одяг' },
		{ key: 'причитати', word: 'Причита́ти', text: 'голосно примовляти щось' }
	];

	function parseStressed(raw: string): Array<{ text: string; isStress: boolean }> {
		const parts: Array<{ text: string; isStress: boolean }> = [];
		const regex = /([аеєиіїоуюяАЕЄИІЇОУЮЯ]\u0301)/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(raw)) !== null) {
			if (match.index > lastIndex) {
				parts.push({ text: raw.slice(lastIndex, match.index), isStress: false });
			}
			parts.push({ text: match[1], isStress: true });
			lastIndex = regex.lastIndex;
		}
		if (lastIndex < raw.length) {
			parts.push({ text: raw.slice(lastIndex), isStress: false });
		}
		return parts;
	}
</script>

{#snippet renderFormatted(raw: string)}
	{#each parseStressed(raw) as chunk, i (i)}
		{#if chunk.isStress && highlightStress}
			<span class="stress">{chunk.text}</span>
		{:else}
			{chunk.text}
		{/if}
	{/each}
{/snippet}

<div class="yarmarok-card" data-testid={`${testIdPrefix}-section`}>
	<div class="card-header">
		<div class="title-group">
			<span class="exercise-badge">Вправа 2</span>
			<h2 class="exercise-title">Довгомовка «Ярмарок»</h2>
		</div>
		<p class="exercise-author">Остап Вишня</p>
	</div>

	<div class="toolbar">
		<label class="stress-toggle">
			<input
				type="checkbox"
				checked={highlightStress}
				onchange={(e) => (highlightStress = (e.target as HTMLInputElement).checked)}
				data-testid={`${testIdPrefix}-stress-toggle`}
			/>
			<span class="toggle-text">
				Підсвічувати правильні наголоси
				<span class="sample-stress">червоним</span>
			</span>
		</label>
	</div>

	<div class="content-box">
		<p class="intro-line">
			{@render renderFormatted(introText)}
		</p>

		<p class="text-paragraph">
			{@render renderFormatted(nounsText)}
		</p>

		<p class="text-paragraph">
			{@render renderFormatted(verbsText)}
		</p>
	</div>

	<div class="rule-container" data-testid={`${testIdPrefix}-rule-container`}>
		<div class="rule-icon" aria-hidden="true">💡</div>
		<div class="rule-content">
			<strong>Зверніть увагу:</strong> в однині і множині наголос може змінюватись!
			<span class="rule-example">
				({@render renderFormatted('гарба́')}, але {@render renderFormatted('га́рбами')})
			</span>
		</div>
	</div>

	<div class="glossary-section" data-testid={`${testIdPrefix}-glossary-list`}>
		<h3 class="glossary-title">Словничок рідковживаних слів:</h3>
		<ul class="glossary-list">
			{#each glossary as item (item.key)}
				<li class="glossary-item">
					<span class="glossary-word">
						*{@render renderFormatted(item.word)}
					</span>
					<span class="glossary-dash">—</span>
					<span class="glossary-desc">
						{@render renderFormatted(item.text)}
					</span>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.yarmarok-card {
		background: var(--bg-card);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		padding: clamp(1.25rem, 3vw, 2rem);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
	}
	.card-header {
		margin-bottom: 1.25rem;
	}
	.title-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}
	.exercise-badge {
		background: var(--palette-red);
		color: #ffffff;
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
	.exercise-author {
		margin: 0.25rem 0 0;
		font-size: 1rem;
		color: var(--text-muted);
		font-weight: 600;
	}
	.toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1.25rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}
	.stress-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-title);
		cursor: pointer;
		user-select: none;
	}
	.stress-toggle input {
		accent-color: var(--palette-red);
		cursor: pointer;
		width: 17px;
		height: 17px;
	}
	.sample-stress {
		color: light-dark(#b91c1c, #fca5a5);
		font-weight: 800;
	}
	.content-box {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: clamp(1rem, 2.5vw, 1.75rem);
		margin-bottom: 1.5rem;
	}
	.intro-line {
		font-size: clamp(1.1rem, 2vw, 1.25rem);
		font-weight: 700;
		color: var(--text-title);
		margin: 0 0 1rem;
		font-style: italic;
	}
	.text-paragraph {
		font-size: clamp(0.98rem, 1.6vw, 1.12rem);
		line-height: 1.85;
		color: var(--text-main);
		margin: 0 0 1.25rem;
		letter-spacing: 0.01em;
	}
	.text-paragraph:last-child {
		margin-bottom: 0;
	}
	.stress {
		color: light-dark(#b91c1c, #fca5a5);
		font-weight: 800;
	}
	.rule-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(249, 179, 29, 0.12);
		border-left: 4px solid var(--palette-orange);
		border-radius: 8px 12px 12px 8px;
		padding: 0.9rem 1.25rem;
		margin-bottom: 2rem;
		color: var(--text-title);
		font-size: 0.95rem;
	}
	.rule-icon {
		font-size: 1.4rem;
	}
	.rule-example {
		margin-left: 0.35rem;
		font-weight: 700;
	}
	.glossary-section {
		border-top: 1px solid var(--color-border);
		padding-top: 1.5rem;
	}
	.glossary-title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-title);
		margin: 0 0 1rem;
	}
	.glossary-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
		gap: 0.65rem 1.5rem;
	}
	.glossary-item {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		font-size: 0.92rem;
		line-height: 1.5;
	}
	.glossary-word {
		font-weight: 700;
		color: var(--text-title);
		white-space: nowrap;
	}
	.glossary-dash {
		color: var(--text-muted);
	}
	.glossary-desc {
		color: var(--text-main);
	}
</style>
