/**
 * vidsrc - Built from src/vidsrc/
 * Generated: 2026-04-04T00:00:00.000Z
 */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/vidsrc/constants.js
var TMDB_API_KEY = "68e094699525b18a70bab2f86b1fa706";
var EMBED_BASE = "https://www.2embed.cc";
var USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// src/vidsrc/http.js
function makeRequest(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const defaultHeaders = __spreadValues({
      "User-Agent": USER_AGENT,
      "Accept": "application/json,*/*",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      "Connection": "keep-alive",
      "Referer": EMBED_BASE
    }, options.headers);
    try {
      const response = yield fetch(url, __spreadValues({
        method: options.method || "GET",
        headers: defaultHeaders
      }, options));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      console.error(`[Vidsrc] Request failed for ${url}: ${error.message}`);
      throw error;
    }
  });
}

// src/vidsrc/tmdb.js
function getTmdbInfo(tmdbId, mediaType) {
  return __async(this, null, function* () {
    var _a, _b;
    const endpoint = mediaType === "tv" ? "tv" : "movie";
    const url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const response = yield makeRequest(url);
    const data = yield response.json();
    const title = mediaType === "tv" ? data.name : data.title;
    const year = mediaType === "tv" ? (_a = data.first_air_date) == null ? void 0 : _a.substring(0, 4) : (_b = data.release_date) == null ? void 0 : _b.substring(0, 4);
    if (!title) {
      throw new Error("Could not extract title from TMDB response");
    }
    console.log(`[Vidsrc] TMDB Info: "${title}" (${year})`);
    return { title, year, data };
  });
}

// src/vidsrc/extractor.js
function extractStreamFromPage(contentType, contentId, seasonNum, episodeNum) {
  return __async(this, null, function* () {
    let embedUrl;
    if (contentType === "movie") {
      embedUrl = `${EMBED_BASE}/embed/${contentId}`;
    } else {
      embedUrl = `${EMBED_BASE}/embed/${contentType}/${contentId}/${seasonNum}/${episodeNum}`;
    }
    console.log(`[Vidsrc] Fetching: ${embedUrl}`);
    const response = yield makeRequest(embedUrl);
    const html = yield response.text();
    console.log(`[Vidsrc] HTML length: ${html.length} characters`);
    let masterPlaylistUrl = null;
    const dataSrcMatch = html.match(/data-src=["']([^"']+)["']/i);
    if (dataSrcMatch) {
      masterPlaylistUrl = dataSrcMatch[1];
      console.log("[Vidsrc] Found data-src URL:", masterPlaylistUrl);
    }
    if (!masterPlaylistUrl) {
      const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
      if (iframeMatch) {
        masterPlaylistUrl = iframeMatch[1];
        console.log("[Vidsrc] Found iframe src:", masterPlaylistUrl);
      }
    }
    if (!masterPlaylistUrl || masterPlaylistUrl === "about:blank") {
      const locationMatch = html.match(/window\.location\s*=\s*["']([^"']+)["']/i);
      if (locationMatch) {
        masterPlaylistUrl = locationMatch[1];
        console.log("[Vidsrc] Found window.location:", masterPlaylistUrl);
      }
    }
    if (!masterPlaylistUrl) {
      const scriptMatches = html.match(new RegExp("<script[^>]*>(.*?)<\\/script>", "gs"));
      if (scriptMatches) {
        for (const script of scriptMatches) {
          if (script.includes("go(")) {
            const goMatch = script.match(/go\(["']([^"']+)["']\)/i);
            if (goMatch) {
              masterPlaylistUrl = goMatch[1];
              console.log("[Vidsrc] Found go() URL:", masterPlaylistUrl);
              break;
            }
          }
          const videoMatch = script.match(/["']?(https?:\/\/[^"'`\s]+\.(?:m3u8|mp4)[^"'`\s]*)/i);
          if (videoMatch) {
            masterPlaylistUrl = videoMatch[1];
            console.log("[Vidsrc] Found video URL in script:", masterPlaylistUrl);
            break;
          }
        }
      }
    }
    if (!masterPlaylistUrl) {
      console.log("[Vidsrc] No master playlist URL found");
      return null;
    }
    if (!masterPlaylistUrl.startsWith("http")) {
      if (masterPlaylistUrl.startsWith("//")) {
        masterPlaylistUrl = "https:" + masterPlaylistUrl;
      } else if (masterPlaylistUrl.startsWith("/")) {
        masterPlaylistUrl = EMBED_BASE + masterPlaylistUrl;
      }
    }
    console.log(`[Vidsrc] Final URL: ${masterPlaylistUrl}`);
    return { masterPlaylistUrl };
  });
}

// src/vidsrc/index.js
function getStreams(tmdbId, mediaType = "movie", seasonNum = null, episodeNum = null) {
  return __async(this, null, function* () {
    console.log(`[Vidsrc] Fetching streams for TMDB ID: ${tmdbId}, Type: ${mediaType}`);
    try {
      const tmdbInfo = yield getTmdbInfo(tmdbId, mediaType);
      const { title, year } = tmdbInfo;
      console.log(`[Vidsrc] Title: "${title}" (${year})`);
      const streamData = yield extractStreamFromPage(mediaType, tmdbId, seasonNum, episodeNum);
      if (!streamData) {
        console.log("[Vidsrc] No stream data found");
        return [];
      }
      const { masterPlaylistUrl } = streamData;
      const nuvioStreams = [{
        name: "Vidsrc",
        title: "Auto Quality Stream",
        url: masterPlaylistUrl,
        quality: "Auto",
        type: "direct",
        headers: {
          "Referer": EMBED_BASE,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      }];
      console.log("[Vidsrc] Successfully processed 1 stream with Auto quality");
      return nuvioStreams;
    } catch (error) {
      console.error(`[Vidsrc] Error in getStreams: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
