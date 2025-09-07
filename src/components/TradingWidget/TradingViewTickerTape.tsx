import React, { useEffect, useRef } from 'react';

interface TradingViewTickerTapeProps {
  symbols?: Array<{
    proName: string;
    title: string;
  }>;
  colorTheme?: 'light' | 'dark';
  locale?: string;
  isTransparent?: boolean;
  showSymbolLogo?: boolean;
  displayMode?: 'adaptive' | 'compact' | 'regular';
  className?: string;
}

const TradingViewTickerTape: React.FC<TradingViewTickerTapeProps> = ({
  symbols = [
    {
      "proName": "FOREXCOM:SPXUSD",
      "title": "S&P 500 Index"
    },
    {
      "proName": "FOREXCOM:NSXUSD", 
      "title": "US 100 Cash CFD"
    },
    {
      "proName": "FOREXCOM:DJI",
      "title": "Dow Jones Industrial Average"
    },
    {
      "proName": "FX_IDC:EURUSD",
      "title": "EUR to USD"
    },
    {
      "proName": "NASDAQ:AAPL",
      "title": "Apple Inc"
    },
    {
      "proName": "NASDAQ:GOOGL",
      "title": "Alphabet Inc"
    },
    {
      "proName": "NASDAQ:TSLA",
      "title": "Tesla Inc"
    },
    {
      "proName": "NASDAQ:AMZN",
      "title": "Amazon.com Inc"
    },
    {
      "proName": "NASDAQ:MSFT",
      "title": "Microsoft Corporation"
    },
    {
      "proName": "BITSTAMP:BTCUSD",
      "title": "Bitcoin"
    },
    {
      "proName": "BITSTAMP:ETHUSD",
      "title": "Ethereum"
    }
  ],
  colorTheme = 'light',
  locale = 'es',
  isTransparent = false,
  showSymbolLogo = true,
  displayMode = 'adaptive',
  className = ''
}) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear any existing content
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    
    const widgetConfig = {
      symbols,
      colorTheme,
      locale,
      largeChartUrl: "",
      isTransparent,
      showSymbolLogo,
      displayMode
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    // Create widget container structure
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    
    const copyrightDiv = document.createElement("div");
    copyrightDiv.className = "tradingview-widget-copyright";
    
    const copyrightLink = document.createElement("a");
    copyrightLink.href = "https://www.tradingview.com/";
    copyrightLink.rel = "noopener nofollow";
    copyrightLink.target = "_blank";
    copyrightLink.innerHTML = '<span class="blue-text">Ticker tape by TradingView</span>';
    copyrightLink.className = "text-xs text-gray-500 hover:text-blue-600 transition-colors";
    
    copyrightDiv.appendChild(copyrightLink);
    
    container.current.appendChild(widgetContainer);
    container.current.appendChild(copyrightDiv);
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbols, colorTheme, locale, isTransparent, showSymbolLogo, displayMode]);

  return (
    <div className={`tradingview-widget-container ${className}`} ref={container}>
      {/* Widget will be inserted here by the script */}
    </div>
  );
};

export default TradingViewTickerTape;