from typing import Dict, List

import streamlit as st

from engine.zivo_brain import ZivoBrain

ChatMessage = Dict[str, str]


# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

def _init_session_state() -> None:
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "brain" not in st.session_state:
        st.session_state.brain = ZivoBrain()
    if "last_run_result" not in st.session_state:
        st.session_state.last_run_result = None
    if "trace" not in st.session_state:
        st.session_state.trace = []


# ---------------------------------------------------------------------------
# Stable st.query_params (replaces legacy experimental calls)
# ---------------------------------------------------------------------------

def _debug_enabled() -> bool:
    return str(st.query_params.get("debug", "false")).lower() == "true"


def _trace_mode_enabled() -> bool:
    return str(st.query_params.get("trace", "false")).lower() == "true"


# ---------------------------------------------------------------------------
# Sidebar — Material Icons (Streamlit 1.54.0+)
# ---------------------------------------------------------------------------

def _render_sidebar() -> None:
    st.logo(":material/smart_toy:", icon_image=":material/bolt:")
    st.sidebar.title("ZIVO-AI")
    st.sidebar.caption("Powered by OpenAI Agents SDK")

    st.sidebar.divider()
    st.sidebar.markdown("**Debug Deep-Links**")
    base = st.sidebar.text_input("App base URL", value="http://localhost:8501", key="base_url")
    st.sidebar.markdown(
        f"[Enable Debug]({base}?debug=true) · "
        f"[Enable Trace]({base}?trace=true) · "
        f"[Both]({base}?debug=true&trace=true)"
    )

    st.sidebar.divider()
    if st.sidebar.button(":material/delete: Clear Chat"):
        st.session_state.messages = []
        st.session_state.last_run_result = None
        st.session_state.trace = []
        st.rerun()


# ---------------------------------------------------------------------------
# Message rendering
# ---------------------------------------------------------------------------

def _render_messages() -> None:
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])


def _append_message(role: str, content: str) -> None:
    st.session_state.messages.append({"role": role, "content": content})


# ---------------------------------------------------------------------------
# Agent loop with st.status tracing
# ---------------------------------------------------------------------------

def _run_agent_with_trace(prompt: str) -> str:
    """
    Execute the Agent Loop and surface real-time tool traces via st.status.
    st.status anchoring bug-fixes in Streamlit 1.54.0 prevent empty delta errors.
    """
    brain: ZivoBrain = st.session_state.brain
    trace_steps: list = []

    with st.status("ZIVO is thinking...", expanded=_trace_mode_enabled()) as status:
        result = brain.run(st.session_state.messages)

        for msg in result.new_messages:
            role = getattr(msg, "role", "")

            # Agent decided to invoke a tool
            if role == "assistant" and getattr(msg, "tool_calls", None):
                for tc in msg.tool_calls:
                    step = f"⚡ **Invoking:** `{{tc.function.name}}` with `{{tc.function.arguments}}`"
                    st.write(step)
                    trace_steps.append(step)

            # Connector returned a result
            elif role == "tool":
                tool_name = getattr(msg, "name", "unknown")
                step = f"🔧 **Tool result from** `{{tool_name}}`"
                st.write(step)
                trace_steps.append(step)

        status.update(label="✅ Done!", state="complete", expanded=False)

    st.session_state.trace = trace_steps
    st.session_state.last_run_result = result
    return result.final_output


# ---------------------------------------------------------------------------
# Debug panel — activated via ?debug=true query param
# ---------------------------------------------------------------------------

def _render_debug_panel() -> None:
    if not _debug_enabled() or not st.session_state.last_run_result:
        return

    result = st.session_state.last_run_result
    with st.expander(":material/bug_report: Debug: Agent Run Details", expanded=True):
        st.json({
            "final_output": result.final_output,
            "new_messages_count": len(result.new_messages),
            "trace_steps": st.session_state.trace,
            "messages": [
                {
                    "role": getattr(m, "role", "unknown"),
                    "content": str(getattr(m, "content", ""))
                }
                for m in result.new_messages
            ]
        })


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    st.set_page_config(
        page_title="ZIVO-AI",
        page_icon=":material/smart_toy:",
        layout="centered",
    )
    _init_session_state()
    _render_sidebar()

    st.title("ZIVO-AI Chat")

    if _trace_mode_enabled():
        st.caption(":material/visibility: Trace mode **ON** — tool steps shown expanded.")
    if _debug_enabled():
        st.caption(":material/bug_report: Debug mode **ON** — full run details shown below each response.")

    _render_messages()

    if prompt := st.chat_input("Ask ZIVO anything..."):
        _append_message("user", prompt)
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            response = _run_agent_with_trace(prompt)
            st.markdown(response)

        _append_message("assistant", response)

    _render_debug_panel()


if __name__ == "__main__":
    main()