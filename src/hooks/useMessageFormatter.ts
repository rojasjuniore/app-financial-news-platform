/**
 * Message Formatter Hook
 * Transforms and enhances AI responses for better display
 */

import { useMemo } from 'react';

interface Source {
  title: string;
  source: string;
  url?: string;
  date: string;
  relevance?: string;
}

interface FormattedMessage {
  content: string;
  sources: Source[];
  links: string[];
  warnings: string[];
  tables: any[];
}

export const useMessageFormatter = () => {
  
  const formatAIResponse = (rawContent: string): FormattedMessage => {
    let content = rawContent;
    const sources: Source[] = [];
    const links: string[] = [];
    const warnings: string[] = [];
    const tables: any[] = [];

    // Clean up excessive line breaks
    content = content.replace(/\n{3,}/g, '\n\n');

    // Convert plain text tables to markdown tables
    const improveTableFormatting = (text: string): string => {
      // Look for table-like structures
      const lines = text.split('\n');
      let inTable = false;
      let tableLines: string[] = [];
      let improvedLines: string[] = [];

      lines.forEach((line, index) => {
        // Detect table start (has | separators)
        if (line.includes('|') && line.split('|').length > 2) {
          if (!inTable) {
            inTable = true;
            tableLines = [];
          }
          tableLines.push(line);
        } else if (inTable) {
          // End of table, process it
          if (tableLines.length > 0) {
            const processedTable = processTable(tableLines);
            improvedLines.push(...processedTable);
          }
          inTable = false;
          tableLines = [];
          improvedLines.push(line);
        } else {
          improvedLines.push(line);
        }
      });

      // Process any remaining table
      if (inTable && tableLines.length > 0) {
        const processedTable = processTable(tableLines);
        improvedLines.push(...processedTable);
      }

      return improvedLines.join('\n');
    };

    const processTable = (lines: string[]): string[] => {
      const processed: string[] = [];
      
      lines.forEach((line, index) => {
        // Clean up the line
        let cleanLine = line.trim();
        
        // Ensure proper spacing around pipes
        cleanLine = cleanLine.replace(/\s*\|\s*/g, ' | ');
        
        // Add pipes at start and end if missing
        if (!cleanLine.startsWith('|')) cleanLine = '| ' + cleanLine;
        if (!cleanLine.endsWith('|')) cleanLine = cleanLine + ' |';
        
        processed.push(cleanLine);
        
        // Add separator row after header (first row)
        if (index === 0) {
          const cells = cleanLine.split('|').filter(cell => cell.trim());
          const separator = '|' + cells.map(() => ' --- ').join('|') + '|';
          processed.push(separator);
        }
      });
      
      return processed;
    };

    // Apply table formatting improvements
    content = improveTableFormatting(content);

    // Extract and format sources
    const extractSources = (text: string): void => {
      // Pattern for article citations
      const articlePattern = /📰\s*\[([^\]]+)\]:\s*"([^"]+)"\s*-\s*(\d{4}-\d{2}-\d{2})/g;
      let match;
      
      while ((match = articlePattern.exec(text)) !== null) {
        sources.push({
          source: match[1],
          title: match[2],
          date: match[3]
        });
      }

      // Pattern for inline sources in parentheses
      const inlinePattern = /\(([^)]+,\s*\d{4})\)/g;
      while ((match = inlinePattern.exec(text)) !== null) {
        const parts = match[1].split(',');
        if (parts.length >= 2) {
          sources.push({
            source: parts[0].trim(),
            title: '',
            date: parts[1].trim()
          });
        }
      }
    };

    extractSources(content);

    // Extract URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlPattern) || [];
    links.push(...urls);

    // Extract warnings
    if (content.includes('⚠️')) {
      const warningPattern = /⚠️\s*([^.!?\n]+[.!?])/g;
      let match;
      while ((match = warningPattern.exec(content)) !== null) {
        warnings.push(match[1]);
      }
    }

    // Format bullet points better
    content = content.replace(/^-\s+/gm, '• ');
    content = content.replace(/^\*\s+/gm, '• ');
    content = content.replace(/^\d+\.\s+/gm, (match) => `**${match}**`);

    // Highlight important sections
    content = content.replace(/^(Resumen|Summary|Conclusión|Conclusion|Análisis|Analysis):/gim, '### $1:');
    content = content.replace(/^(Fuentes|Sources|Referencias|References):/gim, '### $1:');
    content = content.replace(/^(Recomendaciones|Recommendations|Riesgos|Risks):/gim, '### $1:');

    // Format key metrics
    content = content.replace(/(\d+(?:\.\d+)?%)/g, '**$1**');
    content = content.replace(/(\$\d+(?:,\d{3})*(?:\.\d+)?(?:[KMB])?)/g, '**$1**');

    // Clean up article list formatting
    content = content.replace(/Artículos consultados:/gi, '\n### 📚 Artículos Consultados:\n');
    
    // Add spacing around headers
    content = content.replace(/^(#{1,3}\s+.+)$/gm, '\n$1\n');

    // Remove duplicate line breaks
    content = content.replace(/\n{3,}/g, '\n\n');

    return {
      content: content.trim(),
      sources,
      links,
      warnings,
      tables
    };
  };

  const generateSourceLinks = (sources: Source[]): string => {
    if (sources.length === 0) return '';

    let markdown = '\n\n### 🔗 Enlaces a Fuentes\n\n';
    
    sources.forEach((source, index) => {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(source.title || source.source)}`;
      markdown += `${index + 1}. [${source.title || source.source}](${searchUrl}) - ${source.date}\n`;
    });

    return markdown;
  };

  const createClickableLinks = (text: string): string => {
    // Convert plain URLs to markdown links
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, (url) => {
      // Extract domain for link text
      const domain = url.match(/https?:\/\/([^\/]+)/)?.[1] || url;
      return `[${domain}](${url})`;
    });
  };

  const enhanceMessage = (rawContent: string): string => {
    const formatted = formatAIResponse(rawContent);
    let enhanced = formatted.content;

    // Make URLs clickable
    enhanced = createClickableLinks(enhanced);

    // Add source links at the end if sources were found
    if (formatted.sources.length > 0) {
      enhanced += generateSourceLinks(formatted.sources);
    }

    // Add warnings section if any
    if (formatted.warnings.length > 0) {
      enhanced += '\n\n### ⚠️ Avisos Importantes\n\n';
      formatted.warnings.forEach(warning => {
        enhanced += `• ${warning}\n`;
      });
    }

    return enhanced;
  };

  return {
    formatAIResponse,
    enhanceMessage,
    generateSourceLinks,
    createClickableLinks
  };
};