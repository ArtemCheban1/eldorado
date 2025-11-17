'use client';

import React, { useState, useEffect } from 'react';
import { ArchaeologicalSite, PointerType, Category, Timespan, Finding } from '@/types';

interface PointerFormProps {
  pointer?: ArchaeologicalSite | null;
  coordinates: [number, number];
  onSave: (pointer: Partial<ArchaeologicalSite>) => void;
  onCancel: () => void;
}

const POINTER_TYPES: { value: PointerType; label: string; description: string }[] = [
  { value: 'info_pointer', label: 'Info Pointer', description: 'General information marker' },
  { value: 'findings_pointer', label: 'Findings Pointer', description: 'Location with archaeological findings' },
  { value: 'search_location', label: 'Search Location', description: 'Possible place to search' },
  { value: 'archaeological_area', label: 'Archaeological Area', description: 'Defined archaeological area' },
  { value: 'finding', label: 'Finding', description: 'Single archaeological finding' },
  { value: 'point_of_interest', label: 'Point of Interest', description: 'General point of interest' },
];

const PREDEFINED_PERIODS = [
  'Paleolithic', 'Mesolithic', 'Neolithic', 'Chalcolithic', 'Cucuteni',
  'Bronze Age', 'Iron Age', 'Classical Antiquity', 'Roman Period',
  'Early Middle Ages', 'High Middle Ages', 'Late Middle Ages',
  'Renaissance', 'Early Modern', 'Modern', 'Unknown'
];

const PREDEFINED_CATEGORIES = [
  { id: 'settlement', name: 'Settlement', color: '#ef4444', icon: 'home' },
  { id: 'burial', name: 'Burial Site', color: '#8b5cf6', icon: 'grave' },
  { id: 'pottery', name: 'Pottery', color: '#f59e0b', icon: 'pot' },
  { id: 'tools', name: 'Tools', color: '#10b981', icon: 'tool' },
  { id: 'fortification', name: 'Fortification', color: '#6366f1', icon: 'castle' },
  { id: 'religious', name: 'Religious Site', color: '#ec4899', icon: 'church' },
  { id: 'workshop', name: 'Workshop', color: '#14b8a6', icon: 'hammer' },
  { id: 'unknown', name: 'Unknown', color: '#64748b', icon: 'question' },
];

