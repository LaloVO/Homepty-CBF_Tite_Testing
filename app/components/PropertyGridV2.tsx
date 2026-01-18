// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import React from 'react';

// components/HeroSearchV1.tsx
export default function PropertyGridV2(props) {
  return (
    <div className="border p-6 rounded-xl bg-slate-100">
      <h2 className="text-xl font-bold">HeroSearchV1</h2>
      <pre className="text-sm mt-2">{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}
