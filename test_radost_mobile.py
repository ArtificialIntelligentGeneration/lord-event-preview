#!/usr/bin/env python3
"""Test Radost page at mobile viewport."""

from playwright.sync_api import sync_playwright
import os

MOBILE_WIDTH = 390
MOBILE_HEIGHT = 844
OUTPUT_DIR = 'output/playwright'

os.makedirs(OUTPUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(
        viewport={'width': MOBILE_WIDTH, 'height': MOBILE_HEIGHT},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    
    print("Testing Radost page...")
    response = page.goto('http://localhost:8888/radost/index.html', wait_until='networkidle', timeout=10000)
    print(f"Page loaded: {response.status}")
    
    page.wait_for_timeout(1000)
    
    # Check overflow
    has_overflow = page.evaluate("""
        () => {
            const scrollWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
            const clientWidth = document.documentElement.clientWidth;
            return scrollWidth > clientWidth;
        }
    """)
    print(f"Horizontal overflow: {has_overflow}")
    
    # Get dimensions
    dimensions = page.evaluate("""
        () => {
            return {
                scrollWidth: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
                scrollHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
                clientWidth: document.documentElement.clientWidth,
                clientHeight: document.documentElement.clientHeight
            };
        }
    """)
    print(f"Dimensions: {dimensions}")
    
    # Check hamburger
    hamburger_visible = page.evaluate("""
        () => {
            const selectors = ['.hamburger', '.menu-toggle', '.mobile-menu-toggle', '[class*="burger"]', '[class*="hamburger"]', '.t-menu__toggle'];
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const style = window.getComputedStyle(el);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                        return true;
                    }
                }
            }
            return false;
        }
    """)
    print(f"Hamburger visible: {hamburger_visible}")
    
    # Screenshots
    page.screenshot(path=f"{OUTPUT_DIR}/04_radost_top.png")
    print("Screenshot: top")
    
    scroll_height = dimensions['scrollHeight']
    page.evaluate(f"window.scrollTo(0, {scroll_height * 0.5})")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUTPUT_DIR}/04_radost_mid.png")
    print("Screenshot: mid")
    
    page.evaluate(f"window.scrollTo(0, {scroll_height})")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUTPUT_DIR}/04_radost_bottom.png")
    print("Screenshot: bottom")
    
    page.screenshot(path=f"{OUTPUT_DIR}/04_radost_full.png", full_page=True)
    print("Screenshot: full")
    
    # Check text size
    small_text_count = page.evaluate("""
        () => {
            const elements = document.querySelectorAll('p, span, div, a, li');
            let smallCount = 0;
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                if (fontSize < 12 && el.textContent.trim().length > 0) {
                    smallCount++;
                }
            });
            return smallCount;
        }
    """)
    print(f"Small text elements (<12px): {small_text_count}")
    
    browser.close()
    print("Done!")
