const $ = (id) => document.getElementById(id);

const el = {
	loginView: $("login-view"),
	loginForm: $("login-form"),
	password: $("password"),
	loginError: $("login-error"),
	loginSubmit: $("login-submit"),

	appView: $("app-view"),
	siteLink: $("site-link"),
	themeToggle: $("theme-toggle"),
	logout: $("logout"),

	newPost: $("new-post"),
	welcomeNew: $("welcome-new"),
	search: $("search"),
	postList: $("post-list"),
	listEmpty: $("list-empty"),
	postCount: $("post-count"),

	welcome: $("welcome"),
	main: $("editor-pane"),
	form: $("post-form"),
	formMode: $("form-mode"),
	slugPreview: $("slug-preview"),
	viewPost: $("view-post"),
	saveState: $("save-state"),
	deletePost: $("delete-post"),
	savePost: $("save-post"),

	title: $("title"),
	slug: $("slug"),
	draft: $("draft"),
	description: $("description"),
	descCount: $("desc-count"),
	date: $("date"),
	category: $("category"),
	categoryList: $("category-list"),
	minutes: $("minutes"),
	autoMinutes: $("auto-minutes"),
	lang: $("lang"),
	field: $("field"),
	formError: $("form-error"),

	editorFrame: $("editor-frame"),
	markdown: $("markdown"),
	wordCount: $("word-count"),
	readTime: $("read-time"),
	preview: $("preview"),
	previewState: $("preview-state"),
	mobileTabs: document.querySelector(".mobile-tabs"),
	toolbar: document.querySelector(".toolbar"),

	fileInput: $("file-input"),
	toast: $("toast"),
};

const state = {
	csrf: null,
	posts: [],
	categories: [],
	fields: [],
	siteUrl: "http://localhost:3000",
	current: null,
	originalSlug: null,
	dirty: false,
	saving: false,
	uploading: false,
	slugTouched: false,
	autoMinutes: false,
	previewTimer: null,
	previewSeq: 0,
	toastTimer: null,
};

const fieldInputs = {
	title: el.title,
	slug: el.slug,
	description: el.description,
	date: el.date,
	category: el.category,
	minutes: el.minutes,
	lang: el.lang,
	field: el.field,
};

/* ------------------------------------------------------------------
   API
------------------------------------------------------------------- */

async function api(path, options = {}) {
	const headers = { ...(options.headers || {}) };
	if (options.body) headers["Content-Type"] = "application/json";
	if (state.csrf && options.method && options.method !== "GET") {
		headers["X-Admin-CSRF"] = state.csrf;
	}

	let response;
	try {
		response = await fetch(path, {
			...options,
			headers,
			credentials: "same-origin",
			cache: "no-store",
		});
	} catch {
		throw Object.assign(new Error("No se pudo conectar con el servidor."), {
			status: 0,
		});
	}

	let data = {};
	try {
		data = await response.json();
	} catch {
		/* respuesta sin JSON */
	}

	if (response.status === 401 && path !== "/admin/api/login") {
		state.csrf = null;
		showLogin("La sesión expiró. Vuelve a entrar; no pierdes lo escrito.");
	}

	if (!response.ok) {
		const error = new Error(data.error || `Error ${response.status}`);
		error.status = response.status;
		error.fields = data.fields || null;
		throw error;
	}

	return data;
}

/* ------------------------------------------------------------------
   Sesión
------------------------------------------------------------------- */

async function boot() {
	bindEvents();
	syncThemeButton();
	try {
		const data = await api("/admin/api/session");
		if (data.authenticated) {
			state.csrf = data.csrf;
			state.siteUrl = data.siteUrl || state.siteUrl;
			showApp();
			await loadPosts();
			await openFromHash();
		} else {
			showLogin();
		}
	} catch (error) {
		showLogin(error.message || "No se pudo abrir el editor.");
	}
}

function showLogin(message = "") {
	el.appView.hidden = true;
	el.loginView.hidden = false;
	el.loginError.textContent = message;
	el.loginError.hidden = !message;
	el.loginSubmit.disabled = false;
	el.password.value = "";
	el.password.focus();
}

