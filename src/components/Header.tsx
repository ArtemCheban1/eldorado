'use client';

import React, { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { ProjectManagementModal } from './ProjectManagementModal';
import AuthButton from './AuthButton';

export function Header() {
  const { projects, activeProject, setActiveProject } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="bg-gray-800 text-white shadow-lg z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">El Dorado</h1>
            <span className="text-gray-400 text-sm">Archaeological Map Management</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Authentication */}
            <AuthButton />

            {/* Project Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="font-medium">
                  {activeProject ? activeProject.name : 'No Project'}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-700 rounded-lg shadow-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setActiveProject(project);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors ${
                            activeProject?.id === project.id ? 'bg-gray-600' : ''
                          }`}
                        >
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-gray-300 truncate">{project.description}</div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-400 text-sm">No projects yet</div>
                    )}
                  </div>

                  {/* Manage Projects Button */}
                  <div className="border-t border-gray-600">
                    <button
                      onClick={() => {
                        setIsModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors flex items-center space-x-2 text-blue-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Manage Projects</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Project Management Modal */}
      <ProjectManagementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
