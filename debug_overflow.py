#!/usr/bin/env python3
"""
Debug horizontal overflow issues on mobile viewport.
Finds all elements that extend beyond the viewport width.
"""

from playwright.sync_api import sync_playwright
import json

MOBILE_WIDTH = 390
MOBILE_HEIGHT = 844

PAGES = [
    {
        'url': 'http://localhost:8888/love/index.html',
        'name': 'Love'
    },
    {
        'url': 'http://localhost:8888/schastye/index.html',
        'name': 'Schastye'
    }
]

def find_overflow_elements():
    """Find elements causing horizontal overflow on each page."""
    
    print(f"\n{'='*80}")
    print(f"HORIZONTAL OVERFLOW DEBUG REPORT")
    print(f"Viewport: {MOBILE_WIDTH}x{MOBILE_HEIGHT}")
    print(f"{'='*80}\n")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for page_info in PAGES:
            url = page_info['url']
            name = page_info['name']
            
            print(f"\n{'─'*80}")
            print(f"Page: {name}")
            print(f"URL: {url}")
            print(f"{'─'*80}\n")
            
            page = browser.new_page(
                viewport={'width': MOBILE_WIDTH, 'height': MOBILE_HEIGHT},
                device_scale_factor=2,
                is_mobile=True,
                has_touch=True
            )
            
            try:
                response = page.goto(url, wait_until='networkidle', timeout=10000)
                
                if not response or response.status != 200:
                    print(f"❌ Failed to load page (status: {response.status if response else 'N/A'})")
                    page.close()
                    continue
                
                page.wait_for_timeout(1000)
                
                # Run the overflow detection JavaScript
                results = page.evaluate("""
                    () => {
                        const results = [];
                        document.querySelectorAll('*').forEach(el => {
                            const rect = el.getBoundingClientRect();
                            if (rect.right > 390) {
                                results.push({
                                    tag: el.tagName,
                                    id: el.id,
                                    classes: el.className.toString().substring(0, 100),
                                    right: Math.round(rect.right),
                                    overflow: Math.round(rect.right - 390),
                                    width: Math.round(rect.width)
                                });
                            }
                        });
                        return results.slice(0, 30);
                    }
                """)
                
                if results:
                    print(f"Found {len(results)} elements extending beyond viewport:\n")
                    print(json.dumps(results, indent=2))
                else:
                    print("✅ No overflow elements found!")
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
            
            finally:
                page.close()
        
        browser.close()
    
    print(f"\n{'='*80}")
    print(f"DEBUG COMPLETE")
    print(f"{'='*80}\n")

if __name__ == '__main__':
    find_overflow_elements()
