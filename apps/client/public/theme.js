// Applies the saved theme before first paint (external file so the strict CSP allows it).
try {
  var t = JSON.parse(localStorage.getItem("vidya-ui") || "{}").state?.theme || "system";
  var dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}
