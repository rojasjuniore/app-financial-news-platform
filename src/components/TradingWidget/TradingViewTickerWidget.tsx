import React, { useEffect, useRef, memo } from 'react';

interface TradingViewTickerWidgetProps {
  symbols?: Array<{
    proName: string;
    title: string;
  }>;
  colorTheme?: 'light' | 'dark';
  locale?: string;
  isTransparent?: boolean;
  showSymbolLogo?: boolean;
  displayMode?: 'adaptive' | 'compact' | 'regular';
}

function TradingViewTickerWidget({
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
      "title": "Dow Jones"
    },
    {
      "proName": "FX_IDC:EURUSD",
      "title": "EUR to USD"
    },
    {
      "proName": "BITSTAMP:BTCUSD",
      "title": "Bitcoin"
    },
    {
      "proName": "BITSTAMP:ETHUSD",
      "title": "Ethereum"
    },
    {
      "proName": "NASDAQ:AAPL",
      "title": "Apple"
    },
    {
      "proName": "NASDAQ:GOOGL",
      "title": "Alphabet"
    },
    {
      "proName": "NASDAQ:TSLA",
      "title": "Tesla"
    },
    {
      "proName": "NASDAQ:AMZN",
      "title": "Amazon"
    },
    {
      "proName": "NASDAQ:MSFT",
      "title": "Microsoft"
    },
    {
      "proName": "NASDAQ:META",
      "title": "Meta"
    }
  ],
  colorTheme = "light",
  locale = "es",
  isTransparent = false,
  showSymbolLogo = true,
  displayMode = "adaptive"
}: TradingViewTickerWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": ${JSON.stringify(symbols)},
        "colorTheme": "${colorTheme}",
        "locale": "${locale}",
        "largeChartUrl": "",
        "isTransparent": ${isTransparent},
        "showSymbolLogo": ${showSymbolLogo},
        "displayMode": "${displayMode}"
      }`;
    
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = `
          <div class="tradingview-widget-container__widget"></div>
          <div class="tradingview-widget-copyright">
            <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
              <span class="blue-text">Ticker tape by TradingView</span>
            </a>
          </div>
        `;
      }
    };
  }, [symbols, colorTheme, locale, isTransparent, showSymbolLogo, displayMode]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a 
          href="https://www.tradingview.com/" 
          rel="noopener nofollow" 
          target="_blank"
          className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
        >
          <span className="blue-text">Ticker tape by TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewTickerWidget);