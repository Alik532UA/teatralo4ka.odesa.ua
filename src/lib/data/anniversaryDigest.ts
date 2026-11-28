export interface DigestQuestion {
	id: string;
	questionUk: string;
	questionEn: string;
	hintLabelUk: string;
	hintLabelEn: string;
	hintUrl: string;
	isInternalHint?: boolean;
}

export interface DigestEpisode {
	number: number;
	published: boolean;
	dateUk: string;
	dateEn: string;
	titleUk: string;
	titleEn: string;
	subtitleUk: string;
	subtitleEn: string;
	youtubeUrl: string;
	questions: DigestQuestion[];
}

export const ANNIVERSARY_DIGEST_META = {
	hashtags: ['#30роківДТШ', '#ДізнайсяТаємниціШколи'],
	titleUk: 'Ювілейний відео-дайджест: 30 років «Театрало4ки»',
	titleEn: '30th Anniversary Video Digest of Teatralo4ka',
	greetingUk:
		'Вітаємо усіх мешканців Планети ДТШ — наших працівників, викладачів, учнів, батьків, випускників, глядачів — усіх, хто святкує 30-річний ювілей Одеської театральної школи! 😍',
	greetingEn:
		'Greetings to everyone on Planet DTS — our staff, teachers, students, parents, graduates, and audiences — everyone celebrating the 30th anniversary of Odesa Theatre School! 😍',
	inviteUk:
		'Запрошуємо подивитися наш 5-серійний дайджест, присвячений історії іменинниці. Згадайте разом з нами прекрасні події, які залишаться у серці! ❤️',
	inviteEn:
		'We invite you to watch our 5-episode digest dedicated to the birthday school’s history. Relive the wonderful moments that stay in our hearts forever! ❤️',
	quizCtaUk:
		'Перевірте ваші знання історії «Театрало4ки»! Пишіть відповіді у коментарях під відео — найактивніших чекають призи! З Днем народження нас! 🥳🤩🍾',
	quizCtaEn:
		'Test your knowledge of Teatralo4ka’s history! Write your answers in the comments under the video — prizes await the most active participants! Happy Birthday to us! 🥳🤩🍾',
	instagramUrl: 'https://www.instagram.com/teatralo4ka_official_/',
	youtubeChannelUrl: 'https://www.youtube.com/@teatralo4ka_odesa'
} as const;

