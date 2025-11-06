local QBCore = exports['qb-core']:GetCoreObject()
local isCookingOpen, PlayerJob = false, nil

local function buildAllowed()
    local t = {}
    if type(Config.AllowedJobs) == "table" then
        for k,v in pairs(Config.AllowedJobs) do
            if type(k) == "number" then t[v] = true else t[k] = true end
        end
    end
    return t
end
local AllowedJobs = buildAllowed()

local function isAllowed()
    if Config.AllowAll then return true end
    return PlayerJob and AllowedJobs[PlayerJob]
end

local function openUI()
    if isCookingOpen then return end
    local recipes = {}
    for id, d in pairs(Config.Recipes or {}) do
        if d then table.insert(recipes, {
            id = id, label = d.label or id, time = d.time, ingredients = d.ingredients,
            result = d.result, description = d.description, category = d.category,
            images = d.images or d.image
        }) end
    end

    if RecipeOrder and #RecipeOrder > 0 then
        local ordered = {}
        for _, id in ipairs(RecipeOrder) do
            for i = #recipes, 1, -1 do
                if recipes[i] and recipes[i].id == id then table.insert(ordered, recipes[i]); table.remove(recipes, i) end
            end
        end
        for _, r in ipairs(recipes) do table.insert(ordered, r) end
        recipes = ordered
    end

    local categories = {}
    if type(Config.Categories) == "table" and #Config.Categories > 0 then
        for _, c in ipairs(Config.Categories) do
            if type(c) == "table" then table.insert(categories, { id = tostring(c.id), label = tostring(c.label or c.id) })
            else table.insert(categories, { id = tostring(c), label = tostring(c) }) end
        end
    else
        local seen = {}
        for _, r in ipairs(recipes) do
            local cat = r.category or "all"
            if not seen[cat] then seen[cat] = true; table.insert(categories, { id = cat, label = cat }) end
        end
    end

    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', recipes = recipes, categories = categories })
    isCookingOpen = true
end

local function closeUI()
    if not isCookingOpen then return end
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
    isCookingOpen = false
end

CreateThread(function()
    Wait(1000)
    local pdata = QBCore.Functions.GetPlayerData()
    if pdata and pdata.job and pdata.job.name then PlayerJob = pdata.job.name end

    local sleep = 1000
    while true do
        local ped = PlayerPedId()
        local pos = GetEntityCoords(ped)
        local nearAny = false

        for _, v in ipairs(Config.CookingPoints) do
            local point = vector3(v.x, v.y, v.z)
            local dist = #(pos - point)
            if dist < 1.0 and isAllowed() then
                nearAny = true
                sleep = 5
                if IsControlJustReleased(0, 38) then openUI() end
                if isCookingOpen and IsControlJustReleased(0, 200) then closeUI() end
                break 
            end
        end
        if not nearAny then sleep = 1000 end
        Wait(sleep)
    end
end)

RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job) PlayerJob = job and job.name or PlayerJob end)
RegisterNetEvent('QBCore:Player:SetPlayerData', function(pdata) if pdata and pdata.job then PlayerJob = pdata.job.name end end)

RegisterNUICallback('cook', function(data, cb)
    local recipeId = data.recipeId
    local recipe = Config.Recipes[recipeId]
    if not recipe then QBCore.Functions.Notify("สูตรอาหารไม่ถูกต้อง", "error"); cb({ ok = false }); return end

    QBCore.Functions.TriggerCallback('qb-cooking:server:CheckIngredients', function(has)
        if not has then
            QBCore.Functions.Notify("วัตถุดิบไม่เพียงพอ!", "error")
            SendNUIMessage({ action = 'craftCancel', recipeId = recipeId })
            cb({ ok = false }); return
        end

        SendNUIMessage({ action = 'craftStart', recipeId = recipeId, time = recipe.time or 8000 })
        TaskStartScenarioInPlace(PlayerPedId(), "PROP_HUMAN_BBQ", 0, true)

        QBCore.Functions.Progressbar("cooking_food", "กำลังทำอาหาร...", recipe.time, false, true, {}, {}, {}, {}, function()
            ClearPedTasksImmediately(PlayerPedId())
            SendNUIMessage({ action = 'craftDone', recipeId = recipeId })
            TriggerServerEvent('qb-cooking:server:DoCook', recipeId)
        end, function()
            ClearPedTasksImmediately(PlayerPedId())
            QBCore.Functions.Notify("ยกเลิกการทำอาหาร", "error")
            SendNUIMessage({ action = 'craftCancel', recipeId = recipeId })
        end)

        cb({ ok = true })
    end, recipeId)
end)

RegisterNUICallback('close', function(_, cb) closeUI(); cb({ ok = true }) end)

AddEventHandler('onResourceStop', function(r)
    if r == GetCurrentResourceName() then SetNuiFocus(false, false) end
end)
