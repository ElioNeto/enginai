"""
Model Router - Gerencia roteamento entre Gemini e Ollama com quota.
"""
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal
from libs.llm_client import LLMClient, LLMResponse

class ModelRouter:
    """Roteador inteligente com fallback Gemini → Ollama."""
    
    def __init__(self, config):
        self.config = config
        self.client = LLMClient(
            gemini_api_key=config.gemini_api_key,
            ollama_host=config.ollama_host
        )
        
        self.quota_file = Path.home() / ".aidevagent" / "quota.json"
        self.quota_file.parent.mkdir(parents=True, exist_ok=True)
        self.stats = self._load_stats()
    
    def _load_stats(self) -> dict:
        if self.quota_file.exists():
            return json.loads(self.quota_file.read_text())
        return {"gemini_requests": 0, "last_reset": datetime.now().isoformat()}
    
    def _save_stats(self):
        self.quota_file.write_text(json.dumps(self.stats, indent=2))
    
    def _should_reset(self) -> bool:
        last_reset = datetime.fromisoformat(self.stats["last_reset"])
        now = datetime.now()
        if (now - last_reset).days >= 1:
            self.stats["gemini_requests"] = 0
            self.stats["last_reset"] = now.isoformat()
            self._save_stats()
            return True
        return False
    
    async def complete(
        self,
        prompt: str,
        task_type: Literal["planning", "coding", "review", "testing"] = "coding",
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Roteia chamada para Gemini ou Ollama."""
        self._should_reset()
        
        # Tentar Gemini primeiro
        if self.stats["gemini_requests"] < self.config.gemini_daily_limit:
            try:
                model = getattr(self.config, f"gemini_model_{task_type.replace('ing', 'er')}", 
                              self.config.gemini_model_coder)
                result = await self.client.complete(
                    prompt, provider="gemini", model=model,
                    max_tokens=max_tokens, temperature=temperature
                )
                self.stats["gemini_requests"] += 1
                self._save_stats()
                return result
            except Exception as e:
                print(f"⚠️  Gemini falhou: {e}, usando Ollama...")
        
        # Fallback Ollama
        model = getattr(self.config, f"ollama_model_{task_type.replace('ing', 'er')}", 
                       self.config.ollama_model_coder)
        return await self.client.complete(
            prompt, provider="ollama", model=model,
            max_tokens=max_tokens, temperature=temperature
        )
