import raw from "./cv.json";

export type Locale = "es" | "en";

/** Texto que puede ser igual en ambos idiomas o estar traducido. */
export type Text = string | Record<Locale, string>;

export interface CvLink {
	label: Text;
	href: string;
}

export interface CvExperience {
	role: Text;
	org: Text;
	place?: Text;
	period: Text;
	points?: Text[];
}

export interface CvProject {
	name: Text;
	context?: Text;
	period?: Text;
	href?: string;
	points?: Text[];
}

export interface CvEducation {
	degree: Text;
	org: Text;
	place?: Text;
	period: Text;
}

export interface CvCertification {
	name: string;
	org: string;
	year: string;
	detail?: string;
}

export interface CvSkill {
	label: Text;
	items: Text[];
}

export interface Cv {
	updated: string;
	name: string;
	location: Text;
	summary: Text;
	links: CvLink[];
	experience: CvExperience[];
	projects: CvProject[];
	education: CvEducation[];
	certifications: CvCertification[];
	skills: CvSkill[];
}

/**
 * Fuente única del CV. El JSON vive también en un gist de GitHub:
 * `npm run cv:pull` lo baja y `npm run cv:push` lo publica.
 */
export const cv = raw as unknown as Cv;

export const text = (value: Text, locale: Locale): string =>
	typeof value === "string" ? value : value[locale];
