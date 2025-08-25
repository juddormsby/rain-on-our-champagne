* Assume you already have a variable called weather_code
gen str5 weather_emoji = "?"

replace weather_emoji = "??" if inrange(weather_code,0,3)
replace weather_emoji = "???" if inrange(weather_code,45,48)
replace weather_emoji = "???" if inrange(weather_code,51,55)
replace weather_emoji = "???" if inrange(weather_code,56,57)
replace weather_emoji = "???" if inrange(weather_code,61,65)
replace weather_emoji = "???" if inrange(weather_code,66,67)
replace weather_emoji = "???" if inrange(weather_code,71,75)
replace weather_emoji = "???" if weather_code == 77
replace weather_emoji = "???" if inrange(weather_code,80,82)
replace weather_emoji = "???" if inrange(weather_code,85,86)
replace weather_emoji = "??" if weather_code == 95
replace weather_emoji = "??" if inrange(weather_code,96,99)
