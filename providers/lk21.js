/**
 * lk21 - Layarkaca21 provider
 * Supports movies via tv.lk21official.love
 * TV shows via series.lk21.de (requires different URL structure)
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

// Constants
var BASE_URL = "https://tv10.lk21official.cc";
var SERIES_URL = "https://series.lk21.de";
var USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// HTTP helper
function makeRequest(url, options = {}) {
  return __async(this, arguments, function* (url, options = {}) {
    const defaultHeaders = __spreadValues({
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      "Connection": "keep-alive"
    }, options.headers);
    if (options.referer) {
      defaultHeaders["Referer"] = options.referer;
    }
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
      console.error(`[LK21] Request failed for ${url}: ${error.message}`);
      throw error;
    }
  });
}

// Search for content by title - try multiple approaches
function searchContent(title, year, mediaType, seasonNum, episodeNum) {
  return __async(this, null, function* () {
    console.log(`[LK21] Searching for: ${title} (${year})`);

    // TV Shows use series.lk21.de domain
    if (mediaType === 'tv') {
      return yield searchSeriesContent(title, year, seasonNum, episodeNum);
    }

    // Movies use tv10.lk21official.cc domain
    const slugVariations = [];

    // Clean title - remove special chars and common words
    let cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')  // Remove colons and other special chars
      .trim();

    // Remove "and" from title (site often omits it)
    cleanTitle = cleanTitle.replace(/\s+and\s+/g, ' ');

    // Remove common subtitles like "The Movie", etc.
    cleanTitle = cleanTitle.replace(/\s*(the|a|an)\s*(movie|series|show).*$/i, '').trim();

    // Normalize spaces and dashes
    cleanTitle = cleanTitle.replace(/\s+/g, '-').replace(/-+/g, '-');

    const typeSlug = 'movie';

    // Try variations - site uses title-year format
    slugVariations.push(`${cleanTitle}-${year}`);
    slugVariations.push(`${cleanTitle}-${typeSlug}-${year}`);
    slugVariations.push(`${cleanTitle}`);

    console.log(`[LK21] Trying slugs: ${slugVariations.join(', ')}`);

    // Try each slug directly
    const validLinks = [];
    for (const slug of slugVariations) {
      const testUrl = `${BASE_URL}/${slug}`;
      try {
        const response = yield makeRequest(testUrl);
        const finalUrl = response.url;

        // Check if we got redirected to homepage
        if (finalUrl === BASE_URL || finalUrl === BASE_URL + '/') {
          console.log(`[LK21] ${slug} redirected to homepage`);
          continue;
        }

        const html = yield response.text();

        // Check if page has player content
        if (html.includes('playeriframe') || html.includes('data-server')) {
          console.log(`[LK21] Found valid page: ${finalUrl}`);
          validLinks.push(finalUrl);
          break; // Found one, stop looking
        } else {
          console.log(`[LK21] ${slug} did not have player content`);
        }
      } catch (e) {
        console.log(`[LK21] Error checking ${slug}: ${e.message}`);
      }
    }

    console.log(`[LK21] Found ${validLinks.length} valid matches`);
    return validLinks;
  });
}

// Search for TV series content on series.lk21.de
function searchSeriesContent(title, year, seasonNum, episodeNum) {
  return __async(this, null, function* () {
    // Clean title for slug
    let cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Try series page first
    const seriesUrl = `${SERIES_URL}/${cleanTitle}-${year}`;
    console.log(`[LK21] Trying series URL: ${seriesUrl}`);

    try {
      const response = yield makeRequest(seriesUrl);
      const finalUrl = response.url;

      // Check if redirected
      if (finalUrl.includes('404') || finalUrl === SERIES_URL) {
        console.log('[LK21] Series page not found');
        return [];
      }

      const html = yield response.text();

      // Look for episode data in JSON format
      const episodeDataMatch = html.match(/\{"1":\[([^\]]+ episode[^\]]*)\]/i);
      if (episodeDataMatch && seasonNum === 1) {
        const episodesStr = episodeDataMatch[0];
        // Parse episode slug
        const episodePattern = new RegExp(`"episode_no":${episodeNum},"title":"[^"]*","slug":"([^"]+)"`, 'i');
        const epMatch = episodesStr.match(episodePattern);

        if (epMatch && epMatch[1]) {
          const episodeSlug = epMatch[1];
          const episodeUrl = `${SERIES_URL}/drama/${episodeSlug}`;
          console.log(`[LK21] Found episode URL: ${episodeUrl}`);
          return [episodeUrl];
        }
      }

      // Alternative: look for data-attributes with episode info
      const allEpisodesMatch = html.match(/\{"id":[^\}]+\}/);
      if (allEpisodesMatch) {
        console.log('[LK21] Found series data but episode parsing needs refinement');
      }

      // For now, return series page if we can't find specific episode
      return [finalUrl];
    } catch (e) {
      console.log(`[LK21] Error accessing series: ${e.message}`);
    }

    return [];
  });
}

// Extract stream data from movie/TV page
function extractStreamFromPage(contentUrl, seasonNum = null, episodeNum = null) {
  return __async(this, null, function* () {
    // Ensure proper URL format
    let fullUrl;
    if (contentUrl.startsWith('http')) {
      fullUrl = contentUrl;
    } else if (contentUrl.startsWith('/')) {
      fullUrl = `${BASE_URL}${contentUrl}`;
    } else {
      fullUrl = `${BASE_URL}/${contentUrl}`;
    }

    // Handle series.lk21.de URLs
    if (contentUrl.includes('series.lk21.de')) {
      fullUrl = contentUrl;
    }

    console.log(`[LK21] Fetching: ${fullUrl}`);

    const response = yield makeRequest(fullUrl);
    const html = yield response.text();

    // Check if we got redirected to homepage or 404
    if (html.includes('data-web_type') && !html.includes('playeriframe')) {
      console.log('[LK21] Redirected to homepage or invalid page');
      return null;
    }

    // Check for 404 page
    if (html.includes('404 - Halaman Tidak Ditemukan')) {
      console.log('[LK21] Page not found (404)');
      return null;
    }

    console.log(`[LK21] HTML length: ${html.length} characters`);

    // Check for series.lk21.de specific content
    if (contentUrl.includes('series.lk21.de')) {
      // Series domain uses different player structure
      // Look for embedded iframe or external player links
      const playerMatch = html.match(/<iframe[^>]*src="([^"]+)"[^>]*frameborder/i);
      if (playerMatch && playerMatch[1]) {
        console.log(`[LK21] Found iframe src: ${playerMatch[1]}`);
        // This would need different extraction logic based on the player
        // For now, note that series support is limited
      }

      console.log('[LK21] Series domain support is limited - trying alternate extraction');
      // Series site may use different hosting - check for common patterns
      const m3u8Match = html.match(/(https?:\/\/[^\s'"]+\.m3u8[^\s'"]*)/i);
      if (m3u8Match) {
        return { masterPlaylistUrl: m3u8Match[1] };
      }
    }

    // Extract server data
    const servers = [];

    // Find data-server attributes
    const serverMatches = html.matchAll(/data-server="([^"]+)"/g);
    for (const match of serverMatches) {
      const server = match[1];
      if (server && !servers.includes(server)) {
        servers.push(server);
      }
    }

    console.log(`[LK21] Found servers: ${servers.join(', ')}`);

    // Find iframe URLs
    const iframeUrls = [];
    const iframeMatches = html.matchAll(/https:\/\/playeriframe\.sbs\/iframe\/[^"]+/g);
    for (const match of iframeMatches) {
      const url = match[0];
      if (url && !iframeUrls.includes(url)) {
        iframeUrls.push(url);
      }
    }

    // Also check for playeriframe.php?url= pattern
    const iframePhpMatches = html.matchAll(/https:\/\/playeriframe\.sbs\/iframe\.php\?url=([^&]+)/g);
    for (const match of iframePhpMatches) {
      const encodedUrl = match[1];
      try {
        const decodedUrl = decodeURIComponent(encodedUrl);
        if (decodedUrl && !iframeUrls.includes(decodedUrl)) {
          iframeUrls.push(decodedUrl);
        }
      } catch (e) {
        console.log(`[LK21] Failed to decode URL: ${encodedUrl}`);
      }
    }

    console.log(`[LK21] Found ${iframeUrls.length} iframe URLs`);

    // Try to extract m3u8 from turbovip server
    let streamUrl = null;
    for (const iframeUrl of iframeUrls) {
      if (iframeUrl.includes('turbovip')) {
        streamUrl = yield extractM3u8FromIframe(iframeUrl);
        if (streamUrl) {
          console.log(`[LK21] Found stream URL: ${streamUrl.substring(0, 80)}...`);
          break;
        }
      }
    }

    // If turbovip didn't work, try other servers
    if (!streamUrl && iframeUrls.length > 0) {
      for (const iframeUrl of iframeUrls) {
        streamUrl = yield extractM3u8FromIframe(iframeUrl);
        if (streamUrl) {
          console.log(`[LK21] Found stream URL from alternate server: ${streamUrl.substring(0, 80)}...`);
          break;
        }
      }
    }

    if (!streamUrl) {
      console.log("[LK21] No stream URL found");
      return null;
    }

    return { masterPlaylistUrl: streamUrl };
  });
}

// Extract m3u8 from iframe page
function extractM3u8FromIframe(iframeUrl) {
  return __async(this, null, function* () {
    console.log(`[LK21] Fetching iframe: ${iframeUrl}`);

    try {
      const response = yield makeRequest(iframeUrl, { referer: BASE_URL });
      const html = yield response.text();

      // Look for emturbovid.com iframe
      const emturboMatch = html.match(/<iframe[^>]*src="https:\/\/emturbovid\.com\/t\/([^"]+)"/i);
      if (emturboMatch) {
        const videoId = emturboMatch[1];
        console.log(`[LK21] Found emturbovid ID: ${videoId}`);

        // Fetch emturbovid page
        const emturboUrl = `https://emturbovid.com/t/${videoId}`;
        const emturboResponse = yield makeRequest(emturboUrl, { referer: iframeUrl });
        const emturboHtml = yield emturboResponse.text();

        // Extract CDN URL from data-hash attribute or urlPlay variable
        const hashMatch = emturboHtml.match(/data-hash="([^"]+)"/i);
        if (hashMatch && hashMatch[1]) {
          console.log(`[LK21] Found data-hash URL: ${hashMatch[1].substring(0, 50)}...`);
          return hashMatch[1];
        }

        // Try urlPlay pattern
        const urlPlayMatch = emturboHtml.match(/var\s+urlPlay\s*=\s*['"]([^'"]+)['"]/i);
        if (urlPlayMatch && urlPlayMatch[1]) {
          console.log(`[LK21] Found urlPlay: ${urlPlayMatch[1].substring(0, 50)}...`);
          return urlPlayMatch[1];
        }
      }

      // Direct m3u8 search
      const m3u8Match = html.match(/(https?:\/\/[^'"\s]+\.m3u8[^'"\s]*)/i);
      if (m3u8Match) {
        console.log(`[LK21] Found direct m3u8: ${m3u8Match[1].substring(0, 50)}...`);
        return m3u8Match[1];
      }
    } catch (error) {
      console.log(`[LK21] Error extracting from iframe: ${error.message}`);
    }

    return null;
  });
}

// Main function to get streams
function getStreams(tmdbId, mediaType = "movie", seasonNum = null, episodeNum = null) {
  return __async(this, null, function* () {
    console.log(`[LK21] Fetching streams for TMDB ID: ${tmdbId}, Type: ${mediaType}`);

    try {
      // Get TMDB info for title and year
      const endpoint = mediaType === "tv" ? "tv" : "movie";
      const tmdbUrl = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=68e094699525b18a70bab2f86b1fa706`;
      const tmdbResponse = yield makeRequest(tmdbUrl);
      const tmdbData = yield tmdbResponse.json();

      const title = mediaType === "tv" ? tmdbData.name : tmdbData.title;
      const year = mediaType === "tv"
        ? tmdbData.first_air_date?.substring(0, 4)
        : tmdbData.release_date?.substring(0, 4);

      if (!title) {
        throw new Error("Could not extract title from TMDB response");
      }

      console.log(`[LK21] TMDB Info: "${title}" (${year})`);

      // Search for content
      const searchResults = yield searchContent(title, year, mediaType, seasonNum, episodeNum);

      if (searchResults.length === 0) {
        console.log("[LK21] No search results found");
        return [];
      }

      // Try each search result
      for (const resultUrl of searchResults) {
        console.log(`[LK21] Trying: ${resultUrl}`);
        const streamData = yield extractStreamFromPage(resultUrl, seasonNum, episodeNum);

        if (streamData && streamData.masterPlaylistUrl) {
          // Build headers with proper referer chain
          // Stream URLs come from emturbovid.com which gets referred from playeriframe.sbs
          const headers = {
            "Referer": "https://emturbovid.com/",
            "User-Agent": USER_AGENT,
            "Origin": "https://emturbovid.com"
          };

          const nuvioStreams = [{
            name: "LK21",
            title: `${title} (${year})`,
            url: streamData.masterPlaylistUrl,
            quality: "Auto",
            type: "direct",
            headers: headers
          }];

          console.log("[LK21] Successfully found stream");
          console.log(`[LK21] Stream headers: Referer=${headers.Referer}`);
          return nuvioStreams;
        }
      }

      console.log("[LK21] No working streams found");
      return [];
    } catch (error) {
      console.error(`[LK21] Error in getStreams: ${error.message}`);
      return [];
    }
  });
}

// Search for content by query string
// Note: Site uses JavaScript for search, so we browse popular/latest pages
function search(query) {
  return __async(this, null, function* () {
    console.log(`[LK21] Searching for: ${query}`);

    try {
      // Search functionality is JavaScript-based, browse popular page instead
      const popularUrl = `${BASE_URL}/populer`;
      const response = yield makeRequest(popularUrl);
      const html = yield response.text();

      const results = [];

      // Look for movie/TV links - site uses various formats
      // Match patterns like: /avatar-fire-ash-2025, /papa-zola-movie-2025
      const linkPatterns = [
        /href="\/([a-z0-9-]+-\d{4})"/gi,
        /href="https:\/\/tv10\.lk21official\.cc\/([a-z0-9-]+-\d{4})"/gi
      ];

      for (const pattern of linkPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const slug = match[1];
          // Filter out non-content pages
          if (slug &&
              !slug.includes('page') &&
              !slug.includes('search') &&
              !slug.includes('genre') &&
              !slug.includes('country') &&
              !slug.includes('year') &&
              !results.includes(slug)) {
            results.push(slug);
          }
        }
      }

      // Filter by query if provided
      let filteredResults = results;
      if (query) {
        const queryLower = query.toLowerCase().replace(/\s+/g, '-');
        // Match any part of the query
        const queryParts = queryLower.split(/[\s-]+/);
        filteredResults = results.filter(slug => {
          // Check if all query parts are in the slug
          return queryParts.every(part => slug.includes(part));
        });
      }

      console.log(`[LK21] Found ${filteredResults.length} results (from ${results.length} total)`);
      return filteredResults;
    } catch (error) {
      console.error(`[LK21] Search error: ${error.message}`);
      return [];
    }
  });
}

// Get stream by slug directly (no TMDB lookup)
function getStreamBySlug(slug) {
  return __async(this, null, function* () {
    console.log(`[LK21] Fetching stream for slug: ${slug}`);

    try {
      const contentUrl = slug.startsWith('http') ? slug : `${BASE_URL}/${slug}`;
      const streamData = yield extractStreamFromPage(contentUrl);

      if (streamData && streamData.masterPlaylistUrl) {
        const headers = {
          "Referer": "https://emturbovid.com/",
          "User-Agent": USER_AGENT,
          "Origin": "https://emturbovid.com"
        };

        // Extract title from slug
        const titleParts = slug.replace(/-\d{4}$/, '').split('-');
        const title = titleParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const yearMatch = slug.match(/(\d{4})$/);
        const year = yearMatch ? yearMatch[1] : 'Unknown';

        const nuvioStreams = [{
          name: "LK21",
          title: `${title} (${year})`,
          url: streamData.masterPlaylistUrl,
          quality: "Auto",
          type: "direct",
          headers: headers
        }];

        console.log("[LK21] Successfully found stream");
        return nuvioStreams;
      }

      console.log("[LK21] No stream data found for slug");
      return [];
    } catch (error) {
      console.error(`[LK21] Error in getStreamBySlug: ${error.message}`);
      return [];
    }
  });
}

module.exports = { getStreams, search, getStreamBySlug };
