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
    if "last_run_result" not in st.session_state:
        st.session_state.last_run_result = None


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
        st.session_state.last_run_result = None
        st.rerun()


def _render_messages() -> None:
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])


def _append_message(role: str, content: str) -> None:
    st.session_state.messages.append({"role": role, "content": content})


def _render_debug_panel() -> None:
    if _debug_enabled() and st.session_state.last_run_result:
        result = st.session_state.last_run_result
        with st.expander("Debug: Agent Run Details", expanded=True):
            st.json({
                "final_output": result.final_output,
                "new_messages_count": len(result.new_messages),
                "messages": [
                    {"role": getattr(m, "role", "unknown"), "content": str(getattr(m, "content", ""))}
                    for m in result.new_messages
                ]
            })


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
            with st.status("ZIVO is thinking...", expanded=True) as status:
                result = brain.run(st.session_state.messages)

                for msg in result.new_messages:
                    role = getattr(msg, "role", "")
                    if role == "tool":
                        st.write(f"🔧 Tool called: `{{getattr(msg, 'name', 'unknown')}}`")
                    elif role == "assistant" and getattr(msg, "tool_calls", None):
                        for tc in msg.tool_calls:
                            st.write(f"⚡ Invoking: `{{tc.function.name}}({{tc.function.arguments}})`")

                status.update(label="Done!", state="complete", expanded=False)

            response = result.final_output
            st.markdown(response)

        _append_message("assistant", response)
        st.session_state.last_run_result = result

    _render_debug_panel()


if __name__ == "__main__":
    main()