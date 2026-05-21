type ConfidenceBadgeProps = {
  confidence: number;
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const tone = confidence >= 90 ? 'high' : confidence >= 75 ? 'medium' : confidence > 0 ? 'low' : 'missing';

  return <span className={`confidence-badge ${tone}`}>{confidence}% confidence</span>;
}
