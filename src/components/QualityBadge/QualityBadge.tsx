import React from 'react';
import { QualityClassification } from '../../types';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Info } from 'lucide-react';

interface QualityBadgeProps {
  classification?: QualityClassification;
  showScore?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const QualityBadge: React.FC<QualityBadgeProps> = ({
  classification,
  showScore = false,
  showTooltip = true,
  size = 'sm'
}) => {
  if (!classification) {
    return null;
  }

  const { label, score, quality_level, reasons } = classification;

  // Configuración por nivel de calidad
  const qualityConfig = {
    HIGH_QUALITY: {
      icon: ShieldCheck,
      label: 'Alta Calidad',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    MEDIUM_QUALITY: {
      icon: Shield,
      label: 'Calidad Media',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-300 dark:border-blue-700',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    LOW_QUALITY: {
      icon: ShieldAlert,
      label: 'Calidad Baja',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      borderColor: 'border-amber-300 dark:border-amber-700',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    SPAM_OR_JUNK: {
      icon: ShieldX,
      label: 'Spam/Basura',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-300',
      borderColor: 'border-red-300 dark:border-red-700',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  };

  const config = qualityConfig[label] || qualityConfig.MEDIUM_QUALITY;
  const Icon = config.icon;

  // Tamaños
  const sizes = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const sizeConfig = sizes[size];
  const scorePercentage = Math.round(score * 100);

  const badge = (
    <div className={`
      inline-flex items-center space-x-1.5 rounded-full border font-medium transition-colors duration-200
      ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeConfig.container}
    `}>
      <Icon className={`${sizeConfig.icon} ${config.iconColor} flex-shrink-0`} />
      
      <span className={`font-medium ${sizeConfig.text}`}>
        {config.label}
      </span>
      
      {showScore && (
        <span className={`font-bold ${sizeConfig.text}`}>
          {scorePercentage}%
        </span>
      )}
    </div>
  );

  // Con tooltip
  if (showTooltip) {
    return (
      <div className="group relative inline-block">
        {badge}
        
        {/* Tooltip */}
        <div className="
          invisible group-hover:visible opacity-0 group-hover:opacity-100
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg
          px-3 py-2 shadow-lg transition-all duration-200 z-50
          min-w-48 text-center border border-gray-700
        ">
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Icon className="w-4 h-4" />
              <span className="font-medium">{config.label}</span>
              <span className="text-gray-300">({scorePercentage}%)</span>
            </div>
            
            {reasons && reasons.length > 0 && (
              <div className="border-t border-gray-700 pt-2">
                <div className="flex items-start space-x-2">
                  <Info className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                  <div className="text-left">
                    {reasons.slice(0, 2).map((reason, index) => (
                      <div key={index} className="text-xs text-gray-300">
                        • {reason}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return badge;
};

export default QualityBadge;