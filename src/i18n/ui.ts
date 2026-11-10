export type Locale = "es" | "en";

const es = {
	"site.description":
		"Notas de matemática, sistemas computacionales y código, por Giuseppe Barraza.",
	"site.fullTitle": "JPBM — notas de matemática y sistemas",
	"home.title": "Inicio",
	"skip.content": "Saltar al contenido",
	"brand.sub": "notas de matemática y sistemas",
	"brand.aria": "Inicio — JPBM",
	"nav.aria": "Principal",
	"nav.home": "inicio",
	"nav.archive": "archivo",
	"nav.about": "acerca",
	"nav.forum": "discusión",
	"lang.toggle.aria": "Cambiar a inglés",
	"theme.aria": "Cambiar tema",
	"theme.light": "Activar tema claro",
	"theme.dark": "Activar tema oscuro",
	"footer.made": "Hecho con Astro y Motion. Sin rastreadores.",
	"footer.nav.aria": "Secundario",
	"post.breadcrumb.aria": "Ruta",
	"post.archive": "archivo",
	"post.read": "min de lectura",
	"post.pager.aria": "Otras notas",
	"post.prev": "← anterior",
	"post.next": "siguiente →",
	"post.back": "← volver al archivo",
	"tabs.filter.aria": "Filtrar notas",
	"tabs.notes": "notas",
	"tabs.note": "nota",
	"categories.all": "todo",
} as const;

const en: typeof es = {
	"site.description":
		"Notes on math, computing systems and code, by Giuseppe Barraza.",
	"site.fullTitle": "JPBM — notes on math and systems",
	"home.title": "Home",
	"skip.content": "Skip to content",
	"brand.sub": "notes on math and systems",
	"brand.aria": "Home — JPBM",
	"nav.aria": "Main",
	"nav.home": "home",
	"nav.archive": "archive",
	"nav.about": "about",
	"nav.forum": "discussion",
	"lang.toggle.aria": "Switch to Spanish",
	"theme.aria": "Change theme",
	"theme.light": "Switch to light theme",
	"theme.dark": "Switch to dark theme",
	"footer.made": "Built with Astro and Motion. No trackers.",
	"footer.nav.aria": "Secondary",
	"post.breadcrumb.aria": "Breadcrumb",
	"post.archive": "archive",
	"post.read": "min read",
	"post.pager.aria": "More notes",
	"post.prev": "← previous",
	"post.next": "next →",
	"post.back": "← back to archive",
	"tabs.filter.aria": "Filter notes",
	"tabs.notes": "notes",
	"tabs.note": "note",
	"categories.all": "all",
};

export type UiKey = keyof typeof es;

const ui: Record<Locale, typeof es> = { es, en };

export const t = (locale: Locale, key: UiKey): string => ui[locale][key];
