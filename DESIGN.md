# Design System Inspired by Claude

## 1. Visual Atmosphere & Theme

Claude's design system embodies a refined, modern aesthetic grounded in developer-centric clarity and warmth. The palette blends sophisticated neutrals—ranging from near-black to cream—with a distinctive terracotta accent that humanizes technical interfaces. The typography combines serif elegance for headlines with clean sans-serif for prose, creating a hierarchy that feels both approachable and authoritative. This design language balances minimalism with personality, avoiding sterility while maintaining precision. The system prioritizes whitespace, generous padding, and intentional color moments that guide attention without overwhelming. It speaks to developers as thoughtful professionals, respecting their expertise while offering collaborative AI partnership.

**Key Characteristics**
- **Warm, accessible modernism** with a developer-first perspective
- **Refined color restraint** — terracotta accents punctuate extensive neutral palettes
- **Serif + sans-serif blend** — authority meets approachability
- **Generous whitespace** — breathing room throughout layouts
- **Minimal elevation** — subtle depth, not dramatic shadows
- **Semantic color clarity** — status and interaction states are unmistakable

## 2. Color Palette & Roles

### Primary
- **Claude Terracotta** (`#D97757`): Brand accent for hero elements, highlights, and key CTAs; warmth and approachability
- **Claude Cream** (`#E3DACC`): Soft background alternative to white; humanizes layouts without coldness

### Accent Colors
- **Warm Rust** (`#C46849`): Secondary accent for depth and variation
- **Light Copper** (`#C6613F`): Tertiary brand color for subtle emphasis
- **Sage Green** (`#788C5D`): Nature-inspired accent for complementary highlights
- **Steel Blue** (`#6A9BCC`): Cool accent for data visualization and secondary CTAs
- **Bright Blue** (`#2C84DB`): Interactive accent for focus states and links

### Interactive
- **Bright Blue** (`#2C84DB`): Primary interactive element color, links, focus indicators
- **Steel Blue** (`#6A9BCC`): Secondary interactive accent
- **Claude Terracotta** (`#D97757`): Hover state amplifier for brand buttons

### Neutral Scale
- **True Black** (`#000000`): Rarely used; code syntax only
- **Coal** (`#141413`): Primary text, UI foreground; dominant throughout
- **Charcoal** (`#30302E`): Secondary text, muted UI elements
- **Stone** (`#4D4C48`): Tertiary text, subtle hierarchy breaks
- **Slate** (`#5E5D59`): Placeholder text, disabled states
- **Cream** (`#FAF9F5`): Light text on dark backgrounds; primary light neutral
- **Linen** (`#E8E6DC`): Soft borders, subtle dividers
- **White** (`#FFFFFF`): Pure white for contrast moments and code blocks

### Surface & Borders
- **White** (`#FFFFFF`): Card backgrounds, elevated surfaces
- **Cream** (`#E3DACC`): Soft background blocks, section dividers
- **Linen** (`#E8E6DC`): Border color for cards and containers; soft definition

### Semantic / Status
- **Error Red** (`#BF4D43`): Error messages, validation failures, warnings

## 3. Typography Rules

