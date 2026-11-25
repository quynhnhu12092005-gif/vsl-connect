import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { isPersonalTheme, type PersonalTheme, type SiteTheme } from '../config/themes';
import { apiRequest, useAdminResource, type AuthSession, type SeasonalAppearance } from '../services/adminApi';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  siteTheme: SiteTheme;
  canCustomize: boolean;
  setSiteTheme: (theme: PersonalTheme) => void;
  seasonalAppearance: SeasonalAppearance | null;
  seasonalError: string | null;
  refreshSeasonalAppearance: () => void;
  saveSeasonalAppearance: (enabled: boolean, csrfToken: string) => Promise<void>;
  followSeason: () => void;
  backgroundMotion: boolean;
  setBackgroundMotion: (enabled: boolean) => void;
};

const STORAGE_KEY = 'vsl-connect-theme';
const SITE_STORAGE_KEY = 'vsl-connect-site-theme';
const SEASON_STORAGE_KEY = 'vsl-connect-season-overrides';
const MOTION_STORAGE_KEY = 'vsl-connect-background-motion';
const ThemeContext = createContext<ThemeContextValue | null>(null);

type SeasonOverride = { theme: PersonalTheme; revision: number };

function readSeasonOverrides(value: string | null): Record<number, SeasonOverride> {
  try {
    const overrides: Record<number, SeasonOverride> = {};
    const entries = Object.entries(JSON.parse(value ?? '{}'));
    for (const [id, entry] of entries) {
      const item = entry as Partial<SeasonOverride> | null;
      if (/^\d+$/.test(id) && item && isPersonalTheme(item.theme) && typeof item.revision === 'number' && Number.isSafeInteger(item.revision)) {
        overrides[Number(id)] = { theme: item.theme, revision: item.revision };
      }
    }
    return overrides;
  } catch { return {}; }
}

function getSeasonOverrides() {
  try { return readSeasonOverrides(localStorage.getItem(SEASON_STORAGE_KEY)); } catch { return {}; }
}

function getInitialTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const session = useAdminResource<AuthSession>('/auth/me');
  const userId = session.data?.user.id;
  const canCustomize = userId !== undefined;
  const { data: seasonalAppearance, error: seasonalError, refresh: refreshSeasonalAppearance, setData: setSeasonalAppearance } =
    useAdminResource<SeasonalAppearance>('/auth/seasonal-appearance', canCustomize);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [backgroundMotion, setBackgroundMotion] = useState(() => {
    try { return localStorage.getItem(MOTION_STORAGE_KEY) !== 'off'; } catch { return true; }
  });
  const [preferredSiteTheme, setPreferredSiteTheme] = useState<PersonalTheme>(() => {
    try {
      const saved = localStorage.getItem(SITE_STORAGE_KEY);
      if (isPersonalTheme(saved)) return saved;
    } catch { /* Use the default when storage is unavailable. */ }
    return 'default';
  });
  const [seasonOverrides, setSeasonOverrides] = useState(getSeasonOverrides);
  const winter = seasonalAppearance?.winter_enabled === true;
  const override = userId === undefined ? undefined : seasonOverrides[userId];
  const siteTheme: SiteTheme = !canCustomize ? 'default' : winter
    ? override && override.revision === seasonalAppearance.revision ? override.theme : 'winter'
    : preferredSiteTheme;

  function updateOverride(next: SeasonOverride | null) {
    if (userId === undefined) return;
    const updated = { ...seasonOverrides, ...getSeasonOverrides() };
    if (next) updated[userId] = next;
    else delete updated[userId];
    setSeasonOverrides(updated);
    try { localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(updated)); } catch { /* Keep the choice in memory. */ }
  }

  const setSiteTheme = (nextTheme: PersonalTheme) => {
    if (!canCustomize || !isPersonalTheme(nextTheme)) return;
    if (winter) updateOverride({ theme: nextTheme, revision: seasonalAppearance.revision });
    setPreferredSiteTheme(nextTheme);
  };

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Keep the selected theme for this session even when persistence is blocked.
    }
  }, [theme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.siteTheme = siteTheme;
    if (canCustomize) {
      try { localStorage.setItem(SITE_STORAGE_KEY, preferredSiteTheme); } catch { /* Keep the selection in memory. */ }
    }
  }, [siteTheme, canCustomize, preferredSiteTheme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.backgroundMotion = backgroundMotion ? 'on' : 'off';
    try { localStorage.setItem(MOTION_STORAGE_KEY, backgroundMotion ? 'on' : 'off'); } catch { /* Retain in memory. */ }
  }, [backgroundMotion]);

  useEffect(() => {
    function syncTheme(event: StorageEvent) {
      if (event.key === SITE_STORAGE_KEY) setPreferredSiteTheme(isPersonalTheme(event.newValue) ? event.newValue : 'default');
      if (event.key === SEASON_STORAGE_KEY) setSeasonOverrides(readSeasonOverrides(event.newValue));
      if (event.key === STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark')) setTheme(event.newValue);
      if (event.key === MOTION_STORAGE_KEY) setBackgroundMotion(event.newValue !== 'off');
    }
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  useEffect(() => {
    const verifySession = () => {
      if (document.visibilityState !== 'visible') return;
      session.refresh();
      if (canCustomize) refreshSeasonalAppearance();
    };
    window.addEventListener('focus', verifySession);
    document.addEventListener('visibilitychange', verifySession);
    return () => {
      window.removeEventListener('focus', verifySession);
      document.removeEventListener('visibilitychange', verifySession);
    };
  }, [session.refresh, canCustomize, refreshSeasonalAppearance]);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  async function saveSeasonalAppearance(enabled: boolean, csrfToken: string) {
    const saved = await apiRequest<SeasonalAppearance>('/admin/seasonal-appearance', {
      method: 'PUT',
      body: { winter_enabled: enabled },
      csrfToken,
    });
    setSeasonalAppearance(saved);
    refreshSeasonalAppearance();
  }

  return <ThemeContext.Provider value={{
    theme, setTheme, toggleTheme, siteTheme, setSiteTheme, canCustomize, backgroundMotion, setBackgroundMotion,
    seasonalAppearance, seasonalError, refreshSeasonalAppearance, saveSeasonalAppearance, followSeason: () => updateOverride(null),
  }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
