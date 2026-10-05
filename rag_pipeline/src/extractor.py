import re

class Extractor:
    def extract(self, chunk, book, page):
        medicines = []
        conditions = []
        links = []
        
        # Simple heuristics for medicines and potencies
        potency_matches = re.finditer(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(30C|200C|1M|10M|6X|12X|Q)', chunk)
        for m in potency_matches:
            name = m.group(1).strip()
            potency = m.group(2).strip()
            medicines.append({
                "name": name,
                "description": f"Extracted from {book} page {page}",
                "uses": "",
                "why_used": "",
                "potencies": [potency],
                "source": f"{book}:{page}"
            })
            
        # Simple heuristics for conditions
        condition_matches = re.finditer(r'(?:indicated for|useful in|symptoms of|suffering from)\s+([A-Za-z\s]+)(?:[.,;])', chunk)
        for m in condition_matches:
            c_name = m.group(1).strip().lower()
            if 3 < len(c_name) < 50:
                conditions.append({
                    "name": c_name,
                    "description": "",
                    "symptoms": [c_name],
                    "source": f"{book}:{page}"
                })
                if medicines:
                    links.append({
                        "medicine": medicines[-1]['name'],
                        "condition": c_name,
                        "notes": f"Linked via heuristic in {book} page {page}"
                    })
                    
        return medicines, conditions, links
