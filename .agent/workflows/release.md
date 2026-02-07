---
description: Steps for cutting a new release
---

> [!IMPORTANT]
> **CRITICAL RULE**: Whenever you bump the version in `package.json`, you **MUST** also update `CHANGELOG.md`.
> **NO EXCEPTIONS**. A version bump without a changelog entry is incomplete.

1. **Verify Impact & Permission**: 
   - **Patch**: safe to bump for app bug fixes/features.
   - **Minor**: STOP. Ask user for permission first.
   - **Major**: STOP. Only proceed if user explicitly ordered it.
   - **No Bump**: For minor website tweaks (copy, CSS), do NOT bump version.

2. **Run Pre-Commit Checks**:
   - Follow the steps in `pre_commit.md`.

3. **Update Version (If Bumping Version)**:
   - **`package.json`**: Increment the `version` field (e.g., `0.2.9` -> `0.2.10`).
   - **`CHANGELOG.md`**: Add a new section at the top.
     - Header format: `## [X.X.X] - YYYY-MM-DD`
     - Group changes by type (e.g., `### 🚀 New Features`, `### 🐛 Bug Fixes`).

4. **Update Documentation**:
   - Update `walkthrough.md` if applicable.
   - Update `task.md` to mark release tasks as complete.

5. **Commit & Tag**:
   - **Scenario A (Mixed Content)**: You are committing code changes AND a version bump together.
     ```bash
     git add .
     git commit -m "feat: description of change (vX.X.X)"
     git push origin main
     ```
   - **Scenario B (Standalone Release)**: You are ONLY committing the version bump/changelog.
     ```bash
     git add package.json CHANGELOG.md
     git commit -m "chore(release): vX.X.X"
     git tag vX.X.X
     git push origin main --tags
     ```
