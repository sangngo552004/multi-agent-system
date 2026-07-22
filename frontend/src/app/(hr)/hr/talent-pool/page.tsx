import type { Metadata } from "next";
import { HrTalentPoolPage } from "@/features/hr/talent-pool/components/talent-pool-page";

export const metadata: Metadata = { title: "Kho ứng viên tiềm năng" };

export default function HrTalentPoolRoute() { return <HrTalentPoolPage />; }
