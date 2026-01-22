# AI Dev Agent - Especificação Técnica MVP Completo

**Versão:** 3.0 - MVP Completo (Criar + Implementar)  
**Data:** 22 de Janeiro de 2026  
**Escopo:** Criar aplicações do zero + Implementar features em apps existentes  
**Timeline:** 8 semanas  
**Custo:** R$ 0,00/mês

---

## RESUMO EXECUTIVO

### Problema
Desenvolvedores perdem tempo em:
1. **Criar estrutura inicial** de novos projetos (boilerplate, configuração)
2. **Implementar features repetitivas** em projetos existentes (endpoints, CRUD, validações)

### Solução MVP
AI Dev Agent que **cria aplicações do zero** usando templates e **implementa features simples** em repositórios existentes, com workflow completo automatizado.

### Escopo MVP (O que FAZ)

**🆕 CRIAR APLICAÇÕES DO ZERO:**
✅ API REST (FastAPI, Flask, Express)  
✅ App Web básico (Angular, React - estrutura inicial)  
✅ Configuração automática (banco de dados, autenticação básica)  
✅ Estrutura de testes  
✅ Docker + docker-compose  
✅ CI/CD básico (GitHub Actions)  
✅ README com documentação  

**🔧 IMPLEMENTAR FEATURES EM APPS EXISTENTES:**
✅ Ler Issues do GitHub  
✅ Analisar estrutura do projeto  
✅ Adicionar endpoints REST  
✅ Implementar CRUD  
✅ Criar funções/classes  
✅ Adicionar validações  
✅ Corrigir bugs pontuais  
✅ Gerar testes unitários  
✅ Commit, push e PR  

### Escopo MVP (O que NÃO FAZ - V1)
❌ Apps complexos (microsserviços, arquiteturas distribuídas)  
❌ RAG com Vector Store (análise profunda de contexto)  
❌ Correção automática iterativa (múltiplas tentativas)  
❌ Memória persistente entre execuções  
❌ Features complexas (10+ arquivos, refatorações grandes)  
❌ Interface gráfica (V2)  

### Casos de Uso MVP

**Criar do Zero:**
1. **API REST completa** com CRUD, autenticação, banco
2. **App Angular** com roteamento, componentes, serviços
3. **Script Python** com CLI, testes, documentação
4. **Microserviço básico** com Docker

**Implementar Features:**
1. **Adicionar endpoint** em API existente
2. **Implementar método CRUD** em controller
3. **Criar componente** em app Angular
4. **Adicionar validação** em modelo
5. **Corrigir bug** pontual

---

## 1. ARQUITETURA MVP COMPLETA

### 1.1 Visão Geral

```
┌─────────────────────────────────────────────────────┐
│              CLI (Rich Interface)                   │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  Orchestrator  │
         │  (Mode Router) │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┐
    │ CREATE     │ IMPLEMENT  │
    ▼            ▼            
┌────────┐   ┌─────────────────────┐
│Scaffold│   │ Planner → Coder →   │
│Service │   │ Tester → Validator  │
└───┬────┘   └─────────┬───────────┘
    │                  │
    └──────────┬───────┘
               │
    ┌──────────┼─────────────┐
    │          │             │
┌───▼───┐  ┌──▼──────┐  ┌───▼──────┐
│ Repo  │  │Template │  │   LLM    │
│Manager│  │ Engine  │  │  Router  │
└───────┘  └─────────┘  └──────────┘
```

### 1.2 Componentes MVP

**1. CLI (Interface)**
- Comandos: `create` (novo app) e `implement` (feature)
- Progress bars, logs, confirmações

**2. Orchestrator (Mode Router)**
- Detecta modo: CREATE vs IMPLEMENT
- Roteia para Scaffolder ou Planner

**3. Scaffolder Service (NOVO)**
- Gera estrutura de projeto a partir de templates
- Personaliza baseado em parâmetros do usuário
- Inicializa Git, cria README, configura CI/CD

**4. Template Engine (NOVO)**
- Biblioteca de templates para cada tipo de app
- Substituição de variáveis (nome projeto, autor, etc.)
- Templates customizáveis via prompts LLM

**5. Planner Agent**
- Analisa demanda e repo existente
- Gera plano de implementação (1-5 subtarefas)

**6. Coder Agent**
- Gera código (criar app ou modificar)
- Aplica mudanças em arquivos

**7. Tester Agent**
- Gera testes unitários
- Valida implementação

