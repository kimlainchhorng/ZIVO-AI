import os
from typing import Dict, List, Optional

import streamlit as st

from engine.zivo_brain import ZivoBrain

ChatMessage = Dict[str, str]

def _init_session_state() -> None:
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "last_raw_response" not in st.session_state:
        st.session_state.last_raw_response = None
    if "brain" not in st.session_state:
        st.session_state.brain = ZivoBrain(api_key=os.getenv("OPENAI_API_KEY"))

def _debug_enabled() -> bool:
    params = st.query_params
    debug_value = params.get("debug", "false")
    if isinstance(debug_value, list):
        debug_value = debug_value[0] if debug_value else "false"
    return str(debug_value).lower() == "true"

def _render_sidebar() -> None:
    st.logo(":material/smart_toy:", icon_image=":material/bolt:")
    st.sidebar.title("ZIVO-AI")
    if st.sidebar.button("Clear Chat"):
        st.session_state.messages = []
        st.session_state.last_raw_response = None
        st.rerun()

def _render_messages(messages: List[ChatMessage]) -> None:
    for msg in messages:
        with st.chat_message(msg["role"):
            st.markdown(msg["content"])

def _append_message(role: str, content: str) -> None:
    st.session_state.messages.append({"role": role, "content": content})

def _get_response(messages: List[ChatMessage]) -> str:
    brain: ZivoBrain = st.session_state.brain
    with st.status("AI Thinking...", expanded=False):
        reply, raw_response = brain.generate_reply(messages)
    st.session_state.last_raw_response = raw_response
    return reply

def _render_debug_panel() -> None:
    if _debug_enabled() and st.session_state.last_raw_response:
        with st.expander("Debug: Raw OpenAI Response", expanded=False):
            st.json(st.session_state.last_raw_response)

def main() -> None:
    st.set_page_config(page_title="ZIVO-AI", page_icon=":material/smart_toy:")
    _init_session_state()
    _render_sidebar()

    st.title("ZIVO-AI Chat")
    _render_messages(st.session_state.messages)

    user_input = st.chat_input("Ask ZIVO-AI...")
    if user_input:
        _append_message("user", user_input)
        _render_messages([st.session_state.messages[-1]])

        reply = _get_response(st.session_state.messages)
        _append_message("assistant", reply)
        _render_messages([st.session_state.messages[-1]])

    _render_debug_panel()

if __name__ == "__main__":
    main()
