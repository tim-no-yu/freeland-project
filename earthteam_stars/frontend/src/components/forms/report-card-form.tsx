"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState, useCallback } from "react";
import type { ReportCardType } from "@/lib/types";

// ── Zod Schema ───────────────────────────────────────────────────
const witnessSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  organization: z.string().optional(),
  relationship: z.string().optional(),
});

const baseSchema = z.object({
  type: z.enum(["action", "impact"]),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Please provide more detail").max(2000),
  category: z.enum([
    "wildlife_protection",
    "habitat_protection",
    "regenerative_agriculture",
  ]),
  activity_date: z.string().min(1, "Activity date is required"),
  location: z.string().optional(),
  notes: z.string().max(1000).optional(),
  witnesses: z.array(witnessSchema),
});

const impactExtension = z.object({
  outcomes: z.string().min(20, "Please describe the outcomes").max(2000),
  metrics_value: z.coerce.number().positive().optional(),
  metrics_unit: z.string().optional(),
  baseline_description: z.string().max(2000).optional(),
});

const actionSchema = baseSchema;
const impactSchema = baseSchema.merge(impactExtension);

type ActionFormData = z.infer<typeof actionSchema>;
type ImpactFormData = z.infer<typeof impactSchema>;
type FormData = ActionFormData | ImpactFormData;

// ── Props ────────────────────────────────────────────────────────
interface ReportCardFormProps {
  onSubmit: (data: FormData, files: File[]) => Promise<void>;
  defaultType?: ReportCardType;
}

export function ReportCardForm({
  onSubmit,
  defaultType = "action",
}: ReportCardFormProps) {
  const [reportType, setReportType] = useState<ReportCardType>(defaultType);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = reportType === "impact" ? impactSchema : actionSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      title: "",
      description: "",
      category: undefined,
      activity_date: "",
      location: "",
      notes: "",
      witnesses: [],
      outcomes: "",
      metrics_unit: "",
      baseline_description: "",
    } as unknown as FormData,
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } =
    useFieldArray({ control, name: "witnesses" });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      }
    },
    [],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data, files);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* ── Type Selector ─────────────────────────────────── */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Report Card Type
        </label>
        <div className="flex gap-3">
          {(["action", "impact"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setReportType(t)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                reportType === t
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "action" ? "Action (Silver)" : "Impact (Gold)"}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("type")} value={reportType} />
      </div>

      {/* ── Basic Info ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="title"
            label="Title"
            placeholder="e.g. Anti-poaching patrol in Tsavo East"
            error={errors.title?.message}
            {...register("title")}
          />
        </div>

        <Select
          id="category"
          label="Category"
          placeholder="Select a category"
          options={CATEGORY_OPTIONS}
          error={errors.category?.message}
          {...register("category")}
        />

        <Input
          id="activity_date"
          label="Activity Date"
          type="date"
          error={errors.activity_date?.message}
          {...register("activity_date")}
        />

        <Input
          id="location"
          label="Location"
          placeholder="e.g. Tsavo East National Park, Kenya"
          {...register("location")}
        />
      </div>

      <Textarea
        id="description"
        label="Description"
        placeholder="Describe what you did, including specific details and quantities..."
        error={errors.description?.message}
        {...register("description")}
      />

      {/* ── Impact-specific fields ────────────────────────── */}
      {reportType === "impact" && (
        <div className="space-y-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="text-sm font-semibold text-yellow-800">
            Impact Details (Gold Level)
          </h3>
          <Textarea
            id="outcomes"
            label="Outcomes Achieved"
            placeholder="What changed as a result of this action? Be specific..."
            error={(errors as Record<string, { message?: string }>).outcomes?.message}
            {...register("outcomes" as keyof FormData)}
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              id="metrics_value"
              label="Metric Value"
              type="number"
              placeholder="e.g. 500"
              {...register("metrics_value" as keyof FormData)}
            />
            <Input
              id="metrics_unit"
              label="Metric Unit"
              placeholder="e.g. seedlings planted, hectares restored"
              {...register("metrics_unit" as keyof FormData)}
            />
          </div>
          <Textarea
            id="baseline_description"
            label="Baseline Description"
            placeholder="What was the situation before this action?"
            {...register("baseline_description" as keyof FormData)}
          />
        </div>
      )}

      {/* ── Evidence Upload ───────────────────────────────── */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Evidence (Photos, Files)
        </label>
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag files here or click to browse
          </p>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="mt-2 text-sm"
          />
        </div>
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
              >
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Witnesses ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Witnesses
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              addWitness({ name: "", email: "", organization: "", relationship: "" })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add Witness
          </Button>
        </div>

        {witnessFields.length === 0 && (
          <p className="text-sm text-gray-400">
            No witnesses added. Click &quot;Add Witness&quot; above.
          </p>
        )}

        {witnessFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-4"
          >
            <Input
              placeholder="Name"
              error={errors.witnesses?.[index]?.name?.message}
              {...register(`witnesses.${index}.name`)}
            />
            <Input
              placeholder="Email"
              type="email"
              {...register(`witnesses.${index}.email`)}
            />
            <Input
              placeholder="Organization"
              {...register(`witnesses.${index}.organization`)}
            />
            <div className="flex items-start gap-2">
              <Input
                placeholder="Relationship"
                {...register(`witnesses.${index}.relationship`)}
              />
              <button
                type="button"
                onClick={() => removeWitness(index)}
                className="mt-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Notes ─────────────────────────────────────────── */}
      <Textarea
        id="notes"
        label="Additional Notes"
        placeholder="Any other context..."
        {...register("notes")}
      />

      {/* ── Submit ────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
        <Button type="button" variant="secondary">
          Save Draft
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Submit Report Card
        </Button>
      </div>
    </form>
  );
}