**8. Repo Manager**
- Git operations (clone, branch, commit, push, PR)
- Inicialização de novo repo

**9. LLM Router**
- Gemini (primário, grátis) + Ollama (fallback)

---

## 2. MÓDULOS DETALHADOS

### 2.1 CLI Module (Estendido)

**Comandos:**

```bash
# === CRIAR NOVO APP ===
aidevagent create --type api --name user-service --language python
aidevagent create --type webapp --name dashboard --framework angular
aidevagent create --type script --name data-processor

# === IMPLEMENTAR FEATURE ===
aidevagent implement --issue <URL>
aidevagent implement --text "adicionar endpoint GET /users" --repo <URL>

# === CONFIGURAÇÃO ===
aidevagent config --check
aidevagent config --setup

# === TEMPLATES ===
aidevagent templates --list
aidevagent templates --show api-fastapi
```

**Interface:**

```python
import click
from rich.console import Console

@click.group()
def cli():
    """AI Dev Agent - Criar apps e implementar features"""
    pass

@cli.command()
@click.option('--type', type=click.Choice(['api', 'webapp', 'script']), required=True)
@click.option('--name', required=True, help='Nome do projeto')
@click.option('--language', type=click.Choice(['python', 'typescript', 'javascript']))
@click.option('--framework', help='Framework específico (fastapi, flask, express, angular, react)')
@click.option('--database', type=click.Choice(['postgres', 'mysql', 'sqlite', 'none']))
@click.option('--auth', is_flag=True, help='Incluir autenticação JWT')
@click.option('--docker', is_flag=True, default=True, help='Incluir Docker')
def create(type, name, language, framework, database, auth, docker):
    """Cria novo aplicativo do zero"""
    console = Console()

    # Validações
    if not language:
        language = _infer_language(type, framework)

    # Executar scaffolding
    scaffolder = ScaffolderService()
    result = scaffolder.create_project(
        type=type,
        name=name,
        language=language,
        framework=framework,
        database=database,
        include_auth=auth,
        include_docker=docker
    )

    console.print(f"[green]✅ Projeto criado em: {result.path}[/green]")
    console.print(f"[cyan]📝 Próximos passos:[/cyan]")
    console.print(f"   cd {name}")
    console.print(f"   {result.setup_command}")

@cli.command()
@click.option('--issue', help='URL da Issue do GitHub')
@click.option('--text', help='Descrição em texto livre')
@click.option('--repo', help='URL do repositório')
def implement(issue, text, repo):
    """Implementa feature em projeto existente"""
    orchestrator = MainOrchestrator()
    result = orchestrator.implement_feature(
        issue_url=issue,
        text=text,
        repo_url=repo
    )

    console = Console()
    console.print(f"[green]✅ PR criado: {result.pr_url}[/green]")
```

---

### 2.2 Orchestrator Module (Mode Router)

**Responsabilidade:** Detectar modo e rotear para módulo apropriado.

```python
from enum import Enum

class ExecutionMode(Enum):
    CREATE = "create"
    IMPLEMENT = "implement"

class MainOrchestrator:
    def __init__(self):
        self.scaffolder = ScaffolderService()
        self.planner = PlannerAgent()
        self.coder = CoderAgent()
        self.tester = TesterAgent()
        self.repo_manager = RepoManager()
        self.llm_router = LLMRouter()

    def create_project(
        self,
        project_type: str,
        name: str,
        **options
    ) -> CreateResult:
        """
        Fluxo CREATE:
        1. Gerar estrutura do template
        2. Personalizar com LLM (opcional)
        3. Inicializar Git
        4. Criar README
        5. Setup CI/CD
        6. Rodar testes iniciais
        """
        console = Console()

        with console.status("[cyan]Criando projeto...[/cyan]"):
            # 1. Gerar estrutura do template
            project_path = self.scaffolder.generate_structure(
                project_type=project_type,
                name=name,
                **options
            )

            # 2. Personalizar arquivos com LLM (se necessário)
            if options.get('customize'):
                self.scaffolder.customize_with_llm(
                    project_path,
                    requirements=options.get('requirements')
                )

            # 3. Inicializar Git
            self.repo_manager.init_repo(project_path)
            self.repo_manager.initial_commit(project_path)

            # 4. Gerar testes iniciais
            self.tester.generate_initial_tests(project_path)

            # 5. Validar que funciona
            validation = self._validate_new_project(project_path)

            if not validation.success:
                console.print(f"[yellow]⚠️  Projeto criado mas validação falhou:[/yellow]")
                console.print(validation.error)

            return CreateResult(
                path=project_path,
                validation=validation
            )

    def implement_feature(
        self,
        issue_url: str = None,
        text: str = None,
        repo_url: str = None
    ) -> ImplementResult:
        """
        Fluxo IMPLEMENT:
        (Igual ao MVP focado anterior)
        1. Clone repo
        2. Analyze
        3. Plan
        4. Confirm
        5. Implement
        6. Test
        7. Validate
        8. PR
        """
        # ... (código do MVP anterior)
```

