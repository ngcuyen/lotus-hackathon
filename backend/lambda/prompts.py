"""
Prompt templates for Sketch → Living App.
"""

import json

# ─── Style presets ───
STYLE_PRESETS = {
    "modern": {
        "name": "Modern Minimal",
        "guidelines": """DESIGN STYLE — Modern Minimal:
- Color palette: white backgrounds, gray-50/100 surfaces, blue-600 primary, gray-900 text
- Cards: bg-white rounded-2xl shadow-lg border border-gray-100 p-6
- Buttons: bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-blue-700 shadow-sm
- Inputs: bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500
- Effects: hover:shadow-md transition-all duration-200, hover:-translate-y-0.5"""
    },
    "glassmorphism": {
        "name": "Glassmorphism",
        "guidelines": """DESIGN STYLE — Glassmorphism:
- Background: bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 min-h-screen
- Cards: bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8
- Buttons: bg-white/30 backdrop-blur-sm text-white rounded-2xl px-6 py-3 hover:bg-white/40 border border-white/20
- Inputs: bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50
- Typography: text-white for headings, text-white/70 for secondary
- Add decorative blurred circles: absolute w-72 h-72 bg-purple-300/30 rounded-full blur-3xl"""
    },
    "neobrutalism": {
        "name": "Neobrutalism",
        "guidelines": """DESIGN STYLE — Neobrutalism:
- Background: bg-[#fffbe6] (warm pastel)
- Cards: bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6
- Buttons: bg-[#ff6b6b] text-white border-2 border-black rounded-xl px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]
- Inputs: border-2 border-black rounded-xl px-4 py-3 bg-white font-medium
- Typography: font-black, use fun colors like text-[#ff6b6b], text-[#4ecdc4]
- Use emoji as decorative elements"""
    },
    "dark": {
        "name": "Dark Premium",
        "guidelines": """DESIGN STYLE — Dark Premium:
- Background: bg-[#0a0a0a] min-h-screen
- Cards: bg-gray-900/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm
- Buttons: bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-6 py-3 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25
- Inputs: bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-violet-500
- Typography: text-white headings, text-gray-400 secondary, text-violet-400 accents
- Gradient text: bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"""
    },
    "saas": {
        "name": "SaaS Dashboard",
        "guidelines": """DESIGN STYLE — SaaS Dashboard:
- Layout: flex min-h-screen — sidebar (w-64 bg-gray-900) + main (flex-1 bg-gray-50)
- Sidebar: dark bg, white text, nav items hover:bg-gray-800 rounded-lg, active bg-blue-600
- Metric cards: grid grid-cols-4 gap-4, bg-white rounded-xl p-6 shadow-sm, big number + label + trend
- Use inline SVG for simple chart placeholders
- Tables: bg-white rounded-xl, thead bg-gray-50
- Status badges: px-2.5 py-0.5 rounded-full text-xs font-medium"""
    },
}

