# Design Improvement Plan

Audit date: 2026-02-09
Auditor: design-lead

## Current State Summary

The app is a single-page Astro static site that displays engineering proverbs in a book-page aesthetic. It loads all proverbs at build time and cycles through them randomly on button click. The design is clean and minimal with a parchment/paper feel using the Merriweather serif font.

### Issues Found

1. **ProverbDisplay.astro is unused** -- The component is imported and rendered server-side on initial load, but the client-side `renderProverb()` function in `index.astro` duplicates its entire markup and styles via `innerHTML`. After the first client-side render (which happens immediately on page load), the SSR-rendered component is replaced and never seen again.

2. **Style duplication** -- The `.proverb`, `blockquote`, `.quote`, `.attribution`, `.author`, and `.source` styles are defined identically in both `ProverbDisplay.astro` (scoped `<style>`) and `index.astro` (scoped `<style>`). The `index.astro` copy is the only one that matters since client-side rendering replaces the component.

3. **Background.astro is orphaned** -- It's an SVG blur component that is never imported anywhere. Dead code.

4. **No quote transition** -- Clicking "Another proverb" instantly swaps the quote with no animation, which feels abrupt.

5. **Button has no active/pressed state** -- The button has hover and focus styles but no `:active` state for tactile feedback.

6. **No OG/social meta tags** -- The Layout only has a basic `<meta name="description">` but no Open Graph or Twitter card tags.

7. **No favicon beyond .ico** -- Only `favicon.ico` exists; no SVG favicon, no apple-touch-icon.

---

## P0 -- Must Fix

### P0-1: Remove unused ProverbDisplay.astro component

**Files:** `src/components/ProverbDisplay.astro`
**Change:** Delete the file entirely. It is never rendered to the user -- the client-side script in `index.astro` immediately replaces its output on page load.
**Also:** Remove the import from `src/pages/index.astro` (line 4) and change line 19 from `<ProverbDisplay {...proverbsData[0]} />` to an empty placeholder (or nothing -- the script fills it immediately).
**Why:** Dead code creates confusion for future maintainers. Having two copies of the same markup/styles is a maintenance trap.

### P0-2: Remove unused Background.astro component

**Files:** `src/components/Background.astro`
**Change:** Delete the file. It is not imported anywhere.
**Why:** Dead code. It references CSS custom properties (`--bttm-left-blur-1`, etc.) that don't exist in the stylesheet.

### P0-3: Move proverb styles to demo-styling.css

**Files:** `src/pages/index.astro`, `src/style/demo-styling.css`
**Change:** Move the proverb-related styles (`.proverb`, `blockquote`, `.quote`, `.attribution`, `.author`, `.source`) from the `<style>` block in `index.astro` into `demo-styling.css`. Remove the `<style>` block from `index.astro` entirely.
**Why:** Since the proverb markup is generated client-side via `innerHTML`, Astro's scoped styles don't apply to it anyway (scoped styles use a `data-astro-cid-*` attribute that won't be on dynamically injected elements). The styles only work now because they happen to be generic enough. Moving them to the global CSS file makes the styling explicit and correct.

---

## P1 -- Should Fix

### P1-1: Add a subtle fade transition when changing proverbs

**Files:** `src/pages/index.astro` (script block), `src/style/demo-styling.css`
**Change:**
- In `demo-styling.css`, add a `.proverb` transition: `opacity` with a short duration (~200ms).
- In the `renderProverb` function in `index.astro`, fade out the container before swapping content, then fade back in. Simple approach:
  ```js
  container.style.opacity = '0';
  setTimeout(() => {
    container.innerHTML = `...`;
    container.style.opacity = '1';
  }, 200);
  ```
- Add `transition: opacity 0.2s ease` to `#proverb-container` in CSS.
**Why:** The instant swap feels jarring. A subtle fade is consistent with the calm, book-like aesthetic. Keep it fast (200ms) to avoid feeling sluggish.

### P1-2: Add button active state and improve button interaction

**Files:** `src/style/demo-styling.css`
**Change:** Add an `:active` pseudo-class for `.refresh-btn`:
```css
.refresh-btn:active {
  transform: scale(0.97);
}
```
**Why:** Gives tactile feedback on click. Keeps it subtle to match the aesthetic.

### P1-3: Prevent initial SSR flash (proverb #0 briefly visible before random pick)

**Files:** `src/pages/index.astro`
**Change:** Instead of rendering the first proverb server-side and then immediately replacing it client-side, start with `#proverb-container` empty and let the script populate it. The script already runs synchronously (not deferred), so there's no visible flash of empty content.
Replace line 19:
```html
<ProverbDisplay {...proverbsData[0]} />
```
With nothing (empty container). The `renderProverb(proverbs[currentIndex])` call on line 50 handles initial display.
**Why:** Currently, proverb #0 may flash briefly before being replaced by the random one. This is a minor SSR/client hydration mismatch.

### P1-4: Mobile padding refinement

**Files:** `src/style/demo-styling.css`
**Change:** Add a media query for small screens to reduce `.book-page` padding:
```css
@media (max-width: 640px) {
  .book-page {
    padding: 2rem 1.25rem;
  }
}
```
**Why:** On narrow screens, the 2rem horizontal padding eats into readable width. The book metaphor still works with slightly less padding.

---

## P2 -- Nice to Have

### P2-1: Add Open Graph meta tags

**Files:** `src/components/Layout.astro`
**Change:** Add OG tags inside `<head>`:
```html
<meta property="og:title" content={title}>
<meta property="og:description" content="Timeless wisdom for software engineers - a collection of programming proverbs and quotes.">
<meta property="og:type" content="website">
```
**Why:** Better social sharing previews when someone shares the URL.

### P2-2: Improve accessibility with aria-live region

**Files:** `src/pages/index.astro`
**Change:** Add `aria-live="polite"` to `#proverb-container` so screen readers announce new proverbs when they change.
```html
<div id="proverb-container" aria-live="polite">
```
**Why:** Screen reader users currently get no indication that content changed when the button is clicked.

### P2-3: Add keyboard shortcut for "Another proverb"

**Files:** `src/pages/index.astro` (script block)
**Change:** Add a keydown listener for Space or Enter when the button isn't focused (or just for a simple shortcut like pressing any key):
```js
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && e.target === document.body) {
    e.preventDefault();
    document.getElementById('another-btn').click();
  }
});
```
**Why:** Power user convenience. Spacebar to get next proverb feels natural.

---

## Out of Scope (Intentionally Not Doing)

- **Dark mode**: The book/paper aesthetic depends on warm light colors. Dark mode would require a completely different design language.
- **Sharing/copy button**: Adds UI complexity for marginal value on a simple proverb viewer.
- **Page routing per proverb**: Over-engineering for what should remain a single-page experience.
- **Animation libraries**: The fade transition can be done with vanilla CSS transitions. No need for Framer Motion, GSAP, etc.
- **PWA/Service Worker**: Not necessary for a simple static site.

---

## Implementation Order

1. P0-1 + P0-2 + P0-3 (clean up dead code and consolidate styles)
2. P1-3 (remove SSR flash, pairs with P0-1 since we're removing ProverbDisplay import)
3. P1-1 (add fade transition)
4. P1-2 (button active state)
5. P1-4 (mobile padding)
6. P2-1 (OG tags)
7. P2-2 (aria-live)
8. P2-3 (keyboard shortcut -- only if time permits)

Steps 1-2 should be done together as they're interrelated cleanup. Steps 3-5 are independent CSS/JS tweaks. Steps 6-8 are independent enhancements.
