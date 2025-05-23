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
    
    console.log(`📁 Processing file: ${originalname}, detected type: ${fileType?.mime || 'none'}`);
    
    let content: string;
    
    // Handle different file types - prioritize filename extension
    const fileName = originalname.toLowerCase();
    
    if (fileName.endsWith('.txt')) {
      content = buffer.toString('utf-8');
      console.log(`✅ Processed as text file`);
    } else if (fileName.endsWith('.pdf')) {
      content = await parsePDF(buffer);
      console.log(`✅ Processed as PDF`);
    } else if (fileName.endsWith('.docx')) {
      content = await parseDOCX(buffer);
      console.log(`✅ Processed as DOCX`);
    } else if (fileName.endsWith('.doc')) {
      content = buffer.toString('utf-8');
      console.log(`✅ Processed as DOC (text fallback)`);
    } else {
      // Default to text for any unrecognized file
      content = buffer.toString('utf-8');
      console.log(`✅ Processed as default text`);
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
