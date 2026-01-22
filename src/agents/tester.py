"""
Tester Agent - Gera testes unitários.
"""
from pathlib import Path
from typing import List
from libs.prompt_templates import PromptTemplates
from libs.file_operations import FileOperations

class TesterAgent:
    """Agente de geração de testes."""
    
    def __init__(self, model_router):
        self.router = model_router
        self.file_ops = FileOperations()
    
    async def generate_tests(self, changes: List, repo_path: Path) -> List[Path]:
        """Gera testes para as mudanças."""
        test_files = []
        
        for change in changes:
            # Detectar linguagem
            lang = self._detect_language(change.path)
            
            # Gerar testes
            prompt = PromptTemplates.generate_tests(change.content, lang)
            response = await self.router.complete(
                prompt,
                task_type="testing",
                max_tokens=2048
            )
            
            # Determinar caminho do teste
            test_path = self._get_test_path(repo_path, change.path)
            
            # Salvar teste
            test_code = self._extract_code(response.response)
            self.file_ops.write_file(test_path, test_code)
            
            test_files.append(test_path)
        
        return test_files
    
    def _detect_language(self, file_path: str) -> str:
        ext = Path(file_path).suffix
        return {".py": "python", ".ts": "typescript", ".js": "javascript"}.get(ext, "python")
    
    def _get_test_path(self, repo_path: Path, file_path: str) -> Path:
        """Determina caminho do arquivo de teste."""
        file = Path(file_path)
        if file.stem.startswith("test_"):
            return repo_path / file_path
        return repo_path / "tests" / f"test_{file.stem}{file.suffix}"
    
    def _extract_code(self, text: str) -> str:
        import re
        code_match = re.search(r'```(?:python|typescript|javascript)?\n(.*?)```', text, re.DOTALL)
        return code_match.group(1).strip() if code_match else text.strip()