function showApp() {
	el.loginView.hidden = true;
	el.appView.hidden = false;
}

async function handleLogin(event) {
	event.preventDefault();
	const password = el.password.value;
	if (!password) return;

	el.loginError.hidden = true;
	el.loginSubmit.disabled = true;
	el.loginSubmit.textContent = "entrando…";

	try {
		const data = await api("/admin/api/login", {
			method: "POST",
			body: JSON.stringify({ password }),
		});
		state.csrf = data.csrf;
		state.siteUrl = data.siteUrl || state.siteUrl;
		el.password.value = "";
		showApp();
		await loadPosts();
		await openFromHash();
	} catch (error) {
		el.loginError.textContent = error.message || "No se pudo entrar.";
		el.loginError.hidden = false;
		el.password.select();
	} finally {
		el.loginSubmit.disabled = false;
		el.loginSubmit.textContent = "entrar";
	}
}

async function handleLogout() {
	if (!confirmDiscard("¿Salir con cambios sin guardar?")) return;
	state.dirty = false;
	try {
		await api("/admin/api/logout", { method: "POST" });
	} catch {
		/* la sesión pudo haber expirado ya */
	}
	window.location.reload();
}

/* ------------------------------------------------------------------
   Carga y archivo
------------------------------------------------------------------- */

async function loadPosts() {
	const data = await api("/admin/api/posts");
	state.posts = data.posts || [];
	state.categories = data.categories || [];
	state.fields = data.fields || [];
	state.siteUrl = data.siteUrl || state.siteUrl;
	renderCategories();
	renderFields();
	renderList();
	updateSiteLinks();
}

function renderCategories() {
	el.categoryList.replaceChildren();
	for (const category of state.categories) {
		const option = document.createElement("option");
		option.value = category;
		el.categoryList.append(option);
	}
}

function renderFields() {
	const selected = el.field.value;
	el.field.replaceChildren();
	for (const field of state.fields) {
		const option = document.createElement("option");
		option.value = field.value;
		option.textContent = field.label;
		el.field.append(option);
	}
	if (selected && state.fields.some((field) => field.value === selected)) {
		el.field.value = selected;
	}
}

function renderList() {
	const query = el.search.value.trim().toLowerCase();
	const posts = state.posts.filter((post) => {
		if (!query) return true;
		return [post.title, post.category, post.slug, post.date]
			.join(" ")
			.toLowerCase()
			.includes(query);
	});

	el.postList.replaceChildren();
	for (const post of posts) {
		const item = document.createElement("li");
		const button = document.createElement("button");
		button.type = "button";
		button.className = "post-item";
		if (state.current?.slug === post.slug) button.classList.add("is-active");
		button.addEventListener("click", () => openPost(post.slug));

		const top = document.createElement("span");
		top.className = "post-item-top";
		const date = document.createElement("span");
		date.textContent = post.date;
		const draft = document.createElement("span");
		if (post.draft) {
			draft.className = "badge-draft";
			draft.textContent = "borrador";
		}
		top.append(date, draft);

		const title = document.createElement("span");
		title.className = "post-item-title";
		title.textContent = post.title || "(sin título)";

		const meta = document.createElement("span");
		meta.className = "post-item-meta";
		meta.textContent = post.category;

		button.append(top, title, meta);
		item.append(button);
		el.postList.append(item);
	}

	el.listEmpty.hidden = posts.length > 0;
	el.listEmpty.textContent = state.posts.length
		? "Ninguna nota coincide con el filtro."
		: "Todavía no hay notas. Crea la primera.";

	const total = state.posts.length;
	el.postCount.textContent = `${total} ${total === 1 ? "nota" : "notas"}`;
}

async function openPost(slug) {
	if (state.current?.slug === slug && !state.dirty) return;
	if (!confirmDiscard()) return;
	try {
		const data = await api(`/admin/api/posts/${encodeURIComponent(slug)}`);
		fillForm(data.post, false);
	} catch (error) {
		toast(error.message || "No se pudo abrir la nota.", "error");
	}
}

