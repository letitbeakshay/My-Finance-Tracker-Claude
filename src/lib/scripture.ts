/**
 * Short passages from the New International Version (NIV), in modern English.
 * Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011
 * by Biblica, Inc.™ Used with permission. All rights reserved worldwide. (Fewer than 500 verses, with this notice
 * shown in the app, is within the publisher's permission for quotation.)
 */
export const BIBLE_VERSION = 'NIV'
export const BIBLE_NOTICE =
  'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used with permission. All rights reserved worldwide.'

export interface Verse {
  ref: string
  text: string
}

export const VERSES = {
  lords: {
    ref: 'Psalm 24:1',
    text: "The earth is the LORD’s, and everything in it, the world, and all who live in it.",
  },
  glory: {
    ref: '1 Corinthians 10:31',
    text: "So whether you eat or drink or whatever you do, do it all for the glory of God.",
  },
  provider: {
    ref: 'Deuteronomy 8:18',
    text: "But remember the LORD your God, for it is he who gives you the ability to produce wealth.",
  },
  ofThine: {
    ref: '1 Chronicles 29:14',
    text: "Everything comes from you, and we have given you only what comes from your hand.",
  },
  firstFruits: {
    ref: 'Proverbs 3:9-10',
    text: "Honor the LORD with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine.",
  },
  cheerful: {
    ref: '2 Corinthians 9:7',
    text: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
  },
  blessedToGive: {
    ref: 'Acts 20:35',
    text: "Remembering the words the Lord Jesus himself said: ‘It is more blessed to give than to receive.’",
  },
  faithful: {
    ref: '1 Corinthians 4:2',
    text: "Now it is required that those who have been given a trust must prove faithful.",
  },
  fewThings: {
    ref: 'Matthew 25:21',
    text: "Well done, good and faithful servant! You have been faithful with a few things; I will put you in charge of many things.",
  },
  little: {
    ref: 'Luke 16:10',
    text: "Whoever can be trusted with very little can also be trusted with much.",
  },
  countCost: {
    ref: 'Luke 14:28',
    text: "Suppose one of you wants to build a tower. Won’t you first sit down and estimate the cost to see if you have enough money to complete it?",
  },
  diligent: {
    ref: 'Proverbs 21:5',
    text: "The plans of the diligent lead to profit as surely as haste leads to poverty.",
  },
  knowState: {
    ref: 'Proverbs 27:23',
    text: "Be sure you know the condition of your flocks, give careful attention to your herds.",
  },
  wiseSaves: {
    ref: 'Proverbs 21:20',
    text: "The wise store up choice food and olive oil, but fools gulp theirs down.",
  },
  oweNoOne: {
    ref: 'Romans 13:8',
    text: "Let no debt remain outstanding, except the continuing debt to love one another.",
  },
  borrower: {
    ref: 'Proverbs 22:7',
    text: "The rich rule over the poor, and the borrower is slave to the lender.",
  },
  treasure: {
    ref: 'Matthew 6:21',
    text: "For where your treasure is, there your heart will be also.",
  },
  covetousness: {
    ref: 'Luke 12:15',
    text: "Watch out! Be on your guard against all kinds of greed; life does not consist in an abundance of possessions.",
  },
  contentment: {
    ref: '1 Timothy 6:6-7',
    text: "But godliness with contentment is great gain. For we brought nothing into the world, and we can take nothing out of it.",
  },
  content: {
    ref: 'Hebrews 13:5',
    text: "Keep your lives free from the love of money and be content with what you have, because God has said, ‘Never will I leave you; never will I forsake you.’",
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
