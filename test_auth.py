from playwright.sync_api import sync_playwright
import pytest
import urllib.request
try:
    urllib.request.urlopen('http://localhost:5173', timeout=1)
except Exception:
    pytest.skip('Dev server not running', allow_module_level=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")
    print(page.title())
    browser.close()