### Font Family
**Primary Serif:** Anthropic Serif (custom), fallback to `Georgia, 'Times New Roman', serif`
**Primary Sans-Serif:** Anthropic Sans (custom), fallback to `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`
**Monospace:** `ui-monospace, 'SFMono-Regular', 'SF Mono', 'Monaco', 'Cascadia Code', monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|---|---|
| Display / H1 | Anthropic Serif | 72px | 500 | 80px | 0px | Hero titles, page headers |
| Heading / H2 | Anthropic Serif | 52px | 500 | 64px | 0px | Section headlines, large headings |
| Subheading / H3 | Anthropic Serif | 25px | 500 | 32px | 0px | Card titles, medium headings |
| Body / Paragraph | Anthropic Sans | 23px | 400 | 36px | 0px | Main content, descriptive text |
| Body Compact | Anthropic Sans | 15px | 400 | 24px | 0px | Secondary body, UI labels, menu items |
| Button / UI | Anthropic Sans | 15px | 400 | 24px | 0px | Button text, navigation, inline controls |
| Input / Form | Anthropic Sans | 12px | 400 | 18px | 0px | Form labels, placeholder text, inputs |
| Code | ui-monospace | 15px | 400 | 22.5px | 0px | Code blocks, terminal output |

### Principles
- **Serif for hierarchy & authority:** Headlines use Anthropic Serif to establish structure and confidence
- **Sans-serif for clarity:** Body and UI copy prioritize readability at multiple sizes
- **Generous line height:** 1.5× or greater for all body copy; promotes scanning and accessibility
- **Monospace for code:** Consistent width and distinction for terminal, snippets, and developer content
- **Weight restraint:** Primary weights are 400 (regular) and 500 (medium); no ultra-light or ultra-bold
- **Optical sizing:** Larger text uses tighter leading; smaller text uses generous leading

## 4. Component Stylings

### Buttons

**Primary Button (Hero CTA)**
- Background: `#D97757` (Terracotta)
- Text Color: `#FFFFFF`
- Padding: `12px 24px`
- Font: Anthropic Sans, `15px`, weight 400, line height `24px`
- Border Radius: `12px`
- Border: None
- Box Shadow: None
- Hover State: Background `#C46849` (Warm Rust), text `#FFFFFF`
- Active State: Background `#D97757`, text `#FFFFFF`
- Focus State: `2px solid #2C84DB` outline, `4px` offset

**Secondary Button (Default CTA)**
- Background: `#D97757` (Terracotta)
- Text Color: `#FFFFFF`
- Padding: `12px 24px`
- Font: Anthropic Sans, `15px`, weight 400, line height `24px`
- Border Radius: `12px`
- Border: None
- Box Shadow: None
- Hover State: Background `#C46849` (Warm Rust), text `#FFFFFF`
- Active State: Background `#D97757`, text `#FFFFFF`
- Focus State: `2px solid #2C84DB` outline, `4px` offset

**Ghost Button (Text Link Button)**
- Background: Transparent
- Text Color: `#141413`
- Padding: `8px 0px`
- Font: Anthropic Sans, `15px`, weight 400, line height `24px`
- Border Radius: `0px`
- Border: None
- Box Shadow: None
- Hover State: Text Color `#D97757`, text-decoration `underline`
- Active State: Text Color `#D97757`
- Focus State: `2px solid #2C84DB` outline, `2px` offset

### Cards & Containers

**Elevated Card**
- Background: `#FFFFFF`
- Text Color: `#141413`
- Padding: `32px`
- Font: Anthropic Sans, `15px`, weight 400, line height `22.5px`
- Border Radius: `24px`
- Border: `1px solid #E8E6DC`
- Box Shadow: None
- Hover State: Border `1px solid #D97757`, subtle lift (no shadow, opacity increase)

**Content Block (No Border)**
- Background: Transparent
- Text Color: `#141413`
- Padding: `0px`
- Font: Anthropic Sans, `15px`, weight 400, line height `22.5px`
- Border Radius: `0px`
- Border: None
- Box Shadow: None

**Soft Background Card**
- Background: `#E3DACC`
- Text Color: `#141413`
- Padding: `24px`
- Font: Anthropic Sans, `15px`, weight 400, line height `22.5px`
- Border Radius: `16px`
- Border: None
- Box Shadow: None

### Inputs & Forms

**Text Input (Light Background)**
- Background: Transparent
- Text Color: `#FAF9F5`
- Placeholder Color: `#5E5D59`
- Padding: `0px 0px 0px 0px` (minimal internal padding)
- Font: Anthropic Sans, `12px`, weight 400, line height `18px`
- Border Radius: `0px`
- Border: None
- Border Bottom: `1px solid #5E5D59` (underline style)
- Box Shadow: None
- Focus State: Border Bottom `1px solid #D97757`, text color `#FFFFFF`

