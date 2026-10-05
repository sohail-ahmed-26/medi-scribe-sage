import sys
import json
import os

def search():
    if len(sys.argv) < 2:
        print("Usage: python search.py 'query'")
        return
        
    query = sys.argv[1].lower()
    
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    kb_path = os.path.join(output_dir, 'knowledge.json')
    
    if not os.path.exists(kb_path):
        print("knowledge.json not found. Run the pipeline first.")
        return
        
    with open(kb_path, 'r', encoding='utf-8') as f:
        kb = json.load(f)
        
    print(f"Searching for '{query}'...")
    
    print("\n--- Medicines ---")
    for m in kb.get('medicines', []):
        if query in m['name'].lower() or query in (m.get('description') or '').lower():
            print(f"- {m['name']} (Potencies: {m.get('potencies', [])})")
            
    print("\n--- Conditions ---")
    for c in kb.get('conditions', []):
        if query in c['name'].lower():
            print(f"- {c['name']}")
            
    print("\n--- Chunks ---")
    matches = 0
    for c in kb.get('chunks', []):
        if query in c['content'].lower():
            print(f"[{c['book']} p.{c['page']}] {c['content'][:100]}...")
            matches += 1
            if matches >= 5:
                break
                
if __name__ == "__main__":
    search()
