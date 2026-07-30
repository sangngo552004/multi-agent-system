"use client";

import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRules, useDeleteRule } from "../knowledge-base.queries";
import { RuleFormModal } from "./rule-form-modal";
import type { InstitutionalRule } from "../knowledge-base.types";

export function RuleTable() {
  const { data: rules, isLoading } = useRules();
  const deleteMutation = useDeleteRule();

  const [editingItem, setEditingItem] = useState<InstitutionalRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (item: InstitutionalRule) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn vô hiệu hoá luật này? Dữ liệu cũ sẽ không bị ảnh hưởng.")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted">Đang tải dữ liệu...</div>;

  return (
    <div className="rounded-[12px] border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold text-ink">Luật thưởng điểm</h2>
        <Button size="sm" onClick={handleCreate}><Plus className="size-4" /> Thêm mới</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted">
          <thead className="bg-surface-hover text-xs uppercase text-ink">
            <tr>
              <th className="px-4 py-3 font-medium">Mã Luật</th>
              <th className="px-4 py-3 font-medium">Tên Luật</th>
              <th className="px-4 py-3 font-medium">Điểm (+)</th>
              <th className="px-4 py-3 font-medium">Tối đa (%)</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(rules || []).map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                <td className="px-4 py-3 font-mono text-xs text-brand font-medium">{item.ruleCode}</td>
                <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                <td className="px-4 py-3 font-semibold text-success">+{item.bonusPoints}</td>
                <td className="px-4 py-3">{item.maxImpactPercent}%</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {item.isActive ? "Hoạt động" : "Đã ẩn"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit2 className="size-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => handleDelete(item.id)}><Trash2 className="size-4" /></Button>
                </td>
              </tr>
            ))}
            {rules?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">Chưa có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RuleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
      />
    </div>
  );
}
