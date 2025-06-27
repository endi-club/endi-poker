import Poker from "poker-ts/dist/facade/poker";

export type Game = {
  id: string;
  table: Poker;
};

export const games: Record<string, Game> = {};
