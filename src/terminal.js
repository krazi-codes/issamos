// IssamOS - Command Shell Terminal Emulator

class TerminalManager {
  constructor() {
    this.activeTerminals = {}; // Track loops: { winId: { inputListener, matrixId } }
    this.initGlobalBinds();
  }

  initGlobalBinds() {
    window.addEventListener('terminal-init', (e) => {
      const { win } = e.detail;
      this.initTerminalInstance(win);
    });

    window.addEventListener('window-closed', (e) => {
      const { appId } = e.detail;
      if (appId === 'terminal') {
        this.cleanupTerminals();
      }
    });
  }

  initTerminalInstance(win) {
    const input = win.querySelector('.terminal-input');
    const history = win.querySelector('.terminal-history');
    const container = win.querySelector('.terminal-container');
    const winId = win.id;

    // Focus input on container click
    container.addEventListener('click', () => {
      input.focus();
    });

    const keyListener = (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        const cmdLine = value.toLowerCase();
        
        // Print echo prompt
        this.printLine(history, `guest@issamos:~$ ${value}`, 'terminal-prompt');
        
        if (cmdLine !== '') {
          this.executeCommand(history, container, cmdLine);
        }
        
        input.value = '';
        container.scrollTop = container.scrollHeight;
      }
    };

    input.addEventListener('keydown', keyListener);
    
    // Auto focus on open
    setTimeout(() => input.focus(), 150);

