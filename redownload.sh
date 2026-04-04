#!/bin/bash
cd /tmp/nuvio-repos/providers

echo "Downloading from phisher98..."
curl -sL "https://raw.githubusercontent.com/phisher98/phisher-nuvio-providers/main/providers/MoviesDrive.js" -o moviesdrive.js
curl -sL "https://raw.githubusercontent.com/phisher98/phisher-nuvio-providers/main/providers/HiAnime.js" -o hianime.js
curl -sL "https://raw.githubusercontent.com/phisher98/phisher-nuvio-providers/main/providers/XDMovies.js" -o xdmovies.js

echo "Downloading from Abinanthankv..."
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/animelok.js" -o animelok.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/dramafull.js" -o dramafull.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/isaidub.js" -o isaidub.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/movies4u.js" -o movies4u.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/moviesda.js" -o moviesda.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/tamilblasters.js" -o tamilblasters.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/tamilian.js" -o tamilian.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/tamilmv.js" -o tamilmv.js
curl -sL "https://raw.githubusercontent.com/Abinanthankv/NuvioRepo/master/src/providers/toonhub.js" -o toonhub.js

echo "Downloading from saimuelbr..."
curl -sL "https://raw.githubusercontent.com/saimuelbr/saimuel-nuvio-repo/main/providers/fembed.js" -o fembed.js
curl -sL "https://raw.githubusercontent.com/saimuelbr/saimuel-nuvio-repo/main/providers/fshd.js" -o fshd.js

echo "Re-download complete!"
ls -la *.js | wc -l
