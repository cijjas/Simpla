import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Maximize2, Minimize2, FileText, LayoutList } from 'lucide-react';

interface NormaControlsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleOriginal: () => void;
  showOriginal: boolean;
  hasOriginalText: boolean;
}

export function NormaControls({
  onExpandAll,
  onCollapseAll,
  onToggleOriginal,
  showOriginal,
  hasOriginalText,
}: NormaControlsProps) {
  return (
    <ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" onClick={onExpandAll}>
          <Maximize2 className="h-4 w-4" />
          Expandir
        </Button>
        <Button variant="outline" onClick={onCollapseAll}>
          <Minimize2 className="h-4 w-4" />
          Contraer
        </Button>
      </ButtonGroup>
      {hasOriginalText && (
        <ButtonGroup>
          <Button variant="outline" onClick={onToggleOriginal}>
            {showOriginal ? (
              <>
                <LayoutList className="h-4 w-4" />
                Ver estructura
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Ver original
              </>
            )}
          </Button>
        </ButtonGroup>
      )}
    </ButtonGroup>
  );
}