BASE_PROMPT = """You are an ELITE UI engineer who creates PIXEL-PERFECT, PRODUCTION-QUALITY React applications from wireframe sketches. Your output should look like it was built by a $50,000 design agency.

Your goal: recreate the sketch as faithfully as possible — matching layout, proportions, colors, typography, and every visual detail.

RULES:
1. Output ONLY a valid JSON object. No markdown, no backticks, no explanation.
2. The JSON must have exactly two fields: "component" and "description"
3. "component" contains a complete, self-contained React functional component
4. The component MUST use `export default function App()`
5. Allowed imports: React hooks from "react", AND recharts (LineChart, BarChart, PieChart, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Line, Bar, Pie, Cell, Area, Legend)
6. Use Tailwind CSS utility classes AND inline styles where needed for precise control
7. Use realistic placeholder data — real names, emails, product names, prices, chart data with 5-7 data points
8. Match the LAYOUT of the sketch PRECISELY — respect element positions, proportions, grid structure, and hierarchy
9. ALWAYS generate a COMPLETE, VISUALLY RICH, INTERACTIVE UI — no shortcuts, no placeholders
10. All interactive elements MUST work: forms with useState, toggles, tabs, counters, active nav states
11. Add micro-interactions: hover effects, transitions, active states, focus rings, transform on hover
12. Use inline SVG for icons — do NOT import icon libraries

VISUAL QUALITY REQUIREMENTS:
- Use CSS gradients for backgrounds: linear-gradient, radial-gradient
- Add visual depth: multiple shadow layers (shadow-lg + shadow-color), border highlights, backdrop-blur
- Charts: use recharts library for ALL charts/graphs — AreaChart, LineChart, BarChart, PieChart with proper gradients and colors
- For donut charts: use PieChart with innerRadius/outerRadius, center text overlay with absolute positioning
- Color-code data: each data series gets a distinct, vibrant color
- Typography hierarchy: 3+ font sizes, font-weight variation (400/500/600/700/800)
- Spacing rhythm: consistent padding/margin scale
- Dark themes: use subtle borders (rgba white), glass effects (bg-white/5 backdrop-blur), gradient borders
- Light themes: layered shadows, subtle background tints, crisp borders
- Decorative elements: gradient orbs, subtle patterns, colored dividers, badge indicators
- Every card/section needs: proper padding, border-radius, background, subtle border or shadow
- Sidebar navigation: active state with highlight bar/background, section headers, proper spacing

{style_guidelines}

QUALITY STANDARDS:
- Clear visual hierarchy: large bold headings, medium subheadings, small body text
- Visual depth with layered shadows, borders, background colors
- At least one interactive element with working state
- Buttons: hover + active states
- Inputs: controlled with useState, focus states
- Gradient backgrounds or accent colors to make UI pop
- Animations with transition-all duration-200
- POPULATE WITH RICH DATA: use 5-10 realistic items (names, messages, prices, dates) — never leave sections empty or with only 1-2 items
- Every list/grid/table must have enough items to feel like a real app
- Use inline SVG icons generously — every nav item, button, and card should have an icon

OUTPUT FORMAT (strict JSON, no markdown wrapping):
""" + '{"component": "import { useState } from \\"react\\";\\nexport default function App() { ... }", "description": "Brief description"}'


PURPOSE_INTENTS = {
    "landing": "a marketing landing page with: hero section (big headline, subtitle, CTA button, hero image placeholder), features grid (3-4 cards with icons), social proof/testimonials (avatar + quote + name), pricing section or CTA banner, footer with links. Use gradient backgrounds, large typography, and plenty of whitespace.",
    "portfolio": "a personal portfolio with: hero intro (name, title, short bio, avatar placeholder), project showcase (3+ cards with image placeholder, title, description, tech tags, link), skills section (progress bars or tag cloud), contact form (name, email, message). Make it feel personal and creative.",
    "webapp": "a web application with: top navigation bar (logo, nav links, user avatar), sidebar or tab navigation, main content area with data display (cards/lists), interactive controls (buttons, toggles, dropdowns). Include at least 8-10 realistic data items.",
    "poster": "a visually striking poster/banner with: bold oversized typography, decorative geometric shapes, imagery placeholders, color blocks, layered elements. Focus on visual impact over interactivity.",
    "dashboard": "an analytics dashboard with: sidebar navigation (logo, 5+ nav items, active state), top bar (search, notifications, avatar), 4 metric cards (icon, value, label, trend arrow), line/bar chart placeholder (use inline SVG with realistic data points), data table (5+ rows, sortable headers, status badges, pagination). Make it data-rich.",
    "ecommerce": "an e-commerce page with: search/filter bar, product grid (4-6 products with image placeholder, name, price, rating stars, reviews count, add-to-cart), shopping cart sidebar or badge, category filters, sort dropdown. Include realistic product names and prices.",
    "form": "a multi-step or sectioned form with: grouped field sections (personal info, address, preferences), various input types (text, email, select, checkbox, radio, textarea), inline validation states (error/success), progress indicator, submit button with loading state. At least 8 fields.",
    "blog": "a blog/article layout with: featured image placeholder (16:9), article title (large), author info (avatar, name, date, read time), rich body text (paragraphs, a subheading, a blockquote), tags, share buttons, related posts grid (3 cards). Use good typography hierarchy.",
    "chat": "a full-featured chat application with: LEFT sidebar (search bar, conversation list with 5+ contacts each showing avatar circle with initials, name, last message preview truncated, timestamp, unread badge count), RIGHT chat area (header with contact name/avatar/online status, scrollable message area with 8+ messages alternating sent/received with timestamps and read receipts, typing indicator dots animation, message input bar with attachment button, text input, send button). Include realistic conversation data. Messages should have proper bubble styling with tails.",
    "game": "a game UI with: score/lives display, interactive game board or play area (grid, cards, or canvas), control buttons (start, pause, restart), level indicator, high score, timer. Make the game actually playable with useState logic.",
    "mobile": "a mobile app screen (max-w-sm mx-auto with device frame): status bar, main content with cards/lists, bottom tab bar (4-5 tabs with icons and labels, active state). Use large touch targets (min 44px), rounded corners, and mobile-appropriate spacing.",
    "admin": "an admin panel with: sidebar (logo, nav sections), data table (6+ rows with checkbox select, avatar, name, email, role, status badge, actions dropdown), top bar with search and filters, bulk action buttons, pagination (showing 'Page 1 of 5, 48 results'). Include CRUD action buttons.",
    "card": "a professional business card / digital namecard with: person's name (large, bold), job title, company name/logo placeholder, contact info (phone, email, website, address), social media icons, QR code placeholder. Use elegant typography, subtle gradients or accent colors, clean layout. Should look print-ready and premium.",
    "invitation": "an event invitation card with: event name (large decorative typography), date/time/location details, RSVP section or button, decorative borders or ornamental elements, host name, dress code or special notes. Use elegant fonts, rich colors, and celebratory visual elements.",
    "menu": "a restaurant/cafe menu with: restaurant name and logo placeholder at top, menu sections (appetizers, mains, desserts, drinks) each with 3-5 items showing name, description, and price. Use elegant typography hierarchy, decorative dividers between sections, and a cohesive color scheme.",
    "resume": "a professional one-page resume/CV with: header (name, title, contact info, photo placeholder), professional summary, work experience (2-3 entries with company, role, dates, bullet points), education, skills (progress bars or tags), languages. Use clean grid layout, clear hierarchy, and professional typography.",
}


