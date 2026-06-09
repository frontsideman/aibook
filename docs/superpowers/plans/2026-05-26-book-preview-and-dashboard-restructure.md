# Book Preview, Dashboard, and Project Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task.

**Goal:** Add HTML preview with per-page editing, PDF finalization, book creation wizard, and a rich dashboard with pagination/filtering/search.

**Architecture:** NestJS backend with BullMQ queue for book generation, Next.js frontend with client-side components. Data flows: wizard form → queue → AI generation → preview page → approve → PDF → S3 → dashboard.

**Tech Stack:** NestJS 10, Next.js 16, Prisma 7, BullMQ, pdfkit, @aws-sdk/client-s3

---

### Task 1: Prisma Schema + Seed Data

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/seed.ts`
- Modify: `packages/database/package.json` (add seed script)

- [ ] **Step 1: Add Tone enum, StoryLibrary model, new Book fields to schema.prisma**

Edit `packages/database/prisma/schema.prisma`:

Add after `BookStyle` enum:
```prisma
enum Tone {
  WARM
  EDUCATIONAL
  PLAYFUL
  MAGICAL
  ADVENTUROUS
}
```

Add after `BookStyle` enum block:
```prisma
model StoryLibrary {
  id          String   @id @default(cuid())
  title       String   @unique
  description String?
  promptHint  String?
  createdAt   DateTime @default(now())
}
```

Add new fields to `Book` model (after `style`):
```prisma
  tone       Tone?
  parentComments String?
  parentFeedback Json?
  pdfUrl     String?
  approvedAt DateTime?
```

- [ ] **Step 2: Verify the schema**

Run: `npm run generate` in `packages/database/`
Expected: Schema compiles, no errors.

- [ ] **Step 3: Create seed script**

Create `packages/database/prisma/seed.ts`:
```typescript
import { createPrismaClient } from '../src/index';