export const ANNIVERSARY_DIGEST_EPISODES: readonly DigestEpisode[] = [
	{
		number: 1,
		published: true,
		dateUk: '25 листопада 2026',
		dateEn: 'November 25, 2026',
		titleUk: 'Серія 1 · Таємниці історії школи',
		titleEn: 'Episode 1 · Secrets of the School’s History',
		subtitleUk: 'Перші факти, випускники та знакові сезони ДТШ',
		subtitleEn: 'First facts, graduates, and landmark DTS seasons',
		youtubeUrl: 'https://youtube.com/shorts/Yiy00zpYZU0',
		questions: [
			{
				id: 'ep1-q1',
				questionUk: 'Назвіть 4 офіційні назви «Театрало4ки» з 1996 року.',
				questionEn: 'Name the 4 official names of Teatralo4ka since 1996.',
				hintLabelUk: 'Підказка — на сторінці історії школи',
				hintLabelEn: 'Hint — on the school history page',
				hintUrl: '/history',
				isInternalHint: true
			},
			{
				id: 'ep1-q2',
				questionUk:
					'Яка кількість випускників школи стали студентами творчих навчальних закладів у 2026 році?',
				questionEn:
					'How many school graduates became students of creative arts institutions in 2026?',
				hintLabelUk: 'Підказка — у дописі на Facebook',
				hintLabelEn: 'Hint — in the Facebook post',
				hintUrl: 'https://www.facebook.com/share/p/1GevbeSacq/'
			},
			{
				id: 'ep1-q3',
				questionUk: 'Яка тема була використана на відкриття 27 сезону Одеської театральної школи?',
				questionEn:
					'What theme was used for the opening of the 27th season of Odesa Theatre School?',
				hintLabelUk: 'Підказка — у відео на YouTube',
				hintLabelEn: 'Hint — in the YouTube video',
				hintUrl: 'https://youtu.be/2NaBUKx7PDc?si=_jD0WO9E5khnd_Tw'
			}
		]
	},
	{
		number: 2,
		published: true,
		dateUk: '26 листопада 2026',
		dateEn: 'November 26, 2026',
		titleUk: 'Серія 2 · 2016–2021 рр.',
		titleEn: 'Episode 2 · 2016–2021',
		subtitleUk: 'Хто пам’ятає цю яскраву 5-річку? 20-річчя ДТШ, «Театр.PRO» та перемоги',
		subtitleEn: 'Who remembers this bright 5-year era? 20th anniversary, Teatr.PRO & victories',
		youtubeUrl: 'https://youtube.com/shorts/3eFGcjIoO9A',
		questions: [
			{
				id: 'ep2-q1',
				questionUk: 'Згадайте головний музичний трек 20-річчя ДТШ.',
				questionEn: 'Name the main musical track of the 20th anniversary of DTS.',
				hintLabelUk: 'Підказка — у відео на YouTube',
				hintLabelEn: 'Hint — in the YouTube video',
				hintUrl: 'https://youtu.be/I15G9sMiqb4'
			},
			{
				id: 'ep2-q2',
				questionUk:
					'Назвіть хоч одного київського представника Експертної ради нашого фестивалю «Театр.PRO».',
				questionEn:
					'Name at least one Kyiv representative of the Expert Council of our Teatr.PRO festival.',
				hintLabelUk: 'Підказка — на сторінці історії школи',
				hintLabelEn: 'Hint — on the school history page',
				hintUrl: '/history',
				isInternalHint: true
			},
			{
				id: 'ep2-q3',
				questionUk:
					'Яка вистава ДТШ перемогла на 1-му Всеукраїнському інтернет-конкурсі «Театр.net»-2020?',
				questionEn:
					'Which DTS performance won the 1st All-Ukrainian Online Contest “Teatr.net”-2020?',
				hintLabelUk: 'Підказка — у відео на YouTube',
				hintLabelEn: 'Hint — in the YouTube video',
				hintUrl: 'https://youtu.be/hHp8Evi3vVU'
			}
		]
	},
	{
		number: 3,
		published: true,
		dateUk: '27 листопада 2026',
		dateEn: 'November 27, 2026',
		titleUk: 'Серія 3 · 2011–2016 рр.',
		titleEn: 'Episode 3 · 2011–2016',
		subtitleUk: 'Хто пам’ятає, як починався історичний етап «Театрало4ки» на Софіївській?',
		subtitleEn: 'Who remembers how Teatralo4ka’s historic chapter on Sofiivska began?',
		youtubeUrl: 'https://vimeo.com/reviews/9ec9ad69-d0f3-497f-9c8c-55329cabac24/videos/1250797003',
		questions: [
			{
				id: 'ep3-q1',
				questionUk: 'В якому році у 7 аудиторії з’явилась справжня сцена?',
				questionEn: 'In what year did Room 7 get a real stage?',
				hintLabelUk: 'Підказка — у відео на YouTube',
				hintLabelEn: 'Hint — in the YouTube video',
				hintUrl: 'https://youtu.be/wnoOpWxBcgs'
			},
			{
				id: 'ep3-q2',
				questionUk: 'Який танець виконували викладачі ДТШ на відкриття 17-го сезону?',
				questionEn: 'What dance did DTS teachers perform at the opening of the 17th season?',
				hintLabelUk: 'Підказка — у відео на YouTube',
				hintLabelEn: 'Hint — in the YouTube video',
				hintUrl: 'https://youtu.be/rDl9cAkoe7Q'
			},
			{
				id: 'ep3-q3',
				questionUk: 'Якого року випуску «зірка» ДТШ тієї п’ятирічки Павло Кошка?',
				questionEn: 'What graduation year is Pavlo Koshka, the DTS star of that five-year period?',
				hintLabelUk: 'Підказка — на сторінці випускника',
				hintLabelEn: 'Hint — on the graduate profile page',
				hintUrl: '/projects/galaxy-graduates/pavlo-koshka',
				isInternalHint: true
			}
		]
	},
	{
		number: 4,
		published: true,
		dateUk: '28 листопада 2026',
		dateEn: 'November 28, 2026',
		titleUk: 'Серія 4 · 2006–2011 рр.',
		titleEn: 'Episode 4 · 2006–2011',
		subtitleUk: 'Теплий «ламповий» дайджест про ДТШ на Сабанєєвому мосту, 3 ❤️',
		subtitleEn: 'A warm “cozy” digest about DTS on Sabaneev Bridge, 3 ❤️',
		youtubeUrl: 'https://youtube.com/shorts/C3OyemW8wXw',
		questions: [
			{
				id: 'ep4-q1',
				questionUk: 'В якому році Олена Борисівна стала директором театральної школи?',
				questionEn: 'In what year did Olena Borysivna become director of the theatre school?',
				hintLabelUk: 'Підказка — на сторінці історії школи',
				hintLabelEn: 'Hint — on the school history page',
				hintUrl: '/history',
				isInternalHint: true
			},
			{
				id: 'ep4-q2',
				questionUk:
					'Як називалася улюблена група С.Н.? (в неї усі улюблені, але ця — окреме кохання 😍)',
				questionEn:
					'What was S.N.’s favorite group called? (she loves them all, but this one is a special love 😍)',
				hintLabelUk: 'Підказка — у відео на YouTube',
				hintLabelEn: 'Hint — in the YouTube video',
				hintUrl: 'https://youtu.be/0mXWLsQLZi8'
			},
			{
				id: 'ep4-q3',
				questionUk: 'Скільки важив Ф.Ф. у 2007 році?',
				questionEn: 'How much did F.F. weigh in 2007?',
				hintLabelUk: 'Приблизна підказка — у відео на YouTube',
				hintLabelEn: 'Approximate hint — in the YouTube video',
				hintUrl: 'https://youtu.be/99Rslmmful8a'
			}
		]
	},
	{
		number: 5,
		published: false,
		dateUk: 'Скоро',
		dateEn: 'Coming soon',
		titleUk: 'Серія 5 · Фінал',
		titleEn: 'Episode 5 · Finale',
		subtitleUk: 'Фінальна серія дайджесту — скоро',
		subtitleEn: 'The final episode of the digest — coming soon',
		youtubeUrl: '',
		questions: []
	}
];
