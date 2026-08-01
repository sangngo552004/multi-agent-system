import { RouteScaffold } from "@/components/scaffold/route-scaffold";
import { ApplicationsClient } from "./ApplicationsClient";

export default function CandidateApplicationsPage() {
  return (
    <RouteScaffold
      portal="Candidate"
      title="Đơn ứng tuyển"
      description="Theo dõi các Job đã ứng tuyển và trạng thái xử lý."
    >
      <ApplicationsClient />
    </RouteScaffold>
  );
}
