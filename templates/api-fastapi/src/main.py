from fastapi import FastAPI

app = FastAPI(title="{{ projectName }}")


@app.get("/health")
def health():
    return {"status": "healthy"}

{% if includeAuth %}

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()


@app.get("/protected")
def protected(token=Depends(security)):
    return {"message": "authenticated"}
{% endif %}
{% if database %}

# Database: {{ database }}
# Add your database connection and models here
{% endif %}