async function openFromHash() {
	if (!el.form.hidden || state.dirty) return;
	let slug = "";
	try {
		slug = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
	} catch {
		return;
	}
	if (slug && state.posts.some((post) => post.slug === slug)) {
		await openPost(slug);
	}
}

function newPost() {
	if (!confirmDiscard()) return;
	fillForm(
		{
			slug: "",
			title: "",
			description: "",
			date: todayIso(),
			category: state.categories[0] || "notas",
			minutes: 1,
			lang: "es",
			field: "classic",
			draft: true,
			markdown: "",
		},
		true,
	);
	el.title.focus();
}

function fillForm(post, isNew) {
	state.current = post;
	state.originalSlug = isNew ? null : post.slug;
	state.dirty = false;
	state.saving = false;
	state.slugTouched = !isNew;
	state.autoMinutes = isNew;

	el.form.reset();
	el.title.value = post.title || "";
	el.slug.value = post.slug || "";
	el.draft.checked = Boolean(post.draft);
	el.description.value = post.description || "";
	el.date.value = post.date || todayIso();
	el.category.value = post.category || "";
	el.minutes.value = String(post.minutes || 1);
	el.lang.value = post.lang === "en" ? "en" : "es";
	if (state.fields.some((field) => field.value === post.field)) {
		el.field.value = post.field;
	}
	el.markdown.value = post.markdown || "";

	clearErrors();
	setFormVisible(true);
	el.formMode.textContent = isNew ? "nueva nota" : "editando";
	el.deletePost.hidden = isNew;
	el.savePost.textContent = isNew ? "crear nota" : "guardar";
	el.viewPost.hidden = true;
	if (isNew) {
		history.replaceState(null, "", location.pathname + location.search);
	} else {
		history.replaceState(
			null,
			"",
			`#${encodeURIComponent(post.slug)}`,
		);
	}

	updateSlugPreview();
	updateDescCount();
	updateCounts();
	updateSiteLinks();
	renderList();
	setStatus(isNew ? "nueva nota" : "guardado", isNew ? "idle" : "saved");
		el.main.scrollTo({ top: 0, behavior: "auto" });
	schedulePreview(20);
}

function setFormVisible(visible) {
	el.form.hidden = !visible;
	el.welcome.hidden = visible;
}

/* ------------------------------------------------------------------
   Guardar y eliminar
------------------------------------------------------------------- */

function collect() {
	return {
		slug: el.slug.value.trim(),
		title: el.title.value.trim(),
		description: el.description.value.trim(),
		date: el.date.value,
		category: el.category.value.trim(),
		minutes: Number(el.minutes.value),
		lang: el.lang.value,
		field: el.field.value,
		draft: el.draft.checked,
		markdown: el.markdown.value,
	};
}

async function save() {
	if (state.saving) return;
	if (!el.form.reportValidity()) {
		setStatus("revisa los campos", "error");
		return;
	}

	clearErrors();
	state.saving = true;
	el.savePost.disabled = true;
	setStatus("guardando…", "saving");

	try {
		const isNew = !state.originalSlug;
		const path = isNew
			? "/admin/api/posts"
			: `/admin/api/posts/${encodeURIComponent(state.originalSlug)}`;
		const data = await api(path, {
			method: isNew ? "POST" : "PUT",
			body: JSON.stringify(collect()),
		});
		absorbSaved(data.post);
		toast(isNew ? "Nota creada." : "Guardado.", "ok");
	} catch (error) {
		if (error.status === 401) return;
		if (error.fields) showFieldErrors(error.fields);
		if (!error.fields?.markdown) {
			showFormError(error.message || "No se pudo guardar.");
		}
		setStatus("error", "error");
		toast(error.message || "No se pudo guardar.", "error");
	} finally {
		state.saving = false;
		el.savePost.disabled = false;
	}
}

