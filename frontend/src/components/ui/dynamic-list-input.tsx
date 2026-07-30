"use client";

import { useFieldArray, type Control } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DynamicListInput({
  control,
  name,
  placeholder,
  error,
}: {
  control: Control<unknown>;
  name: string;
  placeholder: string;
  error?: string | unknown;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-2">
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <div className="flex h-10 w-8 items-center justify-center cursor-grab text-muted hover:text-ink active:cursor-grabbing">
            <GripVertical className="size-4" />
          </div>
          <Input
            {...control.register(`${name}.${index}` as const)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted hover:text-danger"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append("")}
        >
          <Plus className="mr-2 size-4" /> Thêm tiêu chí
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{typeof error === "string" ? error : error.message || "Vui lòng nhập đầy đủ"}</p>}
    </div>
  );
}
