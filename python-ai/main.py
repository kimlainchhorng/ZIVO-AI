from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ZIVO AI Python Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_client() -> AsyncOpenAI:
    """Return a lazily-created async OpenAI client."""
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class GenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = Field(default="gpt-4o")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)


class GenerateResponse(BaseModel):
    result: str
    model: str
    tokens_used: int


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest) -> GenerateResponse:
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")

    client = _get_client()
    response = await client.chat.completions.create(
        model=req.model,
        messages=[
            {
                "role": "system",
                "content": "You are ZIVO AI, an expert full-stack developer.",
            },
            {"role": "user", "content": req.prompt},
        ],
        temperature=req.temperature,
    )

    return GenerateResponse(
        result=response.choices[0].message.content or "",
        model=req.model,
        tokens_used=response.usage.total_tokens if response.usage else 0,
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "2.0"}