const stories = [
  { title: 'The Little Red Riding Hood', description: 'A girl meets a wolf on her way to grandmother\'s house', promptHint: 'Classic tale about a girl in a red cloak, a wolf, a grandmother, and a woodcutter' },
  { title: 'Cinderella', description: 'A kind girl goes to the ball with the help of her fairy godmother', promptHint: 'Young girl mistreated by stepfamily, fairy godmother, glass slipper, prince' },
  { title: 'Snow White and the Seven Dwarfs', description: 'A princess finds refuge with seven dwarfs', promptHint: 'Jealous queen, magic mirror, poisoned apple, seven dwarfs, prince\'s kiss' },
  { title: 'The Three Little Pigs', description: 'Three pigs build houses to escape the big bad wolf', promptHint: 'Straw house, stick house, brick house, wolf blows houses down' },
  { title: 'Jack and the Beanstalk', description: 'A boy trades a cow for magic beans that grow a giant beanstalk', promptHint: 'Magic beans, beanstalk, giant in the sky, golden eggs, harp' },
  { title: 'Goldilocks and the Three Bears', description: 'A girl enters the house of three bears', promptHint: 'Porridge too hot too cold just right, chair breaks, bed, bears come home' },
  { title: 'Hansel and Gretel', description: 'Two siblings outwit a witch in the forest', promptHint: 'Breadcrumb trail, gingerbread house, witch, oven, candy and treats' },
  { title: 'The Princess and the Pea', description: 'A prince finds a real princess through a hidden pea', promptHint: 'Royal test, many mattresses, tiny pea, sensitivity proves royalty' },
  { title: 'The Ugly Duckling', description: 'An odd-looking duckling grows into a beautiful swan', promptHint: 'Different from siblings, teased, grows up, discovers true identity as swan' },
  { title: 'The Emperor\'s New Clothes', description: 'Two weavers trick an emperor with invisible clothes', promptHint: 'Vanity, invisible fabric, nobody admits truth, child speaks honestly' },
  { title: 'Beauty and the Beast', description: 'A young woman learns to love a cursed prince', promptHint: 'Enchanted castle, cursed beast, rose, true love breaks spell' },
  { title: 'The Little Mermaid', description: 'A mermaid princess trades her voice for legs', promptHint: 'Underwater kingdom, sea witch, human legs, voice sacrificed, true love' },
  { title: 'Sleeping Beauty', description: 'A princess cursed to sleep until true love\'s kiss', promptHint: 'Curse from evil fairy, spinning wheel, hundred year sleep, prince breaks spell' },
  { title: 'Aladdin and the Magic Lamp', description: 'A poor boy finds a magic lamp with a genie', promptHint: 'Magic lamp, genie, wishes, princess Jasmine, evil sorcerer, flying carpet' },
  { title: 'Ali Baba and the Forty Thieves', description: 'A woodcutter discovers a thieves\' secret cave', promptHint: 'Open sesame, cave of treasures, forty thieves, clever servant girl' },
  { title: 'The Wolf and the Seven Young Kids', description: 'A wolf tricks seven baby goats', promptHint: 'Mother goat, wolf disguises voice, white paw, swallowed kids rescued' },
  { title: 'Rapunzel', description: 'A girl with long hair is trapped in a tower', promptHint: 'Long golden hair, tower, witch, prince climbs hair, escape' },
  { title: 'Rumpelstiltskin', description: 'A miller\'s daughter must guess a strange man\'s name', promptHint: 'Straw spun into gold, mysterious helper, guessing name, baby bargain' },
  { title: 'The Frog Prince', description: 'A princess befriends a frog who is a prince', promptHint: 'Golden ball, well, frog promise, princess kiss, prince revealed' },
  { title: 'Puss in Boots', description: 'A clever cat helps his master become a nobleman', promptHint: 'Talking cat, boots, gifts for king, ogre turns into mouse' },
  { title: 'The Snow Queen', description: 'A girl travels to the ice palace to rescue her friend', promptHint: 'Magic mirror shard, frozen heart, Kay, Gerda, Snow Queen\'s palace' },
  { title: 'The Nightingale', description: 'An emperor discovers the beauty of a real nightingale\'s song', promptHint: 'Mechanical bird vs real bird, emperor\'s court, song saves emperor' },
  { title: 'The Steadfast Tin Soldier', description: 'A one-legged toy soldier falls in love with a paper dancer', promptHint: 'Tin soldier, paper ballerina, adventures, fish, fireplace' },
  { title: 'Thumbelina', description: 'A tiny girl born from a flower has many adventures', promptHint: 'Tiny girl, flower, toad, fish, mole, swallow, flower prince' },
  { title: 'Pinocchio', description: 'A wooden puppet wants to become a real boy', promptHint: 'Geppetto, talking cricket, lying nose grows, whale, becoming real' },
  { title: 'Peter Pan', description: 'A boy who never grows up takes children to Neverland', promptHint: 'Neverland, Wendy, Tinker Bell, Captain Hook, crocodile, flying' },
  { title: 'Alice in Wonderland', description: 'A girl falls down a rabbit hole into a fantasy world', promptHint: 'Rabbit hole, shrinking and growing, Mad Hatter, Queen of Hearts, Cheshire Cat' },
  { title: 'The Wizard of Oz', description: 'A girl travels to a magical land to find her way home', promptHint: 'Kansas tornado, yellow brick road, Scarecrow, Tin Man, Cowardly Lion, Emerald City' },
  { title: 'The Jungle Book', description: 'A boy raised by wolves in the Indian jungle', promptHint: 'Mowgli, Baloo the bear, Bagheera the panther, Shere Khan the tiger' },
  { title: 'The Little Prince', description: 'A prince from a tiny asteroid learns about life and love', promptHint: 'Little prince, asteroid B-612, rose, fox, desert, what is essential' },
  { title: 'The Selfish Giant', description: 'A giant learns the joy of sharing his garden with children', promptHint: 'Giant\'s garden, perpetual winter, children return, spring comes back' },
  { title: 'The Happy Prince', description: 'A statue and a swallow help the poor', promptHint: 'Golden statue, sapphire eyes, swallow delivers gifts to needy, heaven' },
  { title: 'The Elves and the Shoemaker', description: 'Elves secretly help a poor shoemaker', promptHint: 'Poor shoemaker, elves make shoes at night, beautiful shoes, grateful tailor' },
  { title: 'The Gingerbread Man', description: 'A gingerbread cookie runs away from everyone', promptHint: 'Run run as fast as you can, fox, river crossing, caught' },
  { title: 'Chicken Little', description: 'A chicken thinks the sky is falling', promptHint: 'Acorn falls, sky is falling, Foxy Loxy, tricked' },
  { title: 'The Boy Who Cried Wolf', description: 'A boy learns the danger of lying', promptHint: 'Shepherd boy, false alarms, wolf really comes, nobody believes' },
  { title: 'The Tortoise and the Hare', description: 'A slow tortoise wins a race against a fast hare', promptHint: 'Overconfident hare, naps during race, steady tortoise wins' },
  { title: 'The Lion and the Mouse', description: 'A tiny mouse helps a mighty lion', promptHint: 'Mouse wakes lion, lion spares mouse, mouse chews net, kindness repaid' },
  { title: 'The Ant and the Grasshopper', description: 'A hardworking ant and a lazy grasshopper', promptHint: 'Summer preparation, grasshopper plays, ant works, winter comes' },
  { title: 'The Fox and the Grapes', description: 'A fox cannot reach grapes and pretends they are sour', promptHint: 'Hungry fox, high grapes, cannot reach, calls them sour, sour grapes' },
  { title: 'The Town Mouse and the Country Mouse', description: 'Two mice discover each other\'s way of living', promptHint: 'Country mouse visits town, luxurious but dangerous, prefers simple safe life' },
  { title: 'The Crow and the Pitcher', description: 'A clever crow figures out how to drink water', promptHint: 'Thirsty crow, pitcher with low water, drops stones, water rises' },
  { title: 'The North Wind and the Sun', description: 'Kindness wins over force', promptHint: 'Competition, wind blows coat off fails, sun warms traveler, coat removed' },
  { title: 'The Little Red Hen', description: 'A hen who does all the work reaps all the reward', promptHint: 'Planting wheat, nobody helps, harvest, bake bread, eat alone' },
  { title: 'Stone Soup', description: 'Soldiers trick a village into making soup from a stone', promptHint: 'Stone in pot, villagers add ingredients, community feast, sharing' },
  { title: 'The Bremen Town Musicians', description: 'Four aging animals become musicians together', promptHint: 'Donkey, dog, cat, rooster, outwit robbers, Bremen' },
  { title: 'The Musicians of Bremen', description: 'Same as The Bremen Town Musicians - classic animal band tale' },
  { title: 'The Twelve Dancing Princesses', description: 'Princesses who wear out their shoes every night', promptHint: 'Worn shoes every morning, soldier solves mystery, secret underground ball' },
  { title: 'The Six Swans', description: 'A sister must break a spell turning her brothers into swans', promptHint: 'Six brothers turned to swans, sister weaves nettle shirts, silence spell' },
  { title: 'Mother Hulda', description: 'A girl is rewarded for her kindness', promptHint: 'Well, magic realm, shake feather bed for snow, gold reward, lazy sister punished' },
  { title: 'The Goose Girl', description: 'A princess is forced to trade places with her maid', promptHint: 'Princess and maid switch roles, talking horse, wind blows hat, truth revealed' },
  { title: 'The Brave Little Tailor', description: 'A tailor who kills seven flies with one blow', promptHint: 'Seven with one blow, giants, unicorn, boar, becomes king' },
  { title: 'The Emperor and the Nightingale', description: 'Same as The Nightingale - Chinese emperor discovers true beauty' },
  { title: 'The Snow White and Rose Red', description: 'Two sisters befriend a kind bear', promptHint: 'Two kind sisters, bear visitor, wicked dwarf, bear turns to prince' },
  { title: 'The Seven Ravens', description: 'A sister searches for her seven lost brothers', promptHint: 'Seven brothers turned to ravens, sister journeys to end of world, star glass mountain' },
  { title: 'Jorinde and Joringel', description: 'A man rescues his love from a witch', promptHint: 'Witch turns maidens to birds, magic flower breaks spell' },
  { title: 'The Spindle, the Shuttle and the Needle', description: 'Magic tools help a kind girl find love', promptHint: 'Orphan girl, magic tools weave carpet, prince follows, marriage' },
  { title: 'The Three Spinners', description: 'Three strange women help a lazy girl', promptHint: 'Lazy girl, three women with strange features, spinning contest, queen' },
  { title: 'The Lambkin and the Little Fish', description: 'Siblings transformed into animals stay together', promptHint: 'Stepsister transforms brother and stepsister, care for each other, spell breaks' },
  { title: 'The Water of Life', description: 'A prince seeks healing water for his father', promptHint: 'Sick king, healing water, three princes, dwarf helper, quest' },
  { title: 'The White Snake', description: 'A servant gains animal language understanding', promptHint: 'Eats white snake, understands animals, princess puzzle, three tasks' },
  { title: 'The Star Money', description: 'A girl who gives away everything is rewarded', promptHint: 'Orphan girl, gives away all possessions, stars fall as coins, rich forever' },
  { title: 'The Willow-Wren', description: 'Tiny bird becomes king of all birds', promptHint: 'Bird contest, highest flyer, smallest bird hides on eagle, wins' },
  { title: 'The Golden Bird', description: 'A prince must capture a golden bird', promptHint: 'Golden bird, fox helper, three brothers, castle tasks' },
  { title: 'The Queen Bee', description: 'Kindness to animals helps youngest brother succeed', promptHint: 'Three brothers, ants fish bees helped, princess tasks solved with animal aid' },
  { title: 'The Three Feathers', description: 'The simple youngest son inherits the kingdom', promptHint: 'Three feathers, youngest son seen as simple, magic toad helps, wins kingdom' },
  { title: 'The Gold-Children', description: 'Children born with golden stars fulfill their destiny', promptHint: 'Golden children, fisherman, knight, adventures and reunion' },
  { title: 'Rapunzel of the Tower', description: 'Alternate title for the Rapunzel story' },
  { title: 'The Giant with the Three Golden Hairs', description: 'A boy must fetch golden hairs from a giant', promptHint: 'Fortune child, three golden hairs, giant\'s grandmother helps, rewards' },
  { title: 'The Maid of Brakel', description: 'A girl learns to be careful what she wishes for', promptHint: 'Church, wishing, Saint Anne, humorous lesson' },
  { title: 'The Grave Mound', description: 'A rich farmer learns about true wealth', promptHint: 'Rich farmer, grave mound, soul bargaining, lesson about greed' },
  { title: 'Old Rinkrank', description: 'A princess trapped by an old man finds clever escape', promptHint: 'Glass mountain, princess captured, old man, clever escape' },
  { title: 'The Crystal Ball', description: 'Three brothers break an enchantment with courage', promptHint: 'Three brothers, enchantment, crystal ball, animal helpers, princess freed' },
  { title: 'Maid Maleen', description: 'A faithful princess finally marries her love after years', promptHint: 'False bride, seven years in tower, faithful princess, true love wins' },
  { title: 'The Golden Goose', description: 'A simpleton who shares his food gets a golden goose', promptHint: 'Simple brother shares food, golden goose, everyone gets stuck, princess laughs' },
  { title: 'Doctor Know-All', description: 'A poor man becomes a famous doctor by luck', promptHint: 'Poor farmer, doctor disguise, lucky guesses, crab discovery, becomes wealthy' },
  { title: 'The Spirit in the Bottle', description: 'A boy frees a spirit and gets a magical rag', promptHint: 'Forest spirit trapped in bottle, freed, reward is magic cloth healing wounds' },
  { title: 'The Devil\'s Sooty Brother', description: 'A soldier makes a pact with the devil', promptHint: 'Discharged soldier, devil\'s kitchen, no washing, becomes wealthy' },
  { title: 'Bearskin', description: 'A soldier who cannot wash for seven years wins a princess', promptHint: 'Devil\'s coat, seven years no washing, faithful princess, redemption' },
  { title: 'The Wren and the Bear', description: 'A tiny wren outwits a huge bear', promptHint: 'Bear insulted wren\'s children, war between animals, wren\'s clever tactics win' },
  { title: 'The Sweet Porridge', description: 'A magic pot that makes endless porridge', promptHint: 'Magic pot, cook porridge, magic words, pot floods town, stopped' },
  { title: 'The Clever Little Tailor', description: 'A tailor uses wit to achieve the impossible', promptHint: 'Wins princess with cleverness, bear fight, riddle solving' },
  { title: 'The Old Woman in the Wood', description: 'A girl helps a dove and is rewarded', promptHint: 'Lost girl, dove helper, opens tree, finds treasures, prince freed' },
  { title: 'The Three Little Men in the Wood', description: 'A kind girl shares her food with forest men', promptHint: 'Three little men, sharing food, gifts of beauty wealth speech, stepfamily' },
  { title: 'The Drummer', description: 'A drummer boy rescues a princess from a glass mountain', promptHint: 'Drummer boy, glass mountain, princess trapped, magic gifts, rescue' },
  { title: 'The Ear of Corn', description: 'Why grain has only one ear', promptHint: 'When grain had many ears, wasteful people, God reduces to one ear' },
  { title: 'The Grave Mound', description: 'A story about death and the afterlife', promptHint: 'Farmer, grave mound, poor man, devil, God judges souls' },
  { title: 'Old Sultan', description: 'An old dog and wolf help each other', promptHint: 'Old dog to be killed, wolf helps fake attack, dog kept, friendship' },
  { title: 'The Hare and the Hedgehog', description: 'A clever hedgehog races a hare', promptHint: 'Hedgehog and wife at finish line, hare runs back and forth, tricked' },
  { title: 'The Moon', description: 'People steal the moon and learn its importance', promptHint: 'Moon taken from earth, underworld, darkness, moon returned' },
  { title: 'The Duration of Life', description: 'Why humans live as long as they do', promptHint: 'God gives years, donkey dog monkey give human their years, lifespan' },
  { title: 'Death\'s Messengers', description: 'Death sends messengers before taking a soul', promptHint: 'Sickness, fever, accident, giant, prepare for death' },
  { title: 'Master Pfriem', description: 'A shoemaker who criticizes everything learns a lesson', promptHint: 'Critical shoemaker, angel, wife, learns not to judge God\'s work' },
  { title: 'The Jew Among Thorns', description: 'A good-hearted servant inherits a magic fiddle', promptHint: 'Magic fiddle, makes everyone dance, justice, reward for kindness' },
  { title: 'The Skilful Huntsman', description: 'A huntsman uses his skills to win a princess', promptHint: 'Magic gun, invisibility cloak, princess, three giants, clever huntsman' },
  { title: 'The Bright Sun Brings It to Light', description: 'A crime hidden in darkness is revealed by sunlight', promptHint: 'Murder, hidden gold chain, tailor\'s secret, sunlight exposes truth' },
  { title: 'The Blue Light', description: 'A soldier with a magic light triumphs over a king', promptHint: 'Blue light, magic pipe, soldier, princess, king punished' },
  { title: 'The True Sweethearts', description: 'A girl remains faithful while her love forgets her', promptHint: 'Faithful girl, forgetful lover, magic gifts, memory restored, reunion' },
];

async function seed() {
  const prisma = createPrismaClient();
  try {
    await prisma.$connect();
    for (const story of stories) {
      await prisma.storyLibrary.create({
        data: story,
      });
    }
    console.log(`Seeded ${stories.length} stories`);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(console.error);
```

- [ ] **Step 4: Add seed script to database package.json**

Edit `packages/database/package.json` — add to scripts:
```json
"seed": "tsx prisma/seed.ts"
```

- [ ] **Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/seed.ts packages/database/package.json
git commit -m "feat: add Tone enum, StoryLibrary model, and Book fields to schema"
```

---

### Task 2: StoryLibrary Backend Module

**Files:**
- Create: `apps/backend/src/story-library/story-library.module.ts`
- Create: `apps/backend/src/story-library/story-library.controller.ts`
- Create: `apps/backend/src/story-library/story-library.service.ts`
- Create: `apps/backend/src/story-library/story-library.service.spec.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Create StoryLibraryService**

Create `apps/backend/src/story-library/story-library.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StoryLibraryService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};

    return this.prisma.client.storyLibrary.findMany({
      where,
      orderBy: { title: 'asc' },
      take: 20,
    });
  }
}
```

- [ ] **Step 2: Create StoryLibraryController**

Create `apps/backend/src/story-library/story-library.controller.ts`:
```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StoryLibraryService } from './story-library.service';
import { MockAuthGuard } from '../mock-auth.guard';

@Controller('stories')
@UseGuards(MockAuthGuard)
export class StoryLibraryController {
  constructor(private readonly service: StoryLibraryService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }
}
```

- [ ] **Step 3: Create StoryLibraryModule**

Create `apps/backend/src/story-library/story-library.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { StoryLibraryController } from './story-library.controller';
import { StoryLibraryService } from './story-library.service';

@Module({
  controllers: [StoryLibraryController],
  providers: [StoryLibraryService],
  exports: [StoryLibraryService],
})
export class StoryLibraryModule {}
```

- [ ] **Step 4: Register module in AppModule**

Edit `apps/backend/src/app.module.ts` — add `StoryLibraryModule` to imports:
```typescript
import { StoryLibraryModule } from './story-library/story-library.module';
// ...
    StoryLibraryModule,
```

- [ ] **Step 5: Write and run tests**

Create `apps/backend/src/story-library/story-library.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { StoryLibraryService } from './story-library.service';
import { PrismaService } from '../prisma.service';

describe('StoryLibraryService', () => {
  let service: StoryLibraryService;
  let prisma: PrismaService;

  const mockPrismaClient = {
    storyLibrary: {
      findMany: jest.fn(),
    },
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryLibraryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StoryLibraryService>(StoryLibraryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all stories without search', async () => {
    mockPrismaClient.storyLibrary.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(prisma.client.storyLibrary.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { title: 'asc' },
      take: 20,
    });
  });

  it('should search stories by title', async () => {
    mockPrismaClient.storyLibrary.findMany.mockResolvedValue([]);
    await service.findAll('wolf');
    expect(prisma.client.storyLibrary.findMany).toHaveBeenCalledWith({
      where: { title: { contains: 'wolf', mode: 'insensitive' } },
      orderBy: { title: 'asc' },
      take: 20,
    });
  });
});
```

Run: `npx jest apps/backend/src/story-library/story-library.service.spec.ts`
Expected: Tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/story-library/ apps/backend/src/app.module.ts
git commit -m "feat: add StoryLibrary module with GET /stories"
```

---

### Task 3: BookController & BookService Extensions

