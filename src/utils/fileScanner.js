// File Scanner — Magic Bytes / MIME Type Validation
// Reads file headers and compares against known signatures

import { MAGIC_SIGNATURES, DANGEROUS_TYPES, EXTENSION_MIME_MAP } from '../data/magicBytes.js';

export class FileScanner {
  constructor() {
    this.maxHeaderBytes = 16; // Read first 16 bytes for signature detection
  }

  async scanFile(file) {
    const result = {
      fileName: file.name,
      fileSize: file.size,
      fileSizeFormatted: this.formatSize(file.size),
      declaredExtension: this.getExtension(file.name),
      declaredMime: file.type || 'unknown',
      detectedType: null,
      detectedMime: null,
      magicBytes: null,
      mismatch: false,
      isDangerous: false,
      verdict: 'unknown',
      verdictColor: '#888',
      details: [],
    };

    try {
      // Read file header bytes
      const headerBytes = await this.readFileHeader(file);
      result.magicBytes = this.bytesToHex(headerBytes);

      // Detect actual file type from magic bytes
      const detected = this.detectType(headerBytes);

      if (detected) {
        result.detectedType = detected.label;
        result.detectedMime = detected.mime;

        // Check for extension mismatch
        const expectedMime = EXTENSION_MIME_MAP[result.declaredExtension];
        const mimeMatches = this.mimeCompatible(result.detectedMime, expectedMime);
        const extMatchesDetected = this.mimeCompatible(result.detectedMime, EXTENSION_MIME_MAP[detected.ext]);

        if (expectedMime && !mimeMatches) {
          result.mismatch = true;
          result.details.push({
            type: 'warning',
            message: `Extension ".${result.declaredExtension}" doesn't match actual content (${detected.label})`,
          });
        }

        // Check if it's a dangerous type
        if (DANGEROUS_TYPES.includes(detected.mime)) {
          result.isDangerous = true;
          result.details.push({
            type: 'danger',
            message: `File contains ${detected.label} binary — potentially dangerous`,
          });
        }

        // Check for disguised executables
        if (detected.mime === 'application/x-msdownload' && result.declaredExtension !== 'exe' && result.declaredExtension !== 'dll') {
          result.mismatch = true;
          result.isDangerous = true;
          result.details.push({
            type: 'danger',
            message: `⚠️ DISGUISED EXECUTABLE: File claims to be .${result.declaredExtension} but is actually a Windows executable!`,
          });
        }

        // Check for shell scripts disguised as other files
        if (detected.mime === 'text/x-shellscript' && result.declaredExtension !== 'sh' && result.declaredExtension !== 'bash') {
          result.mismatch = true;
          result.isDangerous = true;
          result.details.push({
            type: 'danger',
            message: `⚠️ DISGUISED SCRIPT: File claims to be .${result.declaredExtension} but contains a shell script!`,
          });
        }

      } else {
        result.detectedType = 'Unknown / Plain Text';
        result.detectedMime = 'unknown';
        result.details.push({
          type: 'info',
          message: 'File type could not be determined from magic bytes — may be plain text or unknown format',
        });
      }

      // Generate verdict
      if (result.isDangerous && result.mismatch) {
        result.verdict = 'MALICIOUS';
        result.verdictColor = '#FF3838';
        result.verdictIcon = '☠️';
      } else if (result.isDangerous) {
        result.verdict = 'DANGEROUS';
        result.verdictColor = '#FF6B6B';
        result.verdictIcon = '⚠️';
      } else if (result.mismatch) {
        result.verdict = 'SUSPICIOUS';
        result.verdictColor = '#FFB84D';
        result.verdictIcon = '🚩';
      } else {
        result.verdict = 'CLEAN';
        result.verdictColor = '#00E5A0';
        result.verdictIcon = '✅';
      }

      // Add positive details
      if (!result.mismatch && !result.isDangerous) {
        result.details.push({
          type: 'success',
          message: 'File extension matches detected content type',
        });
        result.details.push({
          type: 'success',
          message: 'No dangerous signatures detected',
        });
      }

    } catch (error) {
      result.verdict = 'ERROR';
      result.verdictColor = '#FF6B6B';
      result.verdictIcon = '❌';
      result.details.push({
        type: 'danger',
        message: `Scan error: ${error.message}`,
      });
    }

    return result;
  }

  readFileHeader(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const blob = file.slice(0, this.maxHeaderBytes);

      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        resolve(bytes);
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(blob);
    });
  }

  detectType(headerBytes) {
    for (const sig of MAGIC_SIGNATURES) {
      if (this.matchSignature(headerBytes, sig.bytes, sig.offset)) {
        return sig;
      }
    }
    return null;
  }

  matchSignature(fileBytes, signatureBytes, offset) {
    if (fileBytes.length < offset + signatureBytes.length) return false;
    for (let i = 0; i < signatureBytes.length; i++) {
      if (fileBytes[offset + i] !== signatureBytes[i]) return false;
    }
    return true;
  }

  mimeCompatible(mime1, mime2) {
    if (!mime1 || !mime2) return true; // Can't determine, assume compatible
    // ZIP-based office formats are all 'application/zip' at the magic byte level
    if (mime1 === 'application/zip' && ['application/zip', 'application/vnd.openxmlformats'].includes(mime2)) return true;
    return mime1 === mime2;
  }

  getExtension(fileName) {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() : '';
  }

  bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  }
}
