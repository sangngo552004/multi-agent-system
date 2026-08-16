"use client";

import { useState } from "react";
import { Edit2, ListTree, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompetencies, useDeleteCompetency } from "../knowledge-base.queries";
import { CompetencyFormModal } from "./competency-form-modal";
import type { Competency } from "../knowledge-base.types";
import { CompetencyLevelsDialog } from "./competency-levels-dialog";

export function CompetencyTable() {
  const { data: competencies, isLoading } = useCompetencies();
  const deleteMutation = useDeleteCompetency();

  const [editingItem, setEditingItem] = useState<Competency | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [levelsItem, setLevelsItem] = useState<{ competency: Competency; initialLevel?: number } | null>(null);

  const handleEdit = (item: Competency) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn vô hiệu hoá kỹ năng này? Dữ liệu cũ sẽ không bị ảnh hưởng.")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted">Đang tải dữ liệu...</div>;

  return (
    <div className="rounded-[12px] border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold text-ink">Danh sách Kỹ năng</h2>
        <Button size="sm" onClick={handleCreate}><Plus className="size-4" /> Thêm mới</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted">
          <thead className="bg-surface-hover text-xs uppercase text-ink">
            <tr>
              <th className="px-4 py-3 font-medium">Tên kỹ năng</th>
              <th className="px-4 py-3 font-medium">Danh mục</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(competencies || []).map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {item.isActive ? "Hoạt động" : "Đã ẩn"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" title="Thang năng lực" onClick={() => setLevelsItem({ competency: item })}><ListTree className="size-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit2 className="size-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => handleDelete(item.id)}><Trash2 className="size-4" /></Button>
                </td>
              </tr>
            ))}
            {competencies?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">Chưa có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CompetencyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        onConfigureLevels={(competency, level) => setLevelsItem({ competency, initialLevel: level })}
      />
      <CompetencyLevelsDialog competency={levelsItem?.competency ?? null} initialLevel={levelsItem?.initialLevel} onClose={() => setLevelsItem(null)} />
    </div>
  );
}
