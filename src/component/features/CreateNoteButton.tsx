'use client';

import { useRouter } from 'next/navigation';
import { Add01Icon } from 'hugeicons-react';
import HeroActionButton from '../ui/HeroActionButton';

export default function CreateNoteButton() {
  const router = useRouter();

  const handleCreate = () => {
    router.push('/editor/new');
  };

  return (
    <HeroActionButton
      theme="primary"
      icon={<Add01Icon className="w-5 h-5" />}
      onClick={handleCreate}
    >
      New Notebook
    </HeroActionButton>
  );
}
