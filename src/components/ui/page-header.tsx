interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-sm">
      <div>
        <h1 className="text-subheading font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-xs">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-base">{actions}</div>}
    </div>
  );
}
