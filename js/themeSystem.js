const THEME_STORAGE_KEY = 'hw.mp_custom_themes_v1';
const ACTIVE_THEME_KEY = 'hw.mp_active_theme_v1';

/* Preset themes (denoted by comment in each object) */
const PRESET_THEMES = [
  { id: 'midnight', name: 'Midnight (default)', comment: 'Clean dark', vars: {
      '--bg': '#0b1220',
      '--fg': '#e6eef8',
      '--accent': '#6ee7b7',
      '--muted': '#8892a6',
      PARTICLES: { h: 220, s: 0.9, l: 0.1, opacity: 0.22 }
    }
},
  { id: 'light', name: 'Soft light', comment: 'Neutral light', vars: {
      '--bg': '#f6f7fb',
      '--fg': '#0b1220',
      '--accent': '#2563eb',
      '--muted': '#6b7280',
      '--particle-start': '#f472b6',
      '--particle-end': '#60a5fa'
    }},
  { id: 'solar', name: 'Solarized warm', comment: 'Warm contrast', vars: {
      '--bg': '#0f1720','--fg': '#f8efe8','--accent': '#f59e0b','--muted': '#94a3b8',
      '--particle-start': '#f97316','--particle-end': '#f59e0b'
    }},
];