**Files:**
- Modify: `apps/backend/src/book/book.controller.ts`
- Modify: `apps/backend/src/book/book.service.ts`
- Modify: `apps/backend/src/book/book.module.ts`
- Modify: `apps/backend/src/book/book.controller.spec.ts`

- [ ] **Step 1: Extend BookService with new methods**

Edit `apps/backend/src/book/book.service.ts`:

Replace the entire file content with:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, BookStatus } from '@repo/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';

export class CreateBookDto {
  childId: string;
  type: 'AI_ADAPTED' | 'MANUAL';
  storyTitle?: string;
  userContent?: string;
  parentComments?: string;
  tone?: string;
  style: string;
}

export class PageEditDto {
  feedback?: string;
}

export class RegenerateDto {
  parentFeedback: string;
}

export class SearchQueryDto {
  title?: string;
  style?: string;
  status?: string;
  childId?: string;
  page?: string | number;
  limit?: string | number;
}

@Injectable()
export class BookService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('book-generation') private bookQueue: Queue,
    private pdfService: PdfService,
    private storageService: StorageService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BookWhereInput;
  }) {
    const { skip, take, where } = params;
    const [books, total] = await Promise.all([
      this.prisma.client.book.findMany({
        skip,
        take,
        where,
        include: {
          child: { select: { name: true } },
          pages: {
            take: 1,
            include: { illustrations: { take: 1 } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.book.count({ where }),
    ]);

    const page = skip != null && take ? Math.floor(skip / take) + 1 : 1;
    const totalPages = take ? Math.ceil(total / take) : 1;

    return { books, total, page, totalPages };
  }

  async createAndGenerate(dto: CreateBookDto, userId: string) {
    const book = await this.prisma.client.book.create({
      data: {
        title: dto.storyTitle || dto.userContent?.slice(0, 50) || 'New Book',
        type: dto.type,
        style: dto.style,
        tone: dto.tone,
        parentComments: dto.parentComments,
        status: BookStatus.DRAFT,
        userId,
        childId: dto.childId,
      },
    });

    await this.bookQueue.add('generate-book', { bookId: book.id });
    return { bookId: book.id, status: 'DRAFT' };
  }

  async triggerGeneration(bookId: string) {
    await this.bookQueue.add('generate-book', { bookId });
    return { bookId, status: 'QUEUED' };
  }

  async getPreview(bookId: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: { illustrations: true },
        },
      },
    });

    if (!book) throw new NotFoundException('Book not found');
    if (book.status === BookStatus.DRAFT || book.status === BookStatus.GENERATING) {
      throw new NotFoundException('Book is still being generated');
    }

    if (book.status === BookStatus.COMPLETED) {
      return { book, pdfUrl: book.pdfUrl, redirectToDetail: true };
    }

    return { book };
  }

  async approveBook(bookId: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
          include: { illustrations: true },
        },
      },
    });

    if (!book) throw new NotFoundException('Book not found');

    const pages = book.pages.map((p) => ({
      text: p.textContent,
      imageUrl: p.illustrations[0]?.url,
    }));

    const pdfBuffer = await this.pdfService.generateBookPdf(pages);
    const pdfKey = `books/${bookId}/book.pdf`;
    await this.storageService.upload(pdfKey, pdfBuffer, 'application/pdf');

    const pdfUrl = `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${process.env.S3_BUCKET || 'test-bucket'}/${pdfKey}`;

    await this.prisma.client.book.update({
      where: { id: bookId },
      data: { status: BookStatus.COMPLETED, pdfUrl, approvedAt: new Date() },
    });

    return { pdfUrl };
  }

  async editPage(bookId: string, pageNumber: number, dto: PageEditDto) {
    const page = await this.prisma.client.page.findUnique({
      where: { bookId_pageNumber: { bookId, pageNumber } },
    });

    if (!page) throw new NotFoundException('Page not found');

    const updated = await this.prisma.client.page.update({
      where: { id: page.id },
      data: { textContent: dto.feedback ? `${page.textContent}\n\n[Parent edit: ${dto.feedback}]` : page.textContent },
      include: { illustrations: true },
    });

    return updated;
  }

  async regenerate(bookId: string, dto: RegenerateDto) {
    const book = await this.prisma.client.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');

    await this.prisma.client.book.update({
      where: { id: bookId },
      data: {
        status: BookStatus.GENERATING,
        parentFeedback: dto.parentFeedback,
      },
    });

    // Delete existing pages/illustrations for full regeneration
    await this.prisma.client.page.deleteMany({ where: { bookId } });

    await this.bookQueue.add('generate-book', {
      bookId,
      parentFeedback: dto.parentFeedback,
    });

    return { bookId, status: 'REGENERATING' };
  }

  async getPdfUrl(bookId: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
      select: { pdfUrl: true },
    });
    if (!book?.pdfUrl) throw new NotFoundException('PDF not available');
    return { pdfUrl: book.pdfUrl };
  }
}
```

- [ ] **Step 2: Extend BookController with new endpoints**

Edit `apps/backend/src/book/book.controller.ts`:

Replace the entire file with:
```typescript
import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req, ParseIntPipe,
} from '@nestjs/common';
import { BookService, CreateBookDto, SearchQueryDto, PageEditDto, RegenerateDto } from './book.service';
import { SubscriptionGuard } from '../payment/subscription.guard';
import { MockAuthGuard } from '../mock-auth.guard';

@Controller('books')
@UseGuards(MockAuthGuard)
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async findAll(@Query() query: SearchQueryDto, @Req() req: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user.id };
    if (query.title) where.title = { contains: query.title, mode: 'insensitive' };
    if (query.style) where.style = query.style;
    if (query.status) where.status = query.status;
    if (query.childId) where.childId = query.childId;

    return this.bookService.findAll({ skip, take: limit, where });
  }

  @Post('generate')
  @UseGuards(SubscriptionGuard)
  async generate(@Body() body: CreateBookDto, @Req() req: any) {
    return this.bookService.createAndGenerate(body, req.user.id);
  }

  @Get(':id/preview')
  async preview(@Param('id') id: string) {
    return this.bookService.getPreview(id);
  }

  @Patch(':id/pages/:pageNumber')
  async editPage(
    @Param('id') id: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() body: PageEditDto,
  ) {
    return this.bookService.editPage(id, pageNumber, body);
  }

  @Patch(':id/regenerate')
  async regenerate(@Param('id') id: string, @Body() body: RegenerateDto) {
    return this.bookService.regenerate(id, body);
  }

  @Post(':id/approve')
  @UseGuards(SubscriptionGuard)
  async approve(@Param('id') id: string) {
    return this.bookService.approveBook(id);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string) {
    return this.bookService.getPdfUrl(id);
  }
}
```

- [ ] **Step 3: Update BookModule imports**

Edit `apps/backend/src/book/book.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { PaymentModule } from '../payment/payment.module';
import { QueueModule } from '../queue/queue.module';
import { PdfModule } from '../pdf/pdf.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    QueueModule,
    PaymentModule,
    PdfModule,
    StorageModule,
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
```

- [ ] **Step 4: Update BookController tests**

Edit `apps/backend/src/book/book.controller.spec.ts`:

Replace the file content:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';

describe('BookController', () => {
  let controller: BookController;
  let service: BookService;

  const mockBookService = {
    findAll: jest.fn(),
    createAndGenerate: jest.fn(),
    getPreview: jest.fn(),
    approveBook: jest.fn(),
    editPage: jest.fn(),
    regenerate: jest.fn(),
    getPdfUrl: jest.fn(),
  };

  const mockPrismaService = {
    client: {
      user: { findUnique: jest.fn() },
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('true'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        { provide: BookService, useValue: mockBookService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
    service = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call bookService.findAll with user-scoped query', async () => {
      const query = { title: 'Test', style: 'CARTOON', page: 1, limit: 10 };
      const req = { user: { id: 'user-1' } };
      await controller.findAll(query, req);
      expect(service.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          title: { contains: 'Test', mode: 'insensitive' },
          style: 'CARTOON',
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('generate', () => {
    it('should call createAndGenerate with dto and userId', async () => {
      const dto = { childId: 'c1', type: 'AI_ADAPTED' as const, style: 'WATERCOLOR' };
      const req = { user: { id: 'user-1' } };
      await controller.generate(dto, req);
      expect(service.createAndGenerate).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('preview', () => {
    it('should call getPreview with book id', async () => {
      await controller.preview('book-1');
      expect(service.getPreview).toHaveBeenCalledWith('book-1');
    });
  });

  describe('approve', () => {
    it('should call approveBook with book id', async () => {
      await controller.approve('book-1');
      expect(service.approveBook).toHaveBeenCalledWith('book-1');
    });
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest apps/backend/src/book --no-coverage`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/book/ apps/backend/src/app.module.ts
git commit -m "feat: extend BookController with preview/approve/edit/regenerate endpoints"
```

---

### Task 4: BookProcessor Updates (Tone, Comments, Regeneration)

**Files:**
- Modify: `apps/backend/src/book-generation/book.processor.ts`
- Modify: `apps/backend/src/book-generation/book.processor.spec.ts`

- [ ] **Step 1: Update BookProcessor to inject tone, parentComments, and support regeneration**

Edit `apps/backend/src/book-generation/book.processor.ts`:

Replace the entire file:
```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { BookStatus } from '@repo/database';

