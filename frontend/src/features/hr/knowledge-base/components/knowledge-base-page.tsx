"use client";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Briefcase, GraduationCap, Scale } from "lucide-react";
import { CompetencyTable } from "./competency-table";
import { RuleTable } from "./rule-table";
import { JobFamilyTable } from "./job-family-table";
import { CareerLevelTable } from "./career-level-table";

export function KnowledgeBasePage() {
   // We need to add this to vi.json

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3 text-brand">
          <BrainCircuit className="size-6" />
          <span className="font-semibold uppercase tracking-wider text-xs">AI Knowledge Base</span>
        </div>
        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-ink sm:text-[38px]">Kho tri thức đối sánh</h1>
        <p className="mt-2 text-sm text-muted">Quản lý các danh mục dữ liệu gốc dùng để chuẩn hoá tin tuyển dụng và thiết lập luật chấm điểm cho AI.</p>
      </header>

      <Tabs defaultValue="competencies" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="competencies" className="flex items-center gap-2"><BrainCircuit className="size-4" /> Kỹ năng</TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2"><Scale className="size-4" /> Luật thưởng</TabsTrigger>
          <TabsTrigger value="job-families" className="flex items-center gap-2"><Briefcase className="size-4" /> Nhóm nghề</TabsTrigger>
          <TabsTrigger value="career-levels" className="flex items-center gap-2"><GraduationCap className="size-4" /> Cấp bậc</TabsTrigger>
        </TabsList>
        <TabsContent value="competencies" className="outline-none">
          <CompetencyTable />
        </TabsContent>
        <TabsContent value="rules" className="outline-none">
          <RuleTable />
        </TabsContent>
        <TabsContent value="job-families" className="outline-none">
          <JobFamilyTable />
        </TabsContent>
        <TabsContent value="career-levels" className="outline-none">
          <CareerLevelTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