function absorbSaved(post) {
	const oldSlug = state.originalSlug;
	state.posts = state.posts.filter(
		(item) => item.slug !== oldSlug && item.slug !== post.slug,
	);
	state.posts.push({
		slug: post.slug,
		title: post.title,
		description: post.description,
		date: post.date,
		category: post.category,
		minutes: post.minutes,
		lang: post.lang,
		field: post.field,
		draft: post.draft,
		updatedAt: new Date().toISOString(),
	});
	state.posts.sort(
		(a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
	);

	if (!state.categories.includes(post.category)) {
		state.categories.push(post.category);
		state.categories.sort((a, b) => a.localeCompare(b));
		renderCategories();
	}

	state.current = post;
	state.originalSlug = post.slug;
	state.dirty = false;
	state.slugTouched = true;
	history.replaceState(null, "", `#${encodeURIComponent(post.slug)}`);

	el.slug.value = post.slug;
	el.title.value = post.title;
	el.description.value = post.description;
	el.category.value = post.category;
	el.minutes.value = String(post.minutes);
	el.date.value = post.date;
	el.lang.value = post.lang;
	el.field.value = post.field;
	el.draft.checked = post.draft;
	el.formMode.textContent = "editando";
	el.deletePost.hidden = false;
	el.savePost.textContent = "guardar";

	updateSlugPreview();
	updateDescCount();
	updateCounts();
	updateSiteLinks();
	renderList();

	const time = new Date().toLocaleTimeString("es", {
		hour: "2-digit",
		minute: "2-digit",
	});
	setStatus(`guardado ${time}`, "saved");
}

async function removeCurrent() {
	if (!state.originalSlug) return;
	const title = el.title.value.trim() || "esta nota";
	if (!confirm(`¿Eliminar «${title}»?\nSe moverá a .admin/trash por si acaso.`)) {
		return;
	}
	try {
		await api(`/admin/api/posts/${encodeURIComponent(state.originalSlug)}`, {
			method: "DELETE",
		});
		state.posts = state.posts.filter(
			(post) => post.slug !== state.originalSlug,
		);
		state.current = null;
		state.originalSlug = null;
		state.dirty = false;
		history.replaceState(null, "", location.pathname + location.search);
		renderList();
		setFormVisible(false);
		updateSiteLinks();
		toast("Nota movida a .admin/trash.", "ok");
	} catch (error) {
		if (error.status === 401) return;
		toast(error.message || "No se pudo eliminar.", "error");
	}
}

/* ------------------------------------------------------------------
   Estado del formulario
------------------------------------------------------------------- */

function markDirty() {
	if (!state.dirty) {
		state.dirty = true;
		setStatus("sin guardar", "dirty");
	}
	updateSiteLinks();
}

function setStatus(text, mode) {
	el.saveState.textContent = text;
	el.saveState.dataset.state = mode;
}

function confirmDiscard(message = "Hay cambios sin guardar. ¿Descartarlos?") {
	if (!state.dirty) return true;
	return window.confirm(message);
}

function showFormError(message) {
	el.formError.textContent = message;
	el.formError.hidden = false;
}

function hideFormError() {
	el.formError.hidden = true;
	el.formError.textContent = "";
}

function clearErrors() {
	for (const node of el.form.querySelectorAll("[data-error]")) {
		node.textContent = "";
	}
	for (const input of Object.values(fieldInputs)) {
		input.removeAttribute("aria-invalid");
	}
	hideFormError();
}

function showFieldErrors(fields) {
	clearErrors();
	let first = null;
	for (const [key, message] of Object.entries(fields)) {
		const node = el.form.querySelector(`[data-error="${key}"]`);
		if (node) node.textContent = message;
		const input = fieldInputs[key];
		if (input) {
			input.setAttribute("aria-invalid", "true");
			if (!first) first = input;
		}
	}
	if (fields.markdown) showFormError(fields.markdown);
	if (first) first.focus();
}

function updateSlugPreview() {
	const slug = el.slug.value.trim();
	el.slugPreview.textContent = slug || "…";
}

function updateDescCount() {
	el.descCount.textContent = `${el.description.value.length}/600`;
}

function updateCounts() {
	const text = el.markdown.value;
	const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
	const minutes = Math.max(1, Math.ceil(words / 200));
	el.wordCount.textContent = `${words} ${words === 1 ? "palabra" : "palabras"} · ${text.length} caracteres`;
	el.readTime.textContent = words ? `≈ ${minutes} min` : "—";
	if (state.autoMinutes) el.minutes.value = String(minutes);
}

function updateSiteLinks() {
	const base = (state.siteUrl || "").replace(/\/+$/, "");
	el.siteLink.href = `${base}/`;
	const post = state.current;
	const published = Boolean(post && !post.draft && !state.dirty && state.originalSlug);
	el.viewPost.hidden = !published;
	if (published) {
		el.viewPost.href = `${base}/blog/${encodeURIComponent(post.slug)}`;
	}
}

/* ------------------------------------------------------------------
   Vista previa
------------------------------------------------------------------- */

function schedulePreview(delay = 450) {
	clearTimeout(state.previewTimer);
	state.previewTimer = setTimeout(refreshPreview, delay);
}

async function refreshPreview() {
	if (el.form.hidden) return;
	const seq = ++state.previewSeq;
	el.previewState.textContent = "actualizando…";
	try {
		const data = await api("/admin/api/preview", {
			method: "POST",
			body: JSON.stringify({
				markdown: el.markdown.value,
				theme: document.documentElement.dataset.theme,
			}),
		});
		if (seq !== state.previewSeq) return;
		el.preview.srcdoc = data.document;
		el.previewState.textContent = "en vivo";
	} catch (error) {
		if (error.status === 401) return;
		el.previewState.textContent = "error";
	}
}

/* ------------------------------------------------------------------
   Formato Markdown
------------------------------------------------------------------- */

function afterEdit() {
	markDirty();
	updateCounts();
	schedulePreview();
}

function wrapSelection(before, after, placeholder) {
	const textarea = el.markdown;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const selected = textarea.value.slice(start, end) || placeholder;
	const text = `${before}${selected}${after}`;
	textarea.setRangeText(text, start, end, "end");
	const selectFrom = start + before.length;
	textarea.setSelectionRange(selectFrom, selectFrom + selected.length);
	textarea.focus();
	afterEdit();
}

function insertPlain(text) {
	const textarea = el.markdown;
	textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, "end");
	textarea.focus();
	afterEdit();
}

