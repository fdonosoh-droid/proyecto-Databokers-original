# Dashboard Components

Componentes reutilizables para el Dashboard Ejecutivo de Databrokers.

## Componentes Disponibles

### KPICard

Tarjeta para mostrar KPIs con comparación de período anterior.

```tsx
import { KPICard } from '@/components/dashboard';

<KPICard
  label="Valorización Total"
  value={1500000000}
  change={12.5}
  trend="up"
  format="currency"
  color="primary"
/>
```

**Props:**
- `label` (string): Etiqueta del KPI
- `value` (number | string): Valor principal
- `change` (number, opcional): Porcentaje de cambio
- `trend` ('up' | 'down' | 'neutral', opcional): Tendencia
- `format` ('currency' | 'percentage' | 'number' | 'days', opcional): Formato del valor
- `color` ('primary' | 'success' | 'warning' | 'error' | 'info', opcional): Color del valor

---

### SalesChart

Gráfico de líneas para ventas por mes.

```tsx
import { SalesChart } from '@/components/dashboard';

<SalesChart
  data={[
    { mes: 'Ene', ventas: 45, ingresos: 1500000 },
    { mes: 'Feb', ventas: 52, ingresos: 1750000 },
  ]}
/>
```

**Props:**
- `data` (Array): Array de objetos con `mes`, `ventas`, `ingresos`

---

### BusinessModelChart

Gráfico de torta para distribución por modelo de negocio.

```tsx
import { BusinessModelChart } from '@/components/dashboard';

<BusinessModelChart
  data={[
    { modelo: 'Venta Directa', cantidad: 150, porcentaje: 45.5 },
    { modelo: 'Canje', cantidad: 100, porcentaje: 30.3 },
  ]}
/>
```

**Props:**
- `data` (Array): Array de objetos con `modelo`, `cantidad`, `porcentaje`

---

### TradeInsChart

Gráfico de barras para canjes por estado.

```tsx
import { TradeInsChart } from '@/components/dashboard';

<TradeInsChart
  data={[
    { estado: 'Iniciado', cantidad: 25 },
    { estado: 'Aprobado', cantidad: 40 },
  ]}
/>
```

**Props:**
- `data` (Array): Array de objetos con `estado`, `cantidad`

---

### PublicationsChart

Gráfico de dona para publicaciones activas.

```tsx
import { PublicationsChart } from '@/components/dashboard';

<PublicationsChart
  data={[
    { tipo: 'Exclusiva', cantidad: 35 },
    { tipo: 'No Exclusiva', cantidad: 60 },
  ]}
/>
```

**Props:**
- `data` (Array): Array de objetos con `tipo`, `cantidad`

---

### RecentActivity

Timeline de actividad reciente.

```tsx
import { RecentActivity } from '@/components/dashboard';

<RecentActivity
  activities={[
    {
      id: '1',
      tipo: 'venta',
      descripcion: 'Nueva venta registrada',
      fecha: '2025-11-11T10:30:00',
      usuario: 'Juan Pérez'
    }
  ]}
/>
```

**Props:**
- `activities` (Array): Array de objetos de tipo `Activity`

---

### AlertsPanel

Panel de alertas con sistema de notificaciones.

```tsx
import { AlertsPanel } from '@/components/dashboard';

<AlertsPanel
  alerts={[
    {
      id: '1',
      tipo: 'critical',
      titulo: 'Error en sistema',
      mensaje: 'Descripción del error',
      fecha: '2025-11-11T10:00:00',
      leida: false
    }
  ]}
  onMarkAsRead={(id) => console.log('Marcar como leída:', id)}
/>
```

**Props:**
- `alerts` (Array): Array de objetos de tipo `Alert`
- `onMarkAsRead` (function, opcional): Callback al marcar alerta como leída

---

### DashboardFilters

Componente de filtros para el dashboard.

```tsx
import { DashboardFilters } from '@/components/dashboard';

<DashboardFilters
  onFiltersChange={(filters) => console.log('Filtros:', filters)}
  onExport={(formato) => console.log('Exportar:', formato)}
/>
```

**Props:**
- `onFiltersChange` (function): Callback cuando cambian los filtros
- `onExport` (function, opcional): Callback para exportar datos

---

## Uso con RTK Query

```tsx
import { useGetDashboardKPIsQuery } from '@/redux/api/dashboardApi';

function MyDashboard() {
  const { data, isLoading } = useGetDashboardKPIsQuery({ periodo: 'mes' });

  if (isLoading) return <CircularProgress />;

  return <KPICard label="Total" value={data.valorizacionTotal} />;
}
```

## Tipos TypeScript

Todos los componentes están completamente tipados. Importa los tipos desde:

```tsx
import type { Alert, KPI } from '@/types';
import type { DashboardKPIs, DashboardStatistics } from '@/redux/api/dashboardApi';
```
