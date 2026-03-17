# Support

## How to Get Help

Thank you for using EnginAI! Here's how to find the support you need:

---

### 📖 Documentation

Start here before opening an issue:

- [README](README.md) — Installation, configuration, and usage
- [MVP Specification](docs/mvp%20spec.md) — What EnginAI can and cannot do
- [Technical Specification](docs/tech%20spec.md) — Architecture and module details
- [Stack & Infrastructure](docs/stack.md) — Gemini, Ollama, Node.js setup

---

### 🐛 Found a Bug?

Open a [Bug Report](https://github.com/ElioNeto/enginai/issues/new?template=bug_report.yml).

Please include:
- Node.js version (`node --version`)
- OS and version
- Steps to reproduce
- Relevant error output (redact any secrets!)

---

### 💡 Have a Feature Idea?

Open a [Feature Request](https://github.com/ElioNeto/enginai/issues/new?template=feature_request.yml).

---

### 💬 General Questions

Use [GitHub Discussions](https://github.com/ElioNeto/enginai/discussions) for:
- Questions about how to use EnginAI
- Ideas and feedback
- Showing off what you built with EnginAI

---

### 🔒 Security Issues

Do **not** open a public issue. See [SECURITY.md](SECURITY.md) for the responsible disclosure process.

---

### ⚡ Common Issues

| Problem | Solution |
|---------|----------|
| `GEMINI_API_KEY not set` | Add key to `.env` — [get it free here](https://aistudio.google.com/apikey) |
| `GITHUB_TOKEN not set` | Create at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` + `workflow` scopes |
| Ollama not found | Install from [ollama.com](https://ollama.com) and run `ollama serve` |
| GPU not used by Ollama | Run `nvidia-smi` and ensure CUDA drivers are installed |
| TypeScript build error | Run `npm run typecheck` for detailed errors |
| `ts-node` not found | Run `npm install` to restore dev dependencies |
