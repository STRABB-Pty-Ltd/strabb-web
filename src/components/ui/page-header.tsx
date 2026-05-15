interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="gap-sm flex items-start justify-between">
      <div>
        {/* h2 because app-shell renders a sr-only h1 with the page name; this
            keeps the document outline as h1 (page) -> h2 (section title) -> h3
            (subsections) without duplicating the page-level h1. */}
        <h2 className="text-subheading font-bold">{title}</h2>
        {description && <p className="text-muted-foreground mt-xs">{description}</p>}
      </div>
      {actions && <div className="gap-base flex items-center">{actions}</div>}
    </div>
  );
}
