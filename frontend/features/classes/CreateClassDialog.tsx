"use client";

import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateClass } from "@/hooks/useClasses";
import { getErrorMessage } from "@/lib/api-error";
import { CreateClassValues, createClassSchema } from "./schemas";

export function CreateClassDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createClass = useCreateClass();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { code: "", name: "", description: "" },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset();
      createClass.reset();
    }
  };

  const onSubmit = (values: CreateClassValues) => {
    createClass.mutate(values, { onSuccess: () => handleOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a class</DialogTitle>
          <DialogDescription>
            Each class gets its own chat room. You&apos;ll be added as its first moderator.
          </DialogDescription>
        </DialogHeader>

        <form id="create-class-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="class-name" label="Class name" error={errors.name?.message}>
            <Input id="class-name" placeholder="intro-to-programming" autoFocus {...register("name")} />
          </FormField>

          <FormField
            id="class-code"
            label="Class code"
            error={errors.code?.message}
            hint="A short unique code, e.g. CS101."
          >
            <Input id="class-code" placeholder="CS101" className="uppercase" {...register("code")} />
          </FormField>

          <FormField id="class-description" label="Description" error={errors.description?.message}>
            <Textarea
              id="class-description"
              rows={3}
              placeholder="What's this class about?"
              {...register("description")}
            />
          </FormField>

          {createClass.isError && (
            <p className="text-sm text-destructive">{getErrorMessage(createClass.error)}</p>
          )}
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-class-form" isLoading={createClass.isPending}>
            Create class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
