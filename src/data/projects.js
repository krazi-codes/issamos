// Project Collaboration Data for IssamOS (GitHub: krazi-codes)

export const projectsData = [
  {
    id: "space-debries-app",
    name: "Space Debris App",
    category: "Game Dev",
    role: "Simulation Developer",
    teamSize: 3,
    description: "An interactive tracker mapping active orbital space debris trajectories in low Earth orbit. Built utilizing JavaScript and WebGL to plot coordinate matrices. Features orbital physics calculations to estimate collision courses.",
    techStack: ["JavaScript", "WebGL", "Three.js", "Physics Engine"],
    github: "https://github.com/krazi-codes/space-debries-app",
    live: "https://github.com/krazi-codes/space-debries-app",
    modelType: "globe", // Renders rotating orbital globe
    icon: "globe"
  },
  {
    id: "911-bot",
    name: "911 Bot",
    category: "Systems",
    role: "Lead Developer",
    teamSize: 4,
    description: "Developed during the ConHacks 2026 hackathon. A TypeScript-based bot designed for emergency response routing and real-time community coordination. Integrates automatic dispatch alert webhooks and geocoding.",
    techStack: ["TypeScript", "Node.js", "Webhooks", "REST API", "ConHacks-2026"],
    github: "https://github.com/krazi-codes/911-bot",
    live: "https://github.com/krazi-codes/911-bot",
    modelType: "nodes", // Network dispatch topology
    icon: "shield-alert"
  },
  {
    id: "Autonomy",
    name: "Autonomy Extension",
    category: "Systems",
    role: "Backend & Extension Lead",
    teamSize: 4,
    description: "Built for BearHacks 2026. A VS Code extension that intercepts Claude Code API requests. It implements a FastAPI proxy server, WebSocket stream, and VS Code webview panel displaying interactive context-window token charts. Developers can edit or discard prompts on the fly.",
    techStack: ["VS Code API", "TypeScript", "Python", "FastAPI", "WebSockets", "Ollama", "Gemma", "BearHacks-2026"],
    github: "https://github.com/AP3008/Autonomy",
    live: "https://github.com/AP3008/Autonomy",
    modelType: "core", // Cyber-core represents API interceptor
    icon: "terminal"
  },
  {
    id: "inventory-system",
    name: "Inventory System",
    category: "Web Apps",
    role: "Full Stack Engineer",
    teamSize: 2,
    description: "Created for the Crania Unhackathon event. A responsive database interface designed for fast tracking, counting, and categorizing supply levels. Features CSV reports generation and stock alerts.",
    techStack: ["Python", "SQLite", "HTML/CSS", "Crania-Unhackathon"],
    github: "https://github.com/krazi-codes/inventory-system",
    live: "https://github.com/krazi-codes/inventory-system",
    modelType: "core", // Database revolving core
    icon: "database"
  },
  {
    id: "email-bot",
    name: "Email Bot",
    category: "Web Apps",
    role: "Backend Architect",
    teamSize: 1,
    description: "An automated email filtering bot that processes incoming messages. Categorizes newsletters, notifications, and filters high-priority emails based on user-configured semantic patterns.",
    techStack: ["Python", "IMAP/SMTP", "Scripting", "Automation"],
    github: "https://github.com/krazi-codes/email-bot",
    live: "https://github.com/krazi-codes/email-bot",
    modelType: "nodes", // Message filter pathways
    icon: "mail"
  },
  {
    id: "Dubbify",
    name: "Dubbify Relay",
    category: "Web Apps",
    role: "Full Stack Lead",
    teamSize: 3,
    description: "A Multilingual Call Relay System designed to facilitate real-time phone translation. Non-English speakers communicate with English recipients via AI speech-to-text translation feeding a human relay agent's dashboard. Answers are converted back to speech on the fly.",
    techStack: ["Next.js 14", "React", "TypeScript", "FastAPI", "WebSockets", "Supabase", "AI Translation"],
    github: "https://github.com/malihashar/Dubbify",
    live: "https://github.com/malihashar/Dubbify",
    modelType: "nodes", // Speech routing node paths
    icon: "phone-call"
  }
];
