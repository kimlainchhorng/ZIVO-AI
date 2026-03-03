import os
from typing import Any, Dict, List
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

class ZivoBrain:
    def __init__(self, prompt_path: str = "prompts/system_v1.txt"):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        with open(prompt_path, "r") as f:
            self.system_prompt = f.read()

    async def get_response(self, messages: List[Dict[str, str]]) -> str:
        full_messages = [{"role": "system", "content": self.system_prompt}] + messages
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=full_messages
        )
        return response.choices[0].message.content
