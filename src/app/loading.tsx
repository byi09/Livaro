"use client";
import Spinner from "@/src/components/ui/Spinner";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <Spinner size={48} variant="primary" />
    </div>
  );
} 