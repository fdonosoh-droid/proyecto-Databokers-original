import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Tab,
  Tabs,
  Typography,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useGetProjectByIdQuery } from '../../redux/api/projectsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTitle from '../../components/common/PageTitle';
import ProjectTypologies from '../../components/projects/ProjectTypologies';
import ProjectUnits from '../../components/projects/ProjectUnits';
import ProjectStatistics from '../../components/projects/ProjectStatistics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const { data: project, isLoading, error } = useGetProjectByIdQuery(id!);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error || !project) {
    return <Typography color="error">Error al cargar el proyecto</Typography>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/proyectos')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box flexGrow={1}>
          <PageTitle
            title={project.nombre}
            subtitle={`${project.comuna?.nombre}, ${project.region?.nombre}`}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/proyectos/${id}/editar`)}
        >
          Editar
        </Button>
      </Box>

      {/* Información General */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Inmobiliaria
              </Typography>
              <Typography variant="body1" gutterBottom>
                {project.inmobiliaria?.nombre || 'N/A'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Estado
              </Typography>
              <Chip
                label={project.estado.replace('_', ' ')}
                color={project.estado === 'ACTIVO' ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Dirección
              </Typography>
              <Typography variant="body1">
                {project.direccion}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Modelo de Negocio
              </Typography>
              <Typography variant="body1">
                {project.modeloNegocio.replace('_', ' ')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha Inicio Ventas
              </Typography>
              <Typography variant="body1">
                {new Date(project.fechaInicioVentas).toLocaleDateString('es-CL')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de Entrega
              </Typography>
              <Typography variant="body1">
                {new Date(project.fechaEntrega).toLocaleDateString('es-CL')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Unidades
              </Typography>
              <Typography variant="body1">
                {project.unidadesDisponibles} disponibles de {project.totalUnidades} totales
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="project tabs"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Tipologías" />
          <Tab label="Unidades" />
          <Tab label="Estadísticas" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <ProjectTypologies projectId={id!} />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <ProjectUnits projectId={id!} />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <ProjectStatistics projectId={id!} />
        </TabPanel>
      </Card>
    </Box>
  );
}