**Text Input (Compact)**
- Background: Transparent
- Text Color: `#FAF9F5`
- Placeholder Color: `#5E5D59`
- Padding: `4px 0px`
- Font: Anthropic Sans, `12px`, weight 400, line height `16.8px`
- Border Radius: `0px`
- Border: None
- Border Bottom: `1px solid #5E5D59`
- Box Shadow: None
- Focus State: Border Bottom `1px solid #2C84DB`

**Form Label**
- Font: Anthropic Sans, `12px`, weight 400
- Text Color: `#5E5D59`
- Line Height: `18px`
- Margin Bottom: `8px`

### Navigation

**Header Navigation**
- Background: `#FFFFFF`
- Text Color: `#141413`
- Padding: `24px 0px`
- Font: Anthropic Sans, `15px`, weight 400, line height `22.5px`
- Border Radius: `0px`
- Border: None
- Border Bottom: `1px solid #E8E6DC`
- Box Shadow: None
- Hover State (Menu Item): Text Color `#D97757`
- Active State (Menu Item): Text Color `#D97757`, Font Weight 500

**Navigation Link**
- Background: Transparent
- Text Color: `#141413`
- Padding: `0px`
- Font: Anthropic Sans, `15px`, weight 400
- Hover State: Text Color `#D97757`, text-decoration `underline`

**Breadcrumb**
- Font: Anthropic Sans, `12px`, weight 400, line height `18px`
- Text Color: `#5E5D59`
- Separator: ` / ` in `#5E5D59`
- Active Item Color: `#141413`

### Links

**Primary Link (Underlined)**
- Background: Transparent
- Text Color: `#2C84DB`
- Font: Anthropic Sans, `15px`, weight 400
- Text Decoration: `underline`
- Border: None
- Hover State: Text Color `#D97757`, text-decoration `underline`
- Focus State: `2px solid #2C84DB` outline

**Secondary Link (Inline)**
- Background: Transparent
- Text Color: `#141413`
- Font: Anthropic Sans, `15px`, weight 400
- Text Decoration: None
- Hover State: Text Color `#D97757`, text-decoration `underline`

### Badge

**Status Badge (Success)**
- Background: `#E3DACC`
- Text Color: `#141413`
- Padding: `4px 12px`
- Font: Anthropic Sans, `12px`, weight 500, line height `18px`
- Border Radius: `12px`
- Border: None

**Status Badge (Warning)**
- Background: `#FAF9F5`
- Text Color: `#BF4D43`
- Padding: `4px 12px`
- Font: Anthropic Sans, `12px`, weight 500, line height `18px`
- Border Radius: `12px`
- Border: `1px solid #BF4D43`

## 5. Layout Principles

### Spacing System
**Base Unit:** `8px`

**Spacing Scale:**
- `4px`: Micro spacing, tight grouping
- `8px`: Compact spacing, button padding
- `12px`: Small spacing, form labels
- `16px`: Standard gap, component clusters
- `20px`: Medium padding, card content
- `24px`: Section spacing, navigation padding
- `32px`: Large gap, card padding
- `40px`: Generous padding, section tops
- `48px`: Section gap, content blocks
- `60px`: Major margin, hero sections
- `64px`: Major margin, large section spacing
- `96px`: Hero padding, maximum breathing room

**Usage Context:**
- Micro spacing (`4px`, `8px`): Button internals, input fields, badges
- Small spacing (`12px`, `16px`): Form inputs, caption text, tight clusters
- Medium spacing (`20px`, `24px`): Card padding, navigation height, component margins
- Large spacing (`32px`, `40px`, `48px`): Section gaps, card content, layouts
- Hero spacing (`60px`, `64px`, `96px`): Page headers, hero sections, landing layouts

### Grid & Container
**Max Width:** `1200px` (content containers on desktop)
**Column Strategy:** Flexible 1–3 column layouts; cards on desktop (3 cols) collapse to 1 col mobile
**Section Padding:** `48px` vertical, `32px` horizontal on desktop; `24px` all sides on tablet; `16px` all sides on mobile
**Gutter Between Columns:** `24px` desktop, `16px` mobile

