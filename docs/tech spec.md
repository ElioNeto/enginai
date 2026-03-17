# enginai - Especificação Técnica e Plano de Implementação

**Versão:** 1.0  
**Data:** 22 de Janeiro de 2026  
**Autor:** Especificação técnica gerada para enginai

---

## VISÃO DO PRODUTO

Construir uma aplicação que receba uma demanda (texto livre ou uma Issue), entenda e quebre em subtarefas, implemente mudanças de código com testes unitários, rode validações, faça commit/push e abra um PR. O sistema deve manter memória do projeto e aprender com falhas anteriores, explicando continuamente o que está fazendo e pedindo confirmação quando necessário.

**Público-alvo:** Desenvolvedores que trabalham com Python, Angular/TypeScript, automações e scripts de processamento (ex.: ffmpeg).

---

## 1. ARQUITETURA DO SISTEMA

### 1.1 Visão Geral da Arquitetura

O sistema adota uma **arquitetura hierárquica de agentes com loop de feedback e RAG compartilhado**, onde um orquestrador central coordena agentes especializados que colaboram em ciclos iterativos até atingir os critérios de aceite.

```
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                            │
│                  (Coordenador Central)                      │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼─────┐      ┌──────────┐
│Planner │      │  Coder   │      │ Reviewer │
│ Agent  │◄────►│  Agent   │◄────►│  Agent   │
└───┬────┘      └────┬─────┘      └──────┬───┘
    │                │                   │
    │         ┌──────▼──────┐            │
    │         │   Executor  │            │
    └────────►│   Service   │◄───────────┘
              └──────┬──────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼────┐    ┌─────▼─────┐    ┌────▼─────┐
│ Vector │    │   Repo    │    │ Project  │
│ Store  │    │  Manager  │    │  Memory  │
└────────┘    └───────────┘    └──────────┘
```

### 1.2 Camadas Arquiteturais

**Layer 1: Interface (UI Layer)**
- CLI: Rich-based terminal UI com progress bars, tabelas e prompts interativos
- GUI: Electron/Tauri com frontend Angular
- API REST local (opcional): para integração com IDEs

**Layer 2: Orchestration (Domain Layer)**
- MainOrchestrator: fluxo end-to-end (ingestion → planning → execution → PR)
- TaskCoordinator: gerencia filas de subtarefas e dependências
- FeedbackLoop: implementa ciclos de correção automática

**Layer 3: Agents (Domain Services)**
- PlannerAgent: decomposição de demanda em plano estruturado
- CoderAgent: geração de código e modificações
- ReviewerAgent: análise de qualidade e sugestões
- TestAgent: criação e execução de testes

**Layer 4: Services (Application Services)**
- IndexerService: chunking, embeddings, indexação vetorial
- ExecutorService: execução de comandos (lint/test/build)
- RepoManager: operações Git (clone, branch, commit, push, PR)
- MemoryService: persistência de contexto e aprendizado

**Layer 5: Adapters (Infrastructure)**
- GitProviders: GitHub, GitLab, Bitbucket
- LLMProviders: OpenAI, Anthropic, Ollama, etc.
- VectorStores: FAISS, ChromaDB, LanceDB
- EmbeddingProviders: OpenAI, HuggingFace, local

**Layer 6: Data (Persistence)**
- SQLite: metadados, memória, histórico
- File System: workspace, cache, índices
- Remote: Git repos, object storage (opcional)

---

## 2. MÓDULOS PRINCIPAIS

### 2.1 Orchestrator Module

**Responsabilidade:** Coordenar o fluxo completo end-to-end.

**Componentes:**
- `MainOrchestrator`: entry point, gerencia fases (ingest → plan → execute → finalize)
- `PhaseManager`: state machine para transições de fase
- `CheckpointManager`: salvar/restaurar estado entre fases
- `ConfirmationHandler`: solicitar aprovações do usuário

**Interface:**
```python
class MainOrchestrator:
    async def execute_task(
        self,
        input: TaskInput,  # texto ou Issue
        mode: ExecutionMode,  # plan_only | execute | auto
        checkpoint_file: Optional[Path] = None
    ) -> ExecutionResult
```

**Modelos de Dados:**
```python
@dataclass
class TaskInput:
    type: Literal["text", "issue"]
    content: str
    repository_url: Optional[str]
    issue_number: Optional[int]
    attachments: List[Attachment]

@dataclass
class ExecutionResult:
    status: Literal["completed", "partial", "failed"]
    plan: Plan
    changes: List[FileChange]
    tests_results: TestResults
    pr_url: Optional[str]
    checkpoints: List[Checkpoint]
```

---

### 2.2 Planner Module

**Responsabilidade:** Transformar demanda em plano executável com subtarefas.

**Componentes:**
- `DemandAnalyzer`: extrair requisitos e identificar ambiguidades
- `TaskDecomposer`: quebrar em subtarefas com dependências (DAG)
- `AcceptanceCriteriaGenerator`: definir validações por subtarefa
- `QuestionGenerator`: formular perguntas de esclarecimento

