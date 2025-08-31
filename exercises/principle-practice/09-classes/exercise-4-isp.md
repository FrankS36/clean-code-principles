# Exercise 4: Interface Segregation Principle (ISP)

Master the Interface Segregation Principle by learning to design focused, client-specific interfaces that prevent classes from depending on methods they don't use.

## 🎯 Learning Objectives

By completing this exercise, you will:
- Recognize violations of the Interface Segregation Principle
- Identify "fat" interfaces that force unnecessary dependencies
- Design small, focused interfaces for specific client needs
- Apply interface composition to build complex contracts
- Understand the relationship between ISP and coupling
- Practice role-based interface design

## 📝 Exercise Format

Each problem presents large, monolithic interfaces that violate ISP by forcing clients to depend on methods they don't use. Your job is to segregate these interfaces into focused, client-specific contracts.

---

## Problem 1: Document Processing System

### Current Code (Java)
```java
// ❌ Violates ISP - forces all document processors to implement all methods
public interface DocumentProcessor {
    
    // Text processing methods
    String extractText(Document document);
    void replaceText(Document document, String oldText, String newText);
    int getWordCount(Document document);
    List<String> getKeywords(Document document);
    void applyTextFormatting(Document document, TextFormat format);
    
    // Image processing methods
    List<BufferedImage> extractImages(Document document);
    void resizeImages(Document document, int width, int height);
    void compressImages(Document document, double compressionRatio);
    void watermarkImages(Document document, String watermarkText);
    BufferedImage generateThumbnail(Document document);
    
    // Metadata processing methods
    DocumentMetadata extractMetadata(Document document);
    void updateMetadata(Document document, DocumentMetadata metadata);
    List<String> getAuthor(Document document);
    Date getCreationDate(Document document);
    Date getLastModifiedDate(Document document);
    
    // Conversion methods
    void convertToPDF(Document document, String outputPath);
    void convertToHTML(Document document, String outputPath);
    void convertToDocx(Document document, String outputPath);
    void convertToTxt(Document document, String outputPath);
    void convertToMarkdown(Document document, String outputPath);
    
    // Security methods
    void encryptDocument(Document document, String password);
    void decryptDocument(Document document, String password);
    boolean verifySignature(Document document);
    void addDigitalSignature(Document document, Certificate certificate);
    void setPermissions(Document document, DocumentPermissions permissions);
    
    // Collaboration methods
    void addComment(Document document, Comment comment);
    List<Comment> getComments(Document document);
    void trackChanges(Document document, boolean enabled);
    List<Change> getChanges(Document document);
    void mergeChanges(Document document, List<Change> changes);
    
    // Analysis methods
    DocumentStatistics analyzeDocument(Document document);
    List<String> detectLanguages(Document document);
    double calculateReadabilityScore(Document document);
    List<String> findPlagiarism(Document document, List<Document> corpus);
    Map<String, Double> analyzesentiment(Document document);
    
    // Validation methods
    List<ValidationError> validateDocument(Document document);
    boolean isDocumentValid(Document document);
    void fixValidationErrors(Document document);
    List<String> checkSpelling(Document document);
    List<String> checkGrammar(Document document);
}

// ❌ PDF processor forced to implement methods it doesn't support
public class PDFProcessor implements DocumentProcessor {
    
    // PDF processors can handle text extraction
    @Override
    public String extractText(Document document) {
        if (!(document instanceof PDFDocument)) {
            throw new UnsupportedOperationException("PDFProcessor only handles PDF documents");
        }
        
        PDFDocument pdf = (PDFDocument) document;
        // Implementation for PDF text extraction
        return extractPDFText(pdf);
    }
    
    @Override
    public int getWordCount(Document document) {
        String text = extractText(document);
        return text.split("\\s+").length;
    }
    
    @Override
    public List<String> getKeywords(Document document) {
        // Basic keyword extraction
        String text = extractText(document);
        return extractKeywordsFromText(text);
    }
    
    // PDF processors can extract images
    @Override
    public List<BufferedImage> extractImages(Document document) {
        PDFDocument pdf = (PDFDocument) document;
        return extractPDFImages(pdf);
    }
    
    @Override
    public BufferedImage generateThumbnail(Document document) {
        PDFDocument pdf = (PDFDocument) document;
        return generatePDFThumbnail(pdf);
    }
    
    // ❌ ISP Violation: Forced to implement methods that don't make sense for PDFs
    @Override
    public void replaceText(Document document, String oldText, String newText) {
        throw new UnsupportedOperationException("PDF text replacement not supported - PDFs are read-only");
    }
    
    @Override
    public void applyTextFormatting(Document document, TextFormat format) {
        throw new UnsupportedOperationException("PDF text formatting not supported - PDFs are read-only");
    }
    
    @Override
    public void resizeImages(Document document, int width, int height) {
        throw new UnsupportedOperationException("PDF image manipulation not supported");
    }
    
    @Override
    public void compressImages(Document document, double compressionRatio) {
        throw new UnsupportedOperationException("PDF image compression not supported");
    }
    
    @Override
    public void watermarkImages(Document document, String watermarkText) {
        throw new UnsupportedOperationException("PDF image watermarking not supported");
    }
    
    // Metadata methods - PDFs support these
    @Override
    public DocumentMetadata extractMetadata(Document document) {
        PDFDocument pdf = (PDFDocument) document;
        return extractPDFMetadata(pdf);
    }
    
    @Override
    public List<String> getAuthor(Document document) {
        DocumentMetadata metadata = extractMetadata(document);
        return metadata.getAuthors();
    }
    
    @Override
    public Date getCreationDate(Document document) {
        DocumentMetadata metadata = extractMetadata(document);
        return metadata.getCreationDate();
    }
    
    @Override
    public Date getLastModifiedDate(Document document) {
        DocumentMetadata metadata = extractMetadata(document);
        return metadata.getLastModifiedDate();
    }
    
    // ❌ ISP Violation: PDFs can't be modified, so metadata updates don't make sense
    @Override
    public void updateMetadata(Document document, DocumentMetadata metadata) {
        throw new UnsupportedOperationException("PDF metadata updates not supported");
    }
    
    // Conversion methods - PDFs can convert to other formats
    @Override
    public void convertToHTML(Document document, String outputPath) {
        PDFDocument pdf = (PDFDocument) document;
        convertPDFToHTML(pdf, outputPath);
    }
    
    @Override
    public void convertToTxt(Document document, String outputPath) {
        String text = extractText(document);
        writeTextToFile(text, outputPath);
    }
    
    // ❌ ISP Violation: PDF to PDF conversion doesn't make sense
    @Override
    public void convertToPDF(Document document, String outputPath) {
        throw new UnsupportedOperationException("PDF is already in PDF format");
    }
    
    @Override
    public void convertToDocx(Document document, String outputPath) {
        throw new UnsupportedOperationException("PDF to DOCX conversion not implemented");
    }
    
    @Override
    public void convertToMarkdown(Document document, String outputPath) {
        throw new UnsupportedOperationException("PDF to Markdown conversion not implemented");
    }
    
    // Security methods - PDFs support some of these
    @Override
    public boolean verifySignature(Document document) {
        PDFDocument pdf = (PDFDocument) document;
        return verifyPDFSignature(pdf);
    }
    
    // ❌ ISP Violation: Can't modify read-only PDFs
    @Override
    public void encryptDocument(Document document, String password) {
        throw new UnsupportedOperationException("PDF encryption not supported in this implementation");
    }
    
    @Override
    public void decryptDocument(Document document, String password) {
        throw new UnsupportedOperationException("PDF decryption not supported in this implementation");
    }
    
    @Override
    public void addDigitalSignature(Document document, Certificate certificate) {
        throw new UnsupportedOperationException("PDF signing not supported in this implementation");
    }
    
    @Override
    public void setPermissions(Document document, DocumentPermissions permissions) {
        throw new UnsupportedOperationException("PDF permission setting not supported");
    }
    
    // ❌ ISP Violation: Collaboration features don't apply to read-only PDFs
    @Override
    public void addComment(Document document, Comment comment) {
        throw new UnsupportedOperationException("PDF commenting not supported");
    }
    
    @Override
    public List<Comment> getComments(Document document) {
        throw new UnsupportedOperationException("PDF comments not supported");
    }
    
    @Override
    public void trackChanges(Document document, boolean enabled) {
        throw new UnsupportedOperationException("PDF change tracking not supported");
    }
    
    @Override
    public List<Change> getChanges(Document document) {
        throw new UnsupportedOperationException("PDF change tracking not supported");
    }
    
    @Override
    public void mergeChanges(Document document, List<Change> changes) {
        throw new UnsupportedOperationException("PDF change merging not supported");
    }
    
    // Analysis methods - PDFs can support some of these
    @Override
    public DocumentStatistics analyzeDocument(Document document) {
        String text = extractText(document);
        return analyzeTextStatistics(text);
    }
    
    @Override
    public List<String> detectLanguages(Document document) {
        String text = extractText(document);
        return detectLanguagesInText(text);
    }
    
    @Override
    public double calculateReadabilityScore(Document document) {
        String text = extractText(document);
        return calculateReadabilityForText(text);
    }
    
    @Override
    public List<String> findPlagiarism(Document document, List<Document> corpus) {
        String text = extractText(document);
        return findPlagiarismInText(text, corpus);
    }
    
    @Override
    public Map<String, Double> analyzesentiment(Document document) {
        String text = extractText(document);
        return analyzeSentimentInText(text);
    }
    
    // Validation methods
    @Override
    public List<ValidationError> validateDocument(Document document) {
        return validatePDFStructure((PDFDocument) document);
    }
    
    @Override
    public boolean isDocumentValid(Document document) {
        List<ValidationError> errors = validateDocument(document);
        return errors.isEmpty();
    }
    
    // ❌ ISP Violation: Can't fix read-only PDFs
    @Override
    public void fixValidationErrors(Document document) {
        throw new UnsupportedOperationException("PDF validation error fixing not supported");
    }
    
    @Override
    public List<String> checkSpelling(Document document) {
        String text = extractText(document);
        return checkSpellingInText(text);
    }
    
    @Override
    public List<String> checkGrammar(Document document) {
        String text = extractText(document);
        return checkGrammarInText(text);
    }
    
    // Helper methods (implementations omitted for brevity)
    private String extractPDFText(PDFDocument pdf) { /* implementation */ return ""; }
    private List<String> extractKeywordsFromText(String text) { /* implementation */ return new ArrayList<>(); }
    private List<BufferedImage> extractPDFImages(PDFDocument pdf) { /* implementation */ return new ArrayList<>(); }
    private BufferedImage generatePDFThumbnail(PDFDocument pdf) { /* implementation */ return null; }
    private DocumentMetadata extractPDFMetadata(PDFDocument pdf) { /* implementation */ return null; }
    private void convertPDFToHTML(PDFDocument pdf, String outputPath) { /* implementation */ }
    private void writeTextToFile(String text, String outputPath) { /* implementation */ }
    private boolean verifyPDFSignature(PDFDocument pdf) { /* implementation */ return false; }
    private DocumentStatistics analyzeTextStatistics(String text) { /* implementation */ return null; }
    private List<String> detectLanguagesInText(String text) { /* implementation */ return new ArrayList<>(); }
    private double calculateReadabilityForText(String text) { /* implementation */ return 0.0; }
    private List<String> findPlagiarismInText(String text, List<Document> corpus) { /* implementation */ return new ArrayList<>(); }
    private Map<String, Double> analyzeSentimentInText(String text) { /* implementation */ return new HashMap<>(); }
    private List<ValidationError> validatePDFStructure(PDFDocument pdf) { /* implementation */ return new ArrayList<>(); }
    private List<String> checkSpellingInText(String text) { /* implementation */ return new ArrayList<>(); }
    private List<String> checkGrammarInText(String text) { /* implementation */ return new ArrayList<>(); }
}

// ❌ Word processor forced to implement methods it doesn't need
public class WordDocumentProcessor implements DocumentProcessor {
    
    // Word documents support text manipulation
    @Override
    public String extractText(Document document) {
        WordDocument doc = (WordDocument) document;
        return extractWordText(doc);
    }
    
    @Override
    public void replaceText(Document document, String oldText, String newText) {
        WordDocument doc = (WordDocument) document;
        replaceWordText(doc, oldText, newText);
    }
    
    @Override
    public int getWordCount(Document document) {
        String text = extractText(document);
        return text.split("\\s+").length;
    }
    
    @Override
    public List<String> getKeywords(Document document) {
        String text = extractText(document);
        return extractKeywordsFromText(text);
    }
    
    @Override
    public void applyTextFormatting(Document document, TextFormat format) {
        WordDocument doc = (WordDocument) document;
        applyWordFormatting(doc, format);
    }
    
    // ❌ ISP Violation: Word documents might not have images
    @Override
    public List<BufferedImage> extractImages(Document document) {
        WordDocument doc = (WordDocument) document;
        return extractWordImages(doc); // Might return empty list
    }
    
    @Override
    public void resizeImages(Document document, int width, int height) {
        WordDocument doc = (WordDocument) document;
        resizeWordImages(doc, width, height);
    }
    
    @Override
    public void compressImages(Document document, double compressionRatio) {
        WordDocument doc = (WordDocument) document;
        compressWordImages(doc, compressionRatio);
    }
    
    @Override
    public void watermarkImages(Document document, String watermarkText) {
        WordDocument doc = (WordDocument) document;
        watermarkWordImages(doc, watermarkText);
    }
    
    @Override
    public BufferedImage generateThumbnail(Document document) {
        WordDocument doc = (WordDocument) document;
        return generateWordThumbnail(doc);
    }
    
    // Metadata support
    @Override
    public DocumentMetadata extractMetadata(Document document) {
        WordDocument doc = (WordDocument) document;
        return extractWordMetadata(doc);
    }
    
    @Override
    public void updateMetadata(Document document, DocumentMetadata metadata) {
        WordDocument doc = (WordDocument) document;
        updateWordMetadata(doc, metadata);
    }
    
    @Override
    public List<String> getAuthor(Document document) {
        DocumentMetadata metadata = extractMetadata(document);
        return metadata.getAuthors();
    }
    
    @Override
    public Date getCreationDate(Document document) {
        DocumentMetadata metadata = extractMetadata(document);
        return metadata.getCreationDate();
    }
    
    @Override
    public Date getLastModifiedDate(Document document) {
        DocumentMetadata metadata = extractMetadata(document);
        return metadata.getLastModifiedDate();
    }
    
    // Conversion support
    @Override
    public void convertToPDF(Document document, String outputPath) {
        WordDocument doc = (WordDocument) document;
        convertWordToPDF(doc, outputPath);
    }
    
    @Override
    public void convertToHTML(Document document, String outputPath) {
        WordDocument doc = (WordDocument) document;
        convertWordToHTML(doc, outputPath);
    }
    
    @Override
    public void convertToTxt(Document document, String outputPath) {
        String text = extractText(document);
        writeTextToFile(text, outputPath);
    }
    
    @Override
    public void convertToMarkdown(Document document, String outputPath) {
        WordDocument doc = (WordDocument) document;
        convertWordToMarkdown(doc, outputPath);
    }
    
    // ❌ ISP Violation: Word to Word conversion doesn't make sense
    @Override
    public void convertToDocx(Document document, String outputPath) {
        throw new UnsupportedOperationException("Word document is already in DOCX format");
    }
    
    // ❌ ISP Violation: Security features might not be supported
    @Override
    public void encryptDocument(Document document, String password) {
        throw new UnsupportedOperationException("Word document encryption not implemented");
    }
    
    @Override
    public void decryptDocument(Document document, String password) {
        throw new UnsupportedOperationException("Word document decryption not implemented");
    }
    
    @Override
    public boolean verifySignature(Document document) {
        throw new UnsupportedOperationException("Word document signature verification not implemented");
    }
    
    @Override
    public void addDigitalSignature(Document document, Certificate certificate) {
        throw new UnsupportedOperationException("Word document signing not implemented");
    }
    
    @Override
    public void setPermissions(Document document, DocumentPermissions permissions) {
        throw new UnsupportedOperationException("Word document permissions not implemented");
    }
    
    // Collaboration support
    @Override
    public void addComment(Document document, Comment comment) {
        WordDocument doc = (WordDocument) document;
        addWordComment(doc, comment);
    }
    
    @Override
    public List<Comment> getComments(Document document) {
        WordDocument doc = (WordDocument) document;
        return getWordComments(doc);
    }
    
    @Override
    public void trackChanges(Document document, boolean enabled) {
        WordDocument doc = (WordDocument) document;
        setWordTrackChanges(doc, enabled);
    }
    
    @Override
    public List<Change> getChanges(Document document) {
        WordDocument doc = (WordDocument) document;
        return getWordChanges(doc);
    }
    
    @Override
    public void mergeChanges(Document document, List<Change> changes) {
        WordDocument doc = (WordDocument) document;
        mergeWordChanges(doc, changes);
    }
    
    // Analysis methods (implementations similar to PDF processor)
    @Override
    public DocumentStatistics analyzeDocument(Document document) {
        String text = extractText(document);
        return analyzeTextStatistics(text);
    }
    
    @Override
    public List<String> detectLanguages(Document document) {
        String text = extractText(document);
        return detectLanguagesInText(text);
    }
    
    @Override
    public double calculateReadabilityScore(Document document) {
        String text = extractText(document);
        return calculateReadabilityForText(text);
    }
    
    @Override
    public List<String> findPlagiarism(Document document, List<Document> corpus) {
        String text = extractText(document);
        return findPlagiarismInText(text, corpus);
    }
    
    @Override
    public Map<String, Double> analyzesentiment(Document document) {
        String text = extractText(document);
        return analyzeSentimentInText(text);
    }
    
    // Validation methods
    @Override
    public List<ValidationError> validateDocument(Document document) {
        WordDocument doc = (WordDocument) document;
        return validateWordStructure(doc);
    }
    
    @Override
    public boolean isDocumentValid(Document document) {
        List<ValidationError> errors = validateDocument(document);
        return errors.isEmpty();
    }
    
    @Override
    public void fixValidationErrors(Document document) {
        WordDocument doc = (WordDocument) document;
        fixWordValidationErrors(doc);
    }
    
    @Override
    public List<String> checkSpelling(Document document) {
        String text = extractText(document);
        return checkSpellingInText(text);
    }
    
    @Override
    public List<String> checkGrammar(Document document) {
        String text = extractText(document);
        return checkGrammarInText(text);
    }
    
    // Helper methods (implementations omitted for brevity)
    private String extractWordText(WordDocument doc) { /* implementation */ return ""; }
    private void replaceWordText(WordDocument doc, String oldText, String newText) { /* implementation */ }
    private List<String> extractKeywordsFromText(String text) { /* implementation */ return new ArrayList<>(); }
    private void applyWordFormatting(WordDocument doc, TextFormat format) { /* implementation */ }
    // ... many more helper methods
}

// Client code that demonstrates ISP violations
public class DocumentProcessingService {
    
    // ❌ This client only needs text extraction but gets a huge interface
    public List<String> extractAllText(List<Document> documents, DocumentProcessor processor) {
        List<String> extractedTexts = new ArrayList<>();
        
        for (Document doc : documents) {
            try {
                String text = processor.extractText(doc);
                extractedTexts.add(text);
            } catch (UnsupportedOperationException e) {
                System.err.println("Text extraction failed for " + doc.getClass().getSimpleName() + ": " + e.getMessage());
            }
        }
        
        return extractedTexts;
    }
    
    // ❌ This client only needs metadata but depends on the full interface
    public void generateMetadataReport(List<Document> documents, DocumentProcessor processor) {
        for (Document doc : documents) {
            try {
                DocumentMetadata metadata = processor.extractMetadata(doc);
                System.out.println("Document: " + doc.getClass().getSimpleName());
                System.out.println("Authors: " + metadata.getAuthors());
                System.out.println("Created: " + processor.getCreationDate(doc));
                System.out.println("Modified: " + processor.getLastModifiedDate(doc));
                System.out.println("---");
            } catch (UnsupportedOperationException e) {
                System.err.println("Metadata extraction failed: " + e.getMessage());
            }
        }
    }
    
    // ❌ This client only needs conversion but must depend on the entire interface
    public void batchConvertToPDF(List<Document> documents, DocumentProcessor processor, String outputDirectory) {
        for (int i = 0; i < documents.size(); i++) {
            Document doc = documents.get(i);
            String outputPath = outputDirectory + "/document_" + i + ".pdf";
            
            try {
                processor.convertToPDF(doc, outputPath);
                System.out.println("Converted: " + outputPath);
            } catch (UnsupportedOperationException e) {
                System.err.println("Conversion failed for " + doc.getClass().getSimpleName() + ": " + e.getMessage());
            }
        }
    }
}

// Supporting classes (simplified)
interface Document { }
class PDFDocument implements Document { }
class WordDocument implements Document { }

class DocumentMetadata {
    public List<String> getAuthors() { return new ArrayList<>(); }
    public Date getCreationDate() { return new Date(); }
    public Date getLastModifiedDate() { return new Date(); }
}

class TextFormat { }
class Comment { }
class Change { }
class DocumentPermissions { }
class DocumentStatistics { }
class ValidationError { }
class Certificate { }
```