function insertBlock(text, placeholder) {
	const textarea = el.markdown;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const before = textarea.value.slice(0, start);
	const after = textarea.value.slice(end);
	const lead = !before
		? ""
		: before.endsWith("\n\n")
			? ""
			: before.endsWith("\n")
				? "\n"
				: "\n\n";
	const tail = !after
		? "\n"
		: after.startsWith("\n\n")
			? ""
			: after.startsWith("\n")
				? "\n"
				: "\n\n";
	const full = `${lead}${text}${tail}`;
	textarea.setRangeText(full, start, end, "end");
	if (placeholder) {
		const index = full.indexOf(placeholder);
		if (index !== -1) {
			const from = start + index;
			textarea.setSelectionRange(from, from + placeholder.length);
		}
	}
	textarea.focus();
	afterEdit();
}

function prefixLines(prefix, numbered = false) {
	const textarea = el.markdown;
	const value = textarea.value;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
	let lineEnd = value.indexOf("\n", end);
	if (lineEnd === -1) lineEnd = value.length;
	const block = value.slice(lineStart, lineEnd);
	const next = block
		.split("\n")
		.map((line, index) => (numbered ? `${index + 1}. ` : prefix) + line)
		.join("\n");
	textarea.setRangeText(next, lineStart, lineEnd, "end");
	textarea.setSelectionRange(lineStart, lineStart + next.length);
	textarea.focus();
	afterEdit();
}

