type RouteScaffoldProps = {
  portal: "Admin" | "HR" | "Candidate" | "Auth";
  title: string;
  description: string;
};

/**
 * Temporary route marker used before feature phases begin.
 * Replace this component with the owning feature's page composition.
 */
export function RouteScaffold({
  portal,
  title,
  description,
}: RouteScaffoldProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
      <div className="max-w-2xl rounded-lg border border-dashed border-zinc-300 bg-white p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          {portal} portal · scaffold only
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
        <p className="mt-8 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
          Route đã được khởi tạo. Chưa có chức năng hoặc giao diện phase nào được
          triển khai.
        </p>
      </div>
    </main>
  );
}
