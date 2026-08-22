// Magic Bytes (File Signatures) Database
// Each entry: { bytes: [hex array], offset: start position, mime: string, ext: string, label: string }
export const MAGIC_SIGNATURES = [
  // Images
  { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0, mime: 'image/png', ext: 'png', label: 'PNG Image' },
  { bytes: [0xFF, 0xD8, 0xFF], offset: 0, mime: 'image/jpeg', ext: 'jpg', label: 'JPEG Image' },
  { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0, mime: 'image/gif', ext: 'gif', label: 'GIF Image (87a)' },
  { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0, mime: 'image/gif', ext: 'gif', label: 'GIF Image (89a)' },
  { bytes: [0x42, 0x4D], offset: 0, mime: 'image/bmp', ext: 'bmp', label: 'BMP Image' },
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, mime: 'image/webp', ext: 'webp', label: 'WebP Image' },
  { bytes: [0x00, 0x00, 0x01, 0x00], offset: 0, mime: 'image/x-icon', ext: 'ico', label: 'ICO Icon' },

  // Documents
  { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0, mime: 'application/pdf', ext: 'pdf', label: 'PDF Document' },
  { bytes: [0x50, 0x4B, 0x03, 0x04], offset: 0, mime: 'application/zip', ext: 'zip', label: 'ZIP Archive / Office Document' },
  { bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], offset: 0, mime: 'application/msword', ext: 'doc', label: 'MS Office Document (Legacy)' },

  // Executables & Scripts
  { bytes: [0x4D, 0x5A], offset: 0, mime: 'application/x-msdownload', ext: 'exe', label: 'Windows Executable (PE)' },
  { bytes: [0x7F, 0x45, 0x4C, 0x46], offset: 0, mime: 'application/x-elf', ext: 'elf', label: 'Linux Executable (ELF)' },
  { bytes: [0xCA, 0xFE, 0xBA, 0xBE], offset: 0, mime: 'application/java', ext: 'class', label: 'Java Class File' },
  { bytes: [0x23, 0x21], offset: 0, mime: 'text/x-shellscript', ext: 'sh', label: 'Shell Script (Shebang)' },

  // Archives
  { bytes: [0x1F, 0x8B], offset: 0, mime: 'application/gzip', ext: 'gz', label: 'GZIP Archive' },
  { bytes: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], offset: 0, mime: 'application/x-rar', ext: 'rar', label: 'RAR Archive' },
  { bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], offset: 0, mime: 'application/x-7z', ext: '7z', label: '7-Zip Archive' },

  // Media
  { bytes: [0x49, 0x44, 0x33], offset: 0, mime: 'audio/mpeg', ext: 'mp3', label: 'MP3 Audio' },
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, mime: 'video/mp4', ext: 'mp4', label: 'MP4 Video' },
  { bytes: [0x1A, 0x45, 0xDF, 0xA3], offset: 0, mime: 'video/webm', ext: 'webm', label: 'WebM Video' },

  // Web
  { bytes: [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], offset: 0, mime: 'text/html', ext: 'html', label: 'HTML Document' },
  { bytes: [0x3C, 0x68, 0x74, 0x6D, 0x6C], offset: 0, mime: 'text/html', ext: 'html', label: 'HTML Document' },
  { bytes: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], offset: 0, mime: 'text/xml', ext: 'xml', label: 'XML Document' },
  { bytes: [0x7B], offset: 0, mime: 'application/json', ext: 'json', label: 'JSON Data' },
];

// Dangerous file types that should be flagged
export const DANGEROUS_TYPES = [
  'application/x-msdownload',
  'application/x-elf',
  'application/java',
  'text/x-shellscript',
  'application/x-rar',
  'application/x-7z',
];

// Extension to expected MIME mapping
export const EXTENSION_MIME_MAP = {
  'pdf': 'application/pdf',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'ico': 'image/x-icon',
  'doc': 'application/msword',
  'docx': 'application/zip',
  'xlsx': 'application/zip',
  'pptx': 'application/zip',
  'zip': 'application/zip',
  'gz': 'application/gzip',
  'rar': 'application/x-rar',
  '7z': 'application/x-7z',
  'exe': 'application/x-msdownload',
  'dll': 'application/x-msdownload',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'html': 'text/html',
  'htm': 'text/html',
  'xml': 'text/xml',
  'json': 'application/json',
  'js': 'text/javascript',
  'sh': 'text/x-shellscript',
  'bat': 'text/x-batch',
  'class': 'application/java',
};
