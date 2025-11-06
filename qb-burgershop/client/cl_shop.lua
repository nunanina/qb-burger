-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

local QBCore = exports['qb-core']:GetCoreObject()
local isShopOpen = false
local PlayerJob = nil

CreateThread(function()
    Wait(1500)
    local pdata = QBCore.Functions.GetPlayerData()
    if pdata and pdata.job and pdata.job.name then
        PlayerJob = pdata.job.name
    end
end)
RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job) PlayerJob = job.name end)
RegisterNetEvent('QBCore:Player:SetPlayerData', function(pdata)
    if pdata and pdata.job then PlayerJob = pdata.job.name end
end)

local function BuildJobAllowList()
    local t = {}
    if type(Config.AllowedJobs) == "table" then
        for k,v in pairs(Config.AllowedJobs) do
            if type(k)=="number" then t[v]=true elseif v then t[k]=true end
        end
    end
    return t
end
local AllowedJobs = BuildJobAllowList()
local function IsAllowedJob()
    if Config.AllowAll then return true end
    if not PlayerJob then return false end
    return AllowedJobs[PlayerJob] == true
end

function OpenShopUI()
    if isShopOpen then return end
    local items = {}
    for key, v in pairs(Config.ShopItems or {}) do
        table.insert(items, {
            key = key,
            label = v.label or key,
            price = v.price or 0,
            amount = v.amount or 1,
            buy = v.buy == nil and true or v.buy,
            sell = v.sell == true
        })
    end

    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'open',
        items = items
    })
    isShopOpen = true
end

function CloseShopUI()
    if not isShopOpen then return end
    
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
    isShopOpen = false
end

function DrawText3D(x,y,z,text)
    local onScreen,_x,_y = World3dToScreen2d(x,y,z)
    if onScreen then
        SetTextScale(0.35,0.35)
        SetTextFont(4)
        SetTextCentre(1)
        SetTextEntry("STRING")
        AddTextComponentString(text)
        DrawText(_x,_y)
    end
end

CreateThread(function()
    local sleep = 1000
    local ped = PlayerPedId()

    while true do
        local pos = GetEntityCoords(ped)
        for _, v in ipairs(Config.ShopPoints) do
            local point = vector3(v.x, v.y, v.z)
            local dist = #(pos - point)

            if dist < 2.0 and IsAllowedJob()then
                sleep = 10
                -- DrawText3D(v.x, v.y, v.z + 0.2, "[~g~E~w~]  "..Config.ShopName)
                if IsControlJustPressed(0, 38) then 
                    OpenShopUI()
                end
                if isShopOpen and (IsControlJustPressed(0, 200)) then
                    CloseShopUI()
                end
            elseif dist >= 2.0 then
                sleep = 1000
            end
        end
        Wait(sleep)
    end
end)

RegisterNUICallback('pay', function(data, cb)
    TriggerServerEvent('qb-shop:server:PayCart', data.cart)
    cb({ ok = true })
end)

RegisterNUICallback('close', function(_, cb)
    CloseShopUI()
    cb({ ok = true })
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then
        SetNuiFocus(false, false)
    end
end)
