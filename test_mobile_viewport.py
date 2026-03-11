#!/usr/bin/env python3
"""
Test mobile viewport rendering for local website pages.
Captures screenshots at mobile size (390x844 - iPhone 14) and checks for issues.
"""

from playwright.sync_api import sync_playwright
import sys
import os

# Mobile viewport size (iPhone 14)
MOBILE_WIDTH = 390
MOBILE_HEIGHT = 844

# Pages to test
PAGES = [
    {
        'url': 'http://localhost:8888/index.html',
        'name': 'Main (Tilda)',
        'output_prefix': '01_main'
    },
    {
        'url': 'http://localhost:8888/love/index.html',
        'name': 'Love',
        'output_prefix': '02_love'
    },
    {
        'url': 'http://localhost:8888/schastye/index.html',
        'name': 'Schastye',
        'output_prefix': '03_schastye'
    },
    {
        'url': 'http://localhost:8888/radost/index.html',
        'name': 'Radost',
        'output_prefix': '04_radost'
    }
]

OUTPUT_DIR = 'output/playwright'

def test_mobile_viewport():
    """Test each page at mobile viewport and capture screenshots."""
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"\n{'='*80}")
    print(f"MOBILE VIEWPORT TEST REPORT")
    print(f"Viewport: {MOBILE_WIDTH}x{MOBILE_HEIGHT} (iPhone 14)")
    print(f"{'='*80}\n")
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        
        for page_info in PAGES:
            url = page_info['url']
            name = page_info['name']
            prefix = page_info['output_prefix']
            
            print(f"\n{'─'*80}")
            print(f"Testing: {name}")
            print(f"URL: {url}")
            print(f"{'─'*80}")
            
            # Create new page with mobile viewport
            page = browser.new_page(
                viewport={'width': MOBILE_WIDTH, 'height': MOBILE_HEIGHT},
                device_scale_factor=2,  # Retina display
                is_mobile=True,
                has_touch=True
            )
            
            try:
                # Navigate to page
                response = page.goto(url, wait_until='networkidle', timeout=10000)
                
                if not response or response.status != 200:
                    print(f"  ❌ Failed to load page (status: {response.status if response else 'N/A'})")
                    page.close()
                    continue
                
                print(f"  ✓ Page loaded successfully")
                
                # Wait a bit for any animations/lazy loading
                page.wait_for_timeout(1000)
                
                # Check for horizontal overflow
                has_overflow = page.evaluate("""
                    () => {
                        const body = document.body;
                        const html = document.documentElement;
                        const scrollWidth = Math.max(
                            body.scrollWidth,
                            html.scrollWidth
                        );
                        const clientWidth = html.clientWidth;
                        return scrollWidth > clientWidth;
                    }
                """)
                
                if has_overflow:
                    print(f"  ⚠️  WARNING: Horizontal overflow detected!")
                else:
                    print(f"  ✓ No horizontal overflow")
                
                # Get page dimensions
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
                
                print(f"  📐 Dimensions:")
                print(f"     - Viewport: {dimensions['clientWidth']}x{dimensions['clientHeight']}px")
                print(f"     - Content: {dimensions['scrollWidth']}x{dimensions['scrollHeight']}px")
                
                # Check for hamburger menu (mobile indicator)
                hamburger_visible = page.evaluate("""
                    () => {
                        // Look for common hamburger menu selectors
                        const selectors = [
                            '.hamburger',
                            '.menu-toggle',
                            '.mobile-menu-toggle',
                            '[class*="burger"]',
                            '[class*="hamburger"]',
                            '.t-menu__toggle'  // Tilda specific
                        ];
                        
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
                
                if hamburger_visible:
                    print(f"  ✓ Mobile menu (hamburger) visible")
                else:
                    print(f"  ⚠️  Mobile menu not detected")
                
                # Take screenshot at top
                screenshot_top = f"{OUTPUT_DIR}/{prefix}_top.png"
                page.screenshot(path=screenshot_top, full_page=False)
                print(f"  📸 Screenshot (top): {screenshot_top}")
                
                # Scroll to 50% and take another screenshot
                scroll_height = dimensions['scrollHeight']
                scroll_to = scroll_height * 0.5
                page.evaluate(f"window.scrollTo(0, {scroll_to})")
                page.wait_for_timeout(500)  # Wait for scroll
                
                screenshot_mid = f"{OUTPUT_DIR}/{prefix}_mid.png"
                page.screenshot(path=screenshot_mid, full_page=False)
                print(f"  📸 Screenshot (mid): {screenshot_mid}")
                
                # Scroll to bottom
                page.evaluate(f"window.scrollTo(0, {scroll_height})")
                page.wait_for_timeout(500)
                
                screenshot_bottom = f"{OUTPUT_DIR}/{prefix}_bottom.png"
                page.screenshot(path=screenshot_bottom, full_page=False)
                print(f"  📸 Screenshot (bottom): {screenshot_bottom}")
                
                # Take full page screenshot
                screenshot_full = f"{OUTPUT_DIR}/{prefix}_full.png"
                page.screenshot(path=screenshot_full, full_page=True)
                print(f"  📸 Screenshot (full page): {screenshot_full}")
                
                # Check text size (basic check)
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
                
                if small_text_count > 0:
                    print(f"  ⚠️  Found {small_text_count} elements with text smaller than 12px")
                else:
                    print(f"  ✓ Text sizes appear readable")
                
                print(f"  ✅ Test complete for {name}")
                
            except Exception as e:
                print(f"  ❌ Error testing page: {str(e)}")
            
            finally:
                page.close()
        
        browser.close()
    
    print(f"\n{'='*80}")
    print(f"TESTING COMPLETE")
    print(f"Screenshots saved to: {OUTPUT_DIR}/")
    print(f"{'='*80}\n")

if __name__ == '__main__':
    test_mobile_viewport()
