# Fast parser for Argentine legislation (Ley, Decreto)
# Extended to correctly extract all articles and signatures for Decretos.
from __future__ import annotations  # Allow postponed evaluation of annotations for typing

import html as ihtml             # Standard library module for HTML entity unescaping
import re                         # Regular expression module
import sys                        # System-specific parameters and functions (for CLI)
from typing import Any, Dict, List, Optional, Tuple  # Type hints

import ujson as json  # Ultra-fast JSON parsing library, alias as json
from lxml import html  # lxml library for fast HTML parsing

__all__ = ["parse_laws"]  # Public API: only parse_laws is exported

# ---------------------------------------------------------------------------
# 1 ▸ REGEX
# ---------------------------------------------------------------------------

# Pattern to extract the "pie" (footnote) with edition, number, and validity
_PIE_RE = re.compile(
    r"e\.\s*(\d{2}/\d{2}/\d{4})\s*"   # "e. DD/MM/YYYY"
    r"N[º°]?\s*([0-9]+/[0-9]{2})\s*"     # "N° 1234/25"
    r"v\.\s*(\d{2}/\d{2}/\d{4})",      # "v. DD/MM/YYYY"
    re.I
)

# Templates for laws (use chapters and articles)
# Pattern to identify chapters: "CAPÍTULO I" or numeric
_CAP = re.compile(
    r"\n\s*CAP[ÍI]TULO\s+([IVXLCDM]+|\d+)\s*(.*?)\n",  # Capture roman/arabic chapter and its title
    re.I
)
# Pattern to capture articles within a chapter: "ARTÍCULO 1°.- Texto..."
_ART = re.compile(
    r"\n\s*ART[ÍI]CULO\s+(\d+)[º°]?[.\-–]\s*(.*?)\n(?=\s*ART[ÍI]CULO|CAP[ÍI]TULO|\Z)",
    re.S  # Dot matches newlines to allow multi-line article bodies
)

_DEC_START = re.compile(
    r"\bEL\s+PRESIDENTE\b.*?\bDECRETA\s*:", re.I | re.S
)  # bloque “EL PRESIDENTE … DECRETA:”



_FIRM_LINE = re.compile(
     r"(?:^|\n)\s*("                          # line start
     r"[A-ZÁÉÍÓÚÜÑ]"                          # first capital
     r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{2,}"        # rest of the word(s)
     r"(?:\s*-\s*"                            # “ - ” separator
     r"[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{2,})+"  # 1 + more names
     r")",
     re.M,
)

# ---------------------------------------------------------------------------
# 2 ▸ HELPERS
# ---------------------------------------------------------------------------

def _extract_pie_and_resto(txt: str) -> Tuple[Optional[Dict[str, str]], Optional[str]]:
    """
    Extrae el pie (fecha + número + validez) y todo lo que sigue como 'resto'.
    """
    m = _PIE_RE.search(txt)
    if not m:
        return None, None
    pie = {"edicion": m.group(1), "numero": m.group(2), "validez": m.group(3)}
    resto = txt[m.end():].strip()
    return pie, resto if resto else None

def _extract_nota(firma_block: str) -> Optional[str]:
    """
    After signatures, if there is a NOTA: block, extract it.
    """
    m = re.search(r"\bNOTA:\s*(.*?)(?:\n\s*e\.\s*\d{2}/\d{2}/\d{4}|$)", firma_block, re.I | re.S)
    return m.group(1).strip() if m else None

def _detect_blocks(txt: str) -> Tuple[str, str, str]:
    """
    Divide el decreto en: (preambulo, articulado, resto)
    - Usa _DEC_START para hallar el comienzo del articulado
    - Usa _FIRM_LINE para hallar la primera línea de firmas
    """
    m_dec = _DEC_START.search(txt)
    if not m_dec:
        return txt, "", ""

    pre = txt[: m_dec.end()].rstrip()

    tail = txt[m_dec.end() :]

    # Keywords to detect the start of signature-like endings
    _TRANSITION_RE = re.compile(r"\b(?:Comuníquese|Publíquese|Archívese|Dese a)\b", re.I)

    lines = tail.splitlines(keepends=True)
    art_buf, post_buf = [], []
    post_start = False

    for ln in lines:
        if not post_start and (_TRANSITION_RE.search(ln) or _FIRM_LINE.search(ln)):
            post_start = True
        (art_buf if not post_start else post_buf).append(ln)
    articulado = "".join(art_buf).strip()
    resto = "".join(post_buf).strip()
    return pre, articulado, resto

