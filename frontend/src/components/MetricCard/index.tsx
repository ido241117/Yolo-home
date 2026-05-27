interface MetricCardProps {
  label: string;
  value: string | number;
  tone?: 'default' | 'alert';
}

function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default MetricCard;
