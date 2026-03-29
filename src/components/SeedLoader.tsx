const SeedLoader = ({ text }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <svg
        width="80"
        height="100"
        viewBox="0 0 80 100"
        className="animate-seed-grow"
      >
        {/* Soil */}
        <ellipse cx="40" cy="88" rx="30" ry="8" fill="hsl(var(--earth))" opacity="0.5" />
        {/* Stem */}
        <path
          d="M40 85 Q40 60 38 45 Q36 35 40 25"
          stroke="hsl(var(--secondary))"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Left leaf */}
        <path
          d="M38 50 Q25 40 20 45 Q18 50 28 55 Q33 52 38 50Z"
          fill="hsl(var(--primary))"
          opacity="0.8"
        />
        {/* Right leaf */}
        <path
          d="M40 38 Q55 28 58 33 Q60 38 48 43 Q44 40 40 38Z"
          fill="hsl(var(--secondary))"
          opacity="0.8"
        />
        {/* Top leaf */}
        <path
          d="M40 25 Q35 12 40 8 Q45 12 42 25Z"
          fill="hsl(var(--primary))"
        />
      </svg>
      {text && (
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default SeedLoader;
