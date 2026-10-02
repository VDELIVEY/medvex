"use client";


import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building2, AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import { institutionRegisterSchema } from "@/lib/validation";
import RoleGuard from "@/components/RoleGuard";
import Breadcrumbs from "@/components/Breadcrumbs";

type InstitutionFormValues = z.infer<typeof institutionRegisterSchema> & {
};

export default function RegisterInstitution() {
  return (
    <RoleGuard allowedRole={["ministry", "superadmin"]}>
      <RegisterInstitutionContent />
    </RoleGuard>
  );
}

function RegisterInstitutionContent() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionRegisterSchema),
  });

  const onSubmit = async (data: InstitutionFormValues) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = new FormData();
    payload.append("name", data.name);
    payload.append("location", data.location);
    payload.append("owner", data.owner);
    payload.append("license_number", data.license_number);
    payload.append("services", data.services);

    try {
      const response = await fetch("/api/institutions", {
        method: "POST",
        body: payload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      setSuccess(
        `Institution registered successfully! Portal Key: ${result.portal_key}`
      );

      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Ministry', href: '/ministry' }, { label: 'Register Healthcare Facility' }]}
        backHref="/ministry"
        backLabel="Dashboard"
      />

      <div className="container max-w-4xl mx-auto p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">Register Healthcare Facility</h1>
          <p className="page-header-subtitle">
            Onboard a new medical institution to the MedQR national network for digital episode tracking and supply chain integration.
          </p>
        </div>

      {/* Alerts */}
      {error && (
        <div className="alert-modern alert-error mb-8 flex items-center gap-4 p-6 animate-shake">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg">Registration Error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="alert-modern alert-success mb-8 flex items-center gap-4 p-6 animate-slide-up">
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg">Registration Successful</p>
            <p className="text-sm font-mono mt-1 bg-white/20 px-3 py-1 rounded-lg inline-block">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Modern Form Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass-card max-w-3xl mx-auto p-10 mb-12 shadow-2xl border-white/40"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="form-group">
            <label className="form-label">Institution Name *</label>
            <input
              {...register("name")}
              className={`input-modern ${errors.name ? 'border-red-500' : ''}`}
              placeholder="E.g., City General Hospital"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">License Number *</label>
            <input
              {...register("license_number")}
              className={`input-modern ${errors.license_number ? 'border-red-500' : ''}`}
              placeholder="E.g., MED-2024-ABC123"
            />
            {errors.license_number && (
              <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.license_number.message}
              </p>
            )}
          </div>
        </div>

        <div className="form-group mb-8">
          <label className="form-label">Full Address / Location *</label>
          <input
            {...register("location")}
            className={`input-modern ${errors.location ? 'border-red-500' : ''}`}
            placeholder="E.g., 123 Health St, Medical District"
          />
          {errors.location && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.location.message}
            </p>
          )}
        </div>

        <div className="form-group mb-8">
          <label className="form-label">Owner / Director Name *</label>
          <input
            {...register("owner")}
            className={`input-modern ${errors.owner ? 'border-red-500' : ''}`}
            placeholder="E.g., Dr. Jane Smith"
          />
          {errors.owner && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.owner.message}
            </p>
          )}
        </div>

        <div className="form-group mb-8">
          <label className="form-label">
            Services Offered (comma separated) *
          </label>
          <textarea
            {...register("services")}
            rows={4}
            className={`textarea-modern resize-none ${errors.services ? 'border-red-500' : ''}`}
            placeholder="E.g., General Medicine, Surgery, Pediatrics, Emergency Care"
          />
          {errors.services && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.services.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary text-xl py-5 font-black flex items-center justify-center gap-4 shadow-2xl hover:shadow-glass group"
        >
          {loading ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin" />
              Processing Registration...
            </>
          ) : (
            <>
              <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
              Authorize Institution
            </>
          )}
        </button>
      </form>
    </div>
    </div>
  );
}