**Interface:**
```python
class PlannerAgent:
    async def create_plan(
        self,
        demand: str,
        repo_context: RepoContext,
        memory: ProjectMemory
    ) -> Plan

    async def generate_questions(
        self,
        demand: str,
        repo_context: RepoContext
    ) -> List[Question]
```

**Modelos de Dados:**
```python
@dataclass
class Plan:
    id: str
    title: str
    description: str
    subtasks: List[SubTask]
    dependencies: Dict[str, List[str]]  # DAG
    estimated_duration: timedelta

@dataclass
class SubTask:
    id: str
    title: str
    description: str
    files_to_modify: List[str]
    test_strategy: str
    acceptance_criteria: List[str]
    validation_commands: List[str]
    risks: List[str]
```

---

### 2.3 Indexer & Vector Store Module

**Responsabilidade:** Processar repo completo, criar embeddings e permitir busca semântica.

**Componentes:**
- `RepoScanner`: ler árvore, detectar linguagens/frameworks
- `Chunker`: dividir arquivos em chunks semânticos
- `EmbeddingGenerator`: gerar embeddings (batch)
- `VectorStoreManager`: CRUD no índice vetorial
- `SemanticRetriever`: buscar contexto relevante

**Interface:**
```python
class IndexerService:
    async def index_repository(
        self,
        repo_path: Path,
        force_reindex: bool = False
    ) -> IndexStats

    async def search_similar(
        self,
        query: str,
        k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[SearchResult]
```

**Estratégia de Chunking:**
- Tamanho base: 512 tokens (ajustável por linguagem)
- Overlap: 50 tokens
- Respeitar estrutura: classes/funções completas quando possível
- Filtros: ignorar `node_modules/`, `dist/`, `.venv/`, `build/`, `*.min.js`, etc.

**Metadados por chunk:**
```python
@dataclass
class ChunkMetadata:
    file_path: str
    chunk_index: int
    start_line: int
    end_line: int
    language: str
    file_type: str  # source | test | config
    symbols: List[str]  # funções/classes detectadas
    timestamp: datetime
```

**Vector Stores Suportados:**
- **FAISS** (padrão): local, rápido, zero custo
- **ChromaDB**: local, API simples, boa para desenvolvimento
- **LanceDB + S3**: produção, escalável
- **PostgreSQL + pgvector**: se já usa Postgres

---

### 2.4 Repo Manager Module

**Responsabilidade:** Operações Git e criação de PRs.

**Componentes:**
- `GitClient`: wrapper sobre GitPython/pygit2
- `BranchManager`: criar/deletar branches
- `CommitBuilder`: mensagens consistentes (Conventional Commits opcional)
- `PRCreator`: abrir PR via API do provedor
- `ConflictResolver`: detectar conflitos e orientar resolução

**Interface:**
```python
class RepoManager:
    async def setup_workspace(
        self,
        repo_url: str,
        base_branch: str
    ) -> Path

    async def create_feature_branch(
        self,
        branch_name: str
    ) -> str

    async def apply_changes(
        self,
        changes: List[FileChange]
    ) -> None

    async def commit_and_push(
        self,
        message: str,
        co_authors: Optional[List[str]] = None
    ) -> str  # commit SHA

    async def create_pull_request(
        self,
        title: str,
        body: str,
        base: str,
        draft: bool
    ) -> PullRequest
```

**Modelos de Dados:**
```python
@dataclass
class FileChange:
    operation: Literal["create", "update", "delete"]
    path: str
    content: Optional[str]
    original_sha: Optional[str]  # para updates

@dataclass
class PullRequest:
    number: int
    url: str
    title: str
    body: str
    draft: bool
```

---

### 2.5 Executor Module

**Responsabilidade:** Executar ferramentas externas (lint, test, typecheck) e capturar resultados.

**Componentes:**
- `CommandRunner`: executar comandos com timeout e capture
- `ToolDetector`: identificar ferramentas disponíveis no projeto
- `OutputParser`: interpretar stdout/stderr de ferramentas conhecidas
- `ErrorDiagnoser`: analisar erros e sugerir correções

**Interface:**
```python
class ExecutorService:
    async def detect_tools(
        self,
        repo_path: Path
    ) -> DetectedTools

    async def run_linter(
        self,
        files: Optional[List[str]] = None
    ) -> LintResult

    async def run_type_checker(
        self
    ) -> TypeCheckResult

    async def run_tests(
        self,
        pattern: Optional[str] = None,
        coverage: bool = False
    ) -> TestResult
```

**Ferramentas Detectadas Automaticamente:**

