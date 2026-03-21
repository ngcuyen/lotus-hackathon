"""
Prompt templates for Sketch → Living App.

Spec 07 — AI Output Quality (Sketch Fidelity + Beautiful UI)
Key improvements:
  - SKETCH FIDELITY: count every element, reproduce exact layout
  - LAYOUT RULES: map sketch primitives to JSX patterns
  - DESIGN STANDARDS: 80+ lines, realistic data, full interactivity
  - Richer few-shot examples (login + dashboard)
  - More instructive build_messages() user turn
"""

# ─── Style presets ─────────────────────────────────────────────────────────────
STYLE_PRESETS = {
    "modern": {
        "name": "Modern Minimal",
        "guidelines": """DESIGN STYLE — Modern Minimal:
- Backgrounds: white page (#ffffff), surfaces bg-gray-50, accent bg-blue-600 (#2563eb)
- Cards: bg-white rounded-2xl shadow-lg border border-gray-100 p-6, hover:shadow-xl transition-shadow
- Primary button: bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-500/30
- Secondary button: bg-white border border-gray-200 text-gray-700 rounded-xl px-6 py-3 hover:bg-gray-50 transition-all
- Inputs: bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all
- Badges: px-2.5 py-0.5 rounded-full text-xs font-medium; success=bg-emerald-100 text-emerald-700; warning=bg-amber-100 text-amber-700
- Gradients: bg-gradient-to-br from-blue-50 to-indigo-100 for hero/hero sections
- Typography: text-2xl font-bold text-gray-900 heading, text-sm text-gray-500 secondary"""
    },
    "glassmorphism": {
        "name": "Glassmorphism",
        "guidelines": """DESIGN STYLE — Glassmorphism:
- Page background: fixed gradient bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 min-h-screen
- Add 2-3 decorative blurred circles: absolute rounded-full blur-3xl opacity-30, sizes w-96 h-96
  e.g. top-0 left-0 bg-pink-400, bottom-0 right-0 bg-blue-400, top-1/2 left-1/2 bg-purple-300
- Cards/panels: bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8
- Primary button: bg-white/20 backdrop-blur-sm text-white rounded-2xl px-6 py-3 font-semibold border border-white/30 hover:bg-white/30 active:scale-[0.98] transition-all
- Inputs: bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:bg-white/20 outline-none transition-all
- Typography: text-white font-bold headings, text-white/70 secondary, text-white/50 muted
- Metric numbers: text-3xl font-bold text-white
- Badges: bg-white/20 text-white border border-white/30 rounded-full text-xs px-2.5 py-0.5"""
    },
    "neobrutalism": {
        "name": "Neobrutalism",
        "guidelines": """DESIGN STYLE — Neobrutalism:
- Page background: bg-[#fffbe6] (warm cream)
- Cards: bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] p-6
- Primary button: bg-[#ff6b6b] text-white border-2 border-black rounded-xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all
- Secondary button: bg-[#4ecdc4] text-black border-2 border-black rounded-xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all
- Inputs: border-2 border-black rounded-xl px-4 py-3 bg-white font-medium focus:ring-2 focus:ring-[#ff6b6b] outline-none shadow-[2px_2px_0px_0px_#000]
- Typography: font-black for headings, use colors text-[#ff6b6b] or text-[#4ecdc4] for accents
- Badges: border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-bold bg-[#ffd93d]
- Decorative: use emoji as icons 🔥 ✨ 🎯 🚀, thick borders everywhere"""
    },
    "dark": {
        "name": "Dark Premium",
        "guidelines": """DESIGN STYLE — Dark Premium:
- Page background: bg-[#080808] or bg-gray-950 min-h-screen
- Cards/panels: bg-gray-900/80 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-sm, hover:border-gray-700 transition-colors
- Primary button: bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-6 py-3 font-semibold hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25
- Secondary button: bg-gray-800 text-gray-300 border border-gray-700 rounded-xl px-6 py-3 hover:bg-gray-700 hover:text-white transition-all
- Inputs: bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all
- Typography: text-white font-bold headings, text-gray-400 secondary, text-violet-400 accents
- Gradient text: className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
- Badges: bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full text-xs px-2.5 py-0.5
- Glow effects: shadow-lg shadow-violet-500/20 on cards, shadow-violet-500/50 on buttons"""
    },
    "saas": {
        "name": "SaaS Dashboard",
        "guidelines": """DESIGN STYLE — SaaS Dashboard:
- Layout: flex min-h-screen — sidebar (w-64 bg-gray-900 text-white shrink-0) + main (flex-1 bg-gray-50 overflow-auto)
- Sidebar: logo at top, nav items py-2.5 px-4 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all; active item: bg-blue-600 text-white
- Topbar: bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm
- Metric cards: bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow; big number text-3xl font-bold text-gray-900, label text-sm text-gray-500, trend badge
- Trend badge up: bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium
- Trend badge down: bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium
- Tables: bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden; thead bg-gray-50 border-b
- Use inline SVG for sidebar icons (dashboard, users, chart, settings, bell shapes)"""
    },
}

