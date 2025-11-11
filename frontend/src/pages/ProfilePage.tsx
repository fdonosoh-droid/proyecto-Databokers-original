import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Edit, Save, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { selectCurrentUser } from '@/redux/slices/authSlice';
import { updateUser } from '@/redux/slices/authSlice';
import { useUpdateProfileMutation } from '@/redux/api/authApi';
import PageTitle from '@/components/common/PageTitle';
import ChangePasswordModal from '@/components/user/ChangePasswordModal';

const profileSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
    });
    setSuccessMessage('');
    setErrorMessage('');
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const updatedUser = await updateProfile(data).unwrap();

      // Actualizar el usuario en Redux
      dispatch(updateUser(updatedUser));

      setSuccessMessage('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      setErrorMessage(
        error?.data?.message || 'Error al actualizar el perfil.'
      );
    }
  };

  if (!user) {
    return (
      <Container>
        <Alert severity="error">No se pudo cargar la información del usuario</Alert>
      </Container>
    );
  }

  const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageTitle title="Mi Perfil" />

      <Paper elevation={2} sx={{ p: 4, mt: 3 }}>
        {/* Avatar y nombre */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: 40,
              mb: 2,
            }}
          >
            {initials}
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {user.nombre} {user.apellido}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              mt: 1,
              px: 2,
              py: 0.5,
              bgcolor: 'primary.light',
              color: 'primary.dark',
              borderRadius: 2,
            }}
          >
            {user.rol}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Mensajes */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre"
              {...register('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
              disabled={!isEditing}
            />

            <TextField
              fullWidth
              label="Apellido"
              {...register('apellido')}
              error={!!errors.apellido}
              helperText={errors.apellido?.message}
              disabled={!isEditing}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={!isEditing}
            />

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {!isEditing ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={handleEdit}
                  >
                    Editar Perfil
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Lock />}
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    Cambiar Contraseña
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                    disabled={isLoading}
                  >
                    Guardar Cambios
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Container>
  );
};

export default ProfilePage;
