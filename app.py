import streamlit as st
from engine.zivo_brain import ZivoBrain
from engine.mcp_client import MCPClientManager

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
st.sidebar.markdown("### :material/settings: Mode")
st.sidebar.toggle(
    "🕸️ Swarm Mode",
    value=st.session_state.get("use_swarm", False),
    key="use_swarm",
    help="Enable multi-agent swarm with Planner + specialist agents.",
)

# Reinitialise ZivoBrain when swarm mode changes
if "brain" not in st.session_state or st.session_state.get("_prev_use_swarm") != st.session_state.use_swarm:
    st.session_state.brain = ZivoBrain(use_swarm=st.session_state.use_swarm)
    st.session_state._prev_use_swarm = st.session_state.use_swarm

# ──────────────────────────────────────────────
# MCP Servers panel
# ──────────────────────────────────────────────
st.sidebar.markdown("### :material/hub: MCP Servers")
try:
    _mcp = MCPClientManager()
    _statuses = _mcp.server_statuses()
    if _statuses:
        for s in _statuses:
            icon = ":material/check_circle:" if s["status"] == "configured" else ":material/cancel:"
            st.sidebar.markdown(f"{icon} **{s['name']}** `{s['transport']}`")
        if st.sidebar.button("List MCP Tools", key="mcp_tools_btn"):
            tools = _mcp.list_tools()
            if tools:
                st.sidebar.write(tools)
            else:
                st.sidebar.info("No tools available (servers may be offline).")
    else:
        st.sidebar.info("No MCP servers configured.")
except Exception as exc:
    st.sidebar.info("MCP unavailable.")
    import logging as _logging
    _logging.getLogger(__name__).debug("MCP sidebar error: %s", exc)

# ──────────────────────────────────────────────
# Session state bootstrap
# ──────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []

if "brain" not in st.session_state:
    st.session_state.brain = ZivoBrain(use_swarm=st.session_state.get("use_swarm", False))

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

            # Show which agent handled the request (swarm mode)
            last_agent_name: str = getattr(
                getattr(result, "last_agent", None), "name", "ZIVO-AI"
            )
            st.write(f":material/smart_toy: Handled by **{last_agent_name}**")

            # Expose tool calls inside the status block so the user can
            # see which tools fired (if any).
            if hasattr(result, "new_messages") and result.new_messages:
                for agent_msg in result.new_messages:
                    role = getattr(agent_msg, "role", "")
                    # Surface tool-call names when available
                    if role == "tool" or str(role) == "tool":
                        tool_name = getattr(agent_msg, "name", "unknown tool")
                        st.write(f":material/build: Tool called → `{tool_name}`")

            # Capture raw response for the debug panel (Feature #3)
            if debug_mode:
                try:
                    st.session_state.last_raw_response = {
                        "final_output": str(result.final_output),
                        "last_agent": last_agent_name,
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

# ──────────────────────────────────────────────
# Agent Swarm Map (debug panel)
# ──────────────────────────────────────────────
if debug_mode and st.session_state.get("use_swarm", False):
    with st.expander(":material/account_tree: Agent Swarm Map", expanded=False):
        try:
            from engine.swarm import ZIVOSwarm
            swarm_ref = st.session_state.brain._swarm
            if swarm_ref is not None:
                st.json(swarm_ref.agent_graph)
            else:
                st.info("Swarm not initialised.")
        except Exception as exc:
            st.warning(f"Could not load swarm map: {exc}")

# ──────────────────────────────────────────────
# Sidebar: Clear Chat
# ──────────────────────────────────────────────
if st.sidebar.button(":material/delete: Clear Chat"):
    st.session_state.messages = []
    st.rerun()

