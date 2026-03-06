import os
import uuid
from typing import AsyncIterator, Optional, Union

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware

load_dotenv()

MAX_PROMPT_LENGTH = 32_000

AVAILABLE_MODELS = [
    {"id": "gpt-4o",        "label": "GPT-4o",        "context": 128_000, "streaming": True},
    {"id": "gpt-4o-mini",   "label": "GPT-4o Mini",   "context": 128_000, "streaming": True},
    {"id": "gpt-4-turbo",   "label": "GPT-4 Turbo",   "context": 128_000, "streaming": True},
    {"id": "gpt-3.5-turbo", "label": "GPT-3.5 Turbo", "context": 16_385,  "streaming": True},
]

app = FastAPI(title="ZIVO AI Python Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://zivo-ai-indol.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


app.add_middleware(RequestIDMiddleware)


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


@app.get("/models")
async def list_models() -> dict:
    """Return available model IDs and their capabilities."""
    return {"models": AVAILABLE_MODELS}


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: Optional[str] = Field(default="gpt-4o")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    system_prompt: Optional[str] = Field(default=None)
    stream: Optional[bool] = False


class ChatResponse(BaseModel):
    message: ChatMessage
    model: str
    tokens_used: int


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> Union[ChatResponse, StreamingResponse]:
    """Multi-turn chat endpoint. Preserves full conversation history."""
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")

    messages: list[dict] = []
    if req.system_prompt:
        messages.append({"role": "system", "content": req.system_prompt})
    else:
        messages.append({"role": "system", "content": "You are ZIVO AI, an expert full-stack developer."})
    messages.extend([m.model_dump() for m in req.messages])

    if req.stream:
        async def _stream() -> AsyncIterator[str]:
            client = _get_client()
            response = await client.chat.completions.create(
                model=req.model,
                messages=messages,
                temperature=req.temperature,
                stream=True,
            )
            async for chunk in response:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield f"data: {delta}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(_stream(), media_type="text/event-stream")

    client = _get_client()
    response = await client.chat.completions.create(
        model=req.model,
        messages=messages,
        temperature=req.temperature,
    )
    assistant_content = response.choices[0].message.content or ""
    return ChatResponse(
        message=ChatMessage(role="assistant", content=assistant_content),
        model=req.model,
        tokens_used=response.usage.total_tokens if response.usage else 0,
    )


class CountTokensRequest(BaseModel):
    text: str
    model: Optional[str] = Field(default="gpt-4o")


@app.post("/count-tokens")
async def count_tokens(req: CountTokensRequest) -> dict:
    """Approximate token count using tiktoken (if available) or character estimation."""
    try:
        import tiktoken
        enc = tiktoken.encoding_for_model(req.model)
        count = len(enc.encode(req.text))
        method = "tiktoken"
    except Exception:
        # Rough estimate: ~4 chars per token
        count = max(1, len(req.text) // 4)
        method = "estimate"
    return {"tokens": count, "method": method, "model": req.model}