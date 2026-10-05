import re

class TextCleaner:
    def clean(self, text):
        # Remove consecutive empty lines
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Repair line-break hyphenation (e.g. "medi-\ncine" -> "medicine")
        text = re.sub(r'([a-zA-Z])-\n([a-zA-Z])', r'\1\2', text)
        
        # Normalize whitespace (but keep newlines)
        text = re.sub(r'[ \t]+', ' ', text)
        
        return text.strip()
