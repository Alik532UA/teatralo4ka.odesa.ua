export interface InvitationStudent {
	firstName: string;
	lastName: string;
	gender: 'm' | 'f';
}

export type PosviataSlotTime = '10:00' | '12:00';

export interface PosviataSlotConfig {
	time: PosviataSlotTime;
	students: InvitationStudent[];
}

export const POSVIATA_EVENT_META = {
	id: 'posviata-invitation',
	dateUk: '24 жовтня 2026 р.',
	dateEn: 'October 24, 2026',
	addressUk: 'вул. Софіївська, 24',
	addressEn: '24 Sofiivska St',
	hallUk: 'Велика зала',
	hallEn: 'Great Hall'
} as const;

export function formatGreeting(student: InvitationStudent, isEn = false): string {
	if (isEn) {
		return `Dear ${student.firstName} ${student.lastName}!`;
	}
	const prefix = student.gender === 'f' ? 'Дорога' : 'Дорогий';
	return `${prefix} ${student.firstName} ${student.lastName}!`;
}

export const LEFT_MINI_ICONS = [
	'03', '02', '04', '07', '11', '09', '12', '05', '01'
] as const;

export const RIGHT_MINI_ICONS = [
	'05', '06', '08', '12', '11', '10', '07', '04', '03'
] as const;

export function getStudentsForSlot(time: PosviataSlotTime): InvitationStudent[] {
	return time === '10:00' ? POSVIATA_STUDENTS_10_00 : POSVIATA_STUDENTS_12_00;
}

export function chunkStudents(
	students: readonly InvitationStudent[],
	chunkSize = 6
): InvitationStudent[][] {
	const chunks: InvitationStudent[][] = [];
	for (let i = 0; i < students.length; i += chunkSize) {
		chunks.push(students.slice(i, i + chunkSize));
	}
	return chunks;
}

export const POSVIATA_STUDENTS_10_00: InvitationStudent[] = [
	{ firstName: 'Аделіна', lastName: 'Бочкова', gender: 'f' },
	{ firstName: 'Олександра', lastName: 'Гугніна', gender: 'f' },
	{ firstName: 'Іванна', lastName: 'Іванічева', gender: 'f' },
	{ firstName: 'Ангеліна', lastName: 'Моторна', gender: 'f' },
	{ firstName: 'Єва', lastName: 'Нестеренко', gender: 'f' },
	{ firstName: 'Таїсія', lastName: 'Новосельцева', gender: 'f' },
	{ firstName: 'Кіра', lastName: 'Босенко', gender: 'f' },
	{ firstName: 'Лєо', lastName: 'Мазіп', gender: 'm' },
	{ firstName: 'Данило', lastName: 'Маноле', gender: 'm' },
	{ firstName: 'Діана', lastName: 'Москаленко', gender: 'f' },
	{ firstName: 'Єва', lastName: 'Проніна', gender: 'f' },
	{ firstName: 'Анатолій', lastName: 'Сисак', gender: 'm' },
	{ firstName: 'Софія', lastName: 'Янакієва', gender: 'f' },
	{ firstName: 'Каміла', lastName: 'Пугачова', gender: 'f' },
	{ firstName: 'Ліза', lastName: 'Іванчикова', gender: 'f' },
	{ firstName: 'Євген', lastName: 'Бежевець', gender: 'm' },
	{ firstName: 'Микита', lastName: 'Кербаль', gender: 'm' },
	{ firstName: 'Катерина', lastName: 'Підлубна', gender: 'f' },
	{ firstName: 'Єсенія', lastName: 'Балахчі', gender: 'f' },
	{ firstName: 'Вікторія', lastName: 'Марченко', gender: 'f' },
	{ firstName: 'Єлизавета', lastName: 'Жеребцова', gender: 'f' },
	{ firstName: 'Ксенія', lastName: 'Івановська', gender: 'f' },
	{ firstName: 'Римма', lastName: 'Березовська', gender: 'f' },
	{ firstName: 'Поліна', lastName: 'Васильєва', gender: 'f' },
	{ firstName: 'Влада', lastName: 'Мінчева', gender: 'f' },
	{ firstName: 'Евеліна', lastName: 'Сірик', gender: 'f' },
	{ firstName: 'Єсенія', lastName: 'Поповіч', gender: 'f' },
	{ firstName: 'Анастасія', lastName: 'Батиріна', gender: 'f' },
	{ firstName: 'Марина', lastName: 'Дубровіна', gender: 'f' },
	{ firstName: 'Марія', lastName: 'Кірєєва', gender: 'f' },
	{ firstName: 'Дар’я', lastName: 'Ткачук', gender: 'f' },
	{ firstName: 'Микола', lastName: 'Михайлов', gender: 'm' },
	{ firstName: 'Софія', lastName: 'Михайленко', gender: 'f' },
	{ firstName: 'Валерія', lastName: 'Мосузенко', gender: 'f' },
	{ firstName: 'Софія', lastName: 'Москаленко', gender: 'f' },
	{ firstName: 'Емілій', lastName: 'Ястребов', gender: 'm' }
];

