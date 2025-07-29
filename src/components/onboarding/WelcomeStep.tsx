"use client";

import { StepProps } from "@/src/types/onboarding";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const WelcomeStep: React.FC<StepProps> = ({ onNext }) => {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-full p-2 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </button>
        </div>
        <div className="absolute top-5 right-4">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>

        <div className="flex justify-center mt-10 mb-6">
          <Image src="/logo.png" alt="Livaro Logo" width={40} height={40} />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">
          Welcome to Livaro!
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Let’s set up your profile to find the perfect rental or tenant for you
        </p>

        <button
          onClick={onNext}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition"
        >
          Get Started →
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;