---

### 2.3 Scaffolder Service (NOVO)

**Responsabilidade:** Criar estrutura de novo projeto a partir de templates.

```python
from pathlib import Path
from jinja2 import Template
import shutil

@dataclass
class ProjectConfig:
    type: str  # api | webapp | script
    name: str
    language: str
    framework: str
    database: Optional[str] = None
    include_auth: bool = False
    include_docker: bool = True
    include_tests: bool = True
    include_ci: bool = True

@dataclass
class CreateResult:
    path: Path
    setup_command: str
    next_steps: list[str]
    validation: 'ValidationResult'

class ScaffolderService:
    def __init__(self, llm_router: LLMRouter):
        self.llm = llm_router
        self.templates_dir = Path(__file__).parent / "templates"

    def generate_structure(
        self,
        project_type: str,
        name: str,
        **options
    ) -> Path:
        """
        Gera estrutura completa do projeto.
        """
        config = ProjectConfig(
            type=project_type,
            name=name,
            **options
        )

        # Selecionar template base
        template_name = self._select_template(config)
        template_path = self.templates_dir / template_name

        # Criar diretório do projeto
        project_path = Path.cwd() / name
        project_path.mkdir(parents=True, exist_ok=True)

        # Copiar e processar arquivos do template
        self._copy_template_files(template_path, project_path, config)

        # Gerar arquivos customizados com LLM
        self._generate_custom_files(project_path, config)

        # Instalar dependências
        self._setup_dependencies(project_path, config)

        return project_path

    def _select_template(self, config: ProjectConfig) -> str:
        """
        Seleciona template apropriado baseado na config.
        """
        templates = {
            ('api', 'python', 'fastapi'): 'api-fastapi',
            ('api', 'python', 'flask'): 'api-flask',
            ('api', 'typescript', 'express'): 'api-express',
            ('webapp', 'typescript', 'angular'): 'webapp-angular',
            ('webapp', 'typescript', 'react'): 'webapp-react',
            ('script', 'python', None): 'script-python'
        }

        key = (config.type, config.language, config.framework)
        return templates.get(key, 'api-fastapi')  # default

    def _copy_template_files(
        self,
        template_path: Path,
        project_path: Path,
        config: ProjectConfig
    ):
        """
        Copia arquivos do template, substituindo variáveis.
        """
        for file in template_path.rglob("*"):
            if file.is_file():
                relative = file.relative_to(template_path)
                target = project_path / relative
                target.parent.mkdir(parents=True, exist_ok=True)

                # Processar arquivo com Jinja2
                if file.suffix in ['.py', '.ts', '.js', '.json', '.md', '.yml']:
                    content = file.read_text()
                    template = Template(content)
                    rendered = template.render(
                        project_name=config.name,
                        language=config.language,
                        framework=config.framework,
                        has_database=bool(config.database),
                        database_type=config.database,
                        has_auth=config.include_auth,
                        has_docker=config.include_docker
                    )
                    target.write_text(rendered)
                else:
                    shutil.copy2(file, target)

    def _generate_custom_files(
        self,
        project_path: Path,
        config: ProjectConfig
    ):
        """
        Gera arquivos customizados usando LLM.
        """
        # README.md customizado
        readme = self._generate_readme(config)
        (project_path / "README.md").write_text(readme)

        # Se incluir auth, gerar módulo de autenticação
        if config.include_auth:
            auth_code = self._generate_auth_module(config)
            auth_file = project_path / "src" / "auth.py"  # ou auth.ts
            auth_file.parent.mkdir(exist_ok=True)
            auth_file.write_text(auth_code)

    def _generate_readme(self, config: ProjectConfig) -> str:
        """Gera README usando LLM."""
        prompt = f"""
Gere um README.md completo para um projeto {config.type} em {config.language} usando {config.framework}.

Nome do projeto: {config.name}

Incluir seções:
- Descrição
- Requisitos
- Instalação
- Configuração (.env)
- Como rodar
- Como testar
- Endpoints principais (se API)
- Estrutura de pastas
- Tecnologias usadas
- Licença (MIT)

Formato: Markdown profissional e completo.
"""
        return self.llm.complete(prompt, task_type="coding", max_tokens=2048)

    def _generate_auth_module(self, config: ProjectConfig) -> str:
        """Gera módulo de autenticação JWT usando LLM."""
        prompt = f"""
Gere código completo de autenticação JWT para {config.framework} em {config.language}.

Requisitos:
- Registro de usuário (email, senha)
- Login (retorna token JWT)
- Middleware de autenticação
- Refresh token
- Hashing de senha (bcrypt)
- Validação de email

Retorne APENAS o código:
"""
        return self.llm.complete(prompt, task_type="coding", max_tokens=3000)

    def _setup_dependencies(self, project_path: Path, config: ProjectConfig):
        """Instala dependências do projeto."""
        if config.language == "python":
            # Criar requirements.txt ou pyproject.toml
            pass
        elif config.language in ["typescript", "javascript"]:
            # npm install
            pass
```

