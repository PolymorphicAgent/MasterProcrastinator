const THEME_STORAGE_KEY = 'hw.mp_custom_themes_v1';
const ACTIVE_THEME_KEY = 'hw.mp_active_theme_v1';

// Default CSS variable values
const DEFAULT_CSS_VARS = {
    '--bg': '#0b1220',
    '--text': '#e6eef8',
    '--surface': '#151f32',
    '--surface-2': '#1c2a42',
    '--link': '#60a5fa',
    '--muted': '#8892a6',
    '--primary': '#6d28d9',
    '--primary-500': '#7c3aed',
    '--accent': '#6ee7b7',
    '--ring': '#6d28d9',
    '--border': '#2e3a50',
};

const DEFAULT_PARTICLE_SETTINGS = {
    h: 220,
    s: 0.9,
    l: 0.1,
    opacity: 0.22
};

/* ─────────────────────────────────────────────────────────────────────────────
   PRESET THEMES
   ───────────────────────────────────────────────────────────────────────────── */

const PRESET_THEMES = [
    {
        id: 'midnight',
        name: 'Midnight',
        description: 'The default dark theme',
        isPreset: true,
        vars: {
            '--bg': '#0b1220',
            '--text': '#e6eef8',
            '--surface': '#151f32',
            '--surface-2': '#1c2a42',
            '--link': '#60a5fa',
            '--muted': '#8892a6',
            '--primary': '#6d28d9',
            '--primary-500': '#7c3aed',
            '--accent': '#6ee7b7',
            '--ring': '#6d28d9',
            '--border': '#2e3a50',
        },
        particles: { h: 220, s: 0.9, l: 0.1, opacity: 0.22 }
    },
    {
        id: 'soft-light',
        name: 'Soft Light',
        description: 'A gentle light theme',
        isPreset: true,
        vars: {
            '--bg': '#f6f7fb',
            '--text': '#1a1a2e',
            '--surface': '#ffffff',
            '--surface-2': '#e8eaef',
            '--link': '#2563eb',
            '--muted': '#6b7280',
            '--primary': '#6d28d9',
            '--primary-500': '#7c3aed',
            '--accent': '#10b981',
            '--ring': '#6d28d9',
            '--border': '#d1d5db',
        },
        particles: { h: 250, s: 1.0, l: 0.6, opacity: 0.55 }
    },
    {
        id: 'solar-warm',
        name: 'Solar Warm',
        description: 'Warm amber tones',
        isPreset: true,
        vars: {
            '--bg': '#0f1720',
            '--text': '#f8efe8',
            '--surface': '#1a2332',
            '--surface-2': '#252f3f',
            '--link': '#fbbf24',
            '--muted': '#94a3b8',
            '--primary': '#f59e0b',
            '--primary-500': '#fbbf24',
            '--accent': '#f97316',
            '--ring': '#f59e0b',
            '--border': '#374151',
        },
        particles: { h: 35, s: 0.95, l: 0.15, opacity: 0.28 }
    },
    {
        id: 'ocean-depths',
        name: 'Ocean Depths',
        description: 'Deep blue oceanic feel',
        isPreset: true,
        vars: {
            '--bg': '#0a1628',
            '--text': '#e0f2fe',
            '--surface': '#0c1f3d',
            '--surface-2': '#132a4a',
            '--link': '#38bdf8',
            '--muted': '#7dd3fc',
            '--primary': '#0284c7',
            '--primary-500': '#0ea5e9',
            '--accent': '#22d3ee',
            '--ring': '#0284c7',
            '--border': '#1e3a5f',
        },
        particles: { h: 195, s: 0.85, l: 0.12, opacity: 0.25 }
    },
    {
        id: 'forest-night',
        name: 'Forest Night',
        description: 'Earthy greens and browns',
        isPreset: true,
        vars: {
            '--bg': '#0d1512',
            '--text': '#d4e8d0',
            '--surface': '#142018',
            '--surface-2': '#1c2e22',
            '--link': '#86efac',
            '--muted': '#6b8f71',
            '--primary': '#16a34a',
            '--primary-500': '#22c55e',
            '--accent': '#a3e635',
            '--ring': '#16a34a',
            '--border': '#2d4a35',
        },
        particles: { h: 140, s: 0.7, l: 0.12, opacity: 0.22 }
    },
    {
        id: 'rose-garden',
        name: 'Rose Garden',
        description: 'Soft pink and rose tones',
        isPreset: true,
        vars: {
            '--bg': '#1a0f14',
            '--text': '#fce7f3',
            '--surface': '#2a1520',
            '--surface-2': '#3a1f2d',
            '--link': '#f9a8d4',
            '--muted': '#a78b97',
            '--primary': '#db2777',
            '--primary-500': '#ec4899',
            '--accent': '#f472b6',
            '--ring': '#db2777',
            '--border': '#4a2639',
        },
        particles: { h: 330, s: 0.8, l: 0.15, opacity: 0.25 }
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        description: 'Neon cyan and magenta',
        isPreset: true,
        vars: {
            '--bg': '#0a0a0f',
            '--text': '#f0f0ff',
            '--surface': '#12121a',
            '--surface-2': '#1a1a26',
            '--link': '#00ffff',
            '--muted': '#888899',
            '--primary': '#ff00ff',
            '--primary-500': '#ff44ff',
            '--accent': '#00ffff',
            '--ring': '#ff00ff',
            '--border': '#333344',
        },
        particles: { h: 290, s: 1.0, l: 0.2, opacity: 0.35 }
    },
    {
        id: 'coffee-house',
        name: 'Coffee House',
        description: 'Cozy brown and cream',
        isPreset: true,
        vars: {
            '--bg': '#1c1410',
            '--text': '#f5e6d3',
            '--surface': '#2a1f18',
            '--surface-2': '#3a2c22',
            '--link': '#d4a574',
            '--muted': '#a89080',
            '--primary': '#8b5a2b',
            '--primary-500': '#a0693d',
            '--accent': '#c9a66b',
            '--ring': '#8b5a2b',
            '--border': '#4a3828',
        },
        particles: { h: 30, s: 0.5, l: 0.12, opacity: 0.2 }
    },
    {
        id: 'arctic-frost',
        name: 'Arctic Frost',
        description: 'Cool icy blues and whites',
        isPreset: true,
        vars: {
            '--bg': '#f0f9ff',
            '--text': '#0c4a6e',
            '--surface': '#ffffff',
            '--surface-2': '#e0f2fe',
            '--link': '#0284c7',
            '--muted': '#64748b',
            '--primary': '#0369a1',
            '--primary-500': '#0284c7',
            '--accent': '#06b6d4',
            '--ring': '#0369a1',
            '--border': '#bae6fd',
        },
        particles: { h: 200, s: 0.6, l: 0.7, opacity: 0.5 }
    },
    {
        id: 'high-contrast',
        name: 'High Contrast',
        description: 'Maximum readability',
        isPreset: true,
        vars: {
            '--bg': '#000000',
            '--text': '#ffffff',
            '--surface': '#1a1a1a',
            '--surface-2': '#2a2a2a',
            '--link': '#ffff00',
            '--muted': '#cccccc',
            '--primary': '#00ff00',
            '--primary-500': '#44ff44',
            '--accent': '#00ffff',
            '--ring': '#ffffff',
            '--border': '#ffffff',
        },
        particles: { h: 120, s: 1.0, l: 0.3, opacity: 0.4 }
    }
];

