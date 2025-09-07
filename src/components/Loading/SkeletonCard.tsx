import React from 'react';

interface SkeletonCardProps {
  showPersonalization?: boolean;
  showTickers?: boolean;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showPersonalization = false,
  showTickers = true
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="p-6">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
            <div className="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
        </div>

        {/* Title skeleton */}
        <div className="mb-3">
          <div className="w-full h-5 bg-gray-200 rounded mb-2"></div>
          <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
        </div>

        {/* Description skeleton */}
        <div className="mb-4">
          <div className="w-full h-4 bg-gray-100 rounded mb-1"></div>
          <div className="w-5/6 h-4 bg-gray-100 rounded"></div>
        </div>

        {/* Tickers skeleton */}
        {showTickers && (
          <div className="flex gap-1.5 mb-4">
            <div className="w-12 h-6 bg-blue-100 rounded"></div>
            <div className="w-14 h-6 bg-blue-100 rounded"></div>
            <div className="w-16 h-6 bg-blue-100 rounded"></div>
          </div>
        )}

        {/* Personalization skeleton */}
        {showPersonalization && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 bg-blue-200 rounded mt-0.5"></div>
              <div className="flex-1">
                <div className="w-3/4 h-3 bg-blue-200 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Actions skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
          </div>
          <div className="w-20 h-4 bg-blue-100 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SkeletonCard);