# Security Policy

## Supported Versions

| Version | Supported |
|---------|--------------------|
| `main` (latest) | ✅ |
| Older releases | ❌ |

We currently support only the latest version on `main`.

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub Issue for security vulnerabilities.**

Instead, report them privately via one of these channels:

1. **Email:** netoo.elio@hotmail.com  
   Subject: `[SECURITY] EnginAI — <brief description>`

2. **GitHub Private Vulnerability Reporting:**  
   [Report a vulnerability](https://github.com/ElioNeto/enginai/security/advisories/new)

---

## What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact (data exposure, RCE, privilege escalation, etc.)
- Your suggested fix (optional but appreciated)

---

## Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix & disclosure | Within 30 days (severity-dependent) |

---

## Security Considerations for Users

- **Never commit your `.env` file** — it contains API keys and tokens
- EnginAI reads `.env` locally and never transmits secrets to any third party
- The `GITHUB_TOKEN` scope should be limited to `repo` and `workflow` only
- Review the code EnginAI generates before merging PRs — always treat LLM output as untrusted
- Secrets detected in generated code are flagged but **never auto-fixed** (see [tech spec](docs/tech%20spec.md))

---

## Known Risks

| Risk | Mitigation |
|------|------------|
| LLM generates code with hardcoded secrets | EnginAI warns on detection; user must fix manually |
| `GITHUB_TOKEN` with wide scopes | Use fine-grained tokens scoped to target repos |
| Generated code with SQL injection / XSS | Always code-review LLM output |
| Ollama running on open network | Bind Ollama to `localhost` only (`OLLAMA_HOST=http://localhost:11434`) |
