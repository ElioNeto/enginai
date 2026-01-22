"""
Coder Agent - Gera e modifica código.
"""
from pathlib import Path
from typing import List
from dataclasses import dataclass
from libs.prompt_templates import PromptTemplates
from libs.file_operations import FileOperations

@dataclass
class FileChange:
    path: str
    content: str
    operation: str  # create, update

class CoderAgent:
    """Agente de geração de código."""
    
    def __init__(self, model_router):
        self.router = model_router
        self.file_ops = FileOperations()
    
    async def implement_plan(self, plan: dict, repo_path: Path) -> List[FileChange]:
        """Implementa todas as subtarefas do plano."""
        changes = []
        
        for subtask in plan.get("subtasks", []):
            for file_path in subtask.get("files_to_modify", []):
                # Ler contexto do arquivo (se existir)
                full_path = repo_path / file_path
                file_context = ""
                if full_path.exists():
                    file_context = self.file_ops.read_file(full_path)
                
                # Gerar código
                prompt = PromptTemplates.generate_code(subtask, file_context)
                response = await self.router.complete(
                    prompt,
                    task_type="coding",
                    max_tokens=3000
                )
                
                code = self._extract_code(response.response)
                
                # Salvar mudança
                self.file_ops.write_file(full_path, code)
                
                changes.append(FileChange(
                    path=file_path,
                    content=code,
                    operation="update" if full_path.exists() else "create"
                ))
        
        return changes
    
    def _extract_code(self, text: str) -> str:
        """Extrai código de blocos markdown."""
        import re
        code_match = re.search(r'```(?:python|typescript|javascript)?\n(.*?)```', text, re.DOTALL)
        if code_match:
            return code_match.group(1).strip()
        return text.strip()
