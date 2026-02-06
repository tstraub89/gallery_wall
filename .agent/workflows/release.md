---
description: Steps for cutting a new release
---

1. **Verify Impact**: 
   - Does this release contain changes to the actual application logic (`/src`)?
   - OR does it contain major architectural changes to the website?
   - **IF NO** (e.g., just copy tweaks, minor CSS fixes on landing page): 
     - **STOP**. Do not bump the version. Commit and push directly.

2. **Run Pre-Commit Checks**:
   - Follow the steps in `pre_commit.md`.

3. **Update Version**:
   - Bump version in `package.json`.
   - Update `CHANGELOG.md` with a new version section.

4. **Update Documentation**:
   - Update `walkthrough.md` if applicable.
   - Update `task.md` to mark release tasks as complete.

5. **Commit & Tag**:
   ```bash
   git add .
   git commit -m "chore(release): vX.X.X"
   git tag vX.X.X
   git push origin main --tags
   ```
