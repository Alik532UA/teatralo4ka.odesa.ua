import { describe, it, expect } from 'vitest';
import {
	GROUPS,
	getGroupBySlug,
	getGroupByTitleOrAbbr,
	getGroupsByMember,
	groupProfilePath,
	coGroupsForPlay,
	cleanGroupLabel,
	namedGroupsOfPlay
} from './groups';
import graduatesIndex from '$lib/data/graduates.index.json';
import mastersIndex from '$lib/data/masters.index.json';
import type { GraduateIndexEntry } from '$lib/data/graduates';
import type { MasterIndexEntry } from '$lib/data/masters';

describe('GROUPS data integrity', () => {
	it('усі групи мають коректний slug, назву та роки випуску', () => {
		expect(GROUPS.length).toBeGreaterThan(0);
		for (const group of GROUPS) {
			expect(group.slug).toMatch(/^[a-z0-9-]+$/);
			expect(group.name.trim().length).toBeGreaterThan(0);
			expect(group.graduationYears.length).toBeGreaterThan(0);
			for (const yr of group.graduationYears) {
				expect(yr).toBeGreaterThanOrEqual(1990);
				expect(yr).toBeLessThanOrEqual(2035);
			}
		}
	});

	/*
	 * Звіряється саме з `id`, а не зі `slug`: адресу законно виправляють, ключ —
	 * ні. Якби перевірка й далі дивилася на адресу, вона червоніла б від кожного
	 * виправлення імені й не бачила б справжнього розриву зв'язку.
	 */
	it('кожен memberId у групі існує в реєстрі випускників', () => {
		const known = new Set((graduatesIndex as GraduateIndexEntry[]).map((g) => g.id));
		const bad: string[] = [];
		for (const group of GROUPS)
			for (const memberId of group.memberIds)
				if (!known.has(memberId)) bad.push(`${group.slug} → ${memberId}`);
		expect(bad, `склад посилається в нікуди:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('кожен master.id у групі існує в masters.index.json', () => {
		const allMasterIds = new Set((mastersIndex as MasterIndexEntry[]).map((m) => m.id));
		for (const group of GROUPS) {
			for (const master of group.masters) {
				expect(allMasterIds.has(master.id), `Майстер ${master.id} має бути в masters.index.json`).toBe(true);
			}
		}
	});

	/*
	 * Репертуар тепер — ключі, а не копії назв, тож валідність самих вистав
	 * перевіряє `plays.test.ts`. Тут лишається те, що стосується групи.
	 *
	 * Доти вимагалася щонайменше одна вистава — і це не пускало групи, про які
	 * склад уже відомий, а назви вистав ще ні («Чудачки»: двоє випускниць 2009
	 * року, жодного запису про виставу). Вимога послаблена свідомо: репертуар
	 * додається згодом, а розділ «Репертуар вистав» на сторінці й так ховається
	 * сам, коли він порожній.
	 *
	 * Лишилося те, заради чого перевірка й з'явилася: сторінка, на якій немає
	 * НІЧОГО — ні складу, ні репертуару, — це порожня адреса в меню.
	 */
	it('сторінка групи не буває цілком порожньою', () => {
		const bad = GROUPS.filter((g) => g.memberIds.length === 0 && g.playIds.length === 0).map(
			(g) => g.slug
		);
		expect(bad, `ні складу, ні репертуару:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	/*
	 * Поділ злитої групи має бути РОЗБИТТЯМ, а не ще одним списком поруч.
	 *
	 * Вистава, що потрапила і в частину, і в спільні, показалася б на сторінці
	 * двічі; вистава, що не потрапила нікуди, зникла б зі сторінки, лишившись у
	 * даних. Обидва різновиди помилки тихі — сторінка від них не падає.
	 *
	 * Так само зі складом: людина, приписана обом частинам, суперечить самому
	 * задуму поділу.
	 */
	it('частини злитої групи не дублюють і не губають нічого', () => {
		const bad: string[] = [];
		for (const group of GROUPS) {
			if (!group.parts?.length) continue;

			const seenPlay = new Map<string, number>();
			for (const id of [...group.playIds, ...group.parts.flatMap((p) => p.playIds)])
				seenPlay.set(id, (seenPlay.get(id) ?? 0) + 1);
			for (const [id, n] of seenPlay)
				if (n > 1) bad.push(`${group.slug}: вистава «${id}» у ${n} списках`);

			const seenMember = new Map<string, number>();
			for (const id of group.parts.flatMap((p) => p.memberIds))
				seenMember.set(id, (seenMember.get(id) ?? 0) + 1);
			for (const [id, n] of seenMember)
				if (n > 1) bad.push(`${group.slug}: ${id} у ${n} частинах`);

			for (const part of group.parts) {
				if (!part.name.trim()) bad.push(`${group.slug}: частина без назви`);
				for (const id of part.memberIds)
					if (!group.memberIds.includes(id))
						bad.push(`${group.slug} → «${part.name}»: ${id} не у складі групи`);
			}
		}
		expect(bad, `поділ групи розійшовся:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('хелпери getGroupBySlug, getGroupByTitleOrAbbr, getGroupsByMember повертають правильні групи', () => {
		const group = getGroupBySlug('zakhysnyky-teatralnykh-kulis');
		expect(group).toBeDefined();
		expect(group?.name).toBe('Захисники театральних куліс');

		expect(getGroupByTitleOrAbbr('ЗТК')?.slug).toBe('zakhysnyky-teatralnykh-kulis');
		expect(getGroupByTitleOrAbbr('Захисники театральних куліс')?.slug).toBe('zakhysnyky-teatralnykh-kulis');
		expect(getGroupsByMember('alik-zapolnov').map((g) => g.slug)).toEqual([
			'zakhysnyky-teatralnykh-kulis'
		]);

		expect(groupProfilePath('zakhysnyky-teatralnykh-kulis')).toBe(
			'/projects/galaxy-graduates/groups/zakhysnyky-teatralnykh-kulis'
		);
	});

	/*
	 * «Уявно хворий» — вистава ЗТК і Скоморохів одночасно, і саме вона єдина
	 * мала примітку «(разом з групою ЗТК)», написану руками в анкеті Марини
	 * Суханової. Тепер відповідь обчислюється, і ці три перевірки закріплюють
	 * рівно те, що примітка казала, — плюс головне правило про незнання.
	 */
	it('coGroupsForPlay: чужі групи вистави — крім власних груп випускника', () => {
		// Марина зі Скоморохів → лишається ЗТК
		expect(coGroupsForPlay('mnymyi-bolnoi-2011', 'maryna-sukhanova').map((g) => g.slug)).toEqual([
			'zakhysnyky-teatralnykh-kulis'
		]);

		// Алік із ЗТК → лишаються Скоморохи. Тобто відповідь ЗАЛЕЖИТЬ від того,
		// хто питає: та сама вистава, інша своя група.
		expect(coGroupsForPlay('mnymyi-bolnoi-2011', 'alik-zapolnov').map((g) => g.slug)).toEqual([
			'skomorokhy'
		]);
	});

	it('coGroupsForPlay: без своєї групи — порожньо, а не «всі чужі»', () => {
		/*
		 * Це не дрібниця, а суть правила. Заміряно: із 124 рядків, де вистава
		 * належить ще й іншій групі, 82 — про людей, не прив'язаних до жодної
		 * групи. Без цієї умови плашка казала б Скоморохові «разом з
		 * Скоморохами»: група виглядає чужою лише тому, що своєї ми не знаємо.
		 */
		expect(coGroupsForPlay('mnymyi-bolnoi-2011', 'ніхто-такий-не-існує')).toEqual([]);
	});

	/*
	 * Курс із паперу школи — і те, як його звідти дістати.
	 *
	 * Підпис у полі буває «гр. «ФРЕШ» (+ хлопці-легіонери)» або «гр. 4Т-12
	 * 6Т-18»: приставка, лапки, дужки й два курси одним рядком. Заміряно на
	 * «Уривках з драматургії 20 століття» 2012: без цього сторінка оголошувала
	 * основним курсом ЗТК, бо в складі з анкет трьох легіонерів із ЗТК проти
	 * однієї людини з Фреша.
	 */
	it('cleanGroupLabel зносить приставку, лапки й дужки', () => {
		expect(cleanGroupLabel('гр. «ФРЕШ» (+ хлопці-легіонери)')).toBe('ФРЕШ');
		expect(cleanGroupLabel('гр. «ТУ-154»')).toBe('ТУ-154');
		expect(cleanGroupLabel('гр. 4Т-12 6Т-18')).toBe('4Т-12 6Т-18');
		expect(cleanGroupLabel(undefined)).toBe('');
		expect(cleanGroupLabel('   ')).toBe('');
	});

	it('namedGroupsOfPlay знаходить курс за підписом із паперу', () => {
		expect(namedGroupsOfPlay({ theatreGroup: 'гр. «ФРЕШ» (+ хлопці-легіонери)' }).map((g) => g.slug)).toEqual([
			'fresh'
		]);
		// друге ім'я того самого курсу — з розкладу
		expect(namedGroupsOfPlay({ theatreGroup: 'гр. «Freedom»', theatreGroupAlt: 'гр. 14-Т' }).map((g) => g.slug)).toEqual([
			'freedom'
		]);
		// назви, якої в реєстрі немає, вигадувати не треба
		expect(namedGroupsOfPlay({ theatreGroup: 'гр. «БулаФФки»' })).toEqual([]);
		expect(namedGroupsOfPlay({})).toEqual([]);
	});

	it('coGroupsForPlay: вистава без груп у реєстрі — порожньо', () => {
		expect(coGroupsForPlay('такої-вистави-немає', 'maryna-sukhanova')).toEqual([]);
	});
});
