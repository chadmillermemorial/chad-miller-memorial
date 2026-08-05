import { tournament } from "./tournament";

export const siteConfig = {
  name: tournament.name,

  description:
    "Honoring Sergeant Major Chad Miller through a memorial golf tournament supporting The Honor Foundation Fort Bragg Chapters.",

  location: {
    venue: tournament.venue.name,
    city: tournament.venue.city,
    state: tournament.venue.state,
  },

  navigation: [
    {
      href: "/",
      label: "Home",
    },
    {
      href: "/about",
      label: "About",
    },
    {
      href: "/tournament",
      label: "Tournament",
    },
    {
      href: "/sponsors",
      label: "Sponsors",
    },
    {
      href: "/register",
      label: "Get Involved",
    },
    {
      href: "/contact",
      label: "Contact",
    },
  ],

  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },
};