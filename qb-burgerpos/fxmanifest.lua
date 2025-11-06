-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

fx_version 'cerulean'
game 'gta5'

author 'NUNANINA'
description 'QB Burger POS + Board (combined NUI)'
version '1.0.0'

shared_script 'config.lua'

client_scripts {
  'client/cl_cashier.lua'
}

server_script 'server/server.lua'

ui_page 'html/index-cashier.html'

files {
  'html/index-cashier.html',
  'html/script-cashier.js',
  'html/style.css',
  'html/images/*',
}

dependencies {
  'qb-core'
}
lua54 'yes'