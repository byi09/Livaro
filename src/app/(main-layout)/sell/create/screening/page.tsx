'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ScreeningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property_id');
  const mode = searchParams.get('mode');
  const sublistingId = searchParams.get('sublisting_id');

  useEffect(() => {
    const paramName = mode === 'sublet' ? 'sublisting_id' : 'property_id';
    const id = mode === 'sublet' ? sublistingId : propertyId;
    const target = id
      ? `/sell/create/costs-and-fees?${paramName}=${id}${mode === 'sublet' ? '&mode=sublet' : ''}`
      : `/sell/create/costs-and-fees${mode === 'sublet' ? '?mode=sublet' : ''}`;
    router.replace(target);
  }, [router, propertyId, sublistingId, mode]);

  return null;
}
