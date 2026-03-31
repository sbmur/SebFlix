/* ============================================================
   SebFlix – Application Core
   ============================================================ */

// ────────────────────────── Config ──────────────────────────
const CFG = {
  TMDB_KEY: 'eefb28d01dec1944507a24e4948c73cb',
  TMDB: 'https://api.themoviedb.org/3',
  IMG: 'https://image.tmdb.org/t/p',
  VK: 'https://www.vidking.net/embed',
  POSTER: { sm: 'w342', md: 'w500', lg: 'w780' },
  BACK: { sm: 'w780', md: 'w1280', lg: 'original' },
  PROFILE: 'w185',
  CACHE_MS: 30 * 60 * 1000,
  DEFAULTS: {
    theme: 'dark', playerColor: 'f97316', autoPlay: true,
    nextEpisode: true, episodeSelector: true, navLayout: 'sidebar-left',
    sfxEnabled: false, sfxPack: 'asmr', sfxVol: 0.5
  },
  NAV_LAYOUTS: [
    { id: 'sidebar-left', n: 'Sidebar Left' },
    { id: 'sidebar-right', n: 'Sidebar Right' },
    { id: 'top', n: 'Top Header' },
    { id: 'bottom', n: 'Bottom Dock' }
  ],
  SFX_PACKS: [
    { id: 'thock', n: 'Thoccy Keeb' },
    { id: 'asmr', n: 'ASMR Tingly' },
    { id: 'retro', n: 'Retro 8-Bit' },
    { id: 'minimal', n: 'Minimalist' }
  ]
};

/* ── SFX Engine (Web Audio API) ── */
class SFX {
  constructor() {
    this.enabled = false;
    this.vol = 0.5;
    this.pack = 'thock';
    this._ctx = null;
  }
  _ctx_() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  }
  _osc(freq, dur, type = 'sine', baseVol = 0.12) {
    if (!this.enabled || this.vol <= 0) return;
    const ctx = this._ctx_();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(baseVol * this.vol * 2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  }
  _noise(dur, baseVol = 0.04) {
    if (!this.enabled || this.vol <= 0) return;
    const ctx = this._ctx_();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(baseVol * this.vol * 2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass'; filt.frequency.value = 3000;
    src.connect(filt); filt.connect(g); g.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + dur);
  }
  click() {
    if (this.pack === 'retro') { this._osc(1200, 0.05, 'square', 0.06); return; }
    if (this.pack === 'minimal') { this._osc(2000, 0.02, 'sine', 0.04); return; }
    if (this.pack === 'thock') { this._osc(180, 0.03, 'triangle', 0.1); this._noise(0.01, 0.015); return; }
    // asmr
    this._osc(3200, 0.03, 'sine', 0.08);
    this._noise(0.015, 0.02);
  }
  type() {
    if (this.pack === 'retro') { this._osc(400 + Math.random() * 200, 0.04, 'square', 0.06); return; }
    if (this.pack === 'minimal') { this._osc(800 + Math.random() * 200, 0.02, 'sine', 0.03); return; }
    if (this.pack === 'thock') {
      const f = 100 + Math.random() * 60;
      this._osc(f, 0.05, 'triangle', 0.15);
      this._noise(0.02, 0.03);
      return;
    }
    // asmr
    const f = 1800 + Math.random() * 2400;
    this._osc(f, 0.03, 'square', 0.04);
    this._noise(0.02, 0.05);
  }
  toggle() {
    if (this.pack === 'retro') { this._osc(600, 0.08, 'square', 0.08); setTimeout(() => this._osc(900, 0.08, 'square', 0.08), 80); return; }
    if (this.pack === 'minimal') { this._osc(1200, 0.04, 'sine', 0.05); return; }
    if (this.pack === 'thock') { this._osc(200, 0.06, 'triangle', 0.1); setTimeout(() => this._osc(300, 0.06, 'triangle', 0.1), 60); return; }
    // asmr
    this._osc(880, 0.06, 'sine', 0.1);
    setTimeout(() => this._osc(1320, 0.06, 'sine', 0.08), 50);
  }
  whoosh() {
    if (this.pack === 'retro') { this._osc(150, 0.1, 'sawtooth', 0.05); return; }
    // Clean whoosh, zero noise to avoid snare effect
    this._osc(320, 0.18, 'sine', 0.03);
    this._osc(540, 0.12, 'sine', 0.015);
  }
  entry() {
    if (!this.enabled || this.vol <= 0) return;
    if (this.pack === 'retro') {
      this._osc(400, 0.1, 'square', 0.08);
      setTimeout(() => this._osc(600, 0.1, 'square', 0.08), 50);
      return;
    }
    if (this.pack === 'minimal') {
      this._osc(1200, 0.08, 'sine', 0.05);
      setTimeout(() => this._osc(1600, 0.06, 'sine', 0.03), 40);
      return;
    }
    if (this.pack === 'thock') {
      // Warm, welcoming thock-based entry
      this._osc(180, 0.08, 'triangle', 0.12);
      this._noise(0.025, 0.02);
      setTimeout(() => this._osc(280, 0.06, 'triangle', 0.08), 60);
      setTimeout(() => this._osc(360, 0.04, 'triangle', 0.06), 120);
      return;
    }
    // ASMR: Gentle, welcoming chime progression
    this._osc(523, 0.15, 'sine', 0.04); // C5
    setTimeout(() => this._osc(659, 0.12, 'sine', 0.03), 80); // E5
    setTimeout(() => this._osc(784, 0.10, 'sine', 0.025), 160); // G5
    setTimeout(() => this._osc(1047, 0.08, 'sine', 0.02), 240); // C6 (higher octave)
    // Subtle padding
    setTimeout(() => this._noise(0.03, 0.008), 100);
    setTimeout(() => this._noise(0.025, 0.006), 200);
  }
  nav() {
    if (this.pack === 'retro') { this._osc(1600, 0.06, 'square', 0.05); return; }
    if (this.pack === 'minimal') { this._osc(2400, 0.03, 'sine', 0.04); return; }
    if (this.pack === 'thock') { this._osc(240, 0.03, 'triangle', 0.1); this._noise(0.01, 0.015); return; }
    // asmr
    this._osc(2400, 0.04, 'triangle', 0.06);
    this._noise(0.02, 0.015);
  }
}
const sfx = new SFX();

const THEMES = [
  { id: 'dark', n: 'Default Dark Theme' }, { id: 'light', n: 'Default Light Theme' }, { id: 'glass', n: 'Glass Mode' },
  { id: 'netflix', n: 'Netflix Red' },
  { id: 'disney', n: 'Disney Blue' }, { id: 'binge', n: 'Binge Green' }, { id: 'prime', n: 'Amazon Prime' },
  { id: 'hbo', n: 'HBO Max' }, { id: 'hulu', n: 'Hulu Neon' }, { id: 'paramount', n: 'Paramount Plus' },
  { id: 'appletv', n: 'Apple TV' }, { id: 'peacock', n: 'Peacock Glow' }, { id: 'youtube', n: 'YouTube Play' },
  { id: 'twitch', n: 'Twitch Purple' }, { id: 'spotify', n: 'Spotify Green' }, { id: 'discord', n: 'Discord Blurple' },
  { id: 'steam', n: 'Steam Blue' }, { id: 'xbox', n: 'Xbox Green' }, { id: 'playstation', n: 'PS Blue' },
  { id: 'matrix', n: 'The Matrix' }, { id: 'cyberpunk', n: 'Night City' }, { id: 'dune', n: 'Arrakis Sand' },
  { id: 'bladerunner', n: 'Neon Noir' }, { id: 'interstellar', n: 'Event Horizon' }, { id: 'joker', n: 'The Joker' },
  { id: 'filmnoir', n: 'Noir Edition' }, { id: 'forest', n: 'Emerald Forest' }, { id: 'ocean', n: 'Abyssal Blue' },
  { id: 'sakura', n: 'Sakura Bloom' }, { id: 'sunset', n: 'Pacific Sunset' }, { id: 'desert', n: 'Sahara Dust' },
  { id: 'arctic', n: 'Arctic Ice' }, { id: 'deepsea', n: 'Midnight Trench' }, { id: 'obsidian', n: 'Obsidian Black' },
  { id: 'slate', n: 'Slate Graphite' }, { id: 'ivory', n: 'Warm Ivory' }, { id: 'carbon', n: 'Carbon Fiber' },
  { id: 'gold', n: 'Royal Gold' }, { id: 'ruby', n: 'Ruby Crystal' }, { id: 'amethyst', n: 'Amethyst Geode' },
  { id: 'sapphire', n: 'Blue Sapphire' }, { id: 'amber', n: 'Burnished Amber' }, { id: 'mint', n: 'Cool Mint' },
  { id: 'midnight', n: 'Midnight Navy' }, { id: 'aurora', n: 'Aurora Borealis' }, { id: 'volcanic', n: 'Magma Flow' },
  { id: 'royal', n: 'Royal Purple' }, { id: 'crimson', n: 'Deep Crimson' }, { id: 'lavender', n: 'Soft Lavender' },
  { id: 'espresso', n: 'Espresso Bar' }, { id: 'teal', n: 'Teal Ocean' }, { id: 'mubi', n: 'Mubi Minimal' }
];

let COLLECTIONS = [];

const SILHOUETTE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
const PFP_COLORS = ['#E50914', '#54B9FF', '#B92B27', '#E5B008', '#22C55E', '#9333EA', '#F97316', '#06B6D4'];

const PLAY_SVG = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
const X_SVG = `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const STAR_SVG = `★`;

// ────────────────────────── Tiny cache ──────────────────────
class Cache {
  constructor(ttl) { this.m = new Map(); this.ttl = ttl }
  get(k) { const e = this.m.get(k); if (!e) return null; if (Date.now() - e.t > this.ttl) { this.m.delete(k); return null } return e.d }
  set(k, d) { this.m.set(k, { d, t: Date.now() }) }
  clear() { this.m.clear() }
}

// ────────────────────────── TMDB API ────────────────────────
class TMDB {
  constructor(key) { this.key = key; this.cache = new Cache(CFG.CACHE_MS) }

  async _get(ep, params = {}) {
    const u = new URL(`${CFG.TMDB}${ep}`);
    u.searchParams.set('api_key', this.key);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));

    // Kids Mode filter: Certification G/PG for movies, TV-Y/TV-G/TV-PG for TV
    if (this.isKids) {
      if (ep.includes('/discover/') || ep.includes('/trending/') || ep.includes('/popular') || ep.includes('/top_rated')) {
        const isTV = ep.includes('/tv/') || (ep.includes('/discover/tv'));
        u.searchParams.set('certification_country', 'US');
        u.searchParams.set('certification.lte', isTV ? 'TV-PG' : 'PG');
      }
      u.searchParams.set('include_adult', 'false');
    } else {
      u.searchParams.set('include_adult', 'true');
    }

    const ck = u.toString();
    let d = this.cache.get(ck);
    if (d) return d;
    const r = await fetch(u);
    if (!r.ok) throw new Error(`TMDB ${r.status}`);
    d = await r.json();

    // Extra strict filtering for Kids Mode if it's a list response
    if (this.isKids && d.results) {
      const matureGenres = [27, 53, 80, 10752, 9648]; // Horror, Thriller, Crime, War, Mystery
      d.results = d.results.filter(it => {
        if (it.adult) return false;

        // Exclude mature genres
        const genres = it.genre_ids || [];
        if (genres.some(g => matureGenres.includes(g))) return false;

        // Exclude Unrated / Obscure content (Heuristic)
        const hasDate = !!(it.release_date || it.first_air_date);
        const votes = it.vote_count || 0;
        const score = it.vote_average || 0;

        // We require a release date, at least some votes, and a non-zero score
        if (!hasDate || votes < 50 || score === 0) return false;

        return true;
      });
    }

    this.cache.set(ck, d); return d;
  }

  trending(type = 'all', tw = 'week', page = 1) {
    if (this.isKids) return this.discover(type === 'all' ? 'movie' : type, { page, sort_by: 'popularity.desc' });
    return this._get(`/trending/${type}/${tw}`, { page });
  }
  popular(type = 'movie', page = 1) {
    if (this.isKids) return this.discover(type, { page, sort_by: 'popularity.desc' });
    return this._get(`/${type}/popular`, { page });
  }
  topRated(type = 'movie', page = 1) {
    if (this.isKids) return this.discover(type, { page, sort_by: 'vote_average.desc', 'vote_count.gte': 100 });
    return this._get(`/${type}/top_rated`, { page });
  }
  nowPlaying(p = 1) { return this._get('/movie/now_playing', { page: p }) }
  onTheAir(p = 1) { return this._get('/tv/on_the_air', { page: p }) }
  searchMovie(q, p = 1) { return this._get('/search/movie', { query: q, page: p }) }
  searchTV(q, p = 1) { return this._get('/search/tv', { query: q, page: p }) }
  search(q, p = 1) { return this._get('/search/multi', { query: q, page: p }) }
  details(type, id) { return this._get(`/${type}/${id}`, { append_to_response: 'credits,videos,similar,recommendations,release_dates,content_ratings' }) }
  season(tvId, sn) { return this._get(`/tv/${tvId}/season/${sn}`) }
  discover(type, params) { return this._get(`/discover/${type}`, params) }
  genres(type) { return this._get(`/genre/${type}/list`) }
  collection(id) { return this._get(`/collection/${id}`, { append_to_response: 'images' }) }
  searchPerson(q, p = 1) { return this._get('/search/person', { query: q, page: p }) }
  personDetails(id) { return this._get(`/person/${id}`, { append_to_response: 'combined_credits,images' }) }
  moviesByGenre(genreId, p = 1) { return this._get('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', page: p }) }
  tvByGenre(genreId, p = 1) { return this._get('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc', page: p }) }
}

// ────────────────────────── Storage ─────────────────────────
class Store {
  constructor() { this.profileId = 'default'; }
  setProfile(id) { this.profileId = id; }
  _file(name) { return `profile_${this.profileId}_${name}`; }

  async r(f) { return await window.electronAPI.storage.read(f) }
  async w(f, d) { return await window.electronAPI.storage.write(f, d) }

  async profiles() { return (await this.r('profiles.json')) || [] }
  async saveProfiles(l) { return this.w('profiles.json', l) }

  async watchlist() { return (await this.r(this._file('watchlist.json'))) || [] }
  async saveWL(l) { return this.w(this._file('watchlist.json'), l) }
  async history() { return (await this.r(this._file('history.json'))) || [] }
  async saveHist(h) { return this.w(this._file('history.json'), h) }
  async progress() { return (await this.r(this._file('progress.json'))) || {} }
  async saveProg(p) { return this.w(this._file('progress.json'), p) }
  async settings() { return { ...CFG.DEFAULTS, ...(await this.r(this._file('settings.json'))) || {} } }
  async saveSettings(s) { return this.w(this._file('settings.json'), s) }
  async playlists() { return (await this.r(this._file('playlists.json'))) || [] }
  async savePlaylists(l) { return this.w(this._file('playlists.json'), l) }
  async followedPlaylists() { return (await this.r(this._file('followed_playlists.json'))) || [] }
  async saveFollowed(l) { return this.w(this._file('followed_playlists.json'), l) }
  async viewingStats() { return (await this.r(this._file('viewing_stats.json'))) || { totalWatchTimeSec: 0, moviesWatched: 0, showsWatched: 0, genreCounts: {}, monthly: {} } }
  async saveViewingStats(s) { return this.w(this._file('viewing_stats.json'), s) }
}

// ────────────────────────── Helpers ─────────────────────────
const poster = (p, s = 'md') => p ? `${CFG.IMG}/${CFG.POSTER[s]}${p}` : noPoster();
const backdrop = (p, s = 'lg') => p ? `${CFG.IMG}/${CFG.BACK[s]}${p}` : '';
const profile = (p) => p ? `${CFG.IMG}/${CFG.PROFILE}${p}` : noPoster();
function noPoster() { return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="%2320203a"/><text x="100" y="155" text-anchor="middle" fill="%23555" font-size="14" font-family="sans-serif">No Image</text></svg>')}` }
const year = d => d ? new Date(d).getFullYear() : '';
const runtime = m => m ? `${Math.floor(m / 60)}h ${m % 60}m` : '';
const rating = v => v ? v.toFixed(1) : 'N/A';
const mediaType = item => item.media_type || (item.first_air_date ? 'tv' : 'movie');
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } };
const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML };

/** Local wall-clock time label for "Finishes at …" */
function formatFinishesAtTime(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Format seconds as m:ss or h:mm:ss for progress labels */
function formatSecsClock(sec) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// ────────────────────────── App ─────────────────────────────
class SebFlix {
  constructor() {
    this.page = 'home'; this.store = new Store(); this.api = new TMDB(CFG.TMDB_KEY);
    this.settings = {}; this.wl = []; this.hist = []; this.prog = {};
    this._detailFinishInterval = null;
    this._cwFinishTimer = null;
    this._playerForceAutoplay = false;
    this.genres = { movie: [], tv: [] }; this.heroTimer = null;
    this.profiles = []; this.activeProfile = null;
    this._lastDetailPoster = '';
    this.$ = id => document.getElementById(id);
    this._colSearchQuery = '';
  }

  /* ── Initialise ── */
  async init() {
    this.profiles = await this.store.profiles();

    this._titlebar();
    this._sidebar();
    this._keys();
    this._globalSFX();
    this._playerEvents();
    this._modalEvents();
    this._profileEditorEvents();

    window.electronAPI.onWindowState?.(maximized => {
      this.$('tb-max')?.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize');
    });

    window.electronAPI.onFullScreen?.(isFull => {
      document.body.classList.toggle('fullscreen', isFull);
    });

    this.$('player-iframe').addEventListener('load', () => {
      this.$('player-loader').classList.add('hidden');
      try { window.electronAPI.player.injectCustomScrollbars(); } catch (e) { /* noop */ }
      if (this._playerForceAutoplay) {
        const kick = () => {
          try {
            window.electronAPI.player.injectProgressTracker();
            window.electronAPI.player.forcePlay();
          } catch (e) { /* noop */ }
        };
        kick();
        [120, 400, 1000, 2200, 5000].forEach(ms => setTimeout(kick, ms));
      }
    });

    if (!this.profiles.length) {
      this._openProfileEditor(null); // First launch, force create profile
    } else {
      await this._loadCollections();
      this._renderProfileSelection();
    }
  }

  async _loadCollections() {
    try {
      const data = await this.store.r('collections_final.json');
      if (data && Array.isArray(data)) {
        COLLECTIONS = data;
        console.log(`[SebFlix] Loaded ${COLLECTIONS.length} collections`);
      }
    } catch (e) { console.error('Failed to load collections', e); }
  }

  async _selectProfile(profile) {
    if (this.$('profile-overlay').classList.contains('manage-mode')) {
      await this._openProfileEditor(profile);
      return;
    }
    this.activeProfile = profile;
    this.api.isKids = profile.isKids || false;
    this.store.setProfile(profile.id);
    this.settings = await this.store.settings();
    this.wl = await this.store.watchlist();
    this.hist = await this.store.history();
    this.prog = await this.store.progress();

    document.body.dataset.theme = this.settings.theme;
    this._updateAccent();
    this._applyNavLayout(this.settings.navLayout || CFG.DEFAULTS.navLayout);
    sfx.enabled = !!this.settings.sfxEnabled;
    sfx.vol = this.settings.sfxVol ?? 0.5;
    sfx.pack = this.settings.sfxPack || CFG.DEFAULTS.sfxPack;

    if (sfx.enabled) sfx.entry();

    this.$('profile-overlay').classList.remove('visible');
    this.$('current-profile-mini').innerHTML = `
      <div class="profile-mini-pfp-wrap" style="background:${profile.pfpColor || '#444'}">${SILHOUETTE_SVG}</div>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0">
        <span class="profile-mini-name">${esc(profile.name)}</span>
        ${profile.isKids ? '<span style="font-size:9px;color:var(--accent);font-weight:700">KIDS</span>' : ''}
      </div>
    `;

    await this._loadGenres();
    this.navigate('home');
    this._initBackdrops();
  }

  async _initBackdrops() {
    // Background task to populate backdrops for collections
    // We only do this for the top ones initially to avoid API spam
    const top = COLLECTIONS.slice(0, 50);
    for (const col of top) {
      if (col.backdrop) continue;
      try {
        const firstMovieId = col.movies?.[0]?.id;
        if (firstMovieId) {
          const d = await this.api.details('movie', firstMovieId);
          if (d.backdrop_path) {
            col.backdrop = d.backdrop_path;
            const el = this.$(`col-bg-${col.id}`);
            if (el) {
              let img = el.querySelector('img.col-backdrop-img');
              if (!img) {
                img = document.createElement('img');
                img.className = 'col-backdrop-img';
                img.loading = 'lazy';
                el.appendChild(img);
              }
              img.src = `${CFG.IMG}/w780${d.backdrop_path}`;
              el.classList.add('has-bg');
            }
          }
        }
      } catch (e) { }
      // Small delay between fetches
      await new Promise(r => setTimeout(r, 100));
    }
  }

  _renderProfileSelection() {
    this.$('profile-overlay').classList.add('visible');
    const list = this.$('profile-list');
    let html = this.profiles.map(p => `
      <div class="profile-item" data-id="${p.id}">
        <div class="profile-pfp-wrap" style="background:${p.pfpColor || '#444'}">${SILHOUETTE_SVG}</div>
        <div class="profile-name">${esc(p.name)}</div>
      </div>
    `).join('');

    if (this.profiles.length < 5) {
      html += `
        <div class="profile-item add-profile-item" id="add-profile-btn">
          <div class="profile-pfp-wrap"></div>
          <div class="profile-name">Add Profile</div>
        </div>
      `;
    }

    list.innerHTML = html;

    list.querySelectorAll('.profile-item').forEach(el => {
      el.addEventListener('click', () => {
        if (el.id === 'add-profile-btn') {
          this._openProfileEditor(null);
          return;
        }
        const p = this.profiles.find(x => x.id === el.dataset.id);
        this._selectProfile(p);
      });
    });

    this.$('current-profile-mini').onclick = () => {
      this.$('profile-overlay').classList.remove('manage-mode');
      this.$('profile-overlay').classList.add('visible');
    };

    this.$('manage-profiles').onclick = () => {
      this.$('profile-overlay').classList.toggle('manage-mode');
    };
  }

  _profileEditorEvents() {
    const ACCENT_COLORS = [
      { n: 'Violet', c: '8b5cf6' }, { n: 'Red', c: 'ef4444' }, { n: 'Green', c: '22c55e' }, { n: 'Blue', c: '3b82f6' }, { n: 'Orange', c: 'f97316' },
      { n: 'Pink', c: 'ec4899' }, { n: 'Teal', c: '14b8a6' }, { n: 'Yellow', c: 'eab308' }, { n: 'Purple', c: 'a855f7' }, { n: 'Slate', c: '475569' }
    ];

    // Populate PFP colors
    this.$('pe-pfp-list').innerHTML = PFP_COLORS.map(color => `
      <div class="pe-pfp-item" data-color="${color}" style="background:${color}">${SILHOUETTE_SVG}</div>
    `).join('');

    // Populate theme chips in wizard step 4
    this.$('pe-theme-grid').innerHTML = THEMES.map(t => `
      <div class="theme-chip" data-theme="${t.id}">${t.n}</div>
    `).join('') + `
      <div class="theme-chip custom-theme-option" id="pe-custom-theme-btn">
        <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right:6px">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
        </svg>
        Custom
      </div>
    `;

    // Populate accent color chips in wizard step 4
    this.$('pe-color-grid').innerHTML = ACCENT_COLORS.map(col => `
      <div class="color-option" data-color="${col.c}">
        <div class="color-swatch" style="background:#${col.c}">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
        </div>
        <div class="color-name">${col.n}</div>
      </div>
    `).join('') + `
      <div class="color-option custom-color-option" id="pe-custom-color-btn">
        <div class="color-swatch" id="pe-custom-color-swatch" style="background:#ffffff">
          <input type="color" id="pe-custom-color-input" style="opacity:0;position:absolute;inset:0;cursor:pointer" value="#f97316" />
          <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/></svg>
        </div>
        <div class="color-name">Custom</div>
      </div>
    `;

    // Populate nav layout chips in wizard step 5
    this.$('pe-nav-grid').innerHTML = CFG.NAV_LAYOUTS.map(l => `
      <div class="theme-chip" data-nav="${l.id}">${l.n}</div>
    `).join('');

    // Populate SFX pack chips in wizard step 3
    this.$('pe-sfx-pack-grid').innerHTML = CFG.SFX_PACKS.map(p => `
      <div class="theme-chip" data-pack="${p.id}">${p.n}</div>
    `).join('');

    // Wizard state
    this._wizardStep = 0;
    this._wizardData = {};
    const TOTAL_STEPS = 5;

    const goToStep = (step) => {
      this._wizardStep = step;
      const steps = this.$('pe-steps-wrap').querySelectorAll('.pe-step');
      steps.forEach((s, i) => {
        s.classList.toggle('active', i === step);
      });
      this.$('pe-steps-indicator').querySelectorAll('.pe-step-dot').forEach((d, i) => {
        d.classList.toggle('active', i === step);
        d.classList.toggle('completed', i < step);
      });

      // Button logic
      this.$('pe-back').style.display = step === 0 ? (this.profiles.length ? 'block' : 'none') : 'block';
      this.$('pe-back').textContent = step === 0 ? 'Cancel' : 'Back';
      this.$('pe-next').textContent = step === TOTAL_STEPS - 1 ? (this._editingProfileId ? 'Save' : 'Finish') : 'Next';
      this.$('pe-delete').style.display = (step === 0 && this._editingProfileId && this.profiles.length > 1) ? 'block' : 'none';

      // Disable Next if no name entered on step 0
      this._updateNextEnabled();
    };

    this._updateNextEnabled = () => {
      const nameVal = this.$('pe-name').value.trim();
      this.$('pe-next').disabled = (this._wizardStep === 0 && !nameVal);
      this.$('pe-next').style.opacity = this.$('pe-next').disabled ? '0.4' : '1';
    };

    // PFP selection
    this.$('pe-pfp-list').querySelectorAll('.pe-pfp-item').forEach(el => {
      el.onclick = () => {
        this.$('pe-pfp-list').querySelectorAll('.pe-pfp-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        this._wizardData.pfpColor = el.dataset.color;
      };
    });

    // Kids toggle
    this.$('pe-kids-btn').onclick = () => {
      this.$('pe-kids-toggle').classList.toggle('on');
      this._wizardData.isKids = this.$('pe-kids-toggle').classList.contains('on');
    };

    // SFX toggle
    this.$('pe-sfx-wiz-btn').onclick = () => {
      this.$('pe-sfx-wiz-toggle').classList.toggle('on');
      const isOn = this.$('pe-sfx-wiz-toggle').classList.contains('on');
      this._wizardData.sfxEnabled = isOn;
      sfx.enabled = isOn; // preview
      const opts = this.$('pe-sfx-options');
      if (opts) {
        opts.style.opacity = isOn ? '1' : '0.5';
        opts.style.pointerEvents = isOn ? 'auto' : 'none';
      }
    };

    // SFX Pack selection in wizard
    this.$('pe-sfx-pack-grid').querySelectorAll('.theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.$('pe-sfx-pack-grid').querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        this._wizardData.sfxPack = chip.dataset.pack;
        sfx.pack = chip.dataset.pack; // preview
        sfx.click();
      });
    });

    // Theme selection in wizard
    this.$('pe-theme-grid').querySelectorAll('.theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.$('pe-theme-grid').querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        this._wizardData.theme = chip.dataset.theme;
      });
    });

    // Accent color selection in wizard
    this.$('pe-color-grid').querySelectorAll('.color-option:not(.custom-color-option)').forEach(opt => {
      opt.addEventListener('click', () => {
        this.$('pe-color-grid').querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
        opt.classList.add('active');
        this._wizardData.playerColor = opt.dataset.color;
        this.$('pe-color-warning').classList.add('hidden');
      });
    });

    const peCustomInp = this.$('pe-custom-color-input');
    const peCustomBtn = this.$('pe-custom-color-btn');
    const peCustomSwatch = this.$('pe-custom-color-swatch');

    peCustomInp?.addEventListener('input', (e) => {
      const col = e.target.value;
      this.$('pe-color-grid').querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
      peCustomBtn.classList.add('active');
      peCustomSwatch.style.background = col;
      this._wizardData.playerColor = col;
      
      const isExtreme = this._isColorExtreme(col);
      this.$('pe-color-warning').classList.toggle('hidden', !isExtreme);
    });

    peCustomBtn?.addEventListener('click', () => peCustomInp.click());

    // Custom theme button handler
    this.$('pe-custom-theme-btn')?.addEventListener('click', () => {
      this._wizardData.theme = 'custom';
      this.$('pe-theme-grid').querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
      this.$('pe-custom-theme-btn').classList.add('active');
      this._openCustomThemeEditor();
    });

    // Nav layout selection in wizard
    this.$('pe-nav-grid').querySelectorAll('.theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.$('pe-nav-grid').querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        this._wizardData.navLayout = chip.dataset.nav;
      });
    });

    // Name input validation
    this.$('pe-name').addEventListener('input', () => {
      this.$('pe-name-error').classList.add('hidden');
      this._updateNextEnabled();
    });

    // Back button
    this.$('pe-back').onclick = () => {
      if (this._wizardStep === 0) {
        if (!this.profiles.length) return;
        this.$('pe-overlay').classList.remove('visible');
      } else {
        goToStep(this._wizardStep - 1);
      }
    };

    // Next / Finish button
    this.$('pe-next').onclick = async () => {
      const name = this.$('pe-name').value.trim();
      const isDuplicate = this.profiles.some(p => p.id !== this._editingProfileId && p.name.toLowerCase() === name.toLowerCase());

      if (this._wizardStep === 0) {
        if (!name) return;
        if (isDuplicate) {
          this.$('pe-name-error').classList.remove('hidden');
          sfx.whoosh();
          return;
        }
      }

      if (this._wizardStep < TOTAL_STEPS - 1) {
        goToStep(this._wizardStep + 1);
        return;
      }

      // Final step: save profile
      if (!name || isDuplicate) { goToStep(0); return; }
      const pfpColor = this._wizardData.pfpColor || PFP_COLORS[0];
      const isKids = !!this._wizardData.isKids;

      if (this._editingProfileId) {
        const p = this.profiles.find(x => x.id === this._editingProfileId);
        p.name = name;
        p.pfpColor = pfpColor;
        p.isKids = isKids;
      } else {
        this.profiles.push({ id: Date.now().toString(), name, pfpColor, isKids });
      }

      await this.store.saveProfiles(this.profiles);

      // Save per-profile settings (theme, accent, nav layout)
      const profileId = this._editingProfileId || this.profiles[this.profiles.length - 1].id;
      this.store.setProfile(profileId);
      const existingSettings = await this.store.settings();
      if (this._wizardData.theme) existingSettings.theme = this._wizardData.theme;
      if (this._wizardData.playerColor) existingSettings.playerColor = this._wizardData.playerColor;
      if (this._wizardData.navLayout) existingSettings.navLayout = this._wizardData.navLayout;
      if (this._wizardData.sfxEnabled !== undefined) existingSettings.sfxEnabled = this._wizardData.sfxEnabled;
      if (this._wizardData.sfxPack) existingSettings.sfxPack = this._wizardData.sfxPack;
      await this.store.saveSettings(existingSettings);

      this.$('pe-overlay').classList.remove('visible');
      this.$('profile-overlay').classList.remove('manage-mode');
      await this._loadCollections();
      this._renderProfileSelection();
    };

    // Delete button
    this.$('pe-delete').onclick = async () => {
      if (!this._editingProfileId || this.profiles.length <= 1) return;
      this.profiles = this.profiles.filter(x => x.id !== this._editingProfileId);
      await this.store.saveProfiles(this.profiles);
      this.$('pe-overlay').classList.remove('visible');
      this._renderProfileSelection();
    };

    this._goToWizardStep = goToStep;
  }

  async _openProfileEditor(profile) {
    this._editingProfileId = profile ? profile.id : null;
    this.$('pe-title').textContent = profile ? 'Edit Profile' : 'Create Profile';
    this.$('pe-name').value = profile ? profile.name : '';

    // Reset wizard data
    this._wizardData = {
      pfpColor: profile ? profile.pfpColor : '',
      isKids: profile ? !!profile.isKids : false,
      theme: '',
      playerColor: '',
      navLayout: '',
      sfxEnabled: undefined,
      sfxPack: ''
    };

    // Reset PFP selection
    this.$('pe-pfp-list').querySelectorAll('.pe-pfp-item').forEach(el => {
      el.classList.toggle('active', el.dataset.color === this._wizardData.pfpColor);
    });

    // Reset kids toggle
    this.$('pe-kids-toggle').classList.toggle('on', this._wizardData.isKids);

    // Reset sfx toggle
    this.$('pe-sfx-wiz-toggle').classList.toggle('on', false);
    const opts = this.$('pe-sfx-options');
    if (opts) {
      opts.style.opacity = '0.5';
      opts.style.pointerEvents = 'none';
    }

    // Reset theme/color/nav/sfx selections
    this.$('pe-theme-grid').querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
    this.$('pe-color-grid').querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
    this.$('pe-nav-grid').querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
    this.$('pe-sfx-pack-grid').querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));

    // If editing, try to highlight selected (accent is trickier as it's in per-profile settings)
    const peCustomInp = this.$('pe-custom-color-input');
    const peCustomSwatch = this.$('pe-custom-color-swatch');

    if (profile) {
      const oldId = this.store.profileId;
      this.store.setProfile(profile.id);
      const s = await this.store.settings();
      this.store.setProfile(oldId);
      
      const col = s.playerColor || '';
      if (col) {
        this._wizardData.playerColor = col;
        const hex = col.startsWith('#') ? col : `#${col}`;
        if (peCustomInp) peCustomInp.value = hex;
        if (peCustomSwatch) peCustomSwatch.style.background = hex;
        
        // Check if it matches a preset or is custom
        let matched = false;
        this.$('pe-color-grid').querySelectorAll('.color-option:not(.custom-color-option)').forEach(opt => {
          if (opt.dataset.color === col.replace('#','')) {
            opt.classList.add('active');
            matched = true;
          }
        });
        if (!matched && peCustomInp) {
          this.$('pe-custom-color-btn').classList.add('active');
        }
        
        const isExtreme = this._isColorExtreme(hex);
        this.$('pe-color-warning').classList.toggle('hidden', !isExtreme);
      } else {
        this.$('pe-color-warning').classList.add('hidden');
        if (peCustomSwatch) peCustomSwatch.style.background = '#ffffff';
        if (peCustomInp) peCustomInp.value = '#f97316';
      }
    } else {
      this.$('pe-color-warning').classList.add('hidden');
      if (peCustomSwatch) peCustomSwatch.style.background = '#ffffff';
      if (peCustomInp) peCustomInp.value = '#f97316';
    }

    // Go to step 0
    this._goToWizardStep(0);
    this.$('pe-overlay').classList.add('visible');
  }

  _updateAccent() {
    let c = this.settings.playerColor || CFG.DEFAULTS.playerColor;
    const hex = c.startsWith('#') ? c : `#${c}`;
    const pureHex = hex.replace('#', '');
    document.documentElement.style.setProperty('--pColor', hex);
    document.documentElement.style.setProperty('--pColor-h', `${hex}cc`);
    document.documentElement.style.setProperty('--pColor-g', `rgba(${this._hexToRgb(pureHex)}, 0.15)`);
    
    // Update theme chip accents if needed
    document.documentElement.style.setProperty('--accent', hex);

    // Apply custom theme if exists
    if (this.settings.customTheme) {
      this._applyCustomTheme(this.settings.customTheme);
    }
  }

  _hexToRgb(hex) {
    if (hex.startsWith('#')) hex = hex.slice(1);
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r},${g},${b}`;
  }

  _isColorExtreme(hex) {
    if (!hex) return false;
    if (hex.startsWith('#')) hex = hex.slice(1);
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    // perception-based brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 40 || brightness > 220;
  }

  _openCustomThemeEditor() {
    const overlay = this.$('custom-theme-overlay');
    const currentTheme = this.settings.customTheme || this._getDefaultCustomTheme();
    
    // Set current values
    Object.keys(currentTheme).forEach(key => {
      const input = this.$(`ct-${key}`);
      if (input) input.value = currentTheme[key];
    });
    
    // Update preview
    this._updateCustomThemePreview();
    
    // Show overlay
    overlay.classList.add('visible');
    
    // Setup event listeners
    this._setupCustomThemeListeners();
  }

  _getDefaultCustomTheme() {
    return {
      'bg-0': '#050508',
      'bg-1': '#0a0a0f', 
      'bg-card': '#121220',
      'c1': '#f8f9ff',
      'c2': '#b0b3c8',
      'c3': '#6a6d85',
      'accent': '#f97316',
      'border': '#ffffff'
    };
  }

  _setupCustomThemeListeners() {
    const overlay = this.$('custom-theme-overlay');
    
    // Color input listeners
    const colorInputs = overlay.querySelectorAll('.custom-theme-color-input');
    colorInputs.forEach(input => {
      input.addEventListener('input', () => this._updateCustomThemePreview());
    });
    
    // Button listeners
    this.$('ct-cancel')?.addEventListener('click', () => {
      overlay.classList.remove('visible');
      sfx.click();
    });
    
    this.$('ct-reset')?.addEventListener('click', () => {
      const defaultTheme = this._getDefaultCustomTheme();
      Object.keys(defaultTheme).forEach(key => {
        const input = this.$(`ct-${key}`);
        if (input) input.value = defaultTheme[key];
      });
      this._updateCustomThemePreview();
      sfx.click();
    });
    
    this.$('ct-save')?.addEventListener('click', async () => {
      const customTheme = {};
      const colorInputs = overlay.querySelectorAll('.custom-theme-color-input');
      colorInputs.forEach(input => {
        const key = input.id.replace('ct-', '');
        customTheme[key] = input.value;
      });
      
      this.settings.customTheme = customTheme;
      await this.store.saveSettings(this.settings);
      this._applyCustomTheme(customTheme);
      
      overlay.classList.remove('visible');
      sfx.click();
    });
    
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('visible');
        sfx.click();
      }
    });
  }

  _updateCustomThemePreview() {
    const preview = this.$('custom-theme-preview');
    if (!preview) return;
    
    const colors = {};
    const colorInputs = preview.parentElement.querySelectorAll('.custom-theme-color-input');
    colorInputs.forEach(input => {
      const key = input.id.replace('ct-', '');
      colors[key] = input.value;
    });
    
    // Apply to preview element
    preview.style.setProperty('--preview-bg-0', colors['bg-0']);
    preview.style.setProperty('--preview-bg-1', colors['bg-1']);
    preview.style.setProperty('--preview-bg-card', colors['bg-card']);
    preview.style.setProperty('--preview-c1', colors['c1']);
    preview.style.setProperty('--preview-c2', colors['c2']);
    preview.style.setProperty('--preview-c3', colors['c3']);
    preview.style.setProperty('--preview-accent', colors['accent']);
    preview.style.setProperty('--preview-border', colors['border']);
  }

  _applyCustomTheme(theme) {
    Object.keys(theme).forEach(key => {
      document.documentElement.style.setProperty(`--${key}`, theme[key]);
    });
  }

  _applyNavLayout(layout) {
    const app = this.$('app');
    app.dataset.nav = layout || 'sidebar-left';
  }

  /* ── Genre loading ── */
  async _loadGenres() {
    try {
      const [mg, tg] = await Promise.all([this.api.genres('movie'), this.api.genres('tv')]);
      this.genres.movie = mg.genres || []; this.genres.tv = tg.genres || [];
    } catch (e) { console.warn('Genre load failed', e) }
  }

  /* ── Global SFX ── */
  _globalSFX() {
    document.addEventListener('click', e => {
      if (e.target.closest('.toggle') || e.target.closest('.pe-kids-toggle')) {
        sfx.toggle();
        return;
      }
      if (e.target.closest('button, .nav-item, .collection-card, .theme-chip, .color-option, .pe-pfp-item, .wl-clear-btn, .pe-step-dot')) {
        const t = e.target.closest('.nav-item');
        if (t) sfx.nav();
        else sfx.click();
      }
    });

    document.addEventListener('input', e => {
      if (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'search')) {
        sfx.type();
      }
    });

    const navObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-nav') sfx.whoosh();
        else if (mutation.attributeName === 'class' && mutation.target.classList.contains('pe-step') && mutation.target.classList.contains('active')) sfx.whoosh();
      });
    });
    navObserver.observe(this.$('app'), { attributes: true });
    document.querySelectorAll('.pe-step').forEach(step => {
      navObserver.observe(step, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* ── Title-bar ── */
  _titlebar() {
    this.$('tb-min')?.addEventListener('click', () => {
      document.body.classList.add('win-fade-out');
      setTimeout(() => {
        window.electronAPI.win.minimize();
        document.body.classList.remove('win-fade-out');
      }, 200);
    });

    this.$('tb-max')?.addEventListener('click', () => {
      document.body.classList.add('win-scale-anim');
      window.electronAPI.win.maximize();
      setTimeout(() => document.body.classList.remove('win-scale-anim'), 700);
    });

    this.$('tb-close')?.addEventListener('click', () => {
      document.body.classList.add('win-fade-out');
      setTimeout(() => window.electronAPI.win.close(), 250);
    });
  }

  /* ── Sidebar ── */
  _sidebar() {
    document.querySelectorAll('.nav-item').forEach(b => {
      b.addEventListener('click', () => {
        const p = b.dataset.page; if (p) this.navigate(p);
      });
    });
  }

  /* ── Keyboard ── */
  _keys() {
    document.addEventListener('keydown', e => {
      const isPlayer = !this.$('player-overlay').classList.contains('hidden');
      if (e.key === 'Escape') {
        if (isPlayer) this.closePlayer();
        else if (this.$('detail-modal').classList.contains('visible')) this.closeModal();
      }
      // Show player controls on any key press when player is active
      if (isPlayer && e.key !== 'Escape') {
        this._wakePlayerControls();
      }
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); this.navigate('search') }
    });

    // Unified Player IPC / Message Handler:
    window.addEventListener('message', async ev => {
      if (ev.data === 'closePlayer' || (typeof ev.data === 'string' && ev.data.includes('esc'))) {
        this.closePlayer();
      }

      try {
        const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;

        // Handle URL change to detect next episode (TV Shows)
        if (data.type === 'solarUrlChange') {
          const url = data.url;
          const match = url.match(/\/tv\/(\d+)\/(\d+)\/(\d+)/);
          if (match) {
            const [_, id, sn, ep] = match;
            const newKey = `tv-${id}-s${sn}e${ep}`;
            if (this._currentPlayerKey !== newKey) {
              console.log(`[SebFlix] Next Episode Detected: S${sn}E${ep}`);
              this._currentPlayerKey = newKey;

              // Create new progress entry for this episode if it doesn't exist
              if (!this.prog[newKey]) {
                const base = Object.keys(this.prog).find(k => k.startsWith(`tv-${id}`)) || {};
                this.prog[newKey] = {
                  ...(this.prog[base] || {}),
                  id: +id, type: 'tv', season: +sn, episode: +ep,
                  currentTime: 0, duration: 0, pct: 0, ts: Date.now()
                };
              }
            }
          }
        }
        
        // Handle explicit mousemove from iframe to maintain native UI
        if (data.type === 'solarMouseMove') {
          this._wakePlayerControls();
        }

        // Handle Progress Updates
        if (data.event === 'onProgress' || data.type === 'progress' || data.type === 'solarProgress') {
          const { currentTime, duration } = data;
          if (this._currentPlayerKey && currentTime !== undefined) {
            const entry = this.prog[this._currentPlayerKey];
            if (entry) {
              entry.currentTime = currentTime;
              const dur = duration && duration > 0 && duration !== Infinity ? duration : (entry.duration || 0);
              entry.duration = dur;
              if (dur > 0) {
                const ratio = currentTime / dur;
                entry.pct = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : entry.pct;
              } else if (data.type !== 'solarProgress') {
                entry.pct = entry.pct || 0;
              }
              entry.ts = Date.now();

              if (Math.floor(currentTime) % 15 === 0) {
                console.log(`[Progress] Saving: ${this._currentPlayerKey} @ ${Math.floor(currentTime)}s (${Math.round((entry.pct || 0) * 100)}%)`);
              }
              await this.store.saveProg(this.prog);
              if (this.page === 'home') {
                requestAnimationFrame(() => this._updateCwFinishLabels());
              }
            }
          }
        }

        // Handle Playback Sync for Watch Party
        if (data.type === 'solarPlayback') {
          const { action, time } = data;
          
          // Track playback state for toggle functionality
          if (action === 'play') {
            this._playerIsPlaying = true;
            // Give extra time for VidKing to buffer after seeking
            setTimeout(() => {
              this.$('player-loader')?.classList.add('hidden');
            }, 2000);
          } else if (action === 'pause') {
            this._playerIsPlaying = false;
          }
          
          // Manual seek for continue watching items
          if (action === 'play' && this._playerForceAutoplay && this._currentPlayerKey) {
            const saved = this.prog[this._currentPlayerKey];
            if (saved?.currentTime && saved.currentTime > 5) {
              setTimeout(() => {
                const iframe = document.getElementById('player-iframe');
                if (iframe?.contentWindow) {
                  console.log(`[Player] Manually seeking to ${saved.currentTime}s for continue watching`);
                  iframe.contentWindow.postMessage({
                    type: 'remoteControl',
                    action: 'seek',
                    time: saved.currentTime
                  }, '*');
                }
              }, 3000); // Wait for video to fully load
            }
          }
          
          // Watch Party control sync removed
        }

      } catch (err) { }
    });
  }

  _playerEvents() {
    // Redundant listener removed. Consolidated into _keys() unified handler.
  }

  /* ── Modal events ── */
  _modalEvents() {
    this.$('dm-close')?.addEventListener('click', () => this.closeModal());
    this.$('detail-modal')?.querySelector('.dm-backdrop')?.addEventListener('click', () => this.closeModal());
  }

  /* ── Navigate ── */
  navigate(page) {
    this.page = page;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    // Smooth page transition - removed global toggle as we'll use component-level fades
    clearInterval(this.heroTimer);
    if (page !== 'home') {
      clearInterval(this._cwFinishTimer);
      this._cwFinishTimer = null;
    }

    if (!this.api && page !== 'settings') {
      const c = this.$('content');
      c.innerHTML = this._noKeyHTML();
      c.querySelector('.btn-retry')?.addEventListener('click', () => this.navigate('settings'));
      return;
    }
    switch (page) {
      case 'home': this.renderHome(); break;
      case 'movies': this.renderMovies(); break;
      case 'tv': this.renderTV(); break;
      case 'search': this.renderSearch(); break;
      case 'watchlist': this.renderWatchlist(); break;
      case 'collections': this.renderCollections(); break;
      case 'settings': this.renderSettings(); break;
      case 'recentlywatched': this.renderRecentlyWatched(); break;
      case 'recentlyadded': this.renderRecentlyAdded(); break;
      case 'playlists': this.renderPlaylists(); break;
      case 'playlistdiscovery': this.renderPlaylistDiscovery(); break;
    }
  }

  /* ══════════════════════════ HOME ══════════════════════════ */
  async renderHome() {
    clearInterval(this._cwFinishTimer);
    this._cwFinishTimer = null;
    const c = this.$('content');
    c.innerHTML = this._skelPage();
    try {
      const isKids = this.api.isKids;
      const requests = [
        this.api.trending(),
        this.api.popular('movie'),
        this.api.popular('tv'),
        this.api.topRated('movie'),
        isKids ? this.api.discover('movie', { with_genres: 10751 }) : this.api.nowPlaying(), // Family if kids
        this.api.discover('movie', { with_genres: isKids ? 16 : 28 }), // Animation if kids else Action
        isKids ? null : this.api.discover('movie', { with_genres: 27 }), // Horror (null if kids)
        this.api.discover('movie', { with_genres: 12 }), // Adventure
        this.api.discover('movie', { with_genres: 878 }) // Sci-Fi
      ];

      const [tr, pm, pt, tmr, np, row1, row2, adventure, sciFi] = await Promise.all(requests);

      let h = '';
      if (tr.results?.length) h += this._hero(tr.results.slice(0, 6));

      const cwRaw = this._continueWatching();
      const cw = cwRaw.length ? await this._enrichContinueWatching(cwRaw) : [];
      if (cw.length) h += this._row('Continue Watching', cw, true, 'raw');

      h += this._row('Trending Now', tr.results, false, 'trending');

      // ── Smart Home: "Because You Watched [Genre]" rows ──
      const genreRows = await this._genreBasedRows();
      for (const gr of genreRows) {
        h += this._row(gr.title, gr.items, false, 'discover', gr.genreId);
      }

      if (isKids) {
        h += this._row('Family Movies', np.results, false, 'discover', 10751);
        h += this._row('Animation', row1.results, false, 'discover', 16);
      } else {
        h += this._row('Action Movies', row1.results, false, 'discover', 28);
        h += this._row('Horror Movies', row2.results, false, 'discover', 27);
      }

      h += this._row('Popular Movies', pm.results, false, 'popular', 'movie');
      h += this._row('Popular TV Shows', pt.results, false, 'popular', 'tv');

      // ── Smart Home: "Recently Added You Might Like" ──
      const recentlyAddedLike = await this._recentlyAddedYouMightLike();
      if (recentlyAddedLike.length) h += this._row('Recently Added You Might Like', recentlyAddedLike, false, 'raw');

      h += this._row('Adventure & Sci-Fi', [...adventure.results.slice(0, 10), ...sciFi.results.slice(0, 10)], false, 'discover', '12,878');
      h += this._row('Top Rated', tmr.results, false, 'topRated');
      h += this._row('Recently Released', np.results, false, 'nowPlaying');

      c.innerHTML = h;
      this._wireRows(c); this._wireCards(c); this._heroSlider();
      this._updateCwFinishLabels();
      this._cwFinishTimer = setInterval(() => this._updateCwFinishLabels(), 1000);
    } catch (e) {
      console.error(e);
      c.innerHTML = this._errorHTML('Failed to load. Check your connection.');
      c.querySelector('.btn-retry')?.addEventListener('click', () => this.renderHome());
    }
  }

  /* ══════════════════════════ BROWSE ═════════════════════════ */
  async renderBrowse(type) {
    const c = this.$('content');
    const typeLabel = type === 'movie' ? 'Movies' : 'TV Shows';
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header"><h1 class="page-title">${typeLabel}</h1></div>
        <div class="genre-bar" id="genre-bar"></div>
        <div class="content-grid" id="browse-grid"></div>
        <div class="spinner" id="browse-spinner" style="display:none"></div>
      </div>`;

    // genres
    const gList = type === 'movie' ? this.genres.movie : this.genres.tv;
    const gBar = this.$('genre-bar');
    let selGenre = '';
    gBar.innerHTML = `<button class="genre-chip active" data-gid="">All</button>` +
      gList.map(g => `<button class="genre-chip" data-gid="${g.id}">${g.name}</button>`).join('');
    gBar.addEventListener('click', e => {
      const chip = e.target.closest('.genre-chip'); if (!chip) return;
      gBar.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selGenre = chip.dataset.gid;
      loadPage(1, true);
    });

    let curPage = 1; let loading = false; let totalPages = 1;
    const grid = this.$('browse-grid');
    const spin = this.$('browse-spinner');

    const loadPage = async (pg, reset) => {
      if (loading) return; loading = true;
      if (reset) { grid.innerHTML = ''; curPage = 1; pg = 1 }
      spin.style.display = 'block';
      try {
        const params = { page: pg, sort_by: 'popularity.desc' };
        if (selGenre) params.with_genres = selGenre;
        const data = await this.api.discover(type, params);
        totalPages = data.total_pages || 1;
        const html = data.results.map(i => this._card(i)).join('');
        grid.insertAdjacentHTML('beforeend', html);
        this._wireCards(grid);
        curPage = pg;

        // Auto-load next page if screen is not full (e.g. fullscreen on high res)
        if (c.scrollHeight <= c.clientHeight && curPage < totalPages) {
          loading = false;
          await loadPage(curPage + 1, false);
          return;
        }
      } catch (e) { console.error(e) }
      spin.style.display = 'none'; loading = false;
    };

    // scroll listener
    const onScroll = () => {
      if (this.page !== 'movies' && this.page !== 'tv') {
        c.removeEventListener('scroll', onScroll);
        return;
      }
      if (c.scrollTop + c.clientHeight >= c.scrollHeight - 600 && curPage < totalPages && !loading) {
        loadPage(curPage + 1, false);
      }
    };
    c.addEventListener('scroll', onScroll);
    loadPage(1, true);
  }

  /* ══════════════════════════ SEARCH ═════════════════════════ */
  renderSearch() {
    const c = this.$('content');
    c.innerHTML = `
      <div class="search-wrap page-animate">
        <div class="search-box">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input id="search-input" type="text" placeholder="Search movies, TV shows, people..." autofocus/>
        </div>
      </div>
      <div class="search-tabs page-animate" id="search-tabs" style="display:none;gap:12px;padding:0 50px;margin:15px 0 20px">
        <button class="genre-chip active" data-filter="all">All</button>
        <button class="genre-chip" data-filter="movie">Movies</button>
        <button class="genre-chip" data-filter="tv">TV Shows</button>
        <button class="genre-chip" data-filter="person">People</button>
      </div>
      <div class="content-grid page-animate" id="search-grid" style="padding-top:0"></div>
      <div id="search-empty" class="empty-state page-animate">
        <div class="search-empty-box">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <h3>Search SebFlix</h3>
          <p>Find your favourite movies, TV shows, and people</p>
        </div>
      </div>`;

    const inp = this.$('search-input');
    const grid = this.$('search-grid');
    const empty = this.$('search-empty');
    const tabs = this.$('search-tabs');
    let allResults = [];
    let currentFilter = 'all';

    const renderResults = () => {
      let filtered = allResults;
      if (currentFilter !== 'all') filtered = allResults.filter(i => i.media_type === currentFilter);
      if (!filtered.length) {
        grid.innerHTML = ''; empty.classList.remove('hidden');
        empty.querySelector('h3').textContent = 'No results';
        return;
      }
      empty.classList.add('hidden');
      grid.innerHTML = filtered.map(i => {
        if (i.media_type === 'person') {
          return `<div class="card search-person-card" data-person-id="${i.id}">
            <div class="card-poster"><img src="${profile(i.profile_path)}" alt="${esc(i.name)}" loading="lazy" onerror="this.src='${noPoster()}'"/><div class="card-overlay"><button type="button" class="card-play">👤</button></div></div>
            <div class="card-info"><div class="card-title">${esc(i.name)}</div><div class="card-meta"><span style="text-transform:uppercase;font-size:11px;opacity:.6">Person</span>${i.known_for_department ? `<span>${esc(i.known_for_department)}</span>` : ''}</div></div>
          </div>`;
        }
        return this._card(i);
      }).join('');
      this._wireCards(grid);
      grid.querySelectorAll('.search-person-card').forEach(card => {
        card.addEventListener('click', () => {
          this._prevPage = 'search';
          this.renderActorPage(+card.dataset.personId);
        });
      });
    };

    const doSearch = debounce(async q => {
      q = q.trim();
      if (!q) { grid.innerHTML = ''; empty.classList.remove('hidden'); tabs.style.display = 'none'; allResults = []; return }
      empty.classList.add('hidden');
      grid.innerHTML = '<div class="spinner"></div>';
      try {
        const [movieData, tvData, multiData] = await Promise.all([
          this.api.searchMovie(q),
          this.api.searchTV(q),
          this.api.search(q)
        ]);

        const merged = [
          ...(movieData.results || []),
          ...(tvData.results || []),
          ...(multiData.results || [])
        ];

        const seen = new Set();
        allResults = merged.filter(i => {
          if (!i) return false;
          // Ensure media_type for movie/tv specific endpoints
          if (!i.media_type) i.media_type = i.title ? 'movie' : 'tv';
          
          const key = `${i.media_type}-${i.id}`;
          if (seen.has(key)) return false;
          seen.add(key);

          return (i.media_type === 'movie' || i.media_type === 'tv' || i.media_type === 'person') &&
                 (i.poster_path || i.profile_path || i.backdrop_path);
        });

        // Popularity-based sort to ensure major sequels and hits are high up
        allResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        
        const hasTypes = new Set(allResults.map(i => i.media_type));
        tabs.style.display = allResults.length ? 'flex' : 'none';
        
        if (!allResults.length) {
          grid.innerHTML = ''; empty.classList.remove('hidden');
          empty.querySelector('h3').textContent = 'No results';
          empty.querySelector('p').textContent = `Nothing found for "${q}"`; return
        }
        renderResults();
      } catch (e) { 
        console.error(e);
        grid.innerHTML = '<p class="px-page" style="color:var(--c3)">Search failed.</p>';
      }
    }, 400);

    inp.addEventListener('input', e => doSearch(e.target.value));
    tabs.addEventListener('click', e => {
      const chip = e.target.closest('.genre-chip');
      if (!chip) return;
      tabs.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderResults();
    });
    setTimeout(() => inp.focus(), 100);
  }

  /* ══════════════════════════ WATCHLIST ══════════════════════ */
  async renderWatchlist() {
    const c = this.$('content');
    this.wl = await this.store.watchlist();
    this._wlSort = this._wlSort || 'added'; // default sort

    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header"><h1 class="page-title">Watchlist</h1>
          <p class="page-subtitle">${this.wl.length} item${this.wl.length > 1 ? 's' : ''}</p>
        </div>
      ${this.wl.length ? `
        <div class="wl-controls-bar">
          <div class="wl-search-wrap">
            <div class="search-box wl-search-box">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <input id="wl-search-input" type="text" placeholder="Search your watchlist..." />
              <button id="wl-search-clear" class="wl-clear-btn hidden" aria-label="Clear search">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
              </button>
            </div>
          </div>
          <div class="wl-sort-controls">
            <span class="wl-sort-label">Sort by:</span>
            <button class="wl-sort-btn ${this._wlSort === 'added' ? 'active' : ''}" data-sort="added">Date Added</button>
            <button class="wl-sort-btn ${this._wlSort === 'year' ? 'active' : ''}" data-sort="year">Release Year</button>
            <button class="wl-sort-btn ${this._wlSort === 'rating' ? 'active' : ''}" data-sort="rating">Rating</button>
          </div>
        </div>
        <div class="wl-split" id="wl-split">
          <div class="wl-column">
            <div class="wl-column-header">
              <h2 class="wl-column-title">Movies</h2>
              <button id="wl-clear-movies" class="wl-clear-section-btn" aria-label="Clear all movies">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Clear
              </button>
            </div>
            <div class="wl-column-grid" id="wl-movies-grid"></div>
            <div id="wl-movies-empty" class="wl-empty-msg hidden">No movies match your search.</div>
          </div>
          <div class="wl-column">
            <div class="wl-column-header">
              <h2 class="wl-column-title">TV Shows</h2>
              <button id="wl-clear-tv" class="wl-clear-section-btn" aria-label="Clear all TV shows">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Clear
              </button>
            </div>
            <div class="wl-column-grid" id="wl-tv-grid"></div>
            <div id="wl-tv-empty" class="wl-empty-msg hidden">No TV shows match your search.</div>
          </div>
        </div>
      ` : `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <h3>Your watchlist is empty</h3><p>Browse and add movies or shows you want to watch later.</p>
        </div>
      `}</div>`;

    if (!this.wl.length) return;

    const sortItems = (items, sortKey) => {
      const sorted = [...items];
      if (sortKey === 'year') sorted.sort((a, b) => {
        const ya = parseInt(year(a.release_date || a.first_air_date)) || 0;
        const yb = parseInt(year(b.release_date || b.first_air_date)) || 0;
        return yb - ya;
      });
      else if (sortKey === 'rating') sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      else sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      return sorted;
    };

    const renderFiltered = (query = '') => {
      const q = query.toLowerCase();
      let movies = this.wl.filter(i => {
        const mt = mediaType(i);
        const title = (i.title || i.name || '').toLowerCase();
        return mt === 'movie' && (!q || title.includes(q));
      });
      let tvShows = this.wl.filter(i => {
        const mt = mediaType(i);
        const title = (i.title || i.name || '').toLowerCase();
        return mt === 'tv' && (!q || title.includes(q));
      });

      movies = sortItems(movies, this._wlSort);
      tvShows = sortItems(tvShows, this._wlSort);

      const mGrid = this.$('wl-movies-grid');
      const tGrid = this.$('wl-tv-grid');
      mGrid.innerHTML = movies.map(i => this._card(i)).join('');
      tGrid.innerHTML = tvShows.map(i => this._card(i)).join('');
      this._wireCards(mGrid);
      this._wireCards(tGrid);

      this.$('wl-movies-empty').classList.toggle('hidden', movies.length > 0);
      this.$('wl-tv-empty').classList.toggle('hidden', tvShows.length > 0);
    };

    renderFiltered();

    const inp = this.$('wl-search-input');
    const clearBtn = this.$('wl-search-clear');
    const doSearch = debounce(q => {
      clearBtn.classList.toggle('hidden', !q);
      renderFiltered(q);
    }, 200);

    inp.addEventListener('input', e => doSearch(e.target.value.trim()));
    clearBtn.addEventListener('click', () => {
      inp.value = '';
      clearBtn.classList.add('hidden');
      renderFiltered();
      inp.focus();
    });

    // Wire up clear buttons for movies and TV shows
    this.$('wl-clear-movies')?.addEventListener('click', async () => {
      const moviesToRemove = this.wl.filter(i => mediaType(i) === 'movie');
      if (moviesToRemove.length === 0) return;
      
      const confirmed = await this.showConfirm({
        title: 'Clear Movies?',
        message: `Remove ${moviesToRemove.length} movie${moviesToRemove.length > 1 ? 's' : ''} from your watchlist?`,
        confirmText: 'Clear Movies',
        cancelText: 'Cancel'
      });
      
      if (confirmed) {
        this.wl = this.wl.filter(i => mediaType(i) !== 'movie');
        await this.store.saveWL(this.wl);
        renderFiltered();
      }
    });

    this.$('wl-clear-tv')?.addEventListener('click', async () => {
      const tvToRemove = this.wl.filter(i => mediaType(i) === 'tv');
      if (tvToRemove.length === 0) return;
      
      const confirmed = await this.showConfirm({
        title: 'Clear TV Shows?',
        message: `Remove ${tvToRemove.length} TV show${tvToRemove.length > 1 ? 's' : ''} from your watchlist?`,
        confirmText: 'Clear Shows',
        cancelText: 'Cancel'
      });
      
      if (confirmed) {
        this.wl = this.wl.filter(i => mediaType(i) !== 'tv');
        await this.store.saveWL(this.wl);
        renderFiltered();
      }
    });

    // Wire sort buttons
    c.querySelectorAll('.wl-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        c.querySelectorAll('.wl-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._wlSort = btn.dataset.sort;
        renderFiltered(inp.value.trim());
      });
    });
  }

  /* ══════════════════════════ COLLECTIONS ══════════════════════ */
  renderCollections() {
    const c = this.$('content');
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header">
          <h1 class="page-title">Collections</h1>
          <p class="page-subtitle">Curated bundles of cinematic greatness</p>
          <div class="search-bar mt-6" style="max-width:400px">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input type="text" id="col-search-input" placeholder="Search collections..." value="${this._colSearchQuery || ''}" />
          </div>
        </div>
        <div class="collections-grid" id="col-grid">
          ${this._getFilteredCollections(this._colSearchQuery).map((col, i) => this._colCard(col, i)).join('')}
        </div>
      </div>
    `;

    const inp = this.$('col-search-input');
    const grid = this.$('col-grid');

    const doColSearch = debounce(q => {
      this._colSearchQuery = q;
      grid.innerHTML = this._getFilteredCollections(q).map((col, i) => this._colCard(col, i)).join('');
      grid.querySelectorAll('.collection-card').forEach(card => {
        card.onclick = () => this.renderCollection(card.dataset.id || card.dataset.cid);
      });
    }, 250);

    inp.addEventListener('input', () => {
      doColSearch(inp.value.toLowerCase());
    });

    grid.querySelectorAll('.collection-card').forEach(card => {
      card.onclick = () => this.renderCollection(card.dataset.id || card.dataset.cid);
    });
  }

  _getFilteredCollections(q) {
    if (!q) return COLLECTIONS;
    return COLLECTIONS.filter(c => c.name.toLowerCase().includes(q));
  }

  _colCard(col, index) {
    const id = col.id;
    const thumb = col.backdrop ? `${CFG.IMG}/w780${col.backdrop}` : '';
    const logoHtml = col.logo ? `<img class="col-logo" src="${col.logo}" loading="lazy" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>` : '';

    return `
      <div class="collection-card col-fade-in" data-id="${id}"
           style="animation-delay: ${index * 0.05}s">
        <div class="col-backdrop" id="col-bg-${id}">
          ${thumb ? `<img class="col-backdrop-img" src="${thumb}" loading="lazy" alt=""/>` : ''}
        </div>
        <div class="col-info">
          ${logoHtml}
          <h2 class="col-name" style="${col.logo ? 'display:none' : 'display:block'}">${col.name}</h2>
          <p class="col-desc">Theatrical Franchise</p>
          <div class="col-badge">${col.movies ? col.movies.length : '0'} Movies</div>
        </div>
      </div>
    `;
  }

  async renderCollection(id) {
    const colId = parseInt(id);
    let col = COLLECTIONS.find(x => x.id === colId);
    if (!col) return;

    const c = this.$('content');
    const headerLogo = col.logo ? `<img class="col-logo" src="${col.logo}" style="max-height:80px;margin-bottom:0" alt=""/>` : `<h1 class="page-title">${col.name}</h1>`;

    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header" style="flex-direction:column;align-items:flex-start;gap:20px">
          <button class="btn-back" id="col-back">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Back to Collections
          </button>
          <div style="display:flex;align-items:center;gap:20px">
            ${headerLogo}
            <div style="display:flex;flex-direction:column;gap:4px">
              ${col.logo ? `<h2 style="font-size:16px;opacity:0.6;margin:0">${col.name}</h2>` : ''}
              <p class="page-subtitle" style="margin:0">Complete theatrical movie series.</p>
            </div>
          </div>
        </div>
        <div class="content-grid" id="col-grid-view"><div class="spinner"></div></div>
      </div>
    `;

    this.$('col-back').onclick = () => this.renderCollections();

    try {
      // Fetch details for each movie in the collection
      const results = await Promise.all(col.movies.map(async it => {
        try {
          const d = await this.api.details('movie', it.id);
          return d;
        } catch (e) { return null; }
      }));
      const items = results.filter(x => x !== null);

      // Deduplicate and Filter
      const seen = new Set();
      let filtered = items.filter(it => {
        if (seen.has(it.id)) return false;
        seen.add(it.id);

        if (this.api.isKids) {
          const matureGenres = [27, 53, 80, 10752, 9648];
          const genres = it.genres ? it.genres.map(g => g.id) : (it.genre_ids || []);
          if (genres.some(g => matureGenres.includes(g))) return false;
        }
        return true;
      }).sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));

      const grid = this.$('col-grid-view');
      grid.innerHTML = filtered.map(i => this._card(i)).join('');
      this._wireCards(grid);
    } catch (e) {
      if (this.$('col-grid-view')) this.$('col-grid-view').innerHTML = `<p class="px-page" style="color:var(--c3)">Failed to load collection details.</p>`;
    }
  }

  /* ══════════════════════════ MOVIES ══════════════════════════ */
  async renderMovies() {
    const c = this.$('content');
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header">
          <h1 class="page-title">Movies</h1>
        </div>
        <div class="categories-bar">
          <button class="category-arrow" id="movies-cat-left">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="categories-wrapper">
            <div class="categories-scroll" id="movies-categories">
              <button class="category-chip active" data-genre="all">All</button>
              <button class="category-chip" data-genre="28">Action</button>
              <button class="category-chip" data-genre="12">Adventure</button>
              <button class="category-chip" data-genre="16">Animation</button>
              <button class="category-chip" data-genre="35">Comedy</button>
              <button class="category-chip" data-genre="99">Documentary</button>
              <button class="category-chip" data-genre="18">Drama</button>
              <button class="category-chip" data-genre="14">Fantasy</button>
              <button class="category-chip" data-genre="27">Horror</button>
              <button class="category-chip" data-genre="10749">Romance</button>
              <button class="category-chip" data-genre="878">Science Fiction</button>
              <button class="category-chip" data-genre="53">Thriller</button>
            </div>
          </div>
          <button class="category-arrow" id="movies-cat-right">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="content-grid" id="movies-grid"></div>
        <div class="loading-indicator hidden" id="movies-loading">Loading more movies...</div>
      </div>
    `;
    
    // Initialize infinite scroll
    this._setupInfiniteScroll('movie');
    
    // Setup category filtering
    this._setupCategoryFilter('movie');
    
    // Setup category arrows
    this._setupCategoryArrows('movies');
    
    // Load initial content
    await this._loadContent('movie', 1);
  }

  /* ══════════════════════════ TV SHOWS ══════════════════════════ */
  async renderTV() {
    const c = this.$('content');
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header">
          <h1 class="page-title">TV Shows</h1>
        </div>
        <div class="categories-bar">
          <button class="category-arrow" id="tv-cat-left">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="categories-wrapper">
            <div class="categories-scroll" id="tv-categories">
              <button class="category-chip active" data-genre="all">All</button>
              <button class="category-chip" data-genre="10759">Action & Adventure</button>
              <button class="category-chip" data-genre="16">Animation</button>
              <button class="category-chip" data-genre="35">Comedy</button>
              <button class="category-chip" data-genre="99">Documentary</button>
              <button class="category-chip" data-genre="18">Drama</button>
              <button class="category-chip" data-genre="10751">Family</button>
              <button class="category-chip" data-genre="10762">Kids</button>
              <button class="category-chip" data-genre="9648">Mystery</button>
              <button class="category-chip" data-genre="10763">News</button>
              <button class="category-chip" data-genre="10764">Reality</button>
              <button class="category-chip" data-genre="10765">Sci-Fi & Fantasy</button>
              <button class="category-chip" data-genre="10766">Soap</button>
              <button class="category-chip" data-genre="10767">Talk</button>
              <button class="category-chip" data-genre="10768">War & Politics</button>
              <button class="category-chip" data-genre="37">Western</button>
            </div>
          </div>
          <button class="category-arrow" id="tv-cat-right">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="content-grid" id="tv-grid"></div>
        <div class="loading-indicator hidden" id="tv-loading">Loading more TV shows...</div>
      </div>
    `;
    
    // Initialize infinite scroll
    this._setupInfiniteScroll('tv');
    
    // Setup category filtering
    this._setupCategoryFilter('tv');
    
    // Setup category arrows
    this._setupCategoryArrows('tv');
    
    // Load initial content
    await this._loadContent('tv', 1);
  }

  _setupCategoryFilter(type) {
    const categoriesId = type === 'movie' ? 'movies-categories' : 'tv-categories';
    const chips = document.querySelectorAll(`#${categoriesId} .category-chip`);
    
    chips.forEach(chip => {
      chip.addEventListener('click', async () => {
        // Update active state
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Reset pagination and load new content
        this._currentPage = 1;
        this._currentGenre = chip.dataset.genre;
        this._contentType = type;
        this._hasMorePages = true;
        this._isLoading = false;
        
        console.log(`[DEBUG] Category changed to ${this._currentGenre} for ${type}`);
        
        await this._loadContent(type, 1);
      });
    });
  }

  _setupCategoryArrows(type) {
    const scrollId = type === 'movie' ? 'movies-categories' : 'tv-categories';
    const leftId = type === 'movie' ? 'movies-cat-left' : 'tv-cat-left';
    const rightId = type === 'movie' ? 'movies-cat-right' : 'tv-cat-right';
    
    const scroll = this.$(scrollId);
    const leftArrow = this.$(leftId);
    const rightArrow = this.$(rightId);
    
    if (!scroll || !leftArrow || !rightArrow) return;
    
    const updateArrows = () => {
      const isAtStart = scroll.scrollLeft <= 0;
      const isAtEnd = scroll.scrollLeft >= scroll.scrollWidth - scroll.clientWidth;
      
      leftArrow.classList.toggle('disabled', isAtStart);
      rightArrow.classList.toggle('disabled', isAtEnd);
    };
    
    leftArrow.addEventListener('click', () => {
      scroll.scrollBy({ left: -200, behavior: 'smooth' });
    });
    
    rightArrow.addEventListener('click', () => {
      scroll.scrollBy({ left: 200, behavior: 'smooth' });
    });
    
    scroll.addEventListener('scroll', updateArrows);
    updateArrows(); // Initial state
  }

  _setupInfiniteScroll(type) {
    this._currentPage = 1;
    this._currentGenre = 'all';
    this._contentType = type;
    this._isLoading = false;
    this._hasMorePages = true;
    
    const gridId = type === 'movie' ? 'movies-grid' : 'tv-grid';
    const loadingId = type === 'movie' ? 'movies-loading' : 'tv-loading';
    
    const observer = new IntersectionObserver(async (entries) => {
      const loading = this.$(loadingId);
      const entry = entries[0];
      
      console.log(`[DEBUG] Intersection triggered for ${type}:`, {
        isIntersecting: entry.isIntersecting,
        intersectionRatio: entry.intersectionRatio,
        isLoading: this._isLoading,
        hasMorePages: this._hasMorePages,
        loadingExists: !!loading,
        currentPage: this._currentPage,
        loadingVisible: loading ? !loading.classList.contains('hidden') : false
      });
      
      if (entry.isIntersecting && 
          entry.intersectionRatio > 0 && 
          !this._isLoading && 
          this._hasMorePages && 
          loading && 
          !loading.classList.contains('hidden')) {
        
        this._isLoading = true;
        loading.textContent = `Loading page ${this._currentPage + 1}...`;
        
        console.log(`[DEBUG] Loading next page for ${type}:`, this._currentPage + 1);
        
        this._currentPage++;
        await this._loadContent(type, this._currentPage);
        
        loading.classList.add('hidden');
        this._isLoading = false;
        
        // Small delay to allow DOM to update before next observation
        setTimeout(() => {
          if (this._hasMorePages) {
            loading.classList.remove('hidden');
            loading.textContent = 'Loading more...';
          }
        }, 100);
      }
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });
    
    // Observe the loading indicator
    const loading = this.$(loadingId);
    if (loading) {
      observer.observe(loading);
      console.log(`[DEBUG] Observer attached to ${loadingId}`);
    }
    
    // Store observer for cleanup
    this._scrollObserver = observer;
  }

  async _loadContent(type, page = 1) {
    const gridId = type === 'movie' ? 'movies-grid' : 'tv-grid';
    const grid = this.$(gridId);
    
    if (!grid) return;
    
    try {
      let data;
      if (this._currentGenre === 'all') {
        data = await this.api.popular(type, page);
      } else {
        data = await this.api.discover(type, { 
          with_genres: parseInt(this._currentGenre),
          page: page 
        });
      }
      
      console.log(`[DEBUG] Loaded ${type} page ${page}, genre ${this._currentGenre}:`, {
        results: data.results.length,
        totalPages: data.total_pages,
        currentPage: data.page,
        hasMore: data.page < data.total_pages
      });
      
      if (page === 1) {
        // First page - replace content
        grid.innerHTML = data.results.map(item => this._card(item)).join('');
      } else {
        // Subsequent pages - append content
        const newCards = data.results.map(item => this._card(item)).join('');
        grid.insertAdjacentHTML('beforeend', newCards);
      }
      
      this._wireCards(grid);
      
      // Update pagination state
      this._hasMorePages = data.page < data.total_pages && data.results.length > 0;
      
      // Update loading indicator visibility
      const loadingId = type === 'movie' ? 'movies-loading' : 'tv-loading';
      const loading = this.$(loadingId);
      if (loading) {
        if (!this._hasMorePages) {
          loading.classList.add('hidden');
          loading.textContent = 'No more content';
        } else {
          // Don't hide loading indicator - keep it visible for next intersection
          loading.classList.remove('hidden');
          loading.textContent = 'Scroll for more...';
        }
      }
      
    } catch (e) {
      console.error(`[ERROR] Failed to load ${type} content:`, e);
      this._hasMorePages = false;
      if (page === 1) {
        grid.innerHTML = `<p class="px-page" style="color:var(--c3)">Failed to load content.</p>`;
      }
    }
  }

  /* ══════════════════════════ SETTINGS ══════════════════════ */
  renderSettings() {
    const c = this.$('content');
    const s = this.settings;
    c.innerHTML = `
    <div class="settings-page page-animate">
      <div class="page-header" style="padding:0 0 20px"><h1 class="page-title">Settings</h1></div>

      <div class="settings-group">
        <div class="settings-group-title">General</div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px">
          <div class="setting-label">Theme</div>
          <div class="theme-chips" id="s-theme-grid">
            ${THEMES.map(t => `
              <div class="theme-chip ${s.theme === t.id ? 'active' : ''}" data-theme="${t.id}">${t.n}</div>
            `).join('')}
            <div class="theme-chip custom-theme-option ${s.theme === 'custom' ? 'active' : ''}" data-theme="custom">
              <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right:6px">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
              </svg>
              Custom
            </div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Player</div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px">
          <div class="setting-label">Accent colour</div>
          <div class="color-picker-grid" id="s-color-grid">
            ${[
        { n: 'Violet', c: '8b5cf6' }, { n: 'Red', c: 'ef4444' }, { n: 'Green', c: '22c55e' }, { n: 'Blue', c: '3b82f6' }, { n: 'Orange', c: 'f97316' },
        { n: 'Pink', c: 'ec4899' }, { n: 'Teal', c: '14b8a6' }, { n: 'Yellow', c: 'eab308' }, { n: 'Purple', c: 'a855f7' }, { n: 'Slate', c: '475569' }
      ].map(col => `
              <div class="color-option ${s.playerColor === col.c ? 'active' : ''}" data-color="${col.c}">
                <div class="color-swatch" style="background:#${col.c}">
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
                </div>
                <div class="color-name">${col.n}</div>
              </div>`).join('')}
            <div class="color-option custom-color-option ${!['8b5cf6','ef4444','22c55e','3b82f6','f97316','ec4899','14b8a6','eab308','a855f7','475569'].includes((s.playerColor||'').replace('#','')) ? 'active' : ''}" id="custom-color-btn">
              <div class="color-swatch" id="custom-color-swatch" style="background:${s.playerColor?.startsWith('#') ? s.playerColor : '#' + (s.playerColor || 'ffffff')}">
                <input type="color" id="custom-color-input" value="${s.playerColor?.startsWith('#') ? s.playerColor : '#' + (s.playerColor || 'f97316')}" style="opacity:0;position:absolute;inset:0;cursor:pointer" />
                <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/></svg>
              </div>
              <div class="color-name">Custom</div>
            </div>
          </div>
          <p id="s-color-warning" class="setting-desc hidden" style="color:var(--yellow);margin-top:4px">
            ⚠️ This color may affect visibility with some themes.
          </p>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Auto-play</div></div>
          <div class="toggle ${s.autoPlay ? 'on' : ''}" id="s-autoplay"></div>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Next episode button</div></div>
          <div class="toggle ${s.nextEpisode ? 'on' : ''}" id="s-next"></div>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Episode selector</div></div>
          <div class="toggle ${s.episodeSelector ? 'on' : ''}" id="s-epsel"></div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Navigation</div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px">
          <div class="setting-label">Navigation Layout</div>
          <div class="theme-chips" id="s-nav-grid">
            ${CFG.NAV_LAYOUTS.map(l => `
              <div class="theme-chip ${(s.navLayout || CFG.DEFAULTS.navLayout) === l.id ? 'active' : ''}" data-nav="${l.id}">${l.n}</div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">UI Sound Effects</div>
        <div class="setting-row">
          <div><div class="setting-label">Enable sounds</div>
            <div class="setting-desc">Clicks, taps, and whooshes</div></div>
          <div class="toggle ${s.sfxEnabled ? 'on' : ''}" id="s-sfx" data-controls="sfx-options"></div>
        </div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px;opacity:${s.sfxEnabled ? 1 : 0.5};pointer-events:${s.sfxEnabled ? 'auto' : 'none'};transition:all var(--fast)" id="sfx-options">
          <div style="width:100%;display:flex;justify-content:space-between;align-items:center">
            <div class="setting-label">Volume Level</div>
            <div style="font-size:12px;color:var(--accent)" id="s-sfx-vol-label">${Math.round((s.sfxVol ?? 0.5) * 100)}%</div>
          </div>
          <input type="range" id="s-sfx-vol" min="0" max="1" step="0.05" value="${s.sfxVol ?? 0.5}" style="width:100%;accent-color:var(--accent);cursor:pointer">
          
          <div class="setting-label" style="margin-top:10px">Sound Pack</div>
          <div class="theme-chips" id="s-sfx-pack-grid">
            ${CFG.SFX_PACKS.map(p => `
              <div class="theme-chip ${(s.sfxPack || CFG.DEFAULTS.sfxPack) === p.id ? 'active' : ''}" data-pack="${p.id}">${p.n}</div>
            `).join('')}
          </div>
        </div>
      </div>

      ${this._renderStatsSection()}

      <div class="settings-group">
        <div class="settings-group-title">Data & Sync</div>
        <div class="setting-row">
          <div><div class="setting-label">Export Profile Data</div>
          <div class="setting-desc">Backup watch history, settings, and playlists</div></div>
          <button class="dm-btn dm-btn-wl" id="s-export">Export Data</button>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Import Profile Data</div>
          <div class="setting-desc">Restore a previous backup</div></div>
          <button class="dm-btn dm-btn-wl" id="s-import">Import Data</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Data</div>
        <div class="setting-row">
          <div><div class="setting-label">Clear watch history</div></div>
          <button class="btn-danger" id="s-clearhist">Clear History</button>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Clear progress data</div></div>
          <button class="btn-danger" id="s-clearprog">Clear Progress</button>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Clear API cache</div></div>
          <button class="btn-danger" id="s-clearcache">Clear Cache</button>
        </div>
      </div>

      <div class="dmca-notice" style="margin: 30px 0; padding: 20px; background: var(--bg-2); border-radius: var(--radius-md); border: 1px solid var(--border);">
        <h4 style="color: var(--c2); font-size: 14px; font-weight: 600; margin-bottom: 8px;">⚖️ DMCA Notice</h4>
        <p style="color: var(--c3); font-size: 12px; line-height: 1.5; margin: 0;">
          SebFlix does not host or store any media content. All movies, TV shows, and other media are hosted on third-party services. 
          This application is merely a user interface that aggregates and links to content available on external platforms. 
          We do not upload, distribute, or claim ownership of any copyrighted material. All content is the property of their respective owners.
          For any DMCA concerns, please contact the respective hosting providers of the content in question.
        </p>
      </div>

      <button class="dm-btn dm-btn-play mt-4" id="s-save" style="align-self:flex-start">Save Settings</button>
    </div>`;

    const save = async () => {
      await this.store.saveSettings(this.settings);
      this._updateAccent();
    };

    // theme chips
    const tGrid = this.$('s-theme-grid');
    tGrid?.querySelectorAll('.theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        tGrid.querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        this.settings.theme = chip.dataset.theme;
        document.body.dataset.theme = this.settings.theme;
        
        // If custom theme is selected, open the custom theme editor
        if (chip.dataset.theme === 'custom') {
          this._openCustomThemeEditor();
        }
        
        save();
      });
    });

    // toggles
    c.querySelectorAll('.toggle').forEach(t => {
      const key = t.id.replace('s-', '');
      // map legacy IDs to settings keys
      const sMap = { 'autoplay': 'autoPlay', 'next': 'nextEpisode', 'epsel': 'episodeSelector', 'sfx': 'sfxEnabled' };
      const sKey = sMap[key] || key;

      t.addEventListener('click', () => {
        t.classList.toggle('on');
        const isOn = t.classList.contains('on');
        this.settings[sKey] = isOn;
        if (sKey === 'sfxEnabled') {
          sfx.enabled = isOn;
          const opts = this.$('sfx-options');
          if (opts) {
            opts.style.opacity = isOn ? '1' : '0.5';
            opts.style.pointerEvents = isOn ? 'auto' : 'none';
          }
        }
        save();
      });
    });

    const sfxVolInput = this.$('s-sfx-vol');
    if (sfxVolInput) {
      const volLabel = this.$('s-sfx-vol-label');
      sfxVolInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        volLabel.textContent = `${Math.round(val * 100)}%`;
        sfx.vol = val;
        this.settings.sfxVol = val;
      });
      sfxVolInput.addEventListener('change', () => { save(); sfx.click() });
    }

    const sfxPackGrid = this.$('s-sfx-pack-grid');
    sfxPackGrid?.querySelectorAll('.theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sfxPackGrid.querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        this.settings.sfxPack = chip.dataset.pack;
        sfx.pack = chip.dataset.pack;
        save();
        sfx.click();
      });
    });

    // color picker
    const cGrid = this.$('s-color-grid');
    cGrid?.querySelectorAll('.color-option:not(.custom-color-option)').forEach(opt => {
      opt.addEventListener('click', () => {
        cGrid.querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
        opt.classList.add('active');
        this.settings.playerColor = opt.dataset.color;
        save();
      });
    });

    // custom color picker
    const customInp = this.$('custom-color-input');
    const customBtn = this.$('custom-color-btn');
    const customSwatch = this.$('custom-color-swatch');
    
    customInp?.addEventListener('input', (e) => {
      const col = e.target.value;
      cGrid.querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
      customBtn.classList.add('active');
      customSwatch.style.background = col;
      this.settings.playerColor = col;
      this._updateAccent();
      save();

      const isExtreme = this._isColorExtreme(col);
      this.$('s-color-warning')?.classList.toggle('hidden', !isExtreme);
    });
    
    customBtn?.addEventListener('click', () => customInp.click());

    cGrid.querySelectorAll('.color-option:not(.custom-color-option)').forEach(opt => {
      opt.addEventListener('click', () => {
        this.$('s-color-warning')?.classList.add('hidden');
      });
    });

    // nav layout chips
    const nGrid = this.$('s-nav-grid');
    nGrid?.querySelectorAll('.theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        nGrid.querySelectorAll('.theme-chip').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        this.settings.navLayout = chip.dataset.nav;
        this._applyNavLayout(chip.dataset.nav);
        save();
      });
    });

    this.$('s-clearhist')?.addEventListener('click', async () => {
      this.hist = []; this.prog = {};
      await Promise.all([this.store.saveHist([]), this.store.saveProg({})]);
      if (this.api) this.api.cache.clear();
      window.electronAPI.player.clearAllCache();
    });
    this.$('s-clearprog')?.addEventListener('click', async () => { this.prog = {}; await this.store.saveProg({}) });
    this.$('s-clearcache')?.addEventListener('click', () => { if (this.api) this.api.cache.clear() });

    // Stats
    this.$('s-load-stats')?.addEventListener('click', () => this._loadAndRenderStats());
    this.$('s-wrapped')?.addEventListener('click', () => this._showWrapped());

    // Sync Export/Import
    this.$('s-export')?.addEventListener('click', async () => {
      const data = await this._exportProfileData();
      navigator.clipboard.writeText(data);
      const btn = this.$('s-export');
      btn.textContent = 'Copied to Clipboard!';
      setTimeout(() => btn.textContent = 'Export Data', 2000);
    });
    
    this.$('s-import')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        const success = await this._importProfileData(text);
        const btn = this.$('s-import');
        if (success) {
          btn.textContent = 'Import Successful! Reloading...';
          setTimeout(() => location.reload(), 1500);
        } else {
          btn.textContent = 'Invalid Data';
          setTimeout(() => btn.textContent = 'Import Data', 2000);
        }
      } catch (e) {
        console.error(e);
        this.$('s-import').textContent = 'Error Reading Clipboard';
        setTimeout(() => this.$('s-import').textContent = 'Import Data', 2000);
      }
    });
  }

  /* ══════════════════════════ DETAIL MODAL ═══════════════════ */
  async showDetail(id, type) {
    const modal = this.$('detail-modal');
    const body = this.$('dm-body');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('visible'));
    body.innerHTML = '<div class="spinner"></div>';

    try {
      const d = await this.api.details(type, id);
      const title = d.title || d.name;
      const dateStr = d.release_date || d.first_air_date;
      const genres = (d.genres || []).map(g => `<span class="badge badge-genre">${g.name}</span>`).join('');
      const cast = (d.credits?.cast || []).slice(0, 15);
      const trailer = (d.videos?.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
      const similar = d.similar?.results || d.recommendations?.results || [];
      const inWL = this.wl.some(w => w.id === d.id);

      let html = `
        <img class="dm-backdrop-img" src="${backdrop(d.backdrop_path, 'md')}" alt="" onerror="this.style.display='none'"/>
        <div class="dm-gradient"></div>
        <div class="dm-body">
          <h1 class="dm-title">${esc(title)}</h1>
          <div class="dm-meta">
            <span class="badge badge-rating">${STAR_SVG} ${rating(d.vote_average)}</span>
            <span>${year(dateStr)}</span>
            ${d.runtime ? `<span>${runtime(d.runtime)}</span>` : ''}
            ${d.number_of_seasons ? `<span>${d.number_of_seasons} Season${d.number_of_seasons > 1 ? 's' : ''}</span>` : ''}
            ${genres}
          </div>
          <div class="dm-finishes-at hidden" id="dm-finishes-at" role="status"></div>
          <p class="dm-overview">${esc(d.overview || 'No overview available.')}</p>
          <div class="dm-actions">
            <button class="dm-btn dm-btn-play" id="dm-play" data-id="${d.id}" data-type="${type}">
              ${PLAY_SVG} Play
            </button>
            <button class="dm-btn dm-btn-wl ${inWL ? 'added' : ''}" id="dm-wl"
              data-id="${d.id}" data-type="${type}" data-title="${esc(title)}"
              data-poster="${d.poster_path || ''}" data-date="${dateStr || ''}"
              data-rating="${d.vote_average || 0}">
              ${inWL ? '✓ In Watchlist' : '+ Watchlist'}
            </button>
            ${trailer ? `<button class="dm-btn dm-btn-trailer" id="dm-trailer" data-yt="${trailer.key}">Trailer</button>` : ''}
            <button class="dm-btn dm-btn-wl" id="dm-add-playlist">Playlist</button>
          </div>`;

      // Extract Rating
      let ratingStr = 'N/A';
      if (type === 'movie') {
        const release = (d.release_dates?.results || []).find(r => r.iso_3166_1 === 'US') || d.release_dates?.results?.[0];
        ratingStr = release?.release_dates?.[0]?.certification || 'N/A';
      } else {
        const content = (d.content_ratings?.results || []).find(r => r.iso_3166_1 === 'US') || d.content_ratings?.results?.[0];
        ratingStr = content?.rating || 'N/A';
      }
      if (ratingStr && ratingStr !== 'N/A') {
        html = html.replace('badge-rating">', `badge-rating">${ratingStr} &nbsp; • &nbsp; `);
      }

      // TV Seasons
      if (type === 'tv' && d.number_of_seasons) {
        const sTabs = Array.from({ length: d.number_of_seasons }, (_, i) => `
          <button class="genre-chip ${i === 0 ? 'active' : ''}" data-sn="${i + 1}">Season ${i + 1}</button>
        `).join('');
        html += `<div class="dm-section-title">Episodes</div>
          <div class="dm-seasons" id="dm-season-tabs">${sTabs}</div>
          <div class="dm-episodes" id="dm-episodes"><div class="spinner"></div></div>`;
      }

      // Cast
      if (cast.length) {
        html += `<div class="dm-section-title mt-8">Cast</div>
          <div class="dm-cast-wrap">
            <div class="dm-cast" id="dm-cast-list">
              ${cast.map(c => `<div class="dm-cast-item" data-person-id="${c.id}" style="cursor:pointer">
                <img class="dm-cast-img" src="${profile(c.profile_path)}" alt="" loading="lazy"/>
                <div class="dm-cast-name">${esc(c.name)}</div>
                <div class="dm-cast-char">${esc(c.character || '')}</div>
              </div>`).join('')}
            </div>
            <div class="dm-cast-arrows">
              <button class="dm-cast-arrow dm-cast-left" id="dm-cast-l"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <button class="dm-cast-arrow dm-cast-right" id="dm-cast-r"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </div>`;
      }

      // Similar
      if (similar.length) {
        html += `<div class="dm-section-title mt-8">More Like This</div>
          <div class="dm-similar">
            ${similar.slice(0, 12).map(i => this._card(i)).join('')}
          </div>`;
      }

      // Because You Liked This placeholder
      html += `<div id="dm-because-section"></div>`;

      html += `</div>`;
      body.innerHTML = html;

      const certForPlayer = ratingStr && ratingStr !== 'N/A' ? ratingStr : '';
      this._updateDetailFinishesAt(d, type, id);

      // Async load "Because You Liked This"
      this._becauseYouLiked(d.id, type).then(items => {
        const sec = this.$('dm-because-section');
        if (sec && items.length) {
          sec.innerHTML = `<div class="dm-section-title mt-8">Because You Liked This</div>
            <div class="dm-similar">${items.map(i => this._card(i)).join('')}</div>`;
          this._wireCards(sec);
        }
      });

      // wire play
      this.$('dm-play')?.addEventListener('click', () => {
        this._lastDetailPoster = d.poster_path;
        let sn = 1, ep = 1;
        if (type === 'tv') {
          const res = this._getResumeEpisode(id);
          sn = res.sn; ep = res.ep;
        }
        this.openPlayer(d.id, type, type === 'tv' ? sn : null, type === 'tv' ? ep : null, title, d.poster_path, d.vote_average, dateStr, certForPlayer);
      });

      // wire watchlist
      this.$('dm-wl')?.addEventListener('click', async e => {
        const btn = e.currentTarget;
        await this.toggleWL({
          id: d.id, media_type: type, title: d.title || d.name,
          poster_path: d.poster_path, release_date: dateStr,
          first_air_date: d.first_air_date, vote_average: d.vote_average
        });
        const inNow = this.wl.some(w => w.id === d.id);
        btn.classList.toggle('added', inNow);
        btn.innerHTML = inNow ? '✓ In Watchlist' : '+ Watchlist';
      });

      // wire add to playlist
      this.$('dm-add-playlist')?.addEventListener('click', () => {
        this._addToPlaylist({
          id: d.id, media_type: type, title: d.title || d.name,
          poster_path: d.poster_path, release_date: dateStr,
          first_air_date: d.first_air_date, vote_average: d.vote_average
        });
      });

      // wire trailer
      this.$('dm-trailer')?.addEventListener('click', e => {
        const key = e.currentTarget.dataset.yt;
        this.closeModal();
        this._openTrailer(key, title);
      });

      // wire season selector
      if (type === 'tv') {
        const loadSeason = async sn => {
          const epDiv = this.$('dm-episodes');
          epDiv.innerHTML = '<div class="spinner"></div>';
          try {
            const sData = await this.api.season(d.id, sn);
            epDiv.innerHTML = (sData.episodes || []).map(ep => `
              <div class="dm-episode" data-ep="${ep.episode_number}" data-sn="${sn}">
                <img class="dm-ep-still" src="${ep.still_path ? backdrop(ep.still_path, 'sm') : noPoster()}" loading="lazy"/>
                <div class="dm-ep-info">
                  <div class="dm-ep-num">Episode ${ep.episode_number}</div>
                  <div class="dm-ep-name">${esc(ep.name || '')}</div>
                  <div class="dm-ep-overview">${esc(ep.overview || '')}</div>
                </div>
                <button class="dm-ep-play">${PLAY_SVG}</button>
              </div>`).join('');
            epDiv.querySelectorAll('.dm-episode').forEach(el => {
              el.addEventListener('click', () => {
                this._lastDetailPoster = d.poster_path;
                this.openPlayer(d.id, 'tv', +el.dataset.sn, +el.dataset.ep, `${title} S${el.dataset.sn}E${el.dataset.ep}`, d.poster_path, d.vote_average, dateStr, certForPlayer);
              });
            });
          } catch { epDiv.innerHTML = '<p style="color:var(--c3)">Failed to load episodes.</p>' }
        };
        const st = this.$('dm-season-tabs');
        st?.addEventListener('click', e => {
          const c = e.target.closest('.genre-chip');
          if (!c) return;
          st.querySelectorAll('.genre-chip').forEach(x => x.classList.remove('active'));
          c.classList.add('active');
          loadSeason(+c.dataset.sn);
        });
        loadSeason(1);
      }

      // wire cast arrows
      const castList = this.$('dm-cast-list');
      this.$('dm-cast-l')?.addEventListener('click', () => castList.scrollBy({ left: -300, behavior: 'smooth' }));
      this.$('dm-cast-r')?.addEventListener('click', () => castList.scrollBy({ left: 300, behavior: 'smooth' }));

      // wire cast items to open actor pages
      castList?.querySelectorAll('.dm-cast-item').forEach(item => {
        item.addEventListener('click', () => {
          const personId = item.dataset.personId;
          if (personId) {
            this._prevPage = this.page;
            this.closeModal();
            this.renderActorPage(+personId);
          }
        });
      });

      // wire similar cards
      this._wireCards(body);

    } catch (e) {
      console.error(e);
      body.innerHTML = '<div class="error-state"><h3>Failed to load details</h3></div>';
    }
  }

  closeModal() {
    clearInterval(this._detailFinishInterval);
    this._detailFinishInterval = null;
    const m = this.$('detail-modal');
    m.classList.remove('visible');
    setTimeout(() => m.classList.add('hidden'), 400);
  }

  /* ══════════════════════════ PLAYER ═════════════════════════ */
  _wakePlayerControls() {
    const po = this.$('player-overlay');
    if (!po) return;
    po.classList.add('show-controls');
    clearTimeout(this._playerControlsTimer);
    this._playerControlsTimer = setTimeout(() => {
      po.classList.remove('show-controls');
    }, 3000);
  }

  openPlayer(id, type, season, episode, title, poster, rating, date, certification = '', opts = {}) {
    const s = this.settings;
    const progKey = type === 'tv' ? `tv-${id}-s${season}e${episode}` : `movie-${id}`;
    this._currentPlayerKey = progKey;
    const saved = this.prog[progKey];
    let progressSec = 0;
    
    // Always preserve progress for continue watching items (forceAutoplay = true)
    if (opts.forceAutoplay && saved?.currentTime) {
      progressSec = Math.floor(saved.currentTime);
      console.log(`[Player] Continue watching item - resuming from ${progressSec}s`);
    } else {
      progressSec = saved?.currentTime && saved.pct < .98 ? Math.floor(saved.currentTime) : 0;
    }

    const forceAutoplay = opts.forceAutoplay === true;
    const autoPlayEmbed = forceAutoplay ? true : !!s.autoPlay;
    this._playerForceAutoplay = forceAutoplay;

    console.log(`[Player] 🎬 Initializing ${type} ${id} | Key: ${progKey} | Resume: ${progressSec}s | Saved: ${JSON.stringify(saved)} | ForceAutoplay: ${forceAutoplay}`);
    this._lastVideoId = id; this._lastVideoType = type;
    this._lastVideoSn = season; this._lastVideoEp = episode;

    this.$('player-loader').classList.remove('hidden');

    const apExtra = forceAutoplay ? '&autoplay=1' : '';
    let url;
    if (type === 'tv') {
      const progressParam = (opts.forceAutoplay && progressSec > 0) ? '' : `&progress=${progressSec}`;
      url = `${CFG.VK}/tv/${id}/${season}/${episode}?color=${s.playerColor}&autoPlay=${autoPlayEmbed}&nextEpisode=${s.nextEpisode}&episodeSelector=${s.episodeSelector}${progressParam}${apExtra}`;
    } else {
      const progressParam = (opts.forceAutoplay && progressSec > 0) ? '' : `&progress=${progressSec}`;
      url = `${CFG.VK}/movie/${id}?color=${s.playerColor}&autoPlay=${autoPlayEmbed}${progressParam}${apExtra}`;
    }

    this.$('player-iframe').src = url;
    this.$('player-title').textContent = title || '';
    this.$('player-overlay').classList.remove('hidden');
    
    // Initialize playback state
    this._playerIsPlaying = false;
    
    // Enhanced mouse event handling for player controls
    this.$('player-overlay').onmousemove = () => this._wakePlayerControls();
    this.$('player-overlay').addEventListener('mouseenter', () => this._wakePlayerControls());
    
    // Add click handler for pause/play
    this.$('player-overlay').addEventListener('click', (e) => {
      // Don't pause if clicking on controls
      if (e.target.closest('.player-topbar')) return;
      
      // Toggle pause/play by sending message to iframe
      const iframe = document.getElementById('player-iframe');
      if (iframe?.contentWindow) {
        // Check current playback state by tracking if we've received play/pause events
        const isPlaying = this._playerIsPlaying || false;
        const action = isPlaying ? 'pause' : 'play';
        
        iframe.contentWindow.postMessage({
          type: 'remoteControl',
          action: action
        }, '*');
        
        // Update our tracking (will be corrected by actual playback events)
        this._playerIsPlaying = !isPlaying;
      }
    });
    
    // Also listen for mousemove from iframe (VidKing sends these events)
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'solarMouseMove') {
        this._wakePlayerControls();
      }
    });
    
    // Show loader for continue watching items since they need to buffer
    if (opts.forceAutoplay && progressSec > 0) {
      this.$('player-loader').classList.remove('hidden');
      console.log(`[Player] Showing loader for continue watching seek to ${progressSec}s`);
    }
    
    this.closeModal();

    [400, 1500, 3500, 8000].forEach(ms => {
      setTimeout(() => { 
        try { window.electronAPI.player.injectProgressTracker(); } catch (e) { /* noop */ }
        try { window.electronAPI.player.injectCustomScrollbars(); } catch (e) { /* noop */ }
      }, ms);
    });

    // save to history
    this._addHistory({ id, type, title, season, episode, ts: Date.now() });

    // Ensure a progress entry exists so the listener can update it immediately.
    // pct stays 0 until the iframe reports time/duration (avoids a fake 1% bar on cards).
    if (!this.prog[progKey]) {
      this.prog[progKey] = {
        id, type, title, season, episode, currentTime: progressSec, duration: 0,
        pct: progressSec > 0 ? Math.min(0.91, Math.max(0, saved?.pct || 0)) : 0, ts: Date.now(),
        poster: poster || this._lastDetailPoster || '',
        vote_average: rating || 0,
        release_date: date || '',
        ...(certification ? { certification } : {})
      };
      this.store.saveProg(this.prog);
    } else {
      if (certification && !this.prog[progKey].certification) {
        this.prog[progKey].certification = certification;
        this.store.saveProg(this.prog);
      }
    }
    this.$('player-back').onclick = () => this.closePlayer();
    
    // Auto-wake controls once when player opens
    this._wakePlayerControls();
  }

  closePlayer() {
    clearTimeout(this._playerControlsTimer);
    this.$('player-overlay').onmousemove = null;
    this.$('player-overlay').classList.add('hidden');
    this.$('player-iframe').src = '';
    this.$('player-loader').classList.add('hidden');
    this._currentPlayerKey = null;
    this._playerForceAutoplay = false;
    if (this.page === 'home') this.renderHome();
  }

  _openTrailer(ytKey, title) {
    this._playerForceAutoplay = false;
    this.$('player-loader').classList.remove('hidden');
    this.$('player-iframe').src = `https://www.youtube.com/embed/${ytKey}?autoplay=1&rel=0&origin=https://www.google.com`;
    this.$('player-title').textContent = `${title} – Trailer`;
    this.$('player-overlay').classList.remove('hidden');
    this.$('player-back').onclick = () => this.closePlayer();
    
    // Initialize playback state
    this._playerIsPlaying = true; // YouTube trailers autoplay
    
    // Enhanced mouse event handling for player controls
    this.$('player-overlay').onmousemove = () => this._wakePlayerControls();
    this.$('player-overlay').addEventListener('mouseenter', () => this._wakePlayerControls());
    
    // Add click handler for pause/play
    this.$('player-overlay').addEventListener('click', (e) => {
      // Don't pause if clicking on controls
      if (e.target.closest('.player-topbar')) return;
      
      // Toggle pause/play by sending message to iframe
      const iframe = document.getElementById('player-iframe');
      if (iframe?.contentWindow) {
        // Check current playback state by tracking if we've received play/pause events
        const isPlaying = this._playerIsPlaying || false;
        const action = isPlaying ? 'pause' : 'play';
        
        iframe.contentWindow.postMessage({
          type: 'remoteControl',
          action: action
        }, '*');
        
        // Update our tracking (will be corrected by actual playback events)
        this._playerIsPlaying = !isPlaying;
      }
    });
    
    this._wakePlayerControls();
  }

  /* ══════════════════════════ WATCHLIST OPS ══════════════════ */
  async toggleWL(item) {
    const idx = this.wl.findIndex(w => w.id === item.id);
    if (idx >= 0) this.wl.splice(idx, 1);
    else this.wl.push({ ...item, addedAt: Date.now() });
    await this.store.saveWL(this.wl);
  }

  // Modern confirmation modal helper
  showConfirm(options = {}) {
    return new Promise((resolve) => {
      const { title = 'Are you sure?', message = 'This action cannot be undone.', confirmText = 'Confirm', cancelText = 'Cancel' } = options;
      
      const modal = this.$('confirm-modal');
      const titleEl = this.$('cm-title');
      const messageEl = this.$('cm-message');
      const confirmBtn = this.$('cm-confirm');
      const cancelBtn = this.$('cm-cancel');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      confirmBtn.textContent = confirmText;
      
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('visible'), 10);
      
      const cleanup = () => {
        modal.classList.remove('visible');
        setTimeout(() => modal.classList.add('hidden'), 300);
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        document.removeEventListener('keydown', onKeydown);
      };
      
      const onConfirm = () => {
        cleanup();
        resolve(true);
        sfx.click();
      };
      
      const onCancel = () => {
        cleanup();
        resolve(false);
        sfx.click();
      };
      
      const onKeydown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        }
      };
      
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      document.addEventListener('keydown', onKeydown);
      
      // Focus the confirm button for better UX
      setTimeout(() => confirmBtn.focus(), 100);
    });
  }

  /* ══════════════════════════ HISTORY OPS ════════════════════ */
  async _addHistory(entry) {
    this.hist = this.hist.filter(h => !(h.id === entry.id && h.type === entry.type && h.season === entry.season && h.episode === entry.episode));
    this.hist.unshift(entry);
    if (this.hist.length > 200) this.hist.length = 200;
    await this.store.saveHist(this.hist);
  }

  /* ══════════════════════════ CONTINUE WATCHING ═════════════ */
  _continueWatching() {
    const entries = Object.entries(this.prog || {})
      .filter(([k, v]) => {
        const p = v.pct;
        const hasProgress = (p != null && p > 0) || (v.currentTime || 0) > 0;
        return hasProgress && (p == null || p < 0.92);
      })
      .sort((a, b) => b[1].ts - a[1].ts);

    const seen = new Set();
      const grouped = [];
    for (const [key, v] of entries) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      grouped.push({
        id: v.id, title: v.title, poster_path: v.poster || '',
        media_type: v.type, vote_average: v.vote_average || 0,
        release_date: v.release_date || '', first_air_date: v.release_date || '',
        _progress: v.pct, _duration: v.duration || 0, _currentTime: v.currentTime || 0,
        _cert: v.certification || '',
        _key: key, _season: v.season, _episode: v.episode
      });
    }
    return grouped.slice(0, 20);
  }

  _getResumeEpisode(tvId) {
    const entries = Object.entries(this.prog || {})
      .filter(([k, v]) => v.id === tvId && v.type === 'tv')
      .sort((a, b) => b[1].ts - a[1].ts);
    if (entries.length) return { sn: entries[0][1].season || 1, ep: entries[0][1].episode || 1 };
    return { sn: 1, ep: 1 };
  }

  /** Drop progress for one title only (strict keys + entry match; never other shows/movies). */
  _stripProgressForMedia(id, type) {
    const idStr = String(id);
    const idNum = Number(idStr);
    const idOk = idStr !== '' && Number.isFinite(idNum);
    const next = {};
    const src = this.prog || {};
    for (const k of Object.keys(src)) {
      const entry = src[k];
      let drop = false;

      if (type === 'movie' && idOk) {
        if (k === `movie-${idNum}` || k === `movie-${idStr}`) drop = true;
        else if (entry && entry.type === 'movie' && Number(entry.id) === idNum) drop = true;
      } else if (type === 'tv' && idOk) {
        const tvKey = new RegExp(`^tv-${idNum}-`);
        if (tvKey.test(k)) drop = true;
        else if (entry && entry.type === 'tv' && Number(entry.id) === idNum) drop = true;
      }

      if (drop) continue;
      if (entry) next[k] = entry;
    }
    return next;
  }

  _certificationFromDetail(d, type) {
    if (type === 'movie') {
      const release = (d.release_dates?.results || []).find(r => r.iso_3166_1 === 'US') || d.release_dates?.results?.[0];
      return release?.release_dates?.[0]?.certification || '';
    }
    const content = (d.content_ratings?.results || []).find(r => r.iso_3166_1 === 'US') || d.content_ratings?.results?.[0];
    return content?.rating || '';
  }

  /** Typical length in minutes for detail "Finishes at" (movie runtime or TV episode average). */
  _estimateDurationMinutes(d, type) {
    if (type === 'movie' && d.runtime) return d.runtime;
    if (type === 'tv' && d.episode_run_time?.length) {
      const sum = d.episode_run_time.reduce((a, b) => a + b, 0);
      return sum / d.episode_run_time.length;
    }
    return 0;
  }

  /**
   * Milliseconds remaining until the end of the current title if playback continues from saved progress,
   * or full length if no usable progress. Returns null if duration is unknown.
   */
  _remainingMsForDetailPlayback(d, type, id) {
    const estMin = this._estimateDurationMinutes(d, type);
    if (type === 'movie') {
      const p = this.prog[`movie-${id}`];
      if (p?.duration > 0 && p.currentTime != null) {
        const left = (p.duration - p.currentTime) * 1000;
        return Math.max(0, left);
      }
      if (estMin > 0) return estMin * 60 * 1000;
      return null;
    }
    const { sn, ep } = this._getResumeEpisode(id);
    const p = this.prog[`tv-${id}-s${sn}e${ep}`];
    if (p?.duration > 0 && p.currentTime != null) {
      const left = (p.duration - p.currentTime) * 1000;
      return Math.max(0, left);
    }
    if (estMin > 0) return estMin * 60 * 1000;
    return null;
  }

  _updateDetailFinishesAt(d, type, id) {
    clearInterval(this._detailFinishInterval);
    this._detailFinishInterval = null;
    const el = this.$('dm-finishes-at');
    if (!el) return;
    const tick = () => {
      const ms = this._remainingMsForDetailPlayback(d, type, id);
      if (ms == null || ms <= 0) {
        el.textContent = '';
        el.classList.add('hidden');
        return;
      }
      el.classList.remove('hidden');
      const fin = new Date(Date.now() + ms);
      el.textContent = `Finishes at ${formatFinishesAtTime(fin)}`;
    };
    tick();
    this._detailFinishInterval = setInterval(tick, 30000);
  }

  async _enrichContinueWatching(items) {
    return Promise.all(items.map(async (item) => {
      if (item._cert) return item;
      try {
        const d = await this.api.details(item.media_type, item.id);
        item._cert = this._certificationFromDetail(d, item.media_type);
      } catch (e) { console.error(e); }
      return item;
    }));
  }

  /* ══════════════════════════ HTML BUILDERS ══════════════════ */

  /* ── Hero ── */
  _hero(items) {
    const slides = items.map((it, i) => {
      const t = it.title || it.name;
      const mt = mediaType(it);
      return `<div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image:url('${backdrop(it.backdrop_path)}')" data-id="${it.id}" data-type="${mt}" data-poster="${it.poster_path || ''}" data-rating="${it.vote_average || 0}" data-date="${it.release_date || it.first_air_date || ''}">` +
        `<div class="hero-gradient"></div><div class="hero-content"><h1 class="hero-title">${esc(t)}</h1><div class="hero-meta"><span class="rating">${STAR_SVG} ${rating(it.vote_average)}</span><span>${year(it.release_date || it.first_air_date)}</span><span style="text-transform:uppercase;font-size:11px;font-weight:600;opacity:.6">${mt}</span></div>` +
        `<p class="hero-overview">${esc(it.overview || '')}</p><div class="hero-btns"><button class="btn-play hero-play" data-id="${it.id}" data-type="${mt}" data-title="${esc(t)}">${PLAY_SVG} Play</button><button class="btn-info hero-info" data-id="${it.id}" data-type="${mt}">ℹ More Info</button></div></div></div>`;
    }).join('');
    const dots = items.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></div>`).join('');
    return `<div class="hero page-animate">${slides}<div class="hero-dots">${dots}</div></div>`;
  }

  _heroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (slides.length < 2) return;
    let cur = 0;
    const go = n => {
      slides.forEach((s, i) => s.classList.toggle('active', i === n));
      dots.forEach((d, i) => { d.classList.toggle('active', i === n) });
      cur = n;
    };
    this.heroTimer = setInterval(() => go((cur + 1) % slides.length), 7000);
    dots.forEach(d => d.addEventListener('click', () => { clearInterval(this.heroTimer); go(+d.dataset.i); this.heroTimer = setInterval(() => go((cur + 1) % slides.length), 7000) }));

    // hero buttons
    document.querySelectorAll('.hero-play').forEach(b => b.addEventListener('click', () => {
      const item = [...slides].find(s => s.dataset.id === b.dataset.id);
      this._lastDetailPoster = item?.dataset.poster || '';
      this.openPlayer(+b.dataset.id, b.dataset.type, b.dataset.type === 'tv' ? 1 : null, b.dataset.type === 'tv' ? 1 : null, b.dataset.title, item?.dataset.poster, +item?.dataset.rating, item?.dataset.date);
    }));
    document.querySelectorAll('.hero-info').forEach(b => b.addEventListener('click', () => {
      this.showDetail(+b.dataset.id, b.dataset.type);
    }));
  }

  /** Live "Finishes at …" on Continue Watching cards (uses this.prog; updates every 1s + on progress events). */
  _updateCwFinishLabels() {
    if (this.page !== 'home') return;
    document.querySelectorAll('.card.card--cw').forEach(card => {
      const el = card.querySelector('.card-finishes-at');
      if (!el) return;
      const id = card.dataset.id;
      const type = card.dataset.type;
      const key = card.dataset.key;
      const sn = card.dataset.sn ? +card.dataset.sn : 1;
      const ep = card.dataset.ep ? +card.dataset.ep : 1;
      const k = key || (type === 'tv' ? `tv-${id}-s${sn}e${ep}` : `movie-${id}`);
      const p = this.prog[k];
      if (!p) {
        el.textContent = '';
        el.classList.add('hidden');
        return;
      }
      const dur = p.duration || 0;
      const ct = Number(p.currentTime);
      const ctSafe = Number.isFinite(ct) ? ct : 0;
      if (dur <= 0) {
        el.textContent = '';
        el.classList.add('hidden');
        return;
      }
      const remainingSec = Math.max(0, dur - ctSafe);
      if (remainingSec <= 0) {
        el.textContent = '';
        el.classList.add('hidden');
        return;
      }
      const finish = new Date(Date.now() + remainingSec * 1000);
      el.textContent = `Finishes at ${formatFinishesAtTime(finish)}`;
      el.classList.remove('hidden');
    });
  }

  /* ── Row ── */
  _row(title, items, showProgress = false, api = '', genre = '') {
    if (!items && !api) return '';
    const cards = (items || []).map(i => this._card(i, showProgress)).join('');
    const hasFilters = api && api !== 'raw';
    
    return `
      <div class="content-row page-animate" data-api="${api}" data-genre="${genre}" data-progress="${showProgress}">
        <div class="row-header">
          <div style="display:flex;align-items:center;gap:16px">
            <h2 class="row-title">${title}</h2>
            ${hasFilters ? `
              <div class="row-filters">
                <button class="row-filter-btn active" data-type="all">All</button>
                <button class="row-filter-btn" data-type="movie">Movies</button>
                <button class="row-filter-btn" data-type="tv">TV Shows</button>
              </div>
            ` : ''}
          </div>
          <div class="row-arrows">
            <button class="row-arrow row-left"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button class="row-arrow row-right"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
        </div>
        <div class="row-slider">${cards}</div>
      </div>`;
  }

  _card(item, showProgress = false) {
    const t = item.title || item.name || '';
    const mt = mediaType(item);
    const d = item.release_date || item.first_air_date || '';
    const dur = item._duration || 0;
    const ct = item._currentTime || 0;
    let rawPct = item._progress || 0;
    
    // Sn / Ep extraction
    const sn = item._season || (item.media_type === 'tv' ? 1 : '');
    const ep = item._episode || (item.media_type === 'tv' ? 1 : '');
    const isTv = mt === 'tv';
    let epLabel = '';
    
    if (showProgress && isTv && item._season) {
      epLabel = `<div class="card-ep-label">S${item._season} E${item._episode}</div>`;
    }

    if (dur <= 0 && rawPct > 0 && rawPct <= 0.011 && (ct || 0) < 0.5) rawPct = 0;
    const pctFromTime = dur > 0 ? Math.min(1, ct / dur) : null;
    const pct = pctFromTime != null ? pctFromTime : rawPct;
    const pctW = Math.min(100, Math.max(0, Math.round(pct * 1000) / 10));
    
    const progressLabel = dur > 0
      ? `${formatSecsClock(ct)} / ${formatSecsClock(dur)}`
      : (pct > 0 ? `${Math.round(pct * 100)}% watched` : '');
      
    // The "Finishes at X" will be populated by `_updateCwFinishLabels` polling
    const progressFoot = showProgress
      ? `<div class="card-progress-wrap">
          <div class="card-progress-track"><div class="card-progress-fill" style="width:${pctW}%"></div></div>
          ${progressLabel ? `<div class="card-progress-text">${progressLabel}</div>` : ''}
          <div class="card-finishes-at hidden" aria-live="polite"></div>
        </div>`
      : '';
    
    return `<div class="card${showProgress ? ' card--cw' : ''}" data-id="${item.id}" data-type="${mt}" data-sn="${sn}" data-ep="${ep}" data-poster="${item.poster_path || ''}" data-rating="${item.vote_average || 0}" data-date="${d || ''}" data-key="${item._key || ''}">` +
      `<div class="card-poster"><img src="${poster(item.poster_path)}" alt="${esc(t)}" loading="lazy" onerror="this.src='${noPoster()}'"/><div class="card-overlay"><button type="button" class="card-play">${PLAY_SVG}</button></div></div>` +
      `<div class="card-info"><div class="card-title">${esc(t)}</div>${epLabel}<div class="card-meta"><span>${year(d)}</span>${item.vote_average ? `<span class="star">${STAR_SVG} ${rating(item.vote_average)}</span>` : ''}</div>${progressFoot}</div></div>`;
  }
  _wireCards(container) {
    container.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', async e => {
        const isCw = card.classList.contains('card--cw');
        const id = +card.dataset.id;
        const type = card.dataset.type;
        let sn = card.dataset.sn ? +card.dataset.sn : (type === 'tv' ? 1 : null);
        let ep = card.dataset.ep ? +card.dataset.ep : (type === 'tv' ? 1 : null);

        if (type === 'tv' && !isCw && (!card.dataset.sn || (sn === 1 && ep === 1))) {
          const res = this._getResumeEpisode(id);
          sn = res.sn; ep = res.ep;
        }

        const t = card.querySelector('.card-title')?.textContent || '';

        if (e.target.closest('.card-play')) {
          this._lastDetailPoster = card.dataset.poster || '';
          const playOpts = isCw ? { forceAutoplay: true } : {};
          this.openPlayer(id, type, sn, ep, t, card.dataset.poster, +card.dataset.rating, card.dataset.date, '', playOpts);
        } else {
          this.showDetail(+card.dataset.id, card.dataset.type);
        }
      });
    });
  }

  /* ── Wire rows ── */
  _wireRows(container) {
    container.querySelectorAll('.content-row').forEach(row => {
      const slider = row.querySelector('.row-slider');
      const lBtn = row.querySelector('.row-left');
      const rBtn = row.querySelector('.row-right');
      const scrollAmt = () => slider.clientWidth * 0.75;
      lBtn?.addEventListener('click', () => slider.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }));
      rBtn?.addEventListener('click', () => slider.scrollBy({ left: scrollAmt(), behavior: 'smooth' }));
    });
    this._wireRowFilters(container);
  }

  _wireRowFilters(container) {
    container.querySelectorAll('.row-filter-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('.content-row');
        if (btn.classList.contains('active')) return;
        
        row.querySelectorAll('.row-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        await this._refreshRow(row, btn.dataset.type);
      });
    });
  }

  _getCorrectGenreId(gidStr, type) {
    if (!gidStr) return '';
    return gidStr.toString().split(',').map(s => {
      let gid = parseInt(s.trim());
      if (!gid) return s;
      if (type === 'tv') {
        if (gid === 28 || gid === 12) return 10759; // Action/Adventure -> Action & Adventure
        if (gid === 27 || gid === 878) return 10765; // Horror/Sci-Fi -> Sci-Fi & Fantasy
        if (gid === 10752) return 10768; // War -> War & Politics
      } else {
        if (gid === 10759) return 28; // Action & Adventure -> Action
        if (gid === 10765) return 878; // Sci-Fi & Fantasy -> Sci-Fi
        if (gid === 10768) return 10752; // War & Politics -> War
      }
      return gid;
    }).join(',');
  }

  async _refreshRow(row, type) {
    const slider = row.querySelector('.row-slider');
    const titleEl = row.querySelector('.row-title');
    const api = row.dataset.api;
    let genre = row.dataset.genre;
    const showProgress = row.dataset.progress === 'true';
    
    // Update Title
    if (titleEl) {
      let base = titleEl.textContent.split(' Movie')[0].split(' TV Show')[0].split(' (Movie')[0].split(' (TV Show')[0];
      if (type === 'movie') titleEl.textContent = base + ' Movies';
      else if (type === 'tv') titleEl.textContent = base + ' TV Shows';
      else titleEl.textContent = base;
    }

    slider.style.opacity = '0.5';
    try {
      let results = [];
      if (api === 'trending') {
        const data = await this.api.trending(type === 'all' ? 'all' : type);
        results = data.results;
      } else if (api === 'popular') {
        const data = await this.api.popular(type === 'all' ? (genre === 'tv' ? 'tv' : 'movie') : type);
        results = data.results;
      } else if (api === 'topRated') {
        const data = await this.api.topRated(type === 'all' ? 'movie' : type);
        results = data.results;
      } else if (api === 'nowPlaying') {
        let data;
        if (type === 'tv') {
          const today = new Date().toISOString().split('T')[0];
          data = await this.api.discover('tv', { 'first_air_date.lte': today, sort_by: 'first_air_date.desc' });
        } else {
          data = await this.api.nowPlaying();
        }
        results = data.results;
      } else if (api === 'discover') {
        const targetType = type === 'all' ? 'movie' : type;
        const mappedGenre = this._getCorrectGenreId(genre, targetType);
        const data = await this.api.discover(targetType, { with_genres: mappedGenre, sort_by: 'popularity.desc' });
        results = data.results;
      }
      
      if (results && results.length) {
        slider.innerHTML = results.map(i => this._card(i, showProgress)).join('');
        this._wireCards(slider);
        slider.scrollLeft = 0;
      } else {
        slider.innerHTML = '<p style="padding:20px;color:var(--c3);font-size:12px;text-align:center">No content found for this category</p>';
      }
    } catch (e) {
      console.error(e);
    } finally {
      slider.style.opacity = '1';
    }
  }

  /* ── Skeletons ── */
  _skelPage() {
    const skelCards = Array(8).fill('<div class="skel skel-card"></div>').join('');
    return `<div class="skel skel-hero page-animate"></div><div class="content-row page-animate"><div class="row-header"><div class="skel skel-text w40" style="height:20px"></div></div><div class="row-slider">${skelCards}</div></div><div class="content-row page-animate"><div class="row-header"><div class="skel skel-text w40" style="height:20px"></div></div><div class="row-slider">${skelCards}</div></div>`;
  }

  /* ── Error / No key ── */
  _errorHTML(msg) {
    return `<div class="error-state page-animate">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <h3>Something went wrong</h3><p>${msg}</p><button class="btn-retry">Retry</button></div>`;
  }

  _noKeyHTML() {
    return `<div class="error-state page-animate">
      <svg viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h3>API Key Required</h3>
      <p>Please add your TMDB API key in Settings to start browsing.</p>
      <button class="btn-retry">Open Settings</button></div>`;
  }

  /* ══════════════════════════ SMART HOME HELPERS ═══════════════ */

  /** Analyze watch history to find top genres, then fetch genre-based rows for the home page. */
  async _genreBasedRows() {
    const rows = [];
    try {
      const genreCounts = {};
      // Analyze recent history to find top genres
      const recentHist = (this.hist || []).slice(0, 30);
      for (const h of recentHist) {
        try {
          const d = await this.api.details(h.type || 'movie', h.id);
          const genres = d.genres || [];
          for (const g of genres) {
            genreCounts[g.id] = (genreCounts[g.id] || 0) + 1;
            if (!genreCounts[`_name_${g.id}`]) genreCounts[`_name_${g.id}`] = g.name;
          }
        } catch (e) { /* skip */ }
      }

      // Get top 2 genres (exclude ones already shown as static rows)
      const staticGenres = [28, 27, 12, 878, 16, 10751]; // Action, Horror, Adventure, SciFi, Animation, Family
      const sorted = Object.entries(genreCounts)
        .filter(([k]) => !k.startsWith('_name_') && !staticGenres.includes(parseInt(k)))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      for (const [gid] of sorted) {
        const name = genreCounts[`_name_${gid}`];
        if (!name) continue;
        try {
          const data = await this.api.discover('movie', { with_genres: gid, sort_by: 'popularity.desc' });
          if (data.results?.length) {
            rows.push({ title: `Because You Watched ${name}`, items: data.results.slice(0, 20), genreId: gid });
          }
        } catch (e) { /* skip */ }
      }
    } catch (e) { console.warn('Genre rows failed', e); }
    return rows;
  }

  /** Fetch newly released content filtered by user's preferred genres. */
  async _recentlyAddedYouMightLike() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const data = await this.api.discover('movie', {
        sort_by: 'release_date.desc',
        'primary_release_date.gte': monthAgo,
        'primary_release_date.lte': today,
        'vote_count.gte': 10
      });
      return (data.results || []).slice(0, 20);
    } catch (e) { return []; }
  }

  /** Get "Because You Liked This" recommendations for a specific title (for detail modal). */
  async _becauseYouLiked(id, type) {
    try {
      const d = await this.api.details(type, id);
      const genreIds = (d.genres || []).map(g => g.id).slice(0, 2);
      if (!genreIds.length) return [];
      const data = await this.api.discover(type, {
        with_genres: genreIds.join(','),
        sort_by: 'popularity.desc',
        page: 1
      });
      return (data.results || []).filter(r => r.id !== id).slice(0, 12);
    } catch (e) { return []; }
  }

  /* ══════════════════════════ RECENTLY WATCHED ═══════════════ */
  async renderRecentlyWatched() {
    const c = this.$('content');
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header">
          <h1 class="page-title">Recently Watched</h1>
          <p class="page-subtitle">Content you've finished watching</p>
        </div>
        <div class="content-grid" id="rw-grid"><div class="spinner"></div></div>
      </div>`;

    try {
      // Get completed items from progress (pct > 0.92)
      const completed = Object.entries(this.prog || {})
        .filter(([k, v]) => v.pct && v.pct >= 0.92)
        .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));

      const seen = new Set();
      const items = [];
      for (const [key, v] of completed) {
        if (seen.has(v.id)) continue;
        seen.add(v.id);
        items.push({
          id: v.id, title: v.title, poster_path: v.poster || '',
          media_type: v.type, vote_average: v.vote_average || 0,
          release_date: v.release_date || '', first_air_date: v.release_date || ''
        });
      }

      // Also check history for items without progress
      for (const h of this.hist || []) {
        if (seen.has(h.id)) continue;
        const progKey = h.type === 'tv' ? `tv-${h.id}-s${h.season || 1}e${h.episode || 1}` : `movie-${h.id}`;
        const prog = this.prog[progKey];
        if (prog && prog.pct >= 0.92) {
          seen.add(h.id);
          items.push({
            id: h.id, title: h.title, poster_path: prog.poster || '',
            media_type: h.type, vote_average: prog.vote_average || 0,
            release_date: prog.release_date || '', first_air_date: prog.release_date || ''
          });
        }
      }

      const grid = this.$('rw-grid');
      if (!items.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <h3>Nothing here yet</h3><p>Content you've finished watching will appear here.</p>
          </div>`;
        return;
      }

      grid.innerHTML = items.map(i => this._card(i)).join('');
      this._wireCards(grid);
    } catch (e) {
      console.error(e);
      this.$('rw-grid').innerHTML = '<p style="color:var(--c3)">Failed to load recently watched.</p>';
    }
  }

  /* ══════════════════════════ RECENTLY ADDED ═══════════════ */
  async renderRecentlyAdded() {
    const c = this.$('content');
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header">
          <h1 class="page-title">Recently Added</h1>
          <p class="page-subtitle">Newly released movies and TV shows</p>
        </div>
        <div class="genre-bar" id="ra-tabs">
          <button class="genre-chip active" data-tab="movies">Movies</button>
          <button class="genre-chip" data-tab="tv">TV Shows</button>
        </div>
        <div class="content-grid" id="ra-grid"><div class="spinner"></div></div>
      </div>`;

    let activeTab = 'movies';

    const loadTab = async (tab) => {
      const grid = this.$('ra-grid');
      grid.innerHTML = '<div class="spinner"></div>';
      try {
        const today = new Date().toISOString().split('T')[0];
        const monthAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let data;
        if (tab === 'movies') {
          data = await this.api.discover('movie', {
            sort_by: 'release_date.desc',
            'primary_release_date.gte': monthAgo,
            'primary_release_date.lte': today,
            'vote_count.gte': 5
          });
        } else {
          data = await this.api.discover('tv', {
            sort_by: 'first_air_date.desc',
            'first_air_date.gte': monthAgo,
            'first_air_date.lte': today,
            'vote_count.gte': 5
          });
        }

        const items = data.results || [];
        if (!items.length) {
          grid.innerHTML = '<div class="empty-state"><h3>No recent additions found</h3></div>';
          return;
        }
        grid.innerHTML = items.map(i => this._card(i)).join('');
        this._wireCards(grid);
      } catch (e) {
        grid.innerHTML = '<p style="color:var(--c3)">Failed to load.</p>';
      }
    };

    this.$('ra-tabs')?.addEventListener('click', e => {
      const chip = e.target.closest('.genre-chip');
      if (!chip) return;
      this.$('ra-tabs').querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeTab = chip.dataset.tab;
      loadTab(activeTab);
    });

    loadTab('movies');
  }

  /* ══════════════════════════ PLAYLISTS ═══════════════════════ */
  async renderPlaylists() {
    const c = this.$('content');
    const pl = await this.store.playlists();

    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">
          <div>
            <h1 class="page-title">My Playlists</h1>
            <p class="page-subtitle">${pl.length} playlist${pl.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="dm-btn dm-btn-play" id="pl-create-btn">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Create Playlist
          </button>
        </div>
        <div id="pl-grid" class="content-grid">
          ${pl.length ? pl.map(p => this._playlistCard(p)).join('') : `
            <div class="empty-state">
              <svg viewBox="0 0 24 24"><path d="M3 6h18M3 10h12M3 14h18M3 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <h3>No playlists yet</h3><p>Create your first playlist to organize your favorite content.</p>
            </div>
          `}
        </div>
      </div>`;

    this.$('pl-create-btn')?.addEventListener('click', () => this._showPlaylistEditor());
    this._wirePlaylistCards(c);
  }

  _playlistCard(pl) {
    const count = (pl.items || []).length;
    const privacyIcon = pl.isPublic ? '' : '';
    const firstPoster = pl.items?.[0]?.poster_path;
    const bgStyle = firstPoster ? `background-image:url('${poster(firstPoster)}');background-size:cover;background-position:center` : 'background:var(--bg-2)';
    return `
      <div class="card playlist-card" data-plid="${pl.id}">
        <div class="card-poster" style="${bgStyle}">
          <div class="card-overlay"><button type="button" class="card-play">${PLAY_SVG}</button></div>
        </div>
        <div class="card-info">
          <div class="card-title">${esc(pl.title)}</div>
          <div class="card-meta">
            <span>${pl.isPublic ? 'Public' : 'Private'}</span>
            <span>${count} item${count !== 1 ? 's' : ''}</span>
            ${pl.followers ? `<span>${pl.followers} followers</span>` : ''}
          </div>
          ${pl.description ? `<div class="card-desc" style="font-size:11px;color:var(--c3);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(pl.description)}</div>` : ''}
        </div>
      </div>`;
  }

  _wirePlaylistCards(container) {
    container.querySelectorAll('.playlist-card').forEach(card => {
      card.addEventListener('click', () => {
        this._renderPlaylistDetail(card.dataset.plid);
      });
    });
  }

  async _renderPlaylistDetail(plId) {
    const pl = (await this.store.playlists()).find(p => p.id === plId);
    if (!pl) return;

    const c = this.$('content');
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header" style="flex-direction:column;align-items:flex-start;gap:16px">
          <button class="btn-back" id="pl-back">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Back to Playlists
          </button>
          <div style="display:flex;justify-content:space-between;width:100%;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
              <h1 class="page-title">${esc(pl.title)}</h1>
              ${pl.description ? `<p class="page-subtitle">${esc(pl.description)}</p>` : ''}
              <div style="display:flex;gap:10px;margin-top:8px;font-size:12px;color:var(--c3)">
                <span>${pl.isPublic ? 'Public' : 'Private'}</span>
                <span>${(pl.items || []).length} items</span>
                ${pl.followers ? `<span>${pl.followers} followers</span>` : ''}
                ${pl.shareCode ? `<span>Share: ${pl.shareCode}</span>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="dm-btn dm-btn-wl" id="pl-edit">Edit</button>
              <button class="dm-btn dm-btn-wl" id="pl-share">Share</button>
              <button class="btn-danger" id="pl-delete">Delete</button>
            </div>
          </div>
        </div>
        <div class="content-grid" id="pl-items-grid">
          ${(pl.items || []).length ? (pl.items || []).map(i => this._card(i)).join('') : '<div class="empty-state"><h3>No items</h3><p>Add movies and shows to this playlist.</p></div>'}
        </div>
      </div>`;

    this.$('pl-back').onclick = () => this.renderPlaylists();
    this._wireCards(this.$('pl-items-grid'));

    this.$('pl-edit')?.addEventListener('click', () => this._showPlaylistEditor(pl));
    this.$('pl-share')?.addEventListener('click', async () => {
      if (!pl.shareCode) {
        pl.shareCode = this._generateRoomCode() + this._generateRoomCode().slice(0, 2);
        const pls = await this.store.playlists();
        const idx = pls.findIndex(p => p.id === pl.id);
        if (idx >= 0) { pls[idx] = pl; await this.store.savePlaylists(pls); }
      }
      navigator.clipboard.writeText(pl.shareCode);
      this.$('pl-share').textContent = 'Copied!';
      setTimeout(() => { this.$('pl-share').textContent = 'Share'; }, 2000);
    });
    this.$('pl-delete')?.addEventListener('click', async () => {
      const confirmed = await this.showConfirm({ title: 'Delete Playlist?', message: `Delete "${pl.title}"? This cannot be undone.`, confirmText: 'Delete' });
      if (confirmed) {
        let pls = await this.store.playlists();
        pls = pls.filter(p => p.id !== pl.id);
        await this.store.savePlaylists(pls);
        this.renderPlaylists();
      }
    });
  }

  async _showPlaylistEditor(existing = null) {
    const isEdit = !!existing;
    const confirmed = await new Promise(resolve => {
      const modal = this.$('confirm-modal');
      const titleEl = this.$('cm-title');
      const messageEl = this.$('cm-message');
      const confirmBtn = this.$('cm-confirm');
      const cancelBtn = this.$('cm-cancel');

      titleEl.textContent = isEdit ? 'Edit Playlist' : 'Create Playlist';
      messageEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <input type="text" id="pl-ed-title" class="pe-input" placeholder="Playlist name" value="${isEdit ? esc(existing.title) : ''}" maxlength="50" style="width:100%;padding:10px;border-radius:8px;background:var(--bg-1);border:1px solid var(--border);color:var(--c1);font-size:14px" />
          <textarea id="pl-ed-desc" placeholder="Description (optional)" maxlength="200" style="width:100%;padding:10px;border-radius:8px;background:var(--bg-1);border:1px solid var(--border);color:var(--c1);font-size:13px;resize:none;height:60px">${isEdit ? esc(existing.description || '') : ''}</textarea>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--c2);cursor:pointer">
            <input type="checkbox" id="pl-ed-public" ${isEdit && existing.isPublic ? 'checked' : ''} style="accent-color:var(--accent)" />
            Make playlist public
          </label>
        </div>`;
      confirmBtn.textContent = isEdit ? 'Save' : 'Create';

      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('visible'), 10);

      const cleanup = () => {
        modal.classList.remove('visible');
        setTimeout(() => modal.classList.add('hidden'), 300);
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
      };

      const onConfirm = async () => {
        const title = document.getElementById('pl-ed-title')?.value?.trim();
        const desc = document.getElementById('pl-ed-desc')?.value?.trim();
        const isPublic = document.getElementById('pl-ed-public')?.checked;
        if (!title) return;

        let pls = await this.store.playlists();
        if (isEdit) {
          const idx = pls.findIndex(p => p.id === existing.id);
          if (idx >= 0) { pls[idx].title = title; pls[idx].description = desc; pls[idx].isPublic = isPublic; }
        } else {
          pls.push({ id: Date.now().toString(), title, description: desc, isPublic, items: [], followers: 0, shareCode: '', createdAt: Date.now() });
        }
        await this.store.savePlaylists(pls);
        cleanup();
        resolve(true);
        this.renderPlaylists();
      };

      const onCancel = () => { cleanup(); resolve(false); };
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
    });
  }

  /** Add a media item to a playlist (called from detail modal) */
  async _addToPlaylist(item) {
    const pls = await this.store.playlists();
    if (!pls.length) {
      await this._showPlaylistEditor();
      return;
    }
    // Show playlist picker
    const names = pls.map((p, i) => `${i + 1}. ${p.title}`).join('\n');
    const modal = this.$('confirm-modal');
    const titleEl = this.$('cm-title');
    const messageEl = this.$('cm-message');
    const confirmBtn = this.$('cm-confirm');
    const cancelBtn = this.$('cm-cancel');

    titleEl.textContent = 'Add to Playlist';
    messageEl.innerHTML = `<div style="text-align:left">${pls.map(p => `
      <button class="pl-pick-btn" data-plid="${p.id}" style="display:block;width:100%;padding:10px 12px;margin:4px 0;border-radius:8px;background:var(--bg-1);border:1px solid var(--border);color:var(--c1);cursor:pointer;text-align:left;font-size:13px;transition:all 0.15s">${esc(p.title)} <span style="color:var(--c3)">(${(p.items||[]).length} items)</span></button>
    `).join('')}</div>`;
    confirmBtn.style.display = 'none';

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('visible'), 10);

    const cleanup = () => {
      modal.classList.remove('visible');
      setTimeout(() => modal.classList.add('hidden'), 300);
      confirmBtn.style.display = '';
      cancelBtn.removeEventListener('click', onCancel);
    };
    const onCancel = () => cleanup();
    cancelBtn.addEventListener('click', onCancel);

    messageEl.querySelectorAll('.pl-pick-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const plId = btn.dataset.plid;
        const pls2 = await this.store.playlists();
        const pl = pls2.find(p => p.id === plId);
        if (pl) {
          if (!pl.items.some(i => i.id === item.id)) {
            pl.items.push({ ...item, addedAt: Date.now() });
            await this.store.savePlaylists(pls2);
            btn.textContent = 'Added!';
            btn.style.borderColor = 'var(--accent)';
            setTimeout(cleanup, 800);
          } else {
            btn.textContent = 'Already in playlist';
            setTimeout(cleanup, 1000);
          }
        }
      });
    });
  }

  /* ══════════════════════════ PLAYLIST DISCOVERY ═══════════════ */
  async renderPlaylistDiscovery() {
    const c = this.$('content');
    const followed = await this.store.followedPlaylists();
    c.innerHTML = `
      <div class="page-animate">
        <div class="page-header">
          <h1 class="page-title">Discover Playlists</h1>
          <p class="page-subtitle">Find and follow playlists</p>
        </div>
        <div class="settings-group">
          <div class="settings-group-title">Follow a Playlist</div>
          <div class="setting-row" style="gap:8px">
            <input type="text" id="pd-code-input" class="pe-input" placeholder="Enter playlist share code" style="flex:1;padding:10px;border-radius:8px;background:var(--bg-1);border:1px solid var(--border);color:var(--c1)" />
            <button class="dm-btn dm-btn-play" id="pd-follow-btn">Follow</button>
          </div>
        </div>
        ${followed.length ? `
          <div class="page-header" style="margin-top:24px"><h2 class="page-title" style="font-size:20px">Followed Playlists</h2></div>
          <div class="content-grid" id="pd-followed-grid">
            ${followed.map(p => this._playlistCard(p)).join('')}
          </div>
        ` : ''}
      </div>`;

    this._wirePlaylistCards(c);
  }

  /* ══════════════════════════ ACTOR PAGE ═══════════════════════ */
  async renderActorPage(personId) {
    const c = this.$('content');
    c.innerHTML = '<div class="page-animate"><div class="spinner"></div></div>';

    try {
      const person = await this.api.personDetails(personId);
      const credits = person.combined_credits?.cast || [];
      const sortedCredits = credits
        .filter(c => c.poster_path)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      const profileImg = person.profile_path ? profile(person.profile_path) : noPoster();

      c.innerHTML = `
        <div class="page-animate">
          <div class="page-header" style="flex-direction:column;align-items:flex-start;gap:16px">
            <button class="btn-back" id="actor-back">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 12H5M12 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Back
            </button>
            <div style="display:flex;gap:24px;align-items:flex-start">
              <img src="${profileImg}" alt="${esc(person.name)}" style="width:150px;height:225px;border-radius:12px;object-fit:cover" />
              <div>
                <h1 class="page-title">${esc(person.name)}</h1>
                ${person.birthday ? `<p class="page-subtitle">Born: ${person.birthday}${person.deathday ? ` — Died: ${person.deathday}` : ''}</p>` : ''}
                ${person.place_of_birth ? `<p class="page-subtitle">${esc(person.place_of_birth)}</p>` : ''}
                ${person.biography ? `<p style="color:var(--c2);font-size:13px;line-height:1.6;max-width:600px;margin-top:12px">${esc(person.biography).slice(0, 500)}${person.biography.length > 500 ? '...' : ''}</p>` : ''}
                <p style="color:var(--c3);font-size:12px;margin-top:8px">${sortedCredits.length} known credits</p>
              </div>
            </div>
          </div>
          <div class="page-header" style="margin-top:24px"><h2 class="page-title" style="font-size:20px">Filmography</h2></div>
          <div class="content-grid" id="actor-credits-grid">
            ${sortedCredits.slice(0, 60).map(c => this._card({
              ...c,
              media_type: c.media_type || 'movie'
            })).join('')}
          </div>
        </div>`;

      this.$('actor-back').onclick = () => {
        // Go back to the previous page or home
        if (this._prevPage) this.navigate(this._prevPage);
        else this.navigate('home');
      };
      this._wireCards(this.$('actor-credits-grid'));
    } catch (e) {
      console.error(e);
      c.innerHTML = this._errorHTML('Failed to load actor details.');
      c.querySelector('.btn-retry')?.addEventListener('click', () => this.renderActorPage(personId));
    }
  }

  /* ══════════════════════════ VIEWING STATS ═══════════════════ */
  async _calculateStats() {
    const stats = { totalWatchTimeSec: 0, moviesWatched: 0, showsWatched: 0, genreCounts: {}, monthly: {} };
    const prog = this.prog || {};
    const moviesSeen = new Set();
    const showsSeen = new Set();

    for (const [key, v] of Object.entries(prog)) {
      const watchedSec = v.currentTime || 0;
      stats.totalWatchTimeSec += watchedSec;

      // Monthly tracking
      if (v.ts) {
        const d = new Date(v.ts);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!stats.monthly[monthKey]) stats.monthly[monthKey] = { watchTimeSec: 0, count: 0 };
        stats.monthly[monthKey].watchTimeSec += watchedSec;
        stats.monthly[monthKey].count++;
      }

      if (v.pct >= 0.92) {
        if (v.type === 'movie' && !moviesSeen.has(v.id)) {
          moviesSeen.add(v.id);
          stats.moviesWatched++;
        } else if (v.type === 'tv' && !showsSeen.has(v.id)) {
          showsSeen.add(v.id);
          stats.showsWatched++;
        }
      }
    }

    // Genre analysis from history
    for (const h of (this.hist || []).slice(0, 50)) {
      try {
        const d = await this.api.details(h.type || 'movie', h.id);
        for (const g of (d.genres || [])) {
          stats.genreCounts[g.name] = (stats.genreCounts[g.name] || 0) + 1;
        }
      } catch (e) { /* skip */ }
    }

    return stats;
  }

  _renderStatsSection() {
    return `
      <div class="settings-group">
        <div class="settings-group-title">Viewing Stats</div>
        <div id="stats-content" class="stats-grid">
          <div class="spinner"></div>
        </div>
        <button class="dm-btn dm-btn-wl" id="s-load-stats" style="margin-top:12px">Load My Stats</button>
        <button class="dm-btn dm-btn-wl" id="s-wrapped" style="margin-top:8px">My Wrapped</button>
      </div>`;
  }

  async _loadAndRenderStats() {
    const el = this.$('stats-content');
    if (!el) return;
    el.innerHTML = '<div class="spinner"></div>';

    const stats = await this._calculateStats();

    const totalHours = Math.floor(stats.totalWatchTimeSec / 3600);
    const totalMins = Math.floor((stats.totalWatchTimeSec % 3600) / 60);
    const topGenres = Object.entries(stats.genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const monthlyEntries = Object.entries(stats.monthly).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalHours}h ${totalMins}m</div>
          <div class="stat-label">Total Watch Time</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.moviesWatched}</div>
          <div class="stat-label">Movies Watched</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.showsWatched}</div>
          <div class="stat-label">Shows Watched</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${topGenres.length ? topGenres[0][0] : 'N/A'}</div>
          <div class="stat-label">Favorite Genre</div>
        </div>
      </div>
      ${topGenres.length ? `
        <div style="margin-top:20px">
          <h4 style="color:var(--c2);font-size:13px;margin-bottom:10px">Top Genres</h4>
          <div class="genre-bar-stats">
            ${topGenres.map(([name, count]) => `
              <div class="genre-stat-item">
                <span class="genre-stat-name">${name}</span>
                <div class="genre-stat-bar"><div class="genre-stat-fill" style="width:${Math.round(count / topGenres[0][1] * 100)}%"></div></div>
                <span class="genre-stat-count">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      ${monthlyEntries.length ? `
        <div style="margin-top:20px">
          <h4 style="color:var(--c2);font-size:13px;margin-bottom:10px">Monthly Breakdown</h4>
          ${monthlyEntries.map(([month, data]) => {
            const hrs = Math.floor(data.watchTimeSec / 3600);
            const mins = Math.floor((data.watchTimeSec % 3600) / 60);
            return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
              <span style="color:var(--c2)">${month}</span>
              <span style="color:var(--c1)">${hrs}h ${mins}m • ${data.count} sessions</span>
            </div>`;
          }).join('')}
        </div>` : ''}
    `;
  }

  async _showWrapped() {
    const stats = await this._calculateStats();
    const totalHours = Math.floor(stats.totalWatchTimeSec / 3600);
    const topGenres = Object.entries(stats.genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const modal = this.$('confirm-modal');
    this.$('cm-title').textContent = 'Your SebFlix Wrapped';
    this.$('cm-message').innerHTML = `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:48px;font-weight:900;background:linear-gradient(135deg,var(--accent),#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px">${totalHours}h</div>
        <div style="color:var(--c2);font-size:14px;margin-bottom:20px">of content watched</div>
        <div style="display:flex;gap:20px;justify-content:center;margin-bottom:20px">
          <div><div style="font-size:24px;font-weight:700;color:var(--accent)">${stats.moviesWatched}</div><div style="font-size:11px;color:var(--c3)">Movies</div></div>
          <div><div style="font-size:24px;font-weight:700;color:var(--accent)">${stats.showsWatched}</div><div style="font-size:11px;color:var(--c3)">Shows</div></div>
        </div>
        ${topGenres.length ? `
          <div style="color:var(--c2);font-size:13px;margin-top:12px">Your top genres:</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap">
            ${topGenres.map(([name]) => `<span class="badge badge-genre" style="font-size:12px">${name}</span>`).join('')}
          </div>
        ` : ''}
      </div>`;
    this.$('cm-confirm').textContent = 'Awesome!';
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('visible'), 10);

    const cleanup = () => { modal.classList.remove('visible'); setTimeout(() => modal.classList.add('hidden'), 300); };
    this.$('cm-confirm').onclick = cleanup;
    this.$('cm-cancel').onclick = cleanup;
  }

  /* ══════════════════════════ SYNC / EXPORT ═══════════════════ */
  async _exportProfileData() {
    const data = {
      profiles: await this.store.profiles(),
      settings: await this.store.settings(),
      watchlist: await this.store.watchlist(),
      playlists: await this.store.playlists(),
      history: await this.store.history(),
      progress: await this.store.progress(),
      exportedAt: Date.now(),
      version: 1
    };
    return btoa(JSON.stringify(data));
  }

  async _importProfileData(encoded) {
    try {
      const data = JSON.parse(atob(encoded));
      if (data.version !== 1) throw new Error('Invalid version');
      if (data.settings) await this.store.saveSettings({ ...this.settings, ...data.settings });
      if (data.watchlist) { this.wl = data.watchlist; await this.store.saveWL(this.wl); }
      if (data.playlists) await this.store.savePlaylists(data.playlists);
      if (data.history) { this.hist = data.history; await this.store.saveHist(this.hist); }
      if (data.progress) { this.prog = data.progress; await this.store.saveProg(this.prog); }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  const app = new SebFlix();
  app.init().catch(console.error);
});