### Whitespace Philosophy
Claude embraces silence and breathing room. Layouts prioritize generous padding and negative space to avoid cognitive load. Sections are clearly demarcated by vertical gaps (`48px`+) rather than visual borders. Text blocks never extend edge-to-edge; containers always maintain `24px` padding minimum. This creates a calm, readable experience that respects the user's attention span.

### Border Radius Scale
- `0px`: Form underlines, border-bottom inputs, flat text buttons
- `4px`: Small UI elements, compact button secondaries
- `8px`: Medium buttons, secondary cards, icon buttons
- `12px`: Standard buttons, tag badges, smaller cards
- `16px`: Medium cards, container elements
- `24px`: Large cards, elevated containers
- `12px 12px 0px 0px`: Image top radius only (masonry effect)

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Base (Flat) | `box-shadow: none` | Body backgrounds, text content, inputs, flat buttons |
| Layer 1 (Subtle) | `box-shadow: 0px 4px 8px rgba(20, 20, 19, 0.08)` | Hover states on secondary buttons, slight lift |
| Layer 2 (Card) | `box-shadow: 0px 8px 16px rgba(20, 20, 19, 0.12)` | Elevated cards, modals, dropdowns |
| Layer 3 (Deep) | `box-shadow: 0px 16px 32px rgba(20, 20, 19, 0.16)` | Modals with deep focus, overlays |
| Focus Ring | `outline: 2px solid #2C84DB; outline-offset: 4px` | Interactive elements on focus |

**Shadow Philosophy:**
Claude avoids dramatic elevation. Shadows are subtle and serve three purposes: (1) define interactive hover states with gentle lift, (2) separate cards from backgrounds with minimal contrast, and (3) focus modals without creating visual chaos. Shadows use the neutral coal (`#141413`) at low opacity (`0.08`–`0.16`), preserving the warm, inviting tone. Focus rings use bright blue (`#2C84DB`) for accessibility, with generous `4px` offset to avoid crowding.

## 7. Do's and Don'ts

### Do
- **Use terracotta (`#D97757`) as a call-to-action accent** — it immediately draws developer attention without overwhelming
- **Prioritize whitespace over decoration** — Claude's elegance comes from breathing room, not ornament
- **Combine serif headlines with sans-serif body copy** — maintain hierarchy through font pairing, not size alone
- **Apply consistent `24px` border-radius to cards** — establishes a warm, rounded identity
- **Use subtle borders (`1px solid #E8E6DC`) instead of shadows** — maintains flatness while defining structure
- **Implement blue focus rings (`#2C84DB`) with `4px` offset** — ensures accessibility without cramped indicators
- **Group related UI elements with `16px` gap** — respects the base unit system
- **Maintain minimum `24px` padding on all content containers** — creates readable, breathable layouts
- **Use monospace only for code, commands, and terminal output** — preserves serif/sans hierarchy for prose

### Don't
- **Don't mix terracotta with steel blue in single components** — creates visual conflict; choose one per element
- **Don't use `#141413` text on dark backgrounds** — insufficient contrast; use `#FAF9F5` or `#FFFFFF` instead
- **Don't add box shadows to buttons or cards** — contradicts Claude's flat, modern aesthetic
- **Don't compress padding below `8px` on interactive elements** — violates touch-target minimums and legibility
- **Don't use more than two font families** — serif + sans-serif is the limit; monospace is functional only
- **Don't apply rounded corners to form inputs** — maintain `0px` or `4px` radius for technical clarity
- **Don't nest more than two levels of card elevation** — keeps visual hierarchy clear and simple
- **Don't justify text alignment** — left-align all prose for readability and accessibility
- **Don't use color alone to convey status** — pair color with icons, text, or patterns for colorblind users

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|---|
| Mobile (xs) | `320px–639px` | Single column, `16px` padding, `12px` font compact, stacked navigation |
| Tablet (sm) | `640px–1023px` | Two columns, `24px` padding, `15px` font body, horizontal scrolling nav with overflow |
| Desktop (md) | `1024px–1199px` | Three columns, `32px` padding, full-size font, fixed navbar |
| Desktop Large (lg) | `1200px+` | Three columns, `48px` padding, max-width container `1200px`, full navbar with dropdowns |

