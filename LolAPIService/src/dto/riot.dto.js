// Riot API 응답 데이터 구조 정의 (JavaScript 버전)

// 소환사 정보
class SummonerInfo {
  constructor(puuid, gameName, tagLine) {
    this.puuid = puuid;
    this.gameName = gameName;
    this.tagLine = tagLine;
  }
}

// 매치 정보
class MatchInfo {
  constructor(metadata, info) {
    this.metadata = metadata;
    this.info = info;
  }
}

// 플레이어 통계
class PlayerStats {
  constructor(kills, deaths, assists, kda, championName, win, totalDamageDealtToChampions, goldEarned, totalMinionsKilled, visionScore) {
    this.kills = kills;
    this.deaths = deaths;
    this.assists = assists;
    this.kda = kda;
    this.championName = championName;
    this.win = win;
    this.totalDamageDealtToChampions = totalDamageDealtToChampions;
    this.goldEarned = goldEarned;
    this.totalMinionsKilled = totalMinionsKilled;
    this.visionScore = visionScore;
  }
}

// 매치 히스토리 아이템
class MatchHistoryItem {
  constructor(matchId, gameStartTimestamp, gameDuration, queueId, kills, deaths, assists, kda, championName, win, totalDamageDealtToChampions, goldEarned, totalMinionsKilled, visionScore) {
    this.matchId = matchId;
    this.gameStartTimestamp = gameStartTimestamp;
    this.gameDuration = gameDuration;
    this.queueId = queueId;
    this.kills = kills;
    this.deaths = deaths;
    this.assists = assists;
    this.kda = kda;
    this.championName = championName;
    this.win = win;
    this.totalDamageDealtToChampions = totalDamageDealtToChampions;
    this.goldEarned = goldEarned;
    this.totalMinionsKilled = totalMinionsKilled;
    this.visionScore = visionScore;
  }
}

// 요청 DTO들
class GetPlayerMatchHistoryDto {
  constructor(summonerName, tag, count = 10) {
    this.summonerName = summonerName;
    this.tag = tag;
    this.count = count;
  }
}

class GetLatestMatchDto {
  constructor(summonerName, tag) {
    this.summonerName = summonerName;
    this.tag = tag;
  }
}

class GetMatchDetailDto {
  constructor(matchId) {
    this.matchId = matchId;
  }
}

// 응답 DTO들
class SummonerPuuidResponse {
  constructor(summonerName, tag, puuid) {
    this.summonerName = summonerName;
    this.tag = tag;
    this.puuid = puuid;
  }
}

class MatchHistoryResponse {
  constructor(summonerName, tag, matches, totalCount) {
    this.summonerName = summonerName;
    this.tag = tag;
    this.matches = matches;
    this.totalCount = totalCount;
  }
}

class MatchIdsResponse {
  constructor(puuid, count, matchIds) {
    this.puuid = puuid;
    this.count = count;
    this.matchIds = matchIds;
  }
}

class ErrorResponse {
  constructor(error, details = null) {
    this.error = error;
    if (details) {
      this.details = details;
    }
  }
}

module.exports = {
  SummonerInfo,
  MatchInfo,
  PlayerStats,
  MatchHistoryItem,
  GetPlayerMatchHistoryDto,
  GetLatestMatchDto,
  GetMatchDetailDto,
  SummonerPuuidResponse,
  MatchHistoryResponse,
  MatchIdsResponse,
  ErrorResponse
};
