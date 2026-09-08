import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("homepage hero shows the tournament date with location", () => {
  const hero = source("components/home/Hero.tsx");

  assert.match(hero, /tournament\.date/);
  assert.match(hero, /tournament\.venue\.city/);
  assert.match(hero, /tournament\.venue\.state/);
});

test("homepage tournament preview shows the tournament date", () => {
  const preview = source("components/home/TournamentPreview.tsx");

  assert.match(preview, /tournament\.date/);
});

test("join us page shows the tournament date and venue", () => {
  const register = source("app/register/page.tsx");

  assert.match(register, /tournament\.date/);
  assert.match(register, /tournament\.venue\.name/);
});

test("global footer shows the tournament date above event location", () => {
  const footer = source("components/Footer.tsx");

  assert.match(footer, /tournament\.date/);
  assert.match(footer, /tournament\.venue\.name/);
  assert.match(footer, /tournament\.venue\.city/);
});
