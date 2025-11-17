'use client';

import React, { useState, useMemo } from 'react';
import { ArchaeologicalSite, PointerType, Category } from '@/types';

interface FilterPanelProps {
  sites: ArchaeologicalSite[];
  onFilteredSitesChange: (filteredSites: ArchaeologicalSite[]) => void;
}

const POINTER_TYPE_OPTIONS: { value: PointerType; label: string; color: string }[] = [
  { value: 'info_pointer', label: 'Info Pointer', color: '#3b82f6' },
  { value: 'findings_pointer', label: 'Findings', color: '#f59e0b' },
  { value: 'search_location', label: 'Search Location', color: '#8b5cf6' },
  { value: 'archaeological_area', label: 'Archaeological Area', color: '#ef4444' },
  { value: 'finding', label: 'Finding', color: '#f59e0b' },
  { value: 'point_of_interest', label: 'Point of Interest', color: '#10b981' },
];

export default function FilterPanel({ sites, onFilteredSitesChange }: FilterPanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<PointerType>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract all unique categories, tags, and periods from sites
  const { allCategories, allTags, allPeriods } = useMemo(() => {
    const categoriesMap = new Map<string, Category>();
    const tagsSet = new Set<string>();
    const periodsSet = new Set<string>();

    sites.forEach(site => {
      // Collect categories
      site.categories?.forEach(cat => {
        if (!categoriesMap.has(cat.id)) {
          categoriesMap.set(cat.id, cat);
        }
      });

      // Collect tags
      site.tags?.forEach(tag => tagsSet.add(tag));

      // Collect periods
      if (site.timespan?.period) {
        periodsSet.add(site.timespan.period);
      }
    });

    return {
      allCategories: Array.from(categoriesMap.values()),
      allTags: Array.from(tagsSet).sort(),
      allPeriods: Array.from(periodsSet).sort(),
    };
  }, [sites]);

  // Filter sites based on selected filters
  useMemo(() => {
    let filtered = sites;

    // Filter by type
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(site => selectedTypes.has(site.type));
    }

    // Filter by categories
    if (selectedCategories.size > 0) {
      filtered = filtered.filter(site =>
        site.categories?.some(cat => selectedCategories.has(cat.id))
      );
    }

    // Filter by tags
    if (selectedTags.size > 0) {
      filtered = filtered.filter(site =>
        site.tags?.some(tag => selectedTags.has(tag))
      );
    }

    // Filter by periods
    if (selectedPeriods.size > 0) {
      filtered = filtered.filter(site =>
        site.timespan?.period && selectedPeriods.has(site.timespan.period)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(site =>
        site.name.toLowerCase().includes(query) ||
        site.description?.toLowerCase().includes(query) ||
        site.info?.toLowerCase().includes(query)
      );
    }

    onFilteredSitesChange(filtered);
  }, [sites, selectedTypes, selectedCategories, selectedTags, selectedPeriods, searchQuery, onFilteredSitesChange]);

  const toggleType = (type: PointerType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const toggleCategory = (categoryId: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setSelectedCategories(newSet);
  };

  const toggleTag = (tag: string) => {
    const newSet = new Set(selectedTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setSelectedTags(newSet);
  };

  const togglePeriod = (period: string) => {
    const newSet = new Set(selectedPeriods);
    if (newSet.has(period)) {
      newSet.delete(period);
    } else {
      newSet.add(period);
    }
    setSelectedPeriods(newSet);
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set());
    setSelectedCategories(new Set());
    setSelectedTags(new Set());
    setSelectedPeriods(new Set());
    setSearchQuery('');
  };

  const activeFilterCount = selectedTypes.size + selectedCategories.size + selectedTags.size + selectedPeriods.size + (searchQuery ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button className="text-xl">{isExpanded ? '−' : '+'}</button>
      </div>

      {isExpanded && (
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Pointer Types */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pointer Types</label>
            <div className="space-y-1">
              {POINTER_TYPE_OPTIONS.map(({ value, label, color }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(value)}
                    onChange={() => toggleType(value)}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    ({sites.filter(s => s.type === value).length})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          {allCategories.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Categories</label>
              <div className="space-y-1">
                {allCategories.map(category => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      ({sites.filter(s => s.categories?.some(c => c.id === category.id)).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.has(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    #{tag}
                    <span className="ml-1 text-xs opacity-75">
                      ({sites.filter(s => s.tags?.includes(tag)).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Historical Periods */}
          {allPeriods.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Historical Periods</label>
              <div className="space-y-1">
                {allPeriods.map(period => (
                  <label key={period} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedPeriods.has(period)}
                      onChange={() => togglePeriod(period)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm flex-1">{period}</span>
                    <span className="text-xs text-gray-500">
                      ({sites.filter(s => s.timespan?.period === period).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="w-full bg-red-500 text-white py-2 rounded font-medium hover:bg-red-600 transition-colors"
            >
              Clear All Filters
            </button>
          )}

          {/* Statistics */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <p className="font-medium">Showing {sites.length} pointer{sites.length !== 1 ? 's' : ''}</p>
              {activeFilterCount > 0 && (
                <p className="text-xs mt-1">{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
