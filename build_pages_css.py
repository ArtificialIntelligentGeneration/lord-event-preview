#!/usr/bin/env python3
"""Build clean pages.css by extracting page-specific CSS from source files.

Works directly from styles.css (Love) and site.css (Schastye/Radost),
deduplicating properties and removing content covered by tokens.css/core.css.
"""
import re
from collections import OrderedDict


# ── Patterns ──────────────────────────────────────────────────────────────────

DEAD_CLOUD_RE = re.compile(
    r'\.cloud-layer|\.cloud-[bf]\d+|\.sky-cloud|\.cloud-\d+'
    r'|\.cloud\s*$|\.cloud\s*[{,:]|\.cloud\s|\.sky-haze|\.haze-\d+'
)
DEAD_CLOUD_KF = {'cloudDriftX', 'cloudBobY', 'cloudBreath'}

SKIP_SELECTORS_RE = re.compile(r"""
    ^:root\s*$
    |^\*[,\s{]|^\*$
    |^html\s*$|^body\s*$
    |^img\s*$|^a\s*[{:]|^a\s*$
    |^h[1-4]\s*[{,\s]|^h[1-4]\s*$
    |^h[1-4],|^p\s*$
    |^\.container\s*$
    |^\.section\s*[{+]|^\.section$
    |^\.section-tight\s*$
    |^\.page-shell
    |^body\.lord-loading(?!.*page-love)(?!.*schastye)(?!.*radost)
    |^body\.page-leaving
    |^\.lord-loader(?!\s*--)
    |^\.lord-loader__
    |^\.radost-boot-loader
    |^html\.radost-boot-loading
    |^\.reveal\b
    |^body\.reveal-enabled
    |^\.form\b|^\.form-
    |^\.page-footer|^\.footer-
    |^\.btn\s*$|^\.btn\s*:
    |^\.btn-primary\s*$|^\.btn-primary\s*:|^\.btn-primary::
    |^\.btn-ghost\s*$|^\.btn-ghost\s*:
    |^\.btn-secondary\s*$|^\.btn-secondary\s*:
    |main-header-clone
    |^\.site-header|^\.header-row|^\.nav-wrap
    |^\.brand\s*$|^\.brand-|^\.brand::
    |^\.menu\s|^\.menu-toggle
    |^\.header-actions
    |^\.site-nav\s|^\.site-nav$
    |^\.floating-call-widget(?!--love|--schastye|--radost)
    |^footer\s*$
    |^\.contact-wrap\s|^\.contact-card\s
    |^\.parallax\s*$
    |^@keyframes\s+(?:lordLoaderSpin|lordLoadingFailSafe|ring-spin
        |radostLoaderLineSweep|radostLoaderPulse|radostLoaderShapeFloat
        |schastyeLoaderLineSweep|schastyeLoaderPulse
        |radostBootLineSweep|radostBootShapeFloat
        |cloneCrownFly|cloneGoldFlow|floatingWidgetPulse)
""", re.VERBOSE)

TOKENS_RE = re.compile(r"""
    ^--lord-gold|^--lord-liquid|^--lord-mac-radius|^--lord-bg-
    |lordGoldFlow\b|lordGradientFlow|lordRadostLoaderFlow
""", re.VERBOSE)

# Selectors that are core.css header even with page-prefix
KEEP_HEADER_RE = re.compile(
    r'header-write|header-chat|header-actions-rich|header-actions-love'
)
CORE_HEADER_RE = re.compile(
    r'main-header-clone|\.header-row[^-]|\.nav-wrap'
    r'|\.brand(?:-big|-small|::)|\.menu(?:\s|-)(?!-toggle-icon)'
    r'|\.site-nav\b|cloneCrownFly|cloneGoldFlow'
)

CORE_LOADER_RE = re.compile(
    r'\.lord-loader|\.radost-boot-loader|radost-boot-loading'
    r'|lordLoaderSpin|lordLoadingFailSafe|radostLoaderLine'
    r'|radostLoaderPulse|radostLoaderShape|radostBootLine'
    r'|radostBootShape|schastyeLoader'
)

OLD_VERSION_RE = re.compile(
    r'radost-v2(?!\d)|radost-v3(?!\d)'
    r'|\.rad-hero|\.rad-catalog|\.rad-ribbon|\.rad-gallery'
    r'|\.rad-adv|\.rad-trust|\.rad-price|\.rad-faq|\.rad-badge'
    r'|\.rad-head\b|\.rad-v2'
)

