import type { FaceDto } from '@/apis';
import { formatClock, initials } from '@/utils/backend-format';

function FaceCard({ face }: { face: FaceDto }) {
  const name = face.displayName || face.label;
  return (
    <div className="bg-surface border border-outline-variant rounded p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-body-lg flex-shrink-0">
          {initials(name)}
        </div>
        <div>
          <p className="text-body-md font-bold">{name}</p>
          <p className="text-label-sm text-on-surface-variant">ID: {face.label}</p>
        </div>
      </div>
      <p className="text-label-sm text-on-surface-variant">Registered {formatClock(face.createdAt, true)}</p>
    </div>
  );
}

export function FacesGrid({ faces }: { faces: FaceDto[] }) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-headline-sm">Face Recognition Management</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {faces.map(face => <FaceCard key={face.id} face={face} />)}
        {faces.length === 0 && <p className="text-on-surface-variant">No faces registered</p>}
      </div>
    </div>
  );
}
