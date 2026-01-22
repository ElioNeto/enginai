"""
Scaffolder Service - Cria estrutura de novos projetos.
"""
from pathlib import Path
from jinja2 import Template
from libs.prompt_templates import PromptTemplates
from libs.file_operations import FileOperations

class ScaffolderService:
    """Serviço de scaffolding de projetos."""
    
    def __init__(self, model_router, config):
        self.router = model_router
        self.config = config
        self.file_ops = FileOperations()
        self.templates_dir = Path(__file__).parent.parent / "templates"
    
    async def generate_structure(
        self,
        project_type: str,
        name: str,
        language: str,
        framework: str = None,
        database: str = None,
        include_auth: bool = False
    ) -> Path:
        """Gera estrutura completa do projeto."""
        # Template base
        template_name = self._select_template(project_type, language, framework)
        
        # Criar diretório
        project_path = Path.cwd() / name
        self.file_ops.create_directory(project_path)
        
        # Gerar README
        readme = await self._generate_readme({
            "name": name,
            "type": project_type,
            "language": language,
            "framework": framework,
            "database": database,
            "include_auth": include_auth
        })
        self.file_ops.write_file(project_path / "README.md", readme)
        
        # Estrutura básica dependendo do tipo
        if project_type == "api" and language == "python":
            await self._create_python_api(project_path, name, framework, database, include_auth)
        elif project_type == "webapp" and language == "typescript":
            await self._create_typescript_webapp(project_path, name, framework)
        
        return project_path
    
    def _select_template(self, project_type: str, language: str, framework: str) -> str:
        templates = {
            ("api", "python", "fastapi"): "api-fastapi",
            ("api", "typescript", "express"): "api-express",
            ("webapp", "typescript", "angular"): "webapp-angular",
        }
        return templates.get((project_type, language, framework), "api-fastapi")
    
    async def _generate_readme(self, config: dict) -> str:
        prompt = PromptTemplates.generate_readme(config)
        response = await self.router.complete(prompt, task_type="coding", max_tokens=2048)
        return response.response
    
    async def _create_python_api(self, path: Path, name: str, framework: str, database: str, auth: bool):
        """Cria estrutura de API Python."""
        # src/
        src = path / "src"
        self.file_ops.create_directory(src)
        
        # main.py
        main_content = f'''from fastapi import FastAPI

app = FastAPI(title="{name}")

@app.get("/")
def root():
    return {{"message": "{name} API is running"}}

@app.get("/health")
def health():
    return {{"status": "healthy"}}
'''
        self.file_ops.write_file(src / "main.py", main_content)
        
        # requirements.txt
        requirements = "fastapi>=0.109.0\nuvicorn[standard]>=0.27.0\n"
        if database:
            requirements += "sqlalchemy>=2.0.0\n"
        if auth:
            requirements += "python-jose[cryptography]>=3.3.0\npasslib[bcrypt]>=1.7.4\n"
        
        self.file_ops.write_file(path / "requirements.txt", requirements)
        
        # tests/
        self.file_ops.create_directory(path / "tests")
        
    async def _create_typescript_webapp(self, path: Path, name: str, framework: str):
        """Cria estrutura de webapp TypeScript."""
        # package.json
        package_json = f'''{{
  "name": "{name}",
  "version": "1.0.0",
  "scripts": {{
    "dev": "ng serve",
    "build": "ng build",
    "test": "ng test"
  }}
}}
'''
        self.file_ops.write_file(path / "package.json", package_json)
