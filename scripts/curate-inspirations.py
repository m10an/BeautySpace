"""Import reviewed short excerpts ONLY after verifying them against a supplied PDF.
Usage: python3 scripts/curate-inspirations.py source.pdf reviewed-selection.json
Selection: [{"id":"...","text":"exact excerpt","attributedAuthor":"as printed",
             "sourcePage":1,"reviewed":true}]
Requires local pdftotext. Never fetches or invents missing Goodreads entries.
"""
import hashlib
import json
import pathlib
import re
import subprocess
import sys

def compact(value):
    return re.sub(r'\s+', ' ', value).strip()

def curate(pdf, selection):
    raw = subprocess.check_output(['pdftotext', '-layout', str(pdf), '-'])
    pages = raw.decode('utf-8').split('\f')
    if not pages[-1].strip():
        pages.pop()
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    quotes, ids, texts = [], set(), set()
    for row in selection:
        text, author, page = row['text'], row['attributedAuthor'], row['sourcePage']
        if not isinstance(page, int) or isinstance(page, bool) or not 1 <= page <= len(pages):
            raise ValueError('Invalid source page')
        if row.get('reviewed') is not True or not isinstance(text, str) or not text.strip() or len(text) > 240:
            raise ValueError('Only reviewed short verbatim excerpts, maximum 240 characters')
        if compact(text) not in compact(pages[page - 1]) or not author.strip() or compact(author) not in compact(pages[page - 1]):
            raise ValueError('Quote/attribution not found on its specified PDF page; inspect extraction manually')
        if not row['id'] or row['id'] in ids or text in texts:
            raise ValueError('Duplicate or missing ID/text')
        ids.add(row['id']); texts.add(text)
        quotes.append({k: row[k] for k in ['id', 'text', 'attributedAuthor', 'sourcePage', 'reviewed']} | {'sourceSha256': digest})
    if not quotes:
        raise ValueError('No reviewed excerpts supplied')
    return {'version': 1, 'source': {'file': 'Buddhism Quotes (2755 quotes).pdf', 'sha256': digest, 'pageCount': len(pages), 'status': 'reviewed'}, 'quotes': quotes}

if __name__ == '__main__':
    source = pathlib.Path(sys.argv[1])
    result = curate(source, json.loads(pathlib.Path(sys.argv[2]).read_text()))
    # Validate completely before replacing the local dataset.
    pathlib.Path('inspiration.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"Imported {len(result['quotes'])} reviewed excerpts from {result['source']['pageCount']} visible PDF pages")
