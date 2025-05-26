
import { Grid, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterModeToggleProps {
  filterMode: "advanced" | "college";
  onModeChange: (mode: "advanced" | "college") => void;
}

const FilterModeToggle = ({ filterMode, onModeChange }: FilterModeToggleProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={filterMode === "college" ? "default" : "outline"}
        onClick={() => onModeChange("college")}
        size="sm"
        className="gap-2"
      >
        <Grid className="h-4 w-4" />
        College View
      </Button>
      <Button
        variant={filterMode === "advanced" ? "default" : "outline"}
        onClick={() => onModeChange("advanced")}
        size="sm"
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Advanced Filter
      </Button>
    </div>
  );
};

export default FilterModeToggle;
