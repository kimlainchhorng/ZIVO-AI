import os
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

class ZivoBrain:
    def __init__(self, prompt_path: str = "prompts/system_v1.txt"):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        with open(prompt_path, "r") as f:
            self.system_prompt = f.read()

    def get_streaming_response(self, messages: List[Dict[str, str]]):
        full_messages = [{"role": "system", "content": self.system_prompt}] + messages
        stream = self.client.chat.completions.create(
            model="gpt-4o",
            messages=full_messages,
            stream=True
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
