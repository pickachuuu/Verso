import VersoLoader from '@/component/ui/VersoLoader';

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <VersoLoader size={80} label="Loading flashcards..." />
    </div>
  );
}