# ─── Base prompt ────────────────────────────────────────────────────────────────
BASE_PROMPT = """You are an EXPERT UI designer and React developer. You convert hand-drawn wireframe sketches into BEAUTIFUL, PRODUCTION-QUALITY React applications with Tailwind CSS.

═══════════════════════════════════════════════════════
SKETCH FIDELITY — Read this FIRST before generating code
═══════════════════════════════════════════════════════
STEP 1 — COUNT every element in the sketch:
  • Every rectangle/box → a card, section, panel, or container
  • Every horizontal line of text → a heading, label, or paragraph
  • Every small box or rounded box → an input field or button
  • Every circle → an avatar, icon placeholder, or toggle
  • Every grid pattern → a grid layout (count columns exactly)
  • Every sidebar shape → a sidebar/aside element

STEP 2 — REPRODUCE the exact layout:
  • 2 columns in sketch = grid grid-cols-2 in code
  • 3 columns = grid-cols-3; 4 columns = grid-cols-4
  • Left panel + right content = flex with sidebar
  • Stacked boxes = flex flex-col with gap
  • If sketch shows 5 cards, generate EXACTLY 5 cards
  • Sizes are proportional: bigger box = more prominent element

STEP 3 — NEVER simplify or skip elements:
  • If you see it in the sketch, code it
  • "Unclear element" → interpret as closest meaningful UI component

═══════════════════════════════════════════════
LAYOUT → JSX MAPPING RULES
═══════════════════════════════════════════════
• Top bar / header strip → <header> with flex justify-between items-center
• Left vertical strip → sidebar/aside w-48 or w-64 with nav list
• Large center area → <main> flex-1 with padding
• Grid of equal boxes → <div className="grid grid-cols-N gap-4">
• Tall narrow box → card with list of items inside
• Wide short box → banner, hero, or search bar
• Small box inside card → metric number or badge
• Row of small boxes → horizontal tab bar or button group
• Table-like area → <table> or card with list rows

═══════════════════════════════════════════════
SKETCH COMPLEXITY CALIBRATION
═══════════════════════════════════════════════
Scale the output complexity to match the sketch:
  • 1-2 elements in sketch → simple card or form, 30-50 lines JSX
  • 3-5 elements in sketch → page with sections, 50-80 lines JSX
  • 6-10 elements in sketch → full page with interactions, 80-120 lines JSX
  • 10+ elements in sketch → complex app (sidebar, multiple panels), 120-200 lines JSX

NEVER add layout structures (sidebar, multi-column grid) that are NOT in the sketch.
If sketch shows 2 stacked boxes → 2 stacked sections, NOT sidebar+content.

═══════════════════════════════════════════════
DESIGN STANDARDS
═══════════════════════════════════════════════
QUALITY BAR — Every output must meet ALL of these:
  ✓ Output complexity proportional to sketch (see calibration above)
  ✓ At least 1 useState hook — form, toggle, counter, or loading state
  ✓ Realistic placeholder data: real names, emails, product names, prices
     e.g. "Sarah Chen", "john.smith@company.com", "Analytics Pro", "$49.99/mo"
  ✓ Every button: hover + active states + transition-all
  ✓ Every input: controlled with useState + onChange + focus styles
  ✓ Hover effects on all interactive elements (hover:shadow-md, hover:scale-105, etc.)
  ✓ At least one loading/active/selected state shown in the UI
  ✓ Inline SVG icons where icons are shown in the sketch (no icon library imports)

INLINE SVG PATTERN (copy this pattern):
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
  </svg>
  Common paths: search="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
               bell="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
               home="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
               user="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
               chart="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"

═══════════════════════════════════════════════
HARD RULES
═══════════════════════════════════════════════
1. Output ONLY a valid JSON object — no markdown, no backticks, no explanation
2. JSON must have exactly 2 fields: "component" and "description"
3. "component" = complete self-contained React component
4. MUST use: export default function App()
5. ONLY allowed imports: React hooks from "react" — NO other libraries whatsoever
6. Use ONLY Tailwind CSS utility classes — NO custom CSS, NO style={{}} except for specific values Tailwind can't express
7. Do NOT use: lucide-react, @heroicons, framer-motion, shadcn, or any other import

{style_guidelines}

OUTPUT FORMAT (strict JSON, no markdown wrapping):
""" + '{"component": "import { useState } from \\"react\\";\\nexport default function App() { ... }", "description": "Brief description of detected UI"}'


def get_system_prompt(style="modern"):
    preset = STYLE_PRESETS.get(style, STYLE_PRESETS["modern"])
    return BASE_PROMPT.replace("{style_guidelines}", preset["guidelines"])


