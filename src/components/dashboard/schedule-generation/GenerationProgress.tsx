
interface GenerationProgressProps {
  isLoading: boolean;
  progress: number;
}

const GenerationProgress = ({ isLoading, progress }: GenerationProgressProps) => {
  if (!isLoading) return null;

  return (
    <div className="space-y-2">
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Generating schedule ({progress}%)...
      </p>
    </div>
  );
};

export default GenerationProgress;
