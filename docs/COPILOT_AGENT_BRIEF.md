# Copilot Agent Brief — MsShawna site

Read this file fully before making changes.

Repository & working location
- Repo root: `/workspaces/MsShanwasApp`
- Pages (site): `/workspaces/MsShanwasApp/docs/` (GitHub Pages from `main` branch using `docs/`)

Important files
- `docs/why-pay.html`
- `docs/_assets/images/why-pay.png`
- `docs/_assets/images/why-pay.prev.png` (backup)
- `docs/_assets/images/why-pay.orig.png` (possible earlier backup)
- `docs/_assets/custom-welcome.css`

Summary of recent changes and direction
- The printed bullet list in the `why-pay.png` artwork was removed by cropping the image (mobile-first) and backups were saved.
- The printed list was recreated as semantic HTML in `docs/why-pay.html` and styled with the sans font stack.
- CSS clip-paths were removed to avoid double-cropping; we prefer cropped images + HTML overlays.
- Lists use the sans stack (`'Helvetica Neue', Helvetica, Arial, sans-serif`).
- The `My Methods` heading uses the same sans stack and a heavier weight.
- Letter-spacing was tightened to reduce wrapping on small screens; grammar/spelling were corrected to first-person, casual-educational tone for parents.

Session rules to remember (important — follow exactly)
1. After the agent makes any edit, push that commit: `git -C /workspaces/MsShanwasApp push origin main` so GitHub Pages rebuilds.
2. Do NOT create local hooks or background services unless explicitly asked.
3. Do NOT start a local HTTP server automatically for previewing; only run that when the user explicitly requests a local preview.
4. Work mobile-first. Prefer conservative changes that behave across Android devices; note Android caveats and provide fallback.

Tasks the agent should be able to run without more context
- Inspect and edit `docs/why-pay.html` (styling, content tone, punctuation, spacing).
- Run mobile-first crop detection and safe crop on other images in `docs/_assets/images/` (always backup to `.prev`).
- Tighten typography to reduce wrapping but keep legibility.
- Run spell/grammar checks and propose wording (first-person, casual but educational).
- Commit and push every in-session edit with a clear commit message and report the commit hash.

Common commands (copy/paste)
- Check status:
  `git -C /workspaces/MsShanwasApp status --short --branch`
- Recent docs commits:
  `git -C /workspaces/MsShanwasApp --no-pager log -- docs --since='24 hours ago' --pretty=format:'%h %s %ad'`
- Stage all docs changes:
  `git -C /workspaces/MsShanwasApp add docs/`
- Stage single file:
  `git -C /workspaces/MsShanwasApp add docs/why-pay.html`
- Commit examples:
  `git -C /workspaces/MsShanwasApp commit -m "docs(why-pay): tighten spacing, grammar fixes"`
  `git -C /workspaces/MsShanwasApp commit -m "feat(why-pay): crop bottom to remove printed bullet (mobile-first)"`
- Push (required after each edit this session):
  `git -C /workspaces/MsShanwasApp push origin main`
- Image inspection (Python/Pillow):
  ```bash
  python3 - <<'PY'
  from PIL import Image
  im=Image.open('docs/_assets/images/why-pay.png')
  print(im.size, im.format)
  PY
  ```
- Mobile-first crop pattern (high level):
  - Resize a copy to ~420px width, detect dark rows where printed text appears, compute safe bottom crop, backup original to `.prev`, save cropped file.
- Local preview (only if user asks):
  ```bash
  cd /workspaces/MsShanwasApp/docs
  python3 -m http.server 8000
  # open http://localhost:8000/why-pay.html
  ```

Tone & content rules for text edits
- Keep lists first-person and educational, casual for parents.
- Preserve explicit distinction: degree (MSW) vs license (Licensed Master Social Worker). Condense wording but do not conflate.
- Use proper punctuation and capitalization for list items.
- Prefer short, clear sentences to reduce wrapping on small screens.

Reporting after actions
- Always report: files changed, brief summary, commit hash, and one-line: "Pages should rebuild; check https://shawnayoungr.github.io/MsShawnasApp/... in ~1-3 minutes." 
- If cropping images, include backup path and crop pixel amount.
- Note Android-specific caveats and suggested fallback.

If anything is unclear
- Ask one short clarifying question before making edits.

Start point for the agent
1. Open `/workspaces/MsShanwasApp/docs/why-pay.html`.
2. Review lists and styles.
3. Run spell/grammar check.
4. Tighten letter-spacing if needed.
5. Commit and push changes with a clear message and report the commit hash.

---
Created for handoff: paste the short prompt below into a new Copilot agent chat.
