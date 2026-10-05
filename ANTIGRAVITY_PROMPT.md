# Antigravity prompt — build the book knowledge base

Copy everything below into Antigravity, with your PDF/EPUB/TXT books inside a folder named `books/`.

---

You are a data engineer. Build an offline, free RAG ingestion pipeline (Python, no paid APIs) in a folder `rag_pipeline/` of this repo.

**Input:** every file in `books/` (PDF, EPUB, TXT, DOCX). Medical / homeopathic materia medica and repertory books.

**Steps**
1. Extract text page-by-page (`pymupdf` for PDF, `ebooklib` for EPUB, `python-docx`). OCR scanned pages with `pytesseract` when a page has < 50 chars.
2. Clean text (remove headers/footers, page numbers, hyphenation line-breaks).
3. Chunk: ~800 characters, 120 overlap, never split mid-sentence; keep `book` (file name without extension) and `page`.
4. Embed chunks locally with `sentence-transformers/all-MiniLM-L6-v2` (384 dims — must stay 384). Store in a persistent **ChromaDB** collection `materia` at `rag_pipeline/chroma/` (for local semantic search / QA).
5. Structured extraction (the important part). For each medicine entry in the books extract:
   - `name` (canonical, Title Case, e.g. "Arnica Montana"), `description` (1–2 lines), `uses` (diseases/complaints it treats, comma list), `why_used` (key indication / mechanism / keynote, 1–3 lines), `potencies` (e.g. ["30C","200C","Q","Mother Tincture 30ml"]), `source` ("Book, p.X").
   For each disease/condition: `name`, `description`, `symptoms` (array of short phrases), `source`.
   Links: `{ "medicine", "condition", "notes" }` for every medicine ↔ disease relation found (repertory rubrics are great sources).
   Use rule-based parsing of headings first (medicine names are usually headings in materia medica). If a local LLM is available via Ollama (`llama3.1:8b` or `qwen2.5:7b`), use it with JSON-only output for each chunk to fill fields; otherwise use regex + heading heuristics. Deduplicate by lowercase name and merge fields.
6. Write ONE file `rag_pipeline/output/knowledge.json` with exactly this shape:
```json
{
  "medicines": [{"name":"","description":"","uses":"","why_used":"","potencies":[],"source":""}],
  "conditions": [{"name":"","description":"","symptoms":[],"source":""}],
  "links": [{"medicine":"","condition":"","notes":""}],
  "chunks": [{"book":"","page":1,"content":"","embedding":[0.0]}]
}
```
   If the file exceeds ~40 MB, split into `knowledge_1.json`, `knowledge_2.json`… (each same shape).
7. Add `rag_pipeline/README.md`, `requirements.txt`, and a single command `python rag_pipeline/run.py` that does everything and is re-runnable (skips unchanged books via file hash cache).
8. Print a summary: books, pages, chunks, medicines, conditions, links.
9. Do NOT commit `books/` or `chroma/` (add to `.gitignore`). Commit the pipeline code and `output/knowledge*.json`, then push to GitHub.

**Quality bar:** no hallucinated medicines — every record must come from book text and include `source`. Validate JSON schema before writing.

---

After it finishes: open the app → **Import books** → upload `knowledge.json`. Search works instantly and free (database full-text + fuzzy search).