# Default for backward compatibility
SYSTEM_PROMPT = get_system_prompt("modern")


# ─── Agent Step 1: Sketch Analyzer ─────────────────────────────────────────────
# Dedicated system prompt for the FIRST call in the 2-step agent pipeline.
# This call ONLY analyzes the sketch — it does NOT generate code.
# Separation lets the model use full attention on visual analysis without
# being distracted by the task of writing Tailwind classes.
ANALYZE_SKETCH_SYSTEM_PROMPT = """You are a UI sketch analyzer. Your ONLY job is to look at a hand-drawn wireframe sketch and describe what you see precisely in structured JSON.

DO NOT generate code. DO NOT suggest colors or styles. ONLY describe the physical drawing.

Output ONLY this JSON object (no markdown, no explanation, no extra text):
{
  "element_count": <integer: total number of distinct drawn shapes/regions>,
  "layout": "<one of: centered-card | sidebar-main | top-nav-content | grid | stacked | split-horizontal | full-page>",
  "elements": [
    "<one concise description per element: shape + position + inferred role>"
  ],
  "has_sidebar": <true|false>,
  "has_header": <true|false>,
  "has_grid": <true|false>,
  "grid_columns": <integer or null>,
  "complexity": "<simple | medium | complex>",
  "suggested_jsx_lines": <integer: 30|50|80|120|180>
}

Complexity scale:
  simple  = 1-3 elements → suggested_jsx_lines: 30-50
  medium  = 4-7 elements → suggested_jsx_lines: 50-100
  complex = 8+ elements  → suggested_jsx_lines: 100-180

Element description examples:
  "large outer rectangle — card container"
  "small oval center — avatar placeholder"
  "wide short rectangle top — header/nav bar"
  "narrow tall rectangle left — sidebar"
  "row of 3 equal rectangles — grid cards"
  "small rounded rectangle — button"
  "horizontal line — divider"
  "circle top-center — logo or avatar"

Be precise. Count EVERY distinct shape. If a shape is nested inside another, count both."""


def build_analysis_messages(image_base64: str) -> list:
    """
    Build the message list for the sketch analysis call (agent step 1).
    Single user turn: image + minimal instruction.
    Max tokens should be ~600 — analysis JSON is short.
    """
    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_base64,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        "Analyze this wireframe sketch carefully.\n"
                        "Count EVERY drawn element. Describe each one.\n"
                        "Return ONLY the JSON object — no markdown, no explanation."
                    ),
                },
            ],
        }
    ]


# ─── Purpose intents ────────────────────────────────────────────────────────────
# Each purpose gives the AI critical context about WHAT to build, so it can
# correctly interpret ambiguous sketch elements (e.g. a circle = avatar vs
# a game sprite vs a profile photo).
PURPOSE_INTENTS = {
    "landing": {
        "name": "Landing Page",
        "emoji": "🌐",
        "hint": (
            "Build a MARKETING LANDING PAGE. "
            "Interpret boxes as: hero section, feature cards, testimonials, CTA sections, pricing tiers, footer. "
            "Include a compelling headline, subheading, and at least one prominent CTA button. "
            "No login required — this is a public-facing page."
        ),
    },
    "game": {
        "name": "Mini Game",
        "emoji": "🎮",
        "hint": (
            "Build a PLAYABLE MINI GAME using only React state (no canvas unless needed). "
            "Examples: quiz game, memory card flip, number guessing, reaction timer, word puzzle, snake-lite. "
            "Include: score counter, start/restart button, win/lose state, and fun interactive feedback. "
            "Keep rules simple and immediately understandable without instructions."
        ),
    },
    "card": {
        "name": "Profile Card",
        "emoji": "💳",
        "hint": (
            "Build a PROFILE / BUSINESS CARD component. "
            "Interpret circles as avatars, rectangles as info sections. "
            "Include: avatar placeholder, name, title/role, contact info (email, phone, social links), "
            "and a subtle action button (Connect / Message / Follow). "
            "Make it feel like a polished digital business card."
        ),
    },
    "form": {
        "name": "Form / Survey",
        "emoji": "📋",
        "hint": (
            "Build a FORM or SURVEY UI. "
            "Interpret small rectangles as input fields, rounded boxes as dropdowns or radio options, "
            "lines as text areas. "
            "Include: field labels, placeholder text, validation feedback on submit, "
            "a progress indicator if multi-step, and a styled submit button. "
            "Use useState for all field values."
        ),
    },
    "ecommerce": {
        "name": "Shop / Product",
        "emoji": "🛒",
        "hint": (
            "Build an E-COMMERCE UI — product listing, product detail, or cart page. "
            "Interpret image boxes as product thumbnails (use colorful gradient placeholders), "
            "small text as product name + price + rating. "
            "Include: add-to-cart button with state, cart item counter, hover effects on cards. "
            "Use realistic product names and prices."
        ),
    },
    "dashboard": {
        "name": "Dashboard",
        "emoji": "📊",
        "hint": (
            "Build an ANALYTICS / ADMIN DASHBOARD. "
            "Interpret left strip as sidebar nav, top bar as header with search + avatar, "
            "small cards as KPI metric tiles (number + label + trend), "
            "wide area as chart placeholder or data table. "
            "Include: active nav state, metric cards with up/down trend badges, "
            "a data table with 5+ rows of realistic data."
        ),
    },
    "chat": {
        "name": "Chat App",
        "emoji": "💬",
        "hint": (
            "Build a CHAT / MESSAGING UI. "
            "Interpret left column as contact/conversation list, right area as message thread. "
            "Include: message bubbles (sent right, received left), timestamp, online status indicator, "
            "message input + send button, unread badge. "
            "Seed with 5-6 realistic fake messages using useState."
        ),
    },
    "todo": {
        "name": "Todo / Tasks",
        "emoji": "✅",
        "hint": (
            "Build a TODO / TASK MANAGER app. "
            "Interpret boxes as task items, checkboxes as completion toggles. "
            "Include: add new task input, checkbox to complete, delete button, "
            "filter tabs (All / Active / Done), task count summary. "
            "Seed with 5 realistic tasks, some already completed."
        ),
    },
}


