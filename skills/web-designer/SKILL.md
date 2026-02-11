---
name: web-designer
description: Create beautiful, modern websites with excellent UI/UX design. Use when user asks for landing pages, websites, or web applications that need professional visual design, responsive layouts, color schemes, typography, and modern CSS styling.
---

# Web Designer

Skill for creating visually stunning, modern websites with professional UI/UX.

## Design Principles

### Color Schemes
- Use warm, trustworthy colors for construction/home services (terracotta, brown, cream)
- Use professional blues for corporate/business sites
- Use vibrant colors for entertainment/contests
- Always ensure good contrast for readability

### Typography
- Use Google Fonts (Montserrat for headings, Open Sans for body)
- Maintain clear hierarchy: H1 > H2 > H3 > body > small
- Line height 1.6-1.8 for body text
- Font sizes: H1 (clamp 36-52px), H2 (28-40px), body (16px)

### Layout Patterns
- Mobile-first responsive design
- Max-width containers (1200px)
- Generous whitespace (padding 60-100px sections)
- Card-based layouts for portfolios/features
- Grid systems for galleries

### Modern Effects
- Subtle shadows (0 4px 16px rgba)
- Smooth transitions (0.3s ease)
- Hover states on interactive elements
- Loading animations for engagement

## Process

1. **Understand brand/purpose** — colors, mood, target audience
2. **Plan sections** — hero, features, portfolio, CTA, footer
3. **Create color palette** — primary, secondary, accent, background
4. **Build responsive layout** — mobile-first approach
5. **Add polish** — animations, hover effects, shadows
6. **Test** — check on mobile, tablet, desktop

## Code Standards

### CSS Variables
```css
:root {
  --color-primary: #8B4513;
  --color-accent: #C75B39;
  --color-text: #2C1810;
  --color-bg: #FDF8F3;
  --shadow: 0 4px 12px rgba(44, 24, 16, 0.1);
  --radius: 12px;
  --transition: all 0.3s ease;
}
```

### Mobile Breakpoints
- 992px — tablets
- 768px — large phones
- 480px — small phones

### Assets
- Use Phosphor Icons (modern, clean)
- Optimize images (lazy loading, WebP when possible)
- Use system fonts as fallback

## Common Patterns

### Hero Section
- Full viewport height or large
- Strong headline + subheadline
- Primary CTA button
- Background: image, gradient, or solid

### Features/Services
- 3-6 cards in grid
- Icon + title + description
- Hover elevation effect

### Portfolio/Gallery
- Grid or masonry layout
- Hover overlay with info
- Lightbox for full view

### Testimonials
- Quote styling with large quotation marks
- Avatar + name + position
- Star ratings

### Contact/CTA
- Prominent form or button
- Multiple contact options (phone, WhatsApp, form)
- Social proof near CTA

## Quality Checklist
- [ ] Responsive on all devices
- [ ] Good color contrast
- [ ] Smooth animations
- [ ] Fast loading (optimized images)
- [ ] Accessible (alt texts, semantic HTML)
- [ ] Consistent spacing
- [ ] Professional typography
