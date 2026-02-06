---
description: Steps to run before compiling/committing code to ensure quality
---

1. Run type checking to catch strict type errors:
   ```bash
   npm run type-check
   ```

2. Run linter to catch style and potential bug issues:
   ```bash
   npm run lint
   ```

3. **Production Build Check**:
   Ensure the app actually compiles. Linting might pass, but a missing asset or config error could break the build.
   ```bash
   npm run build
   ```

4. **Artifact Hygiene**:
   - Is `task.md` up to date?
   - Is `walkthrough.md` updated with recent changes?

5. Only if **ALL** commands succeed, proceed with your intended git commands.

6. If any step fails:
   - Fix the specific errors.
   - Re-run the checks to verify.
