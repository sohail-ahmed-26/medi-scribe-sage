import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseIngester:
    def __init__(self):
        url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
        key = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in .env")
        self.supabase: Client = create_client(url, key)
        
    def _batch(self, lst, n=300):
        for i in range(0, len(lst), n):
            yield lst[i:i + n]
            
    def ingest(self, kb):
        medicines = kb.get("medicines", [])
        if medicines:
            for b in self._batch(medicines):
                self.supabase.table("medicines").upsert(b, on_conflict="name").execute()
            
        conditions = kb.get("conditions", [])
        if conditions:
            for b in self._batch(conditions):
                self.supabase.table("conditions").upsert(b, on_conflict="name").execute()
            
        links = kb.get("links", [])
        if links:
            ms = self.supabase.table("medicines").select("id,name").execute().data
            cs = self.supabase.table("conditions").select("id,name").execute().data
            mi = {m['name'].lower(): m['id'] for m in ms}
            ci = {c['name'].lower(): c['id'] for c in cs}
            
            rows = []
            for l in links:
                m_id = mi.get(l['medicine'].lower())
                c_id = ci.get(l['condition'].lower())
                if m_id and c_id:
                    rows.append({
                        "medicine_id": m_id,
                        "condition_id": c_id,
                        "notes": l.get("notes")
                    })
            if rows:
                for b in self._batch(rows):
                    self.supabase.table("medicine_conditions").upsert(b).execute()
                
        chunks = kb.get("chunks", [])
        if chunks:
            db_chunks = []
            for c in chunks:
                db_chunks.append({
                    "book": c['book'],
                    "page": c.get('page'),
                    "content": c['content'],
                    "embedding": c.get('embedding')
                })
            for b in self._batch(db_chunks, 100):
                self.supabase.table("book_chunks").insert(b).execute()
