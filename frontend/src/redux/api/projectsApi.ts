import { baseApi } from './baseApi';
import { Project, Typology, Unit } from '../../types';

export interface ProjectFilters {
  estado?: string;
  modeloNegocio?: string;
  regionId?: string;
  comunaId?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Projects
    getProjects: builder.query<PaginatedResponse<Project>, { page?: number; limit?: number; filters?: ProjectFilters }>({
      query: ({ page = 1, limit = 10, filters = {} }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...filters,
        });
        return `/proyectos?${params.toString()}`;
      },
      providesTags: ['Projects'],
    }),
    getProjectById: builder.query<Project, string>({
      query: (id) => `/proyectos/${id}`,
      providesTags: (result, error, id) => [{ type: 'Projects', id }],
    }),
    createProject: builder.mutation<Project, Partial<Project>>({
      query: (body) => ({
        url: '/proyectos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Projects'],
    }),
    updateProject: builder.mutation<Project, { id: string; data: Partial<Project> }>({
      query: ({ id, data }) => ({
        url: `/proyectos/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Projects', id }, 'Projects'],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/proyectos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),
    getProjectStatistics: builder.query<any, string>({
      query: (id) => `/proyectos/${id}/statistics`,
      providesTags: (result, error, id) => [{ type: 'Projects', id }],
    }),

    // Typologies
    getTypologies: builder.query<Typology[], string>({
      query: (projectId) => `/proyectos/${projectId}/tipologias`,
      providesTags: (result, error, projectId) => [{ type: 'Projects', id: projectId }],
    }),
    createTypology: builder.mutation<Typology, { projectId: string; data: Partial<Typology> }>({
      query: ({ projectId, data }) => ({
        url: `/proyectos/${projectId}/tipologias`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),
    updateTypology: builder.mutation<Typology, { projectId: string; id: string; data: Partial<Typology> }>({
      query: ({ projectId, id, data }) => ({
        url: `/proyectos/${projectId}/tipologias/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),
    deleteTypology: builder.mutation<void, { projectId: string; id: string }>({
      query: ({ projectId, id }) => ({
        url: `/proyectos/${projectId}/tipologias/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),

    // Units
    getUnits: builder.query<PaginatedResponse<Unit>, { projectId: string; page?: number; limit?: number }>({
      query: ({ projectId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        return `/proyectos/${projectId}/unidades?${params.toString()}`;
      },
      providesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),
    createUnit: builder.mutation<Unit, { projectId: string; data: Partial<Unit> }>({
      query: ({ projectId, data }) => ({
        url: `/proyectos/${projectId}/unidades`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),
    updateUnit: builder.mutation<Unit, { projectId: string; id: string; data: Partial<Unit> }>({
      query: ({ projectId, id, data }) => ({
        url: `/proyectos/${projectId}/unidades/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),
    deleteUnit: builder.mutation<void, { projectId: string; id: string }>({
      query: ({ projectId, id }) => ({
        url: `/proyectos/${projectId}/unidades/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectStatisticsQuery,
  useGetTypologiesQuery,
  useCreateTypologyMutation,
  useUpdateTypologyMutation,
  useDeleteTypologyMutation,
  useGetUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = projectsApi;
