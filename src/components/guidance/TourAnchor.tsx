import { useEffect, useRef, type ReactNode } from 'react';
import { useGuidance } from '../../context/GuidanceContext';

interface TourAnchorProps {
  id: string;
  children: ReactNode;
}

export default function TourAnchor({ id, children }: TourAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { activeTourTarget, tourOpen } = useGuidance();
  const isActive = tourOpen && activeTourTarget === id;

  useEffect(() => {
    if (!isActive) return;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [isActive]);

  return (
    <div
      ref={ref}
      style={isActive ? {
        position: 'relative',
        zIndex: 150,
        borderRadius: '20px',
        boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.9), 0 0 0 8px rgba(99, 102, 241, 0.18)',
      } : undefined}
    >
      {children}
    </div>
  );
}
