/* ── Navbar scroll effect ───────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });

/* ── Hamburger ──────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinks.classList.toggle('open');
    });
    // Close on nav item click (mobile)
    navLinks.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navLinks.classList.remove('open');
        });
    });
}

/* ── Toast notification ─────────────────────── */
let toastTimer = null;

function showToast(msg, type = 'success', duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/* ── Shared weather state ───────────────────── */
window.weatherData = null;

/* ══════════════════════════════════════════════
   SHARED LOCATION PERSISTENCE
   Saved in sessionStorage so it survives navigating
   between pages, but clears when the browser tab/app
   is closed — "temporary for as long as the app runs".
══════════════════════════════════════════════ */
const LOCATION_STORAGE_KEY = 'smartagro_location';

function saveUserLocation(lat, lon, city) {
    try {
        const existing = getUserLocation() || {};
        const payload = {
            lat: lat != null ? lat : existing.lat,
            lon: lon != null ? lon : existing.lon,
            city: city != null ? city : existing.city,
            ts: Date.now(),
        };
        sessionStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('Could not save location:', e);
    }
}

function getUserLocation() {
    try {
        const raw = sessionStorage.getItem(LOCATION_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number') return null;
        return parsed;
    } catch (e) {
        return null;
    }
}

/* ══════════════════════════════════════════════
   SHARED NOTIFICATION / PROMPT POPUP
   Generic reusable modal for things like "grant your
   location" prompts and calamity/risk summaries.
══════════════════════════════════════════════ */
function ensureAppNotificationStyles() {
    if (document.getElementById('appNotificationStyle')) return;
    const style = document.createElement('style');
    style.id = 'appNotificationStyle';
    style.textContent = `
    .app-notif-overlay {
        position: fixed; inset: 0; z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10, 16, 12, 0.6);
        backdrop-filter: blur(3px);
        opacity: 0; pointer-events: none;
        transition: opacity 0.2s ease;
        padding: 20px;
    }
    .app-notif-overlay.visible { opacity: 1; pointer-events: all; }
    .app-notif-box {
        background: var(--bg-1, #102013);
        border: 1px solid var(--green, #4ade80);
        border-radius: 16px;
        padding: 30px 28px;
        max-width: 380px;
        width: 100%;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        animation: appNotifPopIn 0.25s ease;
    }
    @keyframes appNotifPopIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .app-notif-icon {
        width: 60px; height: 60px; margin: 0 auto 16px;
        border-radius: 50%;
        background: rgba(74,222,128,0.1);
        border: 1px solid rgba(74,222,128,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.6rem; color: var(--green, #4ade80);
    }
    .app-notif-title {
        color: var(--text-1, #f1f5f1);
        font-weight: 700; font-size: 1.05rem; margin-bottom: 8px;
        font-family: 'Syne', sans-serif;
    }
    .app-notif-msg {
        color: var(--text-3, #94a3a0);
        font-size: 0.85rem; line-height: 1.5; margin-bottom: 22px;
    }
    .app-notif-list {
        text-align: left; margin: 0 0 20px; padding: 0; list-style: none;
        display: flex; flex-direction: column; gap: 6px;
    }
    .app-notif-list li {
        font-size: 0.8rem; color: var(--text-2, #c8d6c9);
        padding: 8px 12px; background: rgba(248,113,113,0.06);
        border: 1px solid rgba(248,113,113,0.15); border-radius: 8px;
    }
    .app-notif-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    `;
    document.head.appendChild(style);
}

function showAppNotification({ icon = 'fa-location-crosshairs', title, message, listItems, primaryLabel, onPrimary, secondaryLabel, onSecondary, id } = {}) {
    ensureAppNotificationStyles();
    const overlayId = id || 'appNotificationOverlay';
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'app-notif-overlay';
        document.body.appendChild(overlay);
    }

    const listHtml = Array.isArray(listItems) && listItems.length ?
        `<ul class="app-notif-list">${listItems.map(i => `<li>${i}</li>`).join('')}</ul>`
        : '';

    overlay.innerHTML = `
      <div class="app-notif-box">
        <div class="app-notif-icon"><i class="fas ${icon}"></i></div>
        <div class="app-notif-title">${title || ''}</div>
        <div class="app-notif-msg">${message || ''}</div>
        ${listHtml}
        <div class="app-notif-btns">
          ${primaryLabel ? `<button class="btn-primary" id="${overlayId}Primary">${primaryLabel}</button>` : ''}
          ${secondaryLabel ? `<button class="btn-secondary" id="${overlayId}Secondary">${secondaryLabel}</button>` : ''}
        </div>
      </div>`;

    requestAnimationFrame(() => overlay.classList.add('visible'));

    if (primaryLabel) {
        document.getElementById(`${overlayId}Primary`).addEventListener('click', () => {
            hideAppNotification(overlayId);
            if (typeof onPrimary === 'function') onPrimary();
        });
    }
    if (secondaryLabel) {
        document.getElementById(`${overlayId}Secondary`).addEventListener('click', () => {
            hideAppNotification(overlayId);
            if (typeof onSecondary === 'function') onSecondary();
        });
    }
}

function hideAppNotification(id = 'appNotificationOverlay') {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('visible');
}

/* ══════════════════════════════════════════════
   GLOBAL API LIMIT NOTIFICATION POPUP & HANDLER
══════════════════════════════════════════════ */
window.handleApiLimitNotification = function(title, details) {
    showAppNotification({
        id: 'apiLimitModal',
        icon: 'fa-triangle-exclamation',
        title: title || '⚠️ API Limit Reached!',
        message: details || 'Token limit or daily free tier limit has been finished. Request paused to prevent automatic charges.',
        primaryLabel: 'Understood',
        onPrimary: () => {}
    });
};

window.checkApiLimitError = function(response, data) {
    if ((response && response.status === 429) || (data && data.limit_reached)) {
        const title = (data && data.error) ? data.error : '⚠️ API Token / Quota Limit Reached!';
        const details = (data && data.details) ? data.details : 'The token limit or daily request limit is finished for this free tier API. Please try again tomorrow.';
        window.handleApiLimitNotification(title, details);
        return true;
    }
    return false;
};

/* Intercept fetch responses globally */
(function() {
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const res = await origFetch.apply(this, args);
            if (res.status === 429) {
                try {
                    const clone = res.clone();
                    const data = await clone.json();
                    window.checkApiLimitError(res, data);
                } catch(e) {
                    window.checkApiLimitError(res, { error: 'API Rate Limit / Token limit reached (HTTP 429).' });
                }
            }
            return res;
        } catch(err) {
            throw err;
        }
    };
})();

