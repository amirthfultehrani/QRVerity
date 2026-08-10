import { ReliabilityStatus } from '../../verify/types';

interface ReliabilityBadgeProps {
  status: ReliabilityStatus;
}

const statusConfig: Record<ReliabilityStatus, { label: string; className: string }> = {
  GOOD: { label: 'Good', className: 'reliability-badge--good' },
  CAUTION: { label: 'Caution', className: 'reliability-badge--caution' },
  RISKY: { label: 'Risky', className: 'reliability-badge--risky' },
};

export function ReliabilityBadge({ status }: ReliabilityBadgeProps) {
  const config = statusConfig[status];

  return (
    <span class={`reliability-badge ${config.className}`} data-status={status}>
      {config.label}
    </span>
  );
}