| Linguagem | Linter | Formatter | Typecheck | Test Runner |
|-----------|--------|-----------|-----------|-------------|
| Python | ruff/flake8/pylint | black/ruff | mypy/pyright | pytest/unittest |
| TypeScript | eslint | prettier | tsc | jest/vitest |
| JavaScript | eslint | prettier | - | jest/mocha |
| Go | golangci-lint | gofmt | go build | go test |
| Rust | clippy | rustfmt | cargo check | cargo test |

---

### 2.6 Coder Agent Module

**Responsabilidade:** Gerar/modificar código com base em subtarefas.

**Componentes:**
- `CodeGenerator`: criar novos arquivos
- `CodeModifier`: aplicar edições (usando AST quando possível)
- `DiffGenerator`: produzir diffs legíveis
- `ContextRetriever`: buscar exemplos similares no repo via vector store

**Interface:**
```python
class CoderAgent:
    async def implement_subtask(
        self,
        subtask: SubTask,
        repo_context: RepoContext,
        relevant_chunks: List[SearchResult]
    ) -> List[FileChange]

    async def fix_error(
        self,
        error: ExecutionError,
        current_code: str,
        context: str
    ) -> FileChange
```

**Fluxo de Geração:**
1. Recuperar contexto relevante (vector search)
2. Gerar mudanças com LLM
3. Validar sintaxe básica
4. Retornar FileChanges

---

### 2.7 Test Agent Module

**Responsabilidade:** Criar/atualizar testes unitários.

**Componentes:**
- `TestScaffolder`: criar estrutura de testes para novos arquivos
- `TestGenerator`: gerar casos de teste baseado no código
- `TestUpdater`: atualizar testes existentes
- `CoverageAnalyzer`: analisar cobertura e identificar lacunas

**Interface:**
```python
class TestAgent:
    async def generate_tests(
        self,
        code_changes: List[FileChange],
        test_framework: str
    ) -> List[FileChange]  # arquivos de teste

    async def analyze_coverage(
        self,
        coverage_file: Path
    ) -> CoverageReport
```

**Padrão Red/Green:**
- Sempre tentar rodar testes antes de mudar código (quando aplicável)
- Confirmar que novos testes falham antes da correção
- Validar que passam após a correção

---

### 2.8 Memory & Context Module

**Responsabilidade:** Manter histórico, aprendizado e contexto do projeto.

**Componentes:**
- `MemoryStore`: persistência em SQLite
- `DecisionLogger`: registrar decisões técnicas
- `ErrorTracker`: rastrear erros recorrentes
- `PatternLearner`: extrair padrões do repo (naming, estrutura, etc.)

**Interface:**
```python
class MemoryService:
    async def store_execution(
        self,
        execution: ExecutionResult
    ) -> None

    async def get_project_patterns(
        self,
        repo_url: str
    ) -> ProjectPatterns

    async def record_error_resolution(
        self,
        error: ExecutionError,
        resolution: str
    ) -> None

    async def query_similar_errors(
        self,
        error: ExecutionError
    ) -> List[ErrorResolution]
```

**Schema SQLite:**
```sql
-- Execuções
CREATE TABLE executions (
    id TEXT PRIMARY KEY,
    repo_url TEXT,
    branch TEXT,
    demand TEXT,
    status TEXT,
    created_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Decisões
CREATE TABLE decisions (
    id TEXT PRIMARY KEY,
    execution_id TEXT,
    subtask_id TEXT,
    decision TEXT,
    rationale TEXT,
    alternatives TEXT,
    FOREIGN KEY (execution_id) REFERENCES executions(id)
);

-- Erros e Resoluções
CREATE TABLE error_resolutions (
    id TEXT PRIMARY KEY,
    execution_id TEXT,
    error_type TEXT,
    error_message TEXT,
    file_path TEXT,
    resolution_strategy TEXT,
    success BOOLEAN,
    created_at TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES executions(id)
);

-- Padrões do Projeto
CREATE TABLE project_patterns (
    id TEXT PRIMARY KEY,
    repo_url TEXT,
    pattern_type TEXT,  -- naming | structure | testing | etc
    pattern_data JSON,
    confidence FLOAT,
    updated_at TIMESTAMP
);
```

---

### 2.9 Model Router Module

**Responsabilidade:** Rotear requisições para diferentes LLMs baseado na tarefa.

**Componentes:**
- `ModelRegistry`: registrar provedores e modelos disponíveis
- `TaskClassifier`: classificar tipo de tarefa
- `RoutingStrategy`: decidir qual modelo usar
- `FallbackHandler`: alternar provedor em caso de falha

**Interface:**
```python
class ModelRouter:
    async def complete(
        self,
        prompt: str,
        task_type: TaskType,
        max_tokens: int,
        temperature: float = 0.7
    ) -> CompletionResult

    def register_provider(
        self,
        provider: LLMProvider
    ) -> None
```

**Estratégia de Roteamento:**

