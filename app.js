const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost/3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const getAllPlayers = (responseObj) => {
  return {
    playerId: responseObj.player_id,
    playerName: responseObj.player_name,
  };
};

const getMatchDetails = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//1.RETURN LIST OF PLAYERS

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT * FROM player_details ORDER BY player_id;`;
  let dbResponse = await db.all(getAllPlayersQuery);
  response.send(dbResponse.map((eachObj) => getAllPlayers(eachObj)));
});

//2.GET SPECIFIC PLAYER

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getAPlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(getAPlayerQuery);
  response.send(getAllPlayers(dbResponse));
});

//3.UPDATE PLAYER DETAILS

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDetailsQuery = `
    UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(updateDetailsQuery);
  response.send("Player Details Updated");
});

//4.GET MATCH DETAILS

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id =${matchId};`;
  const dbResponse = await db.get(matchDetailsQuery);
  response.send(getMatchDetails(dbResponse));
});

//5.GET MATCHES OF A PLAYER

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const specificMatchQuery = `
        SELECT * FROM match_details INNER JOIN player_match_score 
    ON match_details.match_id = player_match_score.match_id WHERE player_match_score.player_id = ${playerId};`;
  const dbResponse = await db.all(specificMatchQuery);
  response.send(dbResponse.map((eachObj) => getMatchDetails(eachObj)));
});

//6.GET PLAYERS IN A MATCH

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersInMatchQuery = `
      SELECT * FROM player_details INNER JOIN player_match_score 
      ON player_details.player_id = player_match_score.player_id WHERE match_id = ${matchId};`;
  const dbResponse = await db.all(playersInMatchQuery);
  response.send(dbResponse.map((eachObj) => getAllPlayers(eachObj)));
});

//7.GET STATISTICS OF A PLAYER

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerStatisticsQuery = `
    SELECT player_details.player_id as playerId, player_details.player_name as playerName, sum(player_match_score.score) as totalScore, sum(player_match_score.fours) as totalFours, sum(player_match_score.sixes) as totalSixes FROM player_match_score INNER JOIN player_details 
    ON player_match_score.player_id = player_details.player_id
    WHERE player_details.player_id = ${playerId};`;
  const dbResponse = await db.get(playerStatisticsQuery);
  response.send(dbResponse);
});

module.exports = app;