function applyAction(action) {
	switch (action) {
		case "h2":
			prefixLines("## ");
			break;
		case "h3":
			prefixLines("### ");
			break;
		case "bold":
			wrapSelection("**", "**", "texto");
			break;
		case "italic":
			wrapSelection("*", "*", "texto");
			break;
		case "code":
			wrapSelection("`", "`", "código");
			break;
		case "link":
			wrapSelection("[", "](/blog/otra-nota)", "texto del enlace");
			break;
		case "quote":
			prefixLines("> ");
			break;
		case "ul":
			prefixLines("- ");
			break;
		case "ol":
			prefixLines("", true);
			break;
		case "table":
			insertBlock(
				"| columna | columna |\n| --- | --- |\n| celda | celda |",
				"columna",
			);
			break;
		case "figure":
			insertBlock(
				'<figure>\n  <img src="/images/ejemplo.png" alt="" width="1200" height="800" loading="lazy" />\n  <figcaption>fig. 1 — descripción.</figcaption>\n</figure>',
				"descripción",
			);
			break;
		case "note":
			insertBlock(
				'<div class="note">\n  <p><strong>Nota.</strong> texto.</p>\n</div>',
				"texto",
			);
			break;
		case "equation":
			insertBlock(
				'<div class="equation">\n  <math display="block">\n    <mi>x</mi>\n    <mo>=</mo>\n    <mn>1</mn>\n  </math>\n</div>',
			);
			break;
		case "pre":
			insertBlock(['```python', 'print("hola")', "```"].join("\n"), 'print("hola")');
			break;
		case "image":
			el.fileInput.click();
			break;
	}
}

/* ------------------------------------------------------------------
   Imágenes
------------------------------------------------------------------- */

function fileToDataURL(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ""));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

async function uploadImage(file) {
	if (!file || state.uploading) return;
	if (!/^image\/(png|jpeg|gif|webp|avif)$/.test(file.type)) {
		toast("Formato no admitido. Usa PNG, JPEG, GIF, WebP o AVIF.", "error");
		return;
	}
	if (file.size > 8 * 1024 * 1024) {
		toast("La imagen supera los 8 MB.", "error");
		return;
	}

	state.uploading = true;
	toast("Subiendo imagen…", "ok");
	try {
		const dataUrl = await fileToDataURL(file);
		const data = await api("/admin/api/upload", {
			method: "POST",
			body: JSON.stringify({ name: file.name, data: dataUrl }),
		});
		const size =
			data.width && data.height
				? ` width="${data.width}" height="${data.height}"`
				: "";
		const figure = [
			"<figure>",
			`  <img src="${data.path}" alt=""${size} loading="lazy" />`,
			"  <figcaption>fig. — descripción.</figcaption>",
			"</figure>",
		].join("\n");
		insertBlock(figure, "descripción");
		toast(`Imagen guardada en public${data.path}.`, "ok");
	} catch (error) {
		if (error.status !== 401) {
			toast(error.message || "No se pudo subir la imagen.", "error");
		}
	} finally {
		state.uploading = false;
	}
}

/* ------------------------------------------------------------------
   Tema y utilidades
------------------------------------------------------------------- */

function syncThemeButton() {
	const dark = document.documentElement.dataset.theme === "dark";
	el.themeToggle.textContent = dark ? "claro" : "oscuro";
	el.themeToggle.setAttribute(
		"aria-label",
		`Cambiar a tema ${dark ? "claro" : "oscuro"}`,
	);
}

function toggleTheme() {
	const next =
		document.documentElement.dataset.theme === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = next;
	try {
		localStorage.setItem("theme", next);
	} catch {
		/* almacenamiento no disponible */
	}
	syncThemeButton();
	refreshPreview();
}

function slugify(value) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 96)
		.replace(/-+$/g, "");
}

function todayIso() {
	const now = new Date();
	const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
	return local.toISOString().slice(0, 10);
}

function toast(message, kind = "ok") {
	clearTimeout(state.toastTimer);
	el.toast.textContent = message;
	el.toast.dataset.kind = kind;
	el.toast.hidden = false;
	state.toastTimer = setTimeout(() => {
		el.toast.hidden = true;
	}, 4200);
}

function switchView(view) {
	el.editorFrame.dataset.mobileView = view;
	for (const button of el.mobileTabs.querySelectorAll("button")) {
		const active = button.dataset.view === view;
		button.classList.toggle("is-active", active);
		button.setAttribute("aria-selected", String(active));
	}
}

