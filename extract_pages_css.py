#!/usr/bin/env python3
"""Extract page-specific CSS from styles.css and site.css into pages.css."""
import re

DEAD_CLOUD_SELECTORS = re.compile(
    r'\.cloud-layer'
    r'|\.cloud-[bf]\d+'
    r'|\.sky-cloud'
    r'|\.cloud-\d+'
    r'|\.cloud\s*\{'
    r'|\.cloud\s*,'
    r'|\.cloud\s*$'
    r'|\.cloud::'
    r'|\.sky-haze'
    r'|\.haze-\d+'
)

KEEP_SELECTORS = re.compile(
    r'\.hero-float|\.flower-layer|\.flower'
)

DEAD_CLOUD_KEYFRAMES = {'cloudDriftX', 'cloudBobY', 'cloudBreath'}

CORE_SHARED_START = re.compile(
    r'^(?:\*\s*$|\*\s*,|html\s*$|body\s*$|:root\s*$|img\s*$|a\s*$|a:|'
    r'h[1-4]\s*[,$]|p\s*$|\.container\s*$|\.section\s|'
    r'body\.lord-loading(?!.*page-love)(?!.*schastye)(?!.*radost)|'
    r'body\.page-leaving(?!.*page-love)|'
    r'\.lord-loader(?!.*page-love)(?!.*schastye)(?!.*radost)|'
    r'@keyframes\s+(?:lordLoadingFailSafe|lordLoaderSpin|ring-spin)|'
    r'header\s*,|main\s*,|footer\s*,|'
    r'header\s*$|main\s*$|footer\s*$)'
)


def parse_blocks(css):
    blocks = []
    i = 0
    n = len(css)
    while i < n:
        while i < n and css[i] in ' \t\n\r':
            i += 1
        if i >= n:
            break
        if css[i:i+2] == '/*':
            end = css.find('*/', i + 2)
            if end == -1:
                end = n
            else:
                end += 2
            blocks.append(css[i:end])
            i = end
            continue
        brace = css.find('{', i)
        if brace == -1:
            break
        depth = 0
        j = brace
        while j < n:
            if css[j] == '{':
                depth += 1
            elif css[j] == '}':
                depth -= 1
                if depth == 0:
                    break
            j += 1
        blocks.append(css[i:j+1])
        i = j + 1
    return blocks


def is_dead_cloud_block(block):
    s = block.strip()
    if s.startswith('/*'):
        return False

    kf = re.match(r'@keyframes\s+([\w-]+)', s)
    if kf and kf.group(1) in DEAD_CLOUD_KEYFRAMES:
        return True

    brace = s.find('{')
    if brace == -1:
        return False
    selector = s[:brace]

    sel_parts = [p.strip() for p in selector.split(',') if p.strip()]

    cloud_parts = [p for p in sel_parts if DEAD_CLOUD_SELECTORS.search(p)]
    non_cloud_parts = [p for p in sel_parts if not DEAD_CLOUD_SELECTORS.search(p)]

    if cloud_parts and not non_cloud_parts:
        return True

    return False


def strip_cloud_selectors(block):
    """Remove cloud selectors from comma-separated selector lists, keep the rest."""
    s = block.strip()
    if s.startswith('/*') or s.startswith('@keyframes'):
        return block

    brace = s.find('{')
    if brace == -1:
        return block

    selector = s[:brace]
    body = s[brace:]

    sel_parts = [p.strip() for p in selector.split(',') if p.strip()]
    cleaned = [p for p in sel_parts if not DEAD_CLOUD_SELECTORS.search(p)]

    if len(cleaned) == len(sel_parts):
        return block
    if not cleaned:
        return None

    new_selector = ',\n  '.join(cleaned)
    return new_selector + ' ' + body


def is_styles_shared_base(block):
    s = block.strip()
    if s.startswith('/*'):
        return False
    brace = s.find('{')
    if brace == -1:
        return False
    selector = s[:brace].strip()
    return bool(CORE_SHARED_START.match(selector))


def filter_media_block_love(block):
    m = re.match(r'(@media[^{]+)\{', block)
    if not m:
        return block

    media_selector = m.group(1).strip()
    inner_start = m.end()
    inner_end = block.rfind('}')
    if inner_end <= inner_start:
        return block

    inner_css = block[inner_start:inner_end]
    inner_blocks = parse_blocks(inner_css)

    kept = []
    for ib in inner_blocks:
        ibs = ib.strip()
        if ibs.startswith('/*'):
            kept.append(ib)
            continue
        if is_dead_cloud_block(ib):
            continue
        if is_styles_shared_base(ib):
            continue
        cleaned = strip_cloud_selectors(ib)
        if cleaned:
            kept.append(cleaned)

    if not any(not b.strip().startswith('/*') for b in kept):
        return None

    result = media_selector + ' {\n'
    for b in kept:
        lines = b.strip().split('\n')
        for line in lines:
            result += '  ' + line + '\n'
        result += '\n'
    result += '}'
    return result


