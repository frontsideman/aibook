import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PromptBuilderService } from './prompt-builder.service';
import {
  BookStyle,
  Tone,
  BookStatus,
  BookType,
  ReasoningEffort,
  type Book,
  type ChildProfile,
} from '@repo/database';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;
  let configService: ConfigService;

  const mockBook: Book & { child: ChildProfile } = {
    id: 'book-1',
    title: 'The Brave Little Dinosaur',
    status: BookStatus.DRAFT,
    type: BookType.AI_ADAPTED,
    style: BookStyle.WATERCOLOR,
    llmModel: 'openai:gpt-5.4-mini',
    reasoningEffort: ReasoningEffort.MEDIUM,
    tone: Tone.PLAYFUL,
    parentComments: 'Make it very educational',
    parentFeedback: null,
    pdfUrl: null,
    approvedAt: null,
    userId: 'user-1',
    childId: 'child-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    child: {
      id: 'child-1',
      userId: 'user-1',
      name: 'Alice',
      age: 5,
      gender: 'female',
      interests: ['dinosaurs', 'space'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptBuilderService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('Default base prompt'),
          },
        },
      ],
    }).compile();

    service = module.get<PromptBuilderService>(PromptBuilderService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('uses LLM_DEFAULT_PROMPT as the base prompt', () => {
    jest.spyOn(configService, 'getOrThrow').mockReturnValue('Custom base');
    const result = service.buildPrompt(mockBook);
    expect(result).toContain('Custom base');
  });

  it('renders child profile fields', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).toContain('Child: Alice, 5-year-old female, interests: dinosaurs, space.');
  });

  it('defaults empty interests to "no specific interests listed"', () => {
    const bookNoInterests = {
      ...mockBook,
      child: { ...mockBook.child, interests: [] },
    };
    const result = service.buildPrompt(bookNoInterests);
    expect(result).toContain('interests: no specific interests listed');
  });

  it('renders story title', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).toContain('Story: "The Brave Little Dinosaur".');
  });

  it('renders style', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).toContain('Style: watercolor.');
  });

  it('includes tone when present', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).toContain('Tone: playful.');
  });

  it('omits tone section when book has no tone', () => {
    const bookNoTone = { ...mockBook, tone: null };
    const result = service.buildPrompt(bookNoTone);
    expect(result).not.toContain('Tone:');
  });

  it('includes parent comments when present', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).toContain('Parent instructions: Make it very educational.');
  });

  it('omits parent comments section when book has none', () => {
    const bookNoComments = { ...mockBook, parentComments: null };
    const result = service.buildPrompt(bookNoComments);
    expect(result).not.toContain('Parent instructions:');
  });

  it('includes parent feedback when provided', () => {
    const result = service.buildPrompt(mockBook, 'Make the ending happier');
    expect(result).toContain(
      'Parent feedback: Make the ending happier. Revise the story accordingly.'
    );
  });

  it('omits parent feedback section when not provided', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).not.toContain('Parent feedback:');
  });

  it('appends the format instruction at the end', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).toMatch(
      /Format the output strictly as: Page 1: \.\.\., Page 2: \.\.\., Page 3: \.\.\.$/
    );
  });

  it('returns a non-empty string', () => {
    const result = service.buildPrompt(mockBook);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('separates prompt sections with double newlines', () => {
    const result = service.buildPrompt(mockBook);
    expect(result).toContain('\n\n');
  });
});
