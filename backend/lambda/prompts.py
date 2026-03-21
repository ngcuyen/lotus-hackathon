"""
Prompt templates for Sketch → Living App.

These are the most critical part of the project.
Iterate on these prompts heavily during hours 2-6.
"""

SYSTEM_PROMPT = """You are a UI code generator that converts hand-drawn wireframe sketches into React components with Tailwind CSS.

RULES:
1. Output ONLY a valid JSON object. No markdown, no backticks, no explanation.
2. The JSON must have exactly two fields: "component" and "description"
3. "component" contains a complete, self-contained React functional component
4. The component must use ONLY Tailwind CSS utility classes for styling
5. The component must be named "App" and use `export default function App()`
6. Do NOT import anything except React hooks (useState, useEffect, etc.)
7. Use realistic placeholder data (real names, emails, lorem text)
8. Match the LAYOUT of the sketch as precisely as possible
9. Add subtle hover states and transitions for interactive elements
10. Mobile-first responsive design

OUTPUT FORMAT (strict JSON, no markdown wrapping):
{"component": "export default function App() { return (<div>...</div>); }", "description": "Brief description of detected UI"}

COMPONENT GUIDELINES:
- Use modern Tailwind: rounded-xl, shadow-sm, gap-*, etc.
- Inputs: border border-gray-300 rounded-lg px-3 py-2
- Buttons: bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700
- Cards: bg-white rounded-xl shadow-sm border border-gray-100 p-6
- Text: text-gray-900 for headings, text-gray-500 for secondary
- Always include proper spacing with space-y-* or gap-*
- If sketch shows a form, make inputs controlled with useState"""


# ─── Few-shot examples ───
# Include 2-3 examples of sketch descriptions → code
# This dramatically improves accuracy
FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert this wireframe sketch to a React component."},
            {
                "type": "text",
                "text": "[Imagine: A simple sketch showing a login form with 'Login' title, email input, password input, 'Sign In' button, and 'Forgot password?' link]",
            },
        ],
    },
    {
        "role": "assistant",
        "content": '{"component": "import { useState } from \\"react\\";\\nexport default function App() {\\n  const [email, setEmail] = useState(\\"\\");\\n  const [password, setPassword] = useState(\\"\\");\\n  return (\\n    <div className=\\"min-h-screen flex items-center justify-center bg-gray-50\\">\\n      <div className=\\"w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8\\">\\n        <h1 className=\\"text-2xl font-bold text-gray-900 mb-6\\">Login</h1>\\n        <div className=\\"space-y-4\\">\\n          <div>\\n            <label className=\\"text-sm text-gray-600 mb-1 block\\">Email</label>\\n            <input type=\\"email\\" value={email} onChange={e => setEmail(e.target.value)} placeholder=\\"you@example.com\\" className=\\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none\\" />\\n          </div>\\n          <div>\\n            <label className=\\"text-sm text-gray-600 mb-1 block\\">Password</label>\\n            <input type=\\"password\\" value={password} onChange={e => setPassword(e.target.value)} placeholder=\\"••••••••\\" className=\\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none\\" />\\n          </div>\\n          <button className=\\"w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors\\">Sign in</button>\\n          <p className=\\"text-center text-sm text-blue-600 hover:underline cursor-pointer\\">Forgot password?</p>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}", "description": "Login form with email and password inputs, sign-in button, and forgot password link"}',
    },
]


def build_messages(image_base64: str, previous_code: str = None, modification: str = None):
    """
    Build the messages array for Bedrock Claude API.

    Supports:
    - Initial generation: just image
    - Iterative refinement: image + previous code + modification text
    """
    messages = []

    # Add few-shot examples
    messages.extend(FEW_SHOT_EXAMPLES)

    # Build the user message
    user_content = []

    # Always include the image
    user_content.append({
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/png",
            "data": image_base64,
        },
    })

    # Base instruction
    if previous_code and modification:
        # Iterative refinement mode
        user_content.append({
            "type": "text",
            "text": f"""Here is the current code for this UI:
```
{previous_code}
```

The user wants this modification: "{modification}"

Update the component to reflect the change. Keep the overall structure, only modify what's requested.
Output the complete updated component as JSON.""",
        })
    elif previous_code:
        # Re-scan with existing context
        user_content.append({
            "type": "text",
            "text": f"""The user has updated their sketch. Here is the previous version's code:
```
{previous_code}
```

Analyze the new sketch and update the component. Preserve any improvements from the previous version.
Output the complete updated component as JSON.""",
        })
    else:
        # First generation
        user_content.append({
            "type": "text",
            "text": "Convert this wireframe sketch to a React component. Output strict JSON only.",
        })

    messages.append({"role": "user", "content": user_content})

    return messages