### Your Task
Refactor this document processing system to follow the Interface Segregation Principle.

### Requirements
- [ ] **Identify client needs** - what specific capabilities do different clients require?
- [ ] **Create focused interfaces** - design small, role-based interfaces
- [ ] **Eliminate fat interfaces** - break down the monolithic DocumentProcessor interface
- [ ] **Enable selective implementation** - classes should only implement what they can support
- [ ] **Maintain functionality** - all document processing capabilities should still be available
- [ ] **Use interface composition** - combine small interfaces when clients need multiple capabilities

### Interface Design Strategy
1. **Analyze usage patterns** - how do clients use the DocumentProcessor interface?
2. **Group related methods** - which methods naturally belong together?
3. **Create role interfaces** - design interfaces for specific roles (reader, writer, converter, etc.)
4. **Apply composition** - allow clients to depend only on what they need
5. **Test the design** - ensure implementations can focus on their strengths

### Focus Areas
- Role-based interface design
- Client-specific contracts
- Interface composition patterns
- Dependency minimization

---

## Problem 2: User Management System

### Current Code (Python)
```python
# ❌ Violates ISP - forces all user managers to implement all methods
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum

class UserRole(Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"

class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    BANNED = "banned"

class User:
    def __init__(self, user_id: str, username: str, email: str, role: UserRole = UserRole.USER):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.role = role
        self.status = UserStatus.ACTIVE
        self.created_at = datetime.now()
        self.last_login = None
        self.profile_data = {}
        self.preferences = {}
        self.security_settings = {}

class UserManager(ABC):
    """❌ Fat interface that forces all implementations to handle all user operations"""
    
    # Basic CRUD operations
    @abstractmethod
    def create_user(self, username: str, email: str, password: str, role: UserRole = UserRole.USER) -> User:
        pass
    
    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        pass
    
    @abstractmethod
    def get_user_by_username(self, username: str) -> Optional[User]:
        pass
    
    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[User]:
        pass
    
    @abstractmethod
    def update_user(self, user_id: str, updates: Dict) -> bool:
        pass
    
    @abstractmethod
    def delete_user(self, user_id: str) -> bool:
        pass
    
    @abstractmethod
    def list_users(self, offset: int = 0, limit: int = 50) -> List[User]:
        pass
    
    @abstractmethod
    def search_users(self, query: str, filters: Dict = None) -> List[User]:
        pass
    
    # Authentication operations
    @abstractmethod
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        pass
    
    @abstractmethod
    def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        pass
    
    @abstractmethod
    def reset_password(self, email: str) -> str:  # Returns reset token
        pass
    
    @abstractmethod
    def verify_reset_token(self, token: str) -> Optional[str]:  # Returns user_id if valid
        pass
    
    @abstractmethod
    def update_password_with_token(self, token: str, new_password: str) -> bool:
        pass
    
    # Session management
    @abstractmethod
    def create_session(self, user_id: str) -> str:  # Returns session token
        pass
    
    @abstractmethod
    def validate_session(self, token: str) -> Optional[User]:
        pass
    
    @abstractmethod
    def invalidate_session(self, token: str) -> bool:
        pass
    
    @abstractmethod
    def invalidate_all_sessions(self, user_id: str) -> bool:
        pass
    
    @abstractmethod
    def get_active_sessions(self, user_id: str) -> List[Dict]:
        pass
    
    # Profile management
    @abstractmethod
    def update_profile(self, user_id: str, profile_data: Dict) -> bool:
        pass
    
    @abstractmethod
    def get_profile(self, user_id: str) -> Dict:
        pass
    
    @abstractmethod
    def upload_avatar(self, user_id: str, avatar_data: bytes) -> str:  # Returns avatar URL
        pass
    
    @abstractmethod
    def delete_avatar(self, user_id: str) -> bool:
        pass
    
    # Preferences management
    @abstractmethod
    def update_preferences(self, user_id: str, preferences: Dict) -> bool:
        pass
    
    @abstractmethod
    def get_preferences(self, user_id: str) -> Dict:
        pass
    
    @abstractmethod
    def reset_preferences(self, user_id: str) -> bool:
        pass
    
    # Security operations
    @abstractmethod
    def enable_two_factor_auth(self, user_id: str) -> str:  # Returns setup key
        pass
    
    @abstractmethod
    def disable_two_factor_auth(self, user_id: str, code: str) -> bool:
        pass
    
    @abstractmethod
    def verify_two_factor_code(self, user_id: str, code: str) -> bool:
        pass
    
    @abstractmethod
    def generate_backup_codes(self, user_id: str) -> List[str]:
        pass
    
    @abstractmethod
    def use_backup_code(self, user_id: str, code: str) -> bool:
        pass
    
    # Permission and role management
    @abstractmethod
    def assign_role(self, user_id: str, role: UserRole) -> bool:
        pass
    
    @abstractmethod
    def revoke_role(self, user_id: str) -> bool:
        pass
    
    @abstractmethod
    def check_permission(self, user_id: str, permission: str) -> bool:
        pass
    
    @abstractmethod
    def grant_permission(self, user_id: str, permission: str) -> bool:
        pass
    
    @abstractmethod
    def revoke_permission(self, user_id: str, permission: str) -> bool:
        pass
    
    @abstractmethod
    def list_permissions(self, user_id: str) -> List[str]:
        pass
    
    # Administrative operations
    @abstractmethod
    def suspend_user(self, user_id: str, reason: str, duration: timedelta = None) -> bool:
        pass
    
    @abstractmethod
    def unsuspend_user(self, user_id: str) -> bool:
        pass
    
    @abstractmethod
    def ban_user(self, user_id: str, reason: str) -> bool:
        pass
    
    @abstractmethod
    def unban_user(self, user_id: str) -> bool:
        pass
    
    @abstractmethod
    def deactivate_user(self, user_id: str) -> bool:
        pass
    
    @abstractmethod
    def reactivate_user(self, user_id: str) -> bool:
        pass
    
    # Audit and monitoring
    @abstractmethod
    def log_user_activity(self, user_id: str, activity: str, metadata: Dict = None) -> bool:
        pass
    
    @abstractmethod
    def get_user_activity_log(self, user_id: str, start_date: datetime = None, end_date: datetime = None) -> List[Dict]:
        pass
    
    @abstractmethod
    def get_login_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        pass
    
    @abstractmethod
    def get_security_events(self, user_id: str, event_types: List[str] = None) -> List[Dict]:
        pass
    
    # Analytics and reporting
    @abstractmethod
    def get_user_statistics(self) -> Dict:
        pass
    
    @abstractmethod
    def get_active_users_count(self, time_period: timedelta = timedelta(days=30)) -> int:
        pass
    
    @abstractmethod
    def get_user_growth_metrics(self, start_date: datetime, end_date: datetime) -> Dict:
        pass
    
    @abstractmethod
    def generate_user_report(self, report_type: str, parameters: Dict = None) -> bytes:
        pass
    
    # Bulk operations
    @abstractmethod
    def bulk_create_users(self, user_data_list: List[Dict]) -> List[str]:  # Returns created user IDs
        pass
    
    @abstractmethod
    def bulk_update_users(self, updates: List[Dict]) -> int:  # Returns count of updated users
        pass
    
    @abstractmethod
    def bulk_delete_users(self, user_ids: List[str]) -> int:  # Returns count of deleted users
        pass
    
    @abstractmethod
    def export_users(self, filters: Dict = None, format: str = "csv") -> bytes:
        pass
    
    @abstractmethod
    def import_users(self, data: bytes, format: str = "csv") -> Dict:  # Returns import results
        pass

# ❌ Simple user repository forced to implement complex operations
class DatabaseUserManager(UserManager):
    """Simple database-backed user manager that only handles basic CRUD"""
    
    def __init__(self, database_connection):
        self.db = database_connection
    
    # Can implement basic CRUD
    def create_user(self, username: str, email: str, password: str, role: UserRole = UserRole.USER) -> User:
        # Basic user creation logic
        user_id = self.generate_user_id()
        password_hash = self.hash_password(password)
        
        # Insert into database
        user = User(user_id, username, email, role)
        self.db.insert_user(user, password_hash)
        return user
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.db.get_user(user_id)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.get_user_by_username(username)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.get_user_by_email(email)
    
    def update_user(self, user_id: str, updates: Dict) -> bool:
        return self.db.update_user(user_id, updates)
    
    def delete_user(self, user_id: str) -> bool:
        return self.db.delete_user(user_id)
    
    def list_users(self, offset: int = 0, limit: int = 50) -> List[User]:
        return self.db.list_users(offset, limit)
    
    def search_users(self, query: str, filters: Dict = None) -> List[User]:
        return self.db.search_users(query, filters)
    
    # ❌ ISP Violation: Forced to implement authentication logic
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        raise NotImplementedError("Authentication not supported by simple database manager")
    
    def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        raise NotImplementedError("Password management not supported")
    
    def reset_password(self, email: str) -> str:
        raise NotImplementedError("Password reset not supported")
    
    def verify_reset_token(self, token: str) -> Optional[str]:
        raise NotImplementedError("Token verification not supported")
    
    def update_password_with_token(self, token: str, new_password: str) -> bool:
        raise NotImplementedError("Token-based password update not supported")
    
    # ❌ ISP Violation: Session management not relevant for simple CRUD
    def create_session(self, user_id: str) -> str:
        raise NotImplementedError("Session management not supported")
    
    def validate_session(self, token: str) -> Optional[User]:
        raise NotImplementedError("Session validation not supported")
    
    def invalidate_session(self, token: str) -> bool:
        raise NotImplementedError("Session invalidation not supported")
    
    def invalidate_all_sessions(self, user_id: str) -> bool:
        raise NotImplementedError("Session management not supported")
    
    def get_active_sessions(self, user_id: str) -> List[Dict]:
        raise NotImplementedError("Session listing not supported")
    
    # ❌ ISP Violation: Profile management beyond basic user data
    def update_profile(self, user_id: str, profile_data: Dict) -> bool:
        raise NotImplementedError("Extended profile management not supported")
    
    def get_profile(self, user_id: str) -> Dict:
        user = self.get_user_by_id(user_id)
        return user.profile_data if user else {}
    
    def upload_avatar(self, user_id: str, avatar_data: bytes) -> str:
        raise NotImplementedError("Avatar upload not supported")
    
    def delete_avatar(self, user_id: str) -> bool:
        raise NotImplementedError("Avatar management not supported")
    
    # Continue with more NotImplementedError methods...
    # (All other methods throw NotImplementedError)
    
    def update_preferences(self, user_id: str, preferences: Dict) -> bool:
        raise NotImplementedError("Preference management not supported")
    
    # ... (many more NotImplementedError methods)
    
    # Helper methods
    def generate_user_id(self) -> str:
        import uuid
        return str(uuid.uuid4())
    
    def hash_password(self, password: str) -> str:
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

# ❌ Authentication service forced to implement unrelated operations  
class AuthenticationUserManager(UserManager):
    """Authentication-focused user manager that doesn't need CRUD operations"""
    
    def __init__(self, user_repository, session_store, security_service):
        self.user_repo = user_repository
        self.session_store = session_store
        self.security_service = security_service
    
    # ❌ ISP Violation: Authentication service shouldn't create users
    def create_user(self, username: str, email: str, password: str, role: UserRole = UserRole.USER) -> User:
        raise NotImplementedError("User creation not supported by authentication service")
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        # Only needed for authentication purposes
        return self.user_repo.get_user_by_id(user_id)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        # Only needed for authentication
        return self.user_repo.get_user_by_username(username)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        # Only needed for password reset
        return self.user_repo.get_user_by_email(email)
    
    # ❌ ISP Violation: Don't need general user updates
    def update_user(self, user_id: str, updates: Dict) -> bool:
        raise NotImplementedError("General user updates not supported by authentication service")
    
    def delete_user(self, user_id: str) -> bool:
        raise NotImplementedError("User deletion not supported by authentication service")
    
    def list_users(self, offset: int = 0, limit: int = 50) -> List[User]:
        raise NotImplementedError("User listing not supported by authentication service")
    
    def search_users(self, query: str, filters: Dict = None) -> List[User]:
        raise NotImplementedError("User search not supported by authentication service")
    
    # Can implement authentication operations
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = self.get_user_by_username(username)
        if user and self.verify_password(user.user_id, password):
            user.last_login = datetime.now()
            return user
        return None
    
    def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        if self.verify_password(user_id, old_password):
            return self.security_service.update_password(user_id, new_password)
        return False
    
    def reset_password(self, email: str) -> str:
        user = self.get_user_by_email(email)
        if user:
            return self.security_service.generate_reset_token(user.user_id)
        raise ValueError("User not found")
    
    def verify_reset_token(self, token: str) -> Optional[str]:
        return self.security_service.verify_reset_token(token)
    
    def update_password_with_token(self, token: str, new_password: str) -> bool:
        user_id = self.verify_reset_token(token)
        if user_id:
            return self.security_service.update_password(user_id, new_password)
        return False
    
    # Session management
    def create_session(self, user_id: str) -> str:
        return self.session_store.create_session(user_id)
    
    def validate_session(self, token: str) -> Optional[User]:
        user_id = self.session_store.validate_session(token)
        return self.get_user_by_id(user_id) if user_id else None
    
    def invalidate_session(self, token: str) -> bool:
        return self.session_store.invalidate_session(token)
    
    def invalidate_all_sessions(self, user_id: str) -> bool:
        return self.session_store.invalidate_all_sessions(user_id)
    
    def get_active_sessions(self, user_id: str) -> List[Dict]:
        return self.session_store.get_active_sessions(user_id)
    
    # ❌ ISP Violation: Profile management not authentication concern
    def update_profile(self, user_id: str, profile_data: Dict) -> bool:
        raise NotImplementedError("Profile management not supported by authentication service")
    
    # ... (many more NotImplementedError methods for non-authentication operations)
    
    def verify_password(self, user_id: str, password: str) -> bool:
        return self.security_service.verify_password(user_id, password)

# Client code that demonstrates ISP violations
class UserRegistrationService:
    """Client that only needs user creation but depends on the full interface"""
    
    def __init__(self, user_manager: UserManager):
        self.user_manager = user_manager
    
    def register_new_user(self, registration_data: Dict) -> str:
        try:
            user = self.user_manager.create_user(
                registration_data['username'],
                registration_data['email'],
                registration_data['password']
            )
            
            # ❌ This client doesn't need these methods but they're in the interface
            # The interface forces awareness of methods like:
            # - suspend_user, ban_user, generate_user_report, etc.
            
            return user.user_id
        except NotImplementedError as e:
            raise ValueError(f"User registration not supported: {e}")

class LoginService:
    """Client that only needs authentication but depends on the full interface"""
    
    def __init__(self, user_manager: UserManager):
        self.user_manager = user_manager
    
    def login_user(self, username: str, password: str) -> str:
        try:
            user = self.user_manager.authenticate_user(username, password)
            if user:
                return self.user_manager.create_session(user.user_id)
            else:
                raise ValueError("Invalid credentials")
        except NotImplementedError as e:
            raise ValueError(f"Authentication not supported: {e}")

class ProfileService:
    """Client that only needs profile operations but depends on the full interface"""
    
    def __init__(self, user_manager: UserManager):
        self.user_manager = user_manager
    
    def update_user_profile(self, user_id: str, profile_updates: Dict) -> bool:
        try:
            return self.user_manager.update_profile(user_id, profile_updates)
        except NotImplementedError as e:
            raise ValueError(f"Profile management not supported: {e}")

class AdminService:
    """Client that needs administrative operations but gets everything else too"""
    
    def __init__(self, user_manager: UserManager):
        self.user_manager = user_manager
    
    def moderate_user(self, user_id: str, action: str, reason: str) -> bool:
        try:
            if action == "suspend":
                return self.user_manager.suspend_user(user_id, reason)
            elif action == "ban":
                return self.user_manager.ban_user(user_id, reason)
            elif action == "deactivate":
                return self.user_manager.deactivate_user(user_id)
            else:
                raise ValueError("Invalid moderation action")
        except NotImplementedError as e:
            raise ValueError(f"Moderation not supported: {e}")
```

