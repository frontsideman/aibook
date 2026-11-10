import { parseStoryPages } from './story-pages';

describe('parseStoryPages', () => {
  it('splits the requested Page N format', () => {
    expect(parseStoryPages('Page 1: One.\nPage 2: Two.\nPage 3: Three.')).toEqual([
      'One.',
      'Two.',
      'Three.',
    ]);
  });

  it('strips markdown bold and a leading preamble', () => {
    expect(
      parseStoryPages('Sure, here is the story.\n\n**Page 1:** One.\n**Page 2:** Two.')
    ).toEqual(['One.', 'Two.']);
  });

  it('supports single-line output and a period after the page number', () => {
    expect(parseStoryPages('Page 1. One. Page 2. Two.')).toEqual(['One.', 'Two.']);
  });

  it('falls back to blank-line separated paragraphs', () => {
    expect(parseStoryPages('First paragraph.\n\nSecond paragraph.')).toEqual([
      'First paragraph.',
      'Second paragraph.',
    ]);
  });

  it('returns an empty list for blank output', () => {
    expect(parseStoryPages('   \n\n  ')).toEqual([]);
  });
});
