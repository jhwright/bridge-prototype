# HTML & CSS Patterns

> HTML structure, CSS conventions, and Tailwind/Flowbite usage

**Priority:** Always

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| CSS Framework | Tailwind CSS (CDN) |
| Component Library | Flowbite 2.5.2 |
| Font | Inter (Google Fonts) |
| Icons | Heroicons / Flowbite icons |
| JavaScript | Vanilla JS (no frameworks, no build step) |
| Backend Data | bridge-ai public JSON API via fetch() |

## Required Setup

All HTML pages MUST include:

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Tailwind Config -->
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        bridge: {
          orange: '#DF562A',
          bg: '#faf7f3',
          dark: '#2a2520',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
</script>

<!-- Flowbite JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js"></script>
```

## Brand Design Tokens

```css
/* Colors */
--brand-orange: #DF562A;
--brand-bg: #faf7f3;
--brand-dark: #2a2520;
```

## HTML Structure

### Page Template

```html
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bridge Storage — Make Room.</title>
    <!-- Required CSS/JS (see above) -->
</head>
<body class="bg-[#faf7f3] text-[#2a2520] font-sans">
    <!-- Navbar -->
    <!-- Content sections -->
    <!-- Footer -->
    <!-- Page-specific JS -->
    <script src="js/config.js"></script>
</body>
</html>
```

## Image Handling

### Production Images

```html
<!-- Use optimized image files from photos/ directory -->
<img src="photos/hero-outdoor.jpg" alt="Bridge Storage facility entrance" loading="lazy">

<!-- Hero images can skip lazy loading (above fold) -->
<img src="photos/hero-outdoor.jpg" alt="Bridge Storage facility" class="w-full h-full object-cover">
```

**CRITICAL**: The prototype (`bridge-mobile-design.html`) uses base64 images. Production pages must use file URLs from the `photos/` directory.

### Alt Text Requirements

All images MUST have descriptive alt text:
- Facility photos: Describe the space ("Colorful mural in storage aisle")
- Decorative images: Use `alt=""`
- Interactive images: Describe the action ("Click to view storage unit details")

## CSS Conventions

### DO

- Use Tailwind utility classes for all styling
- Use Flowbite components for interactive elements
- Use `Inter` font family everywhere
- Use brand colors via custom Tailwind config
- Use responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)

### DO NOT

- Use inline `style=""` attributes
- Use Bootstrap or other framework classes
- Use custom CSS files (exception: minimal shared styles if truly needed)
- Use `!important`
- Use pixel values for spacing (use Tailwind scale: `p-4`, `m-6`, etc.)

## JavaScript Conventions

### DO

- Use vanilla JS — no React, Vue, jQuery, or any framework
- Use `fetch()` for API calls to bridge-ai
- Use the API base URL from `js/config.js`
- Handle API errors gracefully (show user-friendly messages)
- Keep JS files small and focused (one per page feature)

### DO NOT

- Include a build step (no webpack, no bundler)
- Use global state or complex state management
- Hardcode API URLs — always use config
- Store secrets, tokens, or API keys in frontend code
- Use `document.write()` or `eval()`

## Responsive Design

| Breakpoint | Width | Target |
|------------|-------|--------|
| Default | < 640px | Mobile (primary) |
| `sm:` | 640px | Large phone |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

**Mobile-first**: All base styles target phones. Use responsive prefixes for larger screens.

## Accessibility

- Color contrast: All text meets WCAG AA (4.5:1 ratio)
- Touch targets: Minimum 44x44px
- Focus indicators: Visible on all interactive elements
- Semantic HTML: Use `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`
- Heading hierarchy: One `<h1>` per page, sequential `<h2>`-`<h6>`