### Your Task
Refactor this user management system to follow the Interface Segregation Principle.

### Requirements
- [ ] **Identify client groups** - what different types of clients use this system?
- [ ] **Create role-based interfaces** - design interfaces for specific user management roles
- [ ] **Eliminate method forcing** - classes should only implement methods they can support
- [ ] **Enable focused implementations** - each implementation should focus on its specialty
- [ ] **Maintain system functionality** - all user management features should remain available
- [ ] **Use interface composition** - allow implementations to support multiple roles when appropriate

### Client Analysis
Consider these different types of clients:
- User registration services
- Authentication services
- Profile management services
- Administrative/moderation services
- Analytics and reporting services
- Bulk operation services

### Focus Areas
- Role-based interface design
- Client-specific capabilities
- Interface composition strategies
- Implementation specialization

---

## Problem 3: Media Player Interface

### Current Code (C#)
```csharp
// ❌ Violates ISP - forces all media players to implement all features
using System;
using System.Collections.Generic;

public interface IMediaPlayer
{
    // Basic playback operations
    void Play();
    void Pause();
    void Stop();
    void Seek(TimeSpan position);
    TimeSpan GetCurrentPosition();
    TimeSpan GetDuration();
    double GetVolume();
    void SetVolume(double volume);
    bool IsPlaying();
    bool IsMuted();
    void SetMuted(bool muted);
    
    // Media loading
    bool LoadMedia(string filePath);
    bool LoadMediaFromUrl(string url);
    bool LoadMediaFromStream(Stream stream);
    void UnloadMedia();
    bool IsMediaLoaded();
    
    // Playlist operations
    void AddToPlaylist(string filePath);
    void RemoveFromPlaylist(int index);
    void ClearPlaylist();
    List<string> GetPlaylist();
    void PlayNext();
    void PlayPrevious();
    void SetPlaylistPosition(int index);
    int GetPlaylistPosition();
    bool IsShuffleEnabled();
    void SetShuffle(bool enabled);
    bool IsRepeatEnabled();
    void SetRepeat(bool enabled);
    
    // Audio-specific operations
    void SetBalance(double balance);
    double GetBalance();
    void SetEqualizer(EqualizerSettings settings);
    EqualizerSettings GetEqualizer();
    void SetAudioTrack(int trackIndex);
    int GetAudioTrack();
    List<AudioTrackInfo> GetAudioTracks();
    void SetAudioDelay(TimeSpan delay);
    TimeSpan GetAudioDelay();
    
    // Video-specific operations
    void SetVideoSize(VideoSize size);
    VideoSize GetVideoSize();
    void SetAspectRatio(AspectRatio ratio);
    AspectRatio GetAspectRatio();
    void SetFullscreen(bool fullscreen);
    bool IsFullscreen();
    void SetSubtitles(bool enabled);
    bool AreSubtitlesEnabled();
    void SetSubtitleTrack(int trackIndex);
    int GetSubtitleTrack();
    List<SubtitleTrackInfo> GetSubtitleTracks();
    void SetSubtitleDelay(TimeSpan delay);
    TimeSpan GetSubtitleDelay();
    void TakeScreenshot(string filePath);
    
    // Recording operations
    void StartRecording(string outputPath);
    void StopRecording();
    bool IsRecording();
    void SetRecordingFormat(RecordingFormat format);
    RecordingFormat GetRecordingFormat();
    void SetRecordingQuality(RecordingQuality quality);
    RecordingQuality GetRecordingQuality();
    
    // Streaming operations
    void StartStreaming(string streamUrl, StreamingProtocol protocol);
    void StopStreaming();
    bool IsStreaming();
    void SetStreamingBitrate(int bitrate);
    int GetStreamingBitrate();
    void SetStreamingFormat(StreamingFormat format);
    StreamingFormat GetStreamingFormat();
    
    // Effects and filters
    void AddVideoFilter(IVideoFilter filter);
    void RemoveVideoFilter(IVideoFilter filter);
    List<IVideoFilter> GetVideoFilters();
    void AddAudioEffect(IAudioEffect effect);
    void RemoveAudioEffect(IAudioEffect effect);
    List<IAudioEffect> GetAudioEffects();
    
    // Network operations
    void SetBufferSize(int bufferSizeMs);
    int GetBufferSize();
    void SetNetworkTimeout(TimeSpan timeout);
    TimeSpan GetNetworkTimeout();
    void SetUserAgent(string userAgent);
    string GetUserAgent();
    void SetProxySettings(ProxySettings settings);
    ProxySettings GetProxySettings();
    
    // Metadata operations
    MediaMetadata GetMetadata();
    void SetMetadata(MediaMetadata metadata);
    byte[] GetAlbumArt();
    void SetAlbumArt(byte[] artData);
    
    // Advanced playback
    void SetPlaybackSpeed(double speed);
    double GetPlaybackSpeed();
    void StepFrame();
    void StepBackFrame();
    void SetLoopMode(LoopMode mode);
    LoopMode GetLoopMode();
    
    // Events
    event EventHandler<MediaEventArgs> MediaOpened;
    event EventHandler<MediaEventArgs> MediaClosed;
    event EventHandler<MediaEventArgs> MediaFailed;
    event EventHandler<PlaybackEventArgs> PlaybackStarted;
    event EventHandler<PlaybackEventArgs> PlaybackPaused;
    event EventHandler<PlaybackEventArgs> PlaybackStopped;
    event EventHandler<PositionEventArgs> PositionChanged;
    event EventHandler<VolumeEventArgs> VolumeChanged;
    event EventHandler<PlaylistEventArgs> PlaylistChanged;
}

// ❌ Simple audio player forced to implement video operations
public class SimpleAudioPlayer : IMediaPlayer
{
    private bool isPlaying = false;
    private bool isPaused = false;
    private double volume = 1.0;
    private bool isMuted = false;
    private TimeSpan currentPosition = TimeSpan.Zero;
    private TimeSpan duration = TimeSpan.Zero;
    private string currentFile = null;
    
    // Can implement basic playback
    public void Play()
    {
        if (currentFile != null)
        {
            isPlaying = true;
            isPaused = false;
            OnPlaybackStarted();
        }
    }
    
    public void Pause()
    {
        if (isPlaying)
        {
            isPaused = true;
            isPlaying = false;
            OnPlaybackPaused();
        }
    }
    
    public void Stop()
    {
        isPlaying = false;
        isPaused = false;
        currentPosition = TimeSpan.Zero;
        OnPlaybackStopped();
    }
    
    public void Seek(TimeSpan position)
    {
        if (position <= duration)
        {
            currentPosition = position;
            OnPositionChanged();
        }
    }
    
    public TimeSpan GetCurrentPosition() => currentPosition;
    public TimeSpan GetDuration() => duration;
    public double GetVolume() => volume;
    
    public void SetVolume(double volume)
    {
        this.volume = Math.Max(0.0, Math.Min(1.0, volume));
        OnVolumeChanged();
    }
    
    public bool IsPlaying() => isPlaying;
    public bool IsMuted() => isMuted;
    
    public void SetMuted(bool muted)
    {
        isMuted = muted;
        OnVolumeChanged();
    }
    
    // Can implement basic media loading
    public bool LoadMedia(string filePath)
    {
        if (IsAudioFile(filePath))
        {
            currentFile = filePath;
            duration = GetAudioDuration(filePath);
            OnMediaOpened();
            return true;
        }
        return false;
    }
    
    public bool LoadMediaFromUrl(string url)
    {
        // Simple audio player doesn't support streaming
        throw new NotSupportedException("URL loading not supported by simple audio player");
    }
    
    public bool LoadMediaFromStream(Stream stream)
    {
        throw new NotSupportedException("Stream loading not supported by simple audio player");
    }
    
    public void UnloadMedia()
    {
        Stop();
        currentFile = null;
        duration = TimeSpan.Zero;
        OnMediaClosed();
    }
    
    public bool IsMediaLoaded() => currentFile != null;
    
    // ❌ ISP Violation: Simple audio player doesn't need playlist operations
    public void AddToPlaylist(string filePath)
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public void RemoveFromPlaylist(int index)
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public void ClearPlaylist()
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public List<string> GetPlaylist()
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public void PlayNext()
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public void PlayPrevious()
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public void SetPlaylistPosition(int index)
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public int GetPlaylistPosition()
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public bool IsShuffleEnabled()
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public void SetShuffle(bool enabled)
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public bool IsRepeatEnabled()
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    public void SetRepeat(bool enabled)
    {
        throw new NotSupportedException("Playlist operations not supported by simple audio player");
    }
    
    // Can implement some audio operations
    public void SetBalance(double balance)
    {
        // Basic balance implementation
    }
    
    public double GetBalance()
    {
        return 0.0; // Centered
    }
    
    public void SetEqualizer(EqualizerSettings settings)
    {
        throw new NotSupportedException("Equalizer not supported by simple audio player");
    }
    
    public EqualizerSettings GetEqualizer()
    {
        throw new NotSupportedException("Equalizer not supported by simple audio player");
    }
    
    public void SetAudioTrack(int trackIndex)
    {
        // Simple player only has one track
        if (trackIndex != 0)
            throw new ArgumentOutOfRangeException("Only one audio track available");
    }
    
    public int GetAudioTrack() => 0;
    
    public List<AudioTrackInfo> GetAudioTracks()
    {
        return new List<AudioTrackInfo> { new AudioTrackInfo { Index = 0, Name = "Default" } };
    }
    
    public void SetAudioDelay(TimeSpan delay)
    {
        throw new NotSupportedException("Audio delay not supported by simple audio player");
    }
    
    public TimeSpan GetAudioDelay() => TimeSpan.Zero;
    
    // ❌ ISP Violation: Audio player forced to implement video operations
    public void SetVideoSize(VideoSize size)
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    public VideoSize GetVideoSize()
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    public void SetAspectRatio(AspectRatio ratio)
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    public AspectRatio GetAspectRatio()
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    public void SetFullscreen(bool fullscreen)
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    public bool IsFullscreen()
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    public void SetSubtitles(bool enabled)
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    public bool AreSubtitlesEnabled()
    {
        throw new NotSupportedException("Video operations not supported by audio player");
    }
    
    // ... More video methods throwing NotSupportedException
    
    // ❌ ISP Violation: Audio player doesn't record
    public void StartRecording(string outputPath)
    {
        throw new NotSupportedException("Recording not supported by simple audio player");
    }
    
    // ... More recording methods throwing NotSupportedException
    
    // ❌ ISP Violation: Audio player doesn't stream
    public void StartStreaming(string streamUrl, StreamingProtocol protocol)
    {
        throw new NotSupportedException("Streaming not supported by simple audio player");
    }
    
    // ... More streaming methods throwing NotSupportedException
    
    // Event implementations
    public event EventHandler<MediaEventArgs> MediaOpened;
    public event EventHandler<MediaEventArgs> MediaClosed;
    public event EventHandler<MediaEventArgs> MediaFailed;
    public event EventHandler<PlaybackEventArgs> PlaybackStarted;
    public event EventHandler<PlaybackEventArgs> PlaybackPaused;
    public event EventHandler<PlaybackEventArgs> PlaybackStopped;
    public event EventHandler<PositionEventArgs> PositionChanged;
    public event EventHandler<VolumeEventArgs> VolumeChanged;
    public event EventHandler<PlaylistEventArgs> PlaylistChanged;
    
    // Event helper methods
    protected virtual void OnMediaOpened() => MediaOpened?.Invoke(this, new MediaEventArgs());
    protected virtual void OnMediaClosed() => MediaClosed?.Invoke(this, new MediaEventArgs());
    protected virtual void OnPlaybackStarted() => PlaybackStarted?.Invoke(this, new PlaybackEventArgs());
    protected virtual void OnPlaybackPaused() => PlaybackPaused?.Invoke(this, new PlaybackEventArgs());
    protected virtual void OnPlaybackStopped() => PlaybackStopped?.Invoke(this, new PlaybackEventArgs());
    protected virtual void OnPositionChanged() => PositionChanged?.Invoke(this, new PositionEventArgs { Position = currentPosition });
    protected virtual void OnVolumeChanged() => VolumeChanged?.Invoke(this, new VolumeEventArgs { Volume = volume, IsMuted = isMuted });
    
    // Helper methods
    private bool IsAudioFile(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLower();
        return extension == ".mp3" || extension == ".wav" || extension == ".flac" || extension == ".ogg";
    }
    
    private TimeSpan GetAudioDuration(string filePath)
    {
        // Simplified - would use actual audio library
        return TimeSpan.FromMinutes(3); // Assume 3 minute duration
    }
}

// Client code that demonstrates ISP violations
public class MusicLibraryService
{
    private readonly IMediaPlayer mediaPlayer;
    
    public MusicLibraryService(IMediaPlayer mediaPlayer)
    {
        this.mediaPlayer = mediaPlayer;
    }
    
    // ❌ This client only plays music but depends on the full interface
    public void PlaySong(string songPath)
    {
        try
        {
            if (mediaPlayer.LoadMedia(songPath))
            {
                mediaPlayer.Play();
            }
        }
        catch (NotSupportedException e)
        {
            Console.WriteLine($"Media player doesn't support required operation: {e.Message}");
        }
    }
    
    public void SetVolume(double volume)
    {
        try
        {
            mediaPlayer.SetVolume(volume);
        }
        catch (NotSupportedException e)
        {
            Console.WriteLine($"Volume control not supported: {e.Message}");
        }
    }
}

public class VideoPlayerService
{
    private readonly IMediaPlayer mediaPlayer;
    
    public VideoPlayerService(IMediaPlayer mediaPlayer)
    {
        this.mediaPlayer = mediaPlayer;
    }
    
    // ❌ This client only needs video operations but gets the full interface
    public void PlayVideo(string videoPath, bool fullscreen = false)
    {
        try
        {
            if (mediaPlayer.LoadMedia(videoPath))
            {
                mediaPlayer.SetFullscreen(fullscreen);
                mediaPlayer.Play();
            }
        }
        catch (NotSupportedException e)
        {
            Console.WriteLine($"Video operations not supported: {e.Message}");
        }
    }
}

// Supporting classes and enums
public class EqualizerSettings { }
public class AudioTrackInfo { public int Index { get; set; } public string Name { get; set; } }
public class SubtitleTrackInfo { public int Index { get; set; } public string Name { get; set; } }
public class MediaMetadata { }
public class ProxySettings { }

public enum VideoSize { Small, Medium, Large, Original }
public enum AspectRatio { Auto, FourThree, SixteenNine, TwentyOneNine }
public enum RecordingFormat { MP4, AVI, MKV }
public enum RecordingQuality { Low, Medium, High, Ultra }
public enum StreamingProtocol { RTMP, HLS, DASH }
public enum StreamingFormat { H264, H265, VP9 }
public enum LoopMode { None, Single, All }

public interface IVideoFilter { }
public interface IAudioEffect { }

// Event argument classes
public class MediaEventArgs : EventArgs { }
public class PlaybackEventArgs : EventArgs { }
public class PositionEventArgs : EventArgs { public TimeSpan Position { get; set; } }
public class VolumeEventArgs : EventArgs { public double Volume { get; set; } public bool IsMuted { get; set; } }
public class PlaylistEventArgs : EventArgs { }
```

