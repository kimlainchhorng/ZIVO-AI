import streamlit as st
from engine.zivo_brain import ZivoBrain

# ──────────────────────────────────────────────
# Page config
# ──────────────────────────────────────────────
st.set_page_config(
    page_title="ZIVO-AI",
    page_icon=":material/smart_toy:",
    layout="centered",
)

# ──────────────────────────────────────────────
# 2026 Material Symbol branding  (Feature #2)
# st.logo: sidebar icon + collapsed icon
# ──────────────────────────────────────────────
st.logo(":material/bolt:", icon_image=":material/smart_toy:")

# ──────────────────────────────────────────────
# Deep-link / debug mode  (Feature #3)
# Visit ?debug=true to activate the debug panel
# ──────────────────────────────────────────────
debug_mode: bool = st.query_params.get("debug") == "true"

if debug_mode:
    st.sidebar.markdown("### :material/bug_report: Debug Mode")
    if "last_raw_response" in st.session_state:
        st.sidebar.json(st.session_state.last_raw_response)
    else:
        st.sidebar.info("No response captured yet.")

# ──────────────────────────────────────────────
# Session state bootstrap
# ──────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []

if "brain" not in st.session_state:
    st.session_state.brain = ZivoBrain()

# ──────────────────────────────────────────────
# Header
# ──────────────────────────────────────────────
st.title(":material/smart_toy: ZIVO-AI")
st.caption("Multi-Agent: Planner · Executor · Validator")

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _run_agent_with_trace(prompt: str) -> str:
    """Run the multi-agent pipeline; display real-time agent/tool trace inside st.status."""
    brain: ZivoBrain = st.session_state.brain
    trace_steps: list = []

    # Agent name → emoji mapping for visual clarity
    AGENT_ICONS = {
        "ZIVO-AI": "🧠",
        "ZIVO-Planner": "🗺️",
        "ZIVO-Executor": "⚡",
        "ZIVO-Validator": "✅",
    }

    with st.status("ZIVO is thinking...", expanded=debug_mode) as status:
        result = brain.run(st.session_state.messages)

        for msg in result.new_messages:
            role = getattr(msg, "role", "")
            agent_name = getattr(msg, "sender", getattr(msg, "agent_name", "ZIVO-AI"))
            icon = AGENT_ICONS.get(agent_name, "🤖")

            # Handoff message
            if hasattr(msg, "type") and getattr(msg, "type", "") == "handoff":
                target = getattr(msg, "target_agent", "next agent")
                step = f"🔀 **Handoff →** `{target}`"
                st.write(step)
                trace_steps.append(step)

            # Tool invocation
            elif role == "assistant" and getattr(msg, "tool_calls", None):
                for tc in msg.tool_calls:
                    step = f"{icon} **[{agent_name}] Calling:** `{tc.function.name}` — `{tc.function.arguments}`"
                    st.write(step)
                    trace_steps.append(step)

            # Tool result
            elif role == "tool":
                tool_name = getattr(msg, "name", "unknown")
                step = f"🔧 **Tool result from** `{tool_name}`"
                st.write(step)
                trace_steps.append(step)

        status.update(label="✅ Done!", state="complete", expanded=False)

    st.session_state.trace = trace_steps
    st.session_state.last_run_result = result
    return result.final_output


# ──────────────────────────────────────────────
# Render existing chat history
# ──────────────────────────────────────────────
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# ──────────────────────────────────────────────
# Chat input
# ──────────────────────────────────────────────
if prompt := st.chat_input("Ask ZIVO anything…"):
    # Append user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        final_answer: str = _run_agent_with_trace(prompt)
        st.markdown(final_answer)

        # Capture raw response for the debug panel (Feature #3)
        if debug_mode:
            try:
                result = st.session_state.last_run_result
                st.session_state.last_raw_response = {
                    "final_output": str(result.final_output),
                    "new_messages_count": (
                        len(result.new_messages)
                        if hasattr(result, "new_messages")
                        else 0
                    ),
                }
            except Exception:
                pass

    # Persist assistant message
    st.session_state.messages.append(
        {"role": "assistant", "content": final_answer}
    )
