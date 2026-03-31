const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

/* Suppress Electron Security Warnings since webSecurity is intentionally disabled for streaming */
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

/* Prevent crashes from SSL cert errors (VidKing/Videasy sources) */
app.commandLine.appendSwitch('ignore-certificate-errors');
process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught exception (suppressed):', err.message);
});

let mainWindow;
const dataDir = path.join(app.getPath('userData'), 'data');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** All nested child frames (for VidKing embeds inside iframes). */
function collectChildFrames(frame) {
  let all = [];
  try {
    const children = frame.frames || [];
    for (const f of children) {
      all.push(f);
      all = all.concat(collectChildFrames(f));
    }
  } catch (e) { /* cross-origin */ }
  return all;
}

function createWindow() {
  ensureDir(dataDir);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    backgroundColor: '#050508',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png')
  });

  /* Setup CORS and Header normalization */
  const filter = { urls: ['*://*/*'] };

  // 1. Normalize Request Headers (Bypass Referer/Origin checks)
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, cb) => {
    const { url, requestHeaders } = details;
    if (url.includes('youtube.com/embed')) {
      requestHeaders['Origin'] = 'https://www.google.com';
      requestHeaders['Referer'] = 'https://www.google.com';
    } else if (url.includes('vidking.net') || url.includes('videasy.net')) {
      const u = new URL(url);
      requestHeaders['Origin'] = u.origin;
      requestHeaders['Referer'] = u.origin;
    }
    cb({ requestHeaders });
  });

  // 2. Fix Response Headers (Avoid Duplicate CORS Headers & Frame restrictions)
  session.defaultSession.webRequest.onHeadersReceived(filter, (details, cb) => {
    const rh = details.responseHeaders || {};

    // Remove existing CORS and Frame headers to avoid duplication/errors
    const toDelete = [
      'Access-Control-Allow-Origin', 'access-control-allow-origin',
      'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers',
      'Access-Control-Allow-Credentials', 'access-control-allow-credentials',
      'Access-Control-Expose-Headers', 'access-control-expose-headers',
      'X-Frame-Options', 'x-frame-options',
      'Content-Security-Policy', 'content-security-policy'
    ];
    toDelete.forEach(h => delete rh[h]);

    // Try Origin first, then Referer origin, then fallback to *
    let origin = ['*'];
    const reqH = details.requestHeaders || {};
    const o = reqH['Origin'] || reqH['origin'];
    if (o) {
      origin = [o];
    } else if (details.referrer) {
      try { origin = [new URL(details.referrer).origin]; } catch { }
    }

    cb({
      responseHeaders: {
        ...rh,
        'Content-Security-Policy': [
          "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "frame-src * data: blob:; " +
          "img-src * data: blob:;"
        ],
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': ['*'],
        'Access-Control-Allow-Headers': ['*'],
        'Access-Control-Expose-Headers': ['*'],
        'Access-Control-Allow-Credentials': ['true']
      }
    });
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('enter-full-screen', () => mainWindow.webContents.send('win:fullscreen', true));
  mainWindow.on('leave-full-screen', () => mainWindow.webContents.send('win:fullscreen', false));
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:state', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:state', false));

  /* Allow certificates from video source servers */
  mainWindow.webContents.on('certificate-error', (event, url, error, cert, callback) => {
    event.preventDefault();
    callback(true);
  });

  // 1. Block Pop-unders / Ads from Player Iframe
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log(`[Main] 🚫 Denied window.open for: ${url}`);
    return { action: 'deny' };
  });

  // Catch the "pop-under" which might be a new browser window created from the renderer
  app.on('browser-window-created', (e, win) => {
    if (win !== mainWindow) {
      console.log(`[Main] 🚫 Destroying unauthorized new window`);
      win.destroy();
    }
  });

  // Ensure internal iframes can't navigate the top window
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (url && !url.startsWith('file://') && !url.includes('localhost')) {
      console.log(`[Main] 🚫 Blocked top-level navigation attempt to: ${url}`);
      e.preventDefault();
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });
}

/* ---- IPC handlers ---- */
ipcMain.handle('storage:read', async (_e, file) => {
  try {
    let p = path.join(dataDir, file);
    if (!fs.existsSync(p)) {
      // Fallback to app root for static data like collections
      p = path.join(__dirname, file);
    }
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
});

ipcMain.handle('storage:write', async (_e, file, data) => {
  try {
    fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
    return true;
  } catch { return false; }
});

ipcMain.on('win:minimize', () => mainWindow?.minimize());
ipcMain.on('win:maximize', () => {
  if (!mainWindow) return;
  const isFull = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFull);
});
ipcMain.on('win:close', () => mainWindow?.close());