DEAD_SELECTORS_RE = re.compile(
    r'^\.bridge-grid|^\.bridge-card|^\.objection|^\.accent-love'
    r'|^\.love-card\b|^\.motion-section|^\.pricing-grid'
    r'|^\.floral-title|^\.floral-wrap|^\.floral-media|^\.flower-pin'
    r'|^\.media-flower|^\.mf-|^\.fp-'
    r'|^\.love-grid\b'
    r'|^\.marquee\b|^\.marquee-|^\.marquee:'
)


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_blocks(css):
    """Parse CSS into blocks: comments, rules, @-rules."""
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
            end = (end + 2) if end != -1 else n
            blocks.append({'type': 'comment', 'text': css[i:end]})
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
        selector = css[i:brace].strip()
        body = css[brace+1:j].strip()
        blocks.append({
            'type': 'at-rule' if selector.startswith('@') else 'rule',
            'selector': selector,
            'body': body,
            'full': css[i:j+1],
        })
        i = j + 1
    return blocks


def norm(s):
    return ' '.join(s.split())


def parse_props(body):
    """Parse CSS declarations from a body string."""
    props = OrderedDict()
    i = 0
    n = len(body)
    while i < n:
        while i < n and body[i] in ' \t\n\r':
            i += 1
        if i >= n:
            break
        if body[i:i+2] == '/*':
            end = body.find('*/', i + 2)
            i = (end + 2) if end != -1 else n
            continue
        semi = i
        paren_depth = 0
        while semi < n:
            if body[semi] == '(':
                paren_depth += 1
            elif body[semi] == ')':
                paren_depth -= 1
            elif body[semi] == ';' and paren_depth == 0:
                break
            semi += 1
        decl = body[i:semi].strip()
        i = semi + 1
        if not decl:
            continue
        colon = decl.find(':')
        if colon <= 0:
            continue
        name = decl[:colon].strip()
        value = decl[colon+1:].strip()
        if name and not name.startswith('@') and not name.startswith('{'):
            props[name] = value
    return props


# ── Filter checks ─────────────────────────────────────────────────────────────

def is_dead_cloud(sel, body=''):
    kf = re.match(r'@keyframes\s+([\w-]+)', sel)
    if kf and kf.group(1) in DEAD_CLOUD_KF:
        return True
    parts = [p.strip() for p in sel.split(',') if p.strip()]
    cloud_parts = [p for p in parts if DEAD_CLOUD_RE.search(p)]
    if cloud_parts and len(cloud_parts) == len(parts):
        return True
    return False


def should_skip(sel, body=''):
    """Check if a block should be skipped (already in core/tokens or dead)."""
    if is_dead_cloud(sel, body):
        return True
    ns = norm(sel)
    if SKIP_SELECTORS_RE.search(ns):
        if not KEEP_HEADER_RE.search(ns):
            return True
    if CORE_HEADER_RE.search(ns) and not KEEP_HEADER_RE.search(ns):
        return True
    if CORE_LOADER_RE.search(ns):
        return True
    if OLD_VERSION_RE.search(ns):
        return True
    if DEAD_SELECTORS_RE.search(ns):
        return True
    if is_dead_selector(ns):
        return True
    return False


def classify(sel, body=''):
    """Classify a block as love/schastye/radost/shared."""
    txt = sel + ' ' + body[:100]
    l = bool(re.search(r'page-love|\.love-|love-mobile', txt))
    s = bool(re.search(r'schastye|theme-schastye|\.sch-', txt))
    r = bool(re.search(r'radost|theme-radost|\.joy-|\.rad-|\.rad_', txt))
    if l and not s and not r: return 'love'
    if s and not l and not r: return 'schastye'
    if r and not l and not s: return 'radost'
    if s and r and not l: return 'shared_sr'
    if l or s or r: return 'multi'
    return 'love_unscoped'


# ── Merger ────────────────────────────────────────────────────────────────────

