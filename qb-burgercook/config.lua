-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

Config = {}
Config.CookingName = "Cooking Station"
Config.CookingPoints = {
    vector3(-1195.97, -898.08, 13.89)
}

Config.AllowAll = true
Config.AllowedJobs = {
    "ambulance",
}

Config.Categories = {
    { id = "burger", label = "Burger" },
    { id = "snack", label = "Snack" },
    { id = "drink", label = "Drink" },
    { id = "dessert", label = "Dessert" },
    { id = "set", label = "Set" }
}

Config.Recipes = {
    -- เมนูเบอร์เกอร์
    burger_classic = {
        label = "Classic Burger",
        description = "เบอร์เกอร์คลาสสิค รสชาติดั้งเดิม",
        category = "burger",
        time = 3000,
        ingredients = { ["bun"] = 1, ["beef"] = 1, ["salad"] = 1 },
        result = { ["burger_classic"] = 1 },
        images = "images/burger_classic.png"
    },
    burger_cheese = {
        label = "Cheese Burger",
        description = "เพิ่มชีสยืดๆ",
        category = "burger",
        time = 3200,
        ingredients = { ["bun"] = 1, ["beef"] = 1, ["cheese"] = 1,["salad"] =1 },
        result = { ["burger_cheese"] = 1 },
        images = "images/burger_cheese.png"
    },
    burger_bacon = {
        label = "Bacon Burger",
        description = "เพิ่มเบคอนกรอบ",
        category = "burger",
        time = 3500,
        ingredients = { ["bun"] = 1, ["bacon"] = 1, ["salad"] = 1 },
        result = { ["burger_bacon"] = 1 },
        images = "images/burger_bacon.png"
    },
    burger_chicken = {
        label = "Chicken Burger",
        description = "ไก่กรอบเน้นๆ",
        category = "burger",
        time = 3600,
        ingredients = { ["bun"] = 1, ["chicken"] = 1, ["salad"] = 1 },
        result = { ["burger_chicken"] = 1 },
        images = "images/burger_chicken.png"
    },
    -- snacks
    fries = {
        label = "French Fries",
        description = "เฟรนช์ฟรายส์",
        category = "snack",
        time = 1500,
        ingredients = { ["potato"] = 1 },
        result = { ["fries"] = 1 },
        images = "images/fries.png"
    },
    fries_cheese = {
        label = "French Fries Cheese",
        description = "เฟรนช์ฟรายส์เยิ้มๆ",
        category = "snack",
        time = 2000,
        ingredients = { ["potato"] = 1, ["cheese"] = 1 },
        result = { ["fries_cheese"] = 1 },
        images = "images/fries_cheese.png"
    },
    -- drinks
    cola = {
        label = "Cola",
        description = "เครื่องดื่มเย็นๆ",
        category = "drink",
        time = 800,
        ingredients = { ["soda"] = 1},
        result = { ["cola"] = 1 },
        images = "images/cola.png"
    },
    -- ice cream
    icecream = {
        label = "Icecream",
        description = "ไอศกรีมหวานชื่นใจ",
        category = "dessert",
        time = 1200,
        ingredients = { ["cream"] = 1},
        result = { ["icecream"] = 1 },
        images = "images/icecream.png"
    },
    -- set
    set_classic = {
        label = "Classic set",
        description = "Classic burger + French Fries + Cola2 + Icecream",
        category = "set",
        time = 5000,
        ingredients = { ["burger_classic"] = 1, ["fries"] = 1, ["cola"] = 2, ["icecream"] = 1},
        result = { ["set_classic"] = 1 },
        images = "images/set_classic.png"
    }
}