/** Origins used by the in-app player embed (www + bare host; VidKing + Videasy). */
const EMBED_ORIGINS = [
  'https://www.vidking.net',
  'https://vidking.net',
  'https://www.videasy.net',
  'https://videasy.net'
];

/** Every storage bucket Electron can wipe per-origin (VidKing keeps resume in LS/IDB/SW, etc.). */
const EMBED_STORAGES = ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'];

/**
 * Clear all persisted state for video embed origins + session HTTP cache.
 * Lighter clear (clearCache IPC) still does full per-origin wipe; clearAllCache also clears
 * default-session localStorage/sessionStorage (matches Settings → Clear History behavior).
 */
async function clearEmbedSiteData(ses) {
  for (const origin of EMBED_ORIGINS) {
    try {
      await ses.clearStorageData({ origin, storages: EMBED_STORAGES });
    } catch (e) {
      try {
        await ses.clearStorageData({ origin });
      } catch (e2) {
        console.error(`[Main] clearStorageData ${origin}:`, e.message, e2.message);
      }
    }
  }
  try {
    await ses.clearCache();
  } catch (e) {
    console.error('[Main] session.clearCache:', e.message);
  }
}

/* Clear VidKing/Videasy embed storage + disk cache */
ipcMain.handle('player:clearCache', async () => {
  try {
    await clearEmbedSiteData(session.defaultSession);
    console.log('[Main] ✓ Cleared embed site data (all origins + storages) + cache');
    return true;
  } catch (err) {
    console.error('[Main] Failed to clear player cache:', err.message);
    return false;
  }
});

/* Same as clearCache plus wipe default-session localStorage/sessionStorage (heavy reset). */
ipcMain.handle('player:clearAllCache', async () => {
  try {
    const ses = session.defaultSession;
    await clearEmbedSiteData(ses);
    try {
      await ses.clearStorageData({ storages: ['localstorage', 'sessionstorage'] });
    } catch (e) {
      console.error('[Main] clearStorageData global LS/SS:', e.message);
    }
    console.log('[Main] ✓ Cleared all player caches (embed + global LS/SS)');
    return true;
  } catch (err) {
    console.error('[Main] Failed to clear cache:', err.message);
    return false;
  }
});

ipcMain.on('player:togglePause', () => {
  if (!mainWindow) return;
  const frames = [mainWindow.webContents.mainFrame, ...collectChildFrames(mainWindow.webContents.mainFrame)];
  const code = `
    var v = document.querySelector('video');
    if (v) { v.paused ? v.play() : v.pause(); }
    true;
  `;
  frames.forEach(f => {
    try {
      if (f.url && (f.url.includes('vidking') || f.url.includes('videasy'))) {
        f.executeJavaScript(code).catch(() => { });
      }
    } catch (e) { /* noop */ }
  });
});

/* Programmatic play — embed often ignores URL autoPlay after resume */
ipcMain.on('player:forcePlay', () => {
  if (!mainWindow) return;
  const code = `
    (function() {
      var list = document.querySelectorAll('video');
      for (var i = 0; i < list.length; i++) {
        try {
          var v = list[i];
          if (v && v.paused) v.play().catch(function() {});
        } catch (e) {}
      }
      return true;
    })();
  `;
  const run = () => {
    const frames = collectChildFrames(mainWindow.webContents.mainFrame);
    frames.forEach(f => {
      try {
        if (f.url && (f.url.includes('vidking') || f.url.includes('videasy'))) {
          f.executeJavaScript(code).catch(() => { });
        }
      } catch (e) { /* noop */ }
    });
  };
  run();
  setTimeout(run, 300);
  setTimeout(run, 900);
  setTimeout(run, 2000);
  setTimeout(run, 4500);
});

