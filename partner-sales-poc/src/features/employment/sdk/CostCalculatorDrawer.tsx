import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CostCalculatorFlow,
  CostCalculatorForm,
  CostCalculatorSubmitButton,
  CostCalculatorResetButton,
  EstimationResults,
} from '@remoteoss/remote-flows';
import type {
  CostCalculatorEstimateResponse,
  CostCalculatorEstimation,
} from '@remoteoss/remote-flows';
import { RemoteFlowsWrapper } from './RemoteFlowsWrapper';
import { Loading } from '../../../components/ui/Loading';
import config from '../../../config/partner';
import { X, RotateCcw, ArrowLeft } from 'lucide-react';

const estimationOptions = {
  title: 'Cost Estimate',
  includeBenefits: true,
  includeCostBreakdowns: true,
  includeManagementFee: false,
  showManagementFee: false,
  enableCurrencyConversion: true,
};

interface CostCalculatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CostCalculatorDrawer({ isOpen, onClose }: CostCalculatorDrawerProps) {
  const [estimations, setEstimations] = useState<CostCalculatorEstimateResponse | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setEstimations(null);
  };

  const handleClose = () => {
    setEstimations(null);
    onClose();
  };

  const overlay = (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{
        zIndex: 9999,
        backgroundColor: config.colors.background,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-10 py-6"
        style={{
          backgroundColor: '#fff',
          borderBottom: `1px solid ${config.colors.borders}`,
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ color: config.colors.secondary }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold" style={{ color: config.colors.foreground }}>
              Cost Calculator
            </h2>
            <p className="text-sm mt-0.5" style={{ color: config.colors.secondary }}>
              Estimate the cost to hire someone through Remote
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ color: config.colors.secondary }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-10 py-8">
        <RemoteFlowsWrapper>
          <CostCalculatorFlow
            estimationOptions={estimationOptions}
            render={(props) => {
              if (props.isLoading) {
                return <Loading message="Loading cost calculator..." />;
              }

              return (
                <div className="max-w-2xl mx-auto">
                  <CostCalculatorForm
                    onSubmit={(payload) => console.log('Cost calc payload:', payload)}
                    onError={(error) => console.error('Cost calc error:', error)}
                    onSuccess={(response) => {
                      console.log('Cost calc success:', response);
                      setEstimations(response);
                    }}
                  />

                  <div className="flex items-center gap-4 mt-8 mb-6">
                    <CostCalculatorResetButton
                      className="px-6 py-3 rounded-lg text-sm font-medium"
                      style={{
                        border: `1px solid ${config.colors.borders}`,
                        color: config.colors.foreground,
                        cursor: 'pointer',
                      }}
                      onClick={handleReset}
                    >
                      <span className="flex items-center gap-2">
                        <RotateCcw size={14} /> Reset
                      </span>
                    </CostCalculatorResetButton>

                    <CostCalculatorSubmitButton
                      className="px-6 py-3 rounded-lg text-sm font-semibold text-white"
                      style={{
                        backgroundColor: config.colors.primary,
                        cursor: 'pointer',
                      }}
                    >
                      Get estimate
                    </CostCalculatorSubmitButton>
                  </div>
                </div>
              );
            }}
          />

          {/* Results */}
          {estimations && estimations.data?.employments?.[0] && (
            <div
              className="max-w-2xl mx-auto mt-10 pt-8"
              style={{ borderTop: `1px solid ${config.colors.borders}` }}
            >
              <h3
                className="text-base font-semibold mb-4"
                style={{ color: config.colors.foreground }}
              >
                Estimation Results
              </h3>
              <EstimationResults
                estimation={estimations.data.employments[0] as CostCalculatorEstimation}
                title="Cost Estimate"
                onDelete={handleReset}
                onExportPdf={() => {}}
                onEdit={() => {}}
              />
            </div>
          )}
        </RemoteFlowsWrapper>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
