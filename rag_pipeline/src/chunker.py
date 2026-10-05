import re

class TextChunker:
    def __init__(self, target_size=800, overlap=120):
        self.target_size = target_size
        self.overlap = overlap
        
    def chunk(self, text):
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= self.target_size:
                current_chunk += sentence + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                # Start new chunk with overlap
                if len(current_chunk) > self.overlap:
                    overlap_text = current_chunk[-self.overlap:]
                    match = re.search(r'[.!?]\s+', overlap_text)
                    if match:
                        overlap_text = overlap_text[match.end():]
                else:
                    overlap_text = current_chunk
                
                current_chunk = overlap_text + sentence + " "
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks
