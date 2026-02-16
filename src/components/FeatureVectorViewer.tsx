'use client';

import { FeatureVector } from '@/lib/types';
import { BarChart3 } from 'lucide-react';

interface FeatureVectorViewerProps {
  featureVector: FeatureVector | null;
}

export default function FeatureVectorViewer({ featureVector }: FeatureVectorViewerProps) {
  if (!featureVector) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">No feature vector data available</p>
      </div>
    );
  }

  const features: Array<{ label: string; value: number | string; type: string }> = [
    { label: 'Transaction Count', value: featureVector.transaction_count, type: 'count' },
    { label: 'Average Transaction Amount', value: featureVector.avg_transaction_amount, type: 'currency' },
    { label: 'Hour of Day', value: featureVector.hour_of_day, type: 'hour' },
    { label: 'Day of Week', value: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][featureVector.day_of_week], type: 'text' },
    { label: 'Merchant Average Amount', value: featureVector.merchant_avg_transaction_amount, type: 'currency' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-lg">Feature Vector</h3>
      </div>
      
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{feature.label}</span>
            <span className="text-sm font-semibold text-gray-900">
              {feature.type === 'currency' 
                ? `${typeof feature.value === 'number' ? feature.value.toFixed(2) : feature.value} ${featureVector.currency}`
                : feature.type === 'hour'
                ? `${feature.value}:00`
                : String(feature.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Transaction ID:</span>
            <span className="ml-2 font-mono text-xs">{featureVector.transaction_id}</span>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2">{featureVector.transaction_type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
