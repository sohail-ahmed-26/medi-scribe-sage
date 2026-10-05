import os
import pypdf
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import docx
import pytesseract
from PIL import Image
import io

class DocumentReader:
    def __init__(self, use_ocr=True):
        self.use_ocr = use_ocr
        self.ocr_failures = 0
        self.total_pages = 0
        self.skipped_pages = 0
        
    def read_directory(self, dir_path):
        documents = []
        if not os.path.exists(dir_path):
            return documents
        for filename in sorted(os.listdir(dir_path)):
            filepath = os.path.join(dir_path, filename)
            if os.path.isfile(filepath):
                docs = self.read_file(filepath)
                documents.extend(docs)
        return documents

    def read_file(self, filepath):
        ext = os.path.splitext(filepath)[1].lower()
        if ext == '.pdf':
            return self._read_pdf(filepath)
        elif ext == '.epub':
            return self._read_epub(filepath)
        elif ext == '.docx':
            return self._read_docx(filepath)
        elif ext == '.txt':
            return self._read_txt(filepath)
        return []

    def _read_pdf(self, filepath):
        book_title = os.path.basename(filepath)
        try:
            with open(filepath, "rb") as f:
                reader = pypdf.PdfReader(f)
                pages = []
                for i, page in enumerate(reader.pages):
                    self.total_pages += 1
                    text = page.extract_text() or ""
                    
                    if len(text.strip()) > 0:
                        pages.append({"book": book_title, "page": i + 1, "content": text})
                    else:
                        self.skipped_pages += 1
                return pages
        except Exception:
            return []

    def _read_epub(self, filepath):
        book_title = os.path.basename(filepath)
        try:
            book = epub.read_epub(filepath)
        except Exception:
            return []
            
        pages = []
        section_idx = 1
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                self.total_pages += 1
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                text = soup.get_text(separator='\n')
                if len(text.strip()) > 0:
                    pages.append({"book": book_title, "page": section_idx, "content": text})
                    section_idx += 1
                else:
                    self.skipped_pages += 1
        return pages

    def _read_docx(self, filepath):
        book_title = os.path.basename(filepath)
        doc = docx.Document(filepath)
        self.total_pages += 1
        text = "\n".join([para.text for para in doc.paragraphs])
        if len(text.strip()) > 0:
            return [{"book": book_title, "page": 1, "content": text}]
        else:
            self.skipped_pages += 1
            return []

    def _read_txt(self, filepath):
        book_title = os.path.basename(filepath)
        self.total_pages += 1
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        if len(text.strip()) > 0:
            return [{"book": book_title, "page": 1, "content": text}]
        else:
            self.skipped_pages += 1
            return []
