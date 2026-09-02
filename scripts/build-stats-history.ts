import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Інкрементальний генератор історії статистики наповнення архіву (static/galaxy/stats-history.json).
 *
 * ПРАВИЛО КЕШУВАННЯ:
 * Якщо зріз для певної дати вже є у `stats-history.json`, він НІКОЛИ не перераховується з Git повторно.
 * З Git зчитуються лише НОВІ або відсутні дати. Поточний день оновлюється з актуального стану.
 */

const ROOT = process.cwd();
const HISTORY_PATH = path.join(ROOT, 'static/galaxy/stats-history.json');
const CURRENT_STATS_PATH = path.join(ROOT, 'static/galaxy/stats.json');

export interface HistoryMetricSummary {
	completed: number;
	total: number;
	percent: number;
}

export interface HistoryDailySnapshot {
	date: string;
	commitHash?: string;
	overallPercent: number;
	categoryPercents: {
		graduates: number;
		groups: number;
		plays: number;
		masters: number;
		festivals: number;
	};
	metrics: Record<string, HistoryMetricSummary>;
}

function safeGitShow(commitHash: string, filePath: string): string | null {
	try {
		return execSync(`git show ${commitHash}:${filePath}`, {
			maxBuffer: 15 * 1024 * 1024,
			stdio: ['pipe', 'pipe', 'ignore']
		}).toString();
	} catch {
		return null;
	}
}

function safeGitLsProfiles(commitHash: string): string[] {
	try {
		const out = execSync(`git ls-tree -r --name-only ${commitHash} static/graduates/profiles`, {
			maxBuffer: 15 * 1024 * 1024,
			stdio: ['pipe', 'pipe', 'ignore']
		}).toString();
		return out
			.trim()
			.split('\n')
			.filter((f) => f.endsWith('.json'));
	} catch {
		return [];
	}
}

