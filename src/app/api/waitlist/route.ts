// src/app/api/waitlist/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbzRbmNzBGSkjUcnccqtcpMGnm-Qo6UW1gotYsZUTKNApByq3SimQkSW3J_Stgt1rn3a/exec', // full redirected URL
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