export default function PointerForm({ pointer, coordinates, onSave, onCancel }: PointerFormProps) {
  const [name, setName] = useState(pointer?.name || '');
  const [type, setType] = useState<PointerType>(pointer?.type || 'info_pointer');
  const [description, setDescription] = useState(pointer?.description || '');
  const [radius, setRadius] = useState(pointer?.radius || 50);
  const [info, setInfo] = useState(pointer?.info || '');

  // Categories
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(pointer?.categories || []);

  // Tags
  const [tags, setTags] = useState<string[]>(pointer?.tags || []);
  const [newTag, setNewTag] = useState('');

  // Timespan
  const [period, setPeriod] = useState(pointer?.timespan?.period || '');
  const [customPeriod, setCustomPeriod] = useState('');
  const [startYear, setStartYear] = useState<string>(pointer?.timespan?.startYear?.toString() || '');
  const [endYear, setEndYear] = useState<string>(pointer?.timespan?.endYear?.toString() || '');
  const [periodDescription, setPeriodDescription] = useState(pointer?.timespan?.description || '');

  // Search location specific
  const [searchPriority, setSearchPriority] = useState<'high' | 'medium' | 'low'>(
    pointer?.searchPriority || 'medium'
  );
  const [searchReason, setSearchReason] = useState(pointer?.searchReason || '');

  // Findings
  const [findings, setFindings] = useState<Finding[]>(pointer?.findings || []);
  const [newFinding, setNewFinding] = useState({
    name: '',
    description: '',
    type: 'artifact' as Finding['type'],
    condition: 'good' as Finding['condition']
  });

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleCategory = (category: Category) => {
    const exists = selectedCategories.find(c => c.id === category.id);
    if (exists) {
      setSelectedCategories(selectedCategories.filter(c => c.id !== category.id));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleAddFinding = () => {
    if (newFinding.name.trim()) {
      const finding: Finding = {
        id: `finding-${Date.now()}`,
        name: newFinding.name,
        description: newFinding.description,
        type: newFinding.type,
        condition: newFinding.condition,
        dateFound: new Date().toISOString(),
      };
      setFindings([...findings, finding]);
      setNewFinding({ name: '', description: '', type: 'artifact', condition: 'good' });
    }
  };

  const handleRemoveFinding = (findingId: string) => {
    setFindings(findings.filter(f => f.id !== findingId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pointerData: Partial<ArchaeologicalSite> = {
      id: pointer?.id || `pointer-${Date.now()}`,
      name,
      type,
      description,
      coordinates,
      radius,
      categories: selectedCategories,
      tags,
      dateCreated: pointer?.dateCreated || new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    // Add timespan if period is selected
    const selectedPeriod = period === 'custom' ? customPeriod : period;
    if (selectedPeriod) {
      pointerData.timespan = {
        period: selectedPeriod,
        startYear: startYear ? parseInt(startYear) : undefined,
        endYear: endYear ? parseInt(endYear) : undefined,
        description: periodDescription,
      };
    }

    // Add type-specific data
    if (type === 'info_pointer' && info) {
      pointerData.info = info;
    }

    if (type === 'findings_pointer' && findings.length > 0) {
      pointerData.findings = findings;
    }

    if (type === 'search_location') {
      pointerData.searchPriority = searchPriority;
      pointerData.searchReason = searchReason;
    }

    onSave(pointerData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {pointer ? 'Edit Pointer' : 'Add New Pointer'}
          </h2>

          {/* Basic Information */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pointer name"
            />
          </div>

          {/* Pointer Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pointer Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {POINTER_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`p-3 border rounded text-left transition-colors ${
                    type === value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-gray-600">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategories.find(c => c.id === category.id)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategories.find(c => c.id === category.id)
                      ? category.color
                      : undefined,
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tags (e.g., age, type)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-200 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Timespan */}
          <div className="mb-4 p-4 border rounded bg-gray-50">
            <label className="block text-sm font-medium mb-2">Historical Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select period...</option>
              {PREDEFINED_PERIODS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="custom">Custom Period...</option>
            </select>

            {period === 'custom' && (
              <input
                type="text"
                value={customPeriod}
                onChange={(e) => setCustomPeriod(e.target.value)}
                placeholder="Enter custom period name"
                className="w-full px-3 py-2 border rounded mb-2 focus:ring-2 focus:ring-blue-500"
              />
            )}

            {period && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Year</label>
                    <input
                      type="number"
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      placeholder="e.g., -3000 (BC)"
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Year</label>
                    <input
                      type="number"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      placeholder="e.g., -2000 (BC)"
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <textarea
                  value={periodDescription}
                  onChange={(e) => setPeriodDescription(e.target.value)}
                  placeholder="Additional period information..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
          </div>

          {/* Type-Specific Fields */}
          {type === 'info_pointer' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Information</label>
              <textarea
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed information about this location..."
              />
            </div>
          )}

          {type === 'findings_pointer' && (
            <div className="mb-4 p-4 border rounded bg-gray-50">
              <label className="block text-sm font-medium mb-2">Findings</label>
              <div className="mb-3 p-3 bg-white rounded border">
                <input
                  type="text"
                  value={newFinding.name}
                  onChange={(e) => setNewFinding({ ...newFinding, name: e.target.value })}
                  placeholder="Finding name"
                  className="w-full px-3 py-2 border rounded mb-2 focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={newFinding.description}
                  onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className="w-full px-3 py-2 border rounded mb-2 focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={newFinding.type}
                    onChange={(e) => setNewFinding({ ...newFinding, type: e.target.value as Finding['type'] })}
                    className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="artifact">Artifact</option>
                    <option value="structure">Structure</option>
                    <option value="burial">Burial</option>
                    <option value="pottery">Pottery</option>
                    <option value="tool">Tool</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={newFinding.condition}
                    onChange={(e) => setNewFinding({ ...newFinding, condition: e.target.value as Finding['condition'] })}
                    className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddFinding}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Finding
                </button>
              </div>

              <div className="space-y-2">
                {findings.map(finding => (
                  <div key={finding.id} className="p-3 bg-white rounded border flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{finding.name}</div>
                      <div className="text-sm text-gray-600">{finding.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Type: {finding.type} | Condition: {finding.condition}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFinding(finding.id)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'search_location' && (
            <div className="mb-4 p-4 border rounded bg-gray-50">
              <label className="block text-sm font-medium mb-2">Search Priority</label>
              <div className="flex gap-2 mb-3">
                {(['high', 'medium', 'low'] as const).map(priority => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setSearchPriority(priority)}
                    className={`flex-1 py-2 rounded font-medium transition-colors ${
                      searchPriority === priority
                        ? priority === 'high'
                          ? 'bg-red-500 text-white'
                          : priority === 'medium'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
              <label className="block text-sm font-medium mb-1">Search Reason</label>
              <textarea
                value={searchReason}
                onChange={(e) => setSearchReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Why should this location be searched?"
              />
            </div>
          )}

          {/* Description and Radius */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="General description..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Radius: {radius}m
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600 transition-colors"
            >
              {pointer ? 'Update Pointer' : 'Add Pointer'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
