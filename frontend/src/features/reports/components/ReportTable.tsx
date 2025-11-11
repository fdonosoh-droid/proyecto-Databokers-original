/**
 * Componente de tabla para visualización de reportes
 */
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';

interface Column {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string;
  minWidth?: number;
}

interface ReportTableProps {
  title?: string;
  columns: Column[];
  data: any[];
  showTotal?: boolean;
  totalRow?: any;
}

export default function ReportTable({
  title,
  columns,
  data,
  showTotal = false,
  totalRow,
}: ReportTableProps) {
  return (
    <Box className="report-table-container">
      {title && (
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <TableContainer component={Paper} className="print-table">
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    minWidth: column.minWidth,
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} hover>
                {columns.map((column) => {
                  const value = row[column.id];
                  return (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      {column.format ? column.format(value) : value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {showTotal && totalRow && (
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                {columns.map((column) => {
                  const value = totalRow[column.id];
                  return (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {column.format ? column.format(value) : value}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {data.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay datos para mostrar
          </Typography>
        </Box>
      )}
    </Box>
  );
}