# ─── Step 2: UI Design Spec ───────────────────────────────────────────────────

DESIGNER_SYSTEM_PROMPT = """You are a WORLD-CLASS UI designer. Given a sketch analysis and style requirements, you create a detailed design specification that will make the final UI look STUNNING.

You receive:
1. A sketch analysis (layout, components, sections)
2. A style preset
3. An optional purpose

You output ONLY a valid JSON object with this structure:
{
  "color_palette": {
    "primary": "tailwind color (e.g. blue-600)",
    "secondary": "tailwind color",
    "accent": "tailwind color",
    "background": "full tailwind class (e.g. bg-gradient-to-br from-slate-900 to-slate-800)",
    "surface": "card/container bg class",
    "text_primary": "text color class",
    "text_secondary": "text color class"
  },
  "typography": {
    "heading": "tailwind classes for h1",
    "subheading": "tailwind classes for h2/h3",
    "body": "tailwind classes for body text",
    "caption": "tailwind classes for small text"
  },
  "components": [
    {
      "name": "component name from analysis",
      "tailwind": "specific tailwind classes to apply",
      "hover": "hover effect classes",
      "animation": "transition/animation classes"
    }
  ],
  "layout_classes": "top-level container tailwind classes",
  "special_effects": ["list of CSS effects: gradients, shadows, backdrop-blur, etc."],
  "micro_interactions": ["list of hover/focus/active state descriptions"],
  "decorative_elements": ["floating shapes, gradient orbs, patterns, dividers"]
}

DESIGN PRINCIPLES:
- Create VISUAL DEPTH: layered shadows, subtle gradients, border highlights
- Use CONTRAST: large vs small, bold vs light, colorful vs neutral
- Add DELIGHT: smooth transitions, hover transforms, focus rings, subtle animations
- Think PREMIUM: the UI should look like a $10,000 design agency built it
- Be SPECIFIC with Tailwind classes — don't be vague
- Every interactive element needs hover + active + focus states
- Add decorative elements: gradient orbs, subtle patterns, dividers with gradients
- Use shadow-xl/2xl for depth, not just shadow-sm
- For charts/graphs: specify recharts component types (AreaChart, LineChart, BarChart, PieChart) with gradient fills and proper colors
- For donut charts: PieChart with innerRadius, center label overlay

Output ONLY valid JSON — no markdown, no backticks, no explanation."""


