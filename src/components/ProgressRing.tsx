import { motion } from "framer-motion";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  targetPercentage?: number;
  className?: string;
  color?: string;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  showText = true,
  targetPercentage,
  className = "",
  color,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on percentage and target
  const isLow = targetPercentage && percentage < targetPercentage;
  const isGood = !targetPercentage || percentage >= targetPercentage;

  const strokeColor = color || (isLow
    ? "oklch(var(--danger))"
    : isGood
      ? "oklch(var(--success))"
      : "oklch(var(--chart-2))");

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-2xl font-bold"
            style={{ color: strokeColor }}
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      )}
    </div>
  );
}
