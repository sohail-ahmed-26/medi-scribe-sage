# Antigravity: offline book ingestion for City Homeopathic Clinic

Clone this repository, place your legally obtained PDF, EPUB, TXT or DOCX books in `books/`, then paste everything below into Antigravity. The clinic application already exists; do not replace its pages or change its database schema to complete this task.

---

You are a senior data engineer and medical-information extraction engineer. Work in this cloned repository and build a **local, reproducible, no-paid-API** ingestion pipeline. The book corpus is user-supplied in `books/` (PDF, EPUB, TXT, DOCX); never invent clinical claims, medicine names, potencies, dosages, diseases, symptoms, references, or book text. Do not send private files to cloud models or third-party APIs. Output is for clinician reference, not automated diagnosis or treatment advice.

## Existing application contract — read these before coding

1. Read `src/routes/_authenticated/import.tsx`, `src/lib/knowledge.ts`, `src/integrations/supabase/types.ts`, and `AGENTS.md`. Preserve their exact data contract and existing 384-dimensional vector size.
2. The in-app **Import books** page accepts JSON objects with four arrays:
   ```json
   {
     "medicines": [{"name":"","description":"","uses":"","why_used":"","potencies":[],"source":""}],
     "conditions": [{"name":"","description":"","symptoms":[],"source":""}],
     "links": [{"medicine":"","condition":"","notes":""}],
     "chunks": [{"book":"","page":1,"content":"","embedding":[0.0]}]
   }
   ```
   `embedding` must actually contain **384 finite numbers**; `[0.0]` above is only a shape example. `name` values used in links must match their medicine/condition names exactly, including capitalization. `source` must identify a real book and page or EPUB section. Avoid adding fields the import page does not expect.
3. The current importer upserts medicines/conditions but appends chunks and has no duplicate-safe book replacement. Do not call the import repeatedly for the same corpus without first implementing a safe, doctor-authorized replacement/deduplication strategy in the app, or explicitly warn the operator that re-import duplicates passages. If output is split across files, keep each entity and any links that depend on it in the same importable batch or coordinate import order so links resolve; verify against the existing importer. Do not silently drop links.

## Build `rag_pipeline/`

- Add `run.py`, focused extraction/normalization/validation modules, `requirements.txt`, `README.md`, and tests. Provide a single entry command: `python rag_pipeline/run.py`. Use Python 3.11+ and pinned compatible dependency versions. Use PyMuPDF for PDFs, ebooklib + BeautifulSoup for EPUB, python-docx for DOCX, UTF-8 text for TXT. OCR image-only PDF pages with pytesseract when extracted text is under 50 non-whitespace characters; document the separate Tesseract system install. Record OCR failures without pretending extraction succeeded.
- Process pages/EPUB sections in a deterministic order. Normalize Unicode and whitespace, repair line-break hyphenation, and remove recurring headers/footers conservatively (do not erase medically relevant text). Never mix pages without preserving citation metadata. Chunk near 800 characters with roughly 120 characters overlap, preferably at sentence boundaries; retain `book`, integer page (or documented EPUB section mapping), and exact source content. Empty/unreadable passages are excluded and reported.
- Use local `sentence-transformers/all-MiniLM-L6-v2` for **384-dimensional** chunk embeddings, in batches on CPU by default; validate dimensionality, finiteness and deterministic ordering. Optionally maintain local Chroma collection `materia` under `rag_pipeline/chroma/` for developer-side QA, but the app's import reads **JSON**, not Chroma. No paid embeddings, no query-time model calls.
- Extract medicine entries, conditions, their symptoms, relationships, indications and explicitly stated potencies only from source passages. Start with heading/rubric heuristics; an **optional local** Ollama model may help propose structured candidates, but every proposed field must be checked against an attributable source passage before acceptance. If extraction is ambiguous, omit the claim and add it to a human-review report. Do not infer a potency from general knowledge. Keep multiple citations in a traceable review sidecar, while preserving the import-compatible `source` string. Deduplicate canonical names case-insensitively; merge only non-conflicting sourced facts. Preserve clinical wording rather than making efficacy claims stronger than the source.
- Write `rag_pipeline/output/knowledge.json`, or `knowledge_1.json`, `knowledge_2.json`, etc. if size is too large for a practical browser upload (target under 40 MB each). Each file must have the exact four-array shape. Handle cross-file medicine-condition links carefully as noted above. Generate a separate report with book/page counts, OCR failures, candidate records rejected, duplicate conflicts and unsourced assertions. The report is not imported.
- Cache by file SHA-256 so reruns skip unchanged extraction and embeddings; changing a book invalidates its records, and deleted books disappear from newly generated output. Write outputs atomically so interruptions never leave half-written JSON. Add `books/`, `rag_pipeline/chroma/`, model caches, and temporary files to `.gitignore`. Do not commit copyrighted books or private patient data. Only commit output JSON if the book owner explicitly authorizes it; otherwise ignore output and tell the operator how to import it locally.

## Acceptance checks

Add and run tests using a tiny synthetic fixture corpus that **you create**, not copyrighted medical text. Check multi-format extraction, OCR fallback with a mocked OCR call, chunk overlap/page citations, 384-dimensional finite vectors, canonical-name/link resolution, unchanged reruns, removed books, invalid JSON rejection and split-file import order. Validate every JSON record before writing. Manually inspect a sample of source-to-extracted-claim mappings and show the reviewer where to approve uncertain entries. Print counts of books, pages, passages, medicines, conditions, links, skipped pages and failures. Give exact setup/run/import steps in the README. Do not alter production patient records, publish the app, or push to a remote without asking the repository owner.

---

After generation, sign in to the clinic app → **Import books** → select the generated `knowledge.json` file. Review medical content before clinical use. For split files or re-imports, follow the pipeline's verified ordering and duplicate-handling instructions first.