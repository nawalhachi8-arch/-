'use client';
import { SkywardSoarGame } from '@/components/game/Game';

export default function Home() {
  return (
    <main className="flex w-screen h-screen flex-col items-center justify-center bg-background">
      <SkywardSoarGame />
    </main>
  );
}
