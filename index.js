/** 
 * By: CattaLol
 * This module is provides an easily accessible way of logging ALL the transactions performed on the broker, over the past ~30 or so days (until the transactions themselves get deleted).
 * As a bonus, this module also includes a feature to display ALL current listings within a single search query.
*/

const os = require('os');
const fs = require('fs');
const path = require('path');
const configJsonPath = path.resolve(__dirname,'config.json');
const logDirName = `logs`;

const LOG_TYPE_JSON = 0;
const LOG_TYPE_CSV = 1;

const categories = "chain;dual;lance;twohand;axe;circle;bow;staff;rod;blaster;gauntlet;shuriken;glaive;" + // weapons
				"bodyMail;handMail;feetMail;bodyLeather;handLeather;feetLeather;bodyRobe;handRobe;feetRobe;belt;underwear;" + // armor by materla
				"bodyMail;bodyLeather;bodyRobe;handMail;handLeather;handRobe;feetMail;feetLeather;feetRobe;belt;underwear;" + // armor by location
				"skillbook;" + // skillbook
				"customize_weapon;customize_armor;customize_accessory;" + // crystal
				"weaponMaterial;armorMaterial;leather;alchemy;metal;bone;fiber;weaponComponent;armorComponent;recipe;extractRecipe;generalMaterial;artisan;alchemyMaterial;" + // crafting
				"magical;combat;" + //consumable
				"ring;earring;necklace;brooch;" + // jewelry
				"accessoryHair;accessoryFace;style_axe;style_bow;style_circle;style_dual;style_face;style_hair;style_lance;style_rod;style_staff;style_twohand;style_chain;style_blaster;style_gauntlet;style_shuriken;style_glaive;style_body;style_back;" + // costumes
				"etc;" + // miscellaneous
				"quest;" + // quest
				"dyeItem;dyeRaw;dyeRecipe;" + // dyes
				"enchantScroll;" + // etchings 
				"enchant_material;enchant_agent;" + //enchantments
				"enchantScroll;"; // more enchantments

