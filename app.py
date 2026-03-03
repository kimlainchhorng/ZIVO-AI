import os
from typing import Dict, List

import streamlit as st

from engine.zivo_brain import ZivoBrain

ChatMessage = Dict[str, str]

def _init_session_state() -> None:
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "brain" not in st.session_state:
        st.session_state.brain = ZivoBrain()

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
        st.rerun()

def _render_messages() -> None:
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

def _append_message(role: str, content: str) -> None:
    st.session_state.messages.append({"role": role, "content": content})

def main() -> None:
    st.set_page_config(page_title="ZIVO-AI", page_icon=":material/smart_toy:")
    _init_session_state()
    _render_sidebar()

    st.title("ZIVO-AI Chat")
    _render_messages()

    if prompt := st.chat_input("Ask ZIVO anything..."):
        _append_message("user", prompt)
        with st.chat_message("user"):
            st.markdown(prompt)

        brain: ZivoBrain = st.session_state.brain
        with st.chat_message("assistant"):
            response = st.write_stream(
                brain.get_streaming_response(st.session_state.messages)
            )

        _append_message("assistant", response)

if __name__ == "__main__":
    main()