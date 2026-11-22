/**
 * Short passages from the Berean Standard Bible (BSB), in modern English. The BSB is in the public domain,
 * so no notice is needed.
 */
export const BIBLE_VERSION = 'BSB'

export interface Verse {
  ref: string
  text: string
}

export const VERSES = {
  lords: {
    ref: 'Psalm 24:1',
    text: "The earth is the LORD’s, and the fullness thereof, the world and all who dwell therein.",
  },
  glory: {
    ref: '1 Corinthians 10:31',
    text: "So whether you eat or drink or whatever you do, do it all to the glory of God.",
  },
  provider: {
    ref: 'Deuteronomy 8:18',
    text: "But remember that it is the LORD your God who gives you the power to gain wealth.",
  },
  ofThine: {
    ref: '1 Chronicles 29:14',
    text: "For everything comes from You, and we have given You only what comes from Your hand.",
  },
  firstFruits: {
    ref: 'Proverbs 3:9-10',
    text: "Honor the LORD with your wealth and with the firstfruits of all your crops; then your barns will be filled with plenty, and your vats will overflow with new wine.",
  },
  cheerful: {
    ref: '2 Corinthians 9:7',
    text: "Each one should give what he has decided in his heart to give, not out of regret or compulsion. For God loves a cheerful giver.",
  },
  blessedToGive: {
    ref: 'Acts 20:35',
    text: "Remember the words of the Lord Jesus Himself: ‘It is more blessed to give than to receive.’",
  },
  faithful: {
    ref: '1 Corinthians 4:2',
    text: "Now it is required of stewards that they be found faithful.",
  },
  fewThings: {
    ref: 'Matthew 25:21',
    text: "Well done, good and faithful servant! You have been faithful in a few things; I will put you in charge of many things.",
  },
  little: {
    ref: 'Luke 16:10',
    text: "Whoever is faithful with very little will also be faithful with much.",
  },
  countCost: {
    ref: 'Luke 14:28',
    text: "Which of you, wishing to build a tower, does not first sit down and count the cost to see if he has the resources to complete it?",
  },
  diligent: {
    ref: 'Proverbs 21:5',
    text: "The plans of the diligent bring plenty, as surely as haste leads to poverty.",
  },
  knowState: {
    ref: 'Proverbs 27:23',
    text: "Be sure to know the state of your flocks, and pay close attention to your herds.",
  },
  wiseSaves: {
    ref: 'Proverbs 21:20',
    text: "Precious treasure and oil are in the dwelling of the wise, but a foolish man consumes them.",
  },
  oweNoOne: {
    ref: 'Romans 13:8',
    text: "Be indebted to no one, except to one another in love.",
  },
  borrower: {
    ref: 'Proverbs 22:7',
    text: "The rich rule over the poor, and the borrower is servant to the lender.",
  },
  treasure: {
    ref: 'Matthew 6:21',
    text: "For where your treasure is, there your heart will be also.",
  },
  covetousness: {
    ref: 'Luke 12:15',
    text: "Watch out and guard yourselves against every form of greed, for one’s life does not consist in the abundance of his possessions.",
  },
  contentment: {
    ref: '1 Timothy 6:6-7',
    text: "Godliness with contentment is great gain. For we brought nothing into the world, so we cannot carry anything out of it.",
  },
  content: {
    ref: 'Hebrews 13:5',
    text: "Keep your lives free from the love of money and be content with what you have, for God has said: ‘Never will I leave you, never will I forsake you.’",
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
