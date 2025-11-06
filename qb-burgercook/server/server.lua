-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

local QBCore = exports['qb-core']:GetCoreObject()

QBCore.Functions.CreateCallback('qb-cooking:server:CheckIngredients', function(source, cb, recipeId)
    local Player = QBCore.Functions.GetPlayer(source)
    local recipe = Config.Recipes[recipeId]
    if not recipe then cb(false) return end

    for item, amount in pairs(recipe.ingredients) do
        local invItem = Player.Functions.GetItemByName(item)
        if not invItem or invItem.amount < amount then
            cb(false)
            return
        end
    end

    cb(true) 
end)

RegisterNetEvent('qb-cooking:server:DoCook', function(recipeId)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local recipe = Config.Recipes[recipeId]

    for item, amount in pairs(recipe.ingredients) do
        local invItem = Player.Functions.GetItemByName(item)
        if not invItem or invItem.amount < amount then
            TriggerClientEvent('QBCore:Notify', src, "วัตถุดิบไม่เพียงพอ!", "error")
            return
        end
    end

    for item, amount in pairs(recipe.ingredients) do
        Player.Functions.RemoveItem(item, amount)
        TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[item], "remove")
    end
        
    local received = {}

    for item, amount in pairs(recipe.result) do
        Player.Functions.AddItem(item, amount)

        if QBCore.Shared and QBCore.Shared.Items and QBCore.Shared.Items[item] then
            TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[item], "add")
        end

        local label = QBCore.Shared.Items[item] and QBCore.Shared.Items[item].label or item
        table.insert(received, string.format("%s x%d", label, amount))
    end

    if #received > 0 then
        local msg = "ได้รับ: " .. table.concat(received, ", ")
        TriggerClientEvent('QBCore:Notify', src, msg, "success")
    else
        TriggerClientEvent('QBCore:Notify', src, "⚠️ เกิดข้อผิดพลาดในการให้ไอเทม", "error")
    end
end)




