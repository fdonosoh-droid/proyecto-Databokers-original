import { memo } from 'react';
import { Card, CardContent, CardHeader, CardActions } from '@mui/material';

interface CustomCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  sx?: object;
}

const CustomCard = memo(function CustomCard({
  title,
  subtitle,
  children,
  actions,
  sx = {},
}: CustomCardProps) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      {(title || subtitle) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          titleTypographyProps={{ variant: 'h6' }}
        />
      )}
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </Card>
  );
});

export default CustomCard;
