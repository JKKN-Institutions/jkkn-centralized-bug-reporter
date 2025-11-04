'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface AllowedDomainsInputProps {
  value: string[];
  onChange: (domains: string[]) => void;
}

export function AllowedDomainsInput({ value, onChange }: AllowedDomainsInputProps) {
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateDomain = (domain: string): boolean => {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  const handleAddDomain = () => {
    const trimmedDomain = newDomain.trim();

    if (!trimmedDomain) {
      setError('Domain cannot be empty');
      return;
    }

    if (!validateDomain(trimmedDomain)) {
      setError('Invalid domain format');
      return;
    }

    if (value.includes(trimmedDomain)) {
      setError('Domain already exists');
      return;
    }

    onChange([...value, trimmedDomain]);
    setNewDomain('');
    setError(null);
  };

  const handleRemoveDomain = (domain: string) => {
    onChange(value.filter((d) => d !== domain));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="example.com"
          value={newDomain}
          onChange={(e) => {
            setNewDomain(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
        />
        <Button type="button" onClick={handleAddDomain} variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((domain) => (
            <Badge key={domain} variant="secondary" className="gap-1">
              {domain}
              <button
                type="button"
                onClick={() => handleRemoveDomain(domain)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
