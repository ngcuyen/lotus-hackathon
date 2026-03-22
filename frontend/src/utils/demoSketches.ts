/**
 * Demo sketch generator — draws wireframe sketches programmatically on Canvas.
 * Returns base64 PNG strings ready to send to the backend.
 *
 * Sketches use a slightly rough "hand-drawn" style (small coordinate jitter,
 * rounded line caps, varying stroke width) to mimic real whiteboard drawings.
 */

export interface DemoSketch {
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  style: string;
  tagline: string;
  /** Call once to get the base64 PNG (uses browser Canvas API) */
  getImageBase64: () => string;
}

// ─── Drawing helpers ────────────────────────────────────────────────────────

type Ctx = CanvasRenderingContext2D;

/** Draw a "sketchy" rectangle with slight hand-drawn jitter */
function sRect(ctx: Ctx, x: number, y: number, w: number, h: number, jitter = 2) {
  const j = () => (Math.random() - 0.5) * jitter;
  ctx.beginPath();
  ctx.moveTo(x + j(), y + j());
  ctx.lineTo(x + w + j(), y + j());
  ctx.lineTo(x + w + j(), y + h + j());
  ctx.lineTo(x + j(), y + h + j());
  ctx.closePath();
  ctx.stroke();
}

/** Draw a "sketchy" circle */
function sCircle(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** Draw a horizontal "text line" placeholder */
function sLine(ctx: Ctx, x: number, y: number, w: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

/** Draw a filled rectangle (for buttons / headers) */
function sFilled(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.restore();
  sRect(ctx, x, y, w, h);
}

function makeCanvas(): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 640, 480);
  ctx.strokeStyle = "#1a1a1a";
  ctx.fillStyle = "#1a1a1a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return [canvas, ctx];
}

// ─── Sketch 1: Login Form ───────────────────────────────────────────────────

function drawLoginForm(): string {
  const [canvas, ctx] = makeCanvas();
  const cx = 320, cy = 240;

  // Card outline
  sRect(ctx, cx - 130, cy - 160, 260, 320, 3);

  // Logo circle
  sCircle(ctx, cx, cy - 120, 28);

  // Title line
  ctx.lineWidth = 3;
  sLine(ctx, cx - 60, cy - 72, 120);

  // Subtitle line (thin)
  ctx.lineWidth = 1.5;
  sLine(ctx, cx - 40, cy - 55, 80);

  // Email input
  ctx.lineWidth = 2;
  sRect(ctx, cx - 95, cy - 35, 190, 32);
  ctx.lineWidth = 1;
  sLine(ctx, cx - 75, cy - 16, 80);

  // Password input
  ctx.lineWidth = 2;
  sRect(ctx, cx - 95, cy + 12, 190, 32);
  // Password dots
  for (let i = 0; i < 6; i++) {
    sCircle(ctx, cx - 60 + i * 14, cy + 29, 3);
  }

  // Sign in button (filled)
  ctx.lineWidth = 2.5;
  sFilled(ctx, cx - 95, cy + 60, 190, 36);
  ctx.lineWidth = 1.5;
  sLine(ctx, cx - 35, cy + 80, 70);

  // "Or" divider
  ctx.lineWidth = 1;
  sLine(ctx, cx - 80, cy + 112, 60);
  sLine(ctx, cx + 20, cy + 112, 60);

  // Google button
  ctx.lineWidth = 1.5;
  sRect(ctx, cx - 95, cy + 122, 190, 32);
  sCircle(ctx, cx - 55, cy + 139, 8);
  sLine(ctx, cx - 30, cy + 139, 60);

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Sketch 2: E-commerce Product Grid ────────────────────────────────────

function drawProductGrid(): string {
  const [canvas, ctx] = makeCanvas();

  // Page title
  ctx.lineWidth = 3;
  sLine(ctx, 60, 45, 160);

  // Search bar
  ctx.lineWidth = 2;
  sRect(ctx, 60, 60, 520, 34);
  sCircle(ctx, 88, 78, 9);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(95, 85);
  ctx.lineTo(100, 90);
  ctx.stroke();

  // 3 product cards
  const cardW = 155, cardH = 220;
  const startX = 60;
  const startY = 115;
  const gap = 17;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (cardW + gap);

    // Card border
    ctx.lineWidth = 2;
    sRect(ctx, x, startY, cardW, cardH, 2);

    // Image placeholder (top 40% of card)
    ctx.lineWidth = 1.5;
    sRect(ctx, x + 8, startY + 8, cardW - 16, 86, 1);
    // X through image
    ctx.beginPath();
    ctx.moveTo(x + 8, startY + 8);
    ctx.lineTo(x + cardW - 8, startY + 94);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + cardW - 8, startY + 8);
    ctx.lineTo(x + 8, startY + 94);
    ctx.stroke();

    // Product name
    ctx.lineWidth = 2;
    sLine(ctx, x + 10, startY + 112, cardW - 30);

    // Price
    ctx.lineWidth = 2.5;
    sLine(ctx, x + 10, startY + 133, 55);

    // Stars
    ctx.lineWidth = 1;
    for (let s = 0; s < 5; s++) {
      sRect(ctx, x + 10 + s * 14, startY + 148, 10, 10, 0);
    }

    // Add to cart button
    ctx.lineWidth = 2;
    sFilled(ctx, x + 10, startY + 175, cardW - 20, 28);
    ctx.lineWidth = 1.5;
    sLine(ctx, x + 35, startY + 191, 55);
  }

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Sketch 3: Chat App ────────────────────────────────────────────────────

