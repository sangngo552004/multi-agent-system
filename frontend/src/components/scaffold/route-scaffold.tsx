type RouteScaffoldProps = {
  portal: "Admin" | "HR" | "Candidate" | "Auth";
  title: string;
  description: string;
};

/** Temporary marker for routes assigned to a later feature phase. */
export function RouteScaffold({ portal, title, description }: RouteScaffoldProps) {
  return (
    <section className="flex min-h-[calc(100vh-9rem)] w-full flex-col justify-center py-10">
      <div className="max-w-2xl rounded-[12px] border border-dashed border-border-strong bg-surface p-8">
        <p className="admin-kicker text-brand">{portal} portal · sắp phát triển</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        <p className="mt-8 border-t border-border pt-4 text-xs text-faint">Route đã sẵn sàng trong cấu trúc dự án. Chức năng này thuộc phase tiếp theo.</p>
      </div>
    </section>
  );
}
