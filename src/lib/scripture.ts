/** KJV (public domain). Short passages only. */
export interface Verse {
  ref: string
  text: string
}

export const VERSES = {
  lords: {
    ref: 'Psalm 24:1',
    text: "The earth is the LORD's, and the fulness thereof; the world, and they that dwell therein.",
  },
  provider: {
    ref: 'Deuteronomy 8:18',
    text: 'But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth.',
  },
  ofThine: {
    ref: '1 Chronicles 29:14',
    text: 'For all things come of thee, and of thine own have we given thee.',
  },
  firstFruits: {
    ref: 'Proverbs 3:9-10',
    text: 'Honour the LORD with thy substance, and with the firstfruits of all thine increase: so shall thy barns be filled with plenty.',
  },
  cheerful: {
    ref: '2 Corinthians 9:7',
    text: 'Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.',
  },
  blessedToGive: {
    ref: 'Acts 20:35',
    text: 'It is more blessed to give than to receive.',
  },
  faithful: {
    ref: '1 Corinthians 4:2',
    text: 'Moreover it is required in stewards, that a man be found faithful.',
  },
  fewThings: {
    ref: 'Matthew 25:21',
    text: 'Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things.',
  },
  little: {
    ref: 'Luke 16:10',
    text: 'He that is faithful in that which is least is faithful also in much.',
  },
  countCost: {
    ref: 'Luke 14:28',
    text: 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  },
  diligent: {
    ref: 'Proverbs 21:5',
    text: 'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.',
  },
  knowState: {
    ref: 'Proverbs 27:23',
    text: 'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
  },
  wiseSaves: {
    ref: 'Proverbs 21:20',
    text: 'There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up.',
  },
  oweNoOne: {
    ref: 'Romans 13:8',
    text: 'Owe no man any thing, but to love one another.',
  },
  borrower: {
    ref: 'Proverbs 22:7',
    text: 'The rich ruleth over the poor, and the borrower is servant to the lender.',
  },
  treasure: {
    ref: 'Matthew 6:21',
    text: 'For where your treasure is, there will your heart be also.',
  },
  covetousness: {
    ref: 'Luke 12:15',
    text: "Take heed, and beware of covetousness: for a man's life consisteth not in the abundance of the things which he possesseth.",
  },
  contentment: {
    ref: '1 Timothy 6:6-7',
    text: 'But godliness with contentment is great gain. For we brought nothing into this world, and it is certain we can carry nothing out.',
  },
  content: {
    ref: 'Hebrews 13:5',
    text: 'Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.',
  },
} satisfies Record<string, Verse>

const DAILY: Verse[] = [
  VERSES.lords,
  VERSES.provider,
  VERSES.firstFruits,
  VERSES.faithful,
  VERSES.countCost,
  VERSES.cheerful,
  VERSES.treasure,
  VERSES.diligent,
  VERSES.ofThine,
  VERSES.contentment,
  VERSES.oweNoOne,
  VERSES.knowState,
  VERSES.blessedToGive,
  VERSES.little,
  VERSES.content,
  VERSES.wiseSaves,
  VERSES.covetousness,
  VERSES.borrower,
  VERSES.fewThings,
]

/** One verse per day, rotating through the list. */
export function verseOfTheDay(date = new Date()): Verse {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  return DAILY[dayNumber % DAILY.length]
}
