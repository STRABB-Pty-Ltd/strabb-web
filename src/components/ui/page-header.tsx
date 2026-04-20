interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="gap-sm flex items-start justify-between">
      <div>
        <h1 className="text-subheading font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-xs">{description}</p>}
      </div>
      {actions && <div className="gap-base flex items-center">{actions}</div>}
    </div>
  );
}
