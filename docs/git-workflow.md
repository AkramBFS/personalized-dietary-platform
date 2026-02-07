# Git Workflow & Collaboration Guide

To keep our code clean and avoid breaking the project, everyone **must** follow this workflow.

## 1. Branching Strategy

- **main**: Only stable, tested, and demo-ready code.
- **dev**: The integration branch where all features meet.
- **feature/<name>**: Individual tasks (e.g., `feature/login-ui`).

## 2. Daily Routine

1. **Update your local dev**: `git checkout dev` then `git pull origin dev`.
2. **Start a task**: Create a branch from dev: `git checkout -b feature/your-task`.
3. **Work & Commit**: Use clear messages (e.g., `feat: add calorie calculator logic`).
4. **Push**: `git push origin feature/your-task`.

## 3. Pull Requests (PRs)

- **NEVER** push directly to `main` or `dev`.
- Open a PR from your `feature` branch into `dev`.
- At least one team member must review the code before it is merged.
- Once the feature is verified in `dev`, the Project Lead will merge `dev` into `main` for milestones.

---

## Rules

- One feature per branch
- One Pull Request per feature
- PRs must be reviewed before merging
- API changes must update documentation
- No force pushes

---

## Merge Strategy

- Feature → `dev`
- `dev` → `main` only when stable

---

## Responsibility

- Project Lead reviews merges to `main`
- Contributors review relevant feature PRs
