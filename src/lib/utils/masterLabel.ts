import type { MasterIndexEntry } from '$lib/data/masters';

/**
 * Підпис «майстер курсу» в роді й числі.
 *
 * ## Що саме поламалося
 *
 * Підпис був сталим рядком «Майстри курсу» — множина незалежно ні від чого.
 * Заміряно на реєстрі: майстра має 332 випускники, і в **243** із них він ОДИН,
 * тобто множина неправильна у 73% випадків. Серед тих 243 майстер — жінка у
 * 202, тож і рід був не той: сторінка Володимира Чалчинського читалася
 * «Майстри курсу: Тетяна ІСАЧКІНА».
 *
 * Той самий рядок стоїть у двох місцях — у заголовку блоку картки й в описі для
 * пошуку та соцмереж, — тому правило живе окремо від обох.
 *
 * ## Звідки береться стать
 *
 * З ДАНИХ, а не з імені. По батькові у `fullName` розрізняє однозначно:
 * «Ісачкіна Тетяна **Валеріївна**» проти «Ткач Федір **Федорович**». Де по
 * батькові немає — з `roleTitle`, який школа вже пише в роді: «викладачка»,
 * «майстриня», «концертмейстерка».
 *
 * Заміряно: ця пара сигналів визначає стать у ВСІХ 243 випадках з одним
 * майстром — 202 жінки, 41 чоловік, невизначених нуль. Тому запасного варіанта
 * «якщо не знаємо» тут немає: у множині рід не потрібен, а в однині він завжди
 * відомий. Якщо колись з'явиться майстер без обох ознак — підпис стане
 * чоловічим, і це видно оком, а не тихо.
 */
export function masterGender(master: Pick<MasterIndexEntry, 'fullName' | 'roleTitle'>): 'f' | 'm' {
	const words = (master.fullName ?? '').trim().split(/\s+/);

	/*
	 * По батькові — найнадійніше. Російські форми теж є в даних («Погосян
	 * Ангеліна Саркісовна»), бо так їх записали в паперах школи.
	 */
	const patronymic = words.at(-1) ?? '';
	if (/(івна|ївна|овна|евна)$/.test(patronymic)) return 'f';
	if (/(ович|йович|евич)$/.test(patronymic)) return 'm';

	/*
	 * Прізвище — другий сигнал: жіночі форми в українській регулярні
	 * («Рибакова», «Матюніна», «Зубинська»). Чоловічих правил тут немає
	 * навмисно: «Кореньок» і «Стельмах» не мають закінчення, за яким їх можна
	 * відрізнити від жіночих, і вгадувати означало б помилятися тихо.
	 */
	const surname = words[0] ?? '';
	if (/(ова|єва|ева|іна|ина|ська|цька|зька)$/.test(surname)) return 'f';

	const role = (master.roleTitle ?? '').toLowerCase();
	if (/(викладачка|майстриня|концертмейстерка|керівниця|акомпаніаторка)/.test(role)) return 'f';
	return 'm';
}

/** Ключ підпису: `galaxy.masterOne` / `masterOneF` / `masters`. */
export function masterLabelKey(
	masters: readonly Pick<MasterIndexEntry, 'fullName' | 'roleTitle'>[]
): 'galaxy.masters' | 'galaxy.masterOne' | 'galaxy.masterOneF' {
	if (masters.length !== 1) return 'galaxy.masters';
	return masterGender(masters[0]) === 'f' ? 'galaxy.masterOneF' : 'galaxy.masterOne';
}

/**
 * Непедагогічні ролі (школа в них уся, а не одне відділення, і предметів немає).
 * Для них підпис посилання на сторінку дорослого — «У команді школи» (`galaxy.teamPageLink`),
 * а для викладачів — «Сторінка викладача» (`galaxy.teacherPageLink`).
 */
export const NON_TEACHING_CATEGORIES = new Set<string>([
	'administration',
	'production',
	'it',
	'support'
]);

/**
 * Ключ підпису сторінки дорослого у вікні подвійної ролі та профілі випускника.
 */
export function dualRoleMasterLabelKey(
	master?: Pick<MasterIndexEntry, 'category'> | null
): 'galaxy.teacherPageLink' | 'galaxy.teamPageLink' {
	return master?.category && NON_TEACHING_CATEGORIES.has(master.category)
		? 'galaxy.teamPageLink'
		: 'galaxy.teacherPageLink';
}