class CSSMerger:
    """Accumulates CSS blocks and merges properties for identical selectors."""
    
    def __init__(self):
        self.top_level = OrderedDict()  # norm(sel) -> {sel, props, full, section}
        self.media = OrderedDict()      # norm(media_sel) -> OrderedDict(norm(inner_sel) -> ...)
        self.keyframes = OrderedDict()  # kf_name -> full_text
        self.supports = []
    
    def add_block(self, block, source=''):
        if block['type'] == 'comment':
            return
        
        sel = block['selector']
        body = block.get('body', '')
        
        if should_skip(sel, body):
            return
        
        if sel.startswith('@keyframes'):
            kf = re.match(r'@keyframes\s+([\w-]+)', sel)
            if kf:
                self.keyframes[kf.group(1)] = block['full']
            return
        
        if sel.startswith('@supports'):
            return
        
        if sel.startswith('@media'):
            self._add_media(sel, body, source)
            return
        
        self._merge_rule(self.top_level, sel, body, source)
    
    def _add_media(self, media_sel, media_body, source):
        key = norm(media_sel)
        if key not in self.media:
            self.media[key] = {'selector': media_sel, 'rules': OrderedDict()}
        
        inner_blocks = parse_blocks(media_body)
        for ib in inner_blocks:
            if ib['type'] == 'comment':
                continue
            isel = ib.get('selector', '')
            ibody = ib.get('body', '')
            if should_skip(isel, ibody):
                continue
            if is_dead_cloud(isel, ibody):
                continue
            self._merge_rule(self.media[key]['rules'], isel, ibody, source)
    
    def _merge_rule(self, store, sel, body, source):
        ns = norm(sel)
        props = parse_props(body)
        sec = classify(sel, body)
        
        if ns in store:
            if props:
                store[ns]['props'].update(props)
            if sec != 'love_unscoped':
                store[ns]['section'] = sec
        else:
            store[ns] = {
                'selector': sel,
                'props': OrderedDict(props) if props else OrderedDict(),
                'raw_body': body if not props else None,
                'section': sec,
                'source': source,
            }
    
    def output(self):
        """Generate the final CSS organized by section."""
        sections = {
            'love': [],
            'love_unscoped': [],
            'schastye': [],
            'radost': [],
            'shared_sr': [],
            'multi': [],
        }
        
        for ns, data in self.top_level.items():
            sec = data['section']
            css = self._format_rule(data)
            if css:
                sections.setdefault(sec, []).append(css)
        
        media_sections = {
            'love': OrderedDict(),
            'love_unscoped': OrderedDict(),
            'schastye': OrderedDict(),
            'radost': OrderedDict(),
            'shared_sr': OrderedDict(),
            'multi': OrderedDict(),
        }
        
        for mkey, mdata in self.media.items():
            for ns, rdata in mdata['rules'].items():
                sec = rdata['section']
                css = self._format_rule(rdata, indent='  ')
                if css:
                    ms = media_sections.setdefault(sec, OrderedDict())
                    if mkey not in ms:
                        ms[mkey] = {'selector': mdata['selector'], 'rules': []}
                    ms[mkey]['rules'].append(css)
        
        kf_sections = {'love': [], 'love_unscoped': [], 'schastye': [], 
                       'radost': [], 'shared_sr': [], 'multi': []}
        for name, full in self.keyframes.items():
            txt = full[:100]
            if 'love' in name.lower():
                kf_sections['love'].append(full)
            elif 'schastye' in name.lower() or 'sch' in name.lower():
                kf_sections['schastye'].append(full)
            elif 'radost' in name.lower() or 'joy' in name.lower():
                kf_sections['radost'].append(full)
            else:
                kf_sections['love_unscoped'].append(full)
        
        parts = ['/* LORD Pages v1 — page-specific styles for Love, Schastye, Radost */\n']
        
        def emit_section(label, sec_keys):
            sec_parts = [f'\n/* {"═"*3} {label} {"═"*3} */\n']
            has_content = False
            
            for sk in sec_keys:
                for rule in sections.get(sk, []):
                    sec_parts.append(rule)
                    has_content = True
                
                for kf in kf_sections.get(sk, []):
                    sec_parts.append(kf)
                    has_content = True
                
                ms = media_sections.get(sk, {})
                for mkey, mdata in ms.items():
                    if mdata['rules']:
                        inner = '\n\n'.join(mdata['rules'])
                        sec_parts.append(f"{mdata['selector']} {{\n{inner}\n}}")
                        has_content = True
            
            if has_content:
                parts.append('\n\n'.join(sec_parts))
        
        emit_section('LOVE', ['love', 'love_unscoped'])
        emit_section('SCHASTYE', ['schastye'])
        emit_section('RADOST', ['radost'])
        emit_section('SHARED', ['shared_sr', 'multi'])
        
        return '\n\n'.join(parts) + '\n'
    
    def _format_rule(self, data, indent=''):
        sel = data['selector']
        props = data['props']
        raw = data.get('raw_body')
        
        if not props and raw:
            if raw.strip():
                lines = raw.strip().split('\n')
                formatted = '\n'.join(f'{indent}  {l.strip()}' for l in lines if l.strip())
                return f"{indent}{sel} {{\n{formatted}\n{indent}}}"
            return None
        
        if not props:
            return None
        
        prop_lines = []
        for name, value in props.items():
            prop_lines.append(f'{indent}  {name}: {value};')
        
        return f"{indent}{sel} {{\n" + '\n'.join(prop_lines) + f"\n{indent}}}"


# ── HTML class scanner ─────────────────────────────────────────────────────────

def get_html_classes():
    """Extract all CSS class names used in inner page HTML files."""
    classes = set()
    for path in ['love/index.html', 'schastye/index.html', 'radost/index.html']:
        try:
            with open(path) as f:
                html = f.read()
            for match in re.findall(r'class="([^"]*)"', html):
                for cls in match.split():
                    classes.add(cls)
        except FileNotFoundError:
            pass
    return classes