---

### 2.4 Template Engine (Biblioteca de Templates)

**Estrutura de Templates:**

```
templates/
├── api-fastapi/
│   ├── src/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routes/
│   │   │   └── users.py
│   │   └── database.py
│   ├── tests/
│   │   └── test_users.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .github/
│       └── workflows/
│           └── ci.yml
├── api-flask/
├── api-express/
├── webapp-angular/
├── webapp-react/
└── script-python/
```

**Exemplo: api-fastapi/src/main.py**

```python
# Template com variáveis Jinja2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="{{ project_name }}",
    description="API REST gerada por AI Dev Agent",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

{% if has_database %}
from .database import engine, Base
Base.metadata.create_all(bind=engine)
{% endif %}

{% if has_auth %}
from .routes import auth
app.include_router(auth.router, prefix="/auth", tags=["auth"])
{% endif %}

from .routes import users
app.include_router(users.router, prefix="/users", tags=["users"])

@app.get("/")
def root():
    return {"message": "{{ project_name }} API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
```

---

### 2.5 Planner Agent (Mantém para IMPLEMENT)

**Responsabilidade:** Analisar demanda e gerar plano (igual ao MVP anterior).

```python
class PlannerAgent:
    # ... (código do MVP anterior v2.0)
    # Usado apenas no modo IMPLEMENT
```

---

### 2.6 Coder Agent (Estendido)

**Responsabilidade:** Gerar código (tanto para CREATE quanto IMPLEMENT).

```python
class CoderAgent:
    def __init__(self, llm_router: LLMRouter):
        self.llm = llm_router

    def implement(
        self,
        plan: Plan,
        repo_context: RepoContext
    ) -> list[FileChange]:
        """Implementa plano em repo existente (modo IMPLEMENT)."""
        # ... (código do MVP anterior)

    def generate_file_from_scratch(
        self,
        file_type: str,
        context: dict
    ) -> str:
        """
        Gera arquivo do zero (usado pelo Scaffolder).
        """
        prompt = self._build_generation_prompt(file_type, context)
        code = self.llm.complete(prompt, task_type="coding", max_tokens=3000)
        return self._extract_code_block(code)

    def _build_generation_prompt(self, file_type: str, context: dict) -> str:
        prompts = {
            "controller": f"""
Gere um controller REST completo em {context['framework']} para a entidade {context['entity']}.

Endpoints:
- GET /{context['entity']}s - Listar todos
- GET /{context['entity']}s/:id - Buscar por ID
- POST /{context['entity']}s - Criar novo
- PUT /{context['entity']}s/:id - Atualizar
- DELETE /{context['entity']}s/:id - Deletar

Incluir:
- Validações
- Error handling
- Documentação (docstrings/JSDoc)
- Response models

Retorne APENAS o código:
""",
            "model": f"""
Gere um modelo de dados {context['framework']} para {context['entity']}.

Campos: {context['fields']}

Incluir:
- Validações apropriadas
- Relacionamentos (se houver)
- Métodos auxiliares
- Timestamps (created_at, updated_at)

Retorne APENAS o código:
""",
            # ... outros tipos
        }
        return prompts.get(file_type, "")
```

---

### 2.7 Tester Agent (Estendido)

**Responsabilidade:** Gerar testes (CREATE e IMPLEMENT).

