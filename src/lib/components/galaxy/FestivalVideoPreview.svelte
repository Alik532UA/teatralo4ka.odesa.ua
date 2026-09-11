<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Play } from 'lucide-svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import { parseVideoUrl } from '$lib/utils/videoEmbed';

	/**
	 * Запис поїздки КАДРОМ, а не пілюлею з написом.
	 *
	 * ## Навіщо окремий компонент, коли є `GraduateVideoButton`
	 *
	 * Прохання автора: «там, де основна верхня карусель, ліворуч відео прев'ю,
	 * а праворуч фотографії карусель». Кнопка-пілюля для цього місця не
	 * годиться за розміром: поруч зі стопкою знімків заввишки 600 px вона
	 * виглядала б як загублений напис.
	 *
	 * Додати `GraduateVideoButton` другий вигляд прапорцем було першим планом і
	 * поганим: той компонент стоїть у картці випускника, у репертуарі майстра й
	 * на записах уривків — тобто в місцях, де саме пілюля й потрібна, — і
	 * кожен, хто його читатиме, мусив би тримати в голові два несумісні
	 * вигляди. Спільне в них — не розмітка, а `VideoModal` і `parseVideoUrl`, і
	 * саме їх обидва й беруть.
	 *
	 * ## Чому кадр із YouTube, а не власний знімок
	 *
	 * `posterUrl` YouTube віддає статичною адресою без API й без ключа
	 * (`videoEmbed.ts`). Свій кадр означав би ще один файл у `static/` на
	 * кожну поїздку із записом — і той файл старів би окремо від самого
	 * ролика.
	 *
	 * Компонент нічого не малює, коли кадру немає: Vimeo без свого API його не
	 * дає, і порожній прямокутник поруч із каруселлю був би гіршим за
	 * відсутність. Сторінка в такому разі лишає стару пілюлю під назвою —
	 * умову тримає вона, а не цей компонент.
	 */
	interface Props {
		/** Посилання на запис. Без кадру компонент не малює нічого. */
		videoUrl?: string;
		/** Назва поїздки: у `alt`, у підказці й у заголовку плеєра. */
		title: string;
		testid?: string;
	}

	let { videoUrl, title, testid = 'festival-video-btn' }: Props = $props();

	const video = $derived(parseVideoUrl(videoUrl));
	let open = $state(false);
</script>

{#if video?.posterUrl}
	<button
		type="button"
		class="preview"
		onclick={() => (open = true)}
		aria-label={`${$t('galaxy.watchRecording')} — ${title}`}
		data-testid={testid}
	>
		<!--
			`hqdefault` YouTube — завжди 480×360, і це не здогад, а стала його
			адреси. Атрибути стоять, щоб місце під кадр відвели до завантаження
			(PERFORMANCE-v9 § 3.2): без них пара «запис — знімки» стрибала б
			рівно на висоту кадру.
		-->
		<img src={video.posterUrl} alt="" width="480" height="360" loading="eager" decoding="async" />

		<span class="preview__play" aria-hidden="true">
			<Play size={26} />
		</span>

		<span class="preview__label">{$t('galaxy.watchRecording')}</span>
	</button>

	<VideoModal video={open ? video : null} {title} onclose={() => (open = false)} />
{/if}

<style>
	/*
	 * Кадр 16:9, а не 4:3 самого файлу.
	 *
	 * `hqdefault` приходить 480×360, але сам ролик у ньому вписаний у 16:9 —
	 * зверху й знизу чорні поля. `object-fit: cover` на пропорції 16/9 зрізає
	 * саме їх, тобто показує кадр, а не файл.
	 */
	.preview {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		border-radius: 14px;
		overflow: hidden;
		transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.preview img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 14px;
	}

	.preview:hover {
		transform: scale(1.01);
	}

	.preview:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 4px;
	}

	/*
	 * Кнопка відтворення — колом поверх кадру.
	 *
	 * Колір беремо токенами, а не космічною синькою: сторінка фестивалю живе в
	 * темі сайту, і жорсткий колір у світлій темі виглядав би чужим. Та сама
	 * причина, що в `GraduateVideoButton`.
	 */
	.preview__play {
		position: absolute;
		inset: 0;
		margin: auto;
		width: 66px;
		height: 66px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--bg-surface, rgb(3 6 20 / 0.55));
		color: var(--accent-text, #cfe4ff);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
		transition:
			transform 0.25s ease,
			background-color 0.25s ease;
	}

	.preview:hover .preview__play {
		transform: scale(1.08);
	}

	/*
	 * Підпис унизу кадру, а не поруч: він потрібен тому, хто не впізнав
	 * трикутник відтворення, і не мусить забирати місце в самого кадру.
	 */
	.preview__label {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.85rem 0.6rem 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #fff;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
		background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.preview,
		.preview__play {
			transition: none;
		}
		.preview:hover,
		.preview:hover .preview__play {
			transform: none;
		}
	}
</style>
