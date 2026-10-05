import os
import json
import hashlib
from src.reader import DocumentReader
from src.cleaner import TextCleaner
from src.chunker import TextChunker
from src.extractor import Extractor
from src.embedder import Embedder
from src.direct_ingest import SupabaseIngester
from tqdm import tqdm

def main():
    books_dir = os.path.join(os.path.dirname(__file__), '..', 'documents')
    if not os.path.exists(books_dir):
        books_dir = os.path.join(os.path.dirname(__file__), '..', 'books')
    
    if not os.path.exists(books_dir):
        os.makedirs(books_dir)
        print(f"Created {books_dir}. Please place books there.")
        return

    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    os.makedirs(output_dir, exist_ok=True)
    
    print("Initializing models and modules...")
    reader = DocumentReader(use_ocr=False) # Fast test mode without OCR system dependencies
    cleaner = TextCleaner()
    chunker = TextChunker()
    extractor = Extractor()
    embedder = Embedder()
    kb = {
        "medicines": [],
        "conditions": [],
        "links": [],
        "chunks": []
    }
    
    seen_medicines = set()
    seen_conditions = set()

    print("Reading books...")
    pages = reader.read_directory(books_dir)
    print(f"Read {reader.total_pages} pages, skipped {reader.skipped_pages}.")
    
    print("Processing pages...")
    for page in tqdm(pages):
        clean_text = cleaner.clean(page['content'])
        chunks = chunker.chunk(clean_text)
        
        for c_text in chunks:
            meds, conds, links = extractor.extract(c_text, page['book'], page['page'])
            
            for m in meds:
                if m['name'].lower() not in seen_medicines:
                    kb['medicines'].append(m)
                    seen_medicines.add(m['name'].lower())
            
            for c in conds:
                if c['name'].lower() not in seen_conditions:
                    kb['conditions'].append(c)
                    seen_conditions.add(c['name'].lower())
                    
            kb['links'].extend(links)
            
            kb['chunks'].append({
                "book": page['book'],
                "page": page['page'],
                "content": c_text
            })

    print(f"Generated {len(kb['chunks'])} chunks. Embedding...")
    chunk_texts = [c['content'] for c in kb['chunks']]
    if chunk_texts:
        embeddings = embedder.embed_batch(chunk_texts)
        for c, emb in zip(kb['chunks'], embeddings):
            c['embedding'] = emb
            
    print("Writing knowledge.json...")
    with open(os.path.join(output_dir, 'knowledge.json'), 'w', encoding='utf-8') as f:
        json.dump(kb, f)
        
    print("Writing report.txt...")
    with open(os.path.join(output_dir, 'report.txt'), 'w', encoding='utf-8') as f:
        f.write(f"Total Pages Read: {reader.total_pages}\n")
        f.write(f"Total Pages Skipped: {reader.skipped_pages}\n")
        f.write(f"OCR Failures: {reader.ocr_failures}\n")
        f.write(f"Medicines Extracted: {len(kb['medicines'])}\n")
        f.write(f"Conditions Extracted: {len(kb['conditions'])}\n")
        f.write(f"Chunks Generated: {len(kb['chunks'])}\n")

    print("Ingesting into Supabase...")
    try:
        ingester = SupabaseIngester()
        ingester.ingest(kb)
        print("Direct Supabase ingestion complete!")
    except Exception as e:
        print(f"\n[Notice] Direct ingestion failed: {e}")
        print("Note: Your environment is using a custom Lovable publishable key which the Python Supabase client cannot parse.")
        print("You can easily import the generated data via the web app:")
        print("1. Start your app (`npm run dev`)")
        print("2. Sign in to the clinic app")
        print("3. Navigate to 'Import books'")
        print(f"4. Upload the generated file: {os.path.join(output_dir, 'knowledge.json')}\n")
        
    print("Pipeline complete!")

if __name__ == "__main__":
    main()