### Touch Targets
- **Minimum tap/click target size:** `44px × 44px` on mobile, `40px` acceptable on desktop
- **Spacing between touch targets:** Minimum `8px` on mobile, `12px` on desktop
- **Button padding:** `12px 24px` desktop (minimum `44px` height), `12px 16px` mobile (minimum `44px` height)
- **Link underline:** Extend padding `4px` above/below text on mobile for easier targeting

### Collapsing Strategy
- **Navigation:** Desktop full horizontal menu → Tablet left-sidebar or hamburger menu → Mobile hamburger menu with slide-out
- **Cards:** Desktop 3-column grid (`24px` gap) → Tablet 2-column grid (`16px` gap) → Mobile 1 column (`16px` margin)
- **Padding:** Desktop `48px` sections → Tablet `32px` → Mobile `24px`
- **Font sizes:** Keep heading sizes consistent down to tablet; reduce by 1–2 steps on mobile only if space critical
- **Whitespace:** Reduce by `25%` on tablet, `50%` on mobile; maintain legibility and breathing room
- **Images:** Constrain to `100% width` with max-width limits; use `12px 12px 0px 0px` border-radius for masonry layouts

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Claude Coal (`#141413`) background, Cream (`#FAF9F5`) text
- **Hero Accent:** Claude Terracotta (`#D97757`)
- **Background:** White (`#FFFFFF`) elevated, Cream (`#E3DACC`) soft blocks
- **Body Text:** Coal (`#141413`)
- **Secondary Text:** Charcoal (`#30302E`)
- **Muted Text:** Slate (`#5E5D59`)
- **Interactive Focus:** Bright Blue (`#2C84DB`)
- **Link Color:** Bright Blue (`#2C84DB`)
- **Disabled/Placeholder:** Slate (`#5E5D59`)
- **Borders:** Linen (`#E8E6DC`)
- **Error:** Error Red (`#BF4D43`)

### Iteration Guide

1. **Color application order:** Start with neutral layouts (`#141413` text on `#FFFFFF` background), add terracotta accents to hero/CTA, use bright blue only for interactive focus states and links.

2. **Typography structure:** Headlines always use Anthropic Serif (72px/52px/25px); body always uses Anthropic Sans (23px/15px); never mix serif and sans at same size. Monospace reserved for code only.

3. **Spacing enforcement:** Base unit is `8px`. All padding/margin values must be multiples of 8 (8, 16, 24, 32, 40, 48, 64, 96). Never use arbitrary spacing.

4. **Button hierarchy:** Black buttons (`#141413`) are primary CTAs. Cream buttons (`#FAF9F5`) are secondary. Ghost buttons (transparent) are tertiary. Only one primary button per section.

5. **Card consistency:** All elevated cards use `#FFFFFF` background, `24px` border-radius, `1px solid #E8E6DC` border, `32px` padding. Soft background blocks use `#E3DACC` with `16px` border-radius.

6. **Border radius rules:** Buttons `8px`–`12px`, cards `16px`–`24px`, inputs `0px` (flat). Never exceed `24px` except on hero decorative elements.

7. **Shadows are minimal:** Use subtle `box-shadow: 0px 4px 8px rgba(20, 20, 19, 0.08)` on hover only. No shadows on default state. Focus rings use `2px solid #2C84DB` outline with `4px` offset.

8. **Responsive collapse sequence:** (1) Reduce padding 25% on tablets, 50% on mobile. (2) Stack grids: 3-col → 2-col → 1-col. (3) Collapse navigation last; use hamburger menu on mobile. (4) Never reduce font sizes unless critical; maintain legibility.

9. **Accessibility non-negotiables:** All interactive elements minimum `40px × 40px` target. Blue focus rings (`#2C84DB`) required on all interactive elements. Color paired with icon/text (never color-only status). Minimum `4.5:1` contrast for text on backgrounds.

10. **Warm minimalism principle:** Every design decision must answer: "Does this add clarity or warmth?" Avoid decoration. Maximize breathing room. Let terracotta and bright blue carry visual weight; let whitespace do the rest.