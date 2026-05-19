// IssamOS - Main Orchestrator & Bootloader
import WindowManager from './window-manager.js';
import ThreeGraphicsManager from './three-scene.js';
import TerminalManager from './terminal.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("IssamOS: Launching kernel systems...");

  // 1. Initialize WebGL Starfield Background
  const graphics = new ThreeGraphicsManager();

  // 2. Initialize operating system Window Manager
  const winManager = new WindowManager();

  // 3. Initialize terminal CLI emulator
  const terminal = new TerminalManager();

  // 4. Draw desktop UI icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 5. Desktop Boot sequence animations
  // Auto-open the profile and project collaborations window sequentially
  setTimeout(() => {
    winManager.openWindow('profile');
  }, 400);

  setTimeout(() => {
    winManager.openWindow('projects');
  }, 900);

  console.log("IssamOS: Bootloader complete. Welcome, administrator.");
});
