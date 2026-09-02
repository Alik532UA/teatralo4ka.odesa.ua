import fs from 'fs';
import path from 'path';
import { buildStatsHistory } from './build-stats-history';

export type MissingItemTuple = [id: string, title: string, subtitle?: string];

export interface StatMetric {
	id: string;
	labelUk: string;
	labelEn: string;
	descriptionUk?: string;
	descriptionEn?: string;
	total: number;
	completed: number;
	percent: number;
	missingItems: MissingItemTuple[];
}

export interface StatCategory {
	id: 'graduates' | 'groups' | 'plays' | 'masters' | 'festivals';
	titleUk: string;
	titleEn: string;
	icon: string;
	totalEntities: number;
	overallPercent: number;
	metrics: StatMetric[];
}

export interface StatsData {
	generatedAt: string;
	overallPercent: number;
	categories: StatCategory[];
}

const ROOT = process.cwd();
const GRADUATES_INDEX_PATH = path.join(ROOT, 'src/lib/data/graduates.index.json');
const GRADUATES_PROFILES_DIR = path.join(ROOT, 'static/graduates/profiles');
const GROUPS_PATH = path.join(ROOT, 'src/lib/data/groups.data.json');
const PLAYS_PATH = path.join(ROOT, 'src/lib/data/plays.data.json');
const PLAY_CAST_PATH = path.join(ROOT, 'src/lib/data/play-cast.json');
const MASTERS_INDEX_PATH = path.join(ROOT, 'src/lib/data/masters.index.json');
const MASTERS_PROFILES_DIR = path.join(ROOT, 'static/masters/profiles');
const FESTIVALS_PATH = path.join(ROOT, 'src/lib/data/festivals.data.json');
const OUTPUT_PATH = path.join(ROOT, 'static/galaxy/stats.json');

interface RawGraduateIndex {
	slug: string;
	code?: string;
	name: string;
	graduationYear?: number;
	departments?: string[];
	visibility?: string;
	hasPhoto?: boolean;
	playCount?: number;
	masters?: unknown[];
	teachers?: unknown[];
}

interface RawGraduateProfile {
	plays?: unknown[];
	bio?: string | string[];
	masters?: string[];
	teachers?: string[];
	socials?: unknown[];
}

interface RawGroup {
	slug: string;
	name: string;
	verificationStatus?: string;
	photo?: string | null;
	extraPhotos?: unknown[];
	memberIds?: string[];
	teachers?: string[];
	masters?: string[];
	playIds?: string[];
	graduationYears?: number[];
}

interface RawPlay {
	id: string;
	title: string;
	year: number;
	verificationStatus?: string;
	author?: string | null;
	theatreGroup?: string | null;
	masters?: string[];
	videoUrl?: string | null;
	participants?: string[];
	photos?: unknown[];
}

interface RawMasterIndex {
	id: string;
	slug?: string;
	displayName?: string;
	fullName?: string;
	photo?: string | null;
	roleTitle?: string | null;
	category?: string;
	subjects?: string[];
	departments?: string[];
}

interface RawMasterProfile {
	bio?: string;
	periods?: unknown[];
}

interface RawFestival {
	slug: string;
	name: string;
	year: number;
	city?: string | null;
	plays?: unknown[];
	awards?: unknown[];
}

function percent(part: number, total: number): number {
	if (total === 0) return 100;
	return Math.round((part / total) * 100);
}

function item(id: string, title: string, subtitle?: string): MissingItemTuple {
	return subtitle ? [id, title, subtitle] : [id, title];
}