/* ------------------------------------------------------------------
   Eventos
------------------------------------------------------------------- */

function bindEvents() {
	el.loginForm.addEventListener("submit", handleLogin);
	el.logout.addEventListener("click", handleLogout);
	el.themeToggle.addEventListener("click", toggleTheme);

	el.newPost.addEventListener("click", newPost);
	el.welcomeNew.addEventListener("click", newPost);
	el.search.addEventListener("input", renderList);

	el.form.addEventListener("submit", (event) => {
		event.preventDefault();
		save();
	});
	el.deletePost.addEventListener("click", removeCurrent);
	el.autoMinutes.addEventListener("click", () => {
		state.autoMinutes = true;
		updateCounts();
		markDirty();
		toast("Duración recalculada desde el texto.", "ok");
	});

	el.title.addEventListener("input", () => {
		if (!state.slugTouched) {
			el.slug.value = slugify(el.title.value);
			updateSlugPreview();
		}
		markDirty();
		document.title = `${el.title.value.trim() || "nueva nota"} · admin`;
	});

	el.slug.addEventListener("input", () => {
		state.slugTouched = true;
		updateSlugPreview();
		markDirty();
	});
	el.slug.addEventListener("blur", () => {
		el.slug.value = slugify(el.slug.value);
		updateSlugPreview();
	});

	el.description.addEventListener("input", () => {
		updateDescCount();
		markDirty();
	});

	el.markdown.addEventListener("input", () => {
		markDirty();
		updateCounts();
		schedulePreview();
	});

	for (const input of [el.date, el.category, el.lang, el.field]) {
		input.addEventListener("input", markDirty);
	}
	el.minutes.addEventListener("input", () => {
		state.autoMinutes = false;
		markDirty();
	});
	el.draft.addEventListener("change", markDirty);

	el.form.addEventListener("input", (event) => {
		const name = event.target.name;
		if (!name) return;
		const node = el.form.querySelector(`[data-error="${name}"]`);
		if (node) node.textContent = "";
		event.target.removeAttribute("aria-invalid");
		if (name !== "markdown") hideFormError();
	});

	el.toolbar.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-action]");
		if (button) applyAction(button.dataset.action);
	});

	el.fileInput.addEventListener("change", async () => {
		const file = el.fileInput.files?.[0];
		el.fileInput.value = "";
		if (file) await uploadImage(file);
	});

	el.markdown.addEventListener("dragover", (event) => {
		if (event.dataTransfer?.types?.includes("Files")) {
			event.preventDefault();
			el.markdown.classList.add("is-dragover");
		}
	});
	el.markdown.addEventListener("dragleave", () => {
		el.markdown.classList.remove("is-dragover");
	});
	el.markdown.addEventListener("drop", async (event) => {
		event.preventDefault();
		el.markdown.classList.remove("is-dragover");
		const file = [...(event.dataTransfer?.files || [])].find((item) =>
			item.type.startsWith("image/"),
		);
		if (file) await uploadImage(file);
	});

	el.mobileTabs.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-view]");
		if (button) switchView(button.dataset.view);
	});

	document.addEventListener("keydown", (event) => {
		const mod = event.metaKey || event.ctrlKey;
		if (mod && event.key.toLowerCase() === "s") {
			event.preventDefault();
			if (!el.form.hidden) save();
			return;
		}
		if (el.form.hidden) return;
		if (event.target !== el.markdown) return;
		if (mod && event.key.toLowerCase() === "b") {
			event.preventDefault();
			applyAction("bold");
		} else if (mod && event.key.toLowerCase() === "i") {
			event.preventDefault();
			applyAction("italic");
		} else if (mod && event.key.toLowerCase() === "k") {
			event.preventDefault();
			applyAction("link");
		} else if (event.key === "Tab") {
			event.preventDefault();
			insertPlain("  ");
		}
	});

	window.addEventListener("beforeunload", (event) => {
		if (!state.dirty) return;
		event.preventDefault();
		event.returnValue = "";
	});
}

boot();
