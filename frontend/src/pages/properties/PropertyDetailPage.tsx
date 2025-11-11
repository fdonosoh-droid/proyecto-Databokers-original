import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
  Divider,
  ImageList,
  ImageListItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Bed as BedIcon,
  Bathtub as BathIcon,
  DirectionsCar as ParkingIcon,
  MeetingRoom as StorageIcon,
} from '@mui/icons-material';
import {
  useGetPropertyByIdQuery,
  useGetPropertyHistoryQuery,
} from '../../redux/api/propertiesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTitle from '../../components/common/PageTitle';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: property, isLoading, error } = useGetPropertyByIdQuery(id!);
  const { data: history = [] } = useGetPropertyHistoryQuery(id!);

  if (isLoading) return <LoadingSpinner />;
  if (error || !property) {
    return <Typography color="error">Error al cargar la propiedad</Typography>;
  }

  // Mock images - reemplazar con property.imagenes cuando esté disponible
  const images = property.imagenes || [];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/propiedades')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box flexGrow={1}>
          <PageTitle title={property.direccion} subtitle={`${property.comuna}, ${property.region}`} />
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/propiedades/${id}/editar`)}
        >
          Editar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Galería de Imágenes */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Galería
              </Typography>
              {images.length > 0 ? (
                <ImageList cols={3} gap={8}>
                  {images.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`Imagen ${index + 1}`}
                        loading="lazy"
                        style={{ height: 200, objectFit: 'cover' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    No hay imágenes disponibles
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Información Principal */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                ${property.precio.toLocaleString()}
              </Typography>
              <Chip
                label={property.estado}
                color={property.estado === 'DISPONIBLE' ? 'success' : 'default'}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Características
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BedIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Dormitorios
                      </Typography>
                      <Typography variant="body1">{property.dormitorios}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BathIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Baños
                      </Typography>
                      <Typography variant="body1">{property.banos}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ParkingIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Estacionamientos
                      </Typography>
                      <Typography variant="body1">{property.estacionamientos}</Typography>
                    </Box>
                  </Box>
                </Grid>
                {property.bodegas !== undefined && (
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StorageIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Bodegas
                        </Typography>
                        <Typography variant="body1">{property.bodegas}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Superficie Total
              </Typography>
              <Typography variant="body1" gutterBottom>
                {property.superficie} m²
              </Typography>

              {property.superficieUtil && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Superficie Útil
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {property.superficieUtil} m²
                  </Typography>
                </>
              )}

              <Typography variant="subtitle2" color="text.secondary">
                Tipo de Propiedad
              </Typography>
              <Typography variant="body1" gutterBottom>
                {property.tipo.replace('_', ' ')}
              </Typography>

              {property.modeloNegocio && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Modelo de Negocio
                  </Typography>
                  <Typography variant="body1">
                    {property.modeloNegocio.replace('_', ' ')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Descripción */}
        {property.descripcion && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Descripción
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {property.descripcion}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Historial */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Historial de Transacciones
              </Typography>
              {history.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Usuario</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(item.fecha).toLocaleDateString('es-CL')}
                          </TableCell>
                          <TableCell>{item.tipo}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.usuario}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  No hay transacciones registradas
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
