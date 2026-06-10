import { errorAlertStyle, successAlertStyle } from '../../styles/dashboardStyles';

interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
}

export const AlertMessage = ({ type, message }: AlertMessageProps) => {
  if (!message) return null;

  return (
    <div style={type === 'error' ? errorAlertStyle : successAlertStyle}>
      {message}
    </div>
  );
};