### Your Task
Refactor this media player interface to follow the Interface Segregation Principle.

### Requirements
- [ ] **Identify capability groups** - what different capabilities do media players have?
- [ ] **Create capability interfaces** - design focused interfaces for specific media capabilities
- [ ] **Remove forced implementations** - players should only implement what they support
- [ ] **Enable capability discovery** - clients should be able to discover what a player supports
- [ ] **Maintain full functionality** - all media player features should remain available
- [ ] **Use interface composition** - allow players to implement multiple capabilities

### Capability Analysis
Consider these different media player capabilities:
- Basic playback (play, pause, stop, seek)
- Audio playback (audio-specific features)
- Video playback (video-specific features)
- Playlist management
- Recording capabilities
- Streaming capabilities
- Effects and filters
- Network operations

### Focus Areas
- Capability-based interface design
- Optional feature support
- Interface composition patterns
- Feature discovery mechanisms

---

## 🏆 Success Criteria

For each ISP exercise, demonstrate:

### Interface Design Quality
- **Focused Interfaces**: Each interface has a clear, specific purpose
- **Client-Specific**: Interfaces match client needs, not implementation capabilities
- **No Fat Interfaces**: No interface forces unnecessary method dependencies
- **Minimal Dependencies**: Clients depend only on methods they actually use