/* ── Geolocation helper ─────────────────────── */
function requestLocation(callback) {
    const btn = document.getElementById('locationBtn') || document.getElementById('alertLocationBtn');
    if (btn) {
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Getting location...</span>`;
        btn.disabled = true;
    }

    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.', 'error');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-location-crosshairs"></i> <span>Get My Location</span>`;
            btn.disabled = false;
        }
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            if (btn) {
                btn.innerHTML = `<i class="fas fa-check"></i> <span>Location Found</span>`;
                btn.style.background = 'linear-gradient(135deg, #166534, #22c55e)';
            }
            showToast('📍 Location detected successfully!', 'success');
            if (typeof callback === 'function') callback(latitude, longitude);
        },
        err => {
            console.error('Geolocation error:', err);
            showToast('Location access denied. Using default location.', 'warning');
            if (btn) {
                btn.innerHTML = `<i class="fas fa-location-crosshairs"></i> <span>Get My Location</span>`;
                btn.disabled = false;
            }
            // Fallback: use Delhi, India as default
            if (typeof callback === 'function') callback(28.6139, 77.2090);
            // To this:
        }, {
            timeout: 15000, // Gives the browser 15 seconds to find a position
            enableHighAccuracy: false, // Desktop browsers fail high accuracy if they lack a GPS chip
            maximumAge: 60000 // Allows utilizing a recently cached location asset
        }
    );
}

