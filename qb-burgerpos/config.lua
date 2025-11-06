-- SPDX-License-Identifier: CC-BY-NC-SA-4.0
-- (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

Config = {}

Config.AllowAll = false
Config.AllowedJobs = { "ambulance" }
Config.InteractDistance = 2.0
Config.MaxPoints = 5

Config.CashierPoints = {
    vector3(-1197.33, -893.33, 13.89),
    vector3(-1195.62, -893.80, 13.89),
    vector3(-1193.58, -894.41, 13.89),
    vector3(-1191.58, -894.96, 13.89),
}

Config.BoardPoints = {
    vector3(-1192.77, -900.17, 13.89),
}

Config.Categories = {
    { id = 'burger', label = 'เบอร์เกอร์', images = "images/ic_burger.png" },
    { id = 'drink', label = 'เครื่องดื่ม', images = "images/ic_drink.png" },
    { id = 'snack', label = 'ของทานเล่น', images = "images/ic_snack.png" },
    { id = 'dessert', label = 'ของหวาน', images = "images/ic_dessert.png" },
    { id = 'set', label = 'set', images = "images/ic_set.png" },
}

Config.OrderItems = {
    burger_classic = {
        name = "burger_classic",
        label = "Classic Burger",
        category = "burger",
        price = 125,
        amount = 1,
        images = "images/burger_classic.png"
    },
    burger_cheese = {
        name = "burger_cheese",
        label = "Cheese Burger",
        category = "burger",
        price = 150,
        amount = 1,
        images = "images/burger_cheese.png"
    },
    burger_bacon = {
        name = "burger_bacon",
        label = "Bacon Burger",
        category = "burger",
        price = 125,
        amount = 1,
        images = "images/burger_bacon.png"
    },
    burger_chicken = {
        name = "burger_chicken",
        label = "Chicken Burger",
        description = "ไก่กรอบเน้นๆ",
        category = "burger",
        price = 125,
        amount = 1,
        images = "images/burger_chicken.png"
    },
    fries = {
        name = "fries",
        label = "French Fries",
        description = "เฟรนช์ฟรายส์",
        category = "snack",
        price = 25,
        amount = 1,
        images = "images/fries.png"
    },
    fries_cheese = {
        name = "fries_cheese",
        label = "French Fries Cheese",
        description = "เฟรนช์ฟรายส์เยิ้มๆ",
        category = "snack",
        price = 50,
        amount = 1,
        images = "images/fries_cheese.png"
    },
    cola = {
        name = "cola",
        label = "Cola",
        category = "drink",
        price = 25,
        amount = 1,
        images = "images/cola.png"
    },
    icecream = {
        name = "icecream",
        label = "Icecream",
        description = "ไอศกรีมหวานชื่นใจ",
        category = "dessert",
        price = 25,
        amount = 1,
        images = "images/icecream.png"
    },
    set_classic = {
        name = "set_classic",
        label = "Classic set",
        description = "Classic burger + French Fries + Cola2 + Icecream",
        category = "set",
        price = 225,
        amount = 1,
        images = "images/set_classic.png"
    },
}

Config.Show3DText = true
Config.ShowMarker = true
Config.Marker = { type = 2, scale = vector3(0.35, 0.35, 0.25), color = { r = 230, g = 200, b = 20, a = 160 } }
