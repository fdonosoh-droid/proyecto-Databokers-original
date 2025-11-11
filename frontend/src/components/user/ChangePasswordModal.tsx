import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePasswordMutation } from '@/redux/api/authApi';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ open, onClose }: ChangePasswordModalProps) => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleClose = () => {
    reset();
    setSuccessMessage('');
    setErrorMessage('');
    onClose();
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap();

      setSuccessMessage('Contraseña actualizada exitosamente');

      // Cerrar el modal después de 1.5 segundos
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      setErrorMessage(
        error?.data?.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.'
      );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Cambiar Contraseña
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {/* Mensaje de éxito */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {/* Mensaje de error */}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {/* Contraseña actual */}
          <TextField
            fullWidth
            label="Contraseña Actual"
            type="password"
            margin="normal"
            {...register('currentPassword')}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword?.message}
          />

          {/* Nueva contraseña */}
          <TextField
            fullWidth
            label="Nueva Contraseña"
            type="password"
            margin="normal"
            {...register('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
          />

          {/* Confirmar nueva contraseña */}
          <TextField
            fullWidth
            label="Confirmar Nueva Contraseña"
            type="password"
            margin="normal"
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            Cambiar Contraseña
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordModal;
