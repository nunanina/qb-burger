-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

local QBCore = exports['qb-core']:GetCoreObject()

RegisterNetEvent('qb-shop:server:PayCart', function(cart)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then
        return
    end

    if type(cart) ~= "table" or #cart == 0 then
        TriggerClientEvent('QBCore:Notify', src, "ไม่มีสินค้าในตะกร้า", "error")
        return
    end

    local total = 0
    local toGive = {}

    for _, item in ipairs(cart) do
        if not item or not item.key then goto continue end
        local key = tostring(item.key)
        local amount = tonumber(item.amount) or 0
        if amount <= 0 then goto continue end

        local conf = Config.ShopItems[key]
        if not conf or not conf.buy then goto continue end

        local price = tonumber(conf.price) or 0
        total = total + (price * amount)
        table.insert(toGive, { key = key, label = conf.label or key, amount = amount })
        ::continue::
    end

    if total <= 0 or #toGive == 0 then
        TriggerClientEvent('QBCore:Notify', src, "ไม่มีสินค้าที่สามารถซื้อได้", "error")
        return
    end

    local hasMoney = Player.Functions.GetMoney('cash') or 0
    if hasMoney < total then
        TriggerClientEvent('QBCore:Notify', src, Config.Texts.not_enough_money or "เงินของคุณไม่เพียงพอ", "error")
        return
    end

    local removed = Player.Functions.RemoveMoney('cash', total, "shop-purchase")
    if not removed then
        TriggerClientEvent('QBCore:Notify', src, "เกิดข้อผิดพลาดในการหักเงิน", "error")
        return
    end

    local given = {}
    local failed = false
    for _, it in ipairs(toGive) do
        local ok, ret = pcall(function()
            return Player.Functions.AddItem(it.key, it.amount)
        end)

        if not ok or not (ret == true or ret == nil) then
            failed = true
            break
        end

        table.insert(given, it)
        local itemDef = QBCore.Shared.Items[it.key]
        if itemDef then
            TriggerClientEvent('inventory:client:ItemBox', src, itemDef, "add", it.amount)
        else
            TriggerClientEvent('QBCore:Notify', src, ("ได้รับ %s x%d"):format(it.label or it.key, it.amount), "success")
        end
    end

    if failed then
        Player.Functions.AddMoney('cash', total, "shop-purchase-refund")
        TriggerClientEvent('QBCore:Notify', src, Config.Texts.purchase_failed or "ซื้อไม่สำเร็จ (คืนเงินแล้ว)", "error")
        return
    end

    if #given > 0 then
        local parts = {}
        for _, g in ipairs(given) do
            table.insert(parts, ("%s x%d"):format(g.label or g.key, g.amount))
        end
        local msg = ("%s: %s"):format(Config.Texts.purchase_success or "ซื้อสำเร็จ", table.concat(parts, ", "))
        TriggerClientEvent('QBCore:Notify', src, msg, "success")
    else
        Player.Functions.AddMoney('cash', total, "shop-purchase-refund")
        TriggerClientEvent('QBCore:Notify', src, Config.Texts.purchase_failed or "ซื้อไม่สำเร็จ (คืนเงินแล้ว)", "error")
    end
end)
