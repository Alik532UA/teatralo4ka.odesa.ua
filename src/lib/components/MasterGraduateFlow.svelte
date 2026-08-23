<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { locale, t } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { localeFromPath, localizedPath } from '$lib/i18n/routing';
	import {
		graduateProfilePath,
		type GraduateIndexEntry
	} from '$lib/data/graduates';
	import { masterProfilePath, type MasterStudentEntry } from '$lib/data/masters';
	import GraduateStar from '$lib/components/GraduateStar.svelte';

	interface Props {
		graduates?: GraduateIndexEntry[];
		students?: MasterStudentEntry[];
		masterName: string;
	}

	let { graduates, students, masterName }: Props = $props();

	let started = $state(false);
	let photoLanes = $state<{ left: number; duration: number; delay: number }[]>([]);
	let plainLanes = $state<{ left: number; duration: number; delay: number }[]>([]);

	const normalizedStudents = $derived<MasterStudentEntry[]>(
		students && students.length > 0
			? students
			: (graduates ?? []).map((g) => ({
					kind: 'graduate' as const,
					relation: 'master' as const,
					graduate: g
				}))
	);

	/**
	 * Один вид для зірки, зведений із двох різних записів.
	 *
	 * Випускник і колега-майстер лежать у різних місцях і мають різні поля: у
	 * випускника є рік випуску й портрет у `static/graduates/`, у колеги — роль у
	 * школі й портрет у `static/masters/`. Зірці ж потрібні ті самі величини, тому
	 * зведення робиться ТУТ, один раз, а не розгалуженням у розмітці.
	 *
	 * `entry` лишається поруч: по кліку треба знати, куди вести — на сторінку
	 * профілю випускника чи на сторінку майстра.
	 */
	interface StarPerson {
		key: string;
		tier: 'colleague' | 'graduate' | 'student';
		hasPhoto: boolean;
		/** Портрет поза текою випускників; `null` — брати звідти, як досі. */
		photo: string | null;
		/** Зірка приймає запис випускника, тож колезі складаємо сумісний. */
		graduate: GraduateIndexEntry;
		entry: MasterStudentEntry;
	}

	const people = $derived<StarPerson[]>(
		normalizedStudents.map((entry) => {
			if (entry.kind === 'master') {
				const m = entry.master;
				return {
					key: `master:${m.slug}`,
					tier: 'colleague' as const,
					hasPhoto: Boolean(m.photo),
					photo: m.photo ?? null,
					/*
					 * Сумісний запис, а не справжній: колеги немає в переліку
					 * випускників, і рік випуску в неї невідомий. `graduationYear: null`
					 * означає саме «невідомо», тож підпис покаже лише ім'я.
					 */
					graduate: {
						slug: m.slug,
						name: $locale === 'en' ? m.displayNameEn : m.displayName,
						graduationYear: null,
						departments: m.departments,
						...(m.photo ? { hasPhoto: true as const } : {})
					},
					entry
				};
			}
			return {
				key: `graduate:${entry.graduate.slug}`,
				tier: entry.relation === 'teacher' ? ('student' as const) : ('graduate' as const),
				hasPhoto: Boolean(entry.graduate.hasPhoto),
				photo: null,
				graduate: entry.graduate,
				entry
			};
		})
	);

	const withPhoto = $derived(people.filter((p) => p.hasPhoto));
	const withoutPhoto = $derived(people.filter((p) => !p.hasPhoto));

	function makeVerticalLanes(count: number, minSeconds: number, random: () => number) {
		if (count <= 0) return [];
		if (count === 1) {
			return [{
				left: 50,
				duration: minSeconds + random() * minSeconds * 0.5,
				delay: -random() * minSeconds * 2
			}];
		}

		const minSafe = 18;
		const maxSafe = 82;
		const span = maxSafe - minSafe;
		const step = span / count;

		return Array.from({ length: count }, (_, index) => {
			const center = minSafe + step * (index + 0.5);
			const jitter = (random() - 0.5) * step * 0.7;
			const left = Math.min(maxSafe, Math.max(minSafe, center + jitter));
			return {
				left,
				duration: minSeconds + random() * minSeconds * 0.5,
				delay: -random() * minSeconds * 2
			};
		});
	}

	onMount(() => {
		photoLanes = makeVerticalLanes(withPhoto.length, 22, Math.random);
		plainLanes = makeVerticalLanes(withoutPhoto.length, 18, Math.random);
		started = true;
	});

	const flying = $derived(
		started
			? [
					...withoutPhoto.map((person, lane) => ({
						kind: 'plain' as const,
						lane,
						person,
						geometry: plainLanes[lane]
					})),
					...withPhoto.map((person, lane) => ({
						kind: 'photo' as const,
						lane,
						person,
						geometry: photoLanes[lane]
					}))
				]
			: []
	);

	function handleSelect(person: StarPerson) {
		// Мова береться з адреси, а не з `$locale`: адреса — джерело істини для
		// мови в цьому проєкті (I18N-v8 § 3.1), і без префікса читач англійської
		// версії їхав на українську сторінку профілю.
		const locale = localeFromPath(page.url.pathname);

		// Колега-майстер веде на свою сторінку майстра, а не в «Галактику»: власної
		// сторінки випускника в неї немає, і пошук за іменем не знайшов би нічого.
		if (person.entry.kind === 'master') {
			goto(masterProfilePath(person.entry.master.slug, locale));
			return;
		}

		const graduate = person.entry.graduate;
		if (graduate.code) {
			goto(localizedPath(graduateProfilePath(graduate.code), locale));
		} else {
			// Лише ім'я без коду — у пошук «Галактики». Тут `resolve()` доречний
			// (на відміну від шляхів профілю): обробник виконується тільки в
			// браузері, тож відносного шляху під prerender бути не може.
			goto(resolve(`/projects/galaxy-graduates?search=${encodeURIComponent(graduate.name)}`));
		}
	}