/* Inject a progress reporter directly into the player iframe's <video> element. */
ipcMain.on('player:injectProgressTracker', () => {
  if (!mainWindow) return;
  const injectScript = `
    (function() {
      if (window.__solarProgressInjected) return;
      window.__solarProgressInjected = true;

      var lastUrl = window.location.href;
      var lastReport = 0; // Fix: lastReport was undefined
      function checkUrl() {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          try {
            window.top.postMessage({ type: 'solarUrlChange', url: lastUrl }, '*');
          } catch(e) {}
        }
      }

      function report(v) {
        checkUrl();
        if (!v || !v.duration || v.duration === Infinity) return;
        var now = Date.now();
        if (now - lastReport < 1000) return;
        lastReport = now;
        try {
          window.top.postMessage({
            currentTime: v.currentTime,
            duration: v.duration,
            type: 'solarProgress'
          }, '*');
        } catch(e) {}
      }

      function attach(v) {
        if (v.__solarAttached) return;
        v.__solarAttached = true;
        console.log('[SebFlix] Attached progress tracker to video element');
        
        v.addEventListener('timeupdate', function() { report(v); });
        
        v.addEventListener('play', function() {
          try {
            window.top.postMessage({ type: 'solarPlayback', action: 'play' }, '*');
          } catch(e) {}
        });

        v.addEventListener('pause', function() {
          if (v.ended) return;
          try {
            window.top.postMessage({ type: 'solarPlayback', action: 'pause' }, '*');
          } catch(e) {}
        });

        v.addEventListener('seeked', function() {
          try {
            window.top.postMessage({ type: 'solarPlayback', action: 'seek', time: v.currentTime }, '*');
          } catch(e) {}
        });

        v.addEventListener('ended', function() {
          try {
            window.top.postMessage({ event: 'videoNext' }, '*');
          } catch(e) {}
        });
        
        // Track mouse movement explicitly for the parent window to show custom UI
        var _mpt = 0;
        document.addEventListener('mousemove', function() {
          var now = Date.now();
          if (now - _mpt > 250) { // throttle
            _mpt = now;
            try { window.top.postMessage({ type: 'solarMouseMove' }, '*'); } catch(e) {}
          }
        }, {passive: true});

        setInterval(function() { report(v); }, 2000);
        report(v);
      }

      function findVideo() {
        var v = document.querySelector('video');
        if (v) {
          attach(v);
        } else {
          setTimeout(findVideo, 500);
        }
      }

      window.addEventListener('message', function(e) {
        var v = document.querySelector('video');
        if (!v) return;
        var cmd = e.data;
        if (cmd.type === 'remoteControl') {
          if (cmd.action === 'play') v.play().catch(function() {});
          if (cmd.action === 'pause') v.pause();
          if (cmd.action === 'seek') v.currentTime = cmd.time;
        }
      });

      try {
        var target = document.body || document.documentElement;
        if (target) {
          var obs = new MutationObserver(function() {
            var v = document.querySelector('video');
            if (v) attach(v);
          });
          obs.observe(target, { childList: true, subtree: true });
        }
      } catch(e) {}

      findVideo();
    })();
    true;
  `;

  const tryInject = () => {
    if (!mainWindow) return;
    const allFrames = collectChildFrames(mainWindow.webContents.mainFrame);
    console.log('[SebFlix] Injecting progress tracker into ' + allFrames.length + ' frame(s)');
    allFrames.forEach(f => {
      f.executeJavaScript(injectScript).catch(() => { });
    });
  };

  tryInject();
  setTimeout(tryInject, 1500);
  setTimeout(tryInject, 3000);
  setTimeout(tryInject, 6000);
  setTimeout(tryInject, 12000);
  setTimeout(tryInject, 20000);
});

/* Inject custom scrollbar CSS into VidKing iframe */
ipcMain.on('player:injectCustomScrollbars', () => {
  if (!mainWindow) return;
  const injectCSS = `
    (function() {
      if (window.__solarScrollbarsInjected) return;
      window.__solarScrollbarsInjected = true;
      
      var style = document.createElement('style');
      style.textContent = \`
        * {
          scrollbar-width: thin !important;
          scrollbar-color: #f97316 transparent !important;
          -ms-overflow-style: thin !important;
        }
        
        ::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
          background: transparent !important;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent !important;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #f97316 !important;
          border-radius: 4px !important;
          transition: background 0.2s ease !important;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #fb923c !important;
        }
        
        ::-webkit-scrollbar-corner {
          background: transparent !important;
        }
        
        /* Specific VidKing player elements */
        .vjs-menu-content {
          scrollbar-width: thin !important;
          scrollbar-color: #f97316 transparent !important;
        }
        
        .vjs-menu-content::-webkit-scrollbar {
          width: 6px !important;
        }
        
        .vjs-menu-content::-webkit-scrollbar-thumb {
          background: #f97316 !important;
          border-radius: 3px !important;
        }
        
        .vjs-menu-content::-webkit-scrollbar-track {
          background: transparent !important;
        }
      \`;
      
      (document.head || document.documentElement).appendChild(style);
      console.log('[SebFlix] Custom scrollbars injected into VidKing player');
    })();
    true;
  `;

  const tryInject = () => {
    if (!mainWindow) return;
    const allFrames = collectChildFrames(mainWindow.webContents.mainFrame);
    console.log('[SebFlix] Injecting custom scrollbars into ' + allFrames.length + ' frame(s)');
    allFrames.forEach(f => {
      f.executeJavaScript(injectCSS).catch(() => { });
    });
  };

  tryInject();
  setTimeout(tryInject, 1000);
  setTimeout(tryInject, 2500);
  setTimeout(tryInject, 5000);
  setTimeout(tryInject, 10000);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
