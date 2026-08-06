const MotoDivider = () => {
  return (
    <div
      className="relative w-full flex items-center justify-center py-6 sm:py-10 px-4"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 20"
        className="w-full max-w-3xl h-6 sm:h-8 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="moto-line"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="800"
            y2="0"
          >
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="15%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="85%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Single glowing line */}
        <line
          x1="0"
          y1="10"
          x2="800"
          y2="10"
          stroke="url(#moto-line)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default MotoDivider;