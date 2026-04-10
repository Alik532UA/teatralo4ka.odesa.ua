<script lang="ts">
	import { onMount } from "svelte";
	import { fade, scale } from "svelte/transition";
	import { t } from "svelte-i18n";

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let nowPlaying = $state("");
	let activeKeys = $state<Set<number>>(new Set());
	let viewMode = $state<'keyboard' | 'chords'>('keyboard');
	const audioFadeIntervals = new Map<number, any>();

	const keysData = [
		{ keyCode: 65, note: "C", hint: "A", sharp: false },
		{ keyCode: 87, note: "C#", hint: "W", sharp: true },
		{ keyCode: 83, note: "D", hint: "S", sharp: false },
		{ keyCode: 69, note: "D#", hint: "E", sharp: true },
		{ keyCode: 68, note: "E", hint: "D", sharp: false },
		{ keyCode: 70, note: "F", hint: "F", sharp: false },
		{ keyCode: 84, note: "F#", hint: "T", sharp: true },
		{ keyCode: 71, note: "G", hint: "G", sharp: false },
		{ keyCode: 89, note: "G#", hint: "Y", sharp: true },
		{ keyCode: 72, note: "A", hint: "H", sharp: false },
		{ keyCode: 85, note: "A#", hint: "U", sharp: true },
		{ keyCode: 74, note: "B", hint: "J", sharp: false },
		{ keyCode: 75, note: "C", hint: "K", sharp: false },
		{ keyCode: 79, note: "C#", hint: "O", sharp: true },
		{ keyCode: 76, note: "D", hint: "L", sharp: false },
		{ keyCode: 80, note: "D#", hint: "P", sharp: true },
		{ keyCode: 186, note: "E", hint: ";", sharp: false },
	];

	const chordsData = [
		{ name: "C",  type: "major", keys: [65, 68, 71] },
		{ name: "G",  type: "major", keys: [71, 74, 76] },
		{ name: "D",  type: "major", keys: [83, 84, 72] },
		{ name: "A",  type: "major", keys: [72, 79, 186] },
		{ name: "F",  type: "major", keys: [70, 72, 75] },
		{ name: "Am", type: "minor", keys: [72, 75, 186] },
		{ name: "Em", type: "minor", keys: [68, 71, 74] },
		{ name: "Dm", type: "minor", keys: [83, 70, 72] },
	];

	function getAudioSrc(keyCode: number) {
		const mapping: Record<number, string> = {
			65: "040", 87: "041", 83: "042", 69: "043", 68: "044", 70: "045",
			84: "046", 71: "047", 89: "048", 72: "049", 85: "050", 74: "051",
			75: "052", 79: "053", 76: "054", 80: "055", 186: "056"
		};
		return `https://carolinegabriel.com/demo/js-keyboard/sounds/${mapping[keyCode]}.wav`;
	}

	function startNote(keyCode: number, isPartOfChord = false) {
		const keyInfo = keysData.find(k => k.keyCode === keyCode);
		if (!keyInfo) return;

		const audio = document.querySelector(`audio[data-key="${keyCode}"]`) as HTMLAudioElement;
		if (!audio) return;

		if (audioFadeIntervals.has(keyCode)) {
			clearInterval(audioFadeIntervals.get(keyCode));
			audioFadeIntervals.delete(keyCode);
		}

		if (!isPartOfChord) nowPlaying = keyInfo.note;
		
		const nextActive = new Set(activeKeys);
		nextActive.add(keyCode);
		activeKeys = nextActive;

		audio.volume = 1;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function stopNote(keyCode: number) {
		if (!activeKeys.has(keyCode)) return;

		const audio = document.querySelector(`audio[data-key="${keyCode}"]`) as HTMLAudioElement;
		if (!audio) return;

		const nextActive = new Set(activeKeys);
		nextActive.delete(keyCode);
		activeKeys = nextActive;

		let volume = 1;
		const fadeInterval = setInterval(() => {
			volume -= 0.15;
			if (volume <= 0) {
				audio.volume = 0;
				audio.pause();
				clearInterval(fadeInterval);
				audioFadeIntervals.delete(keyCode);
			} else {
				audio.volume = volume;
			}
		}, 20);
		
		audioFadeIntervals.set(keyCode, fadeInterval);
	}

	function startChord(chordKeys: number[], chordName: string) {
		nowPlaying = chordName;
		chordKeys.forEach(k => startNote(k, true));
	}

	function stopChord(chordKeys: number[]) {
		chordKeys.forEach(k => stopNote(k));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen || e.repeat || viewMode !== 'keyboard') return;
		startNote(e.keyCode);
	}

	function handleKeyup(e: KeyboardEvent) {
		if (!isOpen || viewMode !== 'keyboard') return;
		stopNote(e.keyCode);
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
			   <div class="header-top">
				   <h2 class="piano-hint" data-testid="piano-modal-hint-label">{$t("piano.hint")}</h2>
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
			   </div>
		   </header>

		   <section id="main" data-testid="piano-modal-main-group">
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

			   {#if viewMode === 'keyboard'}
				   <div class="keys" data-testid="piano-keys-menu">
					   {#each keysData as key, i}
						   <div 
							   class="key" 
							   class:sharp={key.sharp} 
							   class:playing={activeKeys.has(key.keyCode)}
							   data-key={key.keyCode} 
							   data-note={key.note}
							   onpointerdown={(e) => {
								   e.preventDefault();
								   startNote(key.keyCode);
							   }}
							   onpointerup={() => stopNote(key.keyCode)}
							   onpointerleave={() => stopNote(key.keyCode)}
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
							   class:playing={chord.keys.every(k => activeKeys.has(k))}
							   onpointerdown={(e) => {
								   e.preventDefault();
								   startChord(chord.keys, chord.name);
							   }}
							   onpointerup={() => stopChord(chord.keys)}
							   onpointerleave={() => stopChord(chord.keys)}
							   data-testid={`piano-chord-${chord.name}-button`}
						   >
							   <span class="chord-name">{chord.name}</span>
						   </button>
					   {/each}
				   </div>
			   {/if}

			   {#each keysData as key}
				   <audio data-key={key.keyCode} src={getAudioSrc(key.keyCode)} preload="auto"></audio>
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
		transition: all 0.3s ease;
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

	.piano-header {
		margin-bottom: 30px;
	}

	.header-top {
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
		background: var(--color-sea-blue);
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
		width: 10%;
		height: 100%;
		background: rgba(255, 255, 255, .8);    
	}

	.key.sharp {
		position: absolute;
		width: 6%;
		height: 60%;
		background: #000;
		color: #eee;
		top: 0;
		z-index: 3;
	}

	.key[data-key="87"] { left: 7%; }
	.key[data-key="69"] { left: 17%; }
	.key[data-key="84"] { left: 37%; }
	.key[data-key="89"] { left: 47%; }
	.key[data-key="85"] { left: 57%; }
	.key[data-key="79"] { left: 77%; }
	.key[data-key="80"] { left: 87%; }

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
		aspect-ratio: 1;
		background: var(--color-surface);
		border: 4px solid var(--color-deep-ocean);
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
		color: var(--color-deep-ocean);
		font-family: var(--font-heading);
	}

	.chord-btn.minor {
		border-style: dashed;
		opacity: 0.9;
	}

	.chord-btn.playing {
		transform: scale(0.92);
		background: var(--color-sea-blue);
		border-color: white;
		box-shadow: 0 0 30px var(--color-sea-blue);
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
				padding: 0;
			}
			.keys {
				height: 60vw;
				margin-top: 10px;
			}
			.chords-grid {
				height: 60vw;
				margin-top: 10px;
				gap: 10px;
			}
			.chord-name { font-size: 1.5rem; }
			.nowplaying {
				min-height: 40px;
				font-size: 40px;
				gap: 10px;
			}
			.note-name { min-width: 120px; }
			.note-symbol { min-width: 60px; }
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
				height: 200px;
				gap: 10px;
			}
			.chord-name { font-size: 1.2rem; }
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
