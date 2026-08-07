export const tournament = {
  name: "Sergeant Major Chad Miller Memorial Golf Tournament",
  shortName: "SGM Chad Miller Memorial",
  year: 2026,

  date: "October 9, 2026",

  venue: {
    name: "Hyland Golf Club",
    city: "Southern Pines",
    state: "North Carolina",
    address: "Southern Pines, North Carolina",
  },

  format: "Four-person scramble",

  beneficiary: "The Honor Foundation Fort Bragg Chapters",

  contactEmail: "chadmillermemorial@gmail.com",

  registration: {
    playerLink: "/contact",
    volunteerLink: "/contact",
    donationLink: "/contact",
  },

  food: {
    breakfast: {
      provider: "Limitless",
      description:
        "Breakfast will be provided by Limitless, a Moore County meal preparation and catering company.",
    },
    lunch: {
      provider: "Embers",
      description:
        "Lunch will be provided by Embers, a Southern Pines barbecue restaurant.",
    },
  },

  schedule: [
    { time: "6:00 AM", event: "Volunteer Arrival and Event Setup" },
    {
      time: "7:00 AM",
      event: "Registration, Breakfast, and Practice Range Open",
    },
    { time: "8:00 AM", event: "Welcome Gathering and Opening Prayer" },
    { time: "8:20 AM", event: "Players Depart for Starting Holes" },
    { time: "8:30 AM", event: "Tournament Begins" },
    { time: "12:30 PM", event: "Lunch Social and Silent Auction Begin" },
    { time: "1:30 PM", event: "Guest Speakers and Tribute to Chad" },
    {
      time: "2:00 PM",
      event:
        "Silent Auction, Hole-Prize Winners, and Low-Score Winners Announced",
    },
  ],

  dressCode: {
    title: "Appropriate Golf Attire Required",
    description:
      "Collared shirts and appropriate golf shorts, slacks, skorts, or similar golf attire are required. Jeans, T-shirts, tank tops, and non-golf athletic attire are not permitted.",
  },

  rainPolicy: {
    title: "Rain or Shine",
    paragraphs: [
      "The tournament will be played rain or shine whenever Hyland Golf Club determines that conditions allow safe play.",
      "If weather causes a delay, tournament officials will work with the golf course to resume play as soon as practical.",
      "If severe weather prevents the tournament from being completed, lunch, the silent auction, the tribute program, and awards may continue when conditions permit.",
      "Because this is a charitable fundraising event supporting The Honor Foundation Fort Bragg Chapters, registration fees and sponsorship contributions are generally non-refundable.",
      "Any schedule changes or weather-related decisions will be communicated as quickly as possible.",
    ],
  },
};