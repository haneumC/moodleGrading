interface Window {
  showSaveFilePicker: (options?: {
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
    suggestedName?: string;
  }) => Promise<FileSystemFileHandle>;
} 