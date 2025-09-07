import React, { useEffect, useRef } from 'react';

interface SimpleTradingViewWidgetProps {
  width?: string | number;
  height?: string | number;
}

const SimpleTradingViewWidget: React.FC<SimpleTradingViewWidgetProps> = ({
  width = "100%",
  height = 400
}) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    
    const widgetConfig = {
      "colorTheme": "light",
      "dateRange": "12M",
      "showChart": true,
      "locale": "es",
      "width": width,
      "height": height,
      "largeChartUrl": "",
      "isTransparent": false,
      "showSymbolLogo": true,
      "showFloatingTooltip": false,
      "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
      "plotLineColorFalling": "rgba(255, 67, 101, 1)",
      "gridLineColor": "rgba(240, 243, 250, 0)",
      "scaleFontColor": "rgba(120, 123, 134, 1)",
      "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorFalling": "rgba(255, 67, 101, 0.12)",
      "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
      "belowLineFillColorFallingBottom": "rgba(255, 67, 101, 0)",
      "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
      "tabs": [
        {
          "title": "Índices",
          "symbols": [
            {
              "s": "FOREXCOM:SPXUSD",
              "d": "S&P 500"
            },
            {
              "s": "FOREXCOM:NSXUSD",
              "d": "US 100"
            },
            {
              "s": "FOREXCOM:DJI",
              "d": "Dow 30"
            },
            {
              "s": "INDEX:NKY",
              "d": "Nikkei 225"
            },
            {
              "s": "INDEX:DEU40",
              "d": "DAX Index"
            },
            {
              "s": "FOREXCOM:UKXGBP",
              "d": "UK 100"
            }
          ],
          "originalTitle": "Indices"
        },
        {
          "title": "Futuros",
          "symbols": [
            {
              "s": "CME_MINI:ES1!",
              "d": "S&P 500"
            },
            {
              "s": "CME:6E1!",
              "d": "Euro"
            },
            {
              "s": "COMEX:GC1!",
              "d": "Gold"
            },
            {
              "s": "NYMEX:CL1!",
              "d": "WTI Crude Oil"
            },
            {
              "s": "NYMEX:NG1!",
              "d": "Gas"
            },
            {
              "s": "CBOT:ZC1!",
              "d": "Corn"
            }
          ],
          "originalTitle": "Futures"
        },
        {
          "title": "Forex",
          "symbols": [
            {
              "s": "FX:EURUSD",
              "d": "EUR to USD"
            },
            {
              "s": "FX:GBPUSD",
              "d": "GBP to USD"
            },
            {
              "s": "FX:USDJPY",
              "d": "USD to JPY"
            },
            {
              "s": "FX:USDCHF",
              "d": "USD to CHF"
            },
            {
              "s": "FX:AUDUSD",
              "d": "AUD to USD"
            },
            {
              "s": "FX:USDCAD",
              "d": "USD to CAD"
            }
          ],
          "originalTitle": "Forex"
        },
        {
          "title": "Acciones",
          "symbols": [
            {
              "s": "NASDAQ:AAPL",
              "d": "Apple"
            },
            {
              "s": "NASDAQ:GOOGL",
              "d": "Alphabet"
            },
            {
              "s": "NASDAQ:TSLA",
              "d": "Tesla"
            },
            {
              "s": "NASDAQ:AMZN",
              "d": "Amazon"
            },
            {
              "s": "NASDAQ:MSFT",
              "d": "Microsoft"
            },
            {
              "s": "NASDAQ:META",
              "d": "Meta"
            }
          ],
          "originalTitle": "Stocks"
        }
      ]
    };

    script.innerHTML = `
      {
        "colorTheme": "light",
        "dateRange": "12M",
        "showChart": true,
        "locale": "es",
        "width": ${typeof width === 'string' ? `"${width}"` : width},
        "height": ${typeof height === 'string' ? `"${height}"` : height},
        "largeChartUrl": "",
        "isTransparent": false,
        "showSymbolLogo": true,
        "showFloatingTooltip": false,
        "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
        "plotLineColorFalling": "rgba(255, 67, 101, 1)",
        "gridLineColor": "rgba(240, 243, 250, 0)",
        "scaleFontColor": "rgba(120, 123, 134, 1)",
        "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
        "belowLineFillColorFalling": "rgba(255, 67, 101, 0.12)",
        "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
        "belowLineFillColorFallingBottom": "rgba(255, 67, 101, 0)",
        "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
        "tabs": [
          {
            "title": "Índices",
            "symbols": [
              {
                "s": "FOREXCOM:SPXUSD",
                "d": "S&P 500"
              },
              {
                "s": "FOREXCOM:NSXUSD",
                "d": "US 100"
              },
              {
                "s": "FOREXCOM:DJI",
                "d": "Dow 30"
              },
              {
                "s": "INDEX:NKY",
                "d": "Nikkei 225"
              },
              {
                "s": "INDEX:DEU40",
                "d": "DAX Index"
              },
              {
                "s": "FOREXCOM:UKXGBP",
                "d": "UK 100"
              }
            ],
            "originalTitle": "Indices"
          },
          {
            "title": "Futuros",
            "symbols": [
              {
                "s": "CME_MINI:ES1!",
                "d": "S&P 500"
              },
              {
                "s": "CME:6E1!",
                "d": "Euro"
              },
              {
                "s": "COMEX:GC1!",
                "d": "Gold"
              },
              {
                "s": "NYMEX:CL1!",
                "d": "WTI Crude Oil"
              },
              {
                "s": "NYMEX:NG1!",
                "d": "Gas"
              },
              {
                "s": "CBOT:ZC1!",
                "d": "Corn"
              }
            ],
            "originalTitle": "Futures"
          },
          {
            "title": "Forex",
            "symbols": [
              {
                "s": "FX:EURUSD",
                "d": "EUR to USD"
              },
              {
                "s": "FX:GBPUSD",
                "d": "GBP to USD"
              },
              {
                "s": "FX:USDJPY",
                "d": "USD to JPY"
              },
              {
                "s": "FX:USDCHF",
                "d": "USD to CHF"
              },
              {
                "s": "FX:AUDUSD",
                "d": "AUD to USD"
              },
              {
                "s": "FX:USDCAD",
                "d": "USD to CAD"
              }
            ],
            "originalTitle": "Forex"
          },
          {
            "title": "Acciones",
            "symbols": [
              {
                "s": "NASDAQ:AAPL",
                "d": "Apple"
              },
              {
                "s": "NASDAQ:GOOGL",
                "d": "Alphabet"
              },
              {
                "s": "NASDAQ:TSLA",
                "d": "Tesla"
              },
              {
                "s": "NASDAQ:AMZN",
                "d": "Amazon"
              },
              {
                "s": "NASDAQ:MSFT",
                "d": "Microsoft"
              },
              {
                "s": "NASDAQ:META",
                "d": "Meta"
              }
            ],
            "originalTitle": "Stocks"
          }
        ]
      }
    `;

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [width, height]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a 
          href="https://es.tradingview.com/markets/" 
          rel="noopener noreferrer" 
          target="_blank"
          className="text-xs text-gray-500 hover:text-blue-600"
        >
          Mercados financieros en directo por TradingView
        </a>
      </div>
    </div>
  );
};

export default SimpleTradingViewWidget;