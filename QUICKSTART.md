# EnginAI — Quickstart Guide

AI-powered developer agent that scaffolds projects and implements features automatically using Gemini and Ollama.

## Prerequisites

- **Node.js** >= 20 ([download](https://nodejs.org/))
- **npm** (included with Node.js)
- **Git** ([download](https://git-scm.com/))

## Installation

### Option A: Install globally from npm

```bash
npm install -g enginai
```

### Option B: Clone and build from source

```bash
git clone https://github.com/ElioNeto/enginai.git
cd enginai
npm install
npm run build
npm link
```

Verify installation:

```bash
enginai --version
```

## API Keys Setup

### 1. GitHub Token (required for `implement` command)

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. Click **"Generate token"** and copy it

### 2. Gemini API Key (free — primary LLM)

1. Go to https://aistudio.google.com/apikey
2. Click **"Create API key"**
3. Copy the key
4. Free tier: **1,500 requests/day** (sufficient for most usage)

### 3. Ollama (optional — local fallback LLM)

Ollama runs LLMs locally. EnginAI uses it as a fallback when Gemini quota is exhausted.

1. Download from https://ollama.com
2. Install and start the service:
   ```bash
   ollama serve
   ```
3. Pull recommended models:
   ```bash
   ollama pull qwen2.5-coder:7b
   ollama pull deepseek-r1:7b
   ```
4. Verify:
   ```bash
   ollama list
   ```
5. Default host: `http://localhost:11434`

## Configuration

Copy the example environment file and fill in your tokens:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
GITHUB_TOKEN=ghp_your_token_here
GEMINI_API_KEY=AIzaSy_your_key_here

# Optional: Ollama per-task models
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL_PLANNER=deepseek-r1:7b
OLLAMA_MODEL_CODER=qwen2.5-coder:7b
OLLAMA_MODEL_REVIEWER=qwen2.5-coder:7b
OLLAMA_MODEL_SUMMARIZER=qwen2.5-coder:7b
```

Validate your configuration:

```bash
enginai config --check
```

## Usage

### Create a new project

**TypeScript Express API:**

```bash
enginai create --type api --name my-api --language typescript --framework express
```

**Python FastAPI:**

```bash
enginai create --type api --name my-api --language python --framework fastapi
```

**TypeScript script:**

```bash
enginai create --type script --name my-tool --language typescript
```

**With authentication and database:**

```bash
enginai create --type api --name my-api --language python --framework fastapi --database postgres --auth
```

### Implement a feature

**From a GitHub issue:**

```bash
enginai implement --repo https://github.com/user/repo --issue https://github.com/user/repo/issues/1
```

**From a text description:**

```bash
enginai implement --repo https://github.com/user/repo --text "add GET /ping endpoint that returns {pong: true}"
```

### Check configuration

```bash
enginai config --check
```

## How It Works

1. **CREATE flow**: Scaffolds a project from templates (Nunjucks), initializes git, generates README with LLM
2. **IMPLEMENT flow**: Clones repo → fetches issue → creates plan (LLM) → implements code (LLM) → generates tests (LLM) → creates PR

EnginAI uses **Gemini** as the primary LLM (free tier) and falls back to **Ollama** (local) when the daily quota is reached.

## Troubleshooting

- **"Ollama connection failed"**: Run `ollama serve` to start the Ollama service
- **"GitHub authentication failed"**: Check your `GITHUB_TOKEN` is set and has `repo` scope
- **"Missing required env variable"**: Run `enginai config --check` to see which vars are missing
- **ESM import errors**: Ensure you're using the correct versions (chalk@4, ora@5)

## License

MIT