</script>

<aside
	class="flow-stream"
	aria-label={$t('galaxy.graduatesOfMaster', { default: `Випускники майстра: ${masterName}` })}
	data-testid="master-graduate-flow-section"
>
	{#if normalizedStudents.length > 0}
		<ul class="flow-lanes" data-testid="master-graduate-flow-list">
			{#each flying as item (item.kind + item.lane + item.person.key)}
				<li
					class="lane lane--{item.kind}"
					style="--left: {item.geometry?.left ?? 50}; --duration: {item.geometry?.duration ?? 22}s; --delay: {item.geometry?.delay ?? 0}s"
					data-testid="master-graduate-flow-item-{item.person.graduate.slug}"
					data-tier={item.person.tier}
				>
					<GraduateStar
						graduate={item.person.graduate}
						kind={item.kind}
						tier={item.person.tier}
						photo={item.person.photo}
						onselect={() => handleSelect(item.person)}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<style>
	.flow-stream {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 480px;
		pointer-events: none;
		overflow: visible;
	}

	@media (min-width: 860px) {
		.flow-stream {
			position: fixed;
			right: 0;
			top: 0;
			bottom: 0;
			width: clamp(280px, 34vw, 480px);
			height: auto;
			min-height: 0;
			z-index: 5;
		}
	}

	.flow-lanes {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		overflow: visible;
	}

	.lane {
		position: absolute;
		top: 0;
		width: 56px;
		height: 56px;
		left: calc((100% - 56px) * var(--left) / 100);
		pointer-events: auto;
		animation: streamUp var(--duration) linear var(--delay) infinite;
	}

	.lane--photo {
		z-index: 10;
	}

	.lane--plain {
		z-index: 2;
	}

	@keyframes streamUp {
		from {
			translate: 0 105vh;
		}
		to {
			translate: 0 -15vh;
		}
	}

	@media (max-width: 859px) {
		@keyframes streamUp {
			from {
				translate: 0 520px;
			}
			to {
				translate: 0 -70px;
			}
		}
	}

	.lane:has(:global(button:hover)),
	.lane:has(:global(button:focus-visible)) {
		animation-play-state: paused;
		z-index: 100;
	}

	@media (prefers-reduced-motion: reduce) {
		.flow-stream {
			position: static;
			height: auto;
			min-height: 0;
			pointer-events: auto;
		}

		.flow-lanes {
			position: static;
			display: flex;
			flex-wrap: wrap;
			align-content: flex-start;
			gap: 0.5rem;
			padding: 1rem 0;
			mask-image: none;
			-webkit-mask-image: none;
		}

		.lane {
			position: static;
			animation: none;
			translate: none;
			height: auto;
		}
	}
</style>