```python
class TesterAgent:
    def generate_tests(
        self,
        changes: list[FileChange],
        repo_context: RepoContext
    ) -> list[FileChange]:
        """Gera testes para mudanças (modo IMPLEMENT)."""
        # ... (código anterior)

    def generate_initial_tests(
        self,
        project_path: Path
    ) -> list[Path]:
        """
        Gera suite de testes inicial para projeto novo (modo CREATE).
        """
        test_files = []

        # Detectar tipo de projeto
        if (project_path / "src" / "main.py").exists():
            # FastAPI
            test_content = self._generate_api_tests(project_path)
            test_file = project_path / "tests" / "test_main.py"
            test_file.write_text(test_content)
            test_files.append(test_file)

        elif (project_path / "src" / "app.component.ts").exists():
            # Angular
            # ...
            pass

        return test_files

    def _generate_api_tests(self, project_path: Path) -> str:
        """Gera testes para API usando LLM."""
        # Ler main.py para entender endpoints
        main_code = (project_path / "src" / "main.py").read_text()

        prompt = f"""
Gere testes completos usando pytest para esta API FastAPI:

```python
{main_code}
```

Requisitos:
- Testar todos os endpoints
- Usar TestClient do FastAPI
- Cobrir casos de sucesso e erro
- Nomenclatura clara

Retorne APENAS o código de teste:
"""
        return self.llm.complete(prompt, task_type="coding", max_tokens=2048)
```

---

## 3. FLUXO DE DADOS MVP COMPLETO

### 3.1 Fluxo CREATE (Novo App)

```
┌─────────────────────────────┐
│ 1. INPUT                    │
│ aidevagent create --type api│
│ --name user-service         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. SELECT TEMPLATE          │
│ api-fastapi (Python)        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. GENERATE STRUCTURE       │
│ Copiar template + substituir│
│ variáveis (nome, config)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. CUSTOMIZE WITH LLM       │
│ Gerar: README, auth module, │
│ testes específicos          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 5. INIT GIT                 │
│ git init + initial commit   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 6. GENERATE TESTS           │
│ Suite de testes inicial     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 7. VALIDATE                 │
│ Rodar testes, lint          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 8. OUTPUT                   │
│ Projeto pronto em ./nome    │
└─────────────────────────────┘
```

### 3.2 Fluxo IMPLEMENT (Feature Existente)

```
(Igual ao MVP v2.0 - issue → clone → plan → implement → test → PR)
```

---

## 4. TEMPLATES DISPONÍVEIS NO MVP

### 4.1 API REST (FastAPI - Python)

**Características:**
- Estrutura modular (routes, models, services)
- Autenticação JWT (opcional)
- Banco de dados (PostgreSQL/SQLite)
- CRUD completo para entidade exemplo
- Validação com Pydantic
- Testes com pytest
- Docker + docker-compose
- CI/CD (GitHub Actions)
- OpenAPI docs automático

**Estrutura:**
```
user-service/
├── src/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   │   └── user.py
│   ├── routes/
│   │   ├── users.py
│   │   └── auth.py (se --auth)
│   ├── schemas/
│   │   └── user.py
│   └── services/
│       └── user_service.py
├── tests/
│   ├── conftest.py
│   └── test_users.py
├── requirements.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

---

### 4.2 API REST (Express - TypeScript)

**Características:**
- Estrutura modular (controllers, models, routes)
- Autenticação JWT (opcional)
- TypeORM para banco de dados
- CRUD completo
- Validação com class-validator
- Testes com Jest
- Docker
- ESLint + Prettier

**Estrutura:**
```
user-api/
├── src/
│   ├── index.ts
│   ├── controllers/
│   │   └── UserController.ts
│   ├── models/
│   │   └── User.ts
│   ├── routes/
│   │   └── users.ts
│   ├── middleware/
│   │   └── auth.ts (se --auth)
│   └── database.ts
├── tests/
│   └── users.test.ts
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
└── README.md
```

---

### 4.3 Web App (Angular)

**Características:**
- Estrutura padrão Angular
- Roteamento configurado
- Componentes base (home, about, 404)
- Serviço de autenticação (opcional)
- HttpClient configurado
- Testes com Jasmine
- Build otimizado
- Dockerfile para produção

**Estrutura:**
```
dashboard/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/
│   │   │   └── navbar/
│   │   ├── services/
│   │   │   └── api.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts (se --auth)
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── environments/
│   └── main.ts
├── angular.json
├── package.json
└── README.md
```

---

### 4.4 Script Python (CLI)

**Características:**
- CLI com Click
- Configuração via .env
- Logging estruturado
- Testes com pytest
- Setup.py para instalação
- Documentação

**Estrutura:**
```
data-processor/
├── src/
│   ├── cli.py
│   ├── processor.py
│   └── utils.py
├── tests/
│   └── test_processor.py
├── setup.py
├── requirements.txt
└── README.md
```

---

## 5. CONFIGURAÇÃO (.env)

```bash
# ==========================================
# AI DEV AGENT - MVP COMPLETO
# ==========================================