/* ── Fetch weather from backend ─────────────── */
async function fetchWeather(lat, lon) {
    try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error('Weather API error');
        const data = await res.json();
        window.weatherData = data;
        return data;
    } catch (err) {
        console.error('fetchWeather error:', err);
        showToast('Could not load weather data.', 'error');
        return null;
    }
}

/* ── Weather icon emoji map ─────────────────── */
function getWeatherEmoji(iconCode) {
    const map = {
        '01d': '☀️',
        '01n': '🌙',
        '02d': '⛅',
        '02n': '⛅',
        '03d': '☁️',
        '03n': '☁️',
        '04d': '☁️',
        '04n': '☁️',
        '09d': '🌧️',
        '09n': '🌧️',
        '10d': '🌦️',
        '10n': '🌧️',
        '11d': '⛈️',
        '11n': '⛈️',
        '13d': '❄️',
        '13n': '❄️',
        '50d': '🌫️',
        '50n': '🌫️',
    };
    return map[iconCode] || '🌤️';
}

/* ── Format day name ────────────────────────── */
function getDayName(dateStr, short = true) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let name;
    if (d.toDateString() === today.toDateString()) name = 'Today';
    else if (d.toDateString() === tomorrow.toDateString()) name = 'Tomorrow';
    else name = short ? shortDays[d.getDay()] : days[d.getDay()];

    // Translate via whichever helper is available on this page
    if (typeof _at === 'function') return _at(name) || name;
    if (typeof dt === 'function') return dt(name) || name;
    return name;
}

