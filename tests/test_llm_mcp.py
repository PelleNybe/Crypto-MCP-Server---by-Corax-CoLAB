import unittest
from unittest.mock import patch, MagicMock
import sys

# Mock dependencies before importing the module
mock_mcp = MagicMock()
# Mock FastMCP to return a decorator that does nothing
mock_fastmcp_instance = MagicMock()
mock_mcp.FastMCP.return_value = mock_fastmcp_instance


# When @mcp.tool() is called, it should return a decorator
# that returns the original function.
def mock_tool_decorator(*args, **kwargs):
    def decorator(func):
        return func

    return decorator


mock_fastmcp_instance.tool = mock_tool_decorator

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server"] = MagicMock()
sys.modules["mcp.server.fastmcp"] = mock_mcp

mock_litellm = MagicMock()
sys.modules["litellm"] = mock_litellm

mock_dotenv = MagicMock()
sys.modules["dotenv"] = mock_dotenv

# Now import llm_mcp
import llm_mcp


class TestLLMMCP(unittest.TestCase):

    @patch("llm_mcp.generate_text")
    def test_analyze_crypto_data(self, mock_generate_text):
        mock_generate_text.return_value = {
            "model": "ollama/mistral",
            "response": "The crypto data is bullish.",
        }

        data_json = '{"symbol": "BTC", "price": 50000}'
        user_question = "What is the analysis for BTC?"

        res = llm_mcp.analyze_crypto_data(data_json, user_question)

        expected_prompt = f"You are an expert crypto analyst. Analyze the following data:\n{data_json}\n\nUser Question: {user_question}\nProvide a concise and actionable analysis."

        mock_generate_text.assert_called_once_with(
            prompt=expected_prompt, temperature=0.2
        )
        self.assertEqual(res["response"], "The crypto data is bullish.")

    @patch("llm_mcp.completion")
    def test_generate_text_success(self, mock_completion):
        # Set LITELLM_AVAILABLE to True for this test
        with patch("llm_mcp.LITELLM_AVAILABLE", True):
            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = "Analysis complete."
            mock_response.usage = {"prompt_tokens": 10, "completion_tokens": 5}
            mock_completion.return_value = mock_response

            prompt = "Test prompt"
            res = llm_mcp.generate_text(prompt)

            self.assertEqual(res["response"], "Analysis complete.")
            self.assertIn("usage", res)
            self.assertEqual(res["usage"]["prompt_tokens"], 10)

    @patch("llm_mcp.completion")
    def test_generate_text_error(self, mock_completion):
        with patch("llm_mcp.LITELLM_AVAILABLE", True):
            mock_completion.side_effect = Exception("API Error")

            prompt = "Test prompt"
            res = llm_mcp.generate_text(prompt)

            self.assertIn("error", res)
            self.assertEqual(res["error"], "API Error")

    def test_generate_text_no_litellm(self):
        with patch("llm_mcp.LITELLM_AVAILABLE", False):
            res = llm_mcp.generate_text("Test prompt")
            self.assertIn("error", res)
            self.assertIn("litellm library is not installed", res["error"])


if __name__ == "__main__":
    unittest.main()