module.exports = function brokerLogger (dispatch) {
    const command = dispatch.command || dispatch.require.command;
	let config = loadJson(configJsonPath);
	let currentCache = [];
	let serverId = undefined;
	let isLogging = false;
	
	// View ALL (current) listings at once on broker search.
	command.add(`brokerlistall`, () => {
		currentCache = []
		dispatch.toServer(`C_TRADE_BROKER_WAITING_ITEM_LIST_NEW`, 1, {
			lvlMin: 1,
			lvlMax: 70,
			itemLvlMax: 617,
			tierMax: 100,
			enchantMax: 15,
			priceMin: 1,
			priceMax: 99900000000,
			unk11: 1,
			unk4: 90000000,
			categories: categories
		});
	});
	
	// Log ALL transactions queryable on the broker. Do NOT close the broker window, or the operation will terminate.
	command.add(`brokerloghistory`, () => {
		command.message(`Now processing broker pages...`)
		command.message(`Do **NOT** close the broker until all data is parsed!`)
		currentCache = []
		isLogging = true;
		dispatch.toServer(`C_TRADE_BROKER_HISTORY_ITEM_LIST_NEW`, 1, {
			lvlMin: 1,
			lvlMax: 70,
			itemLvlMax: 617,
			tierMax: 100,
			enchantMax: 15,
			priceMin: 1,
			priceMax: 99900000000,
			unk11: 1,
			unk4: 90000000,
			categories: categories
		});
	});
	
	// Set the log type.
	command.add(`brokerlogType`, (arg1) => {
		if (arg1 != undefined){
			parseLogType(arg1);
			saveJson(configJsonPath, config);
		}
	})
	
	// Fetch the server ID for log file naming.
	dispatch.hook(`S_LOGIN`, 14, (event) => {
		serverId = event.serverId
	});
	
	// Intercept the historical transaction data as it comes in.
	dispatch.hook(`S_TRADE_BROKER_HISTORY_ITEM_LIST`, 2, (event) => {
		if (isLogging){
			currentCache = currentCache.concat(event.listings);
			// ... convert to json and store to file		
			setTimeout(() => {
				requestNextPageHistory(event.page, event.pageCount);		
			}, 50);
		}
	});
	
	// Assigns the new logging type from string (csv or json)
	function parseLogType(newTypeStr) {
		if (newTypeStr.toLowerCase() === `json`){
			config.logType = LOG_TYPE_JSON;			
		}
		else if (newTypeStr.toLowerCase() === `csv`){
			config.logType = LOG_TYPE_CSV;				
		}
		else {
			command.message(`Invalid log type. Valid types are "json" or "csv".`);
		}
		command.message(`Logging now in ${getLogTypeStr()}`);		
	}
	
	// String name of current log type
	function getLogTypeStr(){
		switch(config.logType){
			case LOG_TYPE_JSON:
				return "json format";
			case LOG_TYPE_CSV:
				return "csv format";
			default:
				// invalid type?!
				return "unknown"
		}
	}
	
	// Requests the next page of the broker history, if there are any. If there are not, then save the data to log file.
	function requestNextPageHistory(currentPage, maxPage) {
		let nextPage = currentPage + 1;
		if (nextPage < maxPage){ 
			command.message(`Requesting page ${nextPage} / ${maxPage}`);
			dispatch.toServer(`C_TRADE_BROKER_HISTORY_ITEM_LIST_PAGE`, 1, {
				page: nextPage
			});			
		}
		else{
			command.message(`All ${maxPage} pages processed. Writing ${currentCache.length} entries to file.`)
			loopBigIntToString(currentCache);			
			generateLogFile(currentCache);
		}
	}
	
	// Generates a log file of cached data.
	function generateLogFile(data) {
		let logDir = path.resolve(__dirname, logDirName);		
		if (!fs.existsSync(logDir)){
			fs.mkdirSync(logDir);
		}
		switch(config.logType){
			case LOG_TYPE_JSON:
				saveJson(getLogFilePath(logDir), data);
				break;
			case LOG_TYPE_CSV:
				saveCSV(getLogFilePath(logDir), data);
				break;
		}
		data = [];
		isLogging = false;
	}
	
	// Loads data from JSON
	function loadJson(filePath){
		try {
			let data = JSON.parse(fs.readFileSync(filePath, "utf8"));
			if (!data){
				console.log(`Error loading JSON at ${filePath}! Loading default parameters.`)				
			}
			else{
				console.log(`Loaded data from JSON at ${filePath}`)
			}
			return data ? data : getDefaultJson();
		}
		catch (err) {
			console.log(`Error loading JSON at ${filePath}! Loading default parameters.`)
			return getDefaultJson();
		}
	}
	
	// Saves data to JSON
	function saveJson(filePath, data){
		command.message(`Writing to json file...`)
		fs.writeFile(filePath, JSON.stringify(data, null, '\t'), 'utf8', function (err) {
			if (!err){
				command.message(`Data saved to json file.`)
			}
			else{
				command.message(`There was an error writing to ${filePath}!`)
				console.log(err);
			}
		});
	}
	
	// Saves data to CSV
	function saveCSV(filePath, data) {
		let csvData = Object.keys(data[0]).join(', ') + '\n';
		for (let entry of data) {
			csvData += Object.values(entry).join(', ') + '\n';
		}		
		fs.writeFile(filePath, csvData, 'utf8', function (err) {
			console.log(`Writing to CSV file...`)
			if (!err){
				command.message(`Data saved to CSV file.`)
			}
			else{
				command.message(`There was an error writing to ${filePath}!`)
				console.log(err);
			}
		});
	}
	
	// Generates the log file path, based on region/server id, and current datetime stamp.
	function getLogFilePath(logDir){
		// Log file name format: <Region><ServerId>_YYYY-MM-DD-hhmmss.<extension> Example: NA-2-2019-12-01-091523.json
		let serverStr = dispatch.region.toUpperCase() + `-` + serverId;
		let date = new Date().toLocaleDateString().replace(/\//g, '-');
		let time = new Date().toLocaleTimeString().replace(/\D/g,'');
		let filePath = logDir + `\\` + serverStr + `-` + date + `-` + time;
		
		switch (config.logType) {
			case LOG_TYPE_JSON:
				return filePath + '.json';
			case LOG_TYPE_CSV:
				return filePath + '.csv';
			default:
				command.message(`Invalid log file type? Defaulting to .txt`);
				return filePath + '.txt';
		}
	}
	
	// Converts any bigInt into string.
	function loopBigIntToString(obj) {
		Object.keys(obj).forEach(key => {
			if (obj[key] && typeof obj[key] === 'object'){
				loopBigIntToString(obj[key]);
			}
			else if (typeof obj[key] === "bigint") {
				obj[key] = obj[key].toString();
			}
		});
	}
	
	// Default json settings.
	function getDefaultJson() {
		let settings = {
			logType : LOG_TYPE_CSV
		}
		return settings;
	}
}