-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

local QBCore = exports['qb-core']:GetCoreObject()
local Orders = {}
local OrderCounter = 0

local function GetXPlayerBySource(src)
    if not src then return nil end
    local ok, xPlayer = pcall(function() return QBCore.Functions.GetPlayer(src) end)
    if ok and xPlayer then return xPlayer end
    if QBCore.GetPlayer then
        local ok2, xp2 = pcall(function() return QBCore.GetPlayer(src) end)
        if ok2 and xp2 then return xp2 end
    end
    return nil
end

local function RemoveItemFromPlayer(xPlayer, itemName, amount)
    if not xPlayer or not itemName then return false end
    amount = tonumber(amount) or 1

    if xPlayer.Functions and xPlayer.Functions.RemoveItem then
        local ok, _ = pcall(function() xPlayer.Functions.RemoveItem(itemName, amount) end)
        if not ok then return false end
        return true
    end

    if xPlayer.removeItem then
        local ok, _ = pcall(function() xPlayer.removeItem(itemName, amount) end)
        if not ok then return false end
        return true
    end

    return false
end

local function GiveProductsToPlayer(xPlayer, products)
    if not xPlayer or not products then return false end

    if type(products) == "string" then
        if xPlayer.Functions and xPlayer.Functions.AddItem then
            xPlayer.Functions.AddItem(products, 1)
            return true
        elseif xPlayer.addItem then
            xPlayer.addItem(products, 1)
            return true
        end
        return false
    end

    if type(products) == "table" then
        local isMap = false
        for k,v in pairs(products) do
            if type(k) == "string" and (type(v) == "number" or tonumber(v)) then
                isMap = true
                break
            end
        end

        if isMap then
            for item,amt in pairs(products) do
                local num = tonumber(amt) or 1
                if xPlayer.Functions and xPlayer.Functions.AddItem then
                    xPlayer.Functions.AddItem(item, num)
                elseif xPlayer.addItem then
                    xPlayer.addItem(item, num)
                end
            end
            return true
        end

        for _, entry in ipairs(products) do
            if type(entry) == "table" then
                local it = entry.item or entry.name
                local am = tonumber(entry.amount or entry.count or 1) or 1
                if it then
                    if xPlayer.Functions and xPlayer.Functions.AddItem then
                        xPlayer.Functions.AddItem(it, am)
                    elseif xPlayer.addItem then
                        xPlayer.addItem(it, am)
                    end
                end
            end
        end
        return true
    end

    return false
end

local function BroadcastOrder(order)
    TriggerClientEvent('qb-burgerpos:client:ReceiveOrder', -1, order)
end
local function BroadcastStatus(orderId, status, extra)
    TriggerClientEvent('qb-burgerpos:client:OrderStatusUpdate', -1, { orderId = orderId, status = status, extra = extra })
end

RegisterNetEvent('qb-burgerpos:server:NewOrder', function(payload)
    local src = source
    if not payload or type(payload) ~= 'table' then return end

    OrderCounter = OrderCounter + 1
    local orderId = "order_" .. OrderCounter
    local timeNow = os.time()

    local orderData = {
        id       = orderId,
        number   = OrderCounter,
        cart     = payload.cart or {},
        sender   = payload.sender or GetPlayerName(src),
        clientId = payload.clientId or nil,
        status   = "waiting",
        time     = timeNow
    }

    Orders[orderId] = orderData
    BroadcastOrder(orderData)
end)

