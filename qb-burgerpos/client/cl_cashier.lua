-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

local QBCore = exports['qb-core']:GetCoreObject()
local isCashierOpen = false
local PlayerJob = nil
local Points = {}

------------------------------------------------------------------------------------------------
--setjob--
------------------------------------------------------------------------------------------------
CreateThread(function()
    Wait(1000)
    local pdata = QBCore.Functions.GetPlayerData()
    if pdata and pdata.job and pdata.job.name then PlayerJob = pdata.job.name end
end)

RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job) PlayerJob = job.name end)
RegisterNetEvent('QBCore:Player:SetPlayerData', function(pdata)
    if pdata and pdata.job and pdata.job.name then PlayerJob = pdata.job.name end
end)

local function BuildJobAllowList()
    local t = {}
    if type(Config.AllowedJobs) == "table" then
        for k,v in pairs(Config.AllowedJobs) do
            if type(k) == "number" then t[v] = true else t[k] = true end
        end
    end
    return t
end
local AllowedJobs = BuildJobAllowList()

local function IsAllowedJob()
    if Config.AllowAll then return true end
    if not PlayerJob then
        local pdata = QBCore.Functions.GetPlayerData()
        if pdata and pdata.job and pdata.job.name then PlayerJob = pdata.job.name end
    end
    if not PlayerJob then return false end
    return AllowedJobs[PlayerJob] == true
end

------------------------------------------------------------------------------------------------
--buildpoints--
------------------------------------------------------------------------------------------------
local function Vec(p)
    if not p then return nil end
    local t = type(p)
    if t == "vector3" or t == "vector4" then return p end
    if t == "userdata" then
        if p.x and p.y and p.z then return vector3(p.x,p.y,p.z) end
    end
    if t == "table" then
        if p.x and p.y and p.z then return vector3(p.x,p.y,p.z) end
        if p[1] and p[2] and p[3] then return vector3(p[1],p[2],p[3]) end
    end
    return nil
end

local function BuildPoints()
    Points = {}
    local function tryAdd(p, typ)
        local v = Vec(p)
        if v then table.insert(Points, { pos = v, typ = typ or "cashier" }) end
    end

    if Config.CashierPoints then
        for _, v in ipairs(Config.CashierPoints) do tryAdd(v, "cashier") end
    end
    if Config.BoardPoints then
        for _, v in ipairs(Config.BoardPoints) do tryAdd(v, "board") end
    end
end

BuildPoints()

------------------------------------------------------------------------------------------------
--Open-Close UI--
------------------------------------------------------------------------------------------------
local function OpenCashierUI(mode)
    if isCashierOpen then return end
    local items = {}

    local function getImageFromShared(id)
        local ok, entry = pcall(function() return QBCore and QBCore.Shared and QBCore.Shared.Items and QBCore.Shared.Items[id] end)
        if not ok or not entry then return nil end
        if entry.image and tostring(entry.image) ~= "" then return entry.image end
        if entry.thumbnail and tostring(entry.thumbnail) ~= "" then return entry.thumbnail end
        if entry.icon and tostring(entry.icon) ~= "" then return entry.icon end
        return nil
    end

    if type(Config.OrderItems) == 'table' then
        for k,v in pairs(Config.OrderItems) do
            local id = v.name or v.id or k
            local img = nil
            if v.images and tostring(v.images) ~= "" then
                img = v.images
            end

            if not img then
                local sharedImg = getImageFromShared(id)
                if sharedImg and tostring(sharedImg) ~= "" then
                    img = sharedImg
                end
            end

            local localPath = ('images/items/%s.png'):format(id)

            items[#items+1] = {
                key = id,
                id = id,
                label = v.label or id,
                price = v.price or 0,
                category = v.category or 'other',
                images = img,        
                localImage = localPath,
                raw = v
            }
        end
    end

    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "open",
        mode = mode, -- 'cashier' หรือ 'board'
        showBoard = (mode == "cashier" or mode == "board"),
        items = items,
        categories = Config.Categories or {}
    })
    isCashierOpen = true
end

local function CloseCashierUI()
    if not isCashierOpen then return end
    SetNuiFocus(false, false)
    SendNUIMessage({ action = "close" })
    isCashierOpen = false
end

------------------------------------------------------------------------------------------------
--Open-Close UI--
------------------------------------------------------------------------------------------------
RegisterNUICallback('close', function(_, cb)
    CloseCashierUI()
    cb({ ok = true })
end)

