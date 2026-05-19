// IssamOS - Window Manager Core
import { projectsData } from './data/projects.js';

class WindowManager {
  constructor() {
    this.container = document.getElementById('window-container');
    this.dock = document.getElementById('running-apps');
    this.startMenu = document.getElementById('start-menu');
    this.startBtn = document.getElementById('start-btn');
    this.timeDisplay = document.getElementById('time-display');
    this.crtToggle = document.getElementById('crt-toggle');
    
    this.windows = {}; // Track active windows: { appId: DOMElement }
    this.zIncrement = 100;
    this.cascadeOffset = 30;
    this.openCount = 0;

    // Active apps structures
    this.appTemplates = {
      profile: { title: 'profile.exe', icon: 'user', contentFn: () => this.getProfileContent() },
      projects: { title: 'collaborations', icon: 'folder-git-2', contentFn: () => this.getProjectsContent() },
      terminal: { title: 'terminal.exe', icon: 'terminal', contentFn: () => this.getTerminalContent() },
      viewer: { title: '3d_sandbox.sys', icon: 'box', contentFn: () => this.getSandboxContent() }
    };

    this.initGlobalEvents();
    this.startClock();
  }

  initGlobalEvents() {
    // Start Menu Binds
    this.startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      this.startMenu.classList.add('hidden');
    });

    this.startMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Start Menu Items click
    document.querySelectorAll('.start-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const app = e.currentTarget.getAttribute('data-app');
        if (app) {
          this.openWindow(app);
          this.startMenu.classList.add('hidden');
        }
      });
    });

    // Desktop icons click and double click
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
      });

      icon.addEventListener('dblclick', (e) => {
        const app = icon.getAttribute('data-app');
        this.openWindow(app);
      });
    });

    // Clicking desktop clears icon selection
    document.getElementById('desktop').addEventListener('click', () => {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    });

    // CRT Scanline Toggle
    this.crtToggle.addEventListener('click', () => {
      const crtOverlay = document.getElementById('crt-overlay');
      const scanlines = document.getElementById('scanlines');
      
      const isOn = crtOverlay.classList.contains('crt-on');
      if (isOn) {
        crtOverlay.classList.remove('crt-on');
        crtOverlay.classList.add('crt-off');
        scanlines.classList.remove('crt-on');
        scanlines.classList.add('crt-off');
        this.crtToggle.querySelector('span').innerText = 'CRT: OFF';
      } else {
        crtOverlay.classList.remove('crt-off');
        crtOverlay.classList.add('crt-on');
        scanlines.classList.remove('crt-off');
        scanlines.classList.add('crt-on');
        this.crtToggle.querySelector('span').innerText = 'CRT: ON';
      }
    });

    // Reboot Button
    const rebootBtn = document.getElementById('reboot-btn');
    if (rebootBtn) {
      rebootBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  startClock() {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      let minutes = date.getMinutes();
      let seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      
      this.timeDisplay.innerText = `${hours}:${minutes}:${seconds} ${ampm}`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  openWindow(appId) {
    // If already open, raise focus and return
    if (this.windows[appId]) {
      const win = this.windows[appId];
      if (win.classList.contains('minimized')) {
        this.minimizeRestore(appId);
      } else {
        this.focusWindow(win);
      }
      return;
    }

    const appInfo = this.appTemplates[appId];
    if (!appInfo) return;

    // Load from template
    const template = document.getElementById('window-template');
    const clone = template.content.cloneNode(true);
    const win = clone.querySelector('.window');
    
    win.id = `win-${appId}`;
    win.setAttribute('data-app', appId);
    win.querySelector('.window-title').innerText = appInfo.title;
    
    // Set custom icon
    const titleIcon = win.querySelector('.window-title-icon');
    titleIcon.setAttribute('data-lucide', appInfo.icon);

    // Set content
    const content = win.querySelector('.window-content');
    content.innerHTML = appInfo.contentFn();

    // Position window cascaded
    const offset = this.openCount * this.cascadeOffset;
    const initialTop = 60 + (offset % (window.innerHeight - 560));
    const initialLeft = 100 + (offset % (window.innerWidth - 750));
    win.style.top = `${initialTop}px`;
    win.style.left = `${initialLeft}px`;

    // Append to container
    this.container.appendChild(win);
    const renderedWin = document.getElementById(win.id);
    this.windows[appId] = renderedWin;
    this.openCount++;

    // Re-trigger lucide icons inside the window
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Initialize drag, resize, control button events
    this.initWindowControls(renderedWin, appId);
    this.focusWindow(renderedWin);
    this.addToDock(appId, appInfo.title, appInfo.icon);

    // App-specific initialization hooks
    this.initAppLogic(appId, renderedWin);

    // Fade-in animation via GSAP
    gsap.fromTo(renderedWin, 
      { opacity: 0, scale: 0.93 }, 
      { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }
    );
  }

  initWindowControls(win, appId) {
    const header = win.querySelector('.window-header');
    
    // Click to focus
    win.addEventListener('mousedown', () => this.focusWindow(win));

    // Minimize, Maximize, Close button events
    win.querySelector('.minimize-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimizeRestore(appId);
    });

    win.querySelector('.maximize-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize(win);
    });

    win.querySelector('.close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(appId);
    });

    // Double click header to maximize
    header.addEventListener('dblclick', () => {
      this.toggleMaximize(win);
    });

    // Drag-and-drop logic
    let isDragging = false;
    let startX, startY, winLeft, winTop;

    header.addEventListener('mousedown', (e) => {
      if (win.classList.contains('maximized')) return;
      if (e.target.closest('.win-btn')) return; // Avoid drag on controls
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      winLeft = parseInt(window.getComputedStyle(win).left, 10);
      winTop = parseInt(window.getComputedStyle(win).top, 10);
      
      this.focusWindow(win);
      document.body.style.cursor = 'move';
      
      // Prevent selection during drag
      e.preventDefault();
    });

    // Resize logic
    let isResizing = false;
    let resizeDir = '';
    let startW, startH;

    const handles = win.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        if (win.classList.contains('maximized')) return;
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startW = parseInt(window.getComputedStyle(win).width, 10);
        startH = parseInt(window.getComputedStyle(win).height, 10);
        winLeft = parseInt(window.getComputedStyle(win).left, 10);
        winTop = parseInt(window.getComputedStyle(win).top, 10);
        
        if (handle.classList.contains('resizer-r')) resizeDir = 'r';
        if (handle.classList.contains('resizer-b')) resizeDir = 'b';
        if (handle.classList.contains('resizer-rb')) resizeDir = 'rb';

        this.focusWindow(win);
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Shared Move/Resize event listener on document
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newLeft = winLeft + dx;
        let newTop = winTop + dy;
        
        // Boundaries checks (allow dragging title bar only partially offscreen)
        newTop = Math.max(0, newTop); // Keep top header visible under status bar
        
        win.style.left = `${newLeft}px`;
        win.style.top = `${newTop}px`;
      }

      if (isResizing) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        if (resizeDir.includes('r')) {
          const newWidth = Math.max(350, startW + dx);
          win.style.width = `${newWidth}px`;
        }
        if (resizeDir.includes('b')) {
          const newHeight = Math.max(250, startH + dy);
          win.style.height = `${newHeight}px`;
        }
        
        // Notify any window-specific resizing listeners (like Three.js sizes update)
        const resizeEvent = new CustomEvent('window-resized', { detail: { appId } });
        win.dispatchEvent(resizeEvent);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging || isResizing) {
        isDragging = false;
        isResizing = false;
        document.body.style.cursor = 'default';
      }
    });
  }

  focusWindow(win) {
    // Remove focus class from all windows
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focus'));
    
    // Bring this window to the top
    this.zIncrement++;
    win.style.zIndex = this.zIncrement;
    win.classList.add('focus');

    // Update active tab in the dock
    const appId = win.getAttribute('data-app');
    document.querySelectorAll('.running-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${appId}`);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.classList.remove('minimized');
    }
  }

  toggleMaximize(win) {
    const appId = win.getAttribute('data-app');
    if (win.classList.contains('maximized')) {
      win.classList.remove('maximized');
      // Restore cached dimensions
      win.style.top = win.dataset.prevTop || '100px';
      win.style.left = win.dataset.prevLeft || '100px';
      win.style.width = win.dataset.prevWidth || '700px';
      win.style.height = win.dataset.prevHeight || '500px';
    } else {
      // Cache current dimensions
      win.dataset.prevTop = win.style.top;
      win.dataset.prevLeft = win.style.left;
      win.dataset.prevWidth = win.style.width;
      win.dataset.prevHeight = win.style.height;

      win.classList.add('maximized');
      // Remove style properties overrides to fill screen
      win.style.top = '';
      win.style.left = '';
      win.style.width = '';
      win.style.height = '';
    }
    
    // Dispatch resize event to trigger WebGL renderer updates
    const resizeEvent = new CustomEvent('window-resized', { detail: { appId } });
    win.dispatchEvent(resizeEvent);
  }

  minimizeRestore(appId) {
    const win = this.windows[appId];
    if (!win) return;

    const tab = document.getElementById(`tab-${appId}`);
    
    if (win.classList.contains('minimized')) {
      // Restore window
      win.classList.remove('minimized');
      this.focusWindow(win);
      
      // GSAP animate open
      gsap.fromTo(win, 
        { opacity: 0, scale: 0.9 }, 
        { opacity: 1, scale: 1, duration: 0.2, ease: "power1.out" }
      );
      
      // Trigger WebGL re-render check
      const resizeEvent = new CustomEvent('window-resized', { detail: { appId } });
      win.dispatchEvent(resizeEvent);
    } else {
      // Minimize window
      // GSAP animate collapse to taskbar
      const tabRect = tab.getBoundingClientRect();
      const winRect = win.getBoundingClientRect();
      
      gsap.to(win, {
        opacity: 0,
        scale: 0.7,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => {
          win.classList.add('minimized');
          if (tab) {
            tab.classList.add('minimized');
            tab.classList.remove('active');
          }
        }
      });
    }
  }

  closeWindow(appId) {
    const win = this.windows[appId];
    if (!win) return;

    // Disconnect custom app specific hooks (like stopping animations or canvases)
    const closeEvent = new CustomEvent('window-closed', { detail: { appId } });
    win.dispatchEvent(closeEvent);

    // GSAP fade out, then remove
    gsap.to(win, {
      opacity: 0,
      scale: 0.9,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => {
        win.remove();
        delete this.windows[appId];
        
        // Remove from dock
        const tab = document.getElementById(`tab-${appId}`);
        if (tab) tab.remove();
      }
    });
  }

  addToDock(appId, title, iconName) {
    const tab = document.createElement('div');
    tab.className = 'running-tab active';
    tab.id = `tab-${appId}`;
    tab.innerHTML = `<i data-lucide="${iconName}"></i> <span>${title}</span>`;
    
    tab.addEventListener('click', () => {
      if (this.windows[appId].classList.contains('minimized')) {
        this.minimizeRestore(appId);
      } else if (this.windows[appId].classList.contains('focus')) {
        this.minimizeRestore(appId);
      } else {
        this.focusWindow(this.windows[appId]);
      }
    });

    this.dock.appendChild(tab);
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* --------------------------------------------------
     HTML Content Builders for Applications
  -------------------------------------------------- */

  getProfileContent() {
    return `
      <div class="profile-container">
        <div class="profile-sidebar">
          <button class="tab-btn active" data-tab="bio">
            <i data-lucide="user"></i> <span>Bio.txt</span>
          </button>
          <button class="tab-btn" data-tab="skills">
            <i data-lucide="shield-check"></i> <span>Skills.sys</span>
          </button>
          <button class="tab-btn" data-tab="metrics">
            <i data-lucide="terminal"></i> <span>Metrics.log</span>
          </button>
        </div>
        
        <div class="profile-body">
          <!-- BIO TAB -->
          <div class="profile-tab-content active" id="profile-bio">
            <div class="bio-header">
              <div class="profile-avatar-circle">I</div>
              <div class="bio-title">
                <h2>Issam (krazi-codes)</h2>
                <p>Full Stack Engineer & Automations Specialist</p>
              </div>
            </div>
            <div class="bio-text">
              <p>Hey there! I am Issam, known online as <b>krazi-codes</b>. I am a software engineer specializing in building backend automations, systems tools, hackathon projects, and responsive web applications.</p>
              <p>I thrive in collaborative, high-energy settings like hackathons (ConHacks, Crania Unhackathon), developing custom API integrations, command-line tools, and web modules that solve practical workflow and database challenges.</p>
              <p>This virtual workspace exhibits active repositories fetched directly from my GitHub profile. Open the <b>collaborations</b> file on the desktop to inspect their codebases and rotate their 3D trajectory visualizers!</p>
            </div>
          </div>

          <!-- SKILLS TAB -->
          <div class="profile-tab-content" id="profile-skills">
            <div class="skills-grid">
              <div class="skill-card">
                <h4><i data-lucide="layout"></i> Frontend & Design</h4>
                <div class="skill-list">
                  <div class="skill-item">
                    <div class="skill-info"><span>JavaScript (ES6+)</span><span>85%</span></div>
                    <div class="skill-bar-bg"><div class="skill-bar-fill fill-cyan" data-val="85%"></div></div>
                  </div>
                  <div class="skill-item">
                    <div class="skill-info"><span>HTML5 / CSS3</span><span>90%</span></div>
                    <div class="skill-bar-bg"><div class="skill-bar-fill fill-cyan" data-val="90%"></div></div>
                  </div>
                  <div class="skill-item">
                    <div class="skill-info"><span>3D / WebGL / Three.js</span><span>70%</span></div>
                    <div class="skill-bar-bg"><div class="skill-bar-fill fill-cyan" data-val="70%"></div></div>
                  </div>
                </div>
              </div>

              <div class="skill-card">
                <h4><i data-lucide="database"></i> Backend & Scripting</h4>
                <div class="skill-list">
                  <div class="skill-item">
                    <div class="skill-info"><span>Python (Automation & Bots)</span><span>90%</span></div>
                    <div class="skill-bar-bg"><div class="skill-bar-fill fill-magenta" data-val="90%"></div></div>
                  </div>
                  <div class="skill-item">
                    <div class="skill-info"><span>TypeScript / Node.js</span><span>80%</span></div>
                    <div class="skill-bar-bg"><div class="skill-bar-fill fill-magenta" data-val="80%"></div></div>
                  </div>
                  <div class="skill-item">
                    <div class="skill-info"><span>Databases & SQLite</span><span>75%</span></div>
                    <div class="skill-bar-bg"><div class="skill-bar-fill fill-magenta" data-val="75%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- METRICS TAB -->
          <div class="profile-tab-content" id="profile-metrics">
            <div class="metrics-logs">
              <div class="log-line">
                <span class="log-time">[17:52:00]</span> <span class="log-tag">[SYSTEM]</span> <span class="log-msg">Booting IssamOS kernel...</span> <span class="log-success">SUCCESS</span>
              </div>
              <div class="log-line">
                <span class="log-time">[17:52:01]</span> <span class="log-tag">[GPU]</span> <span class="log-msg">WebGL core graphics initialized.</span> <span class="log-success">ONLINE</span>
              </div>
              <div class="log-line">
                <span class="log-time">[17:52:02]</span> <span class="log-tag">[GITHUB]</span> <span class="log-msg">Querying profile: api.github.com/users/krazi-codes</span> <span class="log-success">SUCCESS</span>
              </div>
              <div class="log-line">
                <span class="log-time">[17:52:03]</span> <span class="log-tag">[REPOS]</span> <span class="log-msg">Linked repositories: 6 active public databases.</span> <span class="log-success">ONLINE</span>
              </div>
              <div class="log-line">
                <span class="log-time">[17:52:04]</span> <span class="log-tag">[HACK]</span> <span class="log-msg">ConHacks 2026 systems integrated (911-bot).</span>
              </div>
              <div class="log-line">
                <span class="log-time">[17:52:05]</span> <span class="log-tag">[BEAR]</span> <span class="log-msg">BearHacks 2026 API proxy active (Autonomy).</span>
              </div>
              <div class="log-line">
                <span class="log-time">[17:52:06]</span> <span class="log-tag">[STATUS]</span> <span class="log-msg">6 repositories successfully compiled: space-debries-app, 911-bot, Autonomy, inventory-system, email-bot, Dubbify.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getProjectsContent() {
    // Generate navigation elements from projectsData
    const categories = {
      "Web Apps": [],
      "Systems": [],
      "Game Dev": []
    };
    
    projectsData.forEach(p => {
      if (categories[p.category]) {
        categories[p.category].push(p);
      }
    });

    let treeHtml = '';
    for (const [cat, list] of Object.entries(categories)) {
      treeHtml += `
        <div class="tree-folder">
          <div class="folder-header" data-target="folder-${cat.replace(/\s+/g, '')}">
            <i data-lucide="folder"></i>
            <span>${cat}</span>
          </div>
          <div class="folder-contents" id="folder-${cat.replace(/\s+/g, '')}">
            ${list.map(proj => `
              <div class="tree-file" data-project-id="${proj.id}">
                <i data-lucide="file-code"></i>
                <span>${proj.id}.sys</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="projects-container">
        <!-- Sidebar folder structure -->
        <div class="projects-explorer">
          <div class="explorer-title">COLLABORATIONS</div>
          <div class="folder-tree">
            ${treeHtml}
          </div>
        </div>
        
        <!-- Viewer panel -->
        <div class="projects-viewer" id="project-viewer-content">
          <div class="project-view-placeholder">
            <i data-lucide="file-symlink"></i>
            <p>Double-click a project file in the explorer side-bar to view collaboration details and interact with the 3D visualizer.</p>
          </div>
        </div>
      </div>
    `;
  }

  getTerminalContent() {
    return `
      <div class="terminal-container">
        <div class="terminal-history">
          <div class="terminal-output-line">IssamOS [Version 1.0.3]</div>
          <div class="terminal-output-line">Type 'help' to view available system terminal shell commands.</div>
          <div class="terminal-output-line"></div>
        </div>
        <div class="terminal-input-row">
          <span class="terminal-prompt">guest@issamos:~$</span>
          <input type="text" class="terminal-input" autofocus autocomplete="off" spellcheck="false">
        </div>
      </div>
    `;
  }

  getSandboxContent() {
    return `
      <div class="sandbox-container">
        <div class="sandbox-canvas-wrapper">
          <canvas id="sandbox-canvas"></canvas>
          <div class="project-3d-hint">
            <i data-lucide="move"></i> <span>Drag to rotate | Scroll to zoom</span>
          </div>
        </div>
        
        <div class="sandbox-controls">
          <div class="control-title">Render Config</div>
          
          <div class="control-group">
            <label><span>Mesh Geometry</span></label>
            <select id="sandbox-geom">
              <option value="torusKnot">Torus Knot</option>
              <option value="sphere">Sphere (Wireframe)</option>
              <option value="box">Box (Complex)</option>
              <option value="octahedron">Octahedron</option>
            </select>
          </div>

          <div class="control-group">
            <label><span>Render Mode</span></label>
            <select id="sandbox-mode">
              <option value="glowing">Neon Solid</option>
              <option value="wireframe">Vector Wireframe</option>
              <option value="points">Point Cloud</option>
            </select>
          </div>
          
          <div class="control-group">
            <label><span>Speed</span> <span id="val-speed">1.0x</span></label>
            <input type="range" id="sandbox-speed" min="0" max="4" step="0.1" value="1">
          </div>

          <div class="control-group">
            <label><span>Primary Color</span></label>
            <select id="sandbox-color">
              <option value="#00f2fe">Neon Cyan</option>
              <option value="#bd00ff">Electric Purple</option>
              <option value="#39ff14">Green Matrix</option>
              <option value="#ff9f1c">Orange Grid</option>
            </select>
          </div>

          <button class="sandbox-btn" id="sandbox-auto-rotate">Auto Orbit: ON</button>
          <button class="sandbox-btn" id="sandbox-reset">Reset Camera</button>
        </div>
      </div>
    `;
  }

  /* --------------------------------------------------
     App Initialization Logic Binds
  -------------------------------------------------- */

  initAppLogic(appId, win) {
    if (appId === 'profile') {
      this.bindProfileTabs(win);
    }
    if (appId === 'projects') {
      this.bindProjectsLogic(win);
    }
    if (appId === 'terminal') {
      // We will trigger a custom event that terminal.js will catch
      const initEvent = new CustomEvent('terminal-init', { detail: { win } });
      window.dispatchEvent(initEvent);
    }
    if (appId === 'viewer') {
      // Trigger event for three-scene.js to init Sandbox Three.js
      const initEvent = new CustomEvent('sandbox-init', { detail: { win } });
      window.dispatchEvent(initEvent);
    }
  }

  bindProfileTabs(win) {
    const tabs = win.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const targetTab = tab.getAttribute('data-tab');
        win.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
        
        const targetContent = win.querySelector(`#profile-${targetTab}`);
        if (targetContent) {
          targetContent.classList.add('active');
          
          // If skills tab, animate progress fills
          if (targetTab === 'skills') {
            targetContent.querySelectorAll('.skill-bar-fill').forEach(fill => {
              const val = fill.getAttribute('data-val');
              setTimeout(() => {
                fill.style.width = val;
              }, 100);
            });
          }
        }
      });
    });
  }

  bindProjectsLogic(win) {
    // Folders collapse/toggle
    win.querySelectorAll('.folder-header').forEach(header => {
      header.addEventListener('click', () => {
        const targetId = header.getAttribute('data-target');
        const contents = win.querySelector(`#${targetId}`);
        const icon = header.querySelector('i');
        
        if (contents.classList.contains('hidden')) {
          contents.classList.remove('hidden');
          icon.setAttribute('data-lucide', 'folder-open');
        } else {
          contents.classList.add('hidden');
          icon.setAttribute('data-lucide', 'folder');
        }
        if (window.lucide) window.lucide.createIcons();
      });
    });

    // File double click / single click
    const files = win.querySelectorAll('.tree-file');
    files.forEach(file => {
      file.addEventListener('click', () => {
        files.forEach(f => f.classList.remove('active'));
        file.classList.add('active');

        const projId = file.getAttribute('data-project-id');
        this.loadProjectDetails(win, projId);
      });
    });
  }

  loadProjectDetails(win, projId) {
    const project = projectsData.find(p => p.id === projId);
    if (!project) return;

    const viewer = win.querySelector('#project-viewer-content');
    
    // Render the layout with description, badges, and a target 3D Canvas
    viewer.innerHTML = `
      <div class="project-details" id="details-${projId}">
        <div class="project-content-grid">
          
          <!-- Details Left Panel -->
          <div class="project-info-panel">
            <h2>${project.name}</h2>
            <div class="collab-tag-box">
              <i data-lucide="users"></i> <span>Collaborators: ${project.teamSize} members</span>
            </div>
            
            <div class="project-description">
              <p>${project.description}</p>
            </div>

            <div class="project-meta-item">
              <h4>Role in Collaboration</h4>
              <p style="font-size: 13px; color: var(--magenta); font-weight: 600;">${project.role}</p>
            </div>

            <div class="project-meta-item">
              <h4>Technology Stack</h4>
              <div class="project-badge-list">
                ${project.techStack.map(t => `<span class="project-badge">${t}</span>`).join('')}
              </div>
            </div>

            <div class="project-links">
              <a href="${project.live}" target="_blank" class="btn-project">
                <i data-lucide="external-link"></i> <span>Launch System</span>
              </a>
              <a href="${project.github}" target="_blank" class="btn-project">
                <i data-lucide="git-branch"></i> <span>Source Code</span>
              </a>
            </div>
          </div>

          <!-- Canvas 3D Panel Right -->
          <div class="project-3d-panel">
            <div class="project-canvas-container" id="canvas-container-${projId}">
              <canvas id="canvas-${projId}"></canvas>
            </div>
            <div class="project-3d-hint">
              <i data-lucide="move"></i> <span>Drag to orbit 3D model</span>
            </div>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Trigger Three.js project model initialization
    const load3DEvent = new CustomEvent('project-3d-init', { 
      detail: { 
        win, 
        projectId: projId, 
        canvasId: `canvas-${projId}`, 
        modelType: project.modelType 
      } 
    });
    window.dispatchEvent(load3DEvent);
  }
}

export default WindowManager;
