"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PublicHeader } from "@/components/layout/public-header";
import { usePublicJobs, usePublicJobFamilies, usePublicCareerLevels } from "@/features/public/jobs/jobs.queries";
import { useTranslations } from "next-intl";

import { Select } from "@/components/ui/select";
import type { EmploymentType } from "@/types/domain/recruitment";

export default function JobsPage() {
  const t = useTranslations("LandingPage");
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState<string>("ALL");
  const [employmentType, setEmploymentType] = useState<string>("ALL");
  const [jobFamilyId, setJobFamilyId] = useState<string>("ALL");
  const [careerLevelId, setCareerLevelId] = useState<string>("ALL");

  const { data: jobFamilies } = usePublicJobFamilies();
  const { data: careerLevels } = usePublicCareerLevels();

  const { data, isLoading } = usePublicJobs({
    size: 20,
    search: searchTerm,
    location: location === "ALL" ? undefined : location,
    employmentType: employmentType === "ALL" ? undefined : employmentType as EmploymentType,
    departmentId: jobFamilyId === "ALL" ? undefined : jobFamilyId,
    careerLevelId: careerLevelId === "ALL" ? undefined : careerLevelId
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const familyOptions = [
    { value: "ALL", label: "Tất cả lĩnh vực" },
    ...(jobFamilies?.map((f: unknown) => ({ value: f.id, label: f.description || f.name })) || [])
  ];

  const levelOptions = [
    { value: "ALL", label: "Tất cả cấp bậc" },
    ...(careerLevels?.map((c: unknown) => ({ value: c.id, label: c.name })) || [])
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <PublicHeader />

      {/* Search Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-ink mb-4">
            Cơ hội nghề nghiệp
          </h1>
          <p className="text-lg text-muted mb-8 max-w-2xl">
            Khám phá các vị trí đang tuyển dụng và tìm kiếm cơ hội phát triển sự nghiệp cùng PTIT.
          </p>

          <form onSubmit={handleSearch} className="max-w-4xl flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted" />
              <Input
                type="text"
                placeholder="Tìm kiếm vị trí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-base rounded-[9px]"
              />
            </div>

            <Select
              label="Lĩnh vực"
              value={jobFamilyId}
              onValueChange={setJobFamilyId}
              options={familyOptions}
            />

            <Select
              label="Cấp bậc"
              value={careerLevelId}
              onValueChange={setCareerLevelId}
              options={levelOptions}
            />

            <Select
              label="Địa điểm"
              value={location}
              onValueChange={setLocation}
              options={[
                { value: "ALL", label: "Tất cả địa điểm" },
                { value: "Ha Noi", label: "Hà Nội" },
                { value: "Ho Chi Minh", label: "Hồ Chí Minh" },
                { value: "Da Nang", label: "Đà Nẵng" }
              ]}
            />

            <Select
              label="Loại hình"
              value={employmentType}
              onValueChange={setEmploymentType}
              options={[
                { value: "ALL", label: "Tất cả loại hình" },
                { value: "FULL_TIME", label: "Toàn thời gian" },
                { value: "PART_TIME", label: "Bán thời gian" },
                { value: "INTERNSHIP", label: "Thực tập sinh" },
                { value: "CONTRACT", label: "Hợp đồng" }
              ]}
            />
          </form>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:px-8 w-full">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">
            {data?.totalElements ? `${data.totalElements} vị trí đang tuyển` : "Danh sách vị trí"}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-brand" />
            <p className="mt-4 text-muted">Đang tải danh sách...</p>
          </div>
        ) : data?.content && data.content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.content.map((job) => (
              <div key={job.id} className="group relative flex flex-col justify-between rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:shadow-md hover:border-brand/40">
                <div>
                  <div className="flex items-center gap-x-3 text-xs mb-3">
                    <span className="text-brand font-medium bg-brand/10 px-2 py-1 rounded-md">
                      Mới
                    </span>
                    <span className="text-muted">{job.departmentName}</span>
                  </div>
                  <h3 className="text-lg font-semibold leading-6 text-ink group-hover:text-brand transition-colors">
                    <Link href={`/jobs/${job.id}`}>
                      <span className="absolute inset-0" />
                      {job.title}
                    </Link>
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-soft px-2 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-border-strong">
                      <MapPin className="size-3" /> {job.location || "Hà Nội"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-soft px-2 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-border-strong">
                      <Briefcase className="size-3" /> {job.employmentType === "FULL_TIME" ? "Toàn thời gian" : "Bán thời gian"}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-brand font-medium group-hover:underline">Ứng tuyển ngay</span>
                  <ChevronRight className="size-4 text-brand group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-border">
            <Briefcase className="size-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink">Không tìm thấy vị trí nào</h3>
            <p className="text-muted mt-2">Vui lòng thử nghiệm từ khóa tìm kiếm khác.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 flex items-center justify-between lg:px-8">
          <p className="text-sm text-muted">PTIT Careers © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
