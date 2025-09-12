import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol?: string;
  width?: number | string;
  height?: number | string;
  interval?: string;
  theme?: 'Light' | 'Dark';
  style?: 'bars' | 'candles' | 'line' | 'area' | 'renko' | 'kagi' | 'pointandfigure' | 'heikinashi';
  locale?: string;
  backgroundColor?: string;
  gridColor?: string;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  allowSymbolChange?: boolean;
  saveImage?: boolean;
  studies?: string[];
  showPopupButton?: boolean;
  showPopupTooltip?: boolean;
  popupWidth?: string;
  popupHeight?: string;
  watchlist?: string[];
  newsHeadlines?: boolean;
  details?: boolean;
  calendar?: boolean;
  hotList?: boolean;
  marketOverview?: boolean;
  screener?: boolean;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = 400,
  interval = '5',
  theme = 'Light',
  style = 'candles',
  locale = 'es',
  backgroundColor = 'rgba(255, 255, 255, 1)',
  gridColor = 'rgba(42, 46, 57, 0.06)',
  hideTopToolbar = false,
  hideSideToolbar = false,
  allowSymbolChange = true,
  saveImage = true,
  studies = [],
  showPopupButton = true,
  showPopupTooltip = false,
  popupWidth = '1000',
  popupHeight = '650',
  watchlist = [],
  newsHeadlines = false,
  details = false,
  calendar = false,
  hotList = false,
  marketOverview = false,
  screener = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Error handling for TradingView widget
    if (!containerRef.current) return;
    
    const loadWidget = () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;
        
        // Error handler for script loading
        script.onerror = (error) => {
          console.warn('TradingView widget failed to load:', error);
        };

        script.innerHTML = JSON.stringify({
          autosize: width === '100%',
          width: width !== '100%' ? width : undefined,
          height,
          symbol,
          interval,
          timezone: 'Etc/UTC',
          theme: theme.toLowerCase(),
          style: style === 'bars' ? '1' : style === 'candles' ? '1' : style === 'line' ? '2' : style === 'area' ? '3' : '1',
          locale,
          backgroundColor,
          gridColor,
          hide_top_toolbar: hideTopToolbar,
          hide_side_toolbar: hideSideToolbar,
          allow_symbol_change: allowSymbolChange,
          save_image: saveImage,
          studies,
          show_popup_button: showPopupButton,
          popup_width: popupWidth,
          popup_height: popupHeight,
          container_id: 'tradingview_widget'
        });

        if (containerRef.current) {
          containerRef.current.appendChild(script);
        }
      } catch (error) {
        console.warn('Error loading TradingView widget:', error);
      }
    };

    // Delay widget loading to ensure DOM is ready
    const timer = setTimeout(loadWidget, 100);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [
    symbol, width, height, interval, theme, style, locale, 
    backgroundColor, gridColor, hideTopToolbar, hideSideToolbar, 
    allowSymbolChange, saveImage, studies, showPopupButton, 
    popupWidth, popupHeight
  ]);

  return (
    <div 
      ref={containerRef}
      id="tradingview_widget"
      className="tradingview-widget-container"
      style={{ height: typeof height === 'number' ? `${height}px` : height, width }}
    />
  );
};

export default TradingViewWidget;