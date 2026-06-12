import { useState, type ReactNode } from 'react';
import {
  panelContainerStyle,
  accordionHeaderStyle,
  accordionTitleGroupStyle,
  accordionIconStyle,
  accordionTitleStyle,
  accordionMetaStyle,
  accordionBodyStyle,
} from '../../styles/dashboardStyles';

interface AccordionPanelProps {
  title: string;
  icon?: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  rightAction?: ReactNode;
}

export const AccordionPanel = ({
  title,
  icon,
  meta,
  defaultOpen = false,
  children,
  rightAction,
}: AccordionPanelProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={panelContainerStyle}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{ ...accordionHeaderStyle, flex: 1 }}
        >
          <div style={accordionTitleGroupStyle}>
            <span style={accordionIconStyle}>{isOpen ? '▾' : '▸'}{icon ? ` ${icon}` : ''}</span>
            <span style={accordionTitleStyle}>{title}</span>
          </div>

          <div style={accordionMetaStyle}>
            {meta}
          </div>
        </button>
        {rightAction && (
          <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', paddingRight: '1rem' }}>
            {rightAction}
          </div>
        )}
      </div>

      {isOpen && (
        <div style={accordionBodyStyle}>
          {children}
        </div>
      )}
    </div>
  );
};
