-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

fx_version 'cerulean'
game 'gta5'

author 'NUNANINA'
description 'QBCore Cooking Script with NUI'
version '1.0.0'

shared_script 'config.lua'

server_script 'server/server.lua'
client_script 'client/cl_cooking.lua'

ui_page 'html/index.html'

files {
  'html/index.html',
  'html/script.js',
  'html/style.css',
  'html/images/*' 
}

dependencies {
  'qb-core'
}
lua54 'yes'