# === AMBIENTE ===
APP_ENV=dev
LOG_LEVEL=INFO
WORKDIR=~/.aidevagent/workspace

# === GIT & GITHUB ===
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_BASE_BRANCH=main

# === LLM ===
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_DAILY_LIMIT=1450
OLLAMA_HOST=http://localhost:11434
OLLAMA_GPU_ENABLED=true

# === TEMPLATES ===
TEMPLATES_DIR=~/.aidevagent/templates
DEFAULT_AUTHOR=Your Name
DEFAULT_LICENSE=MIT
DEFAULT_PYTHON_VERSION=3.11
DEFAULT_NODE_VERSION=20

# === PROJETO DEFAULT ===
DEFAULT_DATABASE=postgres
DEFAULT_INCLUDE_AUTH=true
DEFAULT_INCLUDE_DOCKER=true
DEFAULT_INCLUDE_CI=true
```

---

## 6. PLANO DE IMPLEMENTAÇÃO (8 SEMANAS)

### Sprint 1 (Semanas 1-2): Fundação + Templates

**Objetivo:** CLI funcional + biblioteca de templates

**Tarefas:**
- [ ] Setup projeto: estrutura, poetry, .env
- [ ] CLI com comandos `create` e `implement`
- [ ] RepoManager: init, clone, branch, commit, push
- [ ] Template Engine: carregar e processar templates Jinja2
- [ ] 3 templates básicos:
  - [ ] api-fastapi
  - [ ] api-express
  - [ ] webapp-angular
- [ ] Testes unitários: cobertura > 60%

**Entregável:** CLI que cria projeto do template (sem customização LLM)

---

### Sprint 2 (Semanas 3-4): Scaffolder + LLM Integration

**Objetivo:** Scaffolder completo com personalização LLM

**Tarefas:**
- [ ] LLMRouter: Gemini + Ollama
- [ ] ScaffolderService: geração de estrutura + customização
- [ ] Gerar README com LLM
- [ ] Gerar módulo de auth com LLM
- [ ] Gerar testes iniciais com LLM
- [ ] Validação de projeto novo
- [ ] Testes unitários: cobertura > 70%

**Entregável:** `aidevagent create` funcional end-to-end

---

### Sprint 3 (Semanas 5-6): Implement Mode

**Objetivo:** Implementar features em projetos existentes

**Tarefas:**
- [ ] PlannerAgent: análise + plano
- [ ] CoderAgent: gerar código
- [ ] TesterAgent: gerar testes
- [ ] ExecutorService: rodar comandos
- [ ] Validação: lint + typecheck + tests
- [ ] Testes unitários: cobertura > 75%

**Entregável:** `aidevagent implement` funcional

---

### Sprint 4 (Semanas 7-8): GitHub Integration + Polish

**Objetivo:** Sistema completo com GitHub + refinamentos

**Tarefas:**
- [ ] GitHub Integration: ler Issue, criar PR
- [ ] Orchestrator: modo router (CREATE vs IMPLEMENT)
- [ ] Progress bars e UX (Rich)
- [ ] Confirmações e validações
- [ ] Error handling robusto
- [ ] Documentação completa
- [ ] Testes E2E: cenários reais
- [ ] Testes unitários: cobertura > 80%

**Entregável:** MVP completo funcional

---

## 7. CASOS DE USO COMPLETOS

### Caso 1: Criar API REST do Zero

**Input:**
```bash
aidevagent create \
  --type api \
  --name user-service \
  --language python \
  --framework fastapi \
  --database postgres \
  --auth
```

**Execução:**
1. Seleciona template `api-fastapi`
2. Copia estrutura base
3. Substitui variáveis (nome, config)
4. **Gera com LLM:**
   - README customizado
   - Módulo de autenticação JWT completo
   - Testes para todos os endpoints
5. Inicializa Git
6. Roda validações (testes passam)
7. Output: projeto pronto em `./user-service`

**Resultado:**
```
✅ Projeto criado em: ./user-service
📝 Próximos passos:
   cd user-service
   docker-compose up
   # API rodando em http://localhost:8000
   # Docs em http://localhost:8000/docs
