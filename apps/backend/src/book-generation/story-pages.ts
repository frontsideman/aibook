const PAGE_MARKER = /\bPage\s+\d+\s*[:.]\s*/gi;

function normalizeStoryText(storyText: string): string {
  return storyText.replace(/\r\n?/g, '\n').replace(/\*\*/g, '').trim();
}

function splitByPageMarkers(storyText: string): string[] {
  const matches = [...storyText.matchAll(PAGE_MARKER)];

  if (matches.length === 0) return [];

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? storyText.length;
      return storyText.slice(start, end).trim();
    })
    .filter((content) => content.length > 0);
}

function splitByParagraphs(storyText: string): string[] {
  return storyText
    .split(/\n\s*\n+/)
    .map((content) => content.trim())
    .filter((content) => content.length > 0);
}

/**
 * Converts raw LLM output into page texts.
 *
 * The preferred format is `Page 1: ... Page 2: ...`. Markdown bold markers,
 * a leading preamble, and single-line output are tolerated. If no page markers
 * are present, blank-line separated paragraphs are used as a fallback.
 */
export function parseStoryPages(storyText: string): string[] {
  const normalized = normalizeStoryText(storyText);
  if (!normalized) return [];

  const markedPages = splitByPageMarkers(normalized);
  if (markedPages.length > 0) return markedPages;

  return splitByParagraphs(normalized);
}
