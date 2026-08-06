
import { ApplicationsClient } from "./ApplicationsClient";

export default function CandidateApplicationsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Đơn ứng tuyển</h1>
      <p className="text-muted-foreground mb-8">Theo dõi các Job đã ứng tuyển và trạng thái xử lý.</p>
      <ApplicationsClient />
    </div>
  );
}
