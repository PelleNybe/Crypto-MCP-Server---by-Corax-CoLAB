import pytest
import sys
from unittest.mock import patch, MagicMock

@patch('playwright.sync_api.sync_playwright')
def test_screenshot_generation(mock_sync_playwright):
    # Mocking playwright sync interface
    mock_p = MagicMock()
    mock_browser = MagicMock()
    mock_page = MagicMock()

    mock_sync_playwright.return_value.__enter__.return_value = mock_p
    mock_p.chromium.launch.return_value = mock_browser
    mock_browser.new_page.return_value = mock_page

    # We must patch sys.modules or import inside so the module runs on import
    # But screenshot.py executes code immediately upon import.
    if 'screenshot' in sys.modules:
        del sys.modules['screenshot']

    import screenshot

    mock_p.chromium.launch.assert_called_once()
    mock_browser.new_page.assert_called_once()
    mock_page.goto.assert_called_once_with('http://localhost:5173')
    mock_page.screenshot.assert_called_once_with(path='screenshot.png')
    mock_browser.close.assert_called_once()