function roundPercent(completed: number, total: number): number {
	if (total <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

function calcSnapshotForCommit(date: string, commitHash: string): HistoryDailySnapshot {
	// 1. Graduates
	const gradIndexRaw = safeGitShow(commitHash, 'src/lib/data/graduates.index.json');
	let rawGraduates: Array<{
		slug?: string;
		code?: string;
		name?: string;
		hasPhoto?: boolean;
		playCount?: number;
		visibility?: string;
		departments?: string[];
		masters?: string[];
		teachers?: string[];
	}> = [];
	if (gradIndexRaw) {
		try {
			rawGraduates = JSON.parse(gradIndexRaw);
		} catch {
			rawGraduates = [];
		}
	}

	const listedGraduates = rawGraduates.filter(
		(g) => !g.visibility || g.visibility === 'listed'
	);
	const gradTotal = listedGraduates.length > 0 ? listedGraduates.length : 517;

	const theatreGrads = listedGraduates.filter(
		(g) => Array.isArray(g.departments) && g.departments.includes('theatre')
	);
	const theatreTotal = theatreGrads.length > 0 ? theatreGrads.length : 400;

	const profilePaths = safeGitLsProfiles(commitHash);
	const profileKeys = new Set(
		profilePaths.map((p) => path.basename(p, '.json').toLowerCase())
	);

	let profilesCount = 0;
	let photosCount = 0;
	let playsCount = 0;
	let bioCount = 0;
	let mastersCount = 0;
	let teachersCount = 0;
	let socialsCount = 0;

	// Load individual profiles if present
	for (const g of listedGraduates) {
		const key = (g.code || g.slug || '').toLowerCase();
		const hasProfileFile = key ? profileKeys.has(key) : false;
		if (hasProfileFile) {
			profilesCount++;
		}

		if (g.hasPhoto) photosCount++;
		if (Array.isArray(g.masters) && g.masters.length > 0) mastersCount++;
		if (Array.isArray(g.teachers) && g.teachers.length > 0) teachersCount++;

		// If profile file exists, check content
		if (hasProfileFile) {
			const profPath = `static/graduates/profiles/${g.code || g.slug}.json`;
			const profRaw = safeGitShow(commitHash, profPath);
			if (profRaw) {
				try {
					const prof = JSON.parse(profRaw);
					if (prof.hasPhoto) photosCount = Math.max(photosCount, photosCount);
					if (
						(Array.isArray(prof.bio) && prof.bio.length > 0) ||
						prof.duringStudies ||
						prof.afterGraduation
					) {
						bioCount++;
					}
					if (Array.isArray(prof.socials) && prof.socials.length > 0) {
						socialsCount++;
					}
					if (Array.isArray(prof.masters) && prof.masters.length > 0) {
						mastersCount = Math.max(mastersCount, mastersCount);
					}
					if (Array.isArray(prof.teachers) && prof.teachers.length > 0) {
						teachersCount = Math.max(teachersCount, teachersCount);
					}
				} catch {
					// ignore
				}
			}
		}
	}

	for (const g of theatreGrads) {
		if (typeof g.playCount === 'number' && g.playCount > 0) {
			playsCount++;
		}
	}

	const gradPct = roundPercent(
		roundPercent(profilesCount, gradTotal) +
			roundPercent(photosCount, gradTotal) +
			roundPercent(playsCount, theatreTotal) +
			roundPercent(bioCount, gradTotal) +
			roundPercent(mastersCount, gradTotal) +
			roundPercent(teachersCount, gradTotal) +
			roundPercent(socialsCount, gradTotal),
		700
	);

	// 2. Groups
	const groupsRaw = safeGitShow(commitHash, 'src/lib/data/groups.data.json');
	let groups: Array<Record<string, unknown>> = [];
	if (groupsRaw) {
		try {
			groups = JSON.parse(groupsRaw);
		} catch {
			groups = [];
		}
	}
	const groupsTotal = groups.length;
	let grpDesc = 0;
	let grpPhoto = 0;
	let grpVerified = 0;
	let grpCurator = 0;
	let grpProds = 0;

	for (const grp of groups) {
		if (grp.descriptionUk && grp.descriptionUk.trim().length > 20) grpDesc++;
		if (grp.photo) grpPhoto++;
		if (!grp.unverified) grpVerified++;
		if (grp.curator) grpCurator++;
		if (Array.isArray(grp.productions) && grp.productions.length > 0) grpProds++;
	}

	const groupsPct =
		groupsTotal > 0
			? roundPercent(
					roundPercent(grpDesc, groupsTotal) +
						roundPercent(grpPhoto, groupsTotal) +
						roundPercent(grpVerified, groupsTotal) +
						roundPercent(grpCurator, groupsTotal) +
						roundPercent(grpProds, groupsTotal),
					500
				)
			: 0;

	// 3. Plays
	const playsRaw = safeGitShow(commitHash, 'src/lib/data/plays.data.json');
	let plays: Array<Record<string, unknown>> = [];
	if (playsRaw) {
		try {
			plays = JSON.parse(playsRaw);
		} catch {
			plays = [];
		}
	}
	const playsTotal = plays.length;
	let plPoster = 0;
	let plPhotos = 0;
	let plVideo = 0;
	let plDesc = 0;

	for (const p of plays) {
		if (p.poster) plPoster++;
		if (Array.isArray(p.photos) && p.photos.length > 0) plPhotos++;
		if (p.videoUrl) plVideo++;
		if (p.descriptionUk && p.descriptionUk.trim().length > 20) plDesc++;
	}

	const playsPct =
		playsTotal > 0
			? roundPercent(
					roundPercent(plPoster, playsTotal) +
						roundPercent(plPhotos, playsTotal) +
						roundPercent(plVideo, playsTotal) +
						roundPercent(plDesc, playsTotal),
					400
				)
			: 0;

	// 4. Masters
	const mastersRaw = safeGitShow(commitHash, 'src/lib/data/masters.index.json');
	let masters: Array<Record<string, unknown>> = [];
	if (mastersRaw) {
		try {
			masters = JSON.parse(mastersRaw);
		} catch {
			masters = [];
		}
	}
	const mastersTotal = masters.length;
	let mstPhoto = 0;
	let mstRole = 0;
	let mstBio = 0;
	let mstSubjects = 0;

	for (const m of masters) {
		if (m.photo) mstPhoto++;
		if (m.roleTitle || m.category) mstRole++;
		if (m.bio) mstBio++;
		if (Array.isArray(m.subjects) && m.subjects.length > 0) mstSubjects++;
	}

	const mastersPct =
		mastersTotal > 0
			? roundPercent(
					roundPercent(mstPhoto, mastersTotal) +
						roundPercent(mstRole, mastersTotal) +
						roundPercent(mstBio, mastersTotal) +
						roundPercent(mstSubjects, mastersTotal),
					400
				)
			: 0;

	// 5. Festivals
	const festsRaw = safeGitShow(commitHash, 'src/lib/data/festivals.data.json');
	let fests: Array<Record<string, unknown>> = [];
	if (festsRaw) {
		try {
			fests = JSON.parse(festsRaw);
		} catch {
			fests = [];
		}
	}
	const festsTotal = fests.length;
	let fstPoster = 0;
	let fstPhotos = 0;
	let fstPlays = 0;

	for (const f of fests) {
		if (f.poster) fstPoster++;
		if (Array.isArray(f.photos) && f.photos.length > 0) fstPhotos++;
		if (Array.isArray(f.plays) && f.plays.length > 0) fstPlays++;
	}

	const festsPct =
		festsTotal > 0
			? roundPercent(
					roundPercent(fstPoster, festsTotal) +
						roundPercent(fstPhotos, festsTotal) +
						roundPercent(fstPlays, festsTotal),
					300
				)
			: 0;

	const overallPercent = Math.round(
		(gradPct + groupsPct + playsPct + mastersPct + festsPct) / 5
	);

	return {
		date,
		commitHash: commitHash.slice(0, 8),
		overallPercent,
		categoryPercents: {
			graduates: gradPct,
			groups: groupsPct,
			plays: playsPct,
			masters: mastersPct,
			festivals: festsPct
		},
		metrics: {
			graduates_profiles: {
				completed: profilesCount,
				total: gradTotal,
				percent: roundPercent(profilesCount, gradTotal)
			},
			graduates_photos: {
				completed: photosCount,
				total: gradTotal,
				percent: roundPercent(photosCount, gradTotal)
			},
			graduates_plays: {
				completed: playsCount,
				total: theatreTotal,
				percent: roundPercent(playsCount, theatreTotal)
			},
			graduates_bio: {
				completed: bioCount,
				total: gradTotal,
				percent: roundPercent(bioCount, gradTotal)
			},
			graduates_masters: {
				completed: mastersCount,
				total: gradTotal,
				percent: roundPercent(mastersCount, gradTotal)
			},
			graduates_teachers: {
				completed: teachersCount,
				total: gradTotal,
				percent: roundPercent(teachersCount, gradTotal)
			},
			graduates_socials: {
				completed: socialsCount,
				total: gradTotal,
				percent: roundPercent(socialsCount, gradTotal)
			},
			groups_description: {
				completed: grpDesc,
				total: groupsTotal,
				percent: roundPercent(grpDesc, groupsTotal)
			},
			groups_photos: {
				completed: grpPhoto,
				total: groupsTotal,
				percent: roundPercent(grpPhoto, groupsTotal)
			},
			groups_verified: {
				completed: grpVerified,
				total: groupsTotal,
				percent: roundPercent(grpVerified, groupsTotal)
			},
			groups_curator: {
				completed: grpCurator,
				total: groupsTotal,
				percent: roundPercent(grpCurator, groupsTotal)
			},
			groups_productions: {
				completed: grpProds,
				total: groupsTotal,
				percent: roundPercent(grpProds, groupsTotal)
			},
			plays_poster: {
				completed: plPoster,
				total: playsTotal,
				percent: roundPercent(plPoster, playsTotal)
			},
			plays_photos: {
				completed: plPhotos,
				total: playsTotal,
				percent: roundPercent(plPhotos, playsTotal)
			},
			plays_video: {
				completed: plVideo,
				total: playsTotal,
				percent: roundPercent(plVideo, playsTotal)
			},
			plays_description: {
				completed: plDesc,
				total: playsTotal,
				percent: roundPercent(plDesc, playsTotal)
			},
			masters_photos: {
				completed: mstPhoto,
				total: mastersTotal,
				percent: roundPercent(mstPhoto, mastersTotal)
			},
			masters_roles: {
				completed: mstRole,
				total: mastersTotal,
				percent: roundPercent(mstRole, mastersTotal)
			},
			masters_bio: {
				completed: mstBio,
				total: mastersTotal,
				percent: roundPercent(mstBio, mastersTotal)
			},
			masters_subjects: {
				completed: mstSubjects,
				total: mastersTotal,
				percent: roundPercent(mstSubjects, mastersTotal)
			},
			festivals_posters: {
				completed: fstPoster,
				total: festsTotal,
				percent: roundPercent(fstPoster, festsTotal)
			},
			festivals_photos: {
				completed: fstPhotos,
				total: festsTotal,
				percent: roundPercent(fstPhotos, festsTotal)
			},
			festivals_plays: {
				completed: fstPlays,
				total: festsTotal,
				percent: roundPercent(fstPlays, festsTotal)
			}
		}
	};
}

function deriveTodaySnapshot(date: string): HistoryDailySnapshot {
	const currentStats = JSON.parse(fs.readFileSync(CURRENT_STATS_PATH, 'utf8'));
	const metricsMap: Record<string, HistoryMetricSummary> = {};
	const catMap: Record<string, number> = {};

	for (const cat of currentStats.categories) {
		catMap[cat.id] = cat.overallPercent;
		for (const m of cat.metrics) {
			metricsMap[m.id] = {
				completed: m.completed,
				total: m.total,
				percent: m.percent
			};
		}
	}

	return {
		date,
		overallPercent: currentStats.overallPercent,
		categoryPercents: {
			graduates: catMap.graduates || 0,
			groups: catMap.groups || 0,
			plays: catMap.plays || 0,
			masters: catMap.masters || 0,
			festivals: catMap.festivals || 0
		},
		metrics: metricsMap
	};
}

function getCommitAtEndOfDay(date: string): string | null {
	try {
		const out = execSync(`git log --before="${date} 23:59:59" -n 1 --format="%H"`, {
			stdio: ['pipe', 'pipe', 'ignore']
		})
			.toString()
			.trim();
		return out || null;
	} catch {
		return null;
	}
}

export function buildStatsHistory(): void {
	console.log('⏳ Збір історії статистики...');

	let existingHistory: HistoryDailySnapshot[] = [];
	if (fs.existsSync(HISTORY_PATH)) {
		try {
			existingHistory = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
		} catch {
			existingHistory = [];
		}
	}

	const knownDates = new Map<string, HistoryDailySnapshot>();
	for (const item of existingHistory) {
		knownDates.set(item.date, item);
	}

	// Отримуємо унікальні дати комітів від моменту створення Галактики (2026-08-18)
	let commitDates: string[];
	try {
		const rawDates = execSync('git log --format="%ad" --date=short', {
			stdio: ['pipe', 'pipe', 'ignore']
		})
			.toString()
			.trim()
			.split('\n');
		commitDates = Array.from(new Set(rawDates))
			.filter((d) => d >= '2026-08-18')
			.sort();
	} catch {
		commitDates = ['2026-08-18', '2026-08-25', '2026-08-30', '2026-09-02', '2026-09-03'];
	}

	const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
	if (!commitDates.includes(today)) {
		commitDates.push(today);
	}
	commitDates.sort();

	const updatedHistory: HistoryDailySnapshot[] = [];

	for (const date of commitDates) {
		const isToday = date === today;

		// Якщо дата вже збережена в кеші з фіксованим комітом й це НЕ сьогодні — беремо з кешу без запитів до Git!
		if (knownDates.has(date) && !isToday && knownDates.get(date)!.commitHash) {
			updatedHistory.push(knownDates.get(date)!);
			continue;
		}

		if (isToday) {
			console.log(`  📅 [${date}] Актуальний стан (сьогодні)`);
			updatedHistory.push(deriveTodaySnapshot(date));
			continue;
		}

		// Знаходимо коміт на кінець дня
		const commitHash = getCommitAtEndOfDay(date);
		if (!commitHash) {
			continue;
		}

		console.log(`  🔍 [${date}] Розрахунок з Git для коміту ${commitHash.slice(0, 8)}...`);
		const snapshot = calcSnapshotForCommit(date, commitHash);
		updatedHistory.push(snapshot);
	}

	// Сортування хронологічно
	updatedHistory.sort((a, b) => a.date.localeCompare(b.date));

	fs.writeFileSync(HISTORY_PATH, JSON.stringify(updatedHistory, null, 2), 'utf8');
	console.log(
		`✅ Історію успішно збережено в static/galaxy/stats-history.json (${updatedHistory.length} днів)`
	);
}

// Запуск якщо викликано напряму
if (process.argv[1]?.endsWith('build-stats-history.ts')) {
	buildStatsHistory();
}