local function NormalizeOrderInput(arg)
    if not arg then return nil end
    if type(arg) == "string" then return { orderId = arg } end
    if type(arg) == "table" then
        if arg.orderId or arg.id then
            return { orderId = arg.orderId or arg.id, cart = arg.cart or arg.cartItems or arg.items }
        end
        if arg.cart == nil and (#arg > 0) then
            return { orderId = nil, cart = arg }
        end
        return { orderId = nil, cart = arg.cart }
    end
    return nil
end

RegisterNetEvent('qb-burgerpos:server:CompleteOrder', function(arg)
    local src = source
    local payload = NormalizeOrderInput(arg)
    if not payload then
        TriggerClientEvent('QBCore:Notify', src, "ข้อมูลออเดอร์ไม่ถูกต้อง", "error")
        return
    end

    local xPlayer = GetXPlayerBySource(src)
    if not xPlayer then
        TriggerClientEvent('QBCore:Notify', src, "ไม่พบผู้เล่น", "error")
        return
    end

    local order = nil
    if payload.orderId then
        order = Orders[payload.orderId]
    end
    if not order and payload.cart and type(payload.cart) == 'table' and #payload.cart > 0 then
        order = {
            id = payload.orderId or ("local_order_" .. tostring(os.time())),
            cart = payload.cart,
            sender = GetPlayerName(src),
            status = 'local'
        }
        Orders[order.id] = order
    end

    if not order then
        TriggerClientEvent('QBCore:Notify', src, "ไม่พบออเดอร์นี้", "error")
        return
    end

    for _, cartItem in ipairs(order.cart or {}) do
        local itemKey = cartItem.name or cartItem.id or cartItem.key or cartItem.item
        local qty = tonumber(cartItem.amount or cartItem.quantity or cartItem.count or cartItem.qty) or 1

        if itemKey then
            local success = RemoveItemFromPlayer(xPlayer, itemKey, qty)
            if not success then
                TriggerClientEvent('QBCore:Notify', src, ("ไม่พบหรือหักของไม่สำเร็จ: %s x%d"):format(tostring(itemKey), qty), "error")
            end
        end
    end

    order.status = "completed"
    order.completedBy = src
    order.completedAt = os.time()
    Orders[order.id] = order

    BroadcastStatus(order.id, order.status)
    TriggerClientEvent('QBCore:Notify', src, "สั่งงาน: เสร็จสิ้นแล้ว (พยายามหักของจากคุณ)", "success")
end)

RegisterNetEvent('qb-burgerpos:server:DeliverOrder', function(arg)
    local src = source
    local payload = NormalizeOrderInput(arg)
    if not payload then
        TriggerClientEvent('QBCore:Notify', src, "ข้อมูลการรับของไม่ถูกต้อง", "error")
        return
    end

    local xPlayer = GetXPlayerBySource(src)
    if not xPlayer then
        TriggerClientEvent('QBCore:Notify', src, "ไม่พบผู้เล่น", "error")
        return
    end

    local order = nil
    if payload.orderId then
        order = Orders[payload.orderId]
    end

    if not order then
        TriggerClientEvent('QBCore:Notify', src, "ไม่พบออเดอร์นี้", "error")
        return
    end

    for _, cartItem in ipairs(order.cart or {}) do
        local itemKey = cartItem.name or cartItem.id or cartItem.key or cartItem.item
        local qty = tonumber(cartItem.amount or cartItem.quantity or cartItem.count or cartItem.qty) or 1

        if itemKey then
            local recipe = nil
            if Config and Config.Recipes and Config.Recipes[itemKey] then
                recipe = Config.Recipes[itemKey]
            elseif Config and Config.OrderItems and Config.OrderItems[itemKey] then
                recipe = Config.OrderItems[itemKey]
            end

            if recipe and recipe.products then
                GiveProductsToPlayer(xPlayer, recipe.products)
            else
                local giveMap = {}
                giveMap[itemKey] = qty
                local ok = GiveProductsToPlayer(xPlayer, giveMap)
                if not ok then
                    TriggerClientEvent('QBCore:Notify', src, ("ไม่สามารถมอบของ: %s x%d"):format(tostring(itemKey), qty), "error")
                end
            end
        end
    end

    order.status = "delivered"
    order.deliveredBy = src
    order.deliveredAt = os.time()
    Orders[order.id] = order

    BroadcastStatus(order.id, order.status)
    TriggerClientEvent('QBCore:Notify', src, "คุณได้รับออเดอร์แล้ว", "success")
end)

QBCore.Functions.CreateCallback('qb-burgerpos:server:GetOrders', function(source, cb)
    cb(Orders)
end)
