# Seeds Iniciales - Fase 2

Se han insertado los siguientes datos por defecto en las tablas de configuración. Se ha utilizado la cláusula `ON CONFLICT DO NOTHING` para que los insert sean re-ejecutables sin causar duplicados ni errores.

## 1. control_parametros_zona

Se insertaron las siguientes 7 zonas iniciales junto con su parámetro de "brigadas_contrato":
- Iquique (3)
- Coquimbo (16)
- Santa Cruz (4)
- Talca (11)
- Concepción (21)
- Los Ángeles (3)
- Chillán (3)

(El estado `activo` por defecto es `true`).

## 2. control_parametros_generales

Se insertó el registro principal con los parámetros globales básicos de la beta:
- meta_diaria_cortes_brigada: 30
- hora_inicio_jornada: 08:00
- hora_cierre_jornada: 14:00
- activo: true
