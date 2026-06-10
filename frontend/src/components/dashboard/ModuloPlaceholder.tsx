
import { contentStackStyle, panelContainerStyle } from '../../styles/dashboardStyles';

interface ModuloPlaceholderProps {
  formulario: string;
  seccion: string;
}

export const ModuloPlaceholder = ({ formulario, seccion }: ModuloPlaceholderProps) => {
  return (
    <div style={contentStackStyle}>
      <div style={{ ...panelContainerStyle, textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#0A192F', marginBottom: '0.5rem' }}>{formulario}</h2>
        <h3 style={{ fontSize: '1.2rem', color: '#007BFF', marginBottom: '1.5rem', fontWeight: 'normal' }}>Módulo en preparación</h3>
        <p style={{ color: '#64748B', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          La sección <strong>"{seccion}"</strong> estará disponible en una próxima etapa. 
          Por ahora solo el módulo CyR está habilitado y operativo.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', opacity: 0.5, pointerEvents: 'none' }}>
           <div style={{ background: '#F1F5F9', padding: '1.5rem', borderRadius: '8px', minWidth: '200px' }}>
              <div style={{ width: '40px', height: '40px', background: '#CBD5E1', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
              <div style={{ height: '12px', background: '#CBD5E1', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
              <div style={{ height: '12px', background: '#CBD5E1', borderRadius: '4px', width: '60%', margin: '0 auto' }}></div>
           </div>
           <div style={{ background: '#F1F5F9', padding: '1.5rem', borderRadius: '8px', minWidth: '200px' }}>
              <div style={{ width: '40px', height: '40px', background: '#CBD5E1', borderRadius: '50%', margin: '0 auto 1rem auto' }}></div>
              <div style={{ height: '12px', background: '#CBD5E1', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
              <div style={{ height: '12px', background: '#CBD5E1', borderRadius: '4px', width: '60%', margin: '0 auto' }}></div>
           </div>
        </div>
      </div>
    </div>
  );
};