@Processor('book-generation')
export class BookProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<{ bookId: string; parentFeedback?: string }>): Promise<any> {
    const { bookId, parentFeedback } = job.data;

    const book = await this.prisma.client.book.findUnique({
      where: { id: bookId },
      include: { child: true },
    });

    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    let storyPrompt = `Generate a children's book story titled "${book.title}" for a ${book.child.age} year old ${book.child.gender} who likes ${(book.child.interests || []).join(', ')}.`;

    if (book.tone) {
      storyPrompt += ` The tone should be ${book.tone.toLowerCase()}.`;
    }

    if (book.parentComments) {
      storyPrompt += ` Parent instructions: ${book.parentComments}.`;
    }

    if (parentFeedback) {
      storyPrompt += ` The parent requested changes: ${parentFeedback}. Revise the story accordingly.`;
    }

    storyPrompt += ` The story should be between 3 and 20 pages long. Format each page as "Page X: [content]".`;

    const storyText = await this.aiService.generateStory(storyPrompt);
    const pagesContent = storyText.split(/Page \d+:/).map(c => c.trim()).filter(content => content.length > 0);

    for (let i = 0; i < pagesContent.length; i++) {
      const trimmedContent = pagesContent[i];
      const pageNumber = i + 1;

      const page = await this.prisma.client.page.create({
        data: {
          bookId: book.id,
          pageNumber,
          textContent: trimmedContent,
        },
      });

      const childFeatures = `${book.child.age} year old ${book.child.gender}, interested in ${(book.child.interests || []).join(', ')}`;
      const numIllustrations = (book.style === 'MANGA' || book.style === 'COMIC') ? 2 : 1;

      for (let j = 0; j < numIllustrations; j++) {
        let illustrationPrompt = '';
        if (book.style === 'MANGA' || book.style === 'COMIC') {
          illustrationPrompt = `Manga style, high contrast, black and white, featuring a ${childFeatures}, panel ${j + 1}, ${trimmedContent}`;
        } else {
          illustrationPrompt = `${book.style} style, featuring a ${childFeatures}, ${trimmedContent}`;
        }

        const imageUrl = await this.aiService.generateImage(illustrationPrompt);
        await this.prisma.client.illustration.create({
          data: {
            pageId: page.id,
            prompt: illustrationPrompt,
            url: imageUrl,
          },
        });
      }
    }

    await this.prisma.client.book.update({
      where: { id: book.id },
      data: { status: BookStatus.REVIEW },
    });

