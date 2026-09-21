<script lang="ts">
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import { t } from "svelte-i18n";
	import { X } from "lucide-svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { captureKeyboard } from "$lib/services/keyboard";
	import { focusTrap } from "$lib/utils/focusTrap";
	import {
		TOTAL_ANTHEM_STEPS,
		SCHOOL_ANTHEM_SEQUENCE,
		ANTHEM_PAUSES,
		getAnthemStep,
		getAnthemStepY,
		getAnthemPauseY,
		type AnthemStep
	} from "$lib/data/pianoAnthem";

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	// `$props.id()`, а не лічильник і не Math.random: два піаніно на сторінці
	// дали б однаковий id і `aria-labelledby` вказував би на чужий заголовок
	// (SVELTE-CORE-v9 § 1.7).
	const hintId = $props.id();

	// --- CONFIGURATION ---
	// You can easily change the range here
	const START_NOTE = "A3";
	const END_NOTE = "D5";
	const AUDIO_BASE_URL = "https://carolinegabriel.com/demo/js-keyboard/sounds/";
	const AUDIO_FILE_OFFSET = 20; // If C4 (MIDI 60) is "040.wav", offset is 60 - 40 = 20

	const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	const WHITE_KEY_CODES = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote"];
	const BLACK_KEY_CODES = ["KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft"];
	const HINTS_WHITE = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"];
	const HINTS_BLACK = ["W", "E", "R", "T", "Y", "U", "I", "O", "P", "["];

	function getMidi(noteName: string): number {
		const match = noteName.match(/^([A-G]#?)(\d)$/);
		if (!match) return 0;
		const name = match[1];
		const octave = parseInt(match[2]);
		return (octave + 1) * 12 + NOTE_NAMES.indexOf(name);
	}

	function generateKeys() {
		const startMidi = getMidi(START_NOTE);
		const endMidi = getMidi(END_NOTE);
		const keys = [];
		let whiteIdx = 0;

		for (let midi = startMidi; midi <= endMidi; midi++) {
			const noteName = NOTE_NAMES[midi % 12];
			const octave = Math.floor(midi / 12) - 1;
			const isSharp = noteName.includes("#");
			
			if (!isSharp) {
				keys.push({
					midi,
					note: noteName,
					fullNote: `${noteName}${octave}`,
					code: WHITE_KEY_CODES[whiteIdx],
					hint: HINTS_WHITE[whiteIdx],
					sharp: false,
					whiteIndex: whiteIdx
				});
				whiteIdx++;
			} else {
				// Sharp keys are placed relative to the white key they follow
				const prevWhiteIdx = whiteIdx - 1;
				keys.push({
					midi,
					note: noteName,
					fullNote: `${noteName}${octave}`,
					code: BLACK_KEY_CODES[prevWhiteIdx],
					hint: HINTS_BLACK[prevWhiteIdx],
					sharp: true,
					whiteIndex: prevWhiteIdx
				});
			}
		}
		return keys;
	}

	const keysData = generateKeys();
	const totalWhiteKeys = keysData.filter(k => !k.sharp).length;
	const whiteKeyWidth = 100 / totalWhiteKeys;
	const blackKeyWidth = whiteKeyWidth * 0.6;

	const chordsConfig = [
		{ name: "C",  type: "major", notes: ["C4", "E4", "G4"] },
		{ name: "G",  type: "major", notes: ["B3", "D4", "G4"] }, // Used inversion to fit A3-C5 range
		{ name: "D",  type: "major", notes: ["D4", "F#4", "A4"] },
		{ name: "A",  type: "major", notes: ["A3", "C#4", "E4"] }, 
		{ name: "F",  type: "major", notes: ["F4", "A4", "C5"] },
		{ name: "Am", type: "minor", notes: ["A3", "C4", "E4"] }, 
		{ name: "Em", type: "minor", notes: ["E4", "G4", "B4"] },
		{ name: "Dm", type: "minor", notes: ["D4", "F4", "A4"] },
	];

	const chordsData = chordsConfig.map(chord => ({
		...chord,
		codes: chord.notes.map(note => keysData.find(k => k.fullNote === note)?.code).filter(Boolean) as string[]
	}));

	// --- STATE ---
	let nowPlaying = $state("");
	// SvelteSet: звичайний Set у $state не сповіщає про add/delete, тому
	// натиснуті клавіші доводилося копіювати цілим набором на кожну ноту.
	const activeCodes = new SvelteSet<string>();
	let viewMode = $state<'keyboard' | 'chords'>('keyboard');
	// Не стан: таблиця id таймерів згасання, яку читає лише код, ніколи розмітка.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const audioFadeIntervals = new Map<string, ReturnType<typeof setInterval>>();

	let anthemActive = $state(false);
	let anthemStepIndex = $state(0);
	let anthemCompleted = $state(false);
	let anthemCompleteTimer: ReturnType<typeof setTimeout> | null = null;

	const currentAnthemStep = $derived<AnthemStep | null>(
		anthemActive ? getAnthemStep(anthemStepIndex) : null
	);

	function startAnthem() {
		if (anthemCompleteTimer) clearTimeout(anthemCompleteTimer);
		viewMode = 'keyboard';
		anthemCompleted = false;
		anthemStepIndex = 0;
		anthemActive = true;
	}

	function stopAnthem() {
		if (anthemCompleteTimer) clearTimeout(anthemCompleteTimer);
		anthemActive = false;
		anthemStepIndex = 0;
		anthemCompleted = false;
	}

	$effect(() => {
		if (!isOpen && anthemActive) {
			stopAnthem();
		}
	});

	function getAudioSrc(midi: number) {
		// The server has samples from 040 (C4) to 056 (E5)
		// For A3 (57), A#3 (58), B3 (59) we will use C4 (60) and change playbackRate
		const sampleMidi = Math.max(60, midi);
		const fileIndex = (sampleMidi - AUDIO_FILE_OFFSET).toString().padStart(3, '0');
		return `${AUDIO_BASE_URL}${fileIndex}.wav`;
	}

	function startNote(code: string, isPartOfChord = false) {
		const keyInfo = keysData.find(k => k.code === code);
		if (!keyInfo) return;

		const audio = document.querySelector(`audio[data-code="${code}"]`) as HTMLAudioElement;
		if (!audio) return;

		if (audioFadeIntervals.has(code)) {
			clearInterval(audioFadeIntervals.get(code));
			audioFadeIntervals.delete(code);
		}

		// Calculate pitch shift if we are using a different sample
		// playbackRate = 2 ^ ((targetMidi - sampleMidi) / 12)
		const sampleMidi = Math.max(60, keyInfo.midi);
		audio.playbackRate = Math.pow(2, (keyInfo.midi - sampleMidi) / 12);
		
		// Ensure pitch changes with playbackRate (important for polyfilling low notes)
		if ('preservesPitch' in audio) {
			audio.preservesPitch = false;
		} else if ('webkitPreservesPitch' in audio) {
			(audio as HTMLAudioElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false;
		} else if ('mozPreservesPitch' in audio) {
			(audio as HTMLAudioElement & { mozPreservesPitch?: boolean }).mozPreservesPitch = false;
		}

		if (!isPartOfChord) nowPlaying = keyInfo.note;
		
		activeCodes.add(code);

		if (anthemActive && !isPartOfChord) {
			const target = getAnthemStep(anthemStepIndex);
			if (target && target.note === keyInfo.fullNote) {
				const nextIndex = anthemStepIndex + 1;
				if (nextIndex >= TOTAL_ANTHEM_STEPS) {
					anthemCompleted = true;
					anthemStepIndex = nextIndex;
					if (anthemCompleteTimer) clearTimeout(anthemCompleteTimer);
					anthemCompleteTimer = setTimeout(() => {
						stopAnthem();
					}, 2500);
				} else {
					anthemStepIndex = nextIndex;
				}
			}
		}

		audio.volume = 1;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function stopNote(code: string) {
		if (!activeCodes.has(code)) return;

		const audio = document.querySelector(`audio[data-code="${code}"]`) as HTMLAudioElement;
		if (!audio) return;

		activeCodes.delete(code);

		let volume = 1;
		const fadeInterval = setInterval(() => {
			volume -= 0.15;
			if (volume <= 0) {
				audio.volume = 0;
				audio.pause();
				clearInterval(fadeInterval);
				audioFadeIntervals.delete(code);
			} else {
				audio.volume = volume;
			}
		}, 20);
		
		audioFadeIntervals.set(code, fadeInterval);
	}

	function startChord(chordCodes: string[], chordName: string) {
		nowPlaying = chordName;
		chordCodes.forEach(c => startNote(c, true));
	}

	function stopChord(chordCodes: string[]) {
		chordCodes.forEach(c => stopNote(c));
	}

	/**
	 * Escape закриває піаніно — у ОБОХ режимах.
	 *
	 * Доти тут стояло пояснення «у режимі `keyboard` піаніно читає КОЖНУ клавішу
	 * як ноту, тож Escape там нота». Це неправда про власний код: нотами
	 * призначені рівно `WHITE_KEY_CODES` і `BLACK_KEY_CODES` — двадцять одна
	 * літера й дужка, — а `startNote('Escape')` не знаходить клавіші й виходить.
	 * Тобто Escape не робив нічого взагалі, і накладка лишалася єдиною на сайті,
	 * з якої немає виходу звичним жестом (ACCESSIBILITY-v9 § 4.4).
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.code === 'Escape') {
			e.preventDefault();
			// Інші накладки під цією не мусять закритися заодно: клавіатуру тримає
			// піаніно, і Escape належить йому.
			e.stopPropagation();
			onClose();
			return;
		}
		if (e.repeat || viewMode !== 'keyboard') return;
		startNote(e.code);
	}

	function handleKeyup(e: KeyboardEvent) {
		if (!isOpen || viewMode !== 'keyboard') return;
		stopNote(e.code);
	}

	onMount(() => {
		window.addEventListener("keydown", handleKeydown);
		window.addEventListener("keyup", handleKeyup);
		return () => {
			window.removeEventListener("keydown", handleKeydown);
			window.removeEventListener("keyup", handleKeyup);
			audioFadeIntervals.forEach((interval) => clearInterval(interval));
			if (anthemCompleteTimer) clearTimeout(anthemCompleteTimer);
		};
	});

	/*
	 * Поки піаніно відкрите, клавіатура належить ЙОМУ (`captureKeyboard`).
	 *
	 * Без цього літери сайту працювали поверх нот, і збіг тут не випадковий, а
	 * повний: `KeyL` — біла клавіша й водночас перемикач мови, тобто одне
	 * натискання посеред гри переносило людину на `/en/…` і піаніно зникало;
	 * `KeyT` — чорна клавіша й перемикач теми; `KeyG`, `KeyH`, `KeyJ` — білі
	 * клавіші й службові серії по сім натискань; `KeyR` — чорна клавіша й
	 * аварійне скидання. Захист `isTypingTarget` тут не спрацьовує за побудовою:
	 * піаніно не поле вводу.
	 *
	 * `$effect` на `isOpen`, а не `onMount`: компонент змонтований завжди (у
	 * підвалі стоїть `<PianoModal isOpen={…}>`), а забирати клавіатуру треба лише
	 * на час, поки накладка відкрита. Cleanup віддає її назад — саме тому
	 * `captureKeyboard` повертає функцію, а не має окремої пари `release()`.
	 */
	$effect(() => {
		if (!isOpen) return;
		return captureKeyboard();
	});
</script>

{#if isOpen}
   <!--
		Клік по тлу лише ДУБЛЮЄ кнопку × — вона тут же й доступна з клавіатури,
		як і Escape (`handleKeydown`).

		`role="dialog"` + `aria-modal` + пастка фокуса — тим самим набором, що й
		решта модалок проєкту. Доти піаніно було ЄДИНИМ файлом `*Modal*` без
		`aria-modal`, і через це його не бачив інваріант `src/modal-focus.test.ts`:
		він перебирає модалки саме за цим атрибутом, тобто перевіряв лише тих, хто
		вже зізнався. Мовчазна відсутність читалася як «модалок без пастки немає».

		`tabindex="-1"`, а не `0`: діалог має бути фокусованим програмно — пастка
		ставить на нього фокус при відкритті, — але власної зупинки в Tab-порядку
		не має. `focusTrap` саме за `tabindex="-1"` і відрізняє контейнер від
		вмісту, який має входити в цикл.
   -->
   <!--
		Обидва придушення — з причинами, а не «щоб не блимало».

		`a11y_click_events_have_key_events`: клік по тлу дублює кнопку ×, і саме
		вона, а не тло, доступна з клавіатури; те саме робить Escape.

		`a11y_no_static_element_interactions`: клавіші інструмента — це `<div>` із
		`pointerdown`. Кнопками їх зробити не можна не через лінь: `<button>` дає
		Tab-зупинку, а їх тут двадцять одна, і всі всередині модалки з пасткою
		фокуса — тобто Tab по діалогу перетворився б на прохід по клавіатурі
		піаніно. З клавіатури інструмент грається інакше й краще: ряд
		`A S D F G H J K L ; '` (білі) і `W E R T Y U I O P [` (чорні), підписи
		видно на самих клавішах. Кнопка × і перемикач режимів у Tab-порядку є.
   -->
   <!-- svelte-ignore a11y_click_events_have_key_events -->
   <!-- svelte-ignore a11y_no_static_element_interactions -->
   <div
   		class="piano-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby={hintId}
		tabindex="-1"
		{@attach focusTrap()}
		transition:fade={{ duration: 300 }}
		onclick={(e) => e.target === e.currentTarget && onClose()}
		data-testid="piano-modal-overlay-container"
	>
	   <button
			type="button"
			class="close-btn"
			onclick={onClose}
			aria-label={$t('common.close')}
			data-testid="piano-modal-close-btn"
		>
			<X size={32} aria-hidden="true" />
		</button>

	   <section id="wrap" data-testid="piano-modal-content-container">
		   <header class="piano-header" data-testid="piano-modal-header">
			   <h2 class="piano-hint" id={hintId} data-testid="piano-modal-hint">{$t("piano.hint")}</h2>
			   
			   <div class="controls-wrapper">
				   <div class="view-toggle">
					   <button 
							class="toggle-btn" 
							class:active={viewMode === 'keyboard'} 
							onclick={() => viewMode = 'keyboard'}
							data-testid="piano-mode-keyboard-btn"
						>
						   {$t("piano.mode.keyboard")}
					   </button>
					   <button 
							class="toggle-btn" 
							class:active={viewMode === 'chords'} 
							onclick={() => viewMode = 'chords'}
							data-testid="piano-mode-chords-btn"
						>
						   {$t("piano.mode.chords")}
					   </button>
				   </div>

				   <div class="nowplaying" data-testid="piano-nowplaying-value">
					   {#if nowPlaying}
						   <span class="note-name" data-testid="piano-note-name-value">
							   {viewMode === 'chords' ? nowPlaying : $t(`piano.notes.${nowPlaying}`)}
						   </span>
						   {#if viewMode === 'keyboard'}
							   <span class="note-divider">|</span>
							   <span class="note-symbol" data-testid="piano-note-symbol-value">{nowPlaying}</span>
						   {/if}
					   {/if}
				   </div>
			   </div>
		   </header>

		   <section id="main" data-testid="piano-modal-main-section">
			   {#if viewMode === 'keyboard'}
				   <div class="keys" data-testid="piano-keys-menu">
					   <!-- midi, а не code: код клавіатури береться з масиву фіксованої
					        довжини і став би undefined, якби діапазон нот розширили,
					        а кілька undefined як ключ — це падіння в рантаймі. -->
					   {#each keysData as key, i (key.midi)}
						   <div 
							   class="key" 
							   class:sharp={key.sharp} 
							   class:playing={activeCodes.has(key.code)}
							   style={key.sharp ? `left: ${(key.whiteIndex + 1) * whiteKeyWidth - (blackKeyWidth / 2)}%; width: ${blackKeyWidth}%;` : `width: ${whiteKeyWidth}%;`}
							   data-code={key.code} 
							   data-note={key.note}
							   onpointerdown={(e) => {
								   e.preventDefault();
								   startNote(key.code);
							   }}
							   onpointerup={() => stopNote(key.code)}
							   onpointerleave={() => stopNote(key.code)}
							   data-testid={`piano-key-${i}-btn`}
						   >
							   <span class="hints">{key.hint}</span>
							   <span 
								   class="indicator-barrel" 
								   class:sharp={key.sharp}
								   class:lit={anthemActive && currentAnthemStep?.note === key.fullNote}
								   class:completed={anthemCompleted}
								   aria-hidden="true"
								   data-testid={`piano-bulb-badge-${key.code}`}
							   ></span>
						   </div>
					   {/each}
				   </div>

				   {#if anthemActive}
					   <div class="anthem-timeline" data-testid="piano-anthem-timeline-container">
						   {#if anthemCompleted}
							   <div class="anthem-completed-msg" transition:fade={{ duration: 200 }}>
								   ✨ {$t('piano.anthem.completed')}
							   </div>
						   {:else}
							   <div class="anthem-cascade" aria-label="Послідовність нот гімну">
								   {#each ANTHEM_PAUSES as pause, pIdx (pause.id)}
									   {@const pauseY = getAnthemPauseY(pIdx, anthemStepIndex)}
									   {#if pause.afterStepId >= anthemStepIndex - 1}
										   <div
											   class="anthem-pause-marker"
											   class:passed={pause.afterStepId < anthemStepIndex}
											   style="top: {pauseY}px;"
											   aria-label="пауза"
										   >
											   <span class="pause-line"></span>
											   <span class="pause-text">⏸ {$t('common.pause')}</span>
											   <span class="pause-line"></span>
										   </div>
									   {/if}
								   {/each}

								   {#each SCHOOL_ANTHEM_SEQUENCE as step (step.id)}
									   {@const stepY = getAnthemStepY(step.id, anthemStepIndex)}
									   {#if step.id >= anthemStepIndex - 1}
										   <span 
											   class="future-step-barrel" 
											   class:sharp={step.sharp}
											   class:lit={step.id === anthemStepIndex}
											   class:passed={step.id < anthemStepIndex}
											   style="left: {(step.sharp ? step.whiteIndex + 1 : step.whiteIndex + 0.5) * whiteKeyWidth}%; top: {stepY}px;" 
											   data-note={step.note}
											   data-step-id={step.id}
											   aria-hidden="true"
										   ></span>
									   {/if}
								   {/each}
							   </div>
						   {/if}

						   <button 
							   type="button" 
							   class="anthem-exit-btn" 
							   onclick={stopAnthem} 
							   aria-label={$t('piano.anthem.reset')} 
							   title={$t('piano.anthem.reset')} 
							   data-testid="piano-anthem-exit-btn"
						   >
							   <X size={16} aria-hidden="true" />
						   </button>
					   </div>
				   {:else}
					   <div class="anthem-controls" data-testid="piano-anthem-controls-container">
						   <button 
							   type="button" 
							   class="anthem-btn" 
							   onclick={startAnthem} 
							   data-testid="piano-anthem-btn"
						   >
							   🎵 {$t('piano.anthem.button')}
						   </button>
					   </div>
				   {/if}
			   {:else}
				   <div class="chords-grid" data-testid="piano-chords-menu">
					   {#each chordsData as chord (chord.name)}
						   <button 
							   class="chord-btn" 
							   class:minor={chord.type === 'minor'}
							   class:playing={chord.codes.every(c => activeCodes.has(c))}
							   onpointerdown={(e) => {
								   e.preventDefault();
								   startChord(chord.codes, chord.name);
							   }}
							   onpointerup={() => stopChord(chord.codes)}
							   onpointerleave={() => stopChord(chord.codes)}
							   data-testid={`piano-chord-${chord.name}-btn`}
						   >
							   <span class="chord-name">{chord.name}</span>
						   </button>
					   {/each}
				   </div>
			   {/if}

			   {#each keysData as key (key.midi)}
				   <audio data-code={key.code} src={getAudioSrc(key.midi)} preload="auto"></audio>
			   {/each}
		   </section>
	   </section>
   </div>
{/if}

<style>
	.piano-modal {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		font-family: var(--font-main);
		-webkit-font-smoothing: antialiased;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.close-btn {
		position: absolute;
		top: 20px;
		right: 30px;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
		z-index: 10001;
	}

	.close-btn:hover {
		/* Оберт і масштаб — спільне правило в global.css (UI-ELEMENTS-v9 § 1.1). */
		opacity: 0.85;
	}

	#wrap {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 1200px;
		padding: 20px;
		animation: modalSlideIn 0.3s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			transform: scale(0.95) translateY(-20px);
			opacity: 0;
		}
		to {
			transform: scale(1) translateY(0);
			opacity: 1;
		}
	}

	@keyframes modalSlideInPortrait {
		from {
			transform: rotate(90deg) scale(0.95) translateY(-20px);
			opacity: 0;
		}
		to {
			transform: rotate(90deg) scale(1) translateY(0);
			opacity: 1;
		}
	}

	.piano-header {
		margin-bottom: 30px;
	}

	.controls-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}

	.view-toggle {
		display: flex;
		background: rgba(255, 255, 255, 0.1);
		padding: 4px;
		border-radius: 12px;
		gap: 4px;
	}

	.toggle-btn {
		padding: 8px 24px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-btn.active {
		background: var(--accent-primary);
		color: var(--text-on-accent);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
	}

	h2 {
		color: #fff;
		font-size: clamp(16px, 3vw, 24px);
		font-style: italic;
		font-weight: 400;
		margin: 0;
		font-family: var(--font-main);
	}

	.nowplaying {
		font-size: clamp(60px, 10vw, 120px);
		line-height: 1;
		color: #eee;
		transition: all .07s ease;
		min-height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
	}

	.note-name {
		min-width: 300px;
		text-align: right;
	}

	.note-symbol {
		min-width: 150px;
		text-align: left;
	}

	.note-divider {
		color: rgba(255, 255, 255, 0.3);
	}

	.keys {
		display: block;
		width: 100%;
		height: 350px;
		max-width: 880px;
		position: relative;
		margin: 40px auto 0;
	}

	.key {
		position: relative;
		border: 4px solid black;
		border-radius: .5rem;
		transition: all .07s ease;
		display: block;
		box-sizing: border-box;
		z-index: 2;
		cursor: pointer;
	}

	.key:not(.sharp) {
		float: left;
		height: 100%;
		background: rgba(255, 255, 255, .8);    
	}

	.key.sharp {
		position: absolute;
		height: 60%;
		background: #000;
		color: #eee;
		top: 0;
		z-index: 3;
	}

	.playing {
		transform: scale(.95);
		border-color: #028ae9;
		box-shadow: 0 0 1rem #028ae9;
		background: #028ae9 !important;
	}

	.hints {
		display: block;
		width: 100%;
		opacity: 0;
		position: absolute;
		bottom: 8px;
		transition: opacity .3s ease-out;
		font-size: 20px;
		pointer-events: none;
		color: #000;
		font-weight: 700;
	}

	.indicator-barrel {
		position: absolute;
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		width: 32px;
		height: 8px;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.28);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		pointer-events: none;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		z-index: 5;
	}

	.indicator-barrel.sharp {
		top: calc(100% + 4px);
		width: 22px;
		height: 6px;
	}

	.indicator-barrel.lit {
		background: #ffcc00;
		border-color: #fff;
		box-shadow: 0 0 10px #ffcc00, 0 0 20px #ff9900;
		animation: barrelPulse 0.8s ease-in-out infinite alternate;
	}

	.indicator-barrel.completed {
		background: #00ff88;
		border-color: #fff;
		box-shadow: 0 0 10px #00ff88, 0 0 20px #00cc66;
	}

	@keyframes barrelPulse {
		from {
			transform: translateX(-50%) scale(1);
			box-shadow: 0 0 8px #ffcc00, 0 0 16px #ff9900;
		}
		to {
			transform: translateX(-50%) scale(1.15);
			box-shadow: 0 0 14px #ffdd33, 0 0 26px #ff8800;
		}
	}

	.anthem-controls {
		margin: 32px auto 0;
		display: flex;
		justify-content: center;
		width: 100%;
		max-width: 880px;
	}

	.anthem-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 22px;
		font-size: 15px;
		font-weight: 600;
		font-family: inherit;
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
		border: 2px solid rgba(255, 255, 255, 0.28);
		border-radius: 9999px;
		cursor: pointer;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.anthem-btn:hover {
		background: rgba(255, 255, 255, 0.22);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-1px);
	}

	.anthem-timeline {
		position: relative;
		width: 100%;
		max-width: 880px;
		height: 180px;
		margin: 8px auto 0;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 140px, transparent 180px);
		mask-image: linear-gradient(to bottom, black 0%, black 140px, transparent 180px);
	}

	.anthem-cascade {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.future-step-barrel {
		position: absolute;
		transform: translateX(-50%);
		width: 32px;
		height: 8px;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.45);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
		pointer-events: none;
		transition: top 0.5s cubic-bezier(0.22, 1, 0.36, 1),
		            opacity 0.4s ease-out,
		            background-color 0.4s ease-out,
		            border-color 0.4s ease-out,
		            box-shadow 0.4s ease-out,
		            transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		z-index: 4;
	}

	.future-step-barrel.lit {
		background: #ffcc00;
		border-color: #fff;
		box-shadow: 0 0 10px #ffcc00, 0 0 20px #ff9900;
		animation: barrelPulse 0.8s ease-in-out infinite alternate;
		z-index: 6;
	}

	.future-step-barrel.passed {
		opacity: 0;
		transform: translateX(-50%) scale(0.85);
		pointer-events: none;
	}

	.future-step-barrel.sharp {
		width: 22px;
		height: 6px;
	}

	.anthem-pause-marker {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		width: 85%;
		max-width: 500px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		pointer-events: none;
		transition: top 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease-out;
		z-index: 3;
	}

	.anthem-pause-marker.passed {
		opacity: 0;
		pointer-events: none;
	}

	.pause-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
	}

	.pause-text {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.55);
		background: rgba(0, 0, 0, 0.5);
		padding: 2px 10px;
		border-radius: 9999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		backdrop-filter: blur(4px);
	}

	.anthem-completed-msg {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		font-size: 1.25rem;
		font-weight: 700;
		color: #00ff88;
		text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
	}

	.anthem-exit-btn {
		position: absolute;
		right: 4px;
		top: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		z-index: 10;
	}

	.anthem-exit-btn:hover {
		background: rgba(255, 255, 255, 0.25);
		color: #fff;
		transform: scale(1.08);
	}

	.key.sharp .hints {
		color: #fff;
	}

	.keys:hover .hints {
		opacity: 1;
	}

	/* --- Chords Grid --- */
	.chords-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20px;
		width: 100%;
		max-width: 880px;
		margin: 40px auto 0;
	}

	.chord-btn {
		width: 100%;
		min-height: 120px;
		padding: 20px;
		background: var(--color-surface);
		border: 4px solid var(--text-title);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
	}

	.chord-name {
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--text-title);
		font-family: var(--font-heading);
	}

	.chord-btn.minor {
		border-style: dashed;
		opacity: 0.9;
	}

	.chord-btn.playing {
		transform: scale(0.92);
		background: var(--accent-primary);
		border-color: white;
		box-shadow: 0 0 30px var(--accent-primary);
	}

	.chord-btn.playing .chord-name {
		color: white;
	}

	/* --- MOBILE OPTIMIZATIONS --- */
	@media (max-width: 768px) {
		.piano-hint, .hints {
			display: none !important;
		}

		@media (orientation: portrait) {
			#wrap {
				width: 90vh;
				height: 95vw;
				transform: rotate(90deg);
				position: absolute;
				top: 50%;
				left: 50%;
				translate: -50% -50%;
				padding: 10px;
				animation: modalSlideInPortrait 0.3s ease-out;
				display: flex;
				flex-direction: column;
			}
			#main {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: center;
			}
			.controls-wrapper {
				flex-direction: row;
				justify-content: space-between;
				align-items: center;
				padding: 0 20px;
				gap: 10px;
			}
			.view-toggle {
				flex-shrink: 0;
			}
			.keys {
				height: auto;
				flex: 1;
				margin-top: 10px;
			}
			.anthem-timeline {
				height: 120px;
				margin-top: 4px;
			}
			.future-step-barrel {
				width: 22px;
				height: 6px;
			}
			.pause-text {
				font-size: 9px;
				padding: 1px 6px;
			}
			.chords-grid {
				width: 100%;
				max-width: none;
				height: auto;
				flex: 1;
				margin-top: 10px;
				gap: 12px;
				grid-template-columns: repeat(4, 1fr);
				overflow-y: auto;
				padding: 5px;
			}
			.chord-btn {
				width: 100%;
				aspect-ratio: auto;
				min-height: 60px;
				padding: 15px 5px;
				border-radius: 12px;
				border-width: 3px;
			}
			.chord-name { font-size: 1.2rem; }
			.nowplaying {
				min-height: 40px;
				font-size: 40px;
				gap: 10px;
				flex: 1;
				justify-content: flex-end;
			}
			.note-name { min-width: auto; text-align: right; }
			.note-symbol { min-width: auto; text-align: left; }
		}

		@media (orientation: landscape) {
			#wrap {
				max-width: 100%;
				padding: 5px;
			}
			.keys {
				height: 200px;
			}
			.anthem-timeline {
				height: 110px;
				margin-top: 4px;
			}
			.future-step-barrel {
				width: 22px;
				height: 6px;
			}
			.pause-text {
				font-size: 9px;
				padding: 1px 6px;
			}
			.chords-grid {
				width: 100%;
				max-width: none;
				height: auto;
				max-height: 50vh;
				gap: 12px;
				margin-top: 10px;
				grid-template-columns: repeat(4, 1fr);
				overflow-y: auto;
				padding: 5px;
			}
			.chord-btn {
				width: 100%;
				aspect-ratio: auto;
				min-height: 50px;
				padding: 12px 5px;
				border-radius: 10px;
				border-width: 3px;
			}
			.chord-name { font-size: 1rem; }
			.nowplaying {
				min-height: 40px;
				font-size: 30px;
				gap: 10px;
			}
			.note-name { min-width: 100px; }
			.note-symbol { min-width: 50px; }
		}

		.key.sharp {
			height: 55%;
		}
	}
</style>
