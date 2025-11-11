import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
} from '@mui/material';
import { FilterList, Download } from '@mui/icons-material';
import { DashboardFilters as Filters } from '../../redux/api/dashboardApi';

interface DashboardFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  onExport?: (formato: 'pdf' | 'excel') => void;
}

export default function DashboardFilters({ onFiltersChange, onExport }: DashboardFiltersProps) {
  const [periodo, setPeriodo] = useState<Filters['periodo']>('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [modeloNegocio, setModeloNegocio] = useState('');
  const [regionId, setRegionId] = useState('');

  const handleApplyFilters = () => {
    const filters: Filters = {
      periodo,
      ...(periodo === 'personalizado' && fechaInicio && fechaFin && {
        fechaInicio,
        fechaFin,
      }),
      ...(modeloNegocio && { modeloNegocio }),
      ...(regionId && { regionId }),
    };
    onFiltersChange(filters);
  };

  const handleResetFilters = () => {
    setPeriodo('mes');
    setFechaInicio('');
    setFechaFin('');
    setModeloNegocio('');
    setRegionId('');
    onFiltersChange({ periodo: 'mes' });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterList sx={{ mr: 1 }} />
          <Box sx={{ typography: 'h6' }}>Filtros</Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={periodo}
                label="Período"
                onChange={(e) => setPeriodo(e.target.value as Filters['periodo'])}
              >
                <MenuItem value="hoy">Hoy</MenuItem>
                <MenuItem value="semana">Esta Semana</MenuItem>
                <MenuItem value="mes">Este Mes</MenuItem>
                <MenuItem value="anio">Este Año</MenuItem>
                <MenuItem value="personalizado">Personalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {periodo === 'personalizado' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha Inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha Fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Modelo de Negocio</InputLabel>
              <Select
                value={modeloNegocio}
                label="Modelo de Negocio"
                onChange={(e) => setModeloNegocio(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="VENTA_DIRECTA">Venta Directa</MenuItem>
                <MenuItem value="CANJE">Canje</MenuItem>
                <MenuItem value="LEASING">Leasing</MenuItem>
                <MenuItem value="SUBSIDIO">Subsidio</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Región</InputLabel>
              <Select
                value={regionId}
                label="Región"
                onChange={(e) => setRegionId(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="1">Región Metropolitana</MenuItem>
                <MenuItem value="2">Valparaíso</MenuItem>
                <MenuItem value="3">Biobío</MenuItem>
                {/* Agregar más regiones según necesidad */}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyFilters}
              size="medium"
            >
              Aplicar Filtros
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
              size="medium"
            >
              Limpiar
            </Button>
          </Grid>

          {onExport && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => onExport('pdf')}
                  size="medium"
                >
                  Exportar PDF
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => onExport('excel')}
                  size="medium"
                >
                  Exportar Excel
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}
