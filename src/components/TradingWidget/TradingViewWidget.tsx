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
  studies = ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
  showPopupButton = false,
  showPopupTooltip = false,
  popupWidth = '1000',
  popupHeight = '650',
  watchlist = ['NASDAQ:AAPL', 'NASDAQ:TSLA', 'NASDAQ:GOOGL', 'NASDAQ:AMZN', 'NASDAQ:META'],
  newsHeadlines = true,
  details = true,
  calendar = false,
  hotList = false,
  marketOverview = false,
  screener = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
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

    return () => {
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

// Market Overview Widget Component
export const TradingViewMarketOverview: React.FC<{
  colorTheme?: 'light' | 'dark';
  dateRange?: '1D' | '1M' | '3M' | '12M' | '60M';
  showChart?: boolean;
  locale?: string;
  width?: number | string;
  height?: number | string;
}> = ({
  colorTheme = 'light',
  dateRange = '12M',
  showChart = true,
  locale = 'es',
  width = '100%',
  height = 400
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme,
      dateRange,
      showChart,
      locale,
      width,
      height,
      largeChartUrl: '',
      isTransparent: false,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
      plotLineColorFalling: 'rgba(41, 98, 255, 1)',
      gridLineColor: 'rgba(42, 46, 57, 0.06)',
      scaleFontColor: 'rgba(120, 123, 134, 1)',
      belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
      belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
      symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
      tabs: [
        {
          title: 'Índices',
          symbols: [
            { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
            { s: 'FOREXCOM:NSXUSD', d: 'US 100' },
            { s: 'FOREXCOM:DJI', d: 'Dow 30' },
            { s: 'INDEX:NKY', d: 'Nikkei 225' },
            { s: 'INDEX:DEU40', d: 'DAX Index' },
            { s: 'FOREXCOM:UKXGBP', d: 'UK 100' }
          ],
          originalTitle: 'Indices'
        },
        {
          title: 'Futuros',
          symbols: [
            { s: 'CME_MINI:ES1!', d: 'S&P 500' },
            { s: 'CME:6E1!', d: 'Euro' },
            { s: 'COMEX:GC1!', d: 'Gold' },
            { s: 'NYMEX:CL1!', d: 'WTI Crude Oil' },
            { s: 'NYMEX:NG1!', d: 'Gas' },
            { s: 'CBOT:ZC1!', d: 'Corn' }
          ],
          originalTitle: 'Futures'
        },
        {
          title: 'Bonos',
          symbols: [
            { s: 'CBOT:ZB1!', d: 'T-Bond' },
            { s: 'CBOT:UB1!', d: 'Ultra T-Bond' },
            { s: 'EUREX:FGBL1!', d: 'Euro Bund' },
            { s: 'EUREX:FBTP1!', d: 'Euro BTP' },
            { s: 'EUREX:FGBM1!', d: 'Euro BOBL' }
          ],
          originalTitle: 'Bonds'
        },
        {
          title: 'Forex',
          symbols: [
            { s: 'FX:EURUSD', d: 'EUR to USD' },
            { s: 'FX:GBPUSD', d: 'GBP to USD' },
            { s: 'FX:USDJPY', d: 'USD to JPY' },
            { s: 'FX:USDCHF', d: 'USD to CHF' },
            { s: 'FX:AUDUSD', d: 'AUD to USD' },
            { s: 'FX:USDCAD', d: 'USD to CAD' }
          ],
          originalTitle: 'Forex'
        }
      ]
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [colorTheme, dateRange, showChart, locale, width, height]);

  return (
    <div 
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: typeof height === 'number' ? `${height}px` : height, width }}
    />
  );
};

// Symbol Overview Widget
export const TradingViewSymbolOverview: React.FC<{
  symbols?: Array<{symbol: string, displayName?: string}>;
  chartOnly?: boolean;
  width?: number | string;
  height?: number | string;
  locale?: string;
  colorTheme?: 'light' | 'dark';
  autosize?: boolean;
  showVolume?: boolean;
  showMA?: boolean;
  hideDateRanges?: boolean;
  hideMarketStatus?: boolean;
  hideSymbolLogo?: boolean;
  scalePosition?: 'left' | 'right';
  scaleMode?: 'Normal' | 'Logarithmic';
  fontFamily?: string;
  fontSize?: string;
  noTimeScale?: boolean;
  valuesTracking?: string;
  changeMode?: string;
  chartType?: string;
  maLineColor?: string;
  maLineWidth?: number;
  maLength?: number;
  lineWidth?: number;
  lineType?: number;
  dateRanges?: string[];
}> = ({
  symbols = [
    { symbol: 'NASDAQ:AAPL', displayName: 'Apple' },
    { symbol: 'NASDAQ:GOOGL', displayName: 'Alphabet' },
    { symbol: 'NASDAQ:TSLA', displayName: 'Tesla' },
    { symbol: 'NASDAQ:AMZN', displayName: 'Amazon' }
  ],
  chartOnly = false,
  width = '100%',
  height = 400,
  locale = 'es',
  colorTheme = 'light',
  autosize = true,
  showVolume = false,
  showMA = false,
  hideDateRanges = false,
  hideMarketStatus = false,
  hideSymbolLogo = false,
  scalePosition = 'right',
  scaleMode = 'Normal',
  fontFamily = '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
  fontSize = '10',
  noTimeScale = false,
  valuesTracking = '1',
  changeMode = 'price-and-percent',
  chartType = 'area',
  maLineColor = '#2962FF',
  maLineWidth = 1,
  maLength = 9,
  lineWidth = 2,
  lineType = 0,
  dateRanges = ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M']
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    
    const config: any = {
      symbols: symbols.map(s => [s.symbol, s.displayName || s.symbol.split(':')[1]]),
      chartOnly,
      width,
      height,
      locale,
      colorTheme,
      autosize,
      showVolume,
      showMA,
      hideDateRanges,
      hideMarketStatus,
      hideSymbolLogo,
      scalePosition,
      scaleMode,
      fontFamily,
      fontSize,
      noTimeScale,
      valuesTracking,
      changeMode,
      chartType,
      maLineColor,
      maLineWidth,
      maLength,
      lineWidth,
      lineType,
      dateRanges
    };

    script.innerHTML = JSON.stringify(config);

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [
    symbols, chartOnly, width, height, locale, colorTheme, autosize,
    showVolume, showMA, hideDateRanges, hideMarketStatus, hideSymbolLogo,
    scalePosition, scaleMode, fontFamily, fontSize, noTimeScale,
    valuesTracking, changeMode, chartType, maLineColor, maLineWidth,
    maLength, lineWidth, lineType, dateRanges
  ]);

  return (
    <div 
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: typeof height === 'number' ? `${height}px` : height, width }}
    />
  );
};

export default TradingViewWidget;