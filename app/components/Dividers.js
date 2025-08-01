export const LatestDivider = () => {
  return (
    <div className="flex gap-2 items-center text-xs w-full my-1">
      <div className="grow h-px bg-foreground opacity-20" />
      <div>LATEST CHRONOLOGICALLY</div>
      <div className="grow h-px bg-foreground opacity-20" />
    </div>
  );
};

export const EarliestDivider = () => {
  return (
    <div className="flex gap-2 items-center text-xs my-1">
      <div className="grow h-px bg-foreground opacity-20" />
      <div>EARLIEST CHRONOLOGICALLY</div>
      <div className="grow h-px bg-foreground opacity-20" />
    </div>
  );
};
