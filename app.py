import streamlit as st
from engine.mcp_client import MCPClientManager
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
# Swarm Mode toggle
# ──────────────────────────────────────────────
use_swarm: bool = st.sidebar.toggle(
    "🕸️ Swarm Mode", value=False, key="use_swarm_toggle"
)

# Re-initialize brain when swarm mode changes
if "brain" not in st.session_state or st.session_state.get("_swarm_mode") != use_swarm:
    st.session_state.brain = ZivoBrain(use_swarm=use_swarm)
    st.session_state["_swarm_mode"] = use_swarm

# ──────────────────────────────────────────────
# MCP Servers status panel
# ──────────────────────────────────────────────
_mcp = MCPClientManager()
with st.sidebar.expander("🔌 MCP Servers"):
    _all_servers: list = _mcp.list_config()
    if _all_servers:
        for _srv in _all_servers:
            _status = "✅ enabled" if _srv.get("enabled") else "⚫ disabled"
            st.write(f"**{_srv['name']}** — {_status}")
            if _srv.get("description"):
                st.caption(_srv["description"])
    else:
        st.info("No MCP servers configured.")
    _active = _mcp.list_tools()
    st.caption(f"Active tools: {len(_active)}")

# ──────────────────────────────────────────────
# Session state bootstrap
# ──────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []

# Sidebar: Clear Chat button
if st.sidebar.button("🗑️ Clear Chat"):
    st.session_state.messages = []
    st.rerun()

# ──────────────────────────────────────────────
# Header
# ──────────────────────────────────────────────
st.title(":material/smart_toy: ZIVO-AI")
st.caption("Your intelligent assistant — powered by OpenAI Agents SDK")

# ──────────────────────────────────────────────
# Render existing chat history
# ──────────────────────────────────────────────
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# ──────────────────────────────────────────────
# Debug panel: Agent Swarm Map (only in swarm mode)
# ──────────────────────────────────────────────
if debug_mode and use_swarm:
    with st.expander("🕸️ Agent Swarm Map"):
        st.json({
            "planner": {
                "model": "gpt-4o",
                "handoffs": ["WebResearchAgent", "CodeExecutorAgent", "DataValidatorAgent"],
            },
            "executors": {
                "WebResearchAgent": {"tools": ["get_current_datetime"]},
                "CodeExecutorAgent": {"tools": ["read_local_file", "list_directory"]},
                "DataValidatorAgent": {"tools": ["read_local_file"]},
            },
        })

# ──────────────────────────────────────────────
# Chat input
# ──────────────────────────────────────────────
if prompt := st.chat_input("Ask ZIVO anything…"):
    # Append user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # ── Feature #1: st.status Thinking Traces ──────────────────────────────
    # Show a collapsible status container while the agent works so the user
    # can see every reasoning/tool step in real-time.
    # ──────────────────────────────────────────────────────────────────────
    with st.chat_message("assistant"):
        with st.status("ZIVO is thinking…", expanded=False) as status:
            st.write(":material/search: Searching internal memory…")
            st.write(":material/psychology: Analysing query context…")

            # Run the agent
            result = st.session_state.brain.run(st.session_state.messages)

            # Expose tool calls inside the status block so the user can
            # see which tools fired (if any).
            if hasattr(result, "new_messages") and result.new_messages:
                for agent_msg in result.new_messages:
                    role = getattr(agent_msg, "role", "")
                    # Surface tool-call names when available
                    if role == "tool" or str(role) == "tool":
                        tool_name = getattr(agent_msg, "name", "unknown tool")
                        st.write(f":material/build: Tool called — `{tool_name}`")

            # Show which agent handled the request (swarm / handoff trace)
            last_agent = getattr(result, "last_agent", None)
            if last_agent:
                st.write(f"🤖 **Handled by:** `{last_agent.name}`")

            # Capture raw response for the debug panel (Feature #3)
            if debug_mode:
                try:
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

            status.update(
                label=":material/check_circle: Analysis complete!",
                state="complete",
                expanded=False,
            )

        # Render the final assistant answer
        final_answer: str = result.final_output or ""
        st.markdown(final_answer)

    # Persist assistant message
    st.session_state.messages.append(
        {"role": "assistant", "content": final_answer}
    )