def process_love_css(filepath):
    with open(filepath, 'r') as f:
        css = f.read()

    blocks = parse_blocks(css)
    kept = []
    past_shared = False

    for block in blocks:
        s = block.strip()
        if not s:
            continue

        if s.startswith('/*'):
            if past_shared:
                kept.append(block)
            continue

        brace = s.find('{')
        if brace != -1:
            selector = s[:brace].strip()

            if not past_shared:
                if selector.startswith('.scene') or selector.startswith('.page-love') or selector.startswith('body.page-love'):
                    past_shared = True
                elif is_styles_shared_base(block):
                    continue
                else:
                    continue

        if is_dead_cloud_block(block):
            continue

        if s.startswith('@media'):
            filtered = filter_media_block_love(block)
            if filtered:
                kept.append(filtered)
            continue

        kf = re.match(r'@keyframes\s+([\w-]+)', s)
        if kf and kf.group(1) in DEAD_CLOUD_KEYFRAMES:
            continue

        cleaned = strip_cloud_selectors(block)
        if cleaned:
            kept.append(cleaned)

    return '\n\n'.join(b for b in kept if b.strip())


def process_site_css(filepath):
    with open(filepath, 'r') as f:
        css = f.read()

    marker = '.site-backdrop'
    idx = css.find(marker)
    if idx == -1:
        return css

    comment_start = css.rfind('\n', 0, idx)
    if comment_start == -1:
        comment_start = 0

    return css[comment_start:]


def categorize_site_blocks(blocks):
    shared_sr = []
    schastye_only = []
    radost_only = []
    pending_comments = []

    for block in blocks:
        s = block.strip()
        if not s:
            continue

        if s.startswith('/*'):
            pending_comments.append(block)
            continue

        full_text = s
        has_sch = bool(re.search(r'schastye|theme-schastye', full_text))
        has_rad = bool(re.search(r'radost|theme-radost', full_text))

        if not has_sch and not has_rad:
            shared_sr.extend(pending_comments)
            pending_comments = []
            shared_sr.append(block)
        elif has_sch and has_rad:
            shared_sr.extend(pending_comments)
            pending_comments = []
            shared_sr.append(block)
        elif has_sch:
            schastye_only.extend(pending_comments)
            pending_comments = []
            schastye_only.append(block)
        elif has_rad:
            radost_only.extend(pending_comments)
            pending_comments = []
            radost_only.append(block)

    return shared_sr, schastye_only, radost_only


def main():
    styles_path = 'styles.css'
    site_path = 'assets/css/site.css'
    out_path = 'assets/css/pages.css'

    print("Extracting Love CSS from styles.css...")
    love_css = process_love_css(styles_path)

    print("Extracting Schastye/Radost CSS from site.css...")
    site_css = process_site_css(site_path)
    site_blocks = parse_blocks(site_css)

    shared_sr, schastye_only, radost_only = categorize_site_blocks(site_blocks)

    header = '/* LORD Pages v1 \u2014 page-specific styles for Love, Schastye, Radost */\n'

    love_section = '\n/* \u2550\u2550\u2550 LOVE \u2550\u2550\u2550 */\n\n'
    love_section += love_css

    sch_section = '\n\n/* \u2550\u2550\u2550 SCHASTYE \u2550\u2550\u2550 */\n\n'
    sch_section += '\n\n'.join(b for b in schastye_only if b.strip())

    rad_section = '\n\n/* \u2550\u2550\u2550 RADOST \u2550\u2550\u2550 */\n\n'
    rad_section += '\n\n'.join(b for b in radost_only if b.strip())

    shared_section = '\n\n/* \u2550\u2550\u2550 SCHASTYE + RADOST SHARED \u2550\u2550\u2550 */\n\n'
    shared_section += '\n\n'.join(b for b in shared_sr if b.strip())

    output = header + love_section + sch_section + rad_section + shared_section + '\n'

    with open(out_path, 'w') as f:
        f.write(output)

    line_count = output.count('\n')
    print(f"Written {out_path} ({line_count} lines)")


if __name__ == '__main__':
    main()
