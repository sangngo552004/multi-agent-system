import { RouteScaffold } from "@/components/scaffold/route-scaffold";
import { CandidateJobDetailClient } from "./CandidateJobDetailClient";

export default function CandidateJobDetailPage({ params }: { params: { jobId: string } }) {
  return (
    <RouteScaffold
      portal="Candidate"
      title="Chi tiết việc làm"
      description="Nội dung Job và điểm vào luồng ứng tuyển."
    >
      <CandidateJobDetailClient jobId={params.jobId} />
    </RouteScaffold>
  );
}
