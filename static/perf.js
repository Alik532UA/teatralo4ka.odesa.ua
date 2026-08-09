// Винесено з app.html: інлайн-скрипт не проходить CSP без хеша,
// а цей нічого не малює — його затримка на один запит непомітна.
window.__perfLog = [];
window.__perfT0 = performance.now();
window.__perf = function(label) {
	var entry = { t: Math.round(performance.now() - window.__perfT0), label: label };
	window.__perfLog.push(entry);
};
window.__perf('inline-head: script parsed');