function computeStats(): StatsData {
	// 1. GRADUATES (Канонічний публічний перелік — listed, ~517 випускників)
	const graduatesIndex: RawGraduateIndex[] = JSON.parse(fs.readFileSync(GRADUATES_INDEX_PATH, 'utf8'));
	const listedGraduates = graduatesIndex.filter((g) => !g.visibility || g.visibility === 'listed');
	const totalGraduates = listedGraduates.length;

	// Випускники саме театрального відділення (для вистав)
	const theatreGraduates = listedGraduates.filter(
		(g) => Array.isArray(g.departments) && g.departments.includes('theatre')
	);
	const totalTheatre = theatreGraduates.length;

	const graduateProfiles = new Map<string, RawGraduateProfile>();
	for (const g of listedGraduates) {
		const address = g.code || g.slug;
		const profileFile = path.join(GRADUATES_PROFILES_DIR, `${address}.json`);
		if (fs.existsSync(profileFile)) {
			try {
				graduateProfiles.set(g.slug, JSON.parse(fs.readFileSync(profileFile, 'utf8')));
			} catch {
				// ignore
			}
		}
	}

	const hasProfileCount = graduateProfiles.size;
	const missingProfileItems: MissingItemTuple[] = listedGraduates
		.filter((g) => !graduateProfiles.has(g.slug))
		.map((g) => item(g.code || g.slug, g.name, g.graduationYear ? `Випуск ${g.graduationYear} р.` : undefined));

	// Photo (по всіх випускниках)
	const withPhoto = listedGraduates.filter((g) => Boolean(g.hasPhoto));
	const missingPhotoGraduates: MissingItemTuple[] = listedGraduates
		.filter((g) => !g.hasPhoto)
		.map((g) => item(g.code || g.slug, g.name, g.graduationYear ? `Випуск ${g.graduationYear} р.` : undefined));

	// Plays (по всіх випускниках театрального відділення, незалежно від наявності окремої анкети)
	const withPlays = theatreGraduates.filter((g) => {
		const p = graduateProfiles.get(g.slug);
		return (g.playCount && g.playCount > 0) || (p && Array.isArray(p.plays) && p.plays.length > 0);
	});
	const missingPlaysGraduates: MissingItemTuple[] = theatreGraduates
		.filter((g) => {
			const p = graduateProfiles.get(g.slug);
			return (!g.playCount || g.playCount === 0) && (!p || !Array.isArray(p.plays) || p.plays.length === 0);
		})
		.map((g) => item(g.code || g.slug, g.name, g.graduationYear ? `Випуск ${g.graduationYear} р.` : undefined));

	// Bio (по всіх випускниках)
	const withBio = listedGraduates.filter((g) => {
		const p = graduateProfiles.get(g.slug);
		if (!p || !p.bio) return false;
		if (Array.isArray(p.bio)) return p.bio.length > 0 && p.bio.some((b) => String(b).trim() !== '');
		return String(p.bio).trim() !== '';
	});
	const missingBioGraduates: MissingItemTuple[] = listedGraduates
		.filter((g) => {
			const p = graduateProfiles.get(g.slug);
			if (!p || !p.bio) return true;
			if (Array.isArray(p.bio)) return p.bio.length === 0 || !p.bio.some((b) => String(b).trim() !== '');
			return String(p.bio).trim() === '';
		})
		.map((g) => item(g.code || g.slug, g.name, g.graduationYear ? `Випуск ${g.graduationYear} р.` : undefined));

	// Course Master (по всіх випускниках — з індексу або профілю)
	const withMaster = listedGraduates.filter((g) => {
		const p = graduateProfiles.get(g.slug);
		return (
			(Array.isArray(g.masters) && g.masters.length > 0) ||
			(p && Array.isArray(p.masters) && p.masters.length > 0)
		);
	});
	const missingMasterGraduates: MissingItemTuple[] = listedGraduates
		.filter((g) => {
			const p = graduateProfiles.get(g.slug);
			const hasM =
				(Array.isArray(g.masters) && g.masters.length > 0) ||
				(p && Array.isArray(p.masters) && p.masters.length > 0);
			return !hasM;
		})
		.map((g) => item(g.code || g.slug, g.name, g.graduationYear ? `Випуск ${g.graduationYear} р.` : undefined));

	// Teachers (по всіх випускниках — з індексу або профілю)
	const withTeachers = listedGraduates.filter((g) => {
		const p = graduateProfiles.get(g.slug);
		return (
			(Array.isArray(g.teachers) && g.teachers.length > 0) ||
			(p && Array.isArray(p.teachers) && p.teachers.length > 0)
		);
	});
	const missingTeachersGraduates: MissingItemTuple[] = listedGraduates
		.filter((g) => {
			const p = graduateProfiles.get(g.slug);
			const hasT =
				(Array.isArray(g.teachers) && g.teachers.length > 0) ||
				(p && Array.isArray(p.teachers) && p.teachers.length > 0);
			return !hasT;
		})
		.map((g) => item(g.code || g.slug, g.name, g.graduationYear ? `Випуск ${g.graduationYear} р.` : undefined));

	// Socials (по всіх випускниках)
	const withSocials = listedGraduates.filter((g) => {
		const p = graduateProfiles.get(g.slug);
		return p && Array.isArray(p.socials) && p.socials.length > 0;
	});
	const missingSocialsGraduates: MissingItemTuple[] = listedGraduates
		.filter((g) => {
			const p = graduateProfiles.get(g.slug);
			return !p || !Array.isArray(p.socials) || p.socials.length === 0;
		})
		.map((g) => item(g.code || g.slug, g.name, g.graduationYear ? `Випуск ${g.graduationYear} р.` : undefined));

	const graduatesMetrics: StatMetric[] = [
		{
			id: 'graduates_profiles',
			labelUk: 'Анкет заповнено з усіх випускників',
			labelEn: 'Profiles created of all graduates',
			descriptionUk: 'Скільки випускників з реєстру школи вже мають окрему створену анкету на сайті',
			descriptionEn: 'How many graduates from the school registry have an individual profile',
			total: totalGraduates,
			completed: hasProfileCount,
			percent: percent(hasProfileCount, totalGraduates),
			missingItems: missingProfileItems
		},
		{
			id: 'graduates_photos',
			labelUk: 'Фотопортрет',
			labelEn: 'Portrait photo',
			descriptionUk: 'Випускники з реєстру школи, які мають додану портретну світлину',
			descriptionEn: 'Graduates from school registry who have an uploaded portrait photo',
			total: totalGraduates,
			completed: withPhoto.length,
			percent: percent(withPhoto.length, totalGraduates),
			missingItems: missingPhotoGraduates
		},
		{
			id: 'graduates_plays',
			labelUk: 'Розділ «Вистави»',
			labelEn: 'Plays and roles listed',
			descriptionUk: 'Випускники театрального відділення, у яких зазначено зіграні вистави та ролі',
			descriptionEn: 'Theatre department graduates with listed theatrical productions and roles',
			total: totalTheatre,
			completed: withPlays.length,
			percent: percent(withPlays.length, totalTheatre),
			missingItems: missingPlaysGraduates
		},
		{
			id: 'graduates_bio',
			labelUk: 'Розділ «Про себе» / Спогади',
			labelEn: 'Bio and memories',
			descriptionUk: 'Випускники з розповіддю про себе, театральними спогадами або діяльністю після випуску',
			descriptionEn: 'Graduates with biographical notes or personal memories',
			total: totalGraduates,
			completed: withBio.length,
			percent: percent(withBio.length, totalGraduates),
			missingItems: missingBioGraduates
		},
		{
			id: 'graduates_masters',
			labelUk: 'Майстер курсу',
			labelEn: 'Course master specified',
			descriptionUk: 'Випускники, у яких зазначено майстра (керівника) курсу',
			descriptionEn: 'Graduates with course master assigned',
			total: totalGraduates,
			completed: withMaster.length,
			percent: percent(withMaster.length, totalGraduates),
			missingItems: missingMasterGraduates
		},
		{
			id: 'graduates_teachers',
			labelUk: 'Викладачі',
			labelEn: 'Teachers specified',
			descriptionUk: 'Випускники, де перелічено педагогів предметів (сценмова, вокал, пластика тощо)',
			descriptionEn: 'Graduates with teachers of disciplines specified',
			total: totalGraduates,
			completed: withTeachers.length,
			percent: percent(withTeachers.length, totalGraduates),
			missingItems: missingTeachersGraduates
		},
		{
			id: 'graduates_socials',
			labelUk: 'Контакти та соцмережі',
			labelEn: 'Contacts & social links',
			descriptionUk: 'Випускники з посиланнями на соцмережі, портфоліо чи контакти',
			descriptionEn: 'Graduates with links to social media or professional portfolios',
			total: totalGraduates,
			completed: withSocials.length,
			percent: percent(withSocials.length, totalGraduates),
			missingItems: missingSocialsGraduates
		}
	];

	// 2. GROUPS
	const groups: RawGroup[] = JSON.parse(fs.readFileSync(GROUPS_PATH, 'utf8'));
	const totalGroups = groups.length;

	const verifiedGroups = groups.filter((g) => g.verificationStatus === 'verified');
	const missingVerifiedGroups: MissingItemTuple[] = groups
		.filter((g) => g.verificationStatus !== 'verified')
		.map((g) => item(g.slug, g.name, g.graduationYears?.length ? `Випуск: ${g.graduationYears.join(', ')}` : undefined));

	const groupsWithPhoto = groups.filter((g) => Boolean(g.photo || (g.extraPhotos && g.extraPhotos.length > 0)));
	const missingPhotoGroups: MissingItemTuple[] = groups
		.filter((g) => !g.photo && (!g.extraPhotos || g.extraPhotos.length === 0))
		.map((g) => item(g.slug, g.name, g.graduationYears?.length ? `Випуск: ${g.graduationYears.join(', ')}` : undefined));

	const groupsFullRoster = groups.filter((g) => Array.isArray(g.memberIds) && g.memberIds.length >= 6);
	const missingRosterGroups: MissingItemTuple[] = groups
		.filter((g) => !Array.isArray(g.memberIds) || g.memberIds.length < 6)
		.map((g) => item(g.slug, g.name, `Зараз додано: ${g.memberIds?.length || 0} з 6+ осіб`));

	const groupsWithTeachers = groups.filter((g) => Array.isArray(g.teachers) && g.teachers.length >= 3);
	const missingTeachersGroups: MissingItemTuple[] = groups
		.filter((g) => !Array.isArray(g.teachers) || g.teachers.length < 3)
		.map((g) => item(g.slug, g.name, `Зараз вказано: ${g.teachers?.length || 0} з 3+ викл.`));

	const groupsWithMasters = groups.filter((g) => Array.isArray(g.masters) && g.masters.length > 0);
	const missingMastersGroups: MissingItemTuple[] = groups
		.filter((g) => !Array.isArray(g.masters) || g.masters.length === 0)
		.map((g) => item(g.slug, g.name, g.graduationYears?.length ? `Випуск: ${g.graduationYears.join(', ')}` : undefined));

	const groupsWithPlays = groups.filter((g) => Array.isArray(g.playIds) && g.playIds.length > 0);
	const missingPlaysGroups: MissingItemTuple[] = groups
		.filter((g) => !Array.isArray(g.playIds) || g.playIds.length === 0)
		.map((g) => item(g.slug, g.name, g.graduationYears?.length ? `Випуск: ${g.graduationYears.join(', ')}` : undefined));

	const groupsMetrics: StatMetric[] = [
		{
			id: 'groups_verified',
			labelUk: 'Перевірено людиною (без AI-попередження)',
			labelEn: 'Verified by human (no AI banner)',
			descriptionUk: 'Групи, чиї списки випускників та дані звірено за шкільними журналами або куратором',
			descriptionEn: 'Groups whose roster and details have been confirmed against school records',
			total: totalGroups,
			completed: verifiedGroups.length,
			percent: percent(verifiedGroups.length, totalGroups),
			missingItems: missingVerifiedGroups
		},
		{
			id: 'groups_photos',
			labelUk: 'Фотографії групи',
			labelEn: 'Group photos',
			descriptionUk: 'Групи з архівним груповим знімком або фотосесією курсу',
			descriptionEn: 'Groups with course photo or rehearsal shots',
			total: totalGroups,
			completed: groupsWithPhoto.length,
			percent: percent(groupsWithPhoto.length, totalGroups),
			missingItems: missingPhotoGroups
		},
		{
			id: 'groups_roster',
			labelUk: 'Склад групи (6+ випускників)',
			labelEn: 'Full roster (6+ members)',
			descriptionUk: 'Групи, до яких внесено щонайменше 6 випускників',
			descriptionEn: 'Groups with at least 6 graduates enrolled',
			total: totalGroups,
			completed: groupsFullRoster.length,
			percent: percent(groupsFullRoster.length, totalGroups),
			missingItems: missingRosterGroups
		},
		{
			id: 'groups_teachers',
			labelUk: 'Викладачі курсу (3+ викладачів)',
			labelEn: 'Course faculty (3+ teachers)',
			descriptionUk: 'Групи, де зазначено трьох або більше викладачів профільних дисциплін',
			descriptionEn: 'Groups with at least 3 teachers of disciplines added',
			total: totalGroups,
			completed: groupsWithTeachers.length,
			percent: percent(groupsWithTeachers.length, totalGroups),
			missingItems: missingTeachersGroups
		},
		{
			id: 'groups_masters',
			labelUk: 'Майстер курсу зазначений',
			labelEn: 'Course master assigned',
			descriptionUk: 'Групи, які мають прив’язаного керівника / майстра курсу',
			descriptionEn: 'Groups with an assigned artistic master',
			total: totalGroups,
			completed: groupsWithMasters.length,
			percent: percent(groupsWithMasters.length, totalGroups),
			missingItems: missingMastersGroups
		},
		{
			id: 'groups_plays',
			labelUk: 'Репертуар вистав прив’язано',
			labelEn: 'Play repertoire connected',
			descriptionUk: 'Групи, у яких зазначено навчальні або випускні покази',
			descriptionEn: 'Groups with connected graduation productions',
			total: totalGroups,
			completed: groupsWithPlays.length,
			percent: percent(groupsWithPlays.length, totalGroups),
			missingItems: missingPlaysGroups
		}
	];

	// 3. PLAYS
	const plays: RawPlay[] = JSON.parse(fs.readFileSync(PLAYS_PATH, 'utf8'));
	const playCast: Record<string, string[]> = JSON.parse(fs.readFileSync(PLAY_CAST_PATH, 'utf8'));
	const totalPlays = plays.length;

	const verifiedPlays = plays.filter((p) => p.verificationStatus === 'verified');
	const missingVerifiedPlays: MissingItemTuple[] = plays
		.filter((p) => p.verificationStatus !== 'verified')
		.map((p) => item(p.id, p.title, `${p.year} р.${p.theatreGroup ? ` · ${p.theatreGroup}` : ''}`));

	const playsWithAuthor = plays.filter((p) => Boolean(p.author && p.author.trim() !== ''));
	const missingAuthorPlays: MissingItemTuple[] = plays
		.filter((p) => !p.author || p.author.trim() === '')
		.map((p) => item(p.id, p.title, `${p.year} р.${p.theatreGroup ? ` · ${p.theatreGroup}` : ''}`));

	const playsWithGroup = plays.filter((p) => Boolean(p.theatreGroup && p.theatreGroup.trim() !== ''));
	const missingGroupPlays: MissingItemTuple[] = plays
		.filter((p) => !p.theatreGroup || p.theatreGroup.trim() === '')
		.map((p) => item(p.id, p.title, `${p.year} р.`));

	const playsWithMasters = plays.filter((p) => Array.isArray(p.masters) && p.masters.length > 0);
	const missingMastersPlays: MissingItemTuple[] = plays
		.filter((p) => !Array.isArray(p.masters) || p.masters.length === 0)
		.map((p) => item(p.id, p.title, `${p.year} р.${p.theatreGroup ? ` · ${p.theatreGroup}` : ''}`));

	const playsWithVideo = plays.filter((p) => Boolean(p.videoUrl && p.videoUrl.trim() !== ''));
	const missingVideoPlays: MissingItemTuple[] = plays
		.filter((p) => !p.videoUrl || p.videoUrl.trim() === '')
		.map((p) => item(p.id, p.title, `${p.year} р.${p.theatreGroup ? ` · ${p.theatreGroup}` : ''}`));

	const playsWithCast = plays.filter((p) => {
		const cast = playCast[p.id];
		const hasParticipants = Array.isArray(p.participants) && p.participants.length > 0;
		const hasCast = Array.isArray(cast) && cast.length > 0;
		return hasParticipants || hasCast;
	});
	const missingCastPlays: MissingItemTuple[] = plays
		.filter((p) => {
			const cast = playCast[p.id];
			const hasParticipants = Array.isArray(p.participants) && p.participants.length > 0;
			const hasCast = Array.isArray(cast) && cast.length > 0;
			return !hasParticipants && !hasCast;
		})
		.map((p) => item(p.id, p.title, `${p.year} р.${p.theatreGroup ? ` · ${p.theatreGroup}` : ''}`));

	const playsMetrics: StatMetric[] = [
		{
			id: 'plays_verified',
			labelUk: 'Перевірено за афішами/програмами',
			labelEn: 'Verified against posters/records',
			descriptionUk: 'Вистави, чиї назви, рік, автора та склад звірено за архівними документами',
			descriptionEn: 'Plays whose details have been confirmed with original programs',
			total: totalPlays,
			completed: verifiedPlays.length,
			percent: percent(verifiedPlays.length, totalPlays),
			missingItems: missingVerifiedPlays
		},
		{
			id: 'plays_author',
			labelUk: 'Зазначено автора / драматурга',
			labelEn: 'Playwright specified',
			descriptionUk: 'Вистави, де вказано автора літературної основи чи п’єси',
			descriptionEn: 'Plays with listed author of the dramatic text',
			total: totalPlays,
			completed: playsWithAuthor.length,
			percent: percent(playsWithAuthor.length, totalPlays),
			missingItems: missingAuthorPlays
		},
		{
			id: 'plays_group',
			labelUk: 'Прив’язано навчальну групу',
			labelEn: 'Theatre group assigned',
			descriptionUk: 'Вистави, у яких відома група чи курс виконавців',
			descriptionEn: 'Plays attributed to a specific student troupe',
			total: totalPlays,
			completed: playsWithGroup.length,
			percent: percent(playsWithGroup.length, totalPlays),
			missingItems: missingGroupPlays
		},
		{
			id: 'plays_masters',
			labelUk: 'Режисер-постановник / майстер',
			labelEn: 'Director / Master specified',
			descriptionUk: 'Вистави, де вказано режисера або викладача-постановника',
			descriptionEn: 'Plays with assigned stage director or master',
			total: totalPlays,
			completed: playsWithMasters.length,
			percent: percent(playsWithMasters.length, totalPlays),
			missingItems: missingMastersPlays
		},
		{
			id: 'plays_video',
			labelUk: 'Відеозапис вистави',
			labelEn: 'Video recording available',
			descriptionUk: 'Вистави, які мають оцифрований відеозапис або трейлер',
			descriptionEn: 'Plays with an archived full video or scene highlights',
			total: totalPlays,
			completed: playsWithVideo.length,
			percent: percent(playsWithVideo.length, totalPlays),
			missingItems: missingVideoPlays
		},
		{
			id: 'plays_cast',
			labelUk: 'Акторський склад',
			labelEn: 'Cast of actors',
			descriptionUk: 'Вистави, до яких внесено виконавців ролей або учасників показу',
			descriptionEn: 'Plays with listed actor roles or participant lists',
			total: totalPlays,
			completed: playsWithCast.length,
			percent: percent(playsWithCast.length, totalPlays),
			missingItems: missingCastPlays
		}
	];

	// 4. MASTERS
	const mastersIndex: RawMasterIndex[] = JSON.parse(fs.readFileSync(MASTERS_INDEX_PATH, 'utf8'));
	const totalMasters = mastersIndex.length;

	const masterProfiles = new Map<string, RawMasterProfile>();
	for (const m of mastersIndex) {
		const profileFile = path.join(MASTERS_PROFILES_DIR, `${m.slug || m.id}.json`);
		if (fs.existsSync(profileFile)) {
			try {
				masterProfiles.set(m.slug || m.id, JSON.parse(fs.readFileSync(profileFile, 'utf8')));
			} catch {
				// ignore
			}
		}
	}

	const mastersWithPhoto = mastersIndex.filter((m) => Boolean(m.photo && m.photo.trim() !== ''));
	const missingPhotoMasters: MissingItemTuple[] = mastersIndex
		.filter((m) => !m.photo || m.photo.trim() === '')
		.map((m) => item(m.slug || m.id, m.displayName || m.fullName || m.id, m.roleTitle || 'Майстер'));

	const mastersWithRole = mastersIndex.filter((m) => Boolean(m.roleTitle && m.roleTitle.trim() !== ''));
	const missingRoleMasters: MissingItemTuple[] = mastersIndex
		.filter((m) => !m.roleTitle || m.roleTitle.trim() === '')
		.map((m) => item(m.slug || m.id, m.displayName || m.fullName || m.id, m.category ? `Категорія: ${m.category}` : undefined));

	const nonTeachingCategories = new Set(['administration', 'support', 'it', 'production']);
	const teachingMasters = mastersIndex.filter((m) => !nonTeachingCategories.has(m.category || ''));
	const totalTeachingMasters = teachingMasters.length;

	const mastersWithSubjects = teachingMasters.filter((m) => Array.isArray(m.subjects) && m.subjects.length > 0);
	const missingSubjectsMasters: MissingItemTuple[] = teachingMasters
		.filter((m) => !Array.isArray(m.subjects) || m.subjects.length === 0)
		.map((m) => item(m.slug || m.id, m.displayName || m.fullName || m.id, m.roleTitle || undefined));

	const mastersWithDepartments = teachingMasters.filter((m) => Array.isArray(m.departments) && m.departments.length > 0);
	const missingDepartmentsMasters: MissingItemTuple[] = teachingMasters
		.filter((m) => !Array.isArray(m.departments) || m.departments.length === 0)
		.map((m) => item(m.slug || m.id, m.displayName || m.fullName || m.id, m.roleTitle || undefined));

	const mastersWithBio = mastersIndex.filter((m) => {
		const p = masterProfiles.get(m.slug || m.id);
		return p && typeof p.bio === 'string' && p.bio.trim().length > 0;
	});
	const missingBioMasters: MissingItemTuple[] = mastersIndex
		.filter((m) => {
			const p = masterProfiles.get(m.slug || m.id);
			return !p || typeof p.bio !== 'string' || p.bio.trim().length === 0;
		})
		.map((m) => item(m.slug || m.id, m.displayName || m.fullName || m.id, m.roleTitle || undefined));

	const mastersWithPeriods = mastersIndex.filter((m) => {
		const p = masterProfiles.get(m.slug || m.id);
		return p && Array.isArray(p.periods) && p.periods.length > 0;
	});
	const missingPeriodsMasters: MissingItemTuple[] = mastersIndex
		.filter((m) => {
			const p = masterProfiles.get(m.slug || m.id);
			return !p || !Array.isArray(p.periods) || p.periods.length === 0;
		})
		.map((m) => item(m.slug || m.id, m.displayName || m.fullName || m.id, m.roleTitle || undefined));

	const mastersMetrics: StatMetric[] = [
		{
			id: 'masters_photo',
			labelUk: 'Фотопортрет майстра',
			labelEn: 'Master portrait photo',
			descriptionUk: 'Викладачі та майстри, які мають додане якісне фото',
			descriptionEn: 'Teachers and masters with an uploaded portrait',
			total: totalMasters,
			completed: mastersWithPhoto.length,
			percent: percent(mastersWithPhoto.length, totalMasters),
			missingItems: missingPhotoMasters
		},
		{
			id: 'masters_role',
			labelUk: 'Посада / фах',
			labelEn: 'Position / discipline',
			descriptionUk: 'Майстри, у яких зазначено точну посаду чи спеціалізацію',
			descriptionEn: 'Masters with specified job title or specialization',
			total: totalMasters,
			completed: mastersWithRole.length,
			percent: percent(mastersWithRole.length, totalMasters),
			missingItems: missingRoleMasters
		},
		{
			id: 'masters_subjects',
			labelUk: 'Предмети викладання',
			labelEn: 'Teaching subjects',
			descriptionUk: 'Викладачі педагогічного складу, у яких внесено перелік дисциплін',
			descriptionEn: 'Teaching staff with designated classes taught',
			total: totalTeachingMasters,
			completed: mastersWithSubjects.length,
			percent: percent(mastersWithSubjects.length, totalTeachingMasters),
			missingItems: missingSubjectsMasters
		},
		{
			id: 'masters_departments',
			labelUk: 'Відділення школи',
			labelEn: 'School departments',
			descriptionUk: 'Майстри, прив’язані до відділень (театральне, хореографічне тощо)',
			descriptionEn: 'Masters linked to specific school departments',
			total: totalTeachingMasters,
			completed: mastersWithDepartments.length,
			percent: percent(mastersWithDepartments.length, totalTeachingMasters),
			missingItems: missingDepartmentsMasters
		},
		{
			id: 'masters_bio',
			labelUk: 'Біографічна довідка',
			labelEn: 'Biography & creative path',
			descriptionUk: 'Майстри з нарисом про творчий та педагогічний шлях',
			descriptionEn: 'Masters with a biographical sketch and artistic journey',
			total: totalMasters,
			completed: mastersWithBio.length,
			percent: percent(mastersWithBio.length, totalMasters),
			missingItems: missingBioMasters
		},
		{
			id: 'masters_periods',
			labelUk: 'Періоди роботи в школі',
			labelEn: 'Years of service',
			descriptionUk: 'Майстри, у яких зафіксовано точні роки викладання в школі',
			descriptionEn: 'Masters with recorded years of teaching at the school',
			total: totalMasters,
			completed: mastersWithPeriods.length,
			percent: percent(mastersWithPeriods.length, totalMasters),
			missingItems: missingPeriodsMasters
		}
	];

	// 5. FESTIVALS
	const festivals: RawFestival[] = JSON.parse(fs.readFileSync(FESTIVALS_PATH, 'utf8'));
	const totalFestivals = festivals.length;

	const festivalsWithCity = festivals.filter((f) => Boolean(f.city && f.city.trim() !== ''));
	const missingCityFestivals: MissingItemTuple[] = festivals
		.filter((f) => !f.city || f.city.trim() === '')
		.map((f) => item(f.slug, f.name, `${f.year} р.`));

	const festivalsWithPlays = festivals.filter((f) => Array.isArray(f.plays) && f.plays.length > 0);
	const missingPlaysFestivals: MissingItemTuple[] = festivals
		.filter((f) => !Array.isArray(f.plays) || f.plays.length === 0)
		.map((f) => item(f.slug, f.name, `${f.year} р.`));

	const festivalsWithAwards = festivals.filter((f) => Array.isArray(f.awards) && f.awards.length > 0);
	const missingAwardsFestivals: MissingItemTuple[] = festivals
		.filter((f) => !Array.isArray(f.awards) || f.awards.length === 0)
		.map((f) => item(f.slug, f.name, `${f.year} р.`));

	const festivalsMetrics: StatMetric[] = [
		{
			id: 'festivals_city',
			labelUk: 'Місто / локація проведення',
			labelEn: 'Host city / location',
			descriptionUk: 'Фестивалі, де зазначено місто та країну проведення',
			descriptionEn: 'Festivals with host city and venue recorded',
			total: totalFestivals,
			completed: festivalsWithCity.length,
			percent: percent(festivalsWithCity.length, totalFestivals),
			missingItems: missingCityFestivals
		},
		{
			id: 'festivals_plays',
			labelUk: 'Вистави-учасники фестивалю',
			labelEn: 'Participating productions',
			descriptionUk: 'Фестивалі, у яких зазначено вистави, що брали участь у конкурсі',
			descriptionEn: 'Festivals with linked school productions in competition',
			total: totalFestivals,
			completed: festivalsWithPlays.length,
			percent: percent(festivalsWithPlays.length, totalFestivals),
			missingItems: missingPlaysFestivals
		},
		{
			id: 'festivals_awards',
			labelUk: 'Нагороди та відзнаки',
			labelEn: 'Awards and diplomas',
			descriptionUk: 'Фестивалі, де зафіксовано призові місця, гран-прі та номінації',
			descriptionEn: 'Festivals with recorded awards and grand prix titles',
			total: totalFestivals,
			completed: festivalsWithAwards.length,
			percent: percent(festivalsWithAwards.length, totalFestivals),
			missingItems: missingAwardsFestivals
		}
	];

	function categoryAverage(metrics: StatMetric[]): number {
		if (metrics.length === 0) return 100;
		const sum = metrics.reduce((acc, m) => acc + m.percent, 0);
		return Math.round(sum / metrics.length);
	}

	const categories: StatCategory[] = [
		{
			id: 'graduates',
			titleUk: 'Випускники',
			titleEn: 'Graduates',
			icon: 'GraduationCap',
			totalEntities: totalGraduates,
			overallPercent: categoryAverage(graduatesMetrics),
			metrics: graduatesMetrics
		},
		{
			id: 'groups',
			titleUk: 'Групи',
			titleEn: 'Groups',
			icon: 'Users',
			totalEntities: totalGroups,
			overallPercent: categoryAverage(groupsMetrics),
			metrics: groupsMetrics
		},
		{
			id: 'plays',
			titleUk: 'Вистави',
			titleEn: 'Plays',
			icon: 'Theater',
			totalEntities: totalPlays,
			overallPercent: categoryAverage(playsMetrics),
			metrics: playsMetrics
		},
		{
			id: 'masters',
			titleUk: 'Викладачі',
			titleEn: 'Masters & Teachers',
			icon: 'Sparkles',
			totalEntities: totalMasters,
			overallPercent: categoryAverage(mastersMetrics),
			metrics: mastersMetrics
		},
		{
			id: 'festivals',
			titleUk: 'Фестивалі',
			titleEn: 'Festivals',
			icon: 'Globe',
			totalEntities: totalFestivals,
			overallPercent: categoryAverage(festivalsMetrics),
			metrics: festivalsMetrics
		}
	];

	const overallPercent = Math.round(
		categories.reduce((acc, c) => acc + c.overallPercent, 0) / categories.length
	);

	return {
		generatedAt: new Date().toISOString(),
		overallPercent,
		categories
	};
}

const stats = computeStats();
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats), 'utf8');
console.log(
	`📊 Статистику згенеровано: Загальний показник ${stats.overallPercent}%, 5 категорій збережено в ${path.relative(ROOT, OUTPUT_PATH)}`
);

buildStatsHistory();
