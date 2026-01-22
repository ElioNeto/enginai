"""
CLI Principal do AI Dev Agent.
"""
import asyncio
import click
from rich.console import Console
from src.utils.config import config
from src.core.orchestrator import MainOrchestrator

console = Console()

@click.group()
def cli():
    """AI Dev Agent - Cria apps e implementa features automaticamente."""
    pass

@cli.command()
@click.option('--type', type=click.Choice(['api', 'webapp', 'script']), required=True)
@click.option('--name', required=True)
@click.option('--language', type=click.Choice(['python', 'typescript']))
@click.option('--framework', help='fastapi, express, angular, react')
@click.option('--database', type=click.Choice(['postgres', 'mysql', 'sqlite']))
@click.option('--auth', is_flag=True)
def create(type, name, language, framework, database, auth):
    """Cria novo projeto do zero."""
    orchestrator = MainOrchestrator(config)
    
    result = asyncio.run(orchestrator.create_project(
        project_type=type,
        name=name,
        language=language or "python",
        framework=framework,
        database=database,
        include_auth=auth
    ))
    
    if result.success:
        console.print(f"[green]✅ {result.message}[/green]")
        console.print(f"[cyan]📁 Projeto em: {result.path}[/cyan]")
    else:
        console.print(f"[red]❌ {result.message}[/red]")

@cli.command()
@click.option('--issue', help='URL da Issue')
@click.option('--text', help='Descrição em texto')
@click.option('--repo', required=True, help='URL do repositório')
def implement(issue, text, repo):
    """Implementa feature em projeto existente."""
    orchestrator = MainOrchestrator(config)
    
    result = asyncio.run(orchestrator.implement_feature(
        issue_url=issue,
        text=text,
        repo_url=repo
    ))
    
    if result.success:
        console.print(f"[green]✅ {result.message}[/green]")
        if result.pr_url:
            console.print(f"[cyan]🔗 PR: {result.pr_url}[/cyan]")
    else:
        console.print(f"[red]❌ {result.message}[/red]")

if __name__ == '__main__':
    cli()