| Tarefa | Modelo Ideal | Características |
|--------|--------------|-----------------|
| Planejamento | GPT-4 / Claude-3.5 | Raciocínio complexo |
| Geração de código | GPT-4 / Claude-3.5 / Codestral | Precisão, contexto longo |
| Correção de erros | GPT-4 / Claude-3.5 | Debugging, análise |
| Sumarização de logs | GPT-3.5 / Llama 3 70B | Custo-benefício |
| Geração de testes | GPT-4 / Claude-3.5 | Cobertura, edge cases |
| Code review | GPT-4 / Claude-3.5 | Análise crítica |

**Fallback:**
- Se provedor primário falhar → tentar secundário
- Manter contexto essencial (não reenviar histórico completo)
- Logar falhas para análise

---

## 3. INTERFACES EXTERNAS

### 3.1 Git Providers

**GitProvider Interface:**
```python
class GitProvider(ABC):
    @abstractmethod
    async def get_issue(self, repo: str, number: int) -> Issue

    @abstractmethod
    async def create_pull_request(
        self,
        repo: str,
        title: str,
        body: str,
        head: str,
        base: str,
        draft: bool
    ) -> PullRequest

    @abstractmethod
    async def link_pr_to_issue(
        self,
        repo: str,
        pr_number: int,
        issue_number: int
    ) -> None
```

**Implementações:**
- `GitHubProvider`: via PyGithub ou httpx direto
- `GitLabProvider`: via python-gitlab
- `BitbucketProvider`: via requests

---

### 3.2 LLM Providers

**LLMProvider Interface:**
```python
class LLMProvider(ABC):
    @abstractmethod
    async def complete(
        self,
        messages: List[Message],
        model: str,
        max_tokens: int,
        temperature: float,
        tools: Optional[List[Tool]] = None
    ) -> CompletionResponse
```

**Implementações:**
- `OpenAIProvider`: via openai SDK
- `AnthropicProvider`: via anthropic SDK
- `OllamaProvider`: via httpx
- `AzureOpenAIProvider`: via openai SDK com custom endpoint

---

### 3.3 Vector Stores

**VectorStore Interface:**
```python
class VectorStore(ABC):
    @abstractmethod
    async def add_documents(
        self,
        documents: List[Document],
        embeddings: List[List[float]],
        metadatas: List[Dict]
    ) -> List[str]  # IDs

    @abstractmethod
    async def search(
        self,
        query_embedding: List[float],
        k: int,
        filters: Optional[Dict] = None
    ) -> List[SearchResult]

    @abstractmethod
    async def delete(self, ids: List[str]) -> None
```

**Implementações:**
- `FAISSStore`: local, arquivo .index
- `ChromaStore`: ChromaDB client
- `LanceDBStore`: LanceDB + S3 opcional

---

## 4. CONFIGURAÇÃO E SEGURANÇA

### 4.1 Arquivo .env (Template)

```bash
# Ambiente
APP_ENV=dev
LOG_LEVEL=INFO
WORKDIR=~/.enginai/workspace

# Git
GIT_PROVIDER=github
GITHUB_TOKEN=ghp_xxxxx
GITHUB_BASE_URL=https://api.github.com
DEFAULT_BASE_BRANCH=main
CREATE_DRAFT_PR=true

# Embeddings
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BATCH_SIZE=100

# Vector Store
VECTOR_STORE=faiss
VECTOR_DB_PATH=~/.enginai/vectordb
MAX_FILES_INDEX=10000
IGNORE_GLOBS=node_modules/**,dist/**,.venv/**,build/**,*.min.js

# LLM Routing
LLM_PROVIDER_PRIMARY=openai
LLM_PROVIDER_SECONDARY=ollama
LLM_MODEL_PLANNER=gpt-4-turbo
LLM_MODEL_CODER=gpt-4-turbo
LLM_MODEL_REVIEWER=gpt-4-turbo
LLM_MODEL_SUMMARIZER=gpt-3.5-turbo
OPENAI_API_KEY=sk-xxxxx

# Ollama (local fallback)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=codellama:34b

# Executor
TEST_COMMAND_OVERRIDE=
LINT_COMMAND_OVERRIDE=
MAX_EXECUTION_TIME=300

# Memória
MEMORY_DB_PATH=~/.enginai/memory.db
ENABLE_LEARNING=true
```

### 4.2 Segurança

**Redação de Segredos:**
- Regex para detectar: `(token|key|password|secret)[=:]\s*[^\s]+`
- Substituir por `***REDACTED***` em logs e PRs
- Nunca persistir env vars em banco

**Confirmações Obrigatórias:**
- Deletar arquivos
- Force push
- Alterar mais de 50 arquivos
- Executar comandos com sudo/admin

**Sandboxing:**
- Executar comandos em subprocessos isolados
- Timeout padrão: 5 minutos
- Limitar uso de memória (via cgroups em Linux, opcional)

---

## 5. FLUXO DE DADOS

### 5.1 Fluxo Completo (End-to-End)

