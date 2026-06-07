import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Book, ChildProfile, BookStyle, Tone } from '@repo/database';

const styleLabel: Record<BookStyle, string> = {
  [BookStyle.WATERCOLOR]: 'watercolor',
  [BookStyle.CARTOON]: 'cartoon',
  [BookStyle.REALISTIC]: 'realistic',
  [BookStyle.PIXAR]: 'pixar',
  [BookStyle.SKETCH]: 'sketch',
  [BookStyle.MANGA]: 'manga',
  [BookStyle.COMIC]: 'comic',
};

const toneLabel: Record<Tone, string> = {
  [Tone.WARM]: 'warm',
  [Tone.EDUCATIONAL]: 'educational',
  [Tone.PLAYFUL]: 'playful',
  [Tone.MAGICAL]: 'magical',
  [Tone.ADVENTUROUS]: 'adventurous',
};

@Injectable()
export class PromptBuilderService {
  constructor(private readonly configService: ConfigService) {}

  buildPrompt(book: Book & { child: ChildProfile }, parentFeedback?: string): string {
    const basePrompt = this.configService.getOrThrow<string>('LLM_DEFAULT_PROMPT');
    const child = book.child;

    const childInterests = (child.interests || []).join(', ') || 'no specific interests listed';

    const parts: string[] = [
      basePrompt,
      `Child: ${child.name}, ${child.age}-year-old ${child.gender}, interests: ${childInterests}.`,
      `Story: "${book.title}".`,
      `Style: ${styleLabel[book.style]}.`,
    ];

    if (book.tone) {
      parts.push(`Tone: ${toneLabel[book.tone]}.`);
    }

    if (book.parentComments) {
      parts.push(`Parent instructions: ${book.parentComments}.`);
    }

    if (parentFeedback) {
      parts.push(`Parent feedback: ${parentFeedback}. Revise the story accordingly.`);
    }

    parts.push('Format the output strictly as: Page 1: ..., Page 2: ..., Page 3: ...');

    return parts.join('\n\n');
  }
}