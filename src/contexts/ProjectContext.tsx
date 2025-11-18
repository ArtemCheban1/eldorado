'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@/types';
import axios from 'axios';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  createProject: (name: string, description?: string, defaultCenter?: [number, number], defaultZoom?: number) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Save active project to localStorage when it changes
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('activeProjectId', activeProject.id);
    }
  }, [activeProject]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/projects');
      const loadedProjects = response.data.projects;
      setProjects(loadedProjects);

      // Try to restore the last active project from localStorage
      const savedProjectId = localStorage.getItem('activeProjectId');
      if (savedProjectId) {
        const savedProject = loadedProjects.find((p: Project) => p.id === savedProjectId);
        if (savedProject) {
          setActiveProject(savedProject);
          return;
        }
      }

      // If no saved project or it doesn't exist, use the first project
      if (loadedProjects.length > 0) {
        setActiveProject(loadedProjects[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (
    name: string,
    description?: string,
    defaultCenter?: [number, number],
    defaultZoom?: number
  ): Promise<Project> => {
    try {
      const response = await axios.post('/api/projects', {
        name,
        description,
        defaultCenter,
        defaultZoom,
      });
      const newProject = response.data.project;
      setProjects([...projects, newProject]);
      setActiveProject(newProject);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const response = await axios.patch(`/api/projects/${projectId}`, updates);
      const updatedProject = response.data.project;

      setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
      if (activeProject?.id === projectId) {
        setActiveProject(updatedProject);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await axios.delete(`/api/projects/${projectId}`);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);

      // If we deleted the active project, switch to another one
      if (activeProject?.id === projectId) {
        setActiveProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
        if (updatedProjects.length === 0) {
          localStorage.removeItem('activeProjectId');
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
