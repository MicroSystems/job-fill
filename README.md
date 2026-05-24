# Job Fill — Firefox Extension

Auto-fills job applications on Workday, Greenhouse, Lever, Ashby, SmartRecruiters, and more.

## AI Coding Guidelines

Karpathy-inspired behavioral guidelines (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) are installed in two formats:

- **`CLAUDE.md`** — per-project file for Claude Code and compatible tools
- **`.opencode/skills/karpathy-guidelines/SKILL.md`** — loadable skill for OpenCode agents

## Quick Start

```bash
npm install
npm run build          # production build → dist/
npm run dev            # dev mode with watch
npm run start:firefox  # build + run in Firefox Developer Edition
```

## Loading in Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `dist/manifest.json`

## Usage

1. Click the extension icon → **Profile** tab
2. Fill in your name, email, phone, resume, work history, etc.
3. Click **Save Profile**
4. Navigate to any job application page on Workday/Greenhouse/Lever/etc.
5. Click the extension icon → **Auto-Fill** tab → **Auto-Fill This Page**

## Supported Platforms

| Platform | Detection | Coverage |
|----------|-----------|----------|
| Workday | `[data-automation-id]` attributes, hostname | Name, email, phone, address, resume, EEO |
| Greenhouse | `#greenhouse_form` | Name, email, phone, LinkedIn, resume, EEO |
| Lever | `[data-qa]` selectors, hostname | Name, email, phone, resume, cover letter |
| Ashby | `[data-test-id]`, `.ashby-application-form` | Name, email, phone, resume, EEO |
| SmartRecruiters | Hostname, `.sr-main` | Name, email, phone, resume |
| Generic | Label heuristics | Falls back to label-based field matching on any site |

## Project Structure

```
src/
├── types.ts              # Profile schema, shared types
├── storage.ts            # IndexedDB persistence
├── background.ts         # Service worker
├── webext.d.ts           # browser.* API types
├── content/
│   ├── content.ts        # Content script entry
│   ├── detector.ts       # ATS platform detection
│   ├── driver.ts         # Driver dispatch + FillDriver interface
│   ├── filler.ts         # DOM utilities (fill, select, upload)
│   └── drivers/          # Platform-specific drivers
│       ├── generic.ts
│       ├── workday.ts
│       ├── greenhouse.ts
│       ├── lever.ts
│       ├── ashby.ts
│       └── smartrecruiters.ts
├── popup/
│   ├── index.html
│   ├── index.tsx          # Popup app with Profile + Auto-Fill tabs
│   ├── ProfileForm.tsx    # Full profile editor
│   └── App.css
└── options/
    ├── index.html
    ├── index.tsx          # Settings: platforms, AI, behavior
    └── App.css
```
