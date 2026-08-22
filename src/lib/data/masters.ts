import { asset } from '$app/paths';
import type { Department } from './graduates';

export type MasterStatus = 'active' | 'honorary' | 'history';

export interface Master {
	id: string;
	slug: string;
	displayName: string;
	fullName: string;
	displayNameEn: string;
	fullNameEn: string;
	departments: Department[];
	photo?: string;
	bio?: string;
	status?: MasterStatus;
	isHonorary?: boolean;
	subjects?: string[];
}

export interface MasterStudentEntry {
	graduate: GraduateIndexEntry;
	role: 'master' | 'teacher';
	subject?: string;
}

export const MASTERS: Master[] = [
	// ─── ДІЮЧІ ВИКЛАДАЧІ ТА КОНЦЕРТМЕЙСТЕРИ ───
	{
		id: 'svitlana-ryskina',
		slug: 'svitlana-ryskina',
		displayName: 'Світлана РИСЬКІНА',
		fullName: 'Риськіна Світлана Миколаївна',
		displayNameEn: 'Svitlana RYSKINA',
		fullNameEn: 'Svitlana Ryskina',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Акторська майстерність', 'Сценічна мова'],
		photo: asset('/masters/svitlana-ryskina.webp')
	},
	{
		id: 'tetiana-isachkina',
		slug: 'tetiana-isachkina',
		displayName: 'Тетяна ІСАЧКІНА',
		fullName: 'Ісачкіна Тетяна Валеріївна',
		displayNameEn: 'Tetiana ISACHKINA',
		fullNameEn: 'Tetiana Isachkina',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Акторська майстерність', 'Сценічна мова'],
		photo: asset('/masters/tetiana-isachkina.webp')
	},
	{
		id: 'fedir-tkach',
		slug: 'fedir-tkach',
		displayName: 'Федір ТКАЧ',
		fullName: 'Ткач Федір Федорович',
		displayNameEn: 'Fedir TKACH',
		fullNameEn: 'Fedir Tkach',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Акторська майстерність'],
		photo: asset('/masters/fedir-tkach.webp')
	},
	{
		id: 'olena-tkach',
		slug: 'olena-tkach',
		displayName: 'Олена ТКАЧ',
		fullName: 'Ткач Олена Борисівна',
		displayNameEn: 'Olena TKACH',
		fullNameEn: 'Olena Tkach',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'olena-prorok',
		slug: 'olena-prorok',
		displayName: 'Олена ПРОРОК',
		fullName: 'Пророк Олена Володимирівна',
		displayNameEn: 'Olena PROROK',
		fullNameEn: 'Olena Prorok',
		departments: ['piano'],
		status: 'active',
		subjects: ['Фортепіано'],
		photo: asset('/masters/olena-prorok.webp')
	},
	{
		id: 'vira-koval',
		slug: 'vira-koval',
		displayName: 'Віра КОВАЛЬ',
		fullName: 'Коваль Віра Борисівна',
		displayNameEn: 'Vira KOVAL',
		fullNameEn: 'Vira Koval',
		departments: ['art'],
		status: 'active',
		subjects: ['Образотворче мистецтво'],
		photo: asset('/masters/vira-koval.webp')
	},
	{
		id: 'iryna-ovcharenko',
		slug: 'iryna-ovcharenko',
		displayName: 'Ірина ОВЧАРЕНКО',
		fullName: 'Овчаренко Ірина Григорівна',
		displayNameEn: 'Iryna OVCHARENKO',
		fullNameEn: 'Iryna Ovcharenko',
		departments: ['vocal'],
		status: 'active',
		subjects: ['Вокал'],
		photo: asset('/masters/iryna-ovcharenko.webp')
	},
	{
		id: 'natalia-stepanenko',
		slug: 'natalia-stepanenko',
		displayName: 'Наталя СТЕПАНЕНКО',
		fullName: 'Степаненко Наталія Петрівна',
		displayNameEn: 'Natalia STEPANENKO',
		fullNameEn: 'Natalia Stepanenko',
		departments: ['guitar'],
		status: 'active',
		subjects: ['Гітара']
	},
	{
		id: 'vira-yemtsova-datsiuk',
		slug: 'vira-yemtsova-datsiuk',
		displayName: 'Віра ЄМЦОВА-ДАЦЮК',
		fullName: 'Ємцова-Дацюк Віра Вікторівна',
		displayNameEn: 'Vira YEMTSOVA-DATSIUK',
		fullNameEn: 'Vira Yemtsova-Datsiuk',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Сценічна мова']
	},
	{
		id: 'tereza-zaurbekova',
		slug: 'tereza-zaurbekova',
		displayName: 'Тереза ЗАУРБЕКОВА',
		fullName: 'Заурбекова Тереза Валеріївна',
		displayNameEn: 'Tereza ZAURBEKOVA',
		fullNameEn: 'Tereza Zaurbekova',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Акторська майстерність'],
		photo: asset('/masters/tereza-zaurbekova.webp')
	},
	{
		id: 'oksana-panchenko',
		slug: 'oksana-panchenko',
		displayName: 'Оксана ПАНЧЕНКО',
		fullName: 'Панченко Оксана Костянтинівна',
		displayNameEn: 'Oksana PANCHENKO',
		fullNameEn: 'Oksana Panchenko',
		departments: ['music'],
		status: 'active',
		subjects: ['Музика'],
		photo: asset('/masters/oksana-panchenko.webp')
	},
	{
		id: 'natalia-bakina',
		slug: 'natalia-bakina',
		displayName: 'Наталя БАКІНА',
		fullName: 'Бакіна Наталя Геннадіївна',
		displayNameEn: 'Natalia BAKINA',
		fullNameEn: 'Natalia Bakina',
		departments: ['vocal'],
		status: 'active',
		subjects: ['Вокал']
	},
	{
		id: 'anastasiia-nikolaieva',
		slug: 'anastasiia-nikolaieva',
		displayName: 'Анастасія НІКОЛАЄВА',
		fullName: 'Ніколаєва Анастасія Олексіївна',
		displayNameEn: 'Anastasiia NIKOLAIEVA',
		fullNameEn: 'Anastasiia Nikolaieva',
		departments: ['vocal'],
		status: 'active',
		subjects: ['Вокал'],
		photo: asset('/masters/anastasiia-nikolaieva.webp')
	},
	{
		id: 'hanna-serebriannikova',
		slug: 'hanna-serebriannikova',
		displayName: 'Ганна СЕРЕБРЯННІКОВА',
		fullName: 'Серебряннікова Ганна Іванівна',
		displayNameEn: 'Hanna SEREBRYANNIKOVA',
		fullNameEn: 'Hanna Serebryannikova',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'iryna-kulbaba',
		slug: 'iryna-kulbaba',
		displayName: 'Ірина КУЛЬБАБА',
		fullName: 'Кульбаба Ірина Борисівна',
		displayNameEn: 'Iryna KULBABA',
		fullNameEn: 'Iryna Kulbaba',
		departments: ['theatre'],
		status: 'active',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'natalia-shkolna',
		slug: 'natalia-shkolna',
		displayName: 'Наталя ШКОЛЬНА-ВОЛОШИНОВА',
		fullName: 'Школьна-Волошинова Наталя Анатоліївна',
		displayNameEn: 'Natalia SHKOLNA-VOLOSHYNOVA',
		fullNameEn: 'Natalia Shkolna-Voloshynova',
		departments: ['vocal'],
		status: 'active',
		subjects: ['Вокал']
	},
	{
		id: 'kateryna-bilenko',
		slug: 'kateryna-bilenko',
		displayName: 'Катерина БІЛЕНКО',
		fullName: 'Біленко Катерина Юріївна',
		displayNameEn: 'Kateryna BILENKO',
		fullNameEn: 'Kateryna Bilenko',
		departments: ['music'],
		status: 'active',
		subjects: ['Музика'],
		photo: asset('/masters/kateryna-bilenko.webp')
	},
	{
		id: 'nataliia-afanasieva',
		slug: 'nataliia-afanasieva',
		displayName: 'Наталія АФАНАСЬЄВА',
		fullName: 'Афанасьєва Наталія Анатоліївна',
		displayNameEn: 'Nataliia AFANASIEVA',
		fullNameEn: 'Nataliia Afanasieva',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'liudmyla-baranova',
		slug: 'liudmyla-baranova',
		displayName: 'Людмила БАРАНОВА',
		fullName: 'Баранова Людмила Володимирівна',
		displayNameEn: 'Liudmyla BARANOVA',
		fullNameEn: 'Liudmyla Baranova',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'yevheniia-bohdanova',
		slug: 'yevheniia-bohdanova',
		displayName: 'Євгенія БОГДАНОВА',
		fullName: 'Богданова Євгенія Костянтинівна',
		displayNameEn: 'Yevheniia BOHDANOVA',
		fullNameEn: 'Yevheniia Bohdanova',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'yevheniia-bondar',
		slug: 'yevheniia-bondar',
		displayName: 'Євгенія БОНДАР',
		fullName: 'Бондар Євгенія Миколаївна',
		displayNameEn: 'Yevheniia BONDAR',
		fullNameEn: 'Yevheniia Bondar',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'mariia-buimovych',
		slug: 'mariia-buimovych',
		displayName: 'Марія БУЙМОВИЧ',
		fullName: 'Буймович Марія Сергіївна',
		displayNameEn: 'Mariia BUIMOVYCH',
		fullNameEn: 'Mariia Buimovych',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'olha-buinytska',
		slug: 'olha-buinytska',
		displayName: 'Ольга БУЙНИЦЬКА',
		fullName: 'Буйницька Ольга Самсонівна',
		displayNameEn: 'Olha BUINYTSKA',
		fullNameEn: 'Olha Buinytska',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'yevheniia-osadcha',
		slug: 'yevheniia-osadcha',
		displayName: 'Євгенія ОСАДЧА',
		fullName: 'Осадча Євгенія Іванівна',
		displayNameEn: 'Yevheniia OSADCHA',
		fullNameEn: 'Yevheniia Osadcha',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'nataliia-burian',
		slug: 'nataliia-burian',
		displayName: 'Наталія БУР\'ЯН',
		fullName: 'Бур\'ян Наталія Олегівна',
		displayNameEn: 'Nataliia BURIAN',
		fullNameEn: 'Nataliia Burian',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'anhelina-kozlova',
		slug: 'anhelina-kozlova',
		displayName: 'Ангеліна КОЗЛОВА',
		fullName: 'Козлова Ангеліна Олександрівна',
		displayNameEn: 'Anhelina KOZLOVA',
		fullNameEn: 'Anhelina Kozlova',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'elmir-hanbarov',
		slug: 'elmir-hanbarov',
		displayName: 'Ельмір ГАНБАРОВ',
		fullName: 'Ганбаров Ельмір Тагі-Огли',
		displayNameEn: 'Elmir HANBAROV',
		fullNameEn: 'Elmir Hanbarov',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'olena-haraieva',
		slug: 'olena-haraieva',
		displayName: 'Олена ГАРАЄВА',
		fullName: 'Гараєва Олена Павлівна',
		displayNameEn: 'Olena HARAIEVA',
		fullNameEn: 'Olena Haraieva',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'viktor-danilesku',
		slug: 'viktor-danilesku',
		displayName: 'Віктор ДАНІЛЕСКУ',
		fullName: 'Данілеску Віктор Вікторович',
		displayNameEn: 'Viktor DANILESKU',
		fullNameEn: 'Viktor Danilesku',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'daria-dias-valdis',
		slug: 'daria-dias-valdis',
		displayName: 'Дар\'я ДІАС ВАЛДІС',
		fullName: 'Діас Валдіс Дар\'я Михайлівна',
		displayNameEn: 'Daria DIAS VALDIS',
		fullNameEn: 'Daria Dias Valdis',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'liusiia-dun',
		slug: 'liusiia-dun',
		displayName: 'Люсія ДУН',
		fullName: 'Дун Люсія Геннадіївна',
		displayNameEn: 'Liusiia DUN',
		fullNameEn: 'Liusiia Dun',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'svitlana-kyselova',
		slug: 'svitlana-kyselova',
		displayName: 'Світлана КІСЕЛЬОВА',
		fullName: 'Кісельова Світлана Валеріївна',
		displayNameEn: 'Svitlana KISELOVA',
		fullNameEn: 'Svitlana Kiselova',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'andrii-klymenko',
		slug: 'andrii-klymenko',
		displayName: 'Андрій КЛИМЕНКО',
		fullName: 'Клименко Андрій Дмитрович',
		displayNameEn: 'Andrii KLYMENKO',
		fullNameEn: 'Andrii Klymenko',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'yana-kovalchuk',
		slug: 'yana-kovalchuk',
		displayName: 'Яна КОВАЛЬЧУК',
		fullName: 'Ковальчук Яна Вікторівна',
		displayNameEn: 'Yana KOVALCHUK',
		fullNameEn: 'Yana Kovalchuk',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'olena-kondratska',
		slug: 'olena-kondratska',
		displayName: 'Олена КОНДРАЦЬКА',
		fullName: 'Кондрацька Олена Павлівна',
		displayNameEn: 'Olena KONDRATSKA',
		fullNameEn: 'Olena Kondratska',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'olena-konnikova',
		slug: 'olena-konnikova',
		displayName: 'Олена КОННІКОВА',
		fullName: 'Коннікова Олена Костянтинівна',
		displayNameEn: 'Olena KONNIKOVA',
		fullNameEn: 'Olena Konnikova',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'alisa-kocheva',
		slug: 'alisa-kocheva',
		displayName: 'Аліса КОЧЕВА',
		fullName: 'Кочева Аліса Андріївна',
		displayNameEn: 'Alisa KOCHEVA',
		fullNameEn: 'Alisa Kocheva',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'vira-kurova',
		slug: 'vira-kurova',
		displayName: 'Віра КУРОВА',
		fullName: 'Курова Віра Михайлівна',
		displayNameEn: 'Vira KUROVA',
		fullNameEn: 'Vira Kurova',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'olha-maiorova',
		slug: 'olha-maiorova',
		displayName: 'Ольга МАЙОРОВА',
		fullName: 'Майорова Ольга Олександрівна',
		displayNameEn: 'Olha MAIOROVA',
		fullNameEn: 'Olha Maiorova',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'viktoriia-marar',
		slug: 'viktoriia-marar',
		displayName: 'Вікторія МАРАР',
		fullName: 'Марар Вікторія Олександрівна',
		displayNameEn: 'Viktoriia MARAR',
		fullNameEn: 'Viktoriia Marar',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'svitlana-myronenko',
		slug: 'svitlana-myronenko',
		displayName: 'Світлана МИРОНЕНКО',
		fullName: 'Мироненко Світлана Володимирівна',
		displayNameEn: 'Svitlana MYRONENKO',
		fullNameEn: 'Svitlana Myronenko',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'vladyslav-mykhailiuk',
		slug: 'vladyslav-mykhailiuk',
		displayName: 'Владислав МИХАЙЛЮК',
		fullName: 'Михайлюк Владислав Романович',
		displayNameEn: 'Vladyslav MYKHAILIUK',
		fullNameEn: 'Vladyslav Mykhailiuk',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'tetiana-minina',
		slug: 'tetiana-minina',
		displayName: 'Тетяна МІНІНА',
		fullName: 'Мініна Тетяна Сергіївна',
		displayNameEn: 'Tetiana MININA',
		fullNameEn: 'Tetiana Minina',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'dariia-nadozha',
		slug: 'dariia-nadozha',
		displayName: 'Дар\'я НАДЬОЖА',
		fullName: 'Надьожа Дар\'я Григорівна',
		displayNameEn: 'Dariia NADOZHA',
		fullNameEn: 'Dariia Nadozha',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'hanna-nikolaieva',
		slug: 'hanna-nikolaieva',
		displayName: 'Ганна НІКОЛАЄВА',
		fullName: 'Ніколаєва Ганна Станіславівна',
		displayNameEn: 'Hanna NIKOLAIEVA',
		fullNameEn: 'Hanna Nikolaieva',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'natalia-orlova',
		slug: 'natalia-orlova',
		displayName: 'Наталя ОРЛОВА',
		fullName: 'Орлова Наталя Олександрівна',
		displayNameEn: 'Natalia ORLOVA',
		fullNameEn: 'Natalia Orlova',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'svitlana-ostapova',
		slug: 'svitlana-ostapova',
		displayName: 'Світлана ОСТАПОВА',
		fullName: 'Остапова Світлана Іванівна',
		displayNameEn: 'Svitlana OSTAPOVA',
		fullNameEn: 'Svitlana Ostapova',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'olena-pavliukova',
		slug: 'olena-pavliukova',
		displayName: 'Олена ПАВЛЮКОВА',
		fullName: 'Павлюкова Олена Григорівна',
		displayNameEn: 'Olena PAVLIUKOVA',
		fullNameEn: 'Olena Pavliukova',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'kristina-petrova',
		slug: 'kristina-petrova',
		displayName: 'Крістіна ПЕТРОВА',
		fullName: 'Петрова Крістіна Олегівна',
		displayNameEn: 'Kristina PETROVA',
		fullNameEn: 'Kristina Petrova',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'hanna-podzihun',
		slug: 'hanna-podzihun',
		displayName: 'Ганна ПОДЗІГУН',
		fullName: 'Подзігун Ганна Яківна',
		displayNameEn: 'Hanna PODZIHUN',
		fullNameEn: 'Hanna Podzihun',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'pavlo-prymak',
		slug: 'pavlo-prymak',
		displayName: 'Павло ПРИМАК',
		fullName: 'Примак Павло Андрійович',
		displayNameEn: 'Pavlo PRYMAK',
		fullNameEn: 'Pavlo Prymak',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'yuliia-purina',
		slug: 'yuliia-purina',
		displayName: 'Юлія ПУРІНА',
		fullName: 'Пуріна Юлія Володимирівна',
		displayNameEn: 'Yuliia PURINA',
		fullNameEn: 'Yuliia Purina',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'svitlana-radiushyna',
		slug: 'svitlana-radiushyna',
		displayName: 'Світлана РАДЮШИНА',
		fullName: 'Радюшина Світлана Олександрівна',
		displayNameEn: 'Svitlana RADIUSHYNA',
		fullNameEn: 'Svitlana Radiushyna',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'diana-rudenko',
		slug: 'diana-rudenko',
		displayName: 'Діана РУДЕНКО',
		fullName: 'Руденко Діана Владиславівна',
		displayNameEn: 'Diana RUDENKO',
		fullNameEn: 'Diana Rudenko',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'kira-rusina',
		slug: 'kira-rusina',
		displayName: 'Кіра РУСІНА',
		fullName: 'Русіна Кіра Аркадіївна',
		displayNameEn: 'Kira RUSINA',
		fullNameEn: 'Kira Rusina',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'liubov-savina',
		slug: 'liubov-savina',
		displayName: 'Любов САВІНА',
		fullName: 'Савіна Любов Федорівна',
		displayNameEn: 'Liubov SAVINA',
		fullNameEn: 'Liubov Savina',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'oleksandra-sklifosovska',
		slug: 'oleksandra-sklifosovska',
		displayName: 'Олександра СКЛІФОСОВСЬКА',
		fullName: 'Скліфосовська Олександра Сергіївна',
		displayNameEn: 'Oleksandra SKLIFOSOVSKA',
		fullNameEn: 'Oleksandra Sklifosovska',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'tetiana-stohul',
		slug: 'tetiana-stohul',
		displayName: 'Тетяна СТОГУЛ',
		fullName: 'Стогул Тетяна Володимирівна',
		displayNameEn: 'Tetiana STOHUL',
		fullNameEn: 'Tetiana Stohul',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'havriil-terekhov',
		slug: 'havriil-terekhov',
		displayName: 'Гавріїл ТЕРЕХОВ',
		fullName: 'Терехов Гавріїл Євгенович',
		displayNameEn: 'Havriil TEREKHOV',
		fullNameEn: 'Havriil Terekhov',
		departments: ['piano'],
		status: 'active'
	},
	{
		id: 'iryna-tilniak',
		slug: 'iryna-tilniak',
		displayName: 'Ірина ТІЛЬНЯК',
		fullName: 'Тільняк Ірина Олександрівна',
		displayNameEn: 'Iryna TILNIAK',
		fullNameEn: 'Iryna Tilniak',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'vladyslav-tsobenko',
		slug: 'vladyslav-tsobenko',
		displayName: 'Владислав ЦОБЕНКО',
		fullName: 'Цобенко Владислав Віталійович',
		displayNameEn: 'Vladyslav TSOBENKO',
		fullNameEn: 'Vladyslav Tsobenko',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'olha-chervoniak',
		slug: 'olha-chervoniak',
		displayName: 'Ольга ЧЕРВОНЯК',
		fullName: 'Червоняк Ольга Василівна',
		displayNameEn: 'Olha CHERVONIAK',
		fullNameEn: 'Olha Chervoniak',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'svitlana-shvets',
		slug: 'svitlana-shvets',
		displayName: 'Світлана ШВЕЦЬ',
		fullName: 'Швець Світлана Геннадіївна',
		displayNameEn: 'Svitlana SHVETS',
		fullNameEn: 'Svitlana Shvets',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'oksana-shchenk',
		slug: 'oksana-shchenk',
		displayName: 'Оксана ЩЕНХ',
		fullName: 'Щенх Оксана Федорівна',
		displayNameEn: 'Oksana SHCHENKH',
		fullNameEn: 'Oksana Shchenkh',
		departments: ['theatre'],
		status: 'active'
	},
	{
		id: 'tetiana-shcherbyna',
		slug: 'tetiana-shcherbyna',
		displayName: 'Тетяна ЩЕРБИНА',
		fullName: 'Щербина Тетяна Іванівна',
		displayNameEn: 'Tetiana SHCHERBYNA',
		fullNameEn: 'Tetiana Shcherbyna',
		departments: ['theatre'],
		status: 'active'
	},

	// ─── СВІТЛА ПАМ'ЯТЬ ───
	{
		id: 'samuil-imas',
		slug: 'samuil-imas',
		displayName: 'Самуїл ІМАС',
		fullName: 'Імас Самуїл Михайлович',
		displayNameEn: 'Samuil IMAS',
		fullNameEn: 'Samuil Imas',
		departments: ['theatre'],
		status: 'honorary',
		isHonorary: true,
		subjects: ['Риторика та поетика', 'Акторська майстерність']
	},
	{
		id: 'mykola-baldin',
		slug: 'mykola-baldin',
		displayName: 'Микола БАЛДІН',
		fullName: 'Балдін Микола Олександрович',
		displayNameEn: 'Mykola BALDIN',
		fullNameEn: 'Mykola Baldin',
		departments: ['theatre'],
		status: 'honorary',
		isHonorary: true,
		subjects: ['Сценічний рух']
	},
	{
		id: 'iryna-kaplia',
		slug: 'iryna-kaplia',
		displayName: 'Ірина КАПЛЯ',
		fullName: 'Капля Ірина',
		displayNameEn: 'Iryna KAPLIA',
		fullNameEn: 'Iryna Kaplia',
		departments: ['theatre'],
		status: 'honorary',
		isHonorary: true,
		subjects: ['Акторська майстерність']
	},

	// ─── ІСТОРІЯ ───
	{
		id: 'hanna-tkach',
		slug: 'hanna-tkach',
		displayName: 'Ганна ТКАЧ',
		fullName: 'Ткач Ганна Федорівна',
		displayNameEn: 'Hanna TKACH',
		fullNameEn: 'Hanna Tkach',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'oleh-shevchuk',
		slug: 'oleh-shevchuk',
		displayName: 'Олег ШЕВЧУК',
		fullName: 'Шевчук Олег В.',
		displayNameEn: 'Oleh SHEVCHUK',
		fullNameEn: 'Oleh Shevchuk',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'pavlo-koshka',
		slug: 'pavlo-koshka',
		displayName: 'Павло КОШКА',
		fullName: 'Кошка Павло Володимирович',
		displayNameEn: 'Pavlo KOSHKA',
		fullNameEn: 'Pavlo Koshka',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'iryna-ulianenko',
		slug: 'iryna-ulianenko',
		displayName: 'Ірина УЛЬЯНЕНКО',
		fullName: 'Ульяненко Ірина Андріївна',
		displayNameEn: 'Iryna ULIANENKO',
		fullNameEn: 'Iryna Ulianenko',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Сценічна мова']
	},
	{
		id: 'liliia-velychko',
		slug: 'liliia-velychko',
		displayName: 'Лілія ВЕЛИЧКО',
		fullName: 'Величко Лілія Миколаївна',
		displayNameEn: 'Liliia VELYCHKO',
		fullNameEn: 'Liliia Velychko',
		departments: ['vocal'],
		status: 'history',
		subjects: ['Вокал'],
		photo: asset('/masters/liliia-velychko.webp')
	},
	{
		id: 'myroslava-derepa',
		slug: 'myroslava-derepa',
		displayName: 'Мирослава ДЕРЕПА',
		fullName: 'Дерепа Мирослава Ігорівна',
		displayNameEn: 'Myroslava DEREPA',
		fullNameEn: 'Myroslava Derepa',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'n-rybakova',
		slug: 'n-rybakova',
		displayName: 'Надія РИБАКОВА',
		fullName: 'Рибакова Надія В.',
		displayNameEn: 'Nadiia RYBAKOVA',
		fullNameEn: 'Nadiia Rybakova',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'd-rybalchenko',
		slug: 'd-rybalchenko',
		displayName: 'Д. РИБАЛЬЧЕНКО',
		fullName: 'Рибальченко Д.Д.',
		displayNameEn: 'D. RYBALCHENKO',
		fullNameEn: 'D. Rybalchenko',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'oleksandr-kozoviakin',
		slug: 'oleksandr-kozoviakin',
		displayName: 'Олександр КОЗОВЯКІН',
		fullName: 'Козовякін Олександр',
		displayNameEn: 'Oleksandr KOZOVIAKIN',
		fullNameEn: 'Oleksandr Kozoviakin',
		departments: ['theatre'],
		status: 'history'
	},
	{
		id: 'svitlana-vitiuk',
		slug: 'svitlana-vitiuk',
		displayName: 'Світлана ВІТЮК',
		fullName: 'Вітюк Світлана',
		displayNameEn: 'Svitlana VITIUK',
		fullNameEn: 'Svitlana Vitiuk',
		departments: ['theatre'],
		status: 'history'
	},
	{
		id: 'kateryna-sukhoboievska',
		slug: 'kateryna-sukhoboievska',
		displayName: 'Катерина СУХОБОЄВСЬКА',
		fullName: 'Сухобоєвська Катерина',
		displayNameEn: 'Kateryna SUKHOBOIEVSKA',
		fullNameEn: 'Kateryna Sukhoboievska',
		departments: ['theatre'],
		status: 'history'
	},
	{
		id: 'yaroslava-turbinska',
		slug: 'yaroslava-turbinska',
		displayName: 'Ярослава ТУРБІНСЬКА',
		fullName: 'Турбінська Ярослава',
		displayNameEn: 'Yaroslava TURBINSKA',
		fullNameEn: 'Yaroslava Turbinska',
		departments: ['theatre'],
		status: 'history'
	},
	{
		id: 'anna-matkovska',
		slug: 'anna-matkovska',
		displayName: 'Анна МАТЬКОВСЬКА',
		fullName: 'Матьковська Анна',
		displayNameEn: 'Anna MATKOVSKA',
		fullNameEn: 'Anna Matkovska',
		departments: ['theatre'],
		status: 'history'
	},
	{
		id: 'svitlana-nadopta',
		slug: 'svitlana-nadopta',
		displayName: 'Світлана НАДОПТА',
		fullName: 'Надопта Світлана',
		displayNameEn: 'Svitlana NADOPTA',
		fullNameEn: 'Svitlana Nadopta',
		departments: ['theatre'],
		status: 'history',
		subjects: ['Акторська майстерність']
	},
	{
		id: 'hanna-komadovska',
		slug: 'hanna-komadovska',
		displayName: 'Ганна КОМАДОВСЬКА',
		fullName: 'Комадовська Ганна',
		displayNameEn: 'Hanna KOMADOVSKA',
		fullNameEn: 'Hanna Komadovska',
		departments: ['theatre'],
		status: 'history'
	}
];

