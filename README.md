# The Research Shop — website

Redesign of [theresearchshop.co.nz](https://theresearchshop.co.nz/). A static site: no build step.

- `index.html` — all content (About, How it works, Our team, Services, Testimonials, Why select us, Contact)
- `css/styles.css` — design tokens and layout
- `js/main.js` — 3D data-point stage (Three.js, vendored in `assets/vendor`), scroll effects, question picker, contact form
- `js/viz.js` — the ten service figures, drawn on 2D canvases
- `assets/img` — logos, team photos and imagery from the current site, optimised

## Run locally

```bash
python -m http.server 4173
```

Then open http://localhost:4173. Add `?still` to the URL for a motion-free view.

## Notes

- The contact form opens the visitor's email app addressed to the business; it does not post to a server.
- Animations switch off for visitors who have "reduce motion" set on their device.