### Implementation Freedom
- **Selective Implementation**: Classes implement only interfaces they can support
- **No Forced Methods**: No throwing `UnsupportedOperationException` or `NotImplementedError`
- **Natural Composition**: Multiple interfaces can be combined when appropriate
- **Feature Discovery**: Clients can determine available capabilities

### Code Quality
- **Loose Coupling**: Reduced dependencies between clients and implementations
- **High Cohesion**: Related methods are grouped in focused interfaces
- **Maintainable Design**: Changes to one capability don't affect others
- **Clear Semantics**: Interface purposes are obvious and well-documented

---

## 💡 ISP Implementation Patterns

### **Role-Based Interface Design**
```java
// ✅ Focused interfaces for specific roles
interface DocumentReader {
    String extractText(Document document);
    DocumentMetadata extractMetadata(Document document);
}

interface DocumentWriter {
    void updateText(Document document, String newText);
    void updateMetadata(Document document, DocumentMetadata metadata);
}

interface DocumentConverter {
    void convertTo(Document document, String format, String outputPath);
    List<String> getSupportedFormats();
}

// ✅ Implementations choose their capabilities
class PDFReader implements DocumentReader {
    // Only implement reading operations
}

class WordProcessor implements DocumentReader, DocumentWriter, DocumentConverter {
    // Implement all operations for full-featured processor
}
```

