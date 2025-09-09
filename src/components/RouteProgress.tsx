"use client";

import { useEffect } from "react";
import nProgress from "nprogress";
import { useRouter } from "next/navigation";
import "nprogress/nprogress.css";

nProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.08 });

export default function RouteProgress() {
  const router = useRouter();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const handleStart = () => {
      timeout = setTimeout(() => nProgress.start(), 100); // faster start
    };

    const handleDone = () => {
      if (timeout) clearTimeout(timeout);
      nProgress.done();
    };

    router.events?.on("routeChangeStart", handleStart);
    router.events?.on("routeChangeComplete", handleDone);
    router.events?.on("routeChangeError", handleDone);

    return () => {
      router.events?.off("routeChangeStart", handleStart);
      router.events?.off("routeChangeComplete", handleDone);
      router.events?.off("routeChangeError", handleDone);
    };
  }, [router]);

  return null;
}
