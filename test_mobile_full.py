#!/usr/bin/env python3
"""
Test mobile viewport for localhost:8080
Takes screenshots at multiple scroll positions
"""

from playwright.sync_api import sync_playwright
import time
import os

def test_mobile_viewport():
    output_dir = "mobile_screenshots"
    os.makedirs(output_dir, exist_ok=True)
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        
        # Create context with iPhone 14 viewport
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        
        page = context.new_page()
        
        print("Navigating to http://localhost:8080/")
        page.goto('http://localhost:8080/', wait_until='networkidle')
        time.sleep(2)
        
        # Get page dimensions
        page_height = page.evaluate('document.documentElement.scrollHeight')
        viewport_height = 844
        
        print(f"Page height: {page_height}px")
        print(f"Viewport height: {viewport_height}px")
        
        # Check for horizontal scroll
        has_horizontal_scroll = page.evaluate('''() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        }''')
        
        scroll_width = page.evaluate('document.documentElement.scrollWidth')
        client_width = page.evaluate('document.documentElement.clientWidth')
        
        print(f"\n=== HORIZONTAL SCROLL CHECK ===")
        print(f"Scroll width: {scroll_width}px")
        print(f"Client width: {client_width}px")
        print(f"Has horizontal scroll: {has_horizontal_scroll}")
        
        if has_horizontal_scroll:
            print("⚠️  WARNING: Horizontal scroll detected!")
            # Find elements causing overflow
            overflowing_elements = page.evaluate('''() => {
                const elements = document.querySelectorAll('*');
                const overflowing = [];
                elements.forEach(el => {
                    if (el.scrollWidth > el.clientWidth) {
                        const rect = el.getBoundingClientRect();
                        overflowing.push({
                            tag: el.tagName,
                            class: el.className,
                            id: el.id,
                            scrollWidth: el.scrollWidth,
                            clientWidth: el.clientWidth,
                            overflow: el.scrollWidth - el.clientWidth
                        });
                    }
                });
                return overflowing.sort((a, b) => b.overflow - a.overflow).slice(0, 10);
            }''')
            print("\nTop overflowing elements:")
            for i, el in enumerate(overflowing_elements, 1):
                print(f"{i}. {el['tag']}.{el['class']} (id: {el['id']}) - overflow: {el['overflow']}px")
        
        # Take screenshots at different scroll positions
        scroll_positions = []
        current_scroll = 0
        position_num = 1
        
        while current_scroll < page_height:
            screenshot_path = f"{output_dir}/scroll_pos_{position_num:02d}_y{current_scroll}.png"
            page.screenshot(path=screenshot_path, full_page=False)
            print(f"Screenshot saved: {screenshot_path} (scroll Y: {current_scroll}px)")
            
            scroll_positions.append({
                'position': position_num,
                'scroll_y': current_scroll,
                'path': screenshot_path
            })
            
            # Scroll down
            current_scroll += viewport_height - 100  # Overlap for context
            page.evaluate(f'window.scrollTo(0, {current_scroll})')
            time.sleep(0.5)
            position_num += 1
            
            # Safety limit
            if position_num > 20:
                break
        
        # Take a full page screenshot
        full_page_path = f"{output_dir}/full_page.png"
        page.screenshot(path=full_page_path, full_page=True)
        print(f"\nFull page screenshot saved: {full_page_path}")
        
        # Check navigation/hamburger menu
        print("\n=== NAVIGATION CHECK ===")
        hamburger_selectors = [
            '.hamburger',
            '.menu-toggle',
            '.mobile-menu',
            '[class*="hamburger"]',
            '[class*="menu-icon"]',
            'button[aria-label*="menu" i]',
            'button[aria-label*="navigation" i]'
        ]
        
        hamburger_found = False
        for selector in hamburger_selectors:
            try:
                element = page.query_selector(selector)
                if element and element.is_visible():
                    print(f"✓ Hamburger menu found: {selector}")
                    hamburger_found = True
                    
                    # Try to click it
                    print("  Attempting to click hamburger menu...")
                    page.scroll_into_view_if_needed(selector)
                    time.sleep(0.5)
                    page.click(selector)
                    time.sleep(1)
                    
                    # Take screenshot of opened menu
                    menu_screenshot = f"{output_dir}/menu_opened.png"
                    page.screenshot(path=menu_screenshot)
                    print(f"  Menu opened screenshot: {menu_screenshot}")
                    
                    # Close menu
                    page.click(selector)
                    time.sleep(0.5)
                    break
            except Exception as e:
                continue
        
        if not hamburger_found:
            print("⚠️  No hamburger menu found with common selectors")
        
        # Check text readability
        print("\n=== TEXT READABILITY CHECK ===")
        text_info = page.evaluate('''() => {
            const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li');
            const fontSizes = [];
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                if (fontSize > 0 && el.offsetParent !== null) {
                    fontSizes.push({
                        tag: el.tagName,
                        fontSize: fontSize,
                        text: el.textContent.trim().substring(0, 50)
                    });
                }
            });
            return fontSizes;
        }''')
        
        if text_info:
            font_sizes = [item['fontSize'] for item in text_info]
            min_font = min(font_sizes)
            avg_font = sum(font_sizes) / len(font_sizes)
            
            print(f"Font size range: {min_font:.1f}px - {max(font_sizes):.1f}px")
            print(f"Average font size: {avg_font:.1f}px")
            
            if min_font < 12:
                print(f"⚠️  WARNING: Some text is very small (minimum: {min_font:.1f}px)")
                small_text = [item for item in text_info if item['fontSize'] < 12]
                print(f"  Found {len(small_text)} elements with font size < 12px")
            else:
                print("✓ Text sizes appear readable (all >= 12px)")
        
        # Check images
        print("\n=== IMAGE CHECK ===")
        images = page.query_selector_all('img')
        print(f"Total images found: {len(images)}")
        
        broken_images = []
        for i, img in enumerate(images):
            is_visible = img.is_visible()
            natural_width = img.evaluate('el => el.naturalWidth')
            src = img.get_attribute('src')
            
            if is_visible and natural_width == 0:
                broken_images.append(src)
                print(f"  ⚠️  Broken image: {src}")
        
        if broken_images:
            print(f"⚠️  Found {len(broken_images)} broken images")
        else:
            print("✓ All visible images loaded successfully")
        
        # Check for layout issues
        print("\n=== LAYOUT CHECK ===")
        layout_issues = page.evaluate('''() => {
            const issues = [];
            const elements = document.querySelectorAll('*');
            
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                
                // Check if element extends beyond viewport
                if (rect.right > window.innerWidth && style.position !== 'fixed') {
                    issues.push({
                        type: 'extends_right',
                        tag: el.tagName,
                        class: el.className,
                        id: el.id,
                        right: rect.right,
                        viewport: window.innerWidth
                    });
                }
            });
            
            return issues.slice(0, 10);
        }''')
        
        if layout_issues:
            print(f"⚠️  Found {len(layout_issues)} layout issues:")
            for issue in layout_issues:
                print(f"  - {issue['tag']}.{issue['class']} extends beyond viewport")
        else:
            print("✓ No major layout issues detected")
        
        print("\n=== SUMMARY ===")
        print(f"✓ Tested with iPhone 14 viewport (390x844)")
        print(f"✓ Captured {len(scroll_positions)} scroll position screenshots")
        print(f"✓ Full page screenshot saved")
        print(f"✓ All screenshots in: {output_dir}/")
        
        # Keep browser open for manual inspection
        print("\n⏸️  Browser will stay open for 10 seconds for manual inspection...")
        time.sleep(10)
        
        browser.close()

if __name__ == '__main__':
    test_mobile_viewport()
