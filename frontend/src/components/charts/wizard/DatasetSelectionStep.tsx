import { useState } from 'react';
import DatasetSelector from '../prototypes/DatasetSelector';
import VirtualDatasetModal from '../prototypes/VirtualDatasetModal';
import { DatasetSelectionStepProps } from '../../../types/chartWizard';
import { useToastStore } from '../../../store/toastStore';
import { useConnectionStore } from '../../../store/connectionStore';

export default function DatasetSelectionStep({ onDatasetSelect }: DatasetSelectionStepProps) {
  const [showVirtualModal, setShowVirtualModal] = useState(false);
  const { showToast } = useToastStore();
  const { connections } = useConnectionStore();

  const handleCreateVirtual = () => {
    if (connections.length === 0) {
      showToast('Please create a connection first before creating virtual datasets', 'info');
      return;
    }
    setShowVirtualModal(true);
  };

  return (
    <>
      <DatasetSelector
        onDatasetSelect={onDatasetSelect}
        onCreateVirtual={handleCreateVirtual}
      />

      {showVirtualModal && connections.length > 0 && (
        <VirtualDatasetModal
          isOpen={showVirtualModal}
          onClose={() => setShowVirtualModal(false)}
          connectionId={connections[0].id} // Use first connection or let user select
        />
      )}
    </>
  );
}
