import { readFileSync } from "fs";
import { fileTypeFromBuffer } from "file-type";

export interface ParsedFile {
  content: string;
  filename: string;
  type: string;
}

export async function parseUploadedFile(
  filepath: string,
  originalname: string
): Promise<ParsedFile> {
  try {
    const buffer = readFileSync(filepath);
    const fileType = await fileTypeFromBuffer(buffer);
    
    let content: string;
    
    // Handle different file types
    if (originalname.toLowerCase().endsWith('.txt') || fileType?.mime === 'text/plain') {
      content = buffer.toString('utf-8');
    } else if (originalname.toLowerCase().endsWith('.pdf') || fileType?.mime === 'application/pdf') {
      // For PDF parsing, we'll use a simple text extraction
      // In a real implementation, you'd use a library like pdf-parse
      content = await parsePDF(buffer);
    } else if (originalname.toLowerCase().endsWith('.docx') || fileType?.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX parsing, you'd use a library like mammoth
      content = await parseDOCX(buffer);
    } else {
      throw new Error(`Unsupported file type: ${fileType?.mime || 'unknown'}`);
    }

    if (!content.trim()) {
      throw new Error('File appears to be empty or unreadable');
    }

    return {
      content: content.trim(),
      filename: originalname,
      type: fileType?.mime || 'text/plain',
    };
  } catch (error) {
    console.error('File parsing error:', error);
    throw new Error(`Failed to parse file: ${(error as Error).message}`);
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  // Simple PDF text extraction - in production, use pdf-parse or similar
  // For now, we'll return a placeholder that indicates PDF parsing
  const text = buffer.toString('utf-8');
  
  // Very basic PDF text extraction (this won't work for real PDFs)
  // In production, implement proper PDF parsing
  if (text.includes('%PDF')) {
    throw new Error('PDF parsing requires additional setup. Please use TXT files for now.');
  }
  
  return text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error("Failed to parse DOCX file: " + (error as Error).message);
  }
}

export function validateFileType(mimetype: string, filename: string): boolean {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  const allowedExtensions = ['.txt', '.pdf', '.docx'];
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
  
  return allowedTypes.includes(mimetype) || hasValidExtension;
}

export function validateFileSize(size: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}
