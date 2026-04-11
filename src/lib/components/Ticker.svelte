<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { base } from '$app/paths';
  import { t } from 'svelte-i18n';
  
  let {
    visible = false,
    mode = 'time',
    startTime = '09:00',
    endTime = '09:03',
    preview = false,
    enableSound = false,
    show = $bindable(false)
  } = $props();

  let audioElement = $state<HTMLAudioElement | null>(null);

  function checkTime() {
    if (preview) {
      show = true;
      return;
    }
    
    if (!visible) {
      show = false;
      return;
    }

    if (mode === 'always') {
      show = true;
      return;
    }

    const now = new Date();
    const kyivTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    show = kyivTime >= startTime && kyivTime < endTime;
  }

  onMount(() => {
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  });

  $effect(() => {
    void visible, void mode, void startTime, void endTime, void preview;
    checkTime();
  });

  $effect(() => {
    if (show && enableSound && audioElement) {
      audioElement.play().catch(err => {
        console.warn('Ticker audio playback failed:', err);
      });
    } else if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  });
</script>

{#if show}
<div class="ticker-header" data-testid="ticker-header" transition:slide={{ duration: 250 }}>
  {#if enableSound}
    <audio 
      bind:this={audioElement} 
      src={`${base}/audio/metronome.m4a`} 
      loop 
      preload="auto"
    ></audio>
  {/if}
  
  <div class="ticker-track">
    <!-- Duplicate content for seamless loop -->
    <div class="ticker-content">
      {#each Array(4) as _}
        <div class="ticker-item">
          <img src={`${base}/moment-of-silence/Lesser_Coat_of_Arms_of_Ukraine_(bw).svg`} alt={$t('ticker.coatOfArms')}>
          <p>{$t('ticker.title')}</p>
        </div>
      {/each}
    </div>
    <div class="ticker-content" aria-hidden="true">
      {#each Array(4) as _}
        <div class="ticker-item">
          <img src={`${base}/moment-of-silence/Lesser_Coat_of_Arms_of_Ukraine_(bw).svg`} alt={$t('ticker.coatOfArms')}>
          <p>{$t('ticker.title')}</p>
        </div>
      {/each}
    </div>
  </div>
</div>
{/if}

<style>
.ticker-header {
  background: #212121;
  overflow: hidden;
  height: 65px;
  position: relative;
  width: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.ticker-track {
  display: flex;
  width: max-content;
  /* Use 3D transform for GPU acceleration */
  transform: translate3d(0, 0, 0);
  animation: ticker-move 40s linear infinite;
  will-change: transform;
}

.ticker-content {
  display: flex;
  align-items: center;
  gap: 4rem;
  padding-right: 4rem;
}

.ticker-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  white-space: nowrap;
}

p {
  font-family: 'Roboto', sans-serif;
  color: #ffffff;
  text-transform: uppercase;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

img {
  height: 20px;
  display: block;
}

@keyframes ticker-move {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    /* Move by exactly half the track width (one content block) */
    transform: translate3d(-50%, 0, 0);
  }
}

/* Pause animation if user prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation-play-state: paused;
  }
}
</style>
