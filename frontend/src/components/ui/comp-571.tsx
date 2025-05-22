'use client';

import React, { useState } from 'react';
import {
  expandAllFeature,
  hotkeysCoreFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  TreeState,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { FileIcon, FolderIcon, FolderOpenIcon, SearchIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Tree, TreeItem, TreeItemLabel } from '@/components/ui/tree';

interface Item {
  name: string;
  children?: string[];
}

const items: Record<string, Item> = {
  company: {
    name: 'Company',
    children: ['engineering', 'marketing', 'operations'],
  },
  engineering: {
    name: 'Engineering',
    children: ['frontend', 'backend', 'platform-team'],
  },
  frontend: { name: 'Frontend', children: ['design-system', 'web-platform'] },
  'design-system': {
    name: 'Design System',
    children: ['components', 'tokens', 'guidelines'],
  },
  components: { name: 'Components' },
  tokens: { name: 'Tokens' },
  guidelines: { name: 'Guidelines' },
  'web-platform': { name: 'Web Platform' },
  backend: { name: 'Backend', children: ['apis', 'infrastructure'] },
  apis: { name: 'APIs' },
  infrastructure: { name: 'Infrastructure' },
  'platform-team': { name: 'Platform Team' },
  marketing: { name: 'Marketing', children: ['content', 'seo'] },
  content: { name: 'Content' },
  seo: { name: 'SEO' },
  operations: { name: 'Operations', children: ['hr', 'finance'] },
  hr: { name: 'HR' },
  finance: { name: 'Finance' },
};

const indent = 20;

export default function Component() {
  // Store the initial expanded items to reset when search is cleared
  const initialExpandedItems = ['engineering', 'frontend', 'design-system'];
  const [state, setState] = useState<Partial<TreeState<Item>>>({});

  const tree = useTree<Item>({
    state,
    setState,
    initialState: {
      expandedItems: initialExpandedItems,
    },
    indent,
    rootItemId: 'company',
    getItemName: item => item.getItemData().name,
    isItemFolder: item => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: itemId => items[itemId],
      getChildren: itemId => items[itemId].children ?? [],
    },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      searchFeature,
      expandAllFeature,
    ],
  });

  return (
    <div className='flex h-full flex-col gap-2 *:nth-2:grow'>
      <div className='relative'>
        <Input
          className='peer ps-9'
          {...{
            ...tree.getSearchInputElementProps(),
            onChange: e => {
              // First call the original onChange handler from getSearchInputElementProps
              const originalProps = tree.getSearchInputElementProps();
              if (originalProps.onChange) {
                originalProps.onChange(e);
              }

              // Then handle our custom logic
              const value = e.target.value;

              if (value.length > 0) {
                // If input has at least one character, expand all items
                tree.expandAll();
              } else {
                // If input is cleared, reset to initial expanded state
                setState(prevState => {
                  return {
                    ...prevState,
                    expandedItems: initialExpandedItems,
                  };
                });
              }
            },
          }}
          type='search'
          placeholder='Busqueda rápida...'
        />
        <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <SearchIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      <div>
        <Tree
          className='relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]'
          indent={indent}
          tree={tree}
        >
          {tree.getItems().map(item => {
            return (
              <TreeItem key={item.getId()} item={item}>
                <TreeItemLabel className='before:bg-card relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10'>
                  <span className='-order-1 flex flex-1 items-center gap-2'>
                    {item.isFolder() ? (
                      item.isExpanded() ? (
                        <FolderOpenIcon className='text-muted-foreground pointer-events-none size-4' />
                      ) : (
                        <FolderIcon className='text-muted-foreground pointer-events-none size-4' />
                      )
                    ) : (
                      <FileIcon className='text-muted-foreground pointer-events-none size-4' />
                    )}
                    {item.getItemName()}
                  </span>
                </TreeItemLabel>
              </TreeItem>
            );
          })}
        </Tree>
      </div>
    </div>
  );
}
