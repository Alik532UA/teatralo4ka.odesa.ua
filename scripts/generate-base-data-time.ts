import fs from 'node:fs';
import path from 'node:path';

interface MasterIndexEntry {
	id: string;
	slug: string;
	displayName?: string;
	fullName?: string;
	departments?: string[];
	category?: string;
}

interface GraduateMasterLink {
	id?: string;
	name?: string;
	department?: string | null;
}

interface GraduateIndexEntry {
	id: string;
	name: string;
	graduationYear: number | null;
	departments?: string[];
	masters?: (string | GraduateMasterLink)[];
}

interface GroupEntry {
	slug: string;
	memberIds: string[];
	masters?: { id?: string; name?: string; department?: string | null }[];
}

const graduates = JSON.parse(fs.readFileSync('src/lib/data/graduates.index.json', 'utf-8')) as GraduateIndexEntry[];
const groups = JSON.parse(fs.readFileSync('src/lib/data/groups.data.json', 'utf-8')) as GroupEntry[];
const mastersIndex = JSON.parse(fs.readFileSync('src/lib/data/masters.index.json', 'utf-8')) as MasterIndexEntry[];
const profilesDir = 'static/graduates/profiles';

const masterMap = new Map<string, MasterIndexEntry>();
for (const m of mastersIndex) {
	masterMap.set(m.id, m);
}

function formatMasterName(masterIdOrName: string): string {
	if (!masterIdOrName) return '';
	const master = masterMap.get(masterIdOrName);
	if (master?.displayName) {
		return master.displayName;
	}
	if (master?.fullName) {
		const parts = master.fullName.trim().split(/\s+/);
		if (parts.length >= 2) {
			return `${parts[1]} ${parts[0].toUpperCase()}`;
		}
		return master.fullName.toUpperCase();
	}
	const str = String(masterIdOrName).trim();
	const parts = str.split(/\s+/);
	if (parts.length >= 2) {
		return `${parts[0]} ${parts.slice(1).join(' ').toUpperCase()}`;
	}
	return str.toUpperCase();
}

function getDeptEmoji(dept?: string | null): string {
	switch (dept) {
		case 'theatre':
		case 'intensive':
			return '🎭';
		case 'vocal':
			return '🎤';
		case 'music':
			return '🎶';
		case 'piano':
			return '🎹';
		case 'art':
			return '🎨';
		case 'guitar':
			return '🎸';
		default:
			return '🎭';
	}
}

function getMasterEmoji(masterIdOrObj: string | GraduateMasterLink): string {
	const id = typeof masterIdOrObj === 'string' ? masterIdOrObj : masterIdOrObj?.id;
	const master = id ? masterMap.get(id) : null;
	const dept =
		(typeof masterIdOrObj === 'object' && masterIdOrObj?.department) ||
		master?.departments?.[0] ||
		master?.category;

	if (dept === 'piano' || dept === 'accompanists' || dept === 'musicians') return '🎹';
	if (dept === 'music') return '🎶';
	if (dept === 'vocal' || dept === 'vocalists') return '🎤';
	if (dept === 'art' || dept === 'artists') return '🎨';
	if (dept === 'guitar') return '🎸';
	return '🎭';
}

const yearsMap = new Map<number, Array<{ grad: GraduateIndexEntry; masters: Array<{ emoji: string; name: string }> }>>();

for (const grad of graduates) {
	const profilePath = path.join(profilesDir, `${grad.id}.json`);
	let profileMasters: (string | GraduateMasterLink)[] | null = null;
	let profileDepts: string[] | null = null;
	if (fs.existsSync(profilePath)) {
		try {
			const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
			if (Array.isArray(profile.masters) && profile.masters.length > 0) {
				profileMasters = profile.masters;
			}
			if (Array.isArray(profile.departments) && profile.departments.length > 0) {
				profileDepts = profile.departments;
			}
		} catch {
			// ignore
		}
	}

	// Лише МАЙСТРИ КУРСУ (masters)
	const directMasters = profileMasters ?? (grad.masters && grad.masters.length > 0 ? grad.masters : []);

	const masterList: Array<{ emoji: string; name: string }> = [];
	const seenIds = new Set<string>();

	for (const m of directMasters) {
		const id = typeof m === 'string' ? m : m.id || m.name;
		if (id && !seenIds.has(id)) {
			seenIds.add(id);
			masterList.push({ emoji: getMasterEmoji(m), name: formatMasterName(id) });
		}
	}

	// Якщо у випускника немає прямо вказаних майстрів, перевіряємо майстрів його навчальної групи
	if (masterList.length === 0) {
		const gradGroups = groups.filter((g) => g.memberIds.includes(grad.id));
		for (const group of gradGroups) {
			for (const m of group.masters || []) {
				const id = m.id || m.name;
				if (id && !seenIds.has(id)) {
					seenIds.add(id);
					masterList.push({ emoji: getMasterEmoji(m), name: formatMasterName(id) });
				}
			}
		}
	}

	const depts = profileDepts ?? grad.departments ?? ['theatre'];
	const year = grad.graduationYear ?? 0;
	if (!yearsMap.has(year)) yearsMap.set(year, []);
	yearsMap.get(year)!.push({
		grad: { ...grad, departments: depts },
		masters: masterList
	});
}

const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => a - b);
const outputLines: string[] = [];

for (const year of sortedYears) {
	if (year === 0) continue;
	outputLines.push(String(year));
	const list = yearsMap.get(year)!;
	for (const item of list) {
		if (item.masters.length === 0) {
			const deptEmojis = Array.from(new Set((item.grad.departments || ['theatre']).map(getDeptEmoji)));
			const placeholderStr = deptEmojis.map((emoji) => `${emoji} ⁉️⁉️⁉️`).join(' — ');
			outputLines.push(`${item.grad.name} — ${placeholderStr}`);
		} else {
			const mastersStr = item.masters.map((m) => `${m.emoji} ${m.name}`).join(' — ');
			outputLines.push(`${item.grad.name} — ${mastersStr}`);
		}
	}
	outputLines.push('');
}

fs.mkdirSync('.temp', { recursive: true });
fs.writeFileSync('.temp/base-data-time.txt', outputLines.join('\n'), 'utf-8');
console.log(`✅ Згенеровано .temp/base-data-time.txt (${outputLines.length} рядків)`);
