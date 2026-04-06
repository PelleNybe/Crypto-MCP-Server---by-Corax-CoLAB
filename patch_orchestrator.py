import re

with open('autonomous_orchestrator.py', 'r') as f:
    content = f.read()

# Replace `analyze_with_llm` definition
old_def = """async def analyze_with_llm(market_data: dict):
    \"\"\"
    Evaluates the signals and returns a JSON decision: BUY, SELL, or HOLD.
    \"\"\"
    provider = os.getenv("ACTIVE_LLM_PROVIDER", "gemini").lower()
    logger.info(f"Analyzing data with LLM ({provider})...\")

    system_prompt = "You are Corax CoLAB's autonomous hedge fund manager. Analyze this data and return a JSON decision: BUY, SELL, or HOLD."
    user_prompt = f"Data to analyze: {json.dumps(market_data)}\\nRespond strictly with JSON in this format: {{\\"decision\\": \\"BUY|SELL|HOLD\\", \\"reasoning\\": \\"your reasoning here\\"}}"
"""

new_def = """def calculate_consensus(votes):
    \"\"\"
    Evaluates the results from all active providers.
    Implements Majority Rule. If tie or no consensus, default is HOLD.
    \"\"\"
    decisions = [v.get("decision", "HOLD").upper() for v in votes]
    vote_counts = {"BUY": decisions.count("BUY"), "SELL": decisions.count("SELL"), "HOLD": decisions.count("HOLD")}
    total_votes = len(votes)

    final_decision = "HOLD"
    if total_votes > 0:
        for action, count in vote_counts.items():
            if count > total_votes / 2:
                final_decision = action
                break

    return {
        "decision": final_decision,
        "vote_counts": vote_counts,
        "total_votes": total_votes,
        "director_votes": votes
    }

async def call_provider(provider: str, market_data: dict):
    provider = provider.strip().lower()

    personas = {
        "gemini": "Technical Analyst",
        "openai": "Macro Strategist",
        "anthropic": "Risk Manager"
    }

    persona = personas.get(provider, "General Analyst")
    system_prompt = f"You are Corax CoLAB's autonomous hedge fund manager acting as the {persona}. Analyze this data and return a JSON decision: BUY, SELL, or HOLD."
    user_prompt = f"Data to analyze: {json.dumps(market_data)}\\nRespond strictly with JSON in this format: {{\\"decision\\": \\"BUY|SELL|HOLD\\", \\"reasoning\\": \\"your reasoning here\\"}}"

    decision_json = {"decision": "HOLD", "reasoning": f"Fallback decision due to failure for {provider}.", "provider": provider}

    try:
        if provider == "openai":
            if not openai:
                raise ImportError("OpenAI SDK not installed.")
            client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            decision_json = json.loads(response.choices[0].message.content)
            decision_json["provider"] = provider

        elif provider == "anthropic":
            if not anthropic:
                raise ImportError("Anthropic SDK not installed.")
            client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            response = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            content = response.content[0].text
            decision_json = json.loads(content)
            decision_json["provider"] = provider

        elif provider == "gemini":
            if not genai:
                raise ImportError("Google GenAI SDK not installed.")
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            def _call_gemini():
                return client.models.generate_content(
                    model='gemini-2.5-pro',
                    contents=user_prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json"
                    )
                )
            response = await asyncio.to_thread(_call_gemini)
            decision_json = json.loads(response.text)
            decision_json["provider"] = provider

        else:
            logger.error(f"Unknown LLM provider: {provider}")

    except Exception as e:
        logger.error(f"LLM Analysis failed for {provider}: {e}")

    logger.info(f"{provider} Analysis Complete. Decision: {decision_json.get('decision')}")
    return decision_json

async def consult_board_of_directors(market_data: dict):
    \"\"\"
    Evaluates the signals using multiple LLM providers and returns a consensus decision.
    \"\"\"
    providers_str = os.getenv("ACTIVE_LLM_PROVIDERS", os.getenv("ACTIVE_LLM_PROVIDER", "gemini"))
    providers = [p.strip() for p in providers_str.split(",") if p.strip()]

    logger.info(f"Consulting Board of Directors ({', '.join(providers)})...")

    tasks = [call_provider(p, market_data) for p in providers]
    results = await asyncio.gather(*tasks)

    consensus_result = calculate_consensus(results)

    final_decision = consensus_result["decision"]
    votes_for_decision = consensus_result["vote_counts"].get(final_decision, 0)
    total_votes = consensus_result["total_votes"]

    if votes_for_decision > total_votes / 2:
        logger.info(f"Consensus reached: {final_decision} ({votes_for_decision}/{total_votes} votes)")
    else:
        logger.info(f"No consensus: HOLD ({consensus_result['vote_counts'].get('HOLD', 0)}/{total_votes} votes)")

    return consensus_result"""

# we need to replace everything from `async def analyze_with_llm(market_data: dict):` to the end of the function body
import re
pattern = r"async def analyze_with_llm\(market_data: dict\):.*?return decision_json\n"

content = re.sub(pattern, new_def + "\n", content, flags=re.DOTALL)

# Replace `analyze_with_llm` calls in agent_loop
content = content.replace("analysis = await analyze_with_llm(market_data)", "analysis = await consult_board_of_directors(market_data)")

with open('autonomous_orchestrator.py', 'w') as f:
    f.write(content)
