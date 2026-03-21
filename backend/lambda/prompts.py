"""
Prompt templates for Sketch → Living App.
"""

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

BASE_PROMPT = """You are an EXPERT UI designer and React developer. You convert hand-drawn wireframe sketches into BEAUTIFUL, PRODUCTION-QUALITY React applications with Tailwind CSS.

Your goal is to create UIs that look like they were designed by a top-tier design agency.

RULES:
1. Output ONLY a valid JSON object. No markdown, no backticks, no explanation.
2. The JSON must have exactly two fields: "component" and "description"
3. "component" contains a complete, self-contained React functional component
4. The component MUST use `export default function App()`
5. ONLY allowed imports: React hooks from "react" — NO other imports
6. Use ONLY Tailwind CSS utility classes for ALL styling
7. Use realistic placeholder data — real names, emails, product names, prices
8. Match the LAYOUT of the sketch, but ELEVATE the visual design
9. ALWAYS generate a COMPLETE, VISUALLY RICH, INTERACTIVE UI
10. If the sketch is abstract or unclear, interpret it as the closest meaningful UI
11. All interactive elements MUST work: forms with useState, toggles, tabs, counters
12. Add micro-interactions: hover effects, transitions, active states, focus rings
13. Use inline SVG for icons — do NOT import icon libraries

{style_guidelines}

QUALITY STANDARDS:
- Clear visual hierarchy: large bold headings, medium subheadings, small body text
- Visual depth with layered shadows, borders, background colors
- At least one interactive element with working state
- Buttons: hover + active states
- Inputs: controlled with useState, focus states
- Gradient backgrounds or accent colors to make UI pop
- Animations with transition-all duration-200

OUTPUT FORMAT (strict JSON, no markdown wrapping):
""" + '{"component": "import { useState } from \\"react\\";\\nexport default function App() { ... }", "description": "Brief description"}'


def get_system_prompt(style="modern"):
    preset = STYLE_PRESETS.get(style, STYLE_PRESETS["modern"])
    return BASE_PROMPT.replace("{style_guidelines}", preset["guidelines"])


# Default for backward compatibility
SYSTEM_PROMPT = get_system_prompt("modern")


FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a React component."},
            {"type": "text", "text": "[Sketch: login form with title, email, password, sign in button, forgot password link]"},
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nexport default function App() {\\n  const [email, setEmail] = useState(\\"\\");\\n  const [password, setPassword] = useState(\\"\\");\\n  const [loading, setLoading] = useState(false);\\n  const handleSubmit = () => { setLoading(true); setTimeout(() => setLoading(false), 1500); };\\n  return (\\n    <div className=\\"min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100\\">\\n      <div className=\\"w-full max-w-md\\">\\n        <div className=\\"bg-white rounded-2xl shadow-xl border border-gray-100 p-8\\">\\n          <div className=\\"text-center mb-8\\">\\n            <div className=\\"w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25\\">\\n              <svg className=\\"w-7 h-7 text-white\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\"><path strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\" strokeWidth={2} d=\\"M13 10V3L4 14h7v7l9-11h-7z\\" /></svg>\\n            </div>\\n            <h1 className=\\"text-2xl font-bold text-gray-900\\">Welcome back</h1>\\n            <p className=\\"text-sm text-gray-500 mt-1\\">Sign in to your account</p>\\n          </div>\\n          <div className=\\"space-y-4\\">\\n            <div>\\n              <label className=\\"text-sm font-medium text-gray-700 mb-1.5 block\\">Email</label>\\n              <input type=\\"email\\" value={email} onChange={e => setEmail(e.target.value)} placeholder=\\"you@example.com\\" className=\\"w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all\\" />\\n            </div>\\n            <div>\\n              <label className=\\"text-sm font-medium text-gray-700 mb-1.5 block\\">Password</label>\\n              <input type=\\"password\\" value={password} onChange={e => setPassword(e.target.value)} placeholder=\\"\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\" className=\\"w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all\\" />\\n            </div>\\n            <button onClick={handleSubmit} className=\\"w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25\\">{loading ? \\"Signing in...\\" : \\"Sign in\\"}</button>\\n            <p className=\\"text-center text-sm text-blue-600 hover:underline cursor-pointer\\">Forgot password?</p>\\n          </div>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}", "description": "Premium login form with gradient accents and loading state"}',
    },
]


def build_messages(image_base64, previous_code=None, modification=None, style="modern"):
    messages = []
    messages.extend(FEW_SHOT_EXAMPLES)

    user_content = []

    user_content.append({
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/png",
            "data": image_base64,
        },
    })

    if previous_code and modification:
        user_content.append({
            "type": "text",
            "text": f'Here is the current code:\n```\n{previous_code}\n```\n\nThe user wants: "{modification}"\n\nUpdate only what\'s requested. Output complete updated component as JSON.',
        })
    elif previous_code:
        user_content.append({
            "type": "text",
            "text": f'The user updated their sketch. Previous code:\n```\n{previous_code}\n```\n\nAnalyze new sketch, update component. Preserve improvements. Output JSON.',
        })
    else:
        user_content.append({
            "type": "text",
            "text": "Convert this wireframe sketch into a beautiful, fully interactive React component. Make it look professional and polished. Output strict JSON only.",
        })

    messages.append({"role": "user", "content": user_content})
    return messages