/* ─────────────────────────────────────────────────────────────────────────────
   INITIALIZATION
   ───────────────────────────────────────────────────────────────────────────── */
function initThemeSystem() {
    loadCustomThemes();
    loadActiveTheme();
    renderThemeTiles();
    setupThemeEditorListeners();
    populateEditorFromCurrentTheme();
}

/* ─────────────────────────────────────────────────────────────────────────────
   PERSISTENCE
   ───────────────────────────────────────────────────────────────────────────── */
function loadCustomThemes() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        state.themeSystem.customThemes = stored ? JSON.parse(stored) : [];
        // Mark all loaded themes as custom (not preset)
        state.themeSystem.customThemes.forEach(t => t.isPreset = false);
    } catch (e) {
        console.warn('Failed to load custom themes:', e);
        //TODO: custom push notification
        state.themeSystem.customThemes = [];
    }
}

function saveCustomThemes() {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state.themeSystem.customThemes));
    } catch (e) {
        console.error('Failed to save custom themes:', e);
        //TODO: custom push notification
    }
}

function loadActiveTheme() {
    const stored = localStorage.getItem(ACTIVE_THEME_KEY);
    if (stored) {
        state.themeSystem.activeThemeId = stored;
    }
    const theme = getThemeById(state.themeSystem.activeThemeId);
    if (theme) {
        applyThemeToDOM(theme);
    }
}