```

**Tempo:** ~2-3 minutos

---

### Caso 2: Criar Web App Angular

**Input:**
```bash
aidevagent create \
  --type webapp \
  --name dashboard \
  --framework angular \
  --auth
```

**Resultado:**
```
dashboard/
├── Estrutura completa Angular
├── Roteamento configurado
├── Componentes base (home, navbar, login)
├── Serviço de autenticação
├── Testes unitários
└── README com instruções
```

**Tempo:** ~2-3 minutos

---

### Caso 3: Implementar Feature em API Existente

**Input:**
```bash
aidevagent implement \
  --issue "https://github.com/user/api/issues/42"
```

**Issue #42:**
```
Adicionar endpoint POST /api/products para criar produto

Campos:
- name (string, obrigatório)
- price (decimal, > 0)
- description (string, opcional)

Retornar 201 Created com produto criado
Validar campos obrigatórios
```

**Execução:**
1. Clone repo
2. Analisa estrutura (FastAPI)
3. **Plano:**
   - Subtask 1: Criar modelo Product em models/product.py
   - Subtask 2: Criar schema ProductCreate em schemas/product.py
   - Subtask 3: Adicionar endpoint POST em routes/products.py
   - Subtask 4: Criar testes em tests/test_products.py
4. Implementa código
5. Gera testes
6. Roda validações (passa)
7. Commit + Push + PR

**PR criado com:**
- Título: "feat: add POST /api/products endpoint"
- Descrição: resumo, arquivos alterados, testes
- Link para Issue #42

**Tempo:** ~3-5 minutos

---

### Caso 4: Criar Script Python CLI

**Input:**
```bash
aidevagent create \
  --type script \
  --name data-processor \
  --language python
```

**Resultado:**
```
data-processor/
├── CLI funcional com Click
├── Logging configurado
├── Testes com pytest
├── README com exemplos
└── setup.py para instalação
```

---

## 8. LIMITAÇÕES DO MVP

### O que NÃO faz (virá em V1)

❌ **Apps complexos**
- Microsserviços distribuídos
- Arquiteturas multi-tier
- Sistemas legados

❌ **RAG/Análise profunda**
- Entendimento de contexto amplo (10+ arquivos)
- Refatorações grandes
- Migrações de framework

❌ **Correção iterativa**
- Retry automático em caso de erro
- Loop de correção até passar testes

❌ **Memória persistente**
- Aprendizado entre execuções
- Histórico de decisões

❌ **Features avançadas**
- Multi-repo
- Monorepos
- Integração com IDEs

---

## 9. CRITÉRIOS DE ACEITE MVP

### Funcionalidades CREATE

✅ **Dado comando create, gera app funcional**
- Estrutura completa do template
- Arquivos customizados com LLM
- Testes passando
- README com instruções
- Git inicializado

✅ **Templates disponíveis:**
- API FastAPI (Python)
- API Express (TypeScript)
- Web App Angular
- Script Python CLI

✅ **Customizações:**
- Nome do projeto
- Banco de dados (Postgres/MySQL/SQLite)
- Autenticação JWT (opcional)
- Docker (padrão)
- CI/CD (GitHub Actions)

### Funcionalidades IMPLEMENT

✅ **Dado Issue, implementa feature simples**
- Clone repo
- Análise de estrutura
- Plano coerente
- Código funcional (1-3 arquivos)
- Testes gerados
- Validação (passa)
- PR criado e linkado

✅ **Suporte a linguagens:**
- Python (FastAPI, Flask)
- TypeScript (Express, Angular)

### Métricas de Sucesso

- **Taxa de sucesso CREATE:** > 95%
- **Taxa de sucesso IMPLEMENT:** > 70%
- **Tempo médio CREATE:** < 3 minutos
- **Tempo médio IMPLEMENT:** < 5 minutos
- **Custo:** R$ 0,00
- **Cobertura de testes:** > 80%

---

## 10. STACK TECNOLÓGICA

### Core
- **Python:** 3.11+
- **Gerenciador:** Poetry
- **CLI:** Click + Rich
- **Templates:** Jinja2

### LLM
- **Primário:** Gemini 2.5 Flash (grátis)
- **Secundário:** Ollama local (qwen2.5-coder, deepseek-r1)

### Git/GitHub
- **Git:** GitPython
- **GitHub API:** PyGithub

### Testing
- **Framework:** pytest
- **Coverage:** pytest-cov

---

## 11. EVOLUÇÃO PÓS-MVP

### V1 (Semanas 9-14): Features Complexas + RAG

**Adiciona:**
- ✅ RAG com FAISS (contexto amplo)
- ✅ Correção automática (3 tentativas)
- ✅ Memória persistente (SQLite)
- ✅ Pattern Learner
- ✅ Mais templates (React, Vue, Django)
- ✅ Features complexas (5-10 arquivos)

### V2 (Semanas 15-18): GUI + Avançado

**Adiciona:**
- ✅ Interface gráfica (Electron + Angular)
- ✅ Multi-repo support
- ✅ Integração com IDEs
- ✅ Templates customizáveis
- ✅ Marketplace de templates

---

## 12. INSTALAÇÃO E USO

### Instalação

```bash
# 1. Instalar AI Dev Agent
pip install ai-dev-agent

