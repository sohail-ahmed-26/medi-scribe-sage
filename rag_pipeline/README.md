# Homeopathic RAG Pipeline

This is an end-to-end, zero-paid-API RAG pipeline for ingesting homeopathic reference books into a local Supabase instance.

## Features
- Parses PDF, EPUB, DOCX, and TXT using Python libraries.
- Cleans and chunks text efficiently.
- Uses `sentence-transformers/all-MiniLM-L6-v2` to create 384-dimensional embeddings locally on CPU.
- Uses basic heuristics to extract Medicines and Conditions.
- Automatically pushes directly to the connected Supabase instance using `supabase-py`.

## Requirements
Python 3.11+
Optional: Tesseract OCR for image-based PDFs.

## Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or venv\Scripts\activate on Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r rag_pipeline/requirements.txt
   ```
3. Place your books in the `documents/` or `books/` folder in the repository root.

## Running
Run the master orchestrator:
```bash
python rag_pipeline/run.py
```

This will:
- Process the books
- Extract entities
- Generate 384-dim embeddings
- Export `knowledge.json` and `report.txt` in `rag_pipeline/output/`
- Direct insert the data into Supabase `medicines`, `conditions`, `medicine_conditions`, and `book_chunks` tables.

## Verification
Use the offline search tool to verify knowledge extraction without querying the database:
```bash
python rag_pipeline/search.py "arnica"
```
