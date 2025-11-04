'use client';

import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import type { Organization } from '@bug-reporter/shared';

interface OrganizationSelectorProps {
  organizations: Organization[];
  currentOrg: Organization;
}

export function OrganizationSelector({
  organizations,
  currentOrg,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (slug: string) => {
    setOpen(false);
    router.push(`/org/${slug}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {currentOrg.name}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem key={org.id} value={org.slug} onSelect={() => handleSelect(org.slug)}>
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      currentOrg.id === org.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {org.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  router.push('/org/new');
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