def build_design_messages(sketch_analysis, style="modern", purpose=None):
    """Build messages for UI design spec generation (Step 2)."""
    preset = STYLE_PRESETS.get(style, STYLE_PRESETS["modern"])
    content = f"""SKETCH ANALYSIS:
{json.dumps(sketch_analysis, indent=2)}

STYLE PRESET: {preset['name']}
{preset['guidelines']}"""
    if purpose and purpose in PURPOSE_INTENTS:
        content += f"\n\nPURPOSE: {PURPOSE_INTENTS[purpose]}"
    content += "\n\nCreate a detailed design specification that will make this UI look absolutely stunning."
    return [{"role": "user", "content": content}]


def get_system_prompt(style="modern", purpose=None):
    preset = STYLE_PRESETS.get(style, STYLE_PRESETS["modern"])
    prompt = BASE_PROMPT.replace("{style_guidelines}", preset["guidelines"])
    if purpose and purpose in PURPOSE_INTENTS:
        prompt += f"\n\nPURPOSE CONTEXT: The user intends this to be {PURPOSE_INTENTS[purpose]}. Tailor your output accordingly — use appropriate layout patterns, sections, and content for this type of page."
    return prompt


# Default for backward compatibility
SYSTEM_PROMPT = get_system_prompt("modern")


# ─── Step 1: Sketch Analysis ─────────────────────────────────────────────────

ANALYZE_SKETCH_SYSTEM_PROMPT = """You are a UI/UX expert analyzing a hand-drawn wireframe sketch.
Your job is to extract the STRUCTURAL and LAYOUT information from the sketch — NOT to generate code.

Analyze the sketch and return ONLY a valid JSON object with these fields:
{
  "layout": "brief layout description (e.g. 'centered card', 'sidebar + main', 'grid layout')",
  "sections": ["list", "of", "major", "sections", "top-to-bottom"],
  "components": ["list", "of", "all", "UI", "components", "detected"],
  "interactions": ["list", "of", "interactive", "elements", "detected"],
  "inferred_purpose": "what type of page/app this appears to be",
  "complexity": "simple | medium | complex"
}

Rules:
- Be specific and literal about what you SEE in the sketch
- List components from top to bottom, left to right
- For sections: use names like 'header', 'hero', 'form', 'card', 'footer', 'sidebar', 'nav', 'table'
- For components: be specific — 'email input', 'password input', 'submit button', 'logo circle', 'nav links', 'metric card x4', 'data table'
- For interactions: 'form submit', 'tab switch', 'toggle', 'search', 'filter'
- Output ONLY valid JSON — no markdown, no backticks, no explanation"""


def build_analysis_messages(image_base64):
    """Build single-turn message for sketch analysis (Step 1)."""
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
                    "text": "Analyze this wireframe sketch and return structured JSON describing its layout, sections, components, and purpose.",
                },
            ],
        }
    ]


# ─── Few-shot examples ────────────────────────────────────────────────────────