    return { success: true };
  }
}
```

- [ ] **Step 2: Update BookProcessor tests**

Edit `apps/backend/src/book-generation/book.processor.spec.ts`:

Add test for tone and parentComments (append before the closing `})`):
```typescript
  it('should include tone and parentComments in story prompt', async () => {
    const bookId = 'tone-book-id';
    const mockBook = {
      id: bookId,
      title: 'Tone Test',
      style: 'CARTOON',
      tone: 'PLAYFUL',
      parentComments: 'Make it very funny',
      child: {
        name: 'Charlie',
        age: 4,
        gender: 'male',
        interests: ['dogs'],
      },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: Fun content');
    mockAiService.generateImage.mockResolvedValue('https://example.com/img.jpg');
    mockPrismaClient.page.create.mockResolvedValue({ id: 'page-1' });

    const job = { data: { bookId } } as Job;
    await processor.process(job);

    expect(aiService.generateStory).toHaveBeenCalledWith(
      expect.stringContaining('playful')
    );
    expect(aiService.generateStory).toHaveBeenCalledWith(
      expect.stringContaining('Make it very funny')
    );
  });

  it('should inject parentFeedback when regenerating', async () => {
    const bookId = 'regen-book-id';
    const mockBook = {
      id: bookId,
      title: 'Regen Test',
      style: 'CARTOON',
      child: {
        name: 'Dana',
        age: 6,
        gender: 'female',
        interests: ['cats'],
      },
    };

    mockPrismaClient.book.findUnique.mockResolvedValue(mockBook);
    mockAiService.generateStory.mockResolvedValue('Page 1: New content');
    mockAiService.generateImage.mockResolvedValue('https://example.com/img.jpg');
    mockPrismaClient.page.create.mockResolvedValue({ id: 'page-1' });

    const job = { data: { bookId, parentFeedback: 'Make the ending happier' } } as Job;
    await processor.process(job);

    expect(aiService.generateStory).toHaveBeenCalledWith(
      expect.stringContaining('Make the ending happier')
    );
  });
```

- [ ] **Step 3: Run tests**

Run: `npx jest apps/backend/src/book-generation --no-coverage`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/book-generation/
git commit -m "feat: inject tone, parentComments, and regeneration feedback into AI prompts"
```

---

### Task 5: Frontend Page Layout + Navigation

**Files:**
- Modify: `apps/frontend/src/app/layout.tsx`

- [ ] **Step 1: Update layout with navigation header**

Edit `apps/frontend/src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MSWProvider } from "@/components/MSWProvider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "aiBook - AI Generated Children's Books",
  description: "Create personalized AI-generated children's books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MSWProvider>
          <nav className="border-b bg-white sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-8">
                  <Link href="/" className="font-bold text-xl text-blue-600">
                    aiBook
                  </Link>
                  <div className="flex gap-6 text-sm">
                    <Link href="/" className="text-gray-600 hover:text-gray-900">
                      Dashboard
                    </Link>
                    <Link href="/profiles" className="text-gray-600 hover:text-gray-900">
                      Profiles
                    </Link>
                    <Link href="/settings" className="text-gray-600 hover:text-gray-900">
                      Settings
                    </Link>
                  </div>
                </div>
                <Link
                  href="/books/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create Book
                </Link>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </MSWProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build` in `apps/frontend/` (or check TypeScript compiles)
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/layout.tsx
git commit -m "feat: add navigation header with Dashboard, Profiles, Settings links"
```

---

### Task 6: Frontend Shared Components

**Files:**
- Create: `apps/frontend/src/components/BookCard.tsx`
- Create: `apps/frontend/src/components/Pagination.tsx`
- Create: `apps/frontend/src/components/SpreadViewer.tsx`
- Create: `apps/frontend/src/components/ProfileSelector.tsx`

- [ ] **Step 1: Create BookCard component**

Create `apps/frontend/src/components/BookCard.tsx`:
```tsx
'use client';

import Link from 'next/link';

type BookCardProps = {
  id: string;
  title: string;
  style: string;
  status: string;
  childName?: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GENERATING: 'bg-yellow-100 text-yellow-800',
  REVIEW: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export default function BookCard({ id, title, style, status, childName, createdAt }: BookCardProps) {
  const href = status === 'COMPLETED' ? `/books/${id}` : `/books/${id}/preview`;

  return (
    <Link href={href} className="block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[1.414/1] bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-4xl mb-2">📖</div>
          <p className="text-xs text-gray-400">{style}</p>
        </div>
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-lg truncate">{title}</h2>
        {childName && <p className="text-gray-500 text-sm">For: {childName}</p>}
        <div className="mt-3 flex justify-between items-center">
          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
          <span className="text-xs text-gray-400">{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create Pagination component**

Create `apps/frontend/src/components/Pagination.tsx`:
```tsx
'use client';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 rounded border text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded text-sm ${
            p === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 rounded border text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create SpreadViewer component**

Create `apps/frontend/src/components/SpreadViewer.tsx`:
```tsx
'use client';

import { useState } from 'react';

type Illustration = {
  id: string;
  url?: string;
  prompt: string;
};

type Page = {
  id: string;
  pageNumber: number;
  textContent: string;
  illustrations: Illustration[];
};

type SpreadViewerProps = {
  pages: Page[];
};

export default function SpreadViewer({ pages }: SpreadViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = pages.length;

  const page = pages[currentPage];
  if (!page) return null;

  return (
    <div>
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="aspect-[1.414/1] bg-gray-50 relative flex items-center justify-center">
          {page.illustrations[0]?.url ? (
            <img
              src={page.illustrations[0].url}
              alt={page.illustrations[0].prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-gray-300 text-sm">Illustration placeholder</div>
          )}
        </div>
        <div className="p-6 border-t">
          <p className="text-gray-700 leading-relaxed">{page.textContent}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-4 py-2 border rounded text-sm disabled:opacity-30 hover:bg-gray-50"
        >
          ← Previous
        </button>
        <span className="text-sm text-gray-500">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="px-4 py-2 border rounded text-sm disabled:opacity-30 hover:bg-gray-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ProfileSelector component**

Create `apps/frontend/src/components/ProfileSelector.tsx`:
```tsx
'use client';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
};

type ProfileSelectorProps = {
  profiles: ChildProfile[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export default function ProfileSelector({ profiles, selectedId, onSelect }: ProfileSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => onSelect(profile.id)}
          className={`p-4 rounded-lg border text-left transition-all ${
            selectedId === profile.id
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <h3 className="font-semibold">{profile.name}</h3>
          <p className="text-sm text-gray-600">{profile.age} years old · {profile.gender}</p>
          <p className="text-xs text-gray-400 mt-1">{profile.interests?.join(', ')}</p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/
git commit -m "feat: add shared components BookCard, Pagination, SpreadViewer, ProfileSelector"
```

---

### Task 7: Frontend Dashboard Page

**Files:**
- Modify: `apps/frontend/src/app/page.tsx`

- [ ] **Step 1: Replace gallery with full dashboard**

Edit `apps/frontend/src/app/page.tsx`:
```tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import BookCard from '@/components/BookCard';
import Pagination from '@/components/Pagination';

type Book = {
  id: string;
  title: string;
  style: string;
  status: string;
  child?: { name: string };
  createdAt: string;
};

type PaginatedResponse = {
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
};

const STATUSES = ['', 'DRAFT', 'GENERATING', 'REVIEW', 'COMPLETED'];
const STYLES = ['', 'WATERCOLOR', 'CARTOON', 'REALISTIC', 'PIXAR', 'SKETCH', 'MANGA', 'COMIC'];

export default function DashboardPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [style, setStyle] = useState('');
  const [page, setPage] = useState(1);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (style) params.set('style', style);
    params.set('page', String(page));
    params.set('limit', '10');

    try {
      const res = await fetch(`/api/books?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  }, [search, status, style, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">My Books</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All Status'}</option>
          ))}
        </select>
        <select
          value={style}
          onChange={(e) => { setStyle(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s || 'All Styles'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading books...</p>
      ) : data && data.books.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.books.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                style={book.style}
                status={book.status}
                childName={book.child?.name}
                createdAt={book.createdAt}
              />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No books found</p>
          <a href="/books/new" className="text-blue-600 hover:underline">Create your first book</a>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/app/page.tsx
git commit -m "feat: implement dashboard with search, filters, pagination"
```

---

### Task 8: Frontend Book Creation Wizard

**Files:**
- Create: `apps/frontend/src/app/books/new/page.tsx`

- [ ] **Step 1: Create the directory and page**

Create `apps/frontend/src/app/books/new/page.tsx`:
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSelector from '@/components/ProfileSelector';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
};

const TONES = ['WARM', 'EDUCATIONAL', 'PLAYFUL', 'MAGICAL', 'ADVENTUROUS'];
const STYLES = ['WATERCOLOR', 'CARTOON', 'REALISTIC', 'PIXAR', 'SKETCH', 'MANGA', 'COMIC'];

export default function CreateBookPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [storyType, setStoryType] = useState<'AI_ADAPTED' | 'MANUAL'>('AI_ADAPTED');
  const [storyTitle, setStoryTitle] = useState('');
  const [storySuggestions, setStorySuggestions] = useState<{ id: string; title: string }[]>([]);
  const [userContent, setUserContent] = useState('');
  const [parentComments, setParentComments] = useState('');
  const [tone, setTone] = useState('WARM');
  const [style, setStyle] = useState('WATERCOLOR');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/child-profiles')
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (storyTitle.length < 2) {
      setStorySuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/stories?search=${encodeURIComponent(storyTitle)}`)
        .then((r) => r.json())
        .then(setStorySuggestions)
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [storyTitle]);

  const handleGenerate = async () => {
    if (!selectedProfileId) return;
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/books/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedProfileId,
          type: storyType,
          storyTitle: storyType === 'AI_ADAPTED' ? storyTitle : undefined,
          userContent: storyType === 'MANUAL' ? userContent : undefined,
          parentComments: parentComments || undefined,
          tone,
          style,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create book');
      }

      const { bookId } = await res.json();
      router.push(`/books/${bookId}/preview`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Create New Book</h1>

      {/* Step indicators */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Select a Child Profile</h2>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No profiles yet</p>
              <a href="/profiles" className="text-blue-600 hover:underline">Create a profile first</a>
            </div>
          ) : (
            <>
              <ProfileSelector profiles={profiles} selectedId={selectedProfileId} onSelect={setSelectedProfileId} />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedProfileId}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose Story Source</h2>
          <div className="space-y-4">
            <label className={`block p-4 rounded-lg border cursor-pointer ${storyType === 'AI_ADAPTED' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="storyType" value="AI_ADAPTED" checked={storyType === 'AI_ADAPTED'} onChange={() => setStoryType('AI_ADAPTED')} className="mr-2" />
              <span className="font-medium">Based on a known story</span>
              <p className="text-sm text-gray-500 mt-1">Adapt a classic fairy tale or enter your own story name</p>
            </label>
            {storyType === 'AI_ADAPTED' && (
              <div className="ml-6 space-y-2">
                <input
                  type="text"
                  placeholder="Search for a story or type your own..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {storySuggestions.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {storySuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStoryTitle(s.title)}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <label className={`block p-4 rounded-lg border cursor-pointer ${storyType === 'MANUAL' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="storyType" value="MANUAL" checked={storyType === 'MANUAL'} onChange={() => setStoryType('MANUAL')} className="mr-2" />
              <span className="font-medium">My own story</span>
              <p className="text-sm text-gray-500 mt-1">Provide your own story content to create a book</p>
            </label>
            {storyType === 'MANUAL' && (
              <textarea
                placeholder="Paste your story here..."
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                rows={8}
                className="ml-6 w-full border rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={storyType === 'AI_ADAPTED' ? !storyTitle : !userContent}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Configure & Generate</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Comments</label>
              <textarea
                placeholder="Tell us what to change about the story, what to emphasize, or any special requests..."
                value={parentComments}
                onChange={(e) => setParentComments(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Back</button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 text-white px-8 py-2 rounded-lg disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/app/books/new/page.tsx
git commit -m "feat: implement 3-step book creation wizard"
```

---

### Task 9: Frontend Preview Page

**Files:**
- Create: `apps/frontend/src/app/books/[id]/preview/page.tsx`

- [ ] **Step 1: Create preview page component**

Create `apps/frontend/src/app/books/[id]/preview/page.tsx`:
```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SpreadViewer from '@/components/SpreadViewer';

type Illustration = {
  id: string;
  url?: string;
  prompt: string;
};

type Page = {
  id: string;
  pageNumber: number;
  textContent: string;
  illustrations: Illustration[];
};

type BookData = {
  book: {
    id: string;
    title: string;
    status: string;
    tone?: string;
    style: string;
    pages: Page[];
  };
  pdfUrl?: string;
  redirectToDetail?: boolean;
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageFeedback, setPageFeedback] = useState<Record<number, string>>({});
  const [globalFeedback, setGlobalFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/books/${params.id}/preview`)
      .then((r) => {
        if (!r.ok) throw new Error('Preview not available');
        return r.json();
      })
      .then((json) => {
        if (json.redirectToDetail) {
          router.replace(`/books/${params.id}`);
          return;
        }
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id, router]);

  const handleSubmitChanges = async () => {
    setSubmitting(true);
    setError('');

    // Submit per-page feedback
    for (const [pageNum, feedback] of Object.entries(pageFeedback)) {
      if (!feedback.trim()) continue;
      await fetch(`/api/books/${params.id}/pages/${pageNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
    }

    // Submit global feedback
    if (globalFeedback.trim()) {
      const res = await fetch(`/api/books/${params.id}/regenerate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentFeedback: globalFeedback }),
      });

      if (res.ok) {
        setGlobalFeedback('');
        setPageFeedback({});
        setSubmitting(false);
        router.refresh();
        // Reload preview after a short delay
        setTimeout(() => {
          setLoading(true);
          fetch(`/api/books/${params.id}/preview`)
            .then((r) => r.json())
            .then((json) => {
              if (json.redirectToDetail) {
                router.replace(`/books/${params.id}`);
                return;
              }
              setData(json);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        }, 2000);
        return;
      }
    }

    setSubmitting(false);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/books/${params.id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve book');
      router.push(`/books/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading preview...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-gray-500">No preview available</p>;

  const hasFeedback = Object.values(pageFeedback).some((f) => f.trim()) || globalFeedback.trim();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{data.book.title}</h1>
          <p className="text-sm text-gray-500">
            {data.book.style} · {data.book.tone?.toLowerCase()}
            <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded">REVIEW</span>
          </p>
        </div>
        <a href="/" className="text-sm text-gray-600 hover:text-gray-900">← Back to Dashboard</a>
      </div>

      <SpreadViewer pages={data.book.pages} />

      {/* Per-page feedback */}
      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Suggest Changes</h2>
        {data.book.pages.map((page) => (
          <div key={page.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Page {page.pageNumber}</span>
              {pageFeedback[page.pageNumber]?.trim() && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Pending edit</span>
              )}
            </div>
            <button
              onClick={() => {
                const el = document.getElementById(`feedback-${page.pageNumber}`);
                el?.classList.toggle('hidden');
              }}
              className="text-sm text-blue-600 hover:underline mb-2 inline-block"
            >
              ✏️ Edit this page
            </button>
            <textarea
              id={`feedback-${page.pageNumber}`}
              placeholder="Describe what to change on this page..."
              value={pageFeedback[page.pageNumber] || ''}
              onChange={(e) => setPageFeedback((prev) => ({ ...prev, [page.pageNumber]: e.target.value }))}
              rows={2}
              className="hidden w-full border rounded-lg px-3 py-2 text-sm mt-2"
            />
          </div>
        ))}
      </div>

      {/* Global feedback */}
      <div className="mt-6 border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">✏️ Global Changes</h3>
        <textarea
          placeholder="Describe changes that affect the whole book..."
          value={globalFeedback}
          onChange={(e) => setGlobalFeedback(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmitChanges}
          disabled={submitting || !hasFeedback}
          className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm disabled:opacity-50 hover:bg-blue-50"
        >
          {submitting ? 'Submitting...' : 'Submit Changes'}
        </button>
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-green-700"
        >
          ✅ Approve Book
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/app/books/[id]/preview/page.tsx
git commit -m "feat: implement book preview page with spread viewer and edit fields"
```

---

### Task 10: Frontend Remaining Pages

**Files:**
- Create: `apps/frontend/src/app/books/[id]/page.tsx`
- Modify: `apps/frontend/src/app/profiles/page.tsx`
- Create: `apps/frontend/src/app/settings/page.tsx`

- [ ] **Step 1: Create Book Detail page**

Create `apps/frontend/src/app/books/[id]/page.tsx`:
```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${params.id}/preview`)
      .then((r) => r.json())
      .then((json) => {
        setBook(json.book || json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDownload = () => {
    fetch(`/api/books/${params.id}/pdf`)
      .then((r) => r.json())
      .then(({ pdfUrl }) => {
        window.open(pdfUrl, '_blank');
      })
      .catch(console.error);
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!book) return <p className="text-red-600">Book not found</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <a href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">← Back to Dashboard</a>

      <div className="aspect-[1.414/1] bg-linear-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mb-6">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-gray-400 text-sm">{book.style}</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">{book.title}</h1>

      <div className="flex gap-2 mb-6">
        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded">{book.status}</span>
        {book.style && <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded">{book.style}</span>}
        {book.tone && <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded">{book.tone}</span>}
      </div>

      {book.status === 'COMPLETED' && (
        <button
          onClick={handleDownload}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Download PDF
        </button>
      )}

      {book.pages && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Pages</h2>
          {book.pages.map((page: any) => (
            <div key={page.id} className="border rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Page {page.pageNumber}</p>
              <p className="text-sm">{page.textContent}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Enhance Profiles page**

Edit `apps/frontend/src/app/profiles/page.tsx`:
```tsx
'use client';

import React, { useEffect, useState } from 'react';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [interests, setInterests] = useState('');

  const fetchProfiles = () => {
    fetch('/api/child-profiles')
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/child-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        age: parseInt(age),
        gender,
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
      }),
    });

    if (res.ok) {
      setName('');
      setAge('');
      setGender('male');
      setInterests('');
      setShowForm(false);
      fetchProfiles();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return;
    await fetch(`/api/child-profiles/${id}`, { method: 'DELETE' });
    fetchProfiles();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Child Profiles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : 'Add Profile'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-4 border rounded-lg space-y-3">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            min={1}
            max={18}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input
            placeholder="Interests (comma separated)"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Save</button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-2">No profiles found</p>
          <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline text-sm">
            Create your first profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <p className="text-sm text-gray-600">{profile.age} years · {profile.gender}</p>
                </div>
                <button onClick={() => handleDelete(profile.id)} className="text-red-500 text-sm hover:underline">
                  Delete
                </button>
              </div>
              {profile.interests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {profile.interests.map((interest, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create Settings page placeholder**

Create `apps/frontend/src/app/settings/page.tsx`:
```tsx
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="border rounded-lg p-6">
        <h2 className="font-semibold mb-2">Subscription</h2>
        <p className="text-sm text-gray-600">Manage your subscription and billing settings.</p>
        <p className="text-xs text-gray-400 mt-4">Settings page — coming soon.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/books/[id]/page.tsx apps/frontend/src/app/profiles/page.tsx apps/frontend/src/app/settings/page.tsx
git commit -m "feat: add book detail, enhanced profiles CRUD, and settings placeholder"
```

---

### Task 11: Update MSW Handlers

**Files:**
- Modify: `apps/frontend/src/mocks/handlers.ts`

- [ ] **Step 1: Add MSW handlers for new endpoints**

Edit `apps/frontend/src/mocks/handlers.ts`:
```typescript
import { http, HttpResponse } from 'msw'

const mockBookPages = [
  { id: 'p1', pageNumber: 1, textContent: 'Once upon a time, in a cozy little village, there lived a brave little girl named Lily.', illustrations: [{ id: 'i1', url: 'https://placehold.co/800x600/ADD8E6/333333?text=Page+1', prompt: 'Girl in village' }] },
  { id: 'p2', pageNumber: 2, textContent: 'Lily loved exploring the forest behind her house. She dreamed of finding a magical creature.', illustrations: [{ id: 'i2', url: 'https://placehold.co/800x600/90EE90/333333?text=Page+2', prompt: 'Girl in forest' }] },
  { id: 'p3', pageNumber: 3, textContent: 'One sunny morning, she discovered a tiny, sparkling door at the base of an old oak tree.', illustrations: [{ id: 'i3', url: 'https://placehold.co/800x600/DDA0DD/333333?text=Page+3', prompt: 'Sparkling door in tree' }] },
];

const mockProfiles = [
  { id: '1', name: 'Alice', age: 5, gender: 'female', interests: ['dinosaurs', 'space'] },
  { id: '2', name: 'Bob', age: 7, gender: 'male', interests: ['robots', 'coding'] },
];

const mockStories = [
  { id: 's1', title: 'The Little Red Riding Hood', description: 'A girl meets a wolf' },
  { id: 's2', title: 'Cinderella', description: 'A kind girl goes to the ball' },
  { id: 's3', title: 'Snow White', description: 'A princess and seven dwarfs' },
  { id: 's4', title: 'The Three Little Pigs', description: 'Three pigs build houses' },
  { id: 's5', title: 'Jack and the Beanstalk', description: 'A boy and magic beans' },
];

export const handlers = [
  http.get('/api/books', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const style = url.searchParams.get('style') || '';

    let books = [
      { id: 'b1', title: 'The Brave Little Lion', style: 'CARTOON', status: 'COMPLETED', child: { name: 'Alice' }, createdAt: '2026-05-20T10:00:00Z' },
      { id: 'b2', title: 'Space Adventure', style: 'PIXAR', status: 'GENERATING', child: { name: 'Bob' }, createdAt: '2026-05-25T14:30:00Z' },
      { id: 'b3', title: 'The Magic Forest', style: 'WATERCOLOR', status: 'REVIEW', child: { name: 'Alice' }, createdAt: '2026-05-26T09:00:00Z' },
      { id: 'b4', title: 'Dinosaur Friends', style: 'CARTOON', status: 'DRAFT', child: { name: 'Alice' }, createdAt: '2026-05-26T08:00:00Z' },
    ];

    if (search) books = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));
    if (status) books = books.filter((b) => b.status === status);
    if (style) books = books.filter((b) => b.style === style);

    const total = books.length;
    const limit = 10;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = books.slice(start, start + limit);

    return HttpResponse.json({ books: paginated, total, page, totalPages });
  }),

  http.get('/api/books/:id/preview', ({ params }) => {
    const { id } = params;
    if (id === 'b1') {
      return HttpResponse.json({
        book: { id: 'b1', title: 'The Brave Little Lion', status: 'COMPLETED', style: 'CARTOON', tone: 'PLAYFUL', pages: mockBookPages },
        pdfUrl: 'https://example.com/book.pdf',
        redirectToDetail: true,
      });
    }
    if (id === 'b3') {
      return HttpResponse.json({
        book: { id: 'b3', title: 'The Magic Forest', status: 'REVIEW', style: 'WATERCOLOR', tone: 'MAGICAL', pages: mockBookPages },
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/books/generate', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ bookId: 'b5', status: 'DRAFT' });
  }),

  http.post('/api/books/:id/approve', () => {
    return HttpResponse.json({ pdfUrl: 'https://example.com/book.pdf' });
  }),

  http.patch('/api/books/:id/pages/:pageNumber', async ({ params, request }) => {
    const body = await request.json() as any;
    const pageNum = parseInt(params.pageNumber as string);
    return HttpResponse.json({
      id: `p${pageNum}`,
      pageNumber: pageNum,
      textContent: `Updated content: ${body.feedback || ''}`,
      illustrations: [{ id: `i${pageNum}`, url: `https://placehold.co/800x600?text=Updated+Page+${pageNum}`, prompt: 'Updated' }],
    });
  }),

  http.patch('/api/books/:id/regenerate', () => {
    return HttpResponse.json({ bookId: 'b3', status: 'REGENERATING' });
  }),

  http.get('/api/books/:id/pdf', () => {
    return HttpResponse.json({ pdfUrl: 'https://example.com/book.pdf' });
  }),

  http.get('/api/child-profiles', () => {
    return HttpResponse.json(mockProfiles);
  }),

  http.post('/api/child-profiles', async ({ request }) => {
    const newProfile = await request.json()
    return HttpResponse.json({ id: Math.random().toString(36).substr(2, 9), ...(newProfile as object) }, { status: 201 })
  }),

  http.delete('/api/child-profiles/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/stories', ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const filtered = search
      ? mockStories.filter((s) => s.title.toLowerCase().includes(search))
      : mockStories;
    return HttpResponse.json(filtered);
  }),
]
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/mocks/handlers.ts
git commit -m "feat: add MSW handlers for all new API endpoints"
```

---

### Self-Review Checklist

1. **Spec coverage:** Does each spec section have a task?
   - ✅ Data model changes → Task 1
   - ✅ Story library → Tasks 1, 2
   - ✅ Book creation → Task 3 (backend), Task 8 (frontend)
   - ✅ Preview endpoint → Tasks 3, 9
   - ✅ Per-page editing → Tasks 3, 9
   - ✅ Regeneration → Tasks 3, 4, 9
   - ✅ Approval + PDF → Task 3 (backend), Task 10 (detail page)
   - ✅ Dashboard (paginated/search/filter) → Task 3 (backend findAll update), Task 7 (frontend)
   - ✅ Profiles → Task 10 (frontend enhanced)
   - ✅ Settings → Task 10 (placeholder)
   - ✅ Navigation layout → Task 5
   - ✅ Shared components → Task 6
   - ✅ MSW handlers → Task 11

2. **Placeholder scan:** All steps contain complete code. No "TBD" or "TODO".

3. **Type consistency:** All method signatures match between controller, service, and tests.
