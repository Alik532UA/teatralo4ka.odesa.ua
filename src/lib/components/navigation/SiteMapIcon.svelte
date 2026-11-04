<script lang="ts">
	import {
		Home, School, History, Newspaper, Calendar, Phone, UserCheck, FileText, Scroll,
		Drama, Music, Palette, Sparkles, Users, Smile, Compass, Globe, Flame, Spotlight,
		Sun, Theater, Heart, Languages, Camera, BookMarked, Mic, Volume2, Activity,
		Shuffle, Layers, BookOpen, Zap, Clock, BookHeart, Plus, GraduationCap
	} from 'lucide-svelte';

	interface Props {
		name?: string;
		size?: number;
		class?: string;
	}

	let { name, size = 15, class: className = '' }: Props = $props();
</script>

{#if name === 'home'}<Home {size} class={className} aria-hidden="true" />
{:else if name === 'school'}<School {size} class={className} aria-hidden="true" />
{:else if name === 'history'}<History {size} class={className} aria-hidden="true" />
{:else if name === 'newspaper'}<Newspaper {size} class={className} aria-hidden="true" />
{:else if name === 'calendar'}<Calendar {size} class={className} aria-hidden="true" />
{:else if name === 'phone'}<Phone {size} class={className} aria-hidden="true" />
{:else if name === 'user-check'}<UserCheck {size} class={className} aria-hidden="true" />
{:else if name === 'file-text'}<FileText {size} class={className} aria-hidden="true" />
{:else if name === 'scroll'}<Scroll {size} class={className} aria-hidden="true" />
{:else if name === 'drama'}<Drama {size} class={className} aria-hidden="true" />
{:else if name === 'music'}<Music {size} class={className} aria-hidden="true" />
{:else if name === 'palette'}<Palette {size} class={className} aria-hidden="true" />
{:else if name === 'sparkles'}<Sparkles {size} class={className} aria-hidden="true" />
{:else if name === 'graduation-cap'}<GraduationCap {size} class={className} aria-hidden="true" />
{:else if name === 'smile'}<Smile {size} class={className} aria-hidden="true" />
{:else if name === 'users'}<Users {size} class={className} aria-hidden="true" />
{:else if name === 'compass'}<Compass {size} class={className} aria-hidden="true" />
{:else if name === 'globe'}<Globe {size} class={className} aria-hidden="true" />
{:else if name === 'flame'}<Flame {size} class={className} aria-hidden="true" />
{:else if name === 'spotlight'}<Spotlight {size} class={className} aria-hidden="true" />
{:else if name === 'sun'}<Sun {size} class={className} aria-hidden="true" />
{:else if name === 'theater'}<Theater {size} class={className} aria-hidden="true" />
{:else if name === 'heart'}<Heart {size} class={className} aria-hidden="true" />
{:else if name === 'languages'}<Languages {size} class={className} aria-hidden="true" />
{:else if name === 'camera'}<Camera {size} class={className} aria-hidden="true" />
{:else if name === 'book-marked'}<BookMarked {size} class={className} aria-hidden="true" />
{:else if name === 'mic'}<Mic {size} class={className} aria-hidden="true" />
{:else if name === 'volume-2'}<Volume2 {size} class={className} aria-hidden="true" />
{:else if name === 'activity'}<Activity {size} class={className} aria-hidden="true" />
{:else if name === 'shuffle'}<Shuffle {size} class={className} aria-hidden="true" />
{:else if name === 'layers'}<Layers {size} class={className} aria-hidden="true" />
{:else if name === 'book-open'}<BookOpen {size} class={className} aria-hidden="true" />
{:else if name === 'zap'}<Zap {size} class={className} aria-hidden="true" />
{:else if name === 'clock'}<Clock {size} class={className} aria-hidden="true" />
{:else if name === 'book-heart'}<BookHeart {size} class={className} aria-hidden="true" />
{:else if name === 'plus'}<Plus {size} class={className} aria-hidden="true" />
{:else}<Sparkles {size} class={className} aria-hidden="true" />
{/if}

