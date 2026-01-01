#!/bin/bash
# Script pour appliquer les modifications de manière atomique

cd "C:/Users/cyril/snake mobile"

# 1. Ajouter les CSS links après rules.css
sed -i 's|<link rel="stylesheet" href="/rules.css">|<link rel="stylesheet" href="/rules.css">\n    <link rel="stylesheet" href="/css/carousel.css">\n    <link rel="stylesheet" href="/css/box-boosters.css">|' www/index.html

# 2. Cacher les boosters du hub (ajouter hidden class)
sed -i 's|<div class="hub-boosters-row" id="hub-boosters">|<div class="hub-boosters-row hidden" id="hub-boosters" style="display:none;">|' www/index.html

# 3. Ajouter l'onglet Boosters après backgrounds dans les box-tabs
sed -i 's|<span class="tab-count" id="tab-count-backgrounds">(0)</span>\n                </button>\n            </div>|<span class="tab-count" id="tab-count-backgrounds">(0)</span>\n                </button>\n                <button class="box-tab" data-category="boosters" onclick="filterBoxItems('"'"'boosters'"'"')">\n                    <span class="tab-icon">⚗️</span>\n                    <span class="tab-label">Boosters</span>\n                </button>\n            </div>|' www/index.html

echo "Changes applied!"