import indexData from './graduates.index.json';
import type { GraduateIndexEntry } from './graduates';

const MASTERS_BY_ID = new Map<string, Master>(MASTERS.map((m) => [m.id, m]));
const MASTERS_BY_SLUG = new Map<string, Master>(MASTERS.map((m) => [m.slug, m]));

export function getMasterById(id: string): Master | undefined {
	return MASTERS_BY_ID.get(id);
}

export function getMasterBySlug(slug: string): Master | undefined {
	return MASTERS_BY_SLUG.get(slug);
}

export function getAllMasters(): Master[] {
	return MASTERS;
}

export function masterProfilePath(slug: string, lang = 'uk'): string {
	const base = `/residents/adults/${slug}`;
	return lang === 'en' ? `/en${base}` : base;
}

export function getStudentsByMaster(masterId: string): MasterStudentEntry[] {
	const results: MasterStudentEntry[] = [];
	const seenSlugs = new Set<string>();

	for (const g of indexData as GraduateIndexEntry[]) {
		let isMaster = false;
		if (g.masters) {
			isMaster = g.masters.some((m) => (typeof m === 'string' ? m === masterId : m.id === masterId));
		}
		if (isMaster) {
			results.push({ graduate: g, role: 'master' });
			seenSlugs.add(g.slug);
			continue;
		}

		if (g.teachers) {
			const teacherEntry = g.teachers.find((t) => (typeof t === 'string' ? t === masterId : t.id === masterId));
			if (teacherEntry) {
				const subject = typeof teacherEntry === 'object' ? teacherEntry.subject : undefined;
				results.push({ graduate: g, role: 'teacher', subject });
				seenSlugs.add(g.slug);
			}
		}
	}

	return results;
}

export function getGraduatesByMaster(masterId: string): GraduateIndexEntry[] {
	return getStudentsByMaster(masterId).map((s) => s.graduate);
}
