
interface GenerationProgressProps {
  isGenerating: boolean;
  progress: number;
}

const GenerationProgress = ({ isGenerating, progress }: GenerationProgressProps) => {
  if (!isGenerating) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Generating schedule...</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default GenerationProgress;
