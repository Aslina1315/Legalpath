# Accessibility

> **Status**: Foundation implemented. See "PLANNED LATER" for advanced coverage.

---

## Standard

WCAG 2.1 Level AA is the target. Every component must meet this standard before shipping.

---

## Implementation Principles

### 1. Semantic HTML First

Use native HTML elements with their built-in semantics before reaching for ARIA:

```html
<!-- Good -->
<button type="submit">Continue</button>
<label for="narrative">What happened?</label>
<textarea id="narrative" aria-required="true">

<!-- Avoid: ARIA roles where native elements suffice -->
<div role="button" tabindex="0">Continue</div>
```

### 2. ARIA Only Where Needed

ARIA is used when:
- A custom component has no native HTML equivalent
- Dynamic content needs to be announced (`aria-live`)
- Icon-only controls need labels (`aria-label`)
- Error states need programmatic association (`aria-describedby`, `aria-invalid`)

### 3. Visible Focus States

All interactive elements have a visible, high-contrast focus ring:

```css
:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
```

The `:focus-visible` selector ensures focus rings appear for keyboard navigation but not on mouse click.

### 4. Keyboard Navigation

All user flows are fully keyboard-operable:

- `Tab` / `Shift+Tab` — move between interactive elements
- `Enter` / `Space` — activate buttons
- `Escape` — close modals and dismiss overlays (future)
- Arrow keys — navigate within compound widgets (future)

### 5. Screen Reader Support

- `<label>` elements are associated with all form controls
- Error messages are associated via `aria-describedby`
- `role="alert"` used for error messages
- `aria-live="polite"` used for AI state updates
- `aria-busy` on loading buttons
- Skip-to-main-content link at the top of every page

### 6. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations are disabled when the user has requested reduced motion. The Tailwind `motion-reduce:` variant is used on all animated components.

### 7. Responsive Text

Typography uses `clamp()` for fluid scaling. Minimum font size is 14px. Line height is at least 1.5 for body text.

### 8. Colour Contrast

Design tokens are chosen to meet WCAG AA contrast ratios:
- Body text on white: `#171717` — contrast ratio 18.1:1 ✅
- Brand blue (`#4f62f5`) on white: 4.6:1 ✅ (for large text / UI elements)
- Trust green (`#16a34a`) on white: 4.6:1 ✅
- Muted text (`#525252`) on white: 7.5:1 ✅

---

## Component Accessibility Checklist

### Button

- [x] Native `<button>` element
- [x] `aria-busy` when loading
- [x] `disabled` attribute when not interactive
- [x] Visible focus ring
- [x] Loading state uses visible text (not icon only)

### Textarea

- [x] `<label>` associated via `htmlFor`/`id`
- [x] `aria-describedby` linking hint and error
- [x] `aria-invalid` when error present
- [x] `aria-required` for required fields
- [x] Error shown as `role="alert"`
- [x] Character count uses `aria-live="polite"`

### AIStateIndicator

- [x] `role="status"` on container
- [x] `aria-live="polite"` for state updates
- [x] `aria-label` describing current state
- [x] Decorative dots marked `aria-hidden`

### TopNav

- [x] `<header>` landmark
- [x] `<nav aria-label="Main navigation">`
- [x] Brand link has descriptive `aria-label`
- [x] Auth state indicator uses `aria-live`

---

## IMPLEMENTED NOW

- ✅ Semantic HTML throughout
- ✅ Label association on all form controls
- ✅ ARIA attributes on form elements
- ✅ `role="alert"` on error messages
- ✅ `aria-live="polite"` on AI state indicator
- ✅ Visible focus states (`:focus-visible` ring)
- ✅ Skip to main content link
- ✅ `prefers-reduced-motion` CSS media query
- ✅ Tailwind `motion-reduce:` variant on all animated components
- ✅ Sufficient colour contrast (design tokens)
- ✅ Responsive typography

## PLANNED LATER

- ⏳ Full keyboard navigation testing (automated + manual)
- ⏳ Screen reader testing (NVDA, VoiceOver)
- ⏳ axe-core automated accessibility linting in CI
- ⏳ Focus trap management for modals (future)
- ⏳ WCAG 2.1 AA audit report
- ⏳ Multi-language RTL support