function saveActiveTheme(themeId) {
    state.themeSystem.activeThemeId = themeId;
    localStorage.setItem(ACTIVE_THEME_KEY, themeId);
}

/* ─────────────────────────────────────────────────────────────────────────────
   THEME RETRIEVAL
   ───────────────────────────────────────────────────────────────────────────── */
function getAllThemes() {
    return [...PRESET_THEMES, ...state.themeSystem.customThemes];
}

function getThemeById(id) {
    return getAllThemes().find(t => t.id === id) || PRESET_THEMES[0];
}

function generateThemeId() {
    return 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

/* ─────────────────────────────────────────────────────────────────────────────
   APPLY THEME TO DOM
   ───────────────────────────────────────────────────────────────────────────── */
function applyThemeToDOM(theme) {
    const root = document.documentElement;
    
    // Apply CSS variables
    for (const [varName, value] of Object.entries(theme.vars || {})) {
        root.style.setProperty(varName, value);
    }
    
    // Update particle colors if particles are active
    if (theme.particles && typeof material !== 'undefined' && material) {
        const p = theme.particles;
        material.color.setHSL(p.h / 360, p.s, p.l);
        material.opacity = p.opacity;
        
        // Update the PARTICLE_COLORS object for the animate loop
        // TODO: remove old theme system
        if (typeof PARTICLE_COLORS !== 'undefined') {
            // Determine if this is a light or dark theme based on bg luminance
            const isLight = isLightColor(theme.vars['--bg'] || '#0b1220');
            const key = isLight ? 'light' : 'dark';
            PARTICLE_COLORS[key] = { ...p };
        }
    }
    
    // Update data-theme attribute for any CSS that relies on it
    const isLight = isLightColor(theme.vars['--bg'] || '#0b1220');
    root.setAttribute('data-theme', isLight ? 'light' : 'dark');
    
    // Update state.theme for compatibility with existing code
    // TODO: remove old theme system
    if (typeof state !== 'undefined') {
        state.theme = isLight ? 'light' : 'dark';
    }
}

function isLightColor(hex) {
    // Convert hex to RGB and calculate luminance
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hslToHex(h, s, l) {
    // h is 0-360, s and l are 0-1
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return { h: 0, s: 0, l: 0 };
    
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
        h *= 360;
    }
    
    return { h, s, l };
}

/* ─────────────────────────────────────────────────────────────────────────────
   RENDER THEME TILES
   ───────────────────────────────────────────────────────────────────────────── */
function renderThemeTiles() {
    const container = document.getElementById('theme-presets');
    if (!container) return;
    
    container.innerHTML = '';
    
    const allThemes = getAllThemes();
    
    allThemes.forEach(theme => {
        const tile = createThemeTile(theme);
        container.appendChild(tile);
    });
}

function createThemeTile(theme) {
    const tile = document.createElement('div');
    tile.className = 'theme-tile' + (theme.id === state.themeSystem.activeThemeId ? ' active' : '');
    tile.dataset.themeId = theme.id;
    tile.title = theme.description || theme.name;
    
    // Color preview circles
    const preview = document.createElement('div');
    preview.className = 'theme-tile-preview';
    preview.style.background = theme.vars['--bg'] || '#0b1220';
    
    // Add color dots to show the palette
    const colors = ['--primary', '--accent', '--text', '--surface'];
    colors.forEach(varName => {
        const dot = document.createElement('span');
        dot.className = 'theme-color-dot';
        dot.style.background = theme.vars[varName] || DEFAULT_CSS_VARS[varName];
        preview.appendChild(dot);
    });
    
    // Theme name
    const name = document.createElement('div');
    name.className = 'theme-tile-name';
    name.textContent = theme.name;
    
    // Custom badge
    if (!theme.isPreset) {
        const badge = document.createElement('span');
        badge.className = 'theme-custom-badge';
        badge.textContent = '✦ Custom';
        name.appendChild(badge);
    }
    
    // Delete button for custom themes
    if (!theme.isPreset) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'theme-tile-delete';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'Delete this custom theme';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteCustomTheme(theme.id);
        };
        tile.appendChild(deleteBtn);
    }
    
    tile.appendChild(preview);
    tile.appendChild(name);
    
    // Click to apply theme
    tile.addEventListener('click', () => {
        selectTheme(theme.id);
    });
    
    return tile;
}