```
┌──────────────┐
│ 1. INGESTION │
└──────┬───────┘
       │
       ▼
┌──────────────┐         ┌─────────────┐
│ 2. QUESTIONS │────────►│ User Input  │
└──────┬───────┘         └─────────────┘
       │
       ▼
┌──────────────┐         ┌──────────────┐
│ 3. PLANNING  │◄───────►│ Vector Store │
└──────┬───────┘         └──────────────┘
       │
       ▼
┌──────────────┐
│ 4. INDEXING  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. IMPLEMENT │◄──┐
└──────┬───────┘   │
       │           │
       ▼           │
┌──────────────┐   │
│ 6. TEST      │   │
└──────┬───────┘   │
       │           │
       ▼           │
┌──────────────┐   │
│ 7. VALIDATE  │   │
└──────┬───────┘   │
       │           │
       ▼           │
   ┌──────┐        │
   │ PASS?│────NO──┘
   └──┬───┘
      │ YES
      ▼
┌──────────────┐
│ 8. FINALIZE  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 9. COMMIT/PR │
└──────────────┘
```

### 5.2 Loop de Correção Automática

```
┌─────────────┐
│ Run Tests   │
└──────┬──────┘
       │
       ▼
   ┌───────┐
   │ Pass? │───YES──► Continue
   └───┬───┘
       │ NO
       ▼
┌──────────────┐
│ Parse Errors │
└──────┬───────┘
       │
       ▼
┌──────────────┐        ┌────────────┐
│ Search       │───────►│ Memory DB  │
│ Similar      │        │ (Erros     │
│ Errors       │        │ anteriores)│
└──────┬───────┘        └────────────┘
       │
       ▼
┌──────────────┐        ┌────────────┐
│ Generate Fix │───────►│ LLM (Coder)│
└──────┬───────┘        └────────────┘
       │
       ▼
┌──────────────┐
│ Apply Fix    │
└──────┬───────┘
       │
       ▼
   ┌────────────┐
   │ Iterations │
   │ < Max (3)? │──NO──► Ask User
   └──┬─────────┘
      │ YES
      ▼
   (Loop back to Run Tests)
```

---

## 6. MODELOS DE DADOS PRINCIPAIS

### 6.1 Core Domain Models

```python
@dataclass
class RepoContext:
    """Contexto completo do repositório"""
    url: str
    local_path: Path
    base_branch: str
    languages: List[str]
    frameworks: List[str]
    test_framework: Optional[str]
    lint_tools: List[str]
    dependencies: Dict[str, List[str]]  # package manager → packages
    folder_structure: Dict[str, Any]
    patterns: ProjectPatterns

@dataclass
class ProjectPatterns:
    """Padrões detectados no projeto"""
    naming_convention: str  # snake_case | camelCase | PascalCase
    test_file_pattern: str  # test_*.py | *.test.ts
    folder_structure_type: str  # flat | nested | feature-based
    import_style: str
    code_style: Dict[str, Any]

@dataclass
class Checkpoint:
    """Estado salvo para recuperação"""
    phase: str
    timestamp: datetime
    data: Dict[str, Any]
    success: bool

@dataclass
class ExecutionError:
    """Erro capturado durante execução"""
    type: str  # lint | typecheck | test | build
    message: str
    file: Optional[str]
    line: Optional[int]
    stack_trace: Optional[str]
    severity: Literal["error", "warning"]
```

---

## 7. PLANO DE IMPLEMENTAÇÃO

### MVP (Minimum Viable Product) - 4-6 semanas

**Objetivo:** Sistema funcional para demandas simples, sem GUI, validação básica.

#### Sprint 1-2: Fundação
- [ ] Setup do projeto: estrutura de pastas, poetry/pip, pre-commit hooks
- [ ] Config manager: carregar .env, validar variáveis obrigatórias
- [ ] CLI básico: entrada de texto, exibir progresso (Rich library)
- [ ] Repo Manager: clone, create branch, commit, push (sem PR ainda)
- [ ] Executor Service: rodar comandos, capturar output

#### Sprint 3-4: Agentes Core
- [ ] Planner Agent: receber demanda → gerar plano simples (sem DAG complexo)
- [ ] Coder Agent: implementar subtask → FileChanges
- [ ] Model Router: OpenAI + fallback para Ollama
- [ ] Loop básico: plan → implement → test (1 iteração, sem correção automática)

#### Sprint 5-6: Integração e Testes
- [ ] Integrar GitHub Provider: ler Issue, criar PR
- [ ] Test Agent: gerar testes básicos (pytest)
- [ ] Validação: rodar pytest e capturar resultado
- [ ] End-to-end: demanda simples → PR funcional
- [ ] Testes unitários do próprio sistema (coverage > 60%)

**Entregável MVP:**
- CLI que aceita texto ou Issue
- Gera plano, pede confirmação
- Implementa mudanças simples
- Cria testes básicos
- Abre PR no GitHub

