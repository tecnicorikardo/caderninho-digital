import type { ReactNode } from 'react';


interface CardHeaderProps {
  title: string;
  icon?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function CardHeader({ title, icon, actions, children }: CardHeaderProps) {
  // const { isMobile } = useWindowSize();

  return (
    <div className="card-with-header">
      <div className="card-header">
        <h3 className="card-header-title">
          {icon && <span>{icon}</span>}
          {title}
        </h3>
        {actions && (
          <div className="card-header-actions">
            {actions}
          </div>
        )}
      </div>
      {children && (
        <div className="card-body">
          {children}
        </div>
      )}
    </div>
  );
}
