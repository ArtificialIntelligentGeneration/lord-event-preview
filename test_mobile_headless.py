#!/usr/bin/env python3
"""
Mobile viewport test - headless mode
"""

from playwright.sync_api import sync_playwright
import time
import os

def test_mobile():
    output_dir = "mobile_screenshots"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🚀 Starting mobile viewport test...")
    
    with sync_playwright() as p:
        # Headless mode
        browser = p.chromium.launch(headless=True)
        
        # iPhone 14 viewport
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        
        page = context.new_page()
        
        print("📱 Navigating to http://localhost:8080/")
        page.goto('http://localhost:8080/', wait_until='networkidle', timeout=10000)
        time.sleep(1)
        
        # Get page info
        page_height = page.evaluate('document.documentElement.scrollHeight')
        scroll_width = page.evaluate('document.documentElement.scrollWidth')
        client_width = page.evaluate('document.documentElement.clientWidth')
        
        print(f"\n📏 DIMENSIONS")
        print(f"  Viewport: 390x844")
        print(f"  Page height: {page_height}px")
        print(f"  Scroll width: {scroll_width}px")
        print(f"  Client width: {client_width}px")
        
        # Check horizontal scroll
        has_h_scroll = scroll_width > client_width
        print(f"\n{'⚠️ ' if has_h_scroll else '✓'} HORIZONTAL SCROLL: {has_h_scroll}")
        
        if has_h_scroll:
            overflow = scroll_width - client_width
            print(f"  ⚠️  Page is {overflow}px wider than viewport!")
            
            # Find overflowing elements
            overflowing = page.evaluate('''() => {
                const elements = Array.from(document.querySelectorAll('*'));
                return elements
                    .filter(el => el.scrollWidth > el.clientWidth)
                    .map(el => ({
                        tag: el.tagName,
                        class: el.className || '',
                        id: el.id || '',
                        overflow: el.scrollWidth - el.clientWidth
                    }))
                    .sort((a, b) => b.overflow - a.overflow)
                    .slice(0, 10);
            }''')
            
            print("\n  Top 10 overflowing elements:")
            for i, el in enumerate(overflowing, 1):
                cls = f".{el['class']}" if el['class'] else ""
                id_str = f"#{el['id']}" if el['id'] else ""
                print(f"    {i}. {el['tag']}{cls}{id_str} → +{el['overflow']}px")
        
        # Take screenshots at scroll positions
        print(f"\n📸 SCREENSHOTS")
        viewport_height = 844
        y = 0
        num = 1
        
        while y < page_height:
            path = f"{output_dir}/pos_{num:02d}_y{y}.png"
            page.evaluate(f'window.scrollTo(0, {y})')
            time.sleep(0.2)
            page.screenshot(path=path)
            print(f"  ✓ pos_{num:02d}_y{y}.png")
            y += viewport_height - 100
            num += 1
            if num > 20:
                break
        
        # Full page
        full_path = f"{output_dir}/full_page.png"
        page.screenshot(path=full_path, full_page=True)
        print(f"  ✓ full_page.png")
        
        # Text readability
        print(f"\n📝 TEXT READABILITY")
        text_stats = page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, div'));
            const sizes = elements
                .filter(el => el.offsetParent !== null)
                .map(el => {
                    const style = window.getComputedStyle(el);
                    return parseFloat(style.fontSize);
                })
                .filter(size => size > 0);
            
            if (sizes.length === 0) return null;
            
            const sorted = sizes.sort((a, b) => a - b);
            return {
                min: sorted[0],
                max: sorted[sorted.length - 1],
                avg: sizes.reduce((a, b) => a + b) / sizes.length,
                count: sizes.length
            };
        }''')
        
        if text_stats:
            print(f"  Min font size: {text_stats['min']:.1f}px")
            print(f"  Max font size: {text_stats['max']:.1f}px")
            print(f"  Avg font size: {text_stats['avg']:.1f}px")
            print(f"  Elements checked: {text_stats['count']}")
            
            if text_stats['min'] < 12:
                print(f"  ⚠️  WARNING: Some text is too small (< 12px)")
                
                # Find small text elements
                small_text = page.evaluate('''() => {
                    const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li'));
                    return elements
                        .filter(el => {
                            if (el.offsetParent === null) return false;
                            const size = parseFloat(window.getComputedStyle(el).fontSize);
                            return size < 12;
                        })
                        .map(el => ({
                            tag: el.tagName,
                            class: el.className || '',
                            fontSize: parseFloat(window.getComputedStyle(el).fontSize),
                            text: el.textContent.trim().substring(0, 40)
                        }))
                        .slice(0, 5);
                }''')
                
                print(f"\n  Examples of small text:")
                for item in small_text:
                    print(f"    {item['tag']} ({item['fontSize']:.1f}px): {item['text'][:30]}...")
            else:
                print(f"  ✓ All text is readable (>= 12px)")
        
        # Images
        print(f"\n🖼️  IMAGES")
        img_info = page.evaluate('''() => {
            const images = Array.from(document.querySelectorAll('img'));
            const visible = images.filter(img => img.offsetParent !== null);
            const broken = visible.filter(img => img.naturalWidth === 0);
            const loaded = visible.filter(img => img.naturalWidth > 0);
            
            return {
                total: images.length,
                visible: visible.length,
                broken: broken.length,
                loaded: loaded.length,
                brokenSrcs: broken.map(img => img.src).slice(0, 5)
            };
        }''')
        
        print(f"  Total images: {img_info['total']}")
        print(f"  Visible: {img_info['visible']}")
        print(f"  Loaded: {img_info['loaded']}")
        
        if img_info['broken'] > 0:
            print(f"  ⚠️  Broken: {img_info['broken']}")
            for src in img_info['brokenSrcs']:
                print(f"    - {src}")
        else:
            print(f"  ✓ All visible images loaded successfully")
        
        # Navigation menu
        print(f"\n🍔 NAVIGATION MENU")
        menu_selectors = [
            '.hamburger',
            '.menu-toggle',
            '.mobile-menu',
            '.mobile-nav',
            '[class*="hamburger"]',
            '[class*="menu-icon"]',
            '[class*="mobile-menu"]',
            'button[aria-label*="menu" i]',
            'button[aria-label*="navigation" i]'
        ]
        
        menu_found = False
        menu_selector_found = None
        
        for selector in menu_selectors:
            try:
                el = page.query_selector(selector)
                if el and el.is_visible():
                    print(f"  ✓ Found menu: {selector}")
                    menu_found = True
                    menu_selector_found = selector
                    
                    # Get menu info
                    menu_info = page.evaluate(f'''() => {{
                        const el = document.querySelector('{selector}');
                        const rect = el.getBoundingClientRect();
                        return {{
                            tag: el.tagName,
                            visible: el.offsetParent !== null,
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        }};
                    }}''')
                    
                    print(f"    Tag: {menu_info['tag']}")
                    print(f"    Position: ({menu_info['x']:.0f}, {menu_info['y']:.0f})")
                    print(f"    Size: {menu_info['width']:.0f}x{menu_info['height']:.0f}")
                    
                    # Try clicking
                    try:
                        page.click(selector, timeout=2000)
                        time.sleep(0.5)
                        menu_path = f"{output_dir}/menu_opened.png"
                        page.screenshot(path=menu_path)
                        print(f"  ✓ Menu clicked and screenshot saved: menu_opened.png")
                        
                        # Close menu
                        page.click(selector, timeout=2000)
                        time.sleep(0.3)
                    except Exception as e:
                        print(f"  ⚠️  Could not interact with menu: {str(e)[:50]}")
                    
                    break
            except Exception as e:
                continue
        
        if not menu_found:
            print(f"  ⚠️  No hamburger menu found with common selectors")
            print(f"  Checking for any navigation elements...")
            
            nav_elements = page.evaluate('''() => {
                const navs = Array.from(document.querySelectorAll('nav, [role="navigation"]'));
                return navs.map(nav => ({
                    tag: nav.tagName,
                    class: nav.className || '',
                    id: nav.id || '',
                    visible: nav.offsetParent !== null
                }));
            }''')
            
            if nav_elements:
                print(f"  Found {len(nav_elements)} navigation elements:")
                for nav in nav_elements[:3]:
                    cls = f".{nav['class']}" if nav['class'] else ""
                    id_str = f"#{nav['id']}" if nav['id'] else ""
                    vis = "visible" if nav['visible'] else "hidden"
                    print(f"    {nav['tag']}{cls}{id_str} ({vis})")
        
        # Layout issues
        print(f"\n📐 LAYOUT CHECK")
        layout_issues = page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const issues = elements
                .filter(el => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return rect.right > window.innerWidth && 
                           style.position !== 'fixed' && 
                           style.position !== 'absolute' &&
                           el.offsetParent !== null;
                })
                .map(el => ({
                    tag: el.tagName,
                    class: el.className || '',
                    id: el.id || '',
                    right: el.getBoundingClientRect().right,
                    overflow: el.getBoundingClientRect().right - window.innerWidth
                }))
                .sort((a, b) => b.overflow - a.overflow)
                .slice(0, 10);
            
            return issues;
        }''')
        
        if len(layout_issues) > 0:
            print(f"  ⚠️  Found {len(layout_issues)} elements extending beyond viewport:")
            for i, el in enumerate(layout_issues, 1):
                cls = f".{el['class']}" if el['class'] else ""
                id_str = f"#{el['id']}" if el['id'] else ""
                print(f"    {i}. {el['tag']}{cls}{id_str} → extends {el['overflow']:.0f}px beyond viewport")
        else:
            print(f"  ✓ No elements extending beyond viewport")
        
        # Check for fixed positioning issues
        print(f"\n🔧 MOBILE-SPECIFIC CHECKS")
        
        # Check viewport meta tag
        viewport_meta = page.evaluate('''() => {
            const meta = document.querySelector('meta[name="viewport"]');
            return meta ? meta.content : null;
        }''')
        
        if viewport_meta:
            print(f"  ✓ Viewport meta tag: {viewport_meta}")
        else:
            print(f"  ⚠️  No viewport meta tag found!")
        
        # Check for touch-action
        touch_elements = page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('a, button'));
            return elements.filter(el => {
                const style = window.getComputedStyle(el);
                return style.touchAction !== 'auto';
            }).length;
        }''')
        
        print(f"  Touch-optimized elements: {touch_elements}")
        
        print(f"\n✅ COMPLETE!")
        print(f"  Screenshots saved to: {output_dir}/")
        print(f"  Total screenshots: {num}")
        
        browser.close()

if __name__ == '__main__':
    try:
        test_mobile()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