function drawChatApp(): string {
  const [canvas, ctx] = makeCanvas();

  // Left sidebar — contact list
  ctx.lineWidth = 2;
  sRect(ctx, 20, 20, 170, 440);

  // Header in sidebar
  ctx.lineWidth = 2.5;
  sLine(ctx, 35, 50, 100);

  // Contact list items (5 items)
  for (let i = 0; i < 5; i++) {
    const y = 80 + i * 62;
    sCircle(ctx, 50, y + 15, 16); // avatar
    ctx.lineWidth = 1.5;
    sLine(ctx, 75, y + 8, 90);     // name
    ctx.lineWidth = 1;
    sLine(ctx, 75, y + 22, 70);    // last message
    // Unread badge on first contact
    if (i === 0) {
      sCircle(ctx, 163, y + 12, 8);
    }
    // Divider
    ctx.lineWidth = 0.5;
    sLine(ctx, 35, y + 42, 140);
  }

  // Right chat area
  ctx.lineWidth = 2;
  sRect(ctx, 210, 20, 410, 440);

  // Chat header
  ctx.lineWidth = 2.5;
  sCircle(ctx, 240, 55, 16); // avatar
  sLine(ctx, 265, 48, 100);   // name
  ctx.lineWidth = 1;
  sLine(ctx, 265, 62, 60);    // status

  // Message bubbles
  const messages = [
    { x: 230, y: 105, w: 160, right: false },
    { x: 390, y: 155, w: 180, right: true },
    { x: 230, y: 210, w: 200, right: false },
    { x: 370, y: 265, w: 210, right: true },
    { x: 230, y: 330, w: 140, right: false },
  ];

  messages.forEach(({ x, y, w, right }) => {
    ctx.lineWidth = right ? 2.5 : 2;
    if (right) sFilled(ctx, x, y, w, 36);
    else sRect(ctx, x, y, w, 36, 1);
    ctx.lineWidth = 1;
    sLine(ctx, x + 12, y + 20, w - 24);
  });

  // Timestamp
  ctx.lineWidth = 0.5;
  sLine(ctx, 360, 302, 50);

  // Input bar at bottom
  ctx.lineWidth = 2;
  sRect(ctx, 218, 415, 330, 36);
  ctx.lineWidth = 1;
  sLine(ctx, 235, 435, 200);
  // Send button
  sFilled(ctx, 552, 415, 60, 36);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(566, 435);
  ctx.lineTo(598, 433);
  ctx.stroke();

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Sketch 4: Dashboard ──────────────────────────────────────────────────

function drawDashboard(): string {
  const [canvas, ctx] = makeCanvas();

  // Sidebar
  ctx.lineWidth = 2;
  sRect(ctx, 20, 20, 130, 440);

  // Logo
  sRect(ctx, 35, 35, 36, 30);
  ctx.lineWidth = 1;
  sLine(ctx, 78, 47, 45);
  sLine(ctx, 78, 57, 30);

  // Nav items (5)
  for (let i = 0; i < 5; i++) {
    const y = 90 + i * 46;
    if (i === 0) sFilled(ctx, 30, y, 110, 30);
    ctx.lineWidth = 1.5;
    sRect(ctx, 35, y + 7, 16, 16, 0); // icon
    sLine(ctx, 60, y + 17, 60);        // label
  }

  // Top bar
  ctx.lineWidth = 2;
  sRect(ctx, 165, 20, 455, 50);
  // Search
  sRect(ctx, 178, 30, 160, 30);
  sCircle(ctx, 193, 45, 8);
  // Avatar
  sCircle(ctx, 598, 45, 16);

  // 4 metric cards
  const mW = 98, mH = 80;
  for (let i = 0; i < 4; i++) {
    const x = 172 + i * (mW + 12);
    ctx.lineWidth = 2;
    sRect(ctx, x, 88, mW, mH, 2);
    ctx.lineWidth = 1;
    sLine(ctx, x + 10, 106, 40);   // label
    ctx.lineWidth = 3;
    sLine(ctx, x + 10, 128, 55);   // big number
    ctx.lineWidth = 1;
    sRect(ctx, x + 10, 145, 35, 14); // badge
  }

  // Table
  ctx.lineWidth = 2;
  sRect(ctx, 172, 185, 448, 265);
  // Table header
  sFilled(ctx, 172, 185, 448, 32);
  ctx.lineWidth = 1;
  const cols = [0, 90, 180, 290, 380, 448];
  for (let c = 1; c < cols.length - 1; c++) {
    sLine(ctx, 172 + cols[c], 217, 0);
    ctx.beginPath();
    ctx.moveTo(172 + cols[c], 185);
    ctx.lineTo(172 + cols[c], 450);
    ctx.stroke();
  }
  // Header labels
  [50, 130, 230, 330, 410].forEach((x) => {
    sLine(ctx, 172 + x - 30, 205, 50);
  });
  // Row data (5 rows)
  for (let r = 0; r < 5; r++) {
    const rowY = 230 + r * 42;
    ctx.lineWidth = 0.5;
    sLine(ctx, 172, rowY + 42, 448);
    ctx.lineWidth = 1;
    sCircle(ctx, 193, rowY + 20, 12); // avatar
    [130, 230, 330, 410].forEach((x) => {
      sLine(ctx, 172 + x - 30, rowY + 22, 45);
    });
    // Status badge
    sRect(ctx, 172 + 380 - 15, rowY + 10, 40, 18);
  }

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Sketch 5: Business Card ────────────────────────────────────────────────

function drawBusinessCard(): string {
  const [canvas, ctx] = makeCanvas();
  const cx = 320, cy = 240;

  // Card outline (landscape card shape)
  ctx.lineWidth = 2.5;
  sRect(ctx, cx - 220, cy - 120, 440, 240, 2);

  // Left side — logo circle
  sCircle(ctx, cx - 140, cy - 40, 35);

  // Name (big)
  ctx.lineWidth = 3;
  sLine(ctx, cx - 80, cy - 60, 200);
  // Job title
  ctx.lineWidth = 1.5;
  sLine(ctx, cx - 80, cy - 38, 140);

  // Divider
  ctx.lineWidth = 1;
  sLine(ctx, cx - 80, cy - 15, 260);

  // Contact info lines (phone, email, website, address)
  for (let i = 0; i < 4; i++) {
    const y = cy + 5 + i * 28;
    sRect(ctx, cx - 80, y, 14, 14, 0); // icon placeholder
    ctx.lineWidth = 1.5;
    sLine(ctx, cx - 55, y + 8, 120 + Math.random() * 40);
  }

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Sketch 6: Invitation ──────────────────────────────────────────────────

function drawInvitation(): string {
  const [canvas, ctx] = makeCanvas();
  const cx = 320, cy = 240;

  // Card border (decorative double border)
  ctx.lineWidth = 2.5;
  sRect(ctx, cx - 180, cy - 190, 360, 380, 2);
  ctx.lineWidth = 1;
  sRect(ctx, cx - 168, cy - 178, 336, 356, 1);

  // Decorative top element
  sCircle(ctx, cx, cy - 145, 20);

  // Event title (large)
  ctx.lineWidth = 3;
  sLine(ctx, cx - 100, cy - 100, 200);
  ctx.lineWidth = 2;
  sLine(ctx, cx - 70, cy - 78, 140);

  // Date & time
  ctx.lineWidth = 1.5;
  sRect(ctx, cx - 90, cy - 45, 180, 40, 1);
  sLine(ctx, cx - 60, cy - 30, 120);
  sLine(ctx, cx - 45, cy - 12, 90);

  // Location
  sRect(ctx, cx - 12, cy + 15, 24, 24, 0); // pin icon
  ctx.lineWidth = 1;
  sLine(ctx, cx - 70, cy + 55, 140);
  sLine(ctx, cx - 50, cy + 72, 100);

  // RSVP button
  ctx.lineWidth = 2;
  sFilled(ctx, cx - 70, cy + 105, 140, 36);
  ctx.lineWidth = 1.5;
  sLine(ctx, cx - 30, cy + 125, 60);

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Sketch 7: Restaurant Menu ─────────────────────────────────────────────

function drawMenu(): string {
  const [canvas, ctx] = makeCanvas();

  // Title
  ctx.lineWidth = 3;
  sLine(ctx, 220, 40, 200);
  ctx.lineWidth = 1;
  sLine(ctx, 260, 58, 120);

  // Two columns
  const cols = [40, 340];
  const sectionNames = [
    [85, 210],  // appetizers Y, mains Y
    [85, 210],  // desserts Y, drinks Y
  ];

  cols.forEach((colX, ci) => {
    sectionNames[ci].forEach((secY, si) => {
      // Section header
      ctx.lineWidth = 2.5;
      sLine(ctx, colX, secY, 100);
      ctx.lineWidth = 0.5;
      sLine(ctx, colX, secY + 8, 250);

      // 3 menu items per section
      for (let i = 0; i < 3; i++) {
        const y = secY + 25 + i * 35;
        ctx.lineWidth = 1.5;
        sLine(ctx, colX, y, 140); // item name
        ctx.lineWidth = 1;
        sLine(ctx, colX, y + 14, 180); // description
        // Price (right-aligned)
        ctx.lineWidth = 2;
        sLine(ctx, colX + 210, y, 40);
      }
    });
  });

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Sketch 8: Resume ──────────────────────────────────────────────────────

function drawResume(): string {
  const [canvas, ctx] = makeCanvas();

  // Header section
  ctx.lineWidth = 2;
  sFilled(ctx, 20, 20, 600, 90);
  // Avatar
  sCircle(ctx, 75, 65, 30);
  // Name
  ctx.lineWidth = 3;
  sLine(ctx, 125, 45, 180);
  // Title
  ctx.lineWidth = 1.5;
  sLine(ctx, 125, 65, 130);
  // Contact info (right side)
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 1;
    sLine(ctx, 430, 40 + i * 20, 150);
  }

  // Two-column layout below
  // Left column — Experience
  ctx.lineWidth = 2.5;
  sLine(ctx, 30, 135, 100);
  ctx.lineWidth = 0.5;
  sLine(ctx, 30, 143, 350);

  for (let i = 0; i < 2; i++) {
    const y = 160 + i * 100;
    ctx.lineWidth = 2;
    sLine(ctx, 30, y, 160); // company
    ctx.lineWidth = 1;
    sLine(ctx, 30, y + 16, 100); // role + date
    // Bullet points
    for (let b = 0; b < 3; b++) {
      sCircle(ctx, 38, y + 38 + b * 18, 2);
      sLine(ctx, 48, y + 38 + b * 18, 200 + Math.random() * 80);
    }
  }

  // Right column — Skills
  ctx.lineWidth = 2.5;
  sLine(ctx, 420, 135, 60);
  ctx.lineWidth = 0.5;
  sLine(ctx, 420, 143, 180);

  for (let i = 0; i < 5; i++) {
    const y = 162 + i * 30;
    ctx.lineWidth = 1;
    sLine(ctx, 420, y, 70); // skill name
    sRect(ctx, 420, y + 8, 170, 10, 0); // progress bar bg
    sFilled(ctx, 420, y + 8, 100 + Math.random() * 70, 10); // progress fill
  }

  // Education
  ctx.lineWidth = 2.5;
  sLine(ctx, 420, 325, 80);
  ctx.lineWidth = 0.5;
  sLine(ctx, 420, 333, 180);
  ctx.lineWidth = 1.5;
  sLine(ctx, 420, 350, 150);
  ctx.lineWidth = 1;
  sLine(ctx, 420, 368, 100);

  return canvas.toDataURL("image/png").split(",")[1];
}

// ─── Exports ────────────────────────────────────────────────────────────────

export const DEMO_SKETCHES: DemoSketch[] = [
  {
    id: "login",
    name: "Login Form",
    emoji: "🔐",
    purpose: "form",
    style: "modern",
    tagline: "Auth form with social login",
    getImageBase64: drawLoginForm,
  },
  {
    id: "shop",
    name: "Product Grid",
    emoji: "🛒",
    purpose: "ecommerce",
    style: "modern",
    tagline: "3-column shop with cards",
    getImageBase64: drawProductGrid,
  },
  {
    id: "chat",
    name: "Chat App",
    emoji: "💬",
    purpose: "chat",
    style: "dark",
    tagline: "Messaging with sidebar",
    getImageBase64: drawChatApp,
  },
  {
    id: "dashboard",
    name: "Dashboard",
    emoji: "📊",
    purpose: "dashboard",
    style: "saas",
    tagline: "Sidebar + metrics + table",
    getImageBase64: drawDashboard,
  },
  {
    id: "card",
    name: "Business Card",
    emoji: "",
    purpose: "card",
    style: "modern",
    tagline: "Professional namecard",
    getImageBase64: drawBusinessCard,
  },
  {
    id: "invitation",
    name: "Invitation",
    emoji: "",
    purpose: "invitation",
    style: "modern",
    tagline: "Event invite with RSVP",
    getImageBase64: drawInvitation,
  },
  {
    id: "menu",
    name: "Menu",
    emoji: "",
    purpose: "menu",
    style: "modern",
    tagline: "Restaurant menu layout",
    getImageBase64: drawMenu,
  },
  {
    id: "resume",
    name: "Resume",
    emoji: "",
    purpose: "resume",
    style: "modern",
    tagline: "One-page CV layout",
    getImageBase64: drawResume,
  },
];
