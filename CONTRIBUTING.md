# Contributing

Thank you for considering a contribution to CivicSec Lab. The project is in early development, so clarity and restraint matter more than adding large features quickly.

## Project Boundaries

CivicSec Lab is defensive, educational, and public-interest oriented. Contributions must not add exploit code, credential harvesting, malware behaviour, stealth logic, offensive automation, or tools for targeting private individuals.

Use fictional or properly anonymised data in tests, documentation, screenshots, and demos.

## How To Contribute

1. Look for an open issue with a clear scope.
2. Comment before starting larger changes so maintainers can confirm direction.
3. Keep pull requests focused on one feature, fix, or documentation improvement.
4. Add or update tests when behaviour changes.
5. Update documentation when workflows, APIs, commands, or safety boundaries change.

## Local Checks

Backend:

```powershell
Set-Location backend
pytest
ruff check .
black --check .
```

Frontend:

```powershell
Set-Location frontend
npm run lint
npm run build
```

## Pull Request Expectations

Every pull request should describe:

- What changed.
- Which module or docs area is affected.
- How the change was tested.
- Any security, privacy, data-retention, or responsible-use implications.

Small, reviewable pull requests are preferred.