### **Capability-Based Design**
```java
// ✅ Optional capabilities through interface composition
interface MediaPlayer {
    void play();
    void pause();
    void stop();
}

interface AudioCapable {
    void setVolume(double volume);
    void setBalance(double balance);
}

interface VideoCapable {
    void setVideoSize(VideoSize size);
    void setFullscreen(boolean fullscreen);
}

interface PlaylistCapable {
    void addToPlaylist(String media);
    void playNext();
    void playPrevious();
}

// ✅ Players implement only what they support
class SimpleAudioPlayer implements MediaPlayer, AudioCapable {
    // Audio playback only
}

class FullVideoPlayer implements MediaPlayer, AudioCapable, VideoCapable, PlaylistCapable {
    // Full-featured player
}
```

### **Client-Specific Interfaces**
```java
// ✅ Design interfaces for how clients use them
interface UserAuthenticator {
    boolean authenticate(String username, String password);
    User getCurrentUser(String sessionToken);
}

interface UserRegistrar {
    User createUser(String username, String email, String password);
    boolean isUsernameAvailable(String username);
}

interface UserProfileManager {
    UserProfile getProfile(String userId);
    void updateProfile(String userId, UserProfile profile);
}

// ✅ Clients depend only on what they need
class LoginService {
    private final UserAuthenticator authenticator;
    
    public LoginService(UserAuthenticator authenticator) {
        this.authenticator = authenticator;
    }
    
    // Only depends on authentication methods
}
```

