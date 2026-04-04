import re

with open('octobot_mcp.py', 'r') as f:
    content = f.read()

new_req = """def _req(path: str, method: str = "get", json: Optional[dict]=None) -> Dict[str, Any]:
    url = OCTOBOT_REST_URL.rstrip("/") + "/" + path.lstrip("/")
    headers = {}
    if OCTOBOT_API_KEY:
        headers["Authorization"] = f"Bearer {OCTOBOT_API_KEY}"
    try:
        r = requests.request(method, url, json=json, headers=headers, timeout=15)
        return {"status_code": r.status_code, "json": r.json()}
    except Exception as e:
        # Fallback if request fails entirely, or if r.json() fails and r isn't defined yet
        if 'r' in locals() and hasattr(r, 'status_code'):
            return {"status_code": r.status_code, "text": getattr(r, 'text', str(e))}
        return {"status_code": 500, "text": str(e)}
"""

pattern = re.compile(r'def _req\(path: str, method: str = "get", json: Optional\[dict\]=None\) -> Dict\[str, Any\]:(.*?)(?=\n@mcp\.tool)', re.DOTALL)
content = pattern.sub(new_req + '\n', content)

with open('octobot_mcp.py', 'w') as f:
    f.write(content)
