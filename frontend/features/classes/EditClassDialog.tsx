"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateClass } from "@/hooks/useClasses";
import { getErrorMessage } from "@/lib/api-error";
import { ClassRoom } from "@/types/class";
import { UpdateClassValues, updateClassSchema } from "./schemas";

interface EditClassDialogProps {
  classRoom: ClassRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClassDialog({ classRoom, open, onOpenChange }: EditClassDialogProps) {
  const updateClass = useUpdateClass(classRoom.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateClassValues>({
    resolver: zodResolver(updateClassSchema),
  });

  useEffect(() => {
    if (open) {
      reset({ name: classRoom.name, description: classRoom.description });
      updateClass.reset();
    }
    // Only re-seed the form when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (values: UpdateClassValues) => {
    updateClass.mutate(values, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Class settings</DialogTitle>
          <DialogDescription>
            Code <span className="font-mono font-semibold">{classRoom.code}</span> can&apos;t be
            changed.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-class-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="edit-class-name" label="Class name" error={errors.name?.message}>
            <Input id="edit-class-name" {...register("name")} />
          </FormField>

          <FormField id="edit-class-description" label="Description" error={errors.description?.message}>
            <Textarea id="edit-class-description" rows={4} {...register("description")} />
          </FormField>

          {updateClass.isError && (
            <p className="text-sm text-destructive">{getErrorMessage(updateClass.error)}</p>
          )}
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-class-form"
            disabled={!isDirty}
            isLoading={updateClass.isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