    // Save terminal references
    this.activeTerminals[winId] = {
      inputListener: keyListener,
      inputElement: input,
      matrixId: null
    };
  }

  printLine(history, text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-output-line ${className}`;
    line.innerHTML = text;
    history.appendChild(line);
  }

  executeCommand(history, container, command) {
    const parts = command.split(' ');
    const cmd = parts[0];
    
    switch (cmd) {
      case 'help':
        this.printLine(history, `Available commands:`);
        this.printLine(history, `  <b>about</b>     - Display information about Issam`);
        this.printLine(history, `  <b>projects</b>  - List collaborative project items`);
        this.printLine(history, `  <b>neofetch</b>  - Fetch simulated system hardware statistics`);
        this.printLine(history, `  <b>matrix</b>    - Boot into the falling core code matrix screen`);
        this.printLine(history, `  <b>clear</b>     - Clean up terminal history logs`);
        this.printLine(history, `  <b>reboot</b>    - Reboot the simulated system`);
        break;

      case 'about':
        this.printLine(history, `Issam - Collaborative Full Stack & 3D WebGL Developer.`, 'icon-cyan');
        this.printLine(history, `Core Expertise: Building immersive WebGL canvases, optimizing GPU shaders, and scaling high-concurrency systems using Node.js and Rust.`);
        this.printLine(history, `Mission: Building virtual computing workspaces that bridges traditional developer mechanics with state-of-the-art 3D visuals.`);
        break;

      case 'projects':
        this.printLine(history, `Active Repositories (krazi-codes):`);
        this.printLine(history, `  - <b>space-debries-app</b> [Game Dev]: WebGL orbital debris tracker. Model: Globe.`);
        this.printLine(history, `  - <b>911-bot</b> [Systems]: TypeScript emergency coordinator. Model: Nodes.`);
        this.printLine(history, `  - <b>Autonomy</b> [Systems]: BearHacks 26 LLM prompt interceptor proxy. Model: Core.`);
        this.printLine(history, `  - <b>inventory-system</b> [Web Apps]: Python unhackathon stock manager. Model: Core.`);
        this.printLine(history, `  - <b>email-bot</b> [Web Apps]: Python automated IMAP filtering tool. Model: Nodes.`);
        this.printLine(history, `  - <b>Dubbify</b> [Web Apps]: Next.js multilingual AI call relay. Model: Nodes.`);
        this.printLine(history, `To explore detailed specs and spin the 3D models, open 'collaborations' on the desktop.`);
        break;

      case 'neofetch':
        this.renderNeofetch(history);
        break;

      case 'matrix':
        this.startMatrixRain(container);
        break;

      case 'clear':
        history.innerHTML = '';
        break;

      case 'reboot':
        this.printLine(history, `Initializing reboot protocols...`, 'log-success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
        break;

      default:
        this.printLine(history, `Command not found: <b>${cmd}</b>. Type 'help' to review shell options.`, 'icon-red');
    }
  }

  renderNeofetch(history) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const asciiArt = `
      /\\_/\\
     ( o.o )
      > ^ <
     /     \\
    /  | |  \\
   ( _ | | _ )
    `;

    const statsHtml = `
<div class="neofetch-container">
  <pre class="neofetch-logo">${asciiArt}</pre>
  <div class="neofetch-info">
    <div><span class="neofetch-field">guest@issamos</span></div>
    <div>-------------------</div>
    <div><span class="neofetch-field">OS:</span> <span class="neofetch-val">IssamOS v1.0.3</span></div>
    <div><span class="neofetch-field">Kernel:</span> <span class="neofetch-val">WebGL 2.0 / Three.js ESM</span></div>
    <div><span class="neofetch-field">Shell:</span> <span class="neofetch-val">JavaScript ES6 Modules</span></div>
    <div><span class="neofetch-field">Uptime:</span> <span class="neofetch-val">${Math.floor(performance.now() / 1000)}s</span></div>
    <div><span class="neofetch-field">Resolution:</span> <span class="neofetch-val">${width}x${height}</span></div>
    <div><span class="neofetch-field">Terminal:</span> <span class="neofetch-val">HTML-VT100 (CRT enabled)</span></div>
    <div><span class="neofetch-field">CPU:</span> <span class="neofetch-val">Virtual-V8 Core</span></div>
    <div><span class="neofetch-field">Palette:</span> <span style="color:#00f2fe">■</span> <span style="color:#bd00ff">■</span> <span style="color:#39ff14">■</span> <span style="color:#ff9f1c">■</span></div>
  </div>
</div>
    `;

    const row = document.createElement('div');
    row.innerHTML = statsHtml;
    history.appendChild(row);
  }

  startMatrixRain(container) {
    // Hide terminal input cursor while matrix is running
    const inputRow = container.querySelector('.terminal-input-row');
    if (inputRow) inputRow.style.display = 'none';

    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    // Fit canvas to terminal
    const fitCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    fitCanvas();

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト';
    const charArr = chars.split('');
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);

    // Initial falls indices
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // staggered offset starts
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#39ff14'; // Matrix neon green
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Draw character
        ctx.fillText(text, x, y);

        // Reset drop index to 0 when passing bottom bounds with random stagger
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 33);
    const winId = container.closest('.window').id;
    if (this.activeTerminals[winId]) {
      this.activeTerminals[winId].matrixId = intervalId;
    }

    // Stop matrix on click or press
    const stopMatrix = () => {
      clearInterval(intervalId);
      canvas.remove();
      if (inputRow) inputRow.style.display = 'flex';
      container.querySelector('.terminal-input').focus();
      if (this.activeTerminals[winId]) {
        this.activeTerminals[winId].matrixId = null;
      }
      document.removeEventListener('keydown', stopMatrixEsc);
    };

    const stopMatrixEsc = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        stopMatrix();
      }
    };

    canvas.addEventListener('click', stopMatrix);
    document.addEventListener('keydown', stopMatrixEsc);
  }

  cleanupTerminals() {
    for (const [winId, tObj] of Object.entries(this.activeTerminals)) {
      const win = document.getElementById(winId);
      if (!win) {
        // Clear matrix interval loops
        if (tObj.matrixId) {
          clearInterval(tObj.matrixId);
        }
        
        // Remove input bindings
        if (tObj.inputElement) {
          tObj.inputElement.removeEventListener('keydown', tObj.inputListener);
        }
        
        delete this.activeTerminals[winId];
      }
    }
  }
}

export default TerminalManager;
