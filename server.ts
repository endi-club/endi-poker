import express from "express";
import { Game, games } from "./tables";
import Poker from "poker-ts";
import bodyParser from "body-parser";

const app = express();
const jsonParser = bodyParser.json();

app.get("/game/:id", (req, res) => {
  res.json(games[req.params.id] || { error: "Game not found" });
});

/**
 * Create a new game
 * Takes in:
 * - players and their chairs + chips
 *
 * Does:
 * - Create a new game
 * - Start first hand
 * - Return game object
 */
app.post("/game/:id", jsonParser, (req, res) => {
  const table = new Poker.Table({ smallBlind: 5, bigBlind: 10 }, 6);
  console.log(req.body);
  if (!req.body?.players) {
    res.json({ error: "No players provided" }).status(400);
    return;
  }
  for (const player of req.body.players) {
    table.sitDown(player.chair, player.chips);
  }

  try {
    table.startHand();
    games[req.params.id] = { id: req.params.id, table };
    res.json(makeResponse(games[req.params.id]));
  } catch (e) {
    res.json({ error: e.message }).status(400);
    return;
  }
});

app.post("/game/:id/action", jsonParser, (req, res) => {
  const game = games[req.params.id];
  if (!game) {
    res.json({ error: "Game not found" }).status(404);
    return;
  }

  const table = game.table;
  if (!table.isBettingRoundInProgress()) {
    table.endBettingRound(); // deal cards, etc
    res.json(makeResponse(game));
    return;
  }

  table.actionTaken(req.body.action, req.body.betSize);

  if (!table.isBettingRoundInProgress()) {
    table.endBettingRound();
  }

  console.log(table.areBettingRoundsCompleted(), table.isHandInProgress());

  if (table.areBettingRoundsCompleted()) {
    console.log("Showdown! ", req.params.id);
    table.showdown();
  }
  
  res.json(makeResponse(game));
});

function makeResponse(game: Game) {
  const resp: any = game;
  try {
    resp.currentPlayer = game.table.playerToAct();
    resp.legalActions = game.table.legalActions();
    resp.isRoundInProgress = game.table.isBettingRoundInProgress();
  } catch (e) {
    resp.currentPlayer = 0;
    resp.legalActions = { _actions: [], _chipRange: { min: 0, max: 0 } };
    resp.isRoundInProgress = false;
  }
  return resp;
}

app.listen(8080, () => {});
