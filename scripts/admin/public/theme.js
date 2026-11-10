(() => {
	let saved = null;
	try {
		saved = localStorage.getItem("theme");
	} catch {
		/* almacenamiento no disponible */
	}
	const dark = saved
		? saved === "dark"
		: window.matchMedia("(prefers-color-scheme: dark)").matches;
	document.documentElement.dataset.theme = dark ? "dark" : "light";
})();
