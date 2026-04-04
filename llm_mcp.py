#!/usr/bin/env python3
"""
llm_mcp.py
MCP server to interact with Local/Open-Source AI Models (via litellm, ollama, vLLM, etc).
Provides "full ai functionality with the most common open source ai suppliers."
For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""
import os
import logging
from typing import Any, Dict, Optional
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("llm_mcp")

mcp = FastMCP(name="llm", stateless_http=True, json_response=True, host="0.0.0.0", port=7015)

try:
    from litellm import completion
    LITELLM_AVAILABLE = True
except ImportError:
    LITELLM_AVAILABLE = False
    logger.warning("litellm is not installed. AI functionality will be simulated or limited. run `pip install litellm`")

# Default model, e.g. "ollama/llama2", "huggingface/meta-llama/Llama-2-7b-chat-hf", "vllm/..."
LLM_MODEL = os.getenv("LLM_MODEL", "ollama/mistral")
# The endpoint for the local AI supplier if needed (e.g. http://127.0.0.1:11434 for Ollama)
LLM_API_BASE = os.getenv("LLM_API_BASE", "http://127.0.0.1:11434")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

@mcp.tool()
def ping() -> str:
    return f"llm_mcp alive (model={LLM_MODEL}, api_base={LLM_API_BASE}) — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"

@mcp.tool()
def generate_text(prompt: str, model: Optional[str] = None, max_tokens: int = 500, temperature: float = 0.7) -> Dict[str, Any]:
    """
    Generate text using a local/open-source AI supplier.
    By default uses litellm which supports ollama, huggingface, vLLM, etc.
    """
    if not LITELLM_AVAILABLE:
        return {"error": "litellm library is not installed. Please install it to use open-source AI integration."}

    target_model = model or LLM_MODEL

    try:
        kwargs = {
            "model": target_model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        # Add api base if we're using a local provider like Ollama or vLLM
        if "ollama" in target_model or "vllm" in target_model:
            kwargs["api_base"] = LLM_API_BASE
        if LLM_API_KEY and LLM_API_KEY != "":
            kwargs["api_key"] = LLM_API_KEY

        response = completion(**kwargs)

        return {
            "model": target_model,
            "response": response.choices[0].message.content,
            "usage": dict(response.usage) if hasattr(response, "usage") else {}
        }
    except Exception as e:
        logger.error(f"Error generating text: {e}")
        return {"error": str(e)}

@mcp.tool()
def analyze_crypto_data(data_json: str, user_question: str) -> Dict[str, Any]:
    """
    A specialized endpoint to analyze crypto data using the local AI model.
    """
    prompt = f"You are an expert crypto analyst. Analyze the following data:\n{data_json}\n\nUser Question: {user_question}\nProvide a concise and actionable analysis."
    return generate_text(prompt=prompt, temperature=0.2)

if __name__ == "__main__":
    print(f"Starting llm_mcp on http://127.0.0.1:7015/mcp (Model: {LLM_MODEL}) — Crypto MCP Server (Corax CoLAB)")
    mcp.run("streamable-http")
