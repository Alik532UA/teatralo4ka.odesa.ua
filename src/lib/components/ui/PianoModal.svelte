<script lang="ts">
	import { onMount } from "svelte";
	import { fade, scale } from "svelte/transition";
	import { t } from "svelte-i18n";

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	// --- CONFIGURATION ---
	// You can easily change the range here
	const START_NOTE = "A3";
	const END_NOTE = "C5";
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
	let activeCodes = $state<Set<string>>(new Set());
	let viewMode = $state<'keyboard' | 'chords'>('keyboard');
	const audioFadeIntervals = new Map<string, any>();

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
			(audio as any).webkitPreservesPitch = false;
		} else if ('mozPreservesPitch' in audio) {
			(audio as any).mozPreservesPitch = false;
		}

		if (!isPartOfChord) nowPlaying = keyInfo.note;
		
		const nextActive = new Set(activeCodes);
		nextActive.add(code);
		activeCodes = nextActive;

		audio.volume = 1;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function stopNote(code: string) {
		if (!activeCodes.has(code)) return;

		const audio = document.querySelector(`audio[data-code="${code}"]`) as HTMLAudioElement;
		if (!audio) return;

		const nextActive = new Set(activeCodes);
		nextActive.delete(code);
		activeCodes = nextActive;

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

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen || e.repeat || viewMode !== 'keyboard') return;
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
		};
	});
</script>

{#if isOpen}
   <!-- svelte-ignore a11y_click_events_have_key_events -->
   <!-- svelte-ignore a11y_no_static_element_interactions -->
   <div 
   		class="piano-modal" 
		transition:fade={{ duration: 300 }} 
		onclick={(e) => e.target === e.currentTarget && onClose()} 
		data-testid="piano-modal-overlay-container"
	>
	   <button 
	   		class="close-btn" 
			onclick={onClose} 
			data-testid="piano-modal-close-button"
		>&times;</button>
       
	   <section id="wrap" data-testid="piano-modal-content-container">
		   <header class="piano-header" data-testid="piano-modal-header-group">
			   <h2 class="piano-hint" data-testid="piano-modal-hint-label">{$t("piano.hint")}</h2>
			   
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

				   <div class="nowplaying" data-testid="piano-nowplaying-display">
					   {#if nowPlaying}
						   <span class="note-name" data-testid="piano-note-name-label">
							   {viewMode === 'chords' ? nowPlaying : $t(`piano.notes.${nowPlaying}`)}
						   </span>
						   {#if viewMode === 'keyboard'}
							   <span class="note-divider">|</span>
							   <span class="note-symbol" data-testid="piano-note-symbol-label">{nowPlaying}</span>
						   {/if}
					   {/if}
				   </div>
			   </div>
		   </header>

		   <section id="main" data-testid="piano-modal-main-group">
			   {#if viewMode === 'keyboard'}
				   <div class="keys" data-testid="piano-keys-menu">
					   {#each keysData as key, i}
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
							   data-testid={`piano-key-${i}-button`}
						   >
							   <span class="hints">{key.hint}</span>
						   </div>
					   {/each}
				   </div>
			   {:else}
				   <div class="chords-grid" data-testid="piano-chords-menu">
					   {#each chordsData as chord, i}
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
							   data-testid={`piano-chord-${chord.name}-button`}
						   >
							   <span class="chord-name">{chord.name}</span>
						   </button>
					   {/each}
				   </div>
			   {/if}

			   {#each keysData as key}
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
		background: none;
		border: none;
		color: white;
		font-size: 3rem;
		cursor: pointer;
		z-index: 10001;
		line-height: 1;
		transition: transform 0.2s;
	}

	.close-btn:hover {
		transform: scale(1.1);
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
		color: white;
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
		bottom: 7px;
		transition: opacity .3s ease-out;
		font-size: 20px;
		pointer-events: none;
		color: #000;
		font-weight: 700;
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
