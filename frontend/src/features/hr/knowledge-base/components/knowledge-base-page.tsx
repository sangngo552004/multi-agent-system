"use client";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Building2, Layers3, Scale } from "lucide-react";
import { CompetencyTable } from "./competency-table";
import { RuleTable } from "./rule-table";
import { PedigreeManager } from "./pedigree-manager";

export function KnowledgeBasePage() {
   // We need to add this to vi.json

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3 text-brand">
          <BrainCircuit className="size-6" />
          <span className="font-semibold uppercase tracking-wider text-xs">Kho cấu hình đối sánh</span>
        </div>
        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-ink sm:text-[38px]">Kho tri thức đối sánh</h1>
        <p className="mt-2 text-sm text-muted">Quản lý năng lực và quy tắc dùng để đối chiếu hồ sơ ứng viên.</p>
      </header>

      <Tabs defaultValue="competencies" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:max-w-3xl sm:grid-cols-4">
          <TabsTrigger value="competencies" className="flex items-center gap-2"><BrainCircuit className="size-4" /> Năng lực đối sánh</TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2"><Scale className="size-4" /> Quy tắc đối sánh</TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2"><Building2 className="size-4" /> Tổ chức & alias</TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2"><Layers3 className="size-4" /> Nhóm đối chiếu</TabsTrigger>
        </TabsList>
        <TabsContent value="competencies" className="outline-none">
          <CompetencyTable />
        </TabsContent>
        <TabsContent value="rules" className="outline-none">
          <RuleTable />
        </TabsContent>
        <TabsContent value="organizations" className="outline-none"><PedigreeManager mode="organizations" /></TabsContent>
        <TabsContent value="groups" className="outline-none"><PedigreeManager mode="groups" /></TabsContent>
      </Tabs>
    </div>
  );
}