def _extract_signatures(firma_block: str) -> List[str]:
    """
    Recibe únicamente el bloque `resto` (todo lo que está después del articulado)
    y devuelve la lista de nombres.
    """
    # 1) Primer línea con ' - '
    m = _FIRM_LINE.search(firma_block)
    if not m:
        return []

    line = m.group(1)
    # 2) Cortar por ' - ' y limpiar
    names = [p.strip(" –—").strip() for p in line.split(" - ") if p.strip()]
    # 3) El primer elemento puede ser “MILEI” / “FERNÁNDEZ”; se incluye igual
    return names

def _extract_articles(articulado: str) -> List[Dict[str, Any]]:
    """
    Artículos dentro del bloque “articulado” (ya sin preámbulo).
    """
    hdr = re.compile(r"\bART[ÍI]CULO\s+(\d+)[º°]?\s*[.\-–]\s*", re.I)
    heads = list(hdr.finditer(articulado))
    arts: List[Dict[str, Any]] = []
    for i, h in enumerate(heads):
        start = h.end()
        end = heads[i + 1].start() if i + 1 < len(heads) else len(articulado)
        txt = articulado[start:end].lstrip("–-• ").strip()
        arts.append({"art": int(h.group(1)), "texto": txt})
    return arts

def _html2txt(raw: str) -> Tuple[str, Optional[html.HtmlElement]]:
    """
    Convert raw HTML string to plain text and parse tree.

    Returns:
    - txt: the cleaned text content
    - tree: lxml HTML tree (or None if no raw)
    """
    if not raw:
        return "", None  # Empty input yields empty text and no tree
    # Replace <br> tags with newline markers before parsing
    raw = raw.replace("<br", "\n<br")
    # Parse HTML into a tree for annex extraction
    tree = html.fromstring(raw)
    # Extract text content (strips tags)
    txt = tree.text_content()
    # Unescape HTML entities (&amp;, &#8220;, etc.)
    txt = ihtml.unescape(txt)
    # Normalize whitespace: collapse spaces/tabs and remove carriage returns
    txt = re.sub(r"[ \t]+", " ", txt).replace("\r", "")
    # Strip leading/trailing whitespace
    return txt.strip(), tree

def _extract_annexes(tree: Optional[html.HtmlElement]) -> List[Dict[str, str]]:
    """
    From the HTML tree, find all PDF links and label them as annexes.
    """
    if not tree:
        return []
    # XPath to find href attributes containing '.pdf'
    hrefs = tree.xpath("//a[contains(@href,'.pdf')]/@href")
    # Build list of annex dictionaries
    return [{"nombre": f"Anexo {i+1}", "url": href} for i, href in enumerate(hrefs)]

def _extract_pie(txt: str) -> Optional[Dict[str, str]]:
    """
    Extract the footnote (pie) with edition, number, and validity.
    """
    m = _PIE_RE.search(txt)
    if not m:
        return None  # No match → no pie
    return {"edicion": m.group(1), "numero": m.group(2), "validez": m.group(3)}

def _split_chapters(txt: str) -> List[Dict[str, Any]]:
    """
    Split a law (Ley) text into chapters and extract articles per chapter.

    Returns a list of chapters, each with:
      - capitulo: chapter number (Roman or arabic) or None
      - titulo: chapter title or None
      - articulos: list of {art: int, texto: str} in that chapter
    """
    caps = list(_CAP.finditer(txt))
    if not caps:
        # No chapters: treat whole text as one block
        return [{
            "capitulo": None,
            "titulo": None,
            # find all articles without chapters
            "articulos": [{"art": int(n), "texto": t.strip()} for n, t in _ART.findall(txt)]
        }]
    caps.append(re.Match)  # sentinel to simplify loop
    chapters = []
    for i, cap in enumerate(caps[:-1]):
        # Compute segment boundaries: after this cap to before next cap
        start = cap.end()
        end = caps[i+1].start() if i+1 < len(caps)-1 else len(txt)
        segment = txt[start:end]
        # Extract all articles in segment
        arts = [{"art": int(n), "texto": t.strip()} for n, t in _ART.findall(segment)]
        chapters.append({
            "capitulo": cap.group(1),
            "titulo": cap.group(2).strip() or None,
            "articulos": arts
        })
    return chapters

