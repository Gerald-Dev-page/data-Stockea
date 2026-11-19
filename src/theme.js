// src/theme.js
// Se ejecuta antes de React al importarlo en main.jsx.
// El modo oscuro es el predeterminado cuando no existe una preferencia guardada.
const STORAGE_KEY = "stockea.theme";

export function getSavedTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(nextTheme) {
  const theme = nextTheme === "light" ? "light" : "dark";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // El sistema sigue funcionando si el navegador bloquea localStorage.
    }
  }
  return theme;
}

// Aplicación temprana: respeta la selección incluso en la pantalla de login.
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", getSavedTheme());
}
