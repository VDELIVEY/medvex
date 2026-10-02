"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useForm } from "react-hook-form";
import {
  Users, Stethoscope, Briefcase, UserPlus,
  ShieldCheck, Loader2, AlertCircle, CheckCircle2,
  Lock, User
} from "lucide-react";
import { useApp } from "@/lib/context";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function RegisterStaff() {
  return (
    <RoleGuard allowedRole="admin">
      <RegisterStaffContent />
    </RoleGuard>
  );
}

function RegisterStaffContent() {
  const { institutionId } = useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          institutionId,
          doctorServices: data.doctorServices ? (Array.isArray(data.doctorServices) ? data.doctorServices : [data.doctorServices]) : []
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Registration failed");

      setSuccess(`Staff member ${data.fullName} registered successfully!`);
      reset();
      setSelectedRole("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleValue = watch("occupation");

  return (
    <div>
      <Breadcrumbs
        items={[{ label: 'Institution Admin', href: '/institution' }, { label: 'Register Staff' }]}
        backHref="/institution"
        backLabel="Dashboard"
      />

      <div className="container max-w-4xl mx-auto p-8 fade-in">
        {/* Page Header Banner */}
        <div className="page-header-banner">
          <h1 className="page-header-title">Register Facility Staff Member</h1>
          <p className="page-header-subtitle">
            Expand your medical facility team by registering Doctors, Nurses, Receptionists, Pharmacists, and Cashiers.
          </p>
        </div>

      {error && (
        <div className="alert-modern alert-error mb-8 flex items-center gap-4 p-6 animate-shake">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg">Registration Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="alert-modern alert-success mb-8 flex items-center gap-4 p-6">
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg">Success!</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-10 max-w-3xl mx-auto shadow-2xl border-white/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <User className="w-4 h-4" /> Full Name *
            </label>
            <input
              {...register("fullName", { required: "Name is required" })}
              className="input-modern"
              placeholder="E.g., Dr. Alice Johnson"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input
                type="number"
                {...register("age", { required: "Age is required", min: 18 })}
                className="input-modern"
                placeholder="25"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select {...register("gender", { required: true })} className="input-modern">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-group mb-10">
          <label className="form-label flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Occupation / Role *
          </label>
          <select
            {...register("occupation", { required: "Role is required" })}
            className="input-modern"
          >
            <option value="">Select a role...</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="cashier">Accountant / Cashier</option>
            <option value="pharmacy">Pharmacist</option>
            <option value="lab">Lab Technician</option>
          </select>
        </div>

        {roleValue === 'doctor' && (
          <div className="form-group mb-10 p-8 bg-blue-50/50 rounded-3xl border-2 border-dashed border-blue-200 fade-in">
            <label className="form-label flex items-center gap-2 text-blue-700">
              <Stethoscope className="w-5 h-5" /> Medical Specializations *
            </label>
            <p className="text-xs text-blue-500 mb-4 font-medium italic">Select all applicable services for this doctor</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['Dental', 'OPD', 'ENT', 'Gynecology', 'Radiology', 'Pathology', 'Pediatrics', 'Surgery', 'Eyes', 'Pathology'].map((svc) => (
                <label key={svc} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 hover:border-blue-400 cursor-pointer transition-all shadow-sm">
                  <input
                    type="checkbox"
                    value={svc.toLowerCase()}
                    {...register("doctorServices")}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">{svc}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 mb-10">
          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Portal Credentials
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <div className="relative">
                <input
                  {...register("username", { required: "Username required" })}
                  className="input-modern pl-10"
                  placeholder="alice.j"
                />
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="relative">
                <input
                  type="password"
                  {...register("password", { required: "Password required" })}
                  className="input-modern pl-10"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary py-5 text-lg font-bold flex items-center justify-center gap-3 shadow-2xl hover:shadow-glass transition-all"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <UserPlus className="w-6 h-6" />
          )}
          Register Staff Member
        </button>
      </form>
      </div>
    </div>
  );
}
