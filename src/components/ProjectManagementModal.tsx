'use client';

import React, { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Project } from '@/types';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectManagementModal({ isOpen, onClose }: ProjectManagementModalProps) {
  const { projects, createProject, updateProject, deleteProject } = useProject();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [zoom, setZoom] = useState('13');

  useEffect(() => {
    if (mode === 'edit' && editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || '');
      setLatitude(editingProject.defaultCenter?.[0].toString() || '');
      setLongitude(editingProject.defaultCenter?.[1].toString() || '');
      setZoom(editingProject.defaultZoom?.toString() || '13');
    } else if (mode === 'create') {
      setName('');
      setDescription('');
      setLatitude('');
      setLongitude('');
      setZoom('13');
    }
  }, [mode, editingProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const defaultCenter: [number, number] | undefined =
      latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : undefined;
    const defaultZoom = zoom ? parseInt(zoom) : undefined;

    try {
      if (mode === 'create') {
        await createProject(name, description, defaultCenter, defaultZoom);
      } else if (mode === 'edit' && editingProject) {
        await updateProject(editingProject.id, {
          name,
          description,
          defaultCenter,
          defaultZoom,
        });
      }
      setMode('list');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? All associated sites will also be deleted.')) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setMode('edit');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === 'list' && 'Manage Projects'}
            {mode === 'create' && 'Create New Project'}
            {mode === 'edit' && 'Edit Project'}
          </h2>
          <button
            onClick={() => {
              setMode('list');
              onClose();
            }}
            className="text-gray-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-64px)]">
          {mode === 'list' && (
            <div>
              <button
                onClick={() => setMode('create')}
                className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Project</span>
              </button>

              <div className="space-y-2">
                {projects.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No projects yet. Create your first project to get started!
                  </p>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          {project.description && (
                            <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                          )}
                          {project.defaultCenter && (
                            <p className="text-gray-400 text-xs mt-2">
                              Center: {project.defaultCenter[0].toFixed(4)}, {project.defaultCenter[1].toFixed(4)} |
                              Zoom: {project.defaultZoom}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Chernivtsi Region, Suceava"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this project..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 48.2908"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 25.9358"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="zoom" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Zoom Level
                </label>
                <input
                  type="number"
                  id="zoom"
                  value={zoom}
                  onChange={(e) => setZoom(e.target.value)}
                  min="1"
                  max="18"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1-18"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {mode === 'create' ? 'Create Project' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