### **Feature Discovery Pattern**
```java
// ✅ Enable capability discovery
interface CapabilityProvider {
    <T> Optional<T> getCapability(Class<T> capabilityType);
    List<Class<?>> getSupportedCapabilities();
}

// ✅ Usage with capability discovery
class MediaPlayerClient {
    public void playMedia(CapabilityProvider player, String media) {
        // Always available
        MediaPlayer basicPlayer = player.getCapability(MediaPlayer.class).orElseThrow();
        basicPlayer.play();
        
        // Optional capabilities
        player.getCapability(VideoCapable.class)
               .ifPresent(video -> video.setFullscreen(true));
        
        player.getCapability(PlaylistCapable.class)
               .ifPresent(playlist -> playlist.addToPlaylist(media));
    }
}
```

---

## 🎯 Self-Assessment

After completing each ISP exercise:

### **Interface Design (1-5 scale)**
- [ ] **Focus**: Each interface has a clear, specific purpose
- [ ] **Client Alignment**: Interfaces match client needs exactly
- [ ] **Minimal Dependencies**: Clients depend only on methods they use
- [ ] **Cohesion**: Related methods are grouped appropriately

### **Implementation Quality (1-5 scale)**
- [ ] **Selective Implementation**: Classes implement only supported interfaces
- [ ] **No Forced Methods**: No `UnsupportedOperationException` or equivalent
- [ ] **Natural Composition**: Multiple interfaces combine well
- [ ] **Feature Discovery**: Available capabilities can be determined

**Target**: All scores should be 4 or 5, representing mastery of ISP.

---

## 🚀 Next Steps

Once you've mastered the Interface Segregation Principle:

1. **Review your existing interfaces** - Look for fat interfaces in your codebase
2. **Practice client-driven design** - Design interfaces based on how clients use them
3. **Move to [Exercise 5: Dependency Inversion Principle](./exercise-5-dip.md)** - Learn to depend on abstractions
4. **Apply ISP thinking** - Always consider whether an interface is focused enough

Remember: Interfaces should be designed for clients, not for implementations. When you create large interfaces that force implementations to throw `UnsupportedOperationException`, you're violating ISP. Instead, create small, focused interfaces that clients can compose as needed!