HTML_CLASSES = None

def is_dead_selector(sel):
    """Check if a selector references classes not present in any HTML."""
    global HTML_CLASSES
    if HTML_CLASSES is None:
        HTML_CLASSES = get_html_classes()
    
    css_classes = re.findall(r'\.([\w][\w-]*)', sel)
    if not css_classes:
        return False
    
    if any(cls in HTML_CLASSES for cls in css_classes):
        return False
    
    for cls in css_classes:
        if cls.startswith('page-') or cls.startswith('theme-') or cls.startswith('is-'):
            return False
        if cls.startswith('header-') or cls.startswith('site-'):
            return False
    
    return True

UNUSED_KEYFRAMES = set()

def find_unused_keyframes(css_text, kf_names):
    """Find @keyframes that are never referenced in animation properties."""
    refs = set()
    for m in re.finditer(r'animation(?:-name)?\s*:\s*([^;]+)', css_text):
        for word in re.findall(r'[\w-]+', m.group(1)):
            if word in kf_names:
                refs.add(word)
    return kf_names - refs


# ── Main ──────────────────────────────────────────────────────────────────────

def process_styles_css(merger):
    """Extract Love-specific CSS from styles.css."""
    with open('styles.css') as f:
        css = f.read()
    
    blocks = parse_blocks(css)
    in_page_section = False
    
    for b in blocks:
        if b['type'] == 'comment':
            continue
        
        sel = b.get('selector', '')
        
        if not in_page_section:
            if re.search(r'\.scene|\.page-love|body\.page-love|\.flower', sel):
                in_page_section = True
            else:
                continue
        
        merger.add_block(b, source='styles')


def process_site_css(merger):
    """Extract Schastye/Radost CSS from site.css."""
    with open('assets/css/site.css') as f:
        css = f.read()
    
    blocks = parse_blocks(css)
    
    in_page_section = False
    
    for b in blocks:
        if b['type'] == 'comment':
            continue
        
        sel = b.get('selector', '')
        body = b.get('body', '')
        
        if not in_page_section:
            if re.search(r'\.site-backdrop|body\.theme-schastye|body\.theme-radost|\.theme-schastye|\.theme-radost', sel):
                in_page_section = True
            elif re.search(r'Themes|Direction-specific', b.get('text', '')):
                continue
            else:
                continue
        
        merger.add_block(b, source='site')


def main():
    merger = CSSMerger()
    
    print("Processing styles.css (Love)...")
    process_styles_css(merger)
    
    print("Processing site.css (Schastye/Radost)...")
    process_site_css(merger)
    
    output = merger.output()
    
    # Fix URL paths: styles.css URLs are root-relative, need to be relative to assets/css/
    output = re.sub(r'url\("assets/', 'url("../', output)
    
    # Remove unused @keyframes in a second pass
    kf_names = set(re.findall(r'@keyframes\s+([\w-]+)', output))
    unused = find_unused_keyframes(output, kf_names)
    if unused:
        for name in unused:
            pat = r'@keyframes\s+' + re.escape(name) + r'\s*\{'
            m = re.search(pat, output)
            if m:
                start = m.start()
                depth = 0
                i = m.end() - 1
                while i < len(output):
                    if output[i] == '{':
                        depth += 1
                    elif output[i] == '}':
                        depth -= 1
                        if depth == 0:
                            output = output[:start] + output[i+1:]
                            break
                    i += 1
        output = re.sub(r'\n{3,}', '\n\n', output)
        print(f"  Removed {len(unused)} unused @keyframes: {', '.join(sorted(unused)[:10])}{'...' if len(unused) > 10 else ''}")
    
    with open('assets/css/pages.css', 'w') as f:
        f.write(output)
    
    line_count = output.count('\n')
    
    print(f"\nOutput: assets/css/pages.css ({line_count} lines)")
    print(f"  Top-level rules: {len(merger.top_level)}")
    print(f"  @media groups: {len(merger.media)}")
    print(f"  @keyframes: {len(merger.keyframes)}")
    
    love = sum(1 for d in merger.top_level.values() if d['section'] in ('love', 'love_unscoped'))
    sch = sum(1 for d in merger.top_level.values() if d['section'] == 'schastye')
    rad = sum(1 for d in merger.top_level.values() if d['section'] == 'radost')
    shared = sum(1 for d in merger.top_level.values() if d['section'] in ('shared_sr', 'multi'))
    print(f"  Love rules: {love}, Schastye: {sch}, Radost: {rad}, Shared: {shared}")


if __name__ == '__main__':
    main()