---

### V1 (Production-Ready) - 8-12 semanas

**Objetivo:** Sistema robusto com correção automática, vector store, memória.

#### Sprint 7-8: Vector Store e RAG
- [ ] Indexer Service: scan repo, chunking, embeddings
- [ ] FAISS integration: criar/salvar/carregar índice
- [ ] Semantic search: buscar contexto antes de gerar código
- [ ] Incremental indexing: reindexar apenas arquivos alterados

#### Sprint 9-10: Correção Automática
- [ ] Feedback Loop: implementar ciclo de correção (max 3 tentativas)
- [ ] Error Diagnoser: parsers para pytest, eslint, mypy, etc.
- [ ] Memory Service: SQLite schema, store/query executions
- [ ] Pattern Learner: detectar padrões do repo automaticamente

#### Sprint 11-12: Robustez e Qualidade
- [ ] Checkpoint system: salvar estado, permitir resume
- [ ] Confirmações: ações destrutivas, mudanças grandes
- [ ] Redação de segredos: detectar e mascarar
- [ ] Reviewer Agent: análise de qualidade pré-PR
- [ ] Logs estruturados: JSON output opcional
- [ ] Cobertura de testes > 80%

**Entregável V1:**
- Correção automática de erros (até 3 tentativas)
- RAG com vector store para contexto rico
- Memória persistente entre execuções
- Segurança e confirmações
- Pronto para uso em produção (projetos reais)

---

### V2 (Advanced Features) - 12-16 semanas

**Objetivo:** GUI, multi-linguagem, integrações avançadas.

#### Sprint 13-14: Interface Gráfica
- [ ] Electron/Tauri setup
- [ ] Frontend Angular: componentes principais
  - Dashboard: status, progresso
  - Plan Viewer: árvore de subtasks
  - Diff Viewer: syntax-highlighted diffs
  - Test Results: tabela de testes
- [ ] WebSocket: comunicação real-time CLI ↔ GUI
- [ ] State sync: mesma execução visível em CLI e GUI

#### Sprint 15-16: Expansão
- [ ] Suporte a mais linguagens: Go, Rust, Java
- [ ] GitLab e Bitbucket providers
- [ ] ChromaDB / LanceDB como alternativas ao FAISS
- [ ] Integração com IDEs: VSCode extension (opcional)
- [ ] CI/CD integration: rodar como GitHub Action
- [ ] Telemetria: métricas de uso (opcional, opt-in)

**Entregável V2:**
- GUI completa e amigável
- Suporte a múltiplas linguagens e Git providers
- Extensibilidade via plugins
- Integração com ferramentas de desenvolvimento

---

## 8. DECISÕES PENDENTES (PERGUNTAS)

### Questões Críticas (Bloqueantes)

#### 1. Modelo de Negócio e Licenciamento
**Pergunta:** O software será open-source (MIT/Apache) ou proprietário? Haverá versão paga/enterprise?  
**Impacto:** Decisão sobre dependências, telemetria, cloud services.  
**Recomendação:** Open-source (Apache 2.0) com modelo "open-core" (features enterprise pagas opcionais: cloud sync, analytics, team features).

#### 2. Provedor de Embeddings Padrão
**Pergunta:** Qual provedor de embeddings usar por padrão? OpenAI (pago, alta qualidade) ou local (gratuito, menor qualidade)?  
**Opções:**
- OpenAI `text-embedding-3-small` (custo: ~$0.02/1M tokens, rápido, preciso)
- HuggingFace local (`sentence-transformers/all-MiniLM-L6-v2`, gratuito, ~400MB RAM)
- Ollama local (`nomic-embed-text`, gratuito, requer Ollama)  
**Recomendação:** OpenAI por padrão (melhor experiência), com fallback para HuggingFace local se API key não estiver configurada.

#### 3. Limite de Tamanho de Repositório
**Pergunta:** Qual o limite para indexação? Repositórios com 100k+ arquivos devem ser suportados?  
**Impacto:** Performance, memória, custo de embeddings.  
**Recomendação:** 
- Padrão: até 10k arquivos (configurável via `MAX_FILES_INDEX`)
- Para repos maiores: permitir indexação seletiva (ex.: apenas `src/`, `lib/`)
- Warning se ultrapassar limite

#### 4. Estratégia de Versionamento de Memória
**Pergunta:** Memória é global por repo ou por branch? Aprendizado de um branch contamina outro?  
**Opções:**
- Global por repo: mais simples, mas pode misturar contextos
- Por branch: isolado, mas duplica dados
- Híbrido: memória base + override por branch  
**Recomendação:** Híbrido - memória base do repo + contexto específico por branch.

---

### Questões Importantes (Médio Impacto)

#### 5. Formato de Mensagens de Commit
**Pergunta:** Forçar Conventional Commits ou permitir formato livre?  
**Recomendação:** Detectar se o repo já usa Conventional Commits (via histórico) e adaptar. Se não detectar, usar formato descritivo livre.

