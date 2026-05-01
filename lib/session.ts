export type AppSession = {
  profileId: string;
  email: string;
  fullName: string;
  role: "admin" | "student";
  enrollmentNo?: string;
  token?: string;
};

const SESSION_KEY = "ccc_session_v2";

function setCookie(name: string, value: string, days: number = 30) {
  if (typeof window === "undefined") return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/" + secure + "; SameSite=Lax";
}

function getCookie(name: string) {
  if (typeof window === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

export function getSession(): AppSession | null {
  const raw = getCookie(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AppSession;
    if (!parsed?.profileId || !parsed?.email || !parsed?.role || !parsed?.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: AppSession): void {
  setCookie(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  setCookie(SESSION_KEY, "", -1);
}
