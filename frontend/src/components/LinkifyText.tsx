import { useMemo } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}\/[^\s<]*|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})/gi;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

function isValidUrl(str: string): boolean {
  try {
    new URL(str.startsWith('http') ? str : `https://${str}`);
    return true;
  } catch {
    return false;
  }
}

function getHref(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

interface LinkifyTextProps {
  text: string;
  style?: React.CSSProperties;
  linkStyle?: React.CSSProperties;
}

export function LinkifyText({ text, style, linkStyle }: LinkifyTextProps) {
  const parts = useMemo(() => {
    const result: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    // First, handle markdown links [text](url)
    let mdMatch;
    const mdRegex = new RegExp(MARKDOWN_LINK_REGEX.source, 'g');
    while ((mdMatch = mdRegex.exec(text)) !== null) {
      if (mdMatch.index > lastIndex) {
        // Process plain text between markdown links for raw URLs
        const plainText = text.slice(lastIndex, mdMatch.index);
        result.push(...processPlainText(plainText));
      }

      const linkText = mdMatch[1];
      const linkUrl = mdMatch[2];
      result.push(
        <a
          key={`md-${mdMatch.index}`}
          href={getHref(linkUrl)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'inherit',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            cursor: 'pointer',
            ...linkStyle,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {linkText}
        </a>
      );

      lastIndex = mdMatch.index + mdMatch[0].length;
    }

    if (lastIndex < text.length) {
      result.push(...processPlainText(text.slice(lastIndex)));
    }

    return result;
  }, [text, linkStyle]);

  function processPlainText(plainText: string): (string | JSX.Element)[] {
    const subResult: (string | JSX.Element)[] = [];
    let subLastIndex = 0;
    let match;
    const regex = new RegExp(URL_REGEX.source, 'gi');

    while ((match = regex.exec(plainText)) !== null) {
      if (match.index > subLastIndex) {
        subResult.push(plainText.slice(subLastIndex, match.index));
      }

      const url = match[0];
      if (isValidUrl(url)) {
        subResult.push(
          <a
            key={`url-${match.index}`}
            href={getHref(url)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              cursor: 'pointer',
              ...linkStyle,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        );
      } else {
        subResult.push(url);
      }

      subLastIndex = match.index + url.length;
    }

    if (subLastIndex < plainText.length) {
      subResult.push(plainText.slice(subLastIndex));
    }

    return subResult;
  }

  return <span style={style}>{parts}</span>;
}
