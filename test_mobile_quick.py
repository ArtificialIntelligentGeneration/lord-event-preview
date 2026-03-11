#!/usr/bin/env python3
"""
Quick mobile viewport test for localhost:8080
"""

from playwright.sync_api import sync_playwright
import time
import os

def test_mobile():
    output_dir = "mobile_screenshots"
    os.makedirs(output_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        
        # iPhone 14 viewport
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
        )
        
        page = context.new_page()
        
        print("📱 Testing http://localhost:8080/ with iPhone 14 viewport (390x844)")
        page.goto('http://localhost:8080/', wait_until='networkidle')
        time.sleep(1)
        
        # Get page info
        page_height = page.evaluate('document.documentElement.scrollHeight')
        scroll_width = page.evaluate('document.documentElement.scrollWidth')
        client_width = page.evaluate('document.documentElement.clientWidth')
        
        print(f"\n📏 Page Dimensions:")
        print(f"  Height: {page_height}px")
        print(f"  Scroll width: {scroll_width}px")
        print(f"  Client width: {client_width}px")
        
        # Check horizontal scroll
        has_h_scroll = scroll_width > client_width
        print(f"\n{'⚠️ ' if has_h_scroll else '✓'} Horizontal scroll: {has_h_scroll}")
        
        if has_h_scroll:
            overflow = scroll_width - client_width
            print(f"  Overflow: {overflow}px")
            
            # Find overflowing elements
            overflowing = page.evaluate('''() => {
                const elements = Array.from(document.querySelectorAll('*'));
                return elements
                    .filter(el => el.scrollWidth > el.clientWidth)
                    .map(el => ({
                        tag: el.tagName,
                        class: el.className,
                        id: el.id,
                        overflow: el.scrollWidth - el.clientWidth
                    }))
                    .sort((a, b) => b.overflow - a.overflow)
                    .slice(0, 5);
            }''')
            
            print("\n  Top overflowing elements:")
            for el in overflowing:
                cls = f".{el['class']}" if el['class'] else ""
                id_str = f"#{el['id']}" if el['id'] else ""
                print(f"    {el['tag']}{cls}{id_str} → +{el['overflow']}px")
        
        # Take screenshots at scroll positions
        print(f"\n📸 Taking screenshots...")
        viewport_height = 844
        positions = []
        y = 0
        num = 1
        
        while y < page_height:
            path = f"{output_dir}/pos_{num:02d}_y{y}.png"
            page.evaluate(f'window.scrollTo(0, {y})')
            time.sleep(0.3)
            page.screenshot(path=path)
            print(f"  ✓ {path}")
            positions.append(y)
            y += viewport_height - 100
            num += 1
            if num > 15:
                break
        
        # Full page
        full_path = f"{output_dir}/full_page.png"
        page.screenshot(path=full_path, full_page=True)
        print(f"  ✓ {full_path}")
        
        # Text readability
        print(f"\n📝 Text Readability:")
        text_stats = page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li'));
            const sizes = elements
                .filter(el => el.offsetParent !== null)
                .map(el => parseFloat(window.getComputedStyle(el).fontSize))
                .filter(size => size > 0);
            
            if (sizes.length === 0) return null;
            
            return {
                min: Math.min(...sizes),
                max: Math.max(...sizes),
                avg: sizes.reduce((a, b) => a + b) / sizes.length
            };
        }''')
        
        if text_stats:
            print(f"  Min: {text_stats['min']:.1f}px")
            print(f"  Max: {text_stats['max']:.1f}px")
            print(f"  Avg: {text_stats['avg']:.1f}px")
            if text_stats['min'] < 12:
                print(f"  ⚠️  Some text is too small (< 12px)")
            else:
                print(f"  ✓ All text is readable (>= 12px)")
        
        # Images
        print(f"\n🖼️  Images:")
        img_info = page.evaluate('''() => {
            const images = Array.from(document.querySelectorAll('img'));
            const visible = images.filter(img => img.offsetParent !== null);
            const broken = visible.filter(img => img.naturalWidth === 0);
            return {
                total: images.length,
                visible: visible.length,
                broken: broken.length
            };
        }''')
        
        print(f"  Total: {img_info['total']}")
        print(f"  Visible: {img_info['visible']}")
        if img_info['broken'] > 0:
            print(f"  ⚠️  Broken: {img_info['broken']}")
        else:
            print(f"  ✓ All images loaded")
        
        # Navigation menu
        print(f"\n🍔 Navigation Menu:")
        menu_selectors = [
            '.hamburger', '.menu-toggle', '.mobile-menu',
            '[class*="hamburger"]', '[class*="menu-icon"]',
            'button[aria-label*="menu" i]'
        ]
        
        menu_found = False
        for selector in menu_selectors:
            try:
                el = page.query_selector(selector)
                if el and el.is_visible():
                    print(f"  ✓ Found: {selector}")
                    menu_found = True
                    
                    # Try clicking
                    page.click(selector)
                    time.sleep(0.5)
                    menu_path = f"{output_dir}/menu_opened.png"
                    page.screenshot(path=menu_path)
                    print(f"  ✓ Menu opened: {menu_path}")
                    
                    # Close
                    page.click(selector)
                    break
            except:
                pass
        
        if not menu_found:
            print(f"  ⚠️  No hamburger menu found")
        
        # Layout issues
        print(f"\n📐 Layout Check:")
        layout_issues = page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements
                .filter(el => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return rect.right > window.innerWidth && style.position !== 'fixed';
                })
                .map(el => ({
                    tag: el.tagName,
                    class: el.className,
                    id: el.id
                }))
                .slice(0, 5);
        }''')
        
        if len(layout_issues) > 0:
            print(f"  ⚠️  {len(layout_issues)} elements extend beyond viewport:")
            for el in layout_issues:
                cls = f".{el['class']}" if el['class'] else ""
                id_str = f"#{el['id']}" if el['id'] else ""
                print(f"    {el['tag']}{cls}{id_str}")
        else:
            print(f"  ✓ No layout issues")
        
        print(f"\n✅ Complete! Screenshots in: {output_dir}/")
        print(f"   Captured {len(positions)} scroll positions")
        
        browser.close()

if __name__ == '__main__':
    test_mobile()
