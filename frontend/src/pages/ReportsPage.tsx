/**
 * Página principal del módulo de Reportes
 */
import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  Grid,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  SwapHoriz as SwapIcon,
  Announcement as AnnouncementIcon,
  AttachMoney as MoneyIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import PageTitle from '../components/common/PageTitle';
import ReportGenerator from '../features/reports/components/ReportGenerator';
import ScheduledReportsPage from '../features/reports/components/ScheduledReportsPage';
import { useGetReportHistoryQuery } from '../redux/api/reportsApi';

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const REPORT_TYPES = [
  {
    title: 'Reporte de Proyectos',
    description: 'Análisis completo de proyectos inmobiliarios',
    icon: <DescriptionIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Reporte de Ventas',
    description: 'Ventas realizadas y métricas de conversión',
    icon: <TrendingUpIcon fontSize="large" color="success" />,
  },
  {
    title: 'Reporte de Canjes',
    description: 'Análisis de canjes (trade-ins) realizados',
    icon: <SwapIcon fontSize="large" color="info" />,
  },
  {
    title: 'Reporte de Publicaciones',
    description: 'Estadísticas de publicaciones y corredores',
    icon: <AnnouncementIcon fontSize="large" color="secondary" />,
  },
  {
    title: 'Reporte de Comisiones',
    description: 'Detalle de comisiones generadas',
    icon: <MoneyIcon fontSize="large" color="warning" />,
  },
  {
    title: 'Reporte Consolidado',
    description: 'Resumen ejecutivo de todos los módulos',
    icon: <DashboardIcon fontSize="large" color="error" />,
  },
];

export default function ReportsPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const { data: historyData } = useGetReportHistoryQuery({ page: 1, limit: 10 });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <PageTitle title="Sistema de Reportes" />

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab icon={<AssessmentIcon />} label="Generar Reporte" />
          <Tab icon={<HistoryIcon />} label="Historial" />
          <Tab icon={<ScheduleIcon />} label="Reportes Programados" />
        </Tabs>
      </Paper>

      <TabPanel value={currentTab} index={0}>
        {/* Descripción de tipos de reportes */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {REPORT_TYPES.map((report, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card>
                <CardActionArea>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {report.icon}
                      <Typography variant="h6" sx={{ ml: 2 }}>
                        {report.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {report.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Generador de reportes */}
        <ReportGenerator />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Historial de reportes generados */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Historial de Reportes
          </Typography>
          {historyData && historyData.reports.length > 0 ? (
            <Box>
              {historyData.reports.map((report) => (
                <Paper key={report.id} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle1">{report.type}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(report.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2">
                        Formato: {report.format.toUpperCase()}
                      </Typography>
                      <Typography variant="body2">Estado: {report.status}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      {report.fileUrl && (
                        <a href={report.fileUrl} download>
                          Descargar
                        </a>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay reportes generados aún
            </Typography>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Reportes programados */}
        <ScheduledReportsPage />
      </TabPanel>
    </Box>
  );
}
