'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiKeyDisplayProps {
  apiKey: string;
  label?: string;
}

export function ApiKeyDisplay({ apiKey, label = 'API Key' }: ApiKeyDisplayProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success('API key copied to clipboard!');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy API key');
    }
  };

  const maskApiKey = (key: string): string => {
    if (key.length <= 12) return '••••••••••••';
    const prefix = key.substring(0, 3);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'•'.repeat(key.length - 7)}${suffix}`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={showKey ? apiKey : maskApiKey(apiKey)}
            readOnly
            className="pr-10 font-mono text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowKey(!showKey)}
          title={showKey ? 'Hide API key' : 'Show API key'}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Keep this key secure. It allows access to submit bug reports to your application.
      </p>
    </div>
  );
}