function selectTheme(themeId) {
    const theme = getThemeById(themeId);
    if (!theme) return;
    
    // Apply to DOM
    applyThemeToDOM(theme);
    
    // Save as active
    saveActiveTheme(themeId);
    
    // Update UI
    renderThemeTiles();
    populateEditorFromTheme(theme);
}

function deleteCustomTheme(themeId) {
    if (!confirm('Delete this custom theme?')) return;
    
    state.themeSystem.customThemes = state.themeSystem.customThemes.filter(t => t.id !== themeId);
    saveCustomThemes();
    
    // If the deleted theme was active, switch to default
    if (state.themeSystem.activeThemeId === themeId) {
        selectTheme('midnight');
    } else {
        renderThemeTiles();
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   THEME EDITOR
   ───────────────────────────────────────────────────────────────────────────── */
function setupThemeEditorListeners() {
    const editorForm = document.getElementById('theme-editor');
    if (!editorForm) return;
    
    // Live preview on color input changes
    editorForm.querySelectorAll('input[type="color"][data-var]').forEach(input => {
        input.addEventListener('input', handleEditorColorChange);
    });
    
    // Particle opacity slider
    const opacitySlider = document.getElementById('particleOpacitySlider');
    if (opacitySlider) {
        opacitySlider.addEventListener('input', handleParticleOpacityChange);
    }
    
    // Save theme button
    const saveBtn = document.getElementById('save-theme');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCurrentThemeFromEditor);
    }
    
    // Reset/Cancel button
    const resetBtn = document.getElementById('delete-theme');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetEditorToCurrentTheme);
    }
    
    // Export theme button
    const exportBtn = document.getElementById('export-theme');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCurrentTheme);
    }
    
    // Import theme button
    const importBtn = document.getElementById('import-theme-btn');
    const importInput = document.getElementById('import-theme');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', handleThemeImport);
    }
}

function handleEditorColorChange(e) {
    const varName = e.target.dataset.var;
    const value = e.target.value;
    
    if (varName === 'PARTICLES') {
        // Special handling for particle color
        const hsl = hexToHsl(value);
        if (typeof material !== 'undefined' && material) {
            material.color.setHSL(hsl.h / 360, hsl.s, hsl.l);
        }
    } else {
        // Apply CSS variable immediately for live preview
        document.documentElement.style.setProperty(varName, value);
    }
}

function handleParticleOpacityChange(e) {
    const opacity = parseInt(e.target.value, 10) / 100;
    if (typeof material !== 'undefined' && material) {
        material.opacity = opacity;
    }
}

function populateEditorFromCurrentTheme() {
    const theme = getThemeById(state.themeSystem.activeThemeId);
    populateEditorFromTheme(theme);
}

function populateEditorFromTheme(theme) {
    if (!theme) return;
    
    const editorForm = document.getElementById('theme-editor');
    if (!editorForm) return;
    
    // Set CSS variable inputs
    editorForm.querySelectorAll('input[type="color"][data-var]').forEach(input => {
        const varName = input.dataset.var;
        
        if (varName === 'PARTICLES') {
            // Convert particle HSL to hex for the color picker
            if (theme.particles) {
                const hex = hslToHex(theme.particles.h, theme.particles.s, theme.particles.l);
                input.value = hex;
            }
        } else if (theme.vars && theme.vars[varName]) {
            input.value = theme.vars[varName];
        }
    });
    
    // Set particle opacity slider
    const opacitySlider = document.getElementById('particleOpacitySlider');
    if (opacitySlider && theme.particles) {
        opacitySlider.value = Math.round(theme.particles.opacity * 100);
        // Trigger the slider update
        const valueDisplay = document.getElementById('particleOpacitySliderValue');
        if (valueDisplay) {
            valueDisplay.textContent = opacitySlider.value + '%';
        }
    }
    
    // Set theme name input
    const nameInput = document.getElementById('theme-name');
    if (nameInput) {
        nameInput.value = theme.isPreset ? '' : (theme.name || '');
        nameInput.placeholder = theme.isPreset ? `Custom ${theme.name}` : 'Custom Theme Name';
    }
}

