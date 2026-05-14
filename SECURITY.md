# Security Policy

CivicSec Lab is security-adjacent software, so reports about security weaknesses are welcome and should be handled carefully.

## Reporting Security Issues

Do not disclose suspected vulnerabilities in public issues. Contact the maintainers privately with:

- A short description of the issue.
- Affected component or file path.
- Steps to reproduce, when safe.
- Impact and suggested mitigation, if known.

If the project later enables GitHub private vulnerability reporting, use that channel.

## Demo and Data Safety

Do not upload real secrets, credentials, private logs, real personal data, or sensitive organisational data to public demo instances.

The repository sample data is fictional. Contributors should keep tests and demos fictional unless a documented public dataset is explicitly approved for a defensive use case.

## Scope

Security reports may include:

- Authentication or authorisation issues once those features exist.
- Data exposure, file upload, or retention weaknesses.
- Dependency or supply-chain vulnerabilities.
- Unsafe defaults in Docker, CI, or deployment examples.
- Documentation that could encourage unsafe use.

This project does not accept contributions that add offensive security tooling or exploit functionality.
