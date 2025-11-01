import { ReactNode } from "react";
import "./mainLayout.css";

interface MainLayoutProps {
  header?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
}

export function MainLayout({ header, body, footer }: MainLayoutProps) {
  return (
    <div className="main-layout">
      {header && (
        <header className="layout-header border-b">
          <div className="content-max-width">{header}</div>
        </header>
      )}

      <main className="layout-body">
        <div className="content-max-width">{body}</div>
      </main>

      {footer && (
        <footer className="layout-footer border-t">
          <div className="content-max-width">{footer}</div>
        </footer>
      )}
    </div>
  );
}