function getThemeFromEditor() {
    const editorForm = document.getElementById('theme-editor');
    if (!editorForm) return null;
    
    const vars = {};
    let particleColor = { h: 220, s: 0.9, l: 0.1 };
    let particleOpacity = 0.22;
    
    editorForm.querySelectorAll('input[type="color"][data-var]').forEach(input => {
        const varName = input.dataset.var;
        const value = input.value;
        
        if (varName === 'PARTICLES') {
            particleColor = hexToHsl(value);
        } else {
            vars[varName] = value;
        }
    });
    
    const opacitySlider = document.getElementById('particleOpacitySlider');
    if (opacitySlider) {
        particleOpacity = parseInt(opacitySlider.value, 10) / 100;
    }
    
    const nameInput = document.getElementById('theme-name');
    const name = nameInput?.value?.trim() || 'Untitled Theme';
    
    return {
        name,
        vars,
        particles: {
            h: particleColor.h,
            s: particleColor.s,
            l: particleColor.l,
            opacity: particleOpacity
        }
    };
}

function saveCurrentThemeFromEditor() {
    const themeData = getThemeFromEditor();
    if (!themeData) {
        alert('Failed to read theme data from editor.');
        return;
    }
    
    if (!themeData.name || themeData.name === 'Untitled Theme') {
        const name = prompt('Enter a name for your custom theme:', 'My Custom Theme');
        if (!name) return;
        themeData.name = name.trim();
    }
    
    // Check if we're updating an existing custom theme
    const existingIndex = state.themeSystem.customThemes.findIndex(t => t.name === themeData.name);
    
    if (existingIndex >= 0) {
        if (!confirm(`A theme named "${themeData.name}" already exists. Overwrite it?`)) {
            return;
        }
        state.themeSystem.customThemes[existingIndex] = {
            ...state.themeSystem.customThemes[existingIndex],
            ...themeData,
            isPreset: false
        };
    } else {
        // Create new custom theme
        const newTheme = {
            id: generateThemeId(),
            ...themeData,
            isPreset: false,
            description: 'Custom theme'
        };
        state.themeSystem.customThemes.push(newTheme);
    }
    
    saveCustomThemes();
    
    // Apply and select the new/updated theme
    const savedTheme = state.themeSystem.customThemes.find(t => t.name === themeData.name);
    if (savedTheme) {
        selectTheme(savedTheme.id);
    }
    
    alert(`Theme "${themeData.name}" saved successfully!`);
}

function resetEditorToCurrentTheme() {
    const theme = getThemeById(state.themeSystem.activeThemeId);
    if (theme) {
        applyThemeToDOM(theme);
        populateEditorFromTheme(theme);
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   IMPORT / EXPORT
   ───────────────────────────────────────────────────────────────────────────── */
function exportCurrentTheme() {
    const themeData = getThemeFromEditor();
    if (!themeData) {
        alert('Failed to read theme data.');
        return;
    }
    
    const exportData = {
        version: 1,
        type: 'mp-theme',
        exportedAt: new Date().toISOString(),
        theme: {
            name: themeData.name || 'Exported Theme',
            vars: themeData.vars,
            particles: themeData.particles
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${(themeData.name || 'custom').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
}

async function handleThemeImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.type !== 'mp-theme' || !data.theme) {
            throw new Error('Invalid theme file format.');
        }
        
        const imported = data.theme;
        
        // Ask for name if not provided or conflicts
        let name = imported.name || 'Imported Theme';
        const existingNames = getAllThemes().map(t => t.name);
        
        if (existingNames.includes(name)) {
            name = prompt(`A theme named "${name}" already exists. Enter a new name:`, name + ' (imported)');
            if (!name) {
                e.target.value = '';
                return;
            }
        }
        
        const newTheme = {
            id: generateThemeId(),
            name: name.trim(),
            description: 'Imported theme',
            isPreset: false,
            vars: imported.vars || {},
            particles: imported.particles || DEFAULT_PARTICLE_SETTINGS
        };
        
        state.themeSystem.customThemes.push(newTheme);
        saveCustomThemes();
        selectTheme(newTheme.id);
        
        alert(`Theme "${newTheme.name}" imported successfully!`);
    } catch (err) {
        alert('Failed to import theme: ' + err.message);
    } finally {
        e.target.value = '';
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   INITIALIZE ON DOM READY
   ───────────────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initThemeSystem);

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    initThemeSystem();
}