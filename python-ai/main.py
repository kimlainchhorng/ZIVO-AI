import os
from typing import Optional

import openai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="ZIVO AI Python Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_client: openai.OpenAI | None = None


def get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        _client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


class GenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gpt-4o"
    temperature: Optional[float] = 0.7


class GenerateResponse(BaseModel):
    result: str
    model: str
    tokens_used: int


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")

    response = get_client().chat.completions.create(
        model=req.model,
        messages=[
            {"role": "system", "content": "You are ZIVO AI, an expert full-stack developer."},
            {"role": "user", "content": req.prompt}
        ],
        temperature=req.temperature,
    )

    return GenerateResponse(
        result=response.choices[0].message.content,
        model=req.model,
        tokens_used=response.usage.total_tokens
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "zivo-ai-python"}
