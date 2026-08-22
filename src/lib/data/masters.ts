import { asset } from '$app/paths';
import type { Department, GraduateIndexEntry } from './graduates';
import mastersIndexData from './masters.index.json';
import indexData from './graduates.index.json';

export type MasterStatus = 'active' | 'honorary' | 'history';

export type MasterCategory =
	| 'administration'
	| 'pedagogues'
	| 'production'
	| 'it'
	| 'support'
	| 'honorary'
	| 'history';

export interface MasterSocial {
	network: string;
	url: string;
}

export interface MasterIndexEntry {
	id: string;
	slug: string;
	displayName: string;
	fullName: string;
	displayNameEn: string;
	fullNameEn: string;
	departments: Department[];
	category?: MasterCategory;
	roleTitle?: string;
	photo?: string;
	status?: MasterStatus;
	isHonorary?: boolean;
	subjects?: string[];
}

export interface MasterProfile extends MasterIndexEntry {
	bio?: string;
	socials?: MasterSocial[];
}

export type Master = MasterProfile;

export interface MasterStudentEntry {
	graduate: GraduateIndexEntry;
	role: 'master' | 'teacher';
	subject?: string;
}

export const MASTERS: Master[] = (mastersIndexData as MasterIndexEntry[]).map((m) => ({
	...m,
	photo: m.photo ? asset(m.photo) : undefined
}));

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

export function masterProfileJson(slug: string): string {
	return asset(`/masters/profiles/${encodeURIComponent(slug)}.json`);
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
