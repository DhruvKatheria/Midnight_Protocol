# Design System Specification: The Obsidian Ledger

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Architect"**
This design system moves away from the "flat" web. It treats the UI as a high-precision architectural model—a series of interlocking, translucent, and luminous layers suspended in a deep obsidian vacuum. We reject the generic "SaaS dashboard" aesthetic in favor of a high-end, editorial experience that feels as secure and immutable as the Algorand blockchain itself.

**The Aesthetic Strategy:**
*   **Intentional Asymmetry:** Break the grid. Align large display type to the far left while pushing utility components to the far right, creating a sense of sophisticated "breathing room."
*   **Layered Depth:** We don't use lines to separate ideas; we use light and opacity.
*   **Tonal Authority:** A monochromatic foundation punctuated by high-energy electric accents creates a "High-Tech Premium" atmosphere.

---

## 2. Colors & Surface Philosophy

### The Pallete
*   **Primary (Electric Cyan):** `#69daff` — Use for high-intent actions and critical data points.
*   **Background (Obsidian):** `#0e0e0e` — The infinite canvas.
*   **Surface Tiers:** Use `surface_container_low` (`#131313`) for large sections and `surface_container_highest` (`#262626`) for interactive elements.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts or tonal transitions. To separate a list from a background, shift the container from `surface` to `surface_container_low`. 

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of frosted glass.
*   **Level 0 (Base):** `surface` (`#0e0e0e`).
*   **Level 1 (Card/Section):** `surface_container_low` (`#131313`).
*   **Level 2 (Nested Element):** `surface_container_high` (`#201f1f`).
This nesting creates a "natural lift" that guides the eye without the clutter of lines.

### The Glass & Gradient Rule
To achieve the "Premium" feel, use **Glassmorphism** for floating elements (Navbars, Tooltips, Modals).
*   **Recipe:** `surface_variant` at 60% opacity + `backdrop-blur: 20px`.
*   **Signature Textures:** Apply a subtle linear gradient to Primary CTAs, transitioning from `primary` (`#69daff`) to `primary_container` (`#00cffc`) at a 135-degree angle.

---

## 3. Typography: Editorial Authority

We use a high-contrast scale to create an "Editorial" feel.

*   **Display & Headlines (Plus Jakarta Sans):** These are the "voice" of the system. 
    *   **Style:** Bold weight, -0.04em tracking (tight).
    *   **Role:** Use `display-lg` for hero settlement amounts and `headline-lg` for bounty titles.
*   **Body & Labels (Inter):** 
    *   **Style:** Regular weight, 1.6 line height.
    *   **Role:** Used for technical descriptions and transaction metadata. The generous line height ensures readability against the high-contrast obsidian background.

---

## 4. Elevation & Depth: Tonal Layering

### The Layering Principle
Depth is achieved by stacking surface-container tiers. Never use a shadow to define a shape; use a shadow only to indicate "float."

### Ambient Shadows
For floating Modals or Popovers:
*   **Blur:** 40px to 60px.
*   **Opacity:** 4% - 8%.
*   **Color:** Use a tinted version of `surface_tint` (`#69daff`) rather than pure black to simulate the glow of a high-tech screen.

### The "Ghost Border" Fallback
If accessibility requires a border (e.g., Input Fields), use the **Ghost Border**:
*   Token: `outline_variant` (`#494847`) at **15% opacity**. 
*   **Never** use 100% opaque borders.

---

## 5. Components

### Glassmorphic Navbar (Sticky)
*   **Background:** `surface_container` at 70% opacity.
*   **Blur:** 32px.
*   **Shadow:** 0px 4px 20px rgba(0,0,0, 0.4).
*   **Note:** The navbar should feel like a lens sliding over the content.

### Action Buttons
*   **Primary:** Gradient (`primary` to `primary_container`), `rounded-md` (0.75rem).
*   **Interaction:** Scale to `0.98` on click. Transition: `200ms cubic-bezier(0.22, 1, 0.36, 1)`.
*   **Secondary:** `surface_container_highest` with `on_surface` text. No border.

### Bounty Cards
*   **Corner Radius:** `rounded-xl` (1.5rem).
*   **Background:** `surface_container_low`.
*   **Hover State:** Lift `-4px` on the Y-axis. Apply a `0px 0px 20px` outer glow using `primary` at 10% opacity.
*   **Content:** No dividers. Use `spacing-6` (1.5rem) to separate the title from the metadata.

### Interactive Animated Counters
*   For settlement amounts: Use `display-md` typography.
*   Animation: Numerical "roll" effect on page load or state change.
*   Color: `primary` (`#69daff`).

### Toast Notifications
*   **Layout:** Fixed bottom-right, fade-up transition.
*   **Success:** Background: `surface_container_high`; Accent: `primary`.
*   **Error:** Background: `error_container` (`#9f0519`) at 20% opacity; Text: `error`.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `surface_container_lowest` (`#000000`) for the "wells" of input fields to create an inset look.
*   **Do** use `fade-up` transitions (30px offset) for all entering page elements to reinforce the sense of "rising" from the obsidian base.
*   **Do** leverage `tertiary` (`#89a5ff`) for "pending" or "in-progress" states to maintain the cool-toned tech palette.

### Don't
*   **Don't** use pure white (`#FFFFFF`) for body text. Always use `on_surface_variant` (`#adaaaa`) or `secondary` (`#e5e2e1`) to prevent eye strain.
*   **Don't** use standard 1px dividers. If separation is needed, use a `12` (3rem) vertical gap or a slight background color shift.
*   **Don't** use sharp corners. Everything except the screen edge should adhere to the `Roundedness Scale`.