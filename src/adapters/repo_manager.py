"""
Repo Manager - Gerencia operações Git e GitHub.
"""
from pathlib import Path
from typing import Optional
from libs.git_operations import GitOperations
import httpx

class RepoManager:
    """Gerenciador de repositórios Git."""
    
    def __init__(self, config):
        self.config = config
        self.git_ops = GitOperations()
    
    def clone_repo(self, repo_url: str, branch: Optional[str] = None) -> Path:
        """Clona repositório."""
        target = self.config.workdir / "repo"
        return self.git_ops.clone(repo_url, target, branch).working_dir
    
    def init_repo(self, path: Path):
        """Inicializa novo repositório."""
        self.git_ops.init(path)
    
    def create_branch(self, repo_path: Path, branch_name: str):
        """Cria nova branch."""
        import git
        repo = git.Repo(repo_path)
        self.git_ops.create_branch(repo, branch_name)
    
    def commit(self, repo_path: Path, message: str):
        """Faz commit."""
        import git
        repo = git.Repo(repo_path)
        self.git_ops.commit(repo, message)
    
    def create_pull_request(
        self,
        repo_url: str,
        title: str,
        body: str,
        branch: str
    ) -> Optional[str]:
        """Cria PR no GitHub."""
        # Extrair owner/repo da URL
        parts = repo_url.rstrip("/").split("/")
        owner, repo = parts[-2], parts[-1].replace(".git", "")
        
        # GitHub API
        headers = {
            "Authorization": f"token {self.config.github_token}",
            "Accept": "application/vnd.github+json"
        }
        
        data = {
            "title": title,
            "body": body,
            "head": branch,
            "base": self.config.default_base_branch,
            "draft": self.config.create_draft_pr
        }
        
        try:
            response = httpx.post(
                f"https://api.github.com/repos/{owner}/{repo}/pulls",
                headers=headers,
                json=data
            )
            if response.status_code == 201:
                return response.json()["html_url"]
        except Exception as e:
            print(f"Erro ao criar PR: {e}")
        
        return None
