"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RUBRIC_FIELDS } from "@/lib/constants";
import { useState } from "react";
import type { SubmitReviewPayload, VerificationDecision } from "@/lib/types";

const reviewSchema = z.object({
  scores: z.object({
    evidence_quality: z.coerce.number().min(1, "Required").max(5),
    impact_clarity: z.coerce.number().min(1, "Required").max(5),
    completeness: z.coerce.number().min(1, "Required").max(5),
  }),
  comments: z.string().max(2000).optional(),
});

type ReviewFormData = {
  scores: {
    evidence_quality: number;
    impact_clarity: number;
    completeness: number;
  };
  comments?: string;
};

interface ReviewFormProps {
  reportCardId: number;
  onSubmit: (payload: SubmitReviewPayload) => Promise<void>;
}

export function ReviewForm({ reportCardId, onSubmit }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema) as unknown as Resolver<ReviewFormData>,
  });

  const submit = async (data: ReviewFormData, decision: VerificationDecision) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        report_card_id: reportCardId,
        decision,
        scores: data.scores as SubmitReviewPayload["scores"],
        comments: data.comments,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6">
      {/* ── Rubric Scoring ────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Scoring Rubric</h3>
        {RUBRIC_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="flex items-center justify-between text-sm font-medium text-gray-700">
              {field.label}
              <span className="text-xs text-gray-400">1–{field.max}</span>
            </label>
            <div className="flex gap-2">
              {Array.from({ length: field.max }, (_, i) => i + 1).map(
                (val) => (
                  <label
                    key={val}
                    className="flex flex-col items-center gap-1"
                  >
                    <input
                      type="radio"
                      value={val}
                      {...register(`scores.${field.key}` as keyof ReviewFormData)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-gray-500">{val}</span>
                  </label>
                ),
              )}
            </div>
            {errors.scores?.[field.key as keyof typeof errors.scores] && (
              <p className="text-sm text-red-600">Please select a score</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Comments ──────────────────────────────────────── */}
      <Textarea
        id="comments"
        label="Comments"
        placeholder="Provide feedback on this submission..."
        {...register("comments")}
      />

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          loading={isSubmitting}
          onClick={handleSubmit((d) => submit(d, "request_info"))}
        >
          Request More Info
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={isSubmitting}
          onClick={handleSubmit((d) => submit(d, "reject"))}
        >
          Reject
        </Button>
        <Button
          type="button"
          loading={isSubmitting}
          onClick={handleSubmit((d) => submit(d, "approve"))}
        >
          Approve
        </Button>
      </div>
    </form>
  );
}