RegisterNUICallback('sendOrder', function(data, cb)
    if not data or not data.cart or #data.cart == 0 then cb({ ok = false }); return end
    local pd = QBCore.Functions.GetPlayerData()
    local defaultSender = ((pd and pd.charinfo and pd.charinfo.firstname) or "") .. " " .. ((pd and pd.charinfo and pd.charinfo.lastname) or "")
    local sender = (data.sender and tostring(data.sender) ~= "" ) and data.sender or defaultSender

    local payload = {
        sender = sender,
        cart = data.cart,
        time = math.floor(GetGameTimer() / 1000),
        clientId = data.clientId or nil
    }

    TriggerServerEvent('qb-burgerpos:server:NewOrder', payload)
    cb({ ok = true })
end)

RegisterNUICallback('orderComplete', function(data, cb)
    if not data or not data.orderId then cb({ ok = false }); return end
    TriggerServerEvent('qb-burgerpos:server:CompleteOrder', {
        orderId = data.orderId,
        cart = data.cart or nil,
        clientId = data.clientId or nil
    })
    cb({ ok = true })
end)

RegisterNUICallback('orderDeliver', function(data, cb)
    if not data or not data.orderId then cb({ ok = false }); return end
    TriggerServerEvent('qb-burgerpos:server:DeliverOrder', data.orderId)
    cb({ ok = true })
end)

RegisterNUICallback('orderDelete', function(data, cb)
    if not data or not data.orderId then cb({ ok = false }); return end
    TriggerServerEvent('qb-burgerpos:server:DeleteOrder', data.orderId)
    cb({ ok = true })
end)

RegisterNetEvent('qb-burgerpos:client:ReceiveOrder', function(order)
    SendNUIMessage({ action = 'newOrder', order = order })
end)

RegisterNetEvent('qb-burgerpos:client:OrderStatusUpdate', function(data)
    SendNUIMessage({ action = 'orderStatusUpdate', orderId = data.orderId, status = data.status })
end)

RegisterNetEvent('qb-burgerpos:client:Notify', function(_, msg, t)
    QBCore.Functions.Notify(msg or "Message", t or "info")
end)

------------------------------------------------------------------------------------------------
-- proximity logic
------------------------------------------------------------------------------------------------
CreateThread(function()
    local sleep = 1000
    while true do
        local ped = PlayerPedId()
        local pos = GetEntityCoords(ped)

        local nearestCashier, distCashier = nil, 9999
        local nearestBoard, distBoard = nil, 9999

        for _, entry in ipairs(Points) do
            local p = entry.pos
            local dist = #(pos - p)
            if entry.typ == 'cashier' and dist < distCashier then
                distCashier = dist
                nearestCashier = entry
            elseif entry.typ == 'board' and dist < distBoard then
                distBoard = dist
                nearestBoard = entry
            end
        end

        local nearestDist = math.min(distCashier or 9999, distBoard or 9999)

        local nearestType = nil
        local nearestPoint = nil
        local showDist = 2.0

        if distCashier < distBoard then
            nearestType = 'cashier'
            nearestPoint = nearestCashier and nearestCashier.pos
        else
            nearestType = 'board'
            nearestPoint = nearestBoard and nearestBoard.pos
        end

        if nearestPoint and ((nearestType == 'cashier' and distCashier < showDist) or (nearestType == 'board' and distBoard < showDist)) and IsAllowedJob() then
            sleep = 5
            -- DrawText3D(nearestPoint.x, nearestPoint.y, nearestPoint.z + 0.25, nearestType == 'cashier' and "[~g~E~w~] เปิดแคชเชียร์" or "[~g~E~w~] เปิดบอร์ดออเดอร์")
            if IsControlJustReleased(0, 38) then
                if nearestType == 'cashier' then
                    OpenCashierUI('cashier')
                else
                    OpenCashierUI('board')
                end
            end
        else
            if nearestDist < 3.0 then sleep = 250 else sleep = 1000 end
        end

        if isCashierOpen and IsControlJustReleased(0, 200) then
            CloseCashierUI()
        end

        Wait(sleep)
    end
end)

------------------------------------------------------------------------------------------------
--DrawText--
------------------------------------------------------------------------------------------------
function DrawText3D(x, y, z, text)
    local onScreen,_x,_y = World3dToScreen2d(x, y, z)
    if not onScreen then return end
    SetTextScale(0.32,0.32)
    SetTextFont(4)
    SetTextCentre(1)
    SetTextEntry("STRING")
    AddTextComponentString(text)
    DrawText(_x,_y)
end

------------------------------------------------------------------------------------------------
--Focus--
------------------------------------------------------------------------------------------------
AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() then SetNuiFocus(false, false) end
end)
