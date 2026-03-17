# 🤖 AI Dev Agent

Creates complete applications from scratch and implements features automatically using AI.

## ✨ Features

- ✅ **CREATE**: Builds APIs, web apps, and scripts from zero
- ✅ **IMPLEMENT**: Implements features in existing projects
- ✅ **TESTS**: Automatically generates unit tests
- ✅ **ZERO COST**: Uses Gemini (free) + Ollama (local)

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/ElioNeto/engin.git
cd engin

# Install dependencies
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Edit .env with your API keys
```

## 🛠️ Usage

```bash
# Create a new project from scratch
python -m src.cli.main create --type api --name my-api --language python --framework fastapi

# Implement a feature in an existing project
python -m src.cli.main implement --issue "https://github.com/user/repo/issues/42"
python -m src.cli.main implement --text "add GET /users endpoint" --repo "https://github.com/user/repo"
```

## 📁 Project Structure

```
engin/
├── src/
│   ├── agents/
│   │   ├── planner.py     # Breaks demand into subtasks
│   │   ├── coder.py       # Generates and modifies code
│   │   └── tester.py      # Generates unit tests
│   ├── core/
│   │   ├── orchestrator.py    # Main flow coordinator
│   │   └── model_router.py    # Routes requests to Gemini or Ollama
│   ├── services/
│   │   └── scaffolder.py      # Project structure generation
│   ├── adapters/
│   │   └── repo_manager.py    # Git & GitHub operations
│   └── cli/
│       └── main.py            # CLI entry point
├── docs/
│   ├── mvp spec.md        # MVP specification
│   ├── tech spec.md       # Technical specification
│   └── stack.md           # Stack & infrastructure details
├── .env.example
├── requirements.txt
└── README.md
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in your keys:

```bash
GEMINI_API_KEY=AIzaSy...       # https://aistudio.google.com/apikey
GITHUB_TOKEN=ghp_...           # https://github.com/settings/tokens
OLLAMA_HOST=http://localhost:11434
```

## 📖 Documentation

- [MVP Specification](docs/mvp%20spec.md)
- [Technical Specification](docs/tech%20spec.md)
- [Stack & Infrastructure](docs/stack.md)

## 📄 License

MIT
