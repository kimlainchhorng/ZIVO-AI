import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#0a0b14] text-slate-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold">
        Z
      </div>
      <div className="text-center">
        <h1 className="text-6xl font-black tracking-tight text-slate-100">404</h1>
        <p className="mt-3 text-lg text-slate-400">Page not found</p>
        <p className="mt-1 text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button variant="default" size="lg">
        <Link href="/ai" className="no-underline text-inherit">
          Back to Builder
        </Link>
      </Button>
    </div>
  );
}
