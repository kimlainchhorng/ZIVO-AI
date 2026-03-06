import { Spinner } from '@/components/ui/Spinner';

export default function GlobalLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0b14]">
      <Spinner size="lg" />
    </div>
  );
}
