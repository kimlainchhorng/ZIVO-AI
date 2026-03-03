import os
from typing import List, Dict

import streamlit as st
from openai import OpenAI


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatMessage(Dict[str, str]):
    """Typed alias for chat messages."""



def _init_session_state() -> None:
    if "messages" not in st.session_state:
        st.session_state.messages = []



def _render_sidebar() -> None:
    st.sidebar.title("ZIVO-AI")
    st.sidebar.logo("🤖")
    if st.sidebar.button("Clear Chat"):
        st.session_state.messages = []
        st.experimental_rerun()



def _render_messages(messages: List[ChatMessage]) -> None:
    for msg in messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])



def _append_message(role: str, content: str) -> None:
    st.session_state.messages.append({"role": role, "content": content})



def _get_response(prompt: str) -> str:
    with st.status("AI Thinking...", expanded=False):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content or ""



def main() -> None:
    st.set_page_config(page_title="ZIVO-AI", page_icon="🤖")
    _init_session_state()
    _render_sidebar()

    st.title("ZIVO-AI Chat")
    _render_messages(st.session_state.messages)

    user_input = st.chat_input("Ask ZIVO-AI...")
    if user_input:
        _append_message("user", user_input)
        _render_messages([st.session_state.messages[-1]])

        reply = _get_response(user_input)
        _append_message("assistant", reply)
        _render_messages([st.session_state.messages[-1]])


if __name__ == "__main__":
    main()