#### 6. Execução de Testes de Integração
**Pergunta:** Rodar testes de integração automaticamente ou apenas unitários?  
**Impacto:** Tempo de execução, dependências externas (DB, APIs).  
**Recomendação:** MVP - apenas unitários. V1 - permitir opcionalmente com flag `--run-integration`.

#### 7. Tratamento de Secrets no Código
**Pergunta:** Se o agente detectar hardcoded secrets no código existente, deve alertar? Corrigir automaticamente?  
**Recomendação:** Alertar sempre, mas não corrigir automaticamente (risco de quebrar funcionamento). Sugerir migração para .env.

#### 8. Multi-Repo Support
**Pergunta:** Suportar mudanças em múltiplos repositórios numa mesma demanda? (ex.: API + Frontend)  
**Recomendação:** Não no MVP. V2 - suportar com orquestração entre repos.

---

### Questões de Experiência do Usuário

#### 9. Nível de Verbosidade Padrão
**Pergunta:** CLI deve ser verboso por padrão ou silencioso (apenas progresso)?  
**Recomendação:** Moderado - mostrar fases principais + progress bars. Modo `--verbose` para debug.

#### 10. Cancelamento de Execução
**Pergunta:** Permitir Ctrl+C a qualquer momento? Como tratar estado parcial?  
**Recomendação:** 
- Ctrl+C → salvar checkpoint automaticamente
- Próxima execução → perguntar "Retomar execução anterior?"
- Opção `--clean` para ignorar checkpoints

#### 11. Atualização Automática do Agente
**Pergunta:** O CLI deve verificar atualizações automaticamente? Auto-update?  
**Recomendação:** Verificar ao iniciar (não-bloqueante), exibir notificação. Não fazer auto-update (usuário decide via `pip install --upgrade enginai`).

---

### Questões Técnicas de Implementação

#### 12. AST vs String Manipulation
**Pergunta:** Para modificar código, usar AST parsing (mais preciso, complexo) ou regex/LLM direto (mais simples, risco de quebrar)?  
**Recomendação:** Híbrido:
- Python/TypeScript: tentar AST primeiro (via `ast`/`babel`), fallback para LLM
- Outras linguagens: LLM direto com validação sintática posterior

#### 13. Rate Limiting de APIs LLM
**Pergunta:** Como lidar com rate limits (ex.: OpenAI 500 req/min)?  
**Recomendação:** 
- Implementar retry com exponential backoff
- Batch requests quando possível
- Mostrar progresso transparente ("Aguardando rate limit...")

#### 14. Isolamento de Ambiente Python/Node
**Pergunta:** Criar virtualenv/node_modules automaticamente ou assumir que já existe?  
**Recomendação:** Detectar e usar existente. Se não houver, alertar usuário e orientar criação (não criar automaticamente - pode conflitar com workflow).

---

## 9. REQUISITOS FUNCIONAIS DETALHADOS

### 9.1 Entrada de Demanda e Entendimento
- Aceitar solicitações em texto (ex.: "crie uma API REST para cadastro de usuários")
- Ler Issues de provedor Git (prioridade: GitHub)
- Se houver ambiguidade, fazer perguntas objetivas antes de começar
- Suportar anexos contextuais: trechos de logs, stack traces, links, e arquivos locais

### 9.2 Planejamento de Tarefas (Planner)
- Transformar demanda em plano com subtarefas claras, critérios de aceite e dependências
- Para cada subtarefa: arquivos prováveis, estratégia de testes, riscos, validações
- Plano revisável: sempre apresentar e pedir "confirmar / ajustar"

### 9.3 Operações de Repositório (Repo Manager)
- Clonar repositório (HTTPS/SSH), checar branch base, criar branch de trabalho
- Criar/editar/apagar arquivos de código, configs e testes
- Commit com mensagens consistentes (Conventional Commits opcional)
- Push para remoto e abertura de Pull Request
- Vincular PR à Issue e incluir descrição com resumo, testes e impactos

### 9.4 Processamento e Busca Semântica (Indexer + Vector Store)
- Processar projeto completo: árvore de arquivos, detectar linguagens/frameworks/padrões
- Criar embeddings e índice vetorial local (FAISS padrão)
- Chunking com tamanho/sobreposição configuráveis, ignorar vendor/artefatos
- Persistir índice e permitir reindex incremental

### 9.5 Execução de Código (Executor)
- Gerar mudanças em ciclos: implementar → testar → validar → corrigir
- Usar ferramentas do projeto: test runner, linter, formatter, typecheck
- Capturar saída, interpretar erros, sugerir e aplicar correções
- Modo seguro (read-only) e modo aplicar mudanças

### 9.6 Testes Unitários Obrigatórios
- Criar/atualizar testes adequados para toda atividade
- Garantir padrão red/green quando possível
- Relatar cobertura e lacunas

