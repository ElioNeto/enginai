"""
Orchestrator - Coordena fluxo completo CREATE e IMPLEMENT.
"""
import asyncio
from pathlib import Path
from typing import Optional, Literal
from dataclasses import dataclass
from rich.console import Console
from src.core.model_router import ModelRouter
from src.agents.planner import PlannerAgent
from src.agents.coder import CoderAgent
from src.agents.tester import TesterAgent
from src.services.scaffolder import ScaffolderService
from src.adapters.repo_manager import RepoManager

console = Console()

@dataclass
class CreateResult:
    path: Path
    success: bool
    message: str

@dataclass
class ImplementResult:
    success: bool
    pr_url: Optional[str]
    message: str

class MainOrchestrator:
    """Orquestrador principal do AI Dev Agent."""
    
    def __init__(self, config):
        self.config = config
        self.router = ModelRouter(config)
        self.planner = PlannerAgent(self.router)
        self.coder = CoderAgent(self.router)
        self.tester = TesterAgent(self.router)
        self.scaffolder = ScaffolderService(self.router, config)
        self.repo_manager = RepoManager(config)
    
    async def create_project(
        self,
        project_type: str,
        name: str,
        language: str,
        framework: Optional[str] = None,
        database: Optional[str] = None,
        include_auth: bool = False
    ) -> CreateResult:
        """Cria novo projeto do zero."""
        try:
            with console.status("[cyan]Criando projeto...[/cyan]"):
                # 1. Gerar estrutura
                project_path = await self.scaffolder.generate_structure(
                    project_type=project_type,
                    name=name,
                    language=language,
                    framework=framework,
                    database=database,
                    include_auth=include_auth
                )
                
                # 2. Inicializar Git
                self.repo_manager.init_repo(project_path)
                
                # 3. Commit inicial
                self.repo_manager.commit(project_path, "chore: initial commit")
                
                console.print(f"[green]✅ Projeto criado: {project_path}[/green]")
                
                return CreateResult(
                    path=project_path,
                    success=True,
                    message=f"Projeto {name} criado com sucesso!"
                )
        
        except Exception as e:
            return CreateResult(
                path=Path(),
                success=False,
                message=f"Erro ao criar projeto: {str(e)}"
            )
    
    async def implement_feature(
        self,
        issue_url: Optional[str] = None,
        text: Optional[str] = None,
        repo_url: Optional[str] = None
    ) -> ImplementResult:
        """Implementa feature em projeto existente."""
        try:
            # 1. Clone repo
            with console.status("[cyan]Clonando repositório...[/cyan]"):
                repo_path = self.repo_manager.clone_repo(repo_url)
            
            # 2. Criar plano
            with console.status("[cyan]Criando plano...[/cyan]"):
                demand = text if text else f"Issue: {issue_url}"
                plan = await self.planner.create_plan(demand, str(repo_path))
                
                console.print("\n[bold cyan]📋 Plano de Implementação:[/bold cyan]")
                console.print(f"  Título: {plan.get('title', 'N/A')}")
                console.print(f"  Subtarefas: {len(plan.get('subtasks', []))}")
            
            # 3. Implementar
            with console.status("[cyan]Implementando código...[/cyan]"):
                changes = await self.coder.implement_plan(plan, repo_path)
                console.print(f"[green]✅ {len(changes)} arquivos modificados[/green]")
            
            # 4. Gerar testes
            with console.status("[cyan]Gerando testes...[/cyan]"):
                test_files = await self.tester.generate_tests(changes, repo_path)
                console.print(f"[green]✅ {len(test_files)} arquivos de teste criados[/green]")
            
            # 5. Commit e PR
            branch_name = f"feature/{plan.get('title', 'implementation').lower().replace(' ', '-')}"
            self.repo_manager.create_branch(repo_path, branch_name)
            self.repo_manager.commit(repo_path, f"feat: {plan.get('title', 'implementation')}")
            
            pr_url = self.repo_manager.create_pull_request(
                repo_url=repo_url,
                title=plan.get('title', 'Feature Implementation'),
                body=plan.get('description', ''),
                branch=branch_name
            )
            
            return ImplementResult(
                success=True,
                pr_url=pr_url,
                message="Feature implementada com sucesso!"
            )
        
        except Exception as e:
            return ImplementResult(
                success=False,
                pr_url=None,
                message=f"Erro: {str(e)}"
            )
