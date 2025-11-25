'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check, FileText } from 'lucide-react';
import { TAB_CONTENT_MAP, FULL_DOCUMENTATION_MARKDOWN } from './doc-content';

interface DocActionsProps {
  tabId?: string;
  variant?: 'tab' | 'full';
  className?: string;
}

export function DocActions({ tabId, variant = 'tab', className = '' }: DocActionsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const content = tabId ? TAB_CONTENT_MAP[tabId] : TAB_CONTENT_MAP['full'];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    setDownloading(true);

    const blob = new Blob([content.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = content.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(false), 1000);
  };

  if (variant === 'full') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy All Docs
            </>
          )}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2"
        >
          {downloading ? (
            <>
              <FileText className="h-4 w-4 animate-pulse" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Full Documentation
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="gap-1.5 h-8 px-2.5 text-xs"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-600" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        className="gap-1.5 h-8 px-2.5 text-xs"
      >
        {downloading ? (
          <>
            <FileText className="h-3.5 w-3.5 animate-pulse" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />
            Download .md
          </>
        )}
      </Button>
    </div>
  );
}

// Full documentation download card component
export function FullDocDownloadCard() {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(FULL_DOCUMENTATION_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadAll = () => {
    setDownloading(true);

    const blob = new Blob([FULL_DOCUMENTATION_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jkkn-bug-reporter-complete-documentation.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(false), 1000);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Complete Documentation
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Download or copy the entire integration guide as a single markdown file
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleCopyAll}
            className="gap-2 border-emerald-300 hover:bg-emerald-100"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All
              </>
            )}
          </Button>
          <Button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {downloading ? (
              <>
                <FileText className="h-4 w-4 animate-pulse" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download .md
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
