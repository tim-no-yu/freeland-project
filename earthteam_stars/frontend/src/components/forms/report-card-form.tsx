"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { FormStepper } from "@/components/forms/form-stepper";
import { CATEGORY_OPTIONS, TAG_OPTIONS } from "@/lib/constants";
import { Plus, Trash2, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";
import type { ReportCardType } from "@/lib/types";

// ── Zod Schemas (per step) ───────────────────────────────────────
const witnessSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  organization: z.string().optional(),
  relationship: z.string().optional(),
});

const step1Schema = z.object({
  type: z.enum(["action", "impact"]),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Please provide more detail").max(2000),
  category: z.enum([
    "wildlife_protection",
    "habitat_protection",
    "regenerative_agriculture",
  ]),
});

const step2Schema = z.object({
  problem_statement: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  activity_date: z.string().optional(),
  location: z.string().optional(),
  results: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
  witnesses: z.array(witnessSchema),
});

const step3Schema = z.object({
  outcomes: z.string().max(2000).optional(),
  metrics_value: z.coerce.number().positive().optional().or(z.literal("")),
  metrics_unit: z.string().optional(),
  baseline_description: z.string().max(2000).optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FormData = z.infer<typeof fullSchema>;

const STEPS = [
  { label: "Basic Info", sublabel: "Required" },
  { label: "Evidence & Context", sublabel: "Optional" },
  { label: "Impact Details", sublabel: "Optional" },
];

// ── Props ────────────────────────────────────────────────────────
interface ReportCardFormProps {
  onSubmit: (data: FormData, files: File[]) => Promise<void>;
  defaultType?: ReportCardType;
}

export function ReportCardForm({
  onSubmit,
  defaultType = "action",
}: ReportCardFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [reportType, setReportType] = useState<ReportCardType>(defaultType);
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      type: defaultType,
      title: "",
      description: "",
      category: undefined,
      problem_statement: "",
      tags: [],
      activity_date: "",
      location: "",
      results: "",
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

  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      setTags(newTags);
      setValue("tags", newTags);
    },
    [setValue],
  );

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, tags }, files);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(["type", "title", "description", "category"]);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, reportType === "impact" ? 3 : 2));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const submitNow = async () => {
    if (currentStep === 1) {
      const valid = await trigger(["type", "title", "description", "category"]);
      if (!valid) return;
    }
    const data = getValues();
    await handleFormSubmit(data);
  };

  const maxSteps = reportType === "impact" ? 3 : 2;
  const visibleSteps = STEPS.slice(0, maxSteps);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* ── Stepper ───────────────────────────────────────── */}
      <FormStepper
        steps={visibleSteps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />

      {/* ══════════════════════════════════════════════════════
          STEP 1: Basic Info (Required)
          ══════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-700">
              Fill in the basics to get started. You can submit now or add more details.
            </p>
          </div>

          {/* Type Selector */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Report Card Type
            </label>
            <div className="flex gap-3">
              {(["action", "impact"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setReportType(t);
                    setValue("type", t);
                  }}
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

          <Input
            id="title"
            label="Title *"
            placeholder="e.g. Anti-poaching patrol in Tsavo East"
            error={errors.title?.message}
            {...register("title")}
          />

          <Textarea
            id="description"
            label="Description *"
            placeholder="Describe what you did, including specific details and quantities..."
            error={errors.description?.message}
            {...register("description")}
          />

          <Select
            id="category"
            label="Category *"
            placeholder="Select a category"
            options={CATEGORY_OPTIONS}
            error={errors.category?.message}
            {...register("category")}
          />

          {/* Step 1 Actions */}
          <div className="flex justify-between border-t border-gray-100 pt-6">
            <Button
              type="button"
              variant="primary"
              loading={isSubmitting}
              onClick={submitNow}
            >
              Submit Now
            </Button>
            <Button type="button" variant="secondary" onClick={goNext}>
              Add More Details <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 2: Evidence & Context (Optional)
          ══════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-700">
              Add evidence and context to strengthen your submission. Everything here is optional.
            </p>
          </div>

          <Textarea
            id="problem_statement"
            label="Problem Statement"
            placeholder="What problem were you trying to solve?"
            {...register("problem_statement")}
          />

          <TagInput
            label="Tags"
            suggestions={TAG_OPTIONS}
            value={tags}
            onChange={handleTagsChange}
          />

          {/* Evidence Upload */}
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              id="activity_date"
              label="Activity Date"
              type="date"
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
            id="results"
            label="Results"
            placeholder="What happened? What was the result of your action?"
            {...register("results")}
          />

          {/* Witnesses */}
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
                No witnesses added.
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

          <Textarea
            id="notes"
            label="Additional Notes"
            placeholder="Any other context..."
            {...register("notes")}
          />

          {/* Step 2 Actions */}
          <div className="flex justify-between border-t border-gray-100 pt-6">
            <Button type="button" variant="ghost" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="primary"
                loading={isSubmitting}
                onClick={submitNow}
              >
                Submit Now
              </Button>
              {reportType === "impact" && (
                <Button type="button" variant="secondary" onClick={goNext}>
                  Add Impact Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 3: Impact Details (Optional, Impact only)
          ══════════════════════════════════════════════════════ */}
      {currentStep === 3 && reportType === "impact" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
            <p className="text-sm text-yellow-800">
              Impact details earn Gold-level Stars. Describe the measurable change your action created.
            </p>
          </div>

          <Textarea
            id="outcomes"
            label="Outcomes Achieved"
            placeholder="What changed as a result of this action? Be specific..."
            {...register("outcomes")}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              id="metrics_value"
              label="Metric Value"
              type="number"
              placeholder="e.g. 500"
              {...register("metrics_value")}
            />
            <Input
              id="metrics_unit"
              label="Metric Unit"
              placeholder="e.g. seedlings planted, hectares restored"
              {...register("metrics_unit")}
            />
          </div>

          <Textarea
            id="baseline_description"
            label="Baseline Description"
            placeholder="What was the situation before this action?"
            {...register("baseline_description")}
          />

          {/* Step 3 Actions */}
          <div className="flex justify-between border-t border-gray-100 pt-6">
            <Button type="button" variant="ghost" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Submit Report Card
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
