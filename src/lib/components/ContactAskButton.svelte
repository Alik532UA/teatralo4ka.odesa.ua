<script lang="ts">
	import GraduateCardContactMenu from './GraduateCardContactMenu.svelte';

	/**
	 * Кнопка «написати» зі спливаючим меню месенджерів.
	 *
	 * Спільна для вітального вікна галактики й сторінки викладачів. Третьої
	 * копії цієї логіки бути не мало: розійшовшись, вони дали б одну кнопку,
	 * що на двох сторінках поводиться по-різному.
	 */
	interface Props {
		label: string;
		/** Підпис у меню — різний за місцем. */
		hint: string;
		/** Куди розкривається меню: вгору (кнопка внизу) чи вниз. */
		placement?: 'above' | 'below';
		/** Клас кнопки — вигляд задає сторінка, поведінку цей компонент. */
		buttonClass?: string;
	}

	let { label, hint, placement = 'above', buttonClass = 'btn' }: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);

	/**
	 * Відкриття — ТІЛЬКИ натисканням.
	 *
	 * Наведення відчинялося саме собою в людини, яка просто вела курсор до
	 * сусідньої кнопки, і меню накривало те, куди вона цілилась. Витримки й
	 * затримки закриття, що це рятували, пішли разом із ним: клік нічого
	 * такого не потребує.
	 *
	 * Закривають клік поза кнопкою й Escape. Раніше ті кліки ловив шар
	 * розмиття на весь екран — і ловив погано: `position: fixed` рахується від
	 * найближчого предка з `filter` чи `transform`, а не від вікна, тож
	 * затемнення лягало прямокутником посеред сторінки, лишаючи шапку й підвал
	 * чіткими. Слухач на вікні робить те саме без жодного шару.
	 *
	 * Слухач вішається вже ПІСЛЯ того, як меню відкрилося, тож `pointerdown`,
	 * яким його відкрили, до нього не доходить і не закриває його одразу.
	 */
	$effect(() => {
		if (!open) return;

		const closeOutside = (event: PointerEvent) => {
			if (root && !root.contains(event.target as Node)) open = false;
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') open = false;
		};

		window.addEventListener('pointerdown', closeOutside);
		window.addEventListener('keydown', closeOnEscape);

		return () => {
			window.removeEventListener('pointerdown', closeOutside);
			window.removeEventListener('keydown', closeOnEscape);
		};
	});
</script>

<div class="ask" bind:this={root}>
	<button
		type="button"
		class={buttonClass}
		onclick={() => (open = !open)}
		aria-expanded={open}
		aria-haspopup="true"
		data-testid="contact-ask-btn"
	>
		{label}
	</button>
	{#if open}
		<GraduateCardContactMenu {hint} {placement} />
	{/if}
</div>

<style>
	.ask {
		position: relative;
	}
</style>