FEW_SHOT_MODERN = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a React component."},
            {"type": "text", "text": "[Sketch: login form with title, email input, password input, sign in button, forgot password link, social login button]"},
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nexport default function App() {\\n  const [email, setEmail] = useState(\\"\\");\\n  const [password, setPassword] = useState(\\"\\");\\n  const [loading, setLoading] = useState(false);\\n  const handleSubmit = () => { setLoading(true); setTimeout(() => setLoading(false), 1500); };\\n  return (\\n    <div className=\\"min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100\\">\\n      <div className=\\"w-full max-w-md\\">\\n        <div className=\\"bg-white rounded-2xl shadow-xl border border-gray-100 p-8\\">\\n          <div className=\\"text-center mb-8\\">\\n            <div className=\\"w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25\\">\\n              <svg className=\\"w-7 h-7 text-white\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M13 10V3L4 14h7v7l9-11h-7z\\" /></svg>\\n            </div>\\n            <h1 className=\\"text-2xl font-bold text-gray-900\\">Welcome back</h1>\\n            <p className=\\"text-sm text-gray-500 mt-1\\">Sign in to your account</p>\\n          </div>\\n          <div className=\\"space-y-4\\">\\n            <div>\\n              <label className=\\"text-sm font-medium text-gray-700 mb-1.5 block\\">Email</label>\\n              <input type=\\"email\\" value={email} onChange={e => setEmail(e.target.value)} placeholder=\\"you@example.com\\" className=\\"w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all\\" />\\n            </div>\\n            <div>\\n              <label className=\\"text-sm font-medium text-gray-700 mb-1.5 block\\">Password</label>\\n              <input type=\\"password\\" value={password} onChange={e => setPassword(e.target.value)} placeholder=\\"\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\" className=\\"w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all\\" />\\n            </div>\\n            <button onClick={handleSubmit} className=\\"w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25\\">{loading ? \\"Signing in...\\" : \\"Sign in\\"}</button>\\n            <p className=\\"text-center text-sm text-blue-600 hover:underline cursor-pointer\\">Forgot password?</p>\\n          </div>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}", "description": "Premium login form with gradient accents and loading state"}',
    },
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a React component."},
            {"type": "text", "text": "[Sketch: e-commerce product grid with search bar at top, 3 product cards each with image placeholder, product name, price, star rating, and add-to-cart button]"},
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nexport default function App() {\\n  const [cart, setCart] = useState([]);\\n  const [search, setSearch] = useState(\\"\\");\\n  const products = [\\n    { id: 1, name: \\"Wireless Headphones\\", price: 79.99, rating: 4, reviews: 128 },\\n    { id: 2, name: \\"Mechanical Keyboard\\", price: 149.99, rating: 5, reviews: 84 },\\n    { id: 3, name: \\"USB-C Hub\\", price: 49.99, rating: 4, reviews: 210 },\\n  ];\\n  const addToCart = (id) => setCart(prev => [...prev, id]);\\n  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));\\n  return (\\n    <div className=\\"min-h-screen bg-gray-50 p-8\\">\\n      <div className=\\"max-w-4xl mx-auto\\">\\n        <div className=\\"flex items-center justify-between mb-6\\">\\n          <h1 className=\\"text-2xl font-bold text-gray-900\\">Products</h1>\\n          <span className=\\"bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold\\">{cart.length} items</span>\\n        </div>\\n        <input value={search} onChange={e => setSearch(e.target.value)} placeholder=\\"Search products...\\" className=\\"w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm mb-6 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none\\" />\\n        <div className=\\"grid grid-cols-3 gap-6\\">\\n          {filtered.map(p => (\\n            <div key={p.id} className=\\"bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-1\\">\\n              <div className=\\"h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center\\">\\n                <svg className=\\"w-12 h-12 text-gray-300\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={1} d=\\"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\\" /></svg>\\n              </div>\\n              <div className=\\"p-4\\">\\n                <h3 className=\\"font-semibold text-gray-900 mb-1\\">{p.name}</h3>\\n                <p className=\\"text-lg font-bold text-blue-600 mb-2\\">${p.price}</p>\\n                <div className=\\"flex items-center gap-1 mb-3\\">\\n                  {[...Array(5)].map((_, i) => <svg key={i} className={`w-3.5 h-3.5 ${i < p.rating ? \\"text-amber-400\\" : \\"text-gray-200\\"}`} fill=\\"currentColor\\" viewBox=\\"0 0 20 20\\"><path d=\\"M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z\\"/></svg>)}\\n                  <span className=\\"text-xs text-gray-400\\">({p.reviews})</span>\\n                </div>\\n                <button onClick={() => addToCart(p.id)} className=\\"w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all\\">Add to Cart</button>\\n              </div>\\n            </div>\\n          ))}\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}", "description": "E-commerce product grid with search and cart"}',
    },
]

FEW_SHOT_SAAS = FEW_SHOT_MODERN + [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a React component."},
            {"type": "text", "text": "[Sketch: SaaS dashboard — left sidebar with nav items, top bar with search and avatar, 4 metric cards, data table with rows]"},
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nexport default function App() {\\n  const [activeNav, setActiveNav] = useState(\\"dashboard\\");\\n  const metrics = [\\n    { label: \\"Total Revenue\\", value: \\"$48,295\\", trend: \\"+12.5%\\", up: true },\\n    { label: \\"Active Users\\", value: \\"3,842\\", trend: \\"+8.1%\\", up: true },\\n    { label: \\"Conversion\\", value: \\"4.6%\\", trend: \\"-0.3%\\", up: false },\\n    { label: \\"Avg. Order\\", value: \\"$125\\", trend: \\"+3.2%\\", up: true },\\n  ];\\n  const rows = [\\n    { name: \\"Alice Chen\\", email: \\"alice@example.com\\", plan: \\"Pro\\", status: \\"Active\\", mrr: \\"$99\\" },\\n    { name: \\"Bob Smith\\", email: \\"bob@example.com\\", plan: \\"Starter\\", status: \\"Active\\", mrr: \\"$29\\" },\\n    { name: \\"Carol Wu\\", email: \\"carol@example.com\\", plan: \\"Enterprise\\", status: \\"Pending\\", mrr: \\"$499\\" },\\n  ];\\n  const navItems = [\\n    { id: \\"dashboard\\", label: \\"Dashboard\\" },\\n    { id: \\"users\\", label: \\"Users\\" },\\n    { id: \\"revenue\\", label: \\"Revenue\\" },\\n    { id: \\"settings\\", label: \\"Settings\\" },\\n  ];\\n  return (\\n    <div className=\\"flex min-h-screen bg-gray-50\\">\\n      <aside className=\\"w-60 bg-gray-900 flex flex-col p-4\\">\\n        <div className=\\"flex items-center gap-2.5 px-2 mb-8 mt-2\\">\\n          <div className=\\"w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center\\"><svg className=\\"w-4 h-4 text-white\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M13 10V3L4 14h7v7l9-11h-7z\\"/></svg></div>\\n          <span className=\\"text-white font-bold text-sm\\">Metric</span>\\n        </div>\\n        <nav className=\\"space-y-1\\">\\n          {navItems.map(item => (\\n            <button key={item.id} onClick={() => setActiveNav(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === item.id ? \\"bg-blue-600 text-white\\" : \\"text-gray-400 hover:bg-gray-800 hover:text-white\\"}`}>{item.label}</button>\\n          ))}\\n        </nav>\\n      </aside>\\n      <main className=\\"flex-1 flex flex-col\\">\\n        <header className=\\"bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between\\">\\n          <input placeholder=\\"Search...\\" className=\\"bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none\\" />\\n          <div className=\\"w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold\\">AC</div>\\n        </header>\\n        <div className=\\"p-6 space-y-6\\">\\n          <div className=\\"grid grid-cols-4 gap-4\\">\\n            {metrics.map(m => (\\n              <div key={m.label} className=\\"bg-white rounded-xl p-5 shadow-sm border border-gray-100\\">\\n                <p className=\\"text-xs font-medium text-gray-500 mb-2\\">{m.label}</p>\\n                <p className=\\"text-2xl font-bold text-gray-900 mb-1\\">{m.value}</p>\\n                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${m.up ? \\"bg-emerald-50 text-emerald-600\\" : \\"bg-red-50 text-red-600\\"}`}>{m.trend}</span>\\n              </div>\\n            ))}\\n          </div>\\n          <div className=\\"bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden\\">\\n            <table className=\\"w-full text-sm\\">\\n              <thead className=\\"bg-gray-50 border-b border-gray-200\\"><tr>{[\\"User\\",\\"Email\\",\\"Plan\\",\\"Status\\",\\"MRR\\"].map(h => <th key={h} className=\\"px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider\\">{h}</th>)}</tr></thead>\\n              <tbody className=\\"divide-y divide-gray-100\\">{rows.map(r => <tr key={r.email} className=\\"hover:bg-gray-50\\"><td className=\\"px-5 py-3.5 font-medium text-gray-900\\">{r.name}</td><td className=\\"px-5 py-3.5 text-gray-500\\">{r.email}</td><td className=\\"px-5 py-3.5\\">{r.plan}</td><td className=\\"px-5 py-3.5\\"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.status === \\"Active\\" ? \\"bg-emerald-100 text-emerald-700\\" : \\"bg-amber-100 text-amber-700\\"}`}>{r.status}</span></td><td className=\\"px-5 py-3.5 font-semibold text-gray-900\\">{r.mrr}</td></tr>)}</tbody>\\n            </table>\\n          </div>\\n        </div>\\n      </main>\\n    </div>\\n  );\\n}", "description": "SaaS analytics dashboard with sidebar, metric cards, and user table"}',
    },
]


def _get_few_shot(style, purpose):
    """Route to appropriate few-shot examples based on style/purpose."""
    if style == "saas" or purpose in ("dashboard", "admin"):
        return FEW_SHOT_SAAS
    return FEW_SHOT_MODERN


def build_messages(
    image_base64,
    previous_code=None,
    modification=None,
    style="modern",
    purpose=None,
    sketch_analysis=None,
    design_spec=None,
):
    """Build messages for code generation (Step 2).

    Args:
        image_base64: Base64-encoded sketch image
        previous_code: Previously generated component (for iteration)
        modification: User's text modification request
        style: Visual style preset key
        purpose: App purpose/type hint
        sketch_analysis: Structured analysis from Step 1 (ANALYZE_SKETCH_SYSTEM_PROMPT)
    """
    messages = []
    messages.extend(_get_few_shot(style, purpose))

    user_content = []

    # Add sketch image
    user_content.append({
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/png",
            "data": image_base64,
        },
    })

    # Inject sketch analysis as grounding context
    if sketch_analysis:
        analysis_text = (
            f"SKETCH ANALYSIS (use this as your spec — mirror this structure exactly):\n"
            f"- Layout: {sketch_analysis.get('layout', 'unknown')}\n"
            f"- Sections: {', '.join(sketch_analysis.get('sections', []))}\n"
            f"- Components: {', '.join(sketch_analysis.get('components', []))}\n"
            f"- Interactions: {', '.join(sketch_analysis.get('interactions', []))}\n"
            f"- Purpose: {sketch_analysis.get('inferred_purpose', 'unknown')}\n"
            f"- Complexity: {sketch_analysis.get('complexity', 'medium')}\n"
            f"\nBuild EXACTLY this structure — don't add sections not present in the sketch."
        )
        user_content.append({"type": "text", "text": analysis_text})

    # Inject design spec from Step 2
    if design_spec:
        spec_text = (
            f"DESIGN SPECIFICATION (follow these EXACT styles):\n"
            f"- Colors: primary={design_spec.get('color_palette', {}).get('primary', '')}, "
            f"bg={design_spec.get('color_palette', {}).get('background', '')}, "
            f"surface={design_spec.get('color_palette', {}).get('surface', '')}\n"
            f"- Layout: {design_spec.get('layout_classes', '')}\n"
            f"- Effects: {', '.join(design_spec.get('special_effects', []))}\n"
            f"- Micro-interactions: {', '.join(design_spec.get('micro_interactions', []))}\n"
            f"- Decorative: {', '.join(design_spec.get('decorative_elements', []))}\n"
        )
        components = design_spec.get("components", [])
        if components:
            spec_text += "- Component styles:\n"
            for c in components:
                spec_text += f"  * {c.get('name','')}: {c.get('tailwind','')} hover:{c.get('hover','')} anim:{c.get('animation','')}\n"
        spec_text += "\nApply these design tokens EXACTLY. Make the UI look PREMIUM and POLISHED."
        user_content.append({"type": "text", "text": spec_text})

    # Purpose hint
    if purpose and purpose in PURPOSE_INTENTS:
        user_content.append({
            "type": "text",
            "text": f"USER PURPOSE: Build this as {PURPOSE_INTENTS[purpose]}.",
        })

    # Instruction text
    if previous_code and modification:
        user_content.append({
            "type": "text",
            "text": (
                f'Here is the current code:\n```\n{previous_code}\n```\n\n'
                f'The user wants: "{modification}"\n\n'
                f"Update only what's requested. Output complete updated component as JSON."
            ),
        })
    elif previous_code:
        user_content.append({
            "type": "text",
            "text": (
                f"The user updated their sketch. Previous code:\n```\n{previous_code}\n```\n\n"
                "Analyze new sketch, update component. Preserve improvements. Output JSON."
            ),
        })
    else:
        user_content.append({
            "type": "text",
            "text": (
                "Convert this wireframe sketch into a beautiful, fully interactive React component. "
                "Follow the sketch structure precisely. Make it look professional and polished. "
                "Output strict JSON only."
            ),
        })

    messages.append({"role": "user", "content": user_content})
    return messages