export const POSVIATA_STUDENTS_12_00: InvitationStudent[] = [
	{ firstName: 'Анна', lastName: 'Голуб', gender: 'f' },
	{ firstName: 'Кіра', lastName: 'Чебан', gender: 'f' },
	{ firstName: 'Аліса', lastName: 'Каташинська', gender: 'f' },
	{ firstName: 'Вікторія', lastName: 'Вєлкова', gender: 'f' },
	{ firstName: 'Олександра', lastName: 'Копач', gender: 'f' },
	{ firstName: 'Давид', lastName: 'Малаховський', gender: 'm' },
	{ firstName: 'Марія', lastName: 'Новосельцева', gender: 'f' },
	{ firstName: 'Сніжана', lastName: 'Островерха', gender: 'f' },
	{ firstName: 'Вікторія', lastName: 'Побережник', gender: 'f' },
	{ firstName: 'Тетяна', lastName: 'Холіна', gender: 'f' },
	{ firstName: 'Савелій', lastName: 'Циганок', gender: 'm' },
	{ firstName: 'Аміна', lastName: 'Чашуріна', gender: 'f' },
	{ firstName: 'Аїда', lastName: 'Овсепян', gender: 'f' },
	{ firstName: 'Антоніна', lastName: 'Веселовська', gender: 'f' },
	{ firstName: 'Георгій', lastName: 'Березовський', gender: 'm' },
	{ firstName: 'Вікторія', lastName: 'Князєва', gender: 'f' },
	{ firstName: 'Андрій', lastName: 'Кочержин', gender: 'm' },
	{ firstName: 'Поліна', lastName: 'Ланова', gender: 'f' },
	{ firstName: 'Олексій', lastName: 'Любиковський', gender: 'm' },
	{ firstName: 'Віра', lastName: 'Попова', gender: 'f' },
	{ firstName: 'Марія', lastName: 'Скрябіна', gender: 'f' },
	{ firstName: 'Кіра', lastName: 'Тихонова', gender: 'f' },
	{ firstName: 'Аня', lastName: 'Траут', gender: 'f' },
	{ firstName: 'Андрій', lastName: 'Чорноморець', gender: 'm' },
	{ firstName: 'Софія', lastName: 'Дусман', gender: 'f' },
	{ firstName: 'Єлізавета', lastName: 'Поліщук', gender: 'f' },
	{ firstName: 'Іда', lastName: 'Балабаш', gender: 'f' },
	{ firstName: 'Єлизавета', lastName: 'Бичкова', gender: 'f' },
	{ firstName: 'Каріна', lastName: 'Осоченко', gender: 'f' },
	{ firstName: 'Еліна', lastName: 'Чебан-Лянка', gender: 'f' },
	{ firstName: 'Юрій', lastName: 'Юраш', gender: 'm' },
	{ firstName: 'Єва', lastName: 'Кравченко', gender: 'f' },
	{ firstName: 'Микита', lastName: 'Кацен', gender: 'm' },
	{ firstName: 'Дарʼя', lastName: 'Козак', gender: 'f' },
	{ firstName: 'Андрій', lastName: 'Масензов', gender: 'm' },
	{ firstName: 'Кіра', lastName: 'Смагіна', gender: 'f' },
	{ firstName: 'Олександра', lastName: 'Брагарник', gender: 'f' },
	{ firstName: 'Софія', lastName: 'Передістова', gender: 'f' },
	{ firstName: 'Поліна', lastName: 'Лукащук', gender: 'f' },
	{ firstName: 'Джаміла', lastName: 'Кучер', gender: 'f' },
	{ firstName: 'Шахерізада', lastName: 'Кучер', gender: 'f' },
	{ firstName: 'Максим', lastName: 'Стоянов', gender: 'm' }
];