### 9.7 Validação e Correção Automática
- Pipeline local: lint → typecheck → unit tests
- Ao falhar: diagnóstico com causa, arquivo/linha, hipótese e plano
- Repetir loop até aceite ou solicitar intervenção

### 9.8 Memória e Contexto (Project Memory)
- Histórico: decisões, erros recorrentes, comandos, padrões
- Aprender com falhas: post-mortem e heurísticas
- Persistência local (SQLite/JSONL) com escopo por repo/branch/issue

### 9.9 Interface (CLI + GUI)
- CLI: progresso, logs estruturados, modo verboso, confirmações
- GUI: plano, diffs, resultados, botões de controle
- Ambos: explicar ações em linguagem simples, indicar status

### 9.10 Multi-Modelo (Model Router)
- Suportar múltiplos modelos (nuvem via API, local via Ollama)
- Roteamento por tarefa: modelo rápido/forte/barato conforme necessidade
- Fallback: alternar provedor mantendo contexto

---

## 10. REQUISITOS NÃO FUNCIONAIS

### 10.1 Segurança
- Nunca expor segredos em logs, PRs ou prompts
- Redigir automaticamente tokens/keys ao capturar logs
- Confirmar ações destrutivas e operações Git críticas

### 10.2 Confiabilidade
- Operações idempotentes quando possível
- Checkpoints: salvar estado entre etapas

### 10.3 Performance
- Indexação incremental e cache de embeddings
- Suporte a repositórios grandes (limites configuráveis)

### 10.4 Portabilidade
- Rodar em Windows/Linux/macOS
- Instalação simples (CLI) e GUI opcional

### 10.5 Observabilidade
- Logs estruturados (JSON opcional), níveis (INFO/WARN/ERROR)
- Relatório final por execução

### 10.6 Extensibilidade
- Arquitetura modular: Provedor Git, Vector Store, Embeddings, Test Runners, Model Providers

---

## 11. STACK TECNOLÓGICO RECOMENDADO

### Core
- **Linguagem:** Python 3.11+
- **Gerenciador de Dependências:** Poetry
- **Validação de Dados:** Pydantic v2
- **Async Runtime:** asyncio + aiohttp

### CLI
- **Interface:** Rich (progress bars, tables, prompts)
- **Args Parsing:** Click ou Typer

### Git
- **Biblioteca:** GitPython ou pygit2

### Vector Store
- **Padrão:** FAISS (local)
- **Alternativas:** ChromaDB, LanceDB

### LLM Providers
- **OpenAI:** openai SDK
- **Anthropic:** anthropic SDK
- **Ollama:** httpx (HTTP direto)

### Persistence
- **Memória:** SQLite
- **ORM:** SQLAlchemy (opcional) ou SQL direto

### GUI (V2)
- **Runtime:** Electron ou Tauri
- **Frontend:** Angular + TypeScript
- **Comunicação:** WebSocket (Socket.IO ou nativo)

### Testing
- **Framework:** pytest
- **Coverage:** pytest-cov
- **Mocking:** pytest-mock

---

## 12. PRÓXIMOS PASSOS

1. **Validar decisões críticas** (questões 1-4) com stakeholders
2. **Criar protótipo arquitetural** (spike de 1 semana):
   - Orchestrator básico
   - Integração OpenAI
   - FAISS indexing simples
   - Git clone + commit
3. **Setup do projeto:**
   - Criar repositório
   - Estrutura de pastas
   - Poetry init
   - Pre-commit hooks (black, ruff, mypy)
4. **Iniciar Sprint 1** do MVP

---

## 13. CRITÉRIOS DE ACEITE DO PRODUTO

### Para MVP
- [ ] Dado Issue real, o agente clona repo, indexa, propõe plano
- [ ] Usuário pode confirmar/ajustar plano
- [ ] Agente implementa, cria testes, roda validações
- [ ] Agente commita, faz push e abre PR
- [ ] PR contém: descrição, resumo de mudanças, testes executados

### Para V1
- [ ] Em caso de falha de testes, agente itera e corrige (até 3x)
- [ ] Memória persistente: execuções anteriores informam decisões
- [ ] RAG funcional: contexto relevante recuperado antes de gerar código
- [ ] Segurança: confirmações para ações destrutivas, secrets mascarados
- [ ] Logs estruturados e checkpoints funcionais

### Para V2
- [ ] GUI e CLI mantêm mesmo estado
- [ ] Suporte a 5+ linguagens (Python, TS, JS, Go, Rust)
- [ ] 3+ Git providers (GitHub, GitLab, Bitbucket)
- [ ] Extensível via plugins
- [ ] Documentação completa + exemplos

---

**Documento gerado em:** 22 de Janeiro de 2026  
**Status:** Draft - Aguardando validação de decisões críticas  
**Próxima revisão:** Após Sprint 1
