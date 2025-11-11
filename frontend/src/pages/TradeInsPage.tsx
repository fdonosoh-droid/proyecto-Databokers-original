import { useState } from 'react';
import { Box, Tabs, Tab, Dialog, DialogContent } from '@mui/material';
import { PageTitle } from '../components/common';
import {
  TradeInsList,
  TradeInDetail,
  TradeInForm,
  TradeInStats,
} from '../features/tradeins';
import { useUpdateTradeInStatusMutation } from '../redux/api/tradeInsApi';

type ViewMode = 'list' | 'detail' | 'form';

export default function TradeInsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTradeInId, setSelectedTradeInId] = useState<string | null>(null);
  const [updateStatus] = useUpdateTradeInStatusMutation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setViewMode('list');
  };

  const handleView = (id: string) => {
    setSelectedTradeInId(id);
    setViewMode('detail');
  };

  const handleEdit = (id: string) => {
    setSelectedTradeInId(id);
    setViewMode('form');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este canje?')) {
      // Implementar lógica de eliminación
      console.log('Eliminar canje:', id);
    }
  };

  const handleCreate = () => {
    setSelectedTradeInId(null);
    setViewMode('form');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedTradeInId(null);
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setSelectedTradeInId(null);
  };

  const handleChangeStatus = async (newStatus: any) => {
    if (selectedTradeInId) {
      try {
        await updateStatus({
          id: selectedTradeInId,
          data: { estado: newStatus },
        }).unwrap();
        handleBack();
      } catch (error) {
        console.error('Error al cambiar estado:', error);
      }
    }
  };

  return (
    <Box>
      <PageTitle
        title="Gestión de Canjes"
        subtitle="Administra los canjes de propiedades del sistema"
      />

      {viewMode === 'list' && (
        <>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Lista de Canjes" />
            <Tab label="Estadísticas" />
          </Tabs>

          {activeTab === 0 && (
            <TradeInsList
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
            />
          )}

          {activeTab === 1 && <TradeInStats />}
        </>
      )}

      {viewMode === 'detail' && selectedTradeInId && (
        <TradeInDetail
          id={selectedTradeInId}
          onBack={handleBack}
          onEdit={() => handleEdit(selectedTradeInId)}
          onChangeStatus={handleChangeStatus}
        />
      )}

      {viewMode === 'form' && (
        <Dialog open fullWidth maxWidth="md" onClose={handleBack}>
          <DialogContent>
            <TradeInForm
              onSuccess={handleFormSuccess}
              onCancel={handleBack}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