# 2. Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:7b
ollama pull deepseek-r1:7b

# 3. Configurar
aidevagent config --setup
# Solicita:
# - GEMINI_API_KEY (https://aistudio.google.com/apikey)
# - GITHUB_TOKEN (https://github.com/settings/tokens)

# 4. Verificar
aidevagent config --check
```

### Uso - Criar App

```bash
# API REST Python
aidevagent create \
  --type api \
  --name my-api \
  --framework fastapi \
  --database postgres \
  --auth

# Web App Angular
aidevagent create \
  --type webapp \
  --name my-app \
  --framework angular \
  --auth

# Script Python
aidevagent create \
  --type script \
  --name my-tool
```

### Uso - Implementar Feature

```bash
# Via Issue
aidevagent implement --issue "github.com/user/repo/issues/123"

# Via texto
aidevagent implement \
  --text "adicionar endpoint GET /users/{id}" \
  --repo "github.com/user/my-api"
```

---

## 13. ESTRUTURA DO PROJETO

```
ai-dev-agent/
├── src/
│   ├── cli.py                 # CLI (create + implement)
│   ├── orchestrator.py        # Mode router
│   ├── agents/
│   │   ├── planner.py         # Planner Agent
│   │   ├── coder.py           # Coder Agent
│   │   └── tester.py          # Tester Agent
│   ├── services/
│   │   ├── scaffolder.py      # Scaffolder Service (NOVO)
│   │   ├── executor.py        # Executor Service
│   │   ├── repo_manager.py    # Repo Manager
│   │   └── llm_router.py      # LLM Router
│   ├── templates/             # Biblioteca de templates (NOVO)
│   │   ├── api-fastapi/
│   │   ├── api-express/
│   │   ├── webapp-angular/
│   │   └── script-python/
│   └── models/
│       └── data_models.py     # Pydantic models
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── pyproject.toml
├── README.md
└── LICENSE
```

---

## 14. PRÓXIMOS PASSOS

### Semana 0: Preparação
1. ✅ Validar spec com stakeholders
2. ✅ Obter API keys
3. ✅ Setup hardware (Ollama)
4. ✅ Criar repo no GitHub
5. ✅ Criar templates iniciais (FastAPI, Express, Angular)

### Semanas 1-2: Sprint 1 (Fundação + Templates)
### Semanas 3-4: Sprint 2 (Scaffolder + LLM)
### Semanas 5-6: Sprint 3 (Implement)
### Semanas 7-8: Sprint 4 (GitHub + Polish)

### Semana 9: Release MVP v1.0.0 🚀

---

## 15. CONCLUSÃO

### Resumo do MVP Completo

**Capacidades:**
1. ✅ **Criar aplicações do zero** (4 templates)
2. ✅ **Implementar features** em apps existentes
3. ✅ **Gerar testes** automaticamente
4. ✅ **Abrir PRs** no GitHub
5. ✅ **Custo zero** (Gemini + Ollama)

**Timeline:** 8 semanas

**Custo:** R$ 0,00/mês

**Stack:** Gemini + Ollama + Python + Jinja2

**Templates Iniciais:**
- API FastAPI (Python)
- API Express (TypeScript)
- Web App Angular
- Script Python CLI

**Casos de uso cobertos:**
- 100% criar apps simples do zero
- 85% implementar features em apps existentes

**Próximo passo:** Começar Sprint 1!

---

**Documento gerado em:** 22 de Janeiro de 2026  
**Versão:** 3.0 (MVP Completo - CREATE + IMPLEMENT)  
**Status:** Pronto para implementação  
**Estimativa de entrega:** 8 semanas  
**Custo total:** R$ 0,00/mês
