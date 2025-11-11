import { useState } from 'react';
import { Box, Tabs, Tab, Dialog, DialogContent } from '@mui/material';
import { PageTitle } from '../components/common';
import {
  PublicationsList,
  PublicationDetail,
  PublicationForm,
  PublicationStats,
} from '../features/publications';
import {
  useTogglePublicationStatusMutation,
  useFinalizePublicationMutation,
  useRenewPublicationMutation,
} from '../redux/api/publicationsApi';

type ViewMode = 'list' | 'detail' | 'form';

export default function PublicationsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPublicationId, setSelectedPublicationId] = useState<string | null>(
    null
  );
  const [toggleStatus] = useTogglePublicationStatusMutation();
  const [finalizePublication] = useFinalizePublicationMutation();
  const [renewPublication] = useRenewPublicationMutation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setViewMode('list');
  };

  const handleView = (id: string) => {
    setSelectedPublicationId(id);
    setViewMode('detail');
  };

  const handleEdit = (id: string) => {
    setSelectedPublicationId(id);
    setViewMode('form');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta publicación?')) {
      // Implementar lógica de eliminación
      console.log('Eliminar publicación:', id);
    }
  };

  const handleCreate = () => {
    setSelectedPublicationId(null);
    setViewMode('form');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedPublicationId(null);
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setSelectedPublicationId(null);
  };

  const handleToggleStatus = async (id?: string) => {
    const publicationId = id || selectedPublicationId;
    if (publicationId) {
      try {
        await toggleStatus(publicationId).unwrap();
        if (!id) handleBack();
      } catch (error) {
        console.error('Error al cambiar estado:', error);
      }
    }
  };

  const handleFinalize = async () => {
    if (selectedPublicationId) {
      try {
        await finalizePublication({
          id: selectedPublicationId,
        }).unwrap();
        handleBack();
      } catch (error) {
        console.error('Error al finalizar publicación:', error);
      }
    }
  };

  const handleRenew = async (id?: string) => {
    const publicationId = id || selectedPublicationId;
    if (publicationId) {
      const nuevaFechaVencimiento = prompt(
        'Ingrese la nueva fecha de vencimiento (YYYY-MM-DD):'
      );
      if (nuevaFechaVencimiento) {
        try {
          await renewPublication({
            id: publicationId,
            nuevaFechaVencimiento,
          }).unwrap();
          if (!id) handleBack();
        } catch (error) {
          console.error('Error al renovar publicación:', error);
        }
      }
    }
  };

  return (
    <Box>
      <PageTitle
        title="Gestión de Publicaciones"
        subtitle="Administra las publicaciones de propiedades en portales externos"
      />

      {viewMode === 'list' && (
        <>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Lista de Publicaciones" />
            <Tab label="Estadísticas" />
          </Tabs>

          {activeTab === 0 && (
            <PublicationsList
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
              onToggleStatus={handleToggleStatus}
              onRenew={handleRenew}
            />
          )}

          {activeTab === 1 && <PublicationStats />}
        </>
      )}

      {viewMode === 'detail' && selectedPublicationId && (
        <PublicationDetail
          id={selectedPublicationId}
          onBack={handleBack}
          onEdit={() => handleEdit(selectedPublicationId)}
          onToggleStatus={() => handleToggleStatus()}
          onFinalize={handleFinalize}
          onRenew={() => handleRenew()}
        />
      )}

      {viewMode === 'form' && (
        <Dialog open fullWidth maxWidth="md" onClose={handleBack}>
          <DialogContent>
            <PublicationForm onSuccess={handleFormSuccess} onCancel={handleBack} />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
