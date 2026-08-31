<script lang="ts">
	import { getGroupBySlug } from '$lib/data/groups';
	import GraduateAvatarRow from '$lib/components/GraduateAvatarRow.svelte';

	/**
	 * Однокурсники — тонка обгортка над `GraduateAvatarRow`.
	 *
	 * Сам рядок мініатюр більше не тут: той самий рядок потрібен ще складу
	 * вистави, учасникам фестивалю й групам на сторінці викладача, а групи в
	 * трьох із цих чотирьох місць немає. Тут лишилося рівно те, чого немає в
	 * решти, — «взяти склад групи за її адресою».
	 *
	 * Причини такого поділу й чому показуються всі, а не лише ті, у кого є
	 * портрет, — у докблоці `GraduateAvatarRow`.
	 */
	interface Props {
		/** Адреса групи; складу немає — рядок не малюється. */
		groupSlug: string;
		/** Чия це картка: сама людина серед однокурсників не показується. */
		excludeId?: string;
		/** Див. `GraduateAvatarRow.linked`. */
		linked?: boolean;
		/** Див. `GraduateAvatarRow.testIdPrefix`. */
		testIdPrefix?: string;
	}

	let {
		groupSlug,
		excludeId = '',
		linked = true,
		testIdPrefix = 'galaxy-card-groupmates'
	}: Props = $props();

	/* Склад беремо за `id`, а не за адресою: адресу законно виправляють, і
	 * пошук за нею тихо губив би людину. */
	const ids = $derived(getGroupBySlug(groupSlug)?.memberIds ?? []);
</script>

<GraduateAvatarRow {ids} {excludeId} {linked} {testIdPrefix} />
