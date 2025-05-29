
interface GenerationFeaturesProps {
  enableCourseGrouping: boolean;
  enableFallbacks: boolean;
  onGroupingChange: (enabled: boolean) => void;
  onFallbacksChange: (enabled: boolean) => void;
}

const GenerationFeatures = ({
  enableCourseGrouping,
  enableFallbacks,
  onGroupingChange,
  onFallbacksChange
}: GenerationFeaturesProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Features</h4>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableGrouping"
            checked={enableCourseGrouping}
            onChange={(e) => onGroupingChange(e.target.checked)}
            className="rounded w-4 h-4"
          />
          <label htmlFor="enableGrouping" className="text-xs">
            Auto-group shared courses (GST, MTH, etc.)
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableFallbacks"
            checked={enableFallbacks}
            onChange={(e) => onFallbacksChange(e.target.checked)}
            className="rounded w-4 h-4"
          />
          <label htmlFor="enableFallbacks" className="text-xs">
            Enable fallback strategies
          </label>
        </div>
      </div>
    </div>
  );
};

export default GenerationFeatures;