/* ── Capitalize ─────────────────────────────── */
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* ── Animate counter ────────────────────────── */
function animateCounter(el, target, duration = 800, suffix = '') {
    if (!el) return;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

/* ── Intersection Observer for animations ───── */
function observeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.crop-card, .forecast-card, .timeline-item, .alert-card, .city-card').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

/* ── Ripple effect on buttons ───────────────── */
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-primary, .btn-secondary, .btn-analyze, .chart-tab, .alert-tab, .chip');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
    position:absolute; border-radius:50%;
    width:${size}px; height:${size}px;
    left:${e.clientX - rect.left - size/2}px;
    top:${e.clientY - rect.top - size/2}px;
    background:rgba(255,255,255,0.18);
    transform:scale(0); animation:ripple 0.55s linear;
    pointer-events:none;
  `;
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

// Ripple keyframe injection
const styleTag = document.createElement('style');
styleTag.textContent = `@keyframes ripple { to { transform: scale(2.5); opacity: 0; } }`;
document.head.appendChild(styleTag);

/* ── Update alert badge in navbar ───────────── */
function updateAlertBadge(count) {
    const badge = document.getElementById('alertBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

/* ── On page load: restore badge from session ── */
document.addEventListener('DOMContentLoaded', () => {
    const saved = sessionStorage.getItem('alert_count');
    if (saved) updateAlertBadge(parseInt(saved));
    observeAnimations();

    // ── Restore saved language and notify diagnose.js ──
    const savedLang = localStorage.getItem('smartagro_lang') || 'en';
    window.currentLang = savedLang;
    if (savedLang !== 'en') {
        document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: savedLang } }));
    }

    // ── Close lang dropdown on outside tap (mobile) ──
    document.addEventListener('click', e => {
        const sel = document.querySelector('.lang-selector');
        if (sel && !sel.contains(e.target)) {
            sel.classList.remove('open');
        }
    });
    /* ── Day / Night Theme Toggle ───────────────────────── */
    (function initTheme() {
        const btn = document.getElementById('themeToggle');
        const icon = document.getElementById('themeIcon');
        const saved = localStorage.getItem('smartagro_theme');

        function applyTheme(mode) {
            if (mode === 'light') {
                document.body.classList.add('light-theme');
                if (icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            } else {
                document.body.classList.remove('light-theme');
                if (icon) {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
            localStorage.setItem('smartagro_theme', mode);
        }

        // Restore saved preference on load
        applyTheme(saved === 'light' ? 'light' : 'dark');

        if (btn) {
            btn.addEventListener('click', () => {
                const isLight = document.body.classList.contains('light-theme');
                applyTheme(isLight ? 'dark' : 'light');
            });
        }
    })();
});
/* ── PWA Service Worker Registration ───────── */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/service-worker.js')
            .then(reg => console.log('SmartAgro SW registered:', reg.scope))
            .catch(err => console.error('SW registration failed:', err));
    });
}

/* ══════════════════════════════════════════════
   INSTALL APP — works on desktop & mobile,
   available from the navbar on every page.
══════════════════════════════════════════════ */
let deferredInstallPrompt = null;

function isAppStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true; // iOS Safari flag
}

function isIosDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function ensureInstallModalStyles() {
    // Styles live in main.css (.install-modal-*); nothing to inject here,
    // this hook exists in case the page loads main.js before main.css.
}

function showInstallModal({ icon, title, steps, note }) {
    let overlay = document.getElementById('installModalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'installModalOverlay';
        overlay.className = 'install-modal-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) hideInstallModal(); });
    }
    overlay.innerHTML = `
      <div class="install-modal-box">
        <div class="install-modal-icon"><i class="fas ${icon}"></i></div>
        <h3>${title}</h3>
        <ul class="install-modal-steps">
          ${steps.map((s, i) => `<li><span class="ims-num">${i + 1}</span><span>${s}</span></li>`).join('')}
        </ul>
        ${note ? `<p class="install-modal-note">${note}</p>` : ''}
        <button class="install-modal-close" onclick="hideInstallModal()">Got it</button>
      </div>`;
    requestAnimationFrame(() => overlay.classList.add('visible'));
}

function hideInstallModal() {
    const overlay = document.getElementById('installModalOverlay');
    if (overlay) overlay.classList.remove('visible');
}

// Chrome/Edge/Android fire this when the app is installable.
// We stash the event so it can be triggered later from our own button
// instead of the browser's own mini-infobar.
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    showToast('✅ SmartAgro installed on your device!', 'success');
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
});

function setupInstallButton() {
    const btn = document.getElementById('installBtn');
    if (!btn) return;

    // Already running as an installed app — nothing to offer.
    if (isAppStandalone()) {
        btn.style.display = 'none';
        return;
    }

    btn.addEventListener('click', async () => {
        // Case 1: browser has a native install prompt ready (Chrome/Edge,
        // desktop or Android).
        if (deferredInstallPrompt) {
            btn.disabled = true;
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome !== 'accepted') {
                showToast('Installation cancelled.', 'warning');
            }
            deferredInstallPrompt = null;
            btn.disabled = false;
            return;
        }

        // Case 2: iOS Safari has no install prompt API — show manual steps.
        if (isIosDevice()) {
            showInstallModal({
                icon: 'fa-share-from-square',
                title: 'Install SmartAgro on iPhone/iPad',
                steps: [
                    'Tap the <strong>Share</strong> icon in Safari\'s toolbar.',
                    'Scroll down and tap <strong>Add to Home Screen</strong>.',
                    'Tap <strong>Add</strong> in the top-right corner.'
                ],
                note: 'SmartAgro will then open full-screen from your Home Screen, just like a native app.'
            });
            return;
        }

        // Case 3: Desktop/Android browser without beforeinstallprompt
        // support yet (e.g. Firefox), or the prompt hasn't fired.
        showInstallModal({
            icon: 'fa-circle-info',
            title: 'Install SmartAgro',
            steps: [
                'Open this site in <strong>Chrome</strong> or <strong>Edge</strong> for one-tap install.',
                'Or use your browser\'s menu (⋮ or Share) and look for <strong>Install App</strong> / <strong>Add to Home Screen</strong>.'
            ],
            note: 'Install support depends on your browser.'
        });
    });
}

document.addEventListener('DOMContentLoaded', setupInstallButton);