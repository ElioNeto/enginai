"""
Planner Agent - Analisa demanda e cria plano estruturado.
"""
import json
from libs.prompt_templates import PromptTemplates

class PlannerAgent:
    """Agente de planejamento."""
    
    def __init__(self, model_router):
        self.router = model_router
    
    async def create_plan(self, demand: str, repo_context: str) -> dict:
        """Cria plano estruturado a partir da demanda."""
        prompt = PromptTemplates.plan_feature(demand, repo_context)
        
        response = await self.router.complete(
            prompt,
            task_type="planning",
            max_tokens=2048,
            temperature=0.7
        )
        
        # Extrair JSON da resposta
        plan_json = self._extract_json(response.response)
        return plan_json
    
    def _extract_json(self, text: str) -> dict:
        """Extrai JSON da resposta do LLM."""
        try:
            # Tentar parsear direto
            return json.loads(text)
        except:
            # Procurar por blocos JSON
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            # Fallback: plano padrão
            return {
                "title": "Implementação da feature",
                "description": demand,
                "subtasks": [
                    {
                        "id": "1",
                        "title": "Implementar feature",
                        "description": demand,
                        "files_to_modify": []
                    }
                ]
            }