# ─── Few-shot examples ─────────────────────────────────────────────────────────
# IMPORTANT: Few-shot examples are style-AGNOSTIC in structure (they teach the
# PROCESS of sketch analysis), but they DO demonstrate high visual quality.
#
# Per-style examples are selected in build_messages():
#   - modern / glass / neobrutalism / dark → FEW_SHOT_MODERN (login + product card)
#   - saas → FEW_SHOT_SAAS (login + dashboard)
#
# The dashboard example was REMOVED from the global set because it caused
# "few-shot poisoning": any 2-box sketch was being pattern-matched to sidebar+table.

FEW_SHOT_MODERN = [
    # ── Example 1: Login form ──────────────────────────────────────────────────
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a beautiful React component with the requested style."},
            {"type": "text", "text": "[Sketch: centered card with a logo circle at top, title 'Sign In', email input, password input, blue primary button 'Sign In', small link 'Forgot password?', divider, 'Sign in with Google' button]"},
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nexport default function App() {\\n  const [email, setEmail] = useState(\\"\\");\\n  const [password, setPassword] = useState(\\"\\");\\n  const [loading, setLoading] = useState(false);\\n  const [showPass, setShowPass] = useState(false);\\n  const handleSubmit = (e) => {\\n    e.preventDefault();\\n    setLoading(true);\\n    setTimeout(() => setLoading(false), 1800);\\n  };\\n  return (\\n    <div className=\\"min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4\\">\\n      <div className=\\"w-full max-w-md\\">\\n        <div className=\\"bg-white rounded-3xl shadow-2xl border border-gray-100 p-8\\">\\n          <div className=\\"text-center mb-8\\">\\n            <div className=\\"w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30\\">\\n              <svg className=\\"w-8 h-8 text-white\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M13 10V3L4 14h7v7l9-11h-7z\\" /></svg>\\n            </div>\\n            <h1 className=\\"text-2xl font-bold text-gray-900\\">Welcome back</h1>\\n            <p className=\\"text-sm text-gray-500 mt-1\\">Sign in to your account to continue</p>\\n          </div>\\n          <form onSubmit={handleSubmit} className=\\"space-y-4\\">\\n            <div>\\n              <label className=\\"block text-sm font-medium text-gray-700 mb-1.5\\">Email address</label>\\n              <input type=\\"email\\" value={email} onChange={e => setEmail(e.target.value)} placeholder=\\"sarah@company.com\\" className=\\"w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all\\" />\\n            </div>\\n            <div>\\n              <label className=\\"block text-sm font-medium text-gray-700 mb-1.5\\">Password</label>\\n              <div className=\\"relative\\">\\n                <input type={showPass ? \\"text\\" : \\"password\\"} value={password} onChange={e => setPassword(e.target.value)} placeholder=\\"\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\" className=\\"w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all\\" />\\n                <button type=\\"button\\" onClick={() => setShowPass(!showPass)} className=\\"absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600\\">\\n                  <svg className=\\"w-5 h-5\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d={showPass ? \\"M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21\\" : \\"M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z\\"} /></svg>\\n                </button>\\n              </div>\\n            </div>\\n            <div className=\\"flex items-center justify-between\\">\\n              <label className=\\"flex items-center gap-2 text-sm text-gray-600 cursor-pointer\\"><input type=\\"checkbox\\" className=\\"rounded border-gray-300\\" /> Remember me</label>\\n              <span className=\\"text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium\\">Forgot password?</span>\\n            </div>\\n            <button type=\\"submit\\" className=\\"w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/30 mt-2\\">\\n              {loading ? <span className=\\"flex items-center justify-center gap-2\\"><span className=\\"w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin\\"></span>Signing in...</span> : \\"Sign in\\"}\\n            </button>\\n          </form>\\n          <div className=\\"relative my-6\\"><div className=\\"absolute inset-0 flex items-center\\"><div className=\\"w-full border-t border-gray-200\\" /></div><div className=\\"relative flex justify-center text-xs\\"><span className=\\"bg-white px-3 text-gray-400 font-medium\\">OR</span></div></div>\\n          <button className=\\"w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all\\">\\n            <svg className=\\"w-5 h-5\\" viewBox=\\"0 0 24 24\\"><path d=\\"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z\\" fill=\\"#4285F4\\"/><path d=\\"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z\\" fill=\\"#34A853\\"/><path d=\\"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z\\" fill=\\"#FBBC05\\"/><path d=\\"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z\\" fill=\\"#EA4335\\"/></svg>\\n            Continue with Google\\n          </button>\\n          <p className=\\"text-center text-xs text-gray-400 mt-6\\">Don\'t have an account? <span className=\\"text-blue-600 font-medium hover:underline cursor-pointer\\">Sign up free</span></p>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}", "description": "Login form with email/password inputs, show/hide password toggle, remember me, Google SSO button, and loading state"}',
    },

    # ── Example 2: E-commerce product card (teaches grid + card patterns) ─────
    # This replaces the dashboard example for non-saas styles.
    # Teaches: image placeholder, price, rating, add to cart — without sidebar.
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a beautiful React component with the requested style."},
            {"type": "text", "text": "[Sketch: page title at top, grid of 3 product cards (each card has: image placeholder rectangle, product name, price, star rating row, Add to Cart button), search bar above the grid]"},
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nconst PRODUCTS = [\\n  {id:1,name:\\"Wireless Headphones\\",price:\\"$89.99\\",rating:4.5,reviews:128,tag:\\"Best Seller\\",color:\\"from-violet-400 to-purple-500\\"},\\n  {id:2,name:\\"Mechanical Keyboard\\",price:\\"$149.00\\",rating:4.8,reviews:89,tag:\\"New\\",color:\\"from-blue-400 to-cyan-500\\"},\\n  {id:3,name:\\"USB-C Hub 7-in-1\\",price:\\"$54.99\\",rating:4.3,reviews:204,tag:\\"Popular\\",color:\\"from-emerald-400 to-teal-500\\"},\\n  {id:4,name:\\"Ergonomic Mouse\\",price:\\"$69.00\\",rating:4.6,reviews:156,tag:\\"\\",color:\\"from-rose-400 to-pink-500\\"},\\n  {id:5,name:\\"Laptop Stand\\",price:\\"$39.99\\",rating:4.4,reviews:312,tag:\\"Sale\\",color:\\"from-amber-400 to-orange-500\\"},\\n  {id:6,name:\\"Webcam 4K\\",price:\\"$129.00\\",rating:4.7,reviews:74,tag:\\"\\",color:\\"from-indigo-400 to-blue-500\\"},\\n];\\nfunction Stars({rating}) {\\n  return (\\n    <div className=\\"flex items-center gap-0.5\\">\\n      {[1,2,3,4,5].map(i => (\\n        <svg key={i} className={\`w-3.5 h-3.5 $\\{i<=Math.floor(rating)?\\"text-amber-400\\":\\"text-gray-200\\"}\`} fill=\\"currentColor\\" viewBox=\\"0 0 20 20\\"><path d=\\"M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z\\"/></svg>\\n      ))}\\n    </div>\\n  );\\n}\\nexport default function App() {\\n  const [search, setSearch] = useState(\\"\\");\\n  const [cart, setCart] = useState([]);\\n  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));\\n  const addToCart = (id) => setCart(prev => prev.includes(id) ? prev : [...prev, id]);\\n  return (\\n    <div className=\\"min-h-screen bg-gray-50 p-8\\">\\n      <div className=\\"max-w-5xl mx-auto\\">\\n        <div className=\\"flex items-center justify-between mb-6\\">\\n          <div>\\n            <h1 className=\\"text-2xl font-bold text-gray-900\\">Tech Store</h1>\\n            <p className=\\"text-sm text-gray-500\\">Showing {filtered.length} products</p>\\n          </div>\\n          {cart.length > 0 && <div className=\\"flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium\\"><svg className=\\"w-4 h-4\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z\\"/></svg>{cart.length} items</div>}\\n        </div>\\n        <div className=\\"relative mb-6\\">\\n          <svg className=\\"w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\\"/></svg>\\n          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder=\\"Search products...\\" className=\\"w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all\\"/>\\n        </div>\\n        <div className=\\"grid grid-cols-3 gap-5\\">\\n          {filtered.map(p => (\\n            <div key={p.id} className=\\"bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200\\">\\n              <div className={\`h-44 bg-gradient-to-br $\\{p.color} relative\\"}><div className=\\"absolute inset-0 flex items-center justify-center text-white/30\\"><svg className=\\"w-16 h-16\\" fill=\\"currentColor\\" viewBox=\\"0 0 24 24\\"><path d=\\"M4 5a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 15.46 4.632 17 6.414 17H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 7H6.28l-.31-1.243A1 1 0 005 5H4z\\"/></svg></div>{p.tag && <span className=\\"absolute top-3 left-3 bg-white/90 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full\\">{p.tag}</span>}</div>\\n              <div className=\\"p-4\\">\\n                <h3 className=\\"font-semibold text-gray-900 text-sm mb-1\\">{p.name}</h3>\\n                <div className=\\"flex items-center gap-2 mb-3\\"><Stars rating={p.rating}/><span className=\\"text-xs text-gray-400\\">({p.reviews})</span></div>\\n                <div className=\\"flex items-center justify-between\\">\\n                  <span className=\\"text-lg font-bold text-gray-900\\">{p.price}</span>\\n                  <button onClick={()=>addToCart(p.id)} className={\`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all $\\{cart.includes(p.id)?\\"bg-emerald-100 text-emerald-700 cursor-default\\":\\"bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97]\\"}\`}>{cart.includes(p.id)?\\"✓ Added\\":\\"Add to Cart\\"}</button>\\n                </div>\\n              </div>\\n            </div>\\n          ))}\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}", "description": "E-commerce product grid with search, 6 product cards (image gradient, name, star rating, price), and add-to-cart state"}',
    },
]

# SaaS dashboard examples — ONLY used when style = "saas"
# Kept separate to prevent the sidebar pattern from contaminating other styles.
FEW_SHOT_SAAS = [
    # ── Example 1: Login form (same as modern, establishes code quality bar) ──
    FEW_SHOT_MODERN[0],
    FEW_SHOT_MODERN[1],

    # ── Example 2: SaaS Dashboard ─────────────────────────────────────────────
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a beautiful React component with the requested style."},
            {"type": "text", "text": "[Sketch: left sidebar with logo + 5 nav items, top bar with search and avatar, main area with 4 metric cards in a row, then a table below with 5 data rows]"},
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nconst NAV = [{icon:\\"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z\\",label:\\"Dashboard\\"},{icon:\\"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\\",label:\\"Users\\"},{icon:\\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\\",label:\\"Analytics\\"},{icon:\\"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z\\",label:\\"Billing\\"},{icon:\\"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z\\",label:\\"Settings\\"}];\\nconst METRICS=[{label:\\"Revenue\\",value:\\"$48,295\\",change:\\"+12.5%\\",up:true},{label:\\"Users\\",value:\\"3,842\\",change:\\"+8.1%\\",up:true},{label:\\"Conversion\\",value:\\"4.63%\\",change:\\"-0.4%\\",up:false},{label:\\"Avg Order\\",value:\\"$127\\",change:\\"+3.2%\\",up:true}];\\nconst ORDERS=[{id:\\"#001\\",customer:\\"Sarah Chen\\",product:\\"Analytics Pro\\",amount:\\"$299\\",status:\\"Completed\\"},{id:\\"#002\\",customer:\\"James Wilson\\",product:\\"Starter\\",amount:\\"$49\\",status:\\"Pending\\"},{id:\\"#003\\",customer:\\"Maria Garcia\\",product:\\"Enterprise\\",amount:\\"$999\\",status:\\"Completed\\"},{id:\\"#004\\",customer:\\"Alex Park\\",product:\\"Analytics Pro\\",amount:\\"$299\\",status:\\"Processing\\"},{id:\\"#005\\",customer:\\"Emma Davis\\",product:\\"Starter\\",amount:\\"$49\\",status:\\"Cancelled\\"}];\\nconst S={Completed:\\"bg-emerald-100 text-emerald-700\\",Pending:\\"bg-amber-100 text-amber-700\\",Processing:\\"bg-blue-100 text-blue-700\\",Cancelled:\\"bg-red-100 text-red-600\\"};\\nexport default function App(){\\n  const [nav,setNav]=useState(\\"Dashboard\\");\\n  const [q,setQ]=useState(\\"\\");\\n  return(\\n    <div className=\\"flex h-screen bg-gray-50\\">\\n      <aside className=\\"w-60 bg-gray-900 flex flex-col shrink-0\\">\\n        <div className=\\"px-5 py-4 border-b border-gray-800 flex items-center gap-2.5\\">\\n          <div className=\\"w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center\\"><svg className=\\"w-3.5 h-3.5 text-white\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M13 10V3L4 14h7v7l9-11h-7z\\"/></svg></div>\\n          <span className=\\"font-bold text-white\\">Dashify</span>\\n        </div>\\n        <nav className=\\"flex-1 p-3 space-y-0.5\\">\\n          {NAV.map(n=>(\\n            <button key={n.label} onClick={()=>setNav(n.label)} className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all $\\{nav===n.label?\\"bg-blue-600 text-white\\":\\"text-gray-400 hover:bg-gray-800 hover:text-white\\"}\`}>\\n              <svg className=\\"w-4 h-4\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={1.5} d={n.icon}/></svg>{n.label}\\n            </button>\\n          ))}\\n        </nav>\\n        <div className=\\"px-4 py-3 border-t border-gray-800 flex items-center gap-3\\">\\n          <div className=\\"w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white\\">JD</div>\\n          <div><p className=\\"text-sm font-medium text-white\\">John Doe</p><p className=\\"text-xs text-gray-400\\">john@dashify.io</p></div>\\n        </div>\\n      </aside>\\n      <div className=\\"flex-1 flex flex-col overflow-hidden\\">\\n        <header className=\\"bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between\\">\\n          <div className=\\"relative w-64\\"><svg className=\\"w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\\"/></svg><input value={q} onChange={e=>setQ(e.target.value)} placeholder=\\"Search...\\" className=\\"w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none\\"/></div>\\n          <div className=\\"w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white\\">JD</div>\\n        </header>\\n        <main className=\\"flex-1 overflow-auto p-6\\">\\n          <h2 className=\\"text-xl font-bold text-gray-900 mb-1\\">{nav}</h2>\\n          <p className=\\"text-sm text-gray-500 mb-5\\">Welcome back, John.</p>\\n          <div className=\\"grid grid-cols-4 gap-4 mb-5\\">\\n            {METRICS.map(m=>(\\n              <div key={m.label} className=\\"bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow\\">\\n                <p className=\\"text-xs text-gray-500 font-medium uppercase tracking-wide\\">{m.label}</p>\\n                <p className=\\"text-2xl font-bold text-gray-900 mt-1\\">{m.value}</p>\\n                <span className={\`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full $\\{m.up?\\"bg-emerald-50 text-emerald-700\\":\\"bg-red-50 text-red-600\\"}\`}>{m.change}</span>\\n              </div>\\n            ))}\\n          </div>\\n          <div className=\\"bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden\\">\\n            <div className=\\"px-5 py-3.5 border-b border-gray-100 flex justify-between items-center\\"><h3 className=\\"font-semibold text-gray-900 text-sm\\">Recent Orders</h3><span className=\\"text-xs text-blue-600 cursor-pointer hover:underline\\">View all</span></div>\\n            <table className=\\"w-full\\"><thead className=\\"bg-gray-50\\"><tr>{[\\"ID\\",\\"Customer\\",\\"Product\\",\\"Amount\\",\\"Status\\"].map(h=>(<th key={h} className=\\"px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase\\">{h}</th>))}</tr></thead>\\n              <tbody>{ORDERS.filter(o=>!q||o.customer.toLowerCase().includes(q.toLowerCase())).map(o=>(<tr key={o.id} className=\\"border-t border-gray-50 hover:bg-gray-50/50\\"><td className=\\"px-5 py-3 text-xs font-mono text-gray-400\\">{o.id}</td><td className=\\"px-5 py-3 text-sm font-medium text-gray-900\\">{o.customer}</td><td className=\\"px-5 py-3 text-sm text-gray-600\\">{o.product}</td><td className=\\"px-5 py-3 text-sm font-semibold\\">{o.amount}</td><td className=\\"px-5 py-3\\"><span className={\`text-xs font-semibold px-2.5 py-1 rounded-full $\\{S[o.status]}\`}>{o.status}</span></td></tr>))}</tbody>\\n            </table>\\n          </div>\\n        </main>\\n      </div>\\n    </div>\\n  );\\n}", "description": "SaaS dashboard: sidebar nav (5 items), header with search, 4 metric cards, searchable orders table"}',
    },
]

# Backward compat alias
FEW_SHOT_EXAMPLES = FEW_SHOT_MODERN


def build_messages(image_base64, previous_code=None, modification=None, style="modern", purpose=None, sketch_analysis=None):
    """
    Build the messages array for the code generation call (agent step 2).

    `sketch_analysis` (optional): structured dict returned by the analyze call
    (agent step 1). When provided, it's injected as a grounding spec so the
    model doesn't have to re-analyze the image — it can focus purely on code.

    `purpose` (optional): key from PURPOSE_INTENTS — gives the AI critical
    context about what type of app to build (game, card, dashboard, etc.)
    """
    messages = []
    # Use style-specific few-shot examples to prevent pattern contamination.
    # Dashboard examples are ONLY injected when style="saas" to avoid the
    # "few-shot poisoning" where any 2-box sketch gets turned into a sidebar app.
    # Also use SAAS examples when purpose="dashboard" regardless of style.
    if style == "saas" or purpose == "dashboard":
        messages.extend(FEW_SHOT_SAAS)
    else:
        messages.extend(FEW_SHOT_MODERN)

    # ── Build analysis block (from agent step 1) ────────────────────────────
    analysis_block = ""
    if sketch_analysis:
        elements_list = "\n".join(f"  • {e}" for e in sketch_analysis.get("elements", []))
        analysis_block = (
            f'📋 SKETCH ANALYSIS (verified by dedicated analyzer — trust this over your own reading):\n'
            f'  Layout:        {sketch_analysis.get("layout", "unknown")}\n'
            f'  Element count: {sketch_analysis.get("element_count", "?")}\n'
            f'  Complexity:    {sketch_analysis.get("complexity", "?")}\n'
            f'  Has sidebar:   {sketch_analysis.get("has_sidebar", False)}\n'
            f'  Has header:    {sketch_analysis.get("has_header", False)}\n'
            f'  Has grid:      {sketch_analysis.get("has_grid", False)} '
            f'(columns: {sketch_analysis.get("grid_columns") or "n/a"})\n'
            f'  Target JSX lines: ~{sketch_analysis.get("suggested_jsx_lines", 80)}\n'
            f'  Elements:\n{elements_list}\n\n'
            f'CRITICAL: Your component MUST reproduce ALL {sketch_analysis.get("element_count", "listed")} elements above. '
            f'Do NOT add sidebar/grid structures that are not in the analysis.\n\n'
        )

    # Resolve purpose hint — prepend to user message for maximum context
    purpose_block = ""
    if purpose and purpose in PURPOSE_INTENTS:
        intent = PURPOSE_INTENTS[purpose]
        purpose_block = (
            f'🎯 USER INTENT: {intent["emoji"]} {intent["name"].upper()}\n'
            f'{intent["hint"]}\n\n'
            f'Apply this intent when interpreting EVERY element in the sketch below.\n\n'
        )

    user_content = []

    # Always include the image first
    user_content.append({
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/png",
            "data": image_base64,
        },
    })

    if previous_code and modification:
        # Iteration: text modification of existing component
        user_content.append({
            "type": "text",
            "text": (
                f'{purpose_block}'
                f'Here is the current component code:\n```\n{previous_code}\n```\n\n'
                f'The user wants to change: "{modification}"\n\n'
                f'Update ONLY what the user requested. Keep all other elements, styles, and interactions intact. '
                f'Output the complete updated component as strict JSON only.'
            ),
        })
    elif previous_code:
        # Iteration: user re-drew the sketch
        user_content.append({
            "type": "text",
            "text": (
                f'{analysis_block}'
                f'{purpose_block}'
                f'The user has updated their sketch. Here is the previous component:\n```\n{previous_code}\n```\n\n'
                f'Update the component to match the new sketch layout while preserving good design choices from the previous version. '
                f'Output strict JSON only.'
            ),
        })
    else:
        # First generation — most detailed instruction
        style_name = STYLE_PRESETS.get(style, STYLE_PRESETS["modern"])["name"]
        # When analysis is provided: skip self-analysis steps (already done), jump straight to code
        if sketch_analysis:
            gen_instruction = (
                f'{analysis_block}'
                f'{purpose_block}'
                f'Now generate the React component based on the analysis above.\n\n'
                f'Requirements:\n'
                f'  • Reproduce EVERY element listed in the analysis (exact count: {sketch_analysis.get("element_count", "?")})\n'
                f'  • Apply the "{style_name}" design style\n'
                f'  • Target ~{sketch_analysis.get("suggested_jsx_lines", 80)} lines of JSX\n'
                f'  • At least 2 working useState interactions\n'
                f'  • Realistic placeholder data (real names, prices, emails)\n\n'
                f'Output strict JSON only: {{"component": "...", "description": "..."}}'
            )
        else:
            # Fallback: no analysis available — do it in one shot (original behavior)
            gen_instruction = (
                f'{purpose_block}'
                f'Analyze this sketch carefully before coding.\n\n'
                f'STEP 1 — Count every element: boxes, text labels, inputs, buttons, circles, columns, rows.\n'
                f'STEP 2 — Identify the layout pattern: sidebar+main? centered card? grid? stacked?\n'
                f'STEP 3 — Generate a COMPLETE, BEAUTIFUL React component that:\n'
                f'  • Reproduces the EXACT element count and layout from the sketch\n'
                f'  • Applies the "{style_name}" design style\n'
                f'  • Has at least 2 working useState interactions\n'
                f'  • Uses realistic placeholder data (real names, prices, emails)\n'
                f'  • Is minimum 80 lines of JSX\n\n'
                f'Output strict JSON only: {{"component": "...", "description": "..."}}'
            )
        user_content.append({"type": "text", "text": gen_instruction})

    messages.append({"role": "user", "content": user_content})
    return messages
