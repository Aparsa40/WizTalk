# Future Agent Architecture

While V1 focuses on character immersion and foundational Chat UI, the architecture reserves space for a true Agent framework.

## Roadmap
1. **Agent Runtime**: Move logic from `server.ts` into a dedicated `/server/agents/` pipeline.
2. **Tool Router**: Intercept intent via LLM function calling before generating a final response.
3. **MCP (Model Context Protocol)**: Integrate MCP Clients to allow characters to interact with local APIs, Wikipedia (for lore), or Web Search.
4. **Safety Filter**: A middleware step in `server.ts` to validate the output against age-appropriate safety guidelines before returning it to the user.