def _meta(rec: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract only relevant metadata fields from the record.
    """
    keys = [
        "id", "jurisdiccion", "claseNorma", "tipoNorma", "sancion", "publicacion",
        "idNormas", "tituloSumario", "tituloResumido", "nroBoletin", "pagBoletin"
    ]
    # Build dict with present keys only
    return {k: rec.get(k) for k in keys if k in rec}


def _limpiar_articulo_final(articulos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Limpia firmas o nota pegadas al último artículo.
    """
    if not articulos:
        return articulos

    texto = articulos[-1]["texto"]

    # Cortar si hay una línea con firma
    firm_m = _FIRM_LINE.search(texto)
    if firm_m:
        texto = texto[:firm_m.start()].strip()

    # Cortar si hay una NOTA:
    nota_m = re.search(r"\bNOTA:\s.*", texto, re.I | re.S)
    if nota_m:
        texto = texto[:nota_m.start()].strip()

    articulos[-1]["texto"] = texto
    return articulos

# ---------------------------------------------------------------------------
# 3 ▸ PARSER
# ---------------------------------------------------------------------------
def parse_laws(rec: Dict[str, Any]) -> Dict[str, Any]:
    txt, tree = _html2txt(rec.get("textoNorma", ""))

    # Initialize defaults
    preamb = {"contexto": None, "visto": None, "considerando": None}
    cuerpo = []
    firmas = []
    nota = None
    pie = None
    resto = None

    if rec.get("tipoNorma") == "Decreto":
        pre, articulado, resto = _detect_blocks(txt)

        ctx = re.search(r"Ciudad.*?\d{4}", pre)
        visto = re.search(r"\bVISTO\s+(.*?)\n\s*CONSIDERANDO", pre, re.I | re.S)
        cons = re.search(r"\bCONSIDERANDO[ :]?(.*?)$", pre, re.I | re.S)
        preamb = {
            "contexto": ctx.group(0).strip() if ctx else None,
            "visto": (visto.group(1).strip() if visto else None),
            "considerando": (cons.group(1).strip() if cons else None),
        }

        cuerpo = _extract_articles(articulado)
        firmas = _extract_signatures(resto)
        nota = _extract_nota(resto)
        pie, resto = _extract_pie_and_resto(txt)

    elif rec.get("tipoNorma") == "Ley":
        preamb = {"contexto": None, "visto": None, "considerando": None}
        cuerpo = _extract_articles(txt)
        cuerpo = _limpiar_articulo_final(cuerpo)  # <-- aplicar limpieza solo al último artículo
        firmas = _extract_signatures(txt)
        nota = _extract_nota(txt)
        pie, resto = _extract_pie_and_resto(txt)

    return {
        "meta": _meta(rec),
        "preambulo": preamb,
        "cuerpo": cuerpo,
        "firmas": firmas,
        "nota": nota,
        "anexos": _extract_annexes(tree),
        "pie": pie,
        "resto": resto,
    }
# ---------------------------------------------------------------------------
# 4 ▸ CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Read JSON records from stdin and print parsed output as JSON
    for line in sys.stdin:
        if not line.strip():
            continue  # Skip blank lines
        try:
            rec = json.loads(line)  # Parse input JSON
            print(json.dumps(parse_laws(rec), ensure_ascii=False))
        except Exception as e:
            # On error, print JSON with error message and record ID
            print(json.dumps({"error": str(e), "id": rec.get("id")}))


def parse_norma(raw_record: dict) -> dict:          # <- alias público
    return parse_laws(raw_record)