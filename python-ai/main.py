import os
from typing import AsyncIterator, Optional, Union

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

load_dotenv()

MAX_PROMPT_LENGTH = 32_000

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
    stream: Optional[bool] = False


class GenerateResponse(BaseModel):
    result: str
    model: str
    tokens_used: int


async def _stream_tokens(req: GenerateRequest) -> AsyncIterator[str]:
    """Yield SSE-formatted token chunks from the OpenAI streaming API."""
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
        stream=True,
    )
    async for chunk in response:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield f"data: {delta}\n\n"
    yield "data: [DONE]\n\n"


def _validate_request(req: GenerateRequest) -> None:
    """Raise HTTPException for missing API key or oversized prompts."""
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="Missing OPENAI_API_KEY — set it in your .env file or environment.",
        )
    if len(req.prompt) > MAX_PROMPT_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} characters.",
        )


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest) -> Union[GenerateResponse, StreamingResponse]:
    _validate_request(req)

    if req.stream:
        return StreamingResponse(
            _stream_tokens(req),
            media_type="text/event-stream",
        )

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


@app.post("/generate/stream")
async def generate_stream(req: GenerateRequest) -> StreamingResponse:
    _validate_request(req)

    return StreamingResponse(
        _stream_tokens(req),
        media_type="text/event-stream",
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "2.0"}