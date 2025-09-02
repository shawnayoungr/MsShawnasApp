## Splash Page Mobile-First Layout and Style Fixes (2025-08-15)

### Issues Identified
- Layout was not mobile-first; content was not centered or constrained to mobile width.
- Top and bottom navigation bars did not match reference design (gradient, rounded, shadow, alignment).
- Collage and content box were not overlaid or visually separated; text was hard to read.
- Buttons and typography did not match reference in size, color, or font weight.
- Horizontal scrolling and white space appeared on desktop.

### Fixes Applied
- All content wrapped in a centered, max-w-[430px] container with `mx-auto w-full min-h-screen`.
- Title, subtitle, and buttons placed in a semi-transparent, rounded, padded overlay box above the collage using absolute/flex utilities.
- Top navigation styled with gradient, rounded corners, and shadow; icons and menu aligned.
- Bottom navigation fixed, rounded, shadowed, and styled for mobile; icons and labels aligned and active state highlighted.
- All text and buttons updated to match reference font sizes, weights, and colors using Tailwind.
- `overflow-x-hidden` set on main container; all elements stack vertically and fit mobile width.
- All changes follow Copilot_Instructions for mobile-first, Tailwind, and PWA best practices.
# Build and Debug Guide
this is a progressive web app, everything should be responsive for smartphones.
## Best Practices
- After every build or code change, always check the browser and developer console for errors or warnings.
- If you see a white screen, open the browser console (F12) and look for error messages. These usually point to missing imports, typos, or runtime errors.
- Fix errors immediately before proceeding with further development.
- Document any recurring issues and their solutions in this file for future reference.

## Common Issues
- **White screen:** Usually caused by JavaScript errors, missing imports, or syntax errors.
- **Missing images:** Check that all image paths in `collageImages.js` match the actual filenames in the assets folder.
- **Icons not showing:** Ensure the icon font (e.g., Material Icons) is loaded in `index.html`.

## Debugging Steps
1. Run `npm run dev` from the `client` directory.
2. Open the app in your browser (default: http://localhost:5174/).
3. Open the browser console and check for errors after every change.
4. Address any errors before moving forward.

---
This process ensures a smooth development workflow and helps catch issues early.
