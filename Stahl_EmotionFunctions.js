//=============================================================================
// Stahl Plugin - Emotion Functions
// Stahl_EmotionFunctions.js    VERSION Beta 1.1.0
//=============================================================================

var Imported = Imported || {};
Imported.Stahl_EmotionFunctions = true;

var Stahl = Stahl || {};
Stahl.EmotionFunctions = Stahl.EmotionFunctions || {};

//=============================================================================
 /*:
 * @plugindesc (beta) v1.1.0 Gives handy functions related to emotions and buffs
 * @author ReynStahl
 * 
 * @param Combine Buffs and Debuffs
 * @type boolean
 * @on YES
 * @off NO
 * @desc Combine buff and debuffs, not to be separate added states.
 * NO - false     YES - true
 * @default true
 * 
 * @help
 * These can be used in evaluate functions. For example in notetags:
 * 
 * <whole action>
 * eval: target.addStateTier("sad", 1)
 * eval: target.addStateTier("spd", -3)
 * animation 219: target
 * </whole action>
 * 
 * In some action like <whole action> it is only executed once, 
 * for YEP multiple battler variables like "actors", "friends", "enemies", etc. 
 * forEach function is used.
 * For example, This function would apply to all actors:
 * 
 * <whole action>
 * eval: BattleManager.makeActionTargets('actors').forEach(x=>x.addStateTier('sad', 1))
 * eval: BattleManager.makeActionTargets('actors').forEach(x=>x.addStateTier('spd', -3))
 * animation 219: target
 * </whole action>
 * 
 * ================================
 *           Game_Battler
 * ================================
 * emotionStateType(): String
 * returns the battler's emotion type affected
 * 
 * stateTypeTier(type): number
 * returns the battler's tier of that emotion type
 * Parameter:
 * type: String - "happy", "sad", "angry", "afraid", "atk", "def", "spd"
 * 
 * emotionTier(): number
 * returns the battler's emotion tier of any type
 * 
 * setStateTier(type, tier): void
 * set states that uses tiering system, removes the other tiers
 * Parameter:
 * type: String - "happy", "sad", "angry", "afraid", "atk", "def", "spd"
 * tier: number - the tier of state
 * 
 * addStateTier(type, tier, showText): void
 * adds states that uses tiering system
 * Parameter:
 * type: String - "happy", "sad", "angry", "afraid", "atk", "def", "spd"
 * tier: number - amount of tier added
 * showText: boolean - whether to show parse text after adding state
 * 
 * addRandomEmotion(tier): void
 * adds random emotion to battler (doesn't include afraid)
 * Parameter:
 * tier: number - amount of tier added
 * 
 * addRandomBuff(tier): void
 * adds random buff to battler 
 * Parameter:
 * tier: number - amount of tier added
 * 
 * addSupplementaryEmotion(tier): void
 * adds emotion of the battler's current emotion
 * Parameter:
 * tier: number - amount of tier added
 * 
 * addSupplementaryBuff(tier): void
 * adds buff based on battler's current emotion strength
 * Parameter:
 * tier: number - amount of tier added
 * 
 * addComplimentaryBuff(tier): void
 * adds buff based on battler's current emotion weakness
 * Parameter:
 * tier: number - amount of tier added
 * 
 * addAdvantageEmotion(target, tier): void
 * adds buff to battler that is advantageous to the target
 * Parameter:
 * target: Game_Battler - target's emotion to be based on
 * tier: number - amount of tier added
 * 
 * addDisavantageEmotion(target, tier): void
 * adds buff to battler that is disadvantageous to the target
 * Parameter:
 * target: Game_Battler - target's emotion to be based on
 * tier: number - amount of tier added
 * 
 * addHighestBuff(tier): void
 * adds tier to the buff type with highest tier the battler has
 * Parameter:
 * tier: number - amount of tier added
 * 
 * addLowestBuff(tier): void
 * adds tier to the buff type with lowest tier the battler has
 * Parameter:
 * tier: number - amount of tier added
 * 
 * parseBuffText(type, tier): void
 * adds text about added buffs to the battle log, similar to CBAT state addition text
 * Parameter:
 * type: String - "atk", "def", "spd"
 * tier: number - amount of tier added, this is used for determining adjective
 * 
 * parseEmotionText(type): void
 * adds text about added emotions to the battle log, similar to CBAT state addition text
 * Parameter:
 * type: String - "happy", "sad", "angry", "afraid"
 */
//=============================================================================

//=============================================================================
// Parameter Variables
//=============================================================================

var combineBuffs = PluginManager.parameters('Stahl_EmotionFunctions')['Combine Buffs and Debuffs'];

// ===========================================================
//                     LOCAL FUNCTIONS
// ===========================================================

//returns an integer random number between min (included) and max (included)
function randomIntRange(min, max) {
	return Math.floor(Math.random()*(max-min+1)+min);
};

const emotionList = ["sad","angry","happy","afraid"];
const buffList = ["atk","def","spd"];

//state ID to text display
const emotionTextDict = {
	6: 'HAPPY!',
	7: 'ECSTATIC!!',
	8: 'MANIC!!!',
	10: 'SAD.',
	11: 'DEPRESSED..',
	12: 'MISERABLE...',
	14: 'ANGRY!',
	15: 'ENRAGED!!',
	16: 'FURIOUS!!!',
	18: 'AFRAID!',
};

//emotion type to max text display
const emotionMaxTextDict = {
	"happy": "HAPPIER!",
	"sad": "SADDER!",
	"angry": "ANGRIER!"
};

//buff tier to adjective for display
const buffAdjectiveDict = {
	1: '',
	2: 'moderately!',
	3: 'greatly!',
	4: 'sharply!',
	5: 'significantly!',
	6: 'exceedingly!',
};

//Emotion Advantage of key
const emotionAdvantageDict = {
	"sad": "happy",
	"angry": "sad",
	"happy": "angry",
};

const stateDict = {
	"sad": [0,10,11,12],
	"angry": [0,14,15,16],
	"happy": [0,6,7,8],
	"afraid": [0,18],
	"atk": [94,93,92,0,89,90,91],
	"def": [100,99,98,0,95,96,97],
	"spd": [106,105,104,0,101,102,103]
};

const stateAltNameDict = {
	"attack": "atk",
	"defense": "def",
	"speed": "spd",
	"agi": "spd",
	"agility": "spd"
};

const buffStateTextDict = {
	"atk": "ATTACK",
	"def": "DEFENSE",
	"spd": "SPEED"
};

//array of State IDs from low to high. 0 is No state.
function convertAltStateName(input){
	let _input = input.toLowerCase();

	//turn alt name into used name
	for (let key in stateAltNameDict) {
		const _key = String(key);
		if (_key == _input)
			return stateAltNameDict[_key];
	}
	return _input;
}

//array of State IDs from low to high. 0 is No state.
function getStateIDArray(type){
	let _type = convertAltStateName(type.toLowerCase());

	//return state array
	for (let key in stateDict) {
		const _key = String(key);
		if (_key == _type)
			return stateDict[_key];
	}

	console.log("no state found");
	return "none";
};

//Returns Emotion Advantage to input
function findEmotionAdvantage(type){
	for (let key in emotionAdvantageDict) {
		key = String(key);
		if (key == type)
			return emotionAdvantageDict[key];
	}
	return "none";
};

//Returns Emotion Disadvantage to input, reverse of advantage
function findEmotionDisadvantage(type){
	for (let key in emotionAdvantageDict) {
		key = String(key);
		if (emotionAdvantageDict[key] == type)
			return key;
	}
	return "none";
};

function isEmotionState(type){
	return emotionList.includes(convertAltStateName(type.toLowerCase()));
};

function isBuffState(type){
	return buffList.includes(convertAltStateName(type.toLowerCase()));
};


// ===========================================================
//                     RETURN FUNCTIONS
// ===========================================================

//returns the emotion type affected
Game_Battler.prototype.emotionStateType = function() {
	for (const a of ["happy", "sad", "angry", "afraid"]) {
		if (getStateIDArray(a).some(this.isStateAffected.bind(this)))
			return a;
	}
	return "neutral";
};

//returns the "tier" of the state.
Game_Battler.prototype.stateTypeTier = function(type) {
	var arr = getStateIDArray(type); 
	const midStateIndex = arr.indexOf[0];
	var currentState = 0;
	//find current state, found nothing then is 0;
	for (const a of arr) {
		if (a !== 0 && this.isStateAffected(a)) {
			currentState = a;
			break;
		}
	}
	const currentStateIndex = arr.indexOf(currentState);
	return currentStateIndex - midStateIndex; //tier is difference between the middle no-state to current state
};

//returns the tier of emotion, any emotion
Game_Battler.prototype.emotionTier = function() {
	return this.stateTypeTier(this.emotionStateType());
};

// ===========================================================
//                     VOID FUNCTIONS
// ===========================================================

//Sets state and remove the other
Game_Battler.prototype.setStateTier = function(type, tier = 1) {
	var arr = getStateIDArray(type); //Array of State IDs from low to high. 0 is No state.
	var currentState = 0; //current state ID
	
	//find current state
	for (const a of arr) {
		if (a !== 0 && this.isStateAffected(a)) {
			currentState = a;
			break;
		}
  	}
	
	//remove current state 
	if (currentState != 0) 
		this.removeState(currentState);
	
	//now add state again fresh from 0
	this.addStateTier(type, tier);
}

//Adds state that uses the tiering system
Game_Battler.prototype.addStateTier = function(type, tier = 1, parseText = false) {
	//if 0 tier then return, it won't do anything lol
	if (tier == 0)
		return;
	
	type = convertAltStateName(type.toLowerCase());
	var arr = getStateIDArray(type); //Array of State IDs from low to high. 0 is No state.

	//If using old vanilla method where buffs are separate
	if (!combineBuffs) {
		const midStateIndex = arr.indexOf[0];
		if (tier > 0) {
			arr.splice(0, midStateIndex) //positive, remove BEFORE zero
		} else {
			arr.splice(midStateIndex + 1) //positive, remove AFTER zero
		}
	}

	var currentState = 0; //current state ID
	var finalState = 0; //final state ID
	
	//find current state. Tried turning this into function but it doesn't really work lol
	for (const a of arr) {
		if (a !== 0 && this.isStateAffected(a)) {
			currentState = a;
			break;
		}
  	}
	
	//add tier by checking index. Clamp to min max
	const currentStateIndex = arr.indexOf(currentState); //so it doesnt try to call array multiple times
	const MIN = 0;
	const MAX = arr.length - 1;
	finalState = arr[Math.min(Math.max(currentStateIndex + tier, MIN), MAX)];
	
	//Check resistance, if it goes to 0 then all is immune, therefore nothing happens
	let resistCheck = tier;
	while (this.isStateResist(finalState) && resistCheck !== 0) {
		//check "lesser" state. If +3 but is immune, then try +2 (positive then lower); If -3 but is immune, then try -2 (negative then higher); etc.
		resistCheck += resistCheck > 0 ? -1 : 1;
		finalState = arr[Math.min(Math.max(currentStateIndex + resistCheck, MIN), MAX)];
	}

	//remove old state
	if (finalState != currentState && currentState != 0)
		this.removeState(currentState);
	
	//add new state, if its not 0 (no state)
	if (finalState != 0)
		this.addState(finalState);
	
	if (parseText) {
		if (isEmotionState(type)) {
			this.parseEmotionText(type);
		} else if (isBuffState(type)) {
			this.parseBuffText(type, tier);
		}
	}
};

//Adds random emotion
Game_Battler.prototype.addRandomEmotion = function(tier = 1) {
	const type = ["happy", "sad", "angry"][Math.randomInt(3)];
	this.addStateTier(type, tier);
};

//Adds random buffs
Game_Battler.prototype.addRandomBuff = function(tier = 1) {
	const type = ["atk", "def", "spd"][Math.randomInt(3)];
	this.addStateTier(type, tier);
};

//Adds random tier of the type. Specifying min and max
Game_Battler.prototype.addRandomTier = function(type, minTier = 1, maxTier = 1) {
	var tier = randomIntRange(minTier, maxTier);
	this.addStateTier(type, tier);
};

//Adds emotion on current emotion
Game_Battler.prototype.addSupplementaryEmotion = function(tier = 1) {
	const curEmotion = this.emotionStateType();
	this.addStateTier(curEmotion, tier);
};

//Adds buff on current emotion strength
Game_Battler.prototype.addSupplementaryBuff = function(tier = 1) {
	const curEmotion = this.emotionStateType();
	var type = "";
	switch (curEmotion) {
		case "happy": type = "spd"; break;
		case "sad": type = "def"; break;
		case "angry": type = "atk"; break;
		default: return;
	}
	this.addStateTier(type, tier);
};

//Adds buff on current emotion weakness
Game_Battler.prototype.addComplimentaryBuff = function(tier = 1) {
	const curEmotion = this.emotionStateType();
	var type = "";
	switch (curEmotion) {
		case "happy": type = "atk"; break;
		case "sad": type = "spd"; break;
		case "angry": type = "def"; break;
		default: return;
	}
	this.addStateTier(type, tier);
};

//Add emotion to the battler advantageous to "target". (Find target disadvantage. Target is sad then give happy, etc.)
Game_Battler.prototype.addAdvantageEmotion = function(target, tier = 1) {
	const targetEmotion = target.emotionStateType();
	if (findEmotionAdvantage(targetEmotion) == "none")
		return;
	this.addStateTier(findEmotionDisadvantage(targetEmotion), tier)
};

//Add emotion to the battler disadvantageous to "target". (Find target advantage. Target is sad then give angry, etc.)
Game_Battler.prototype.addDisadvantageEmotion = function(target, tier = 1) {
	const targetEmotion = target.emotionStateType();
	if (findEmotionAdvantage(targetEmotion) == "none")
		return;
	this.addStateTier(findEmotionAdvantage(targetEmotion), tier)
};

//Adds buff type that is highest
Game_Battler.prototype.addHighestBuff = function(tier = 1) {
	var type = "";
	var typeSelection = [];
	var highest = -1000; //ooga booga method, doubt there's ever going to be tier that extreme

	for (const a in buffList) {
		const tierCheck = this.stateTypeTier(a);
		if (tierCheck > highest) {
			highest = tierCheck;
			typeSelection = [a]; //if there's higher one found then just reset it to the new one only
		} else if (tierCheck == highest) {
			typeSelection.push(a) //if there's one with the same as highest then add to the possible selection for randomizer
		}
	}

	if (typeSelection.length <= 0)
		return; //if somehow nothing then return

	type = typeSelection[Math.randomInt(typeSelection.length)] //select random type from possible selection
	this.addStateTier(type, tier);
};

//Adds buff type that is lowest
Game_Battler.prototype.addLowestBuff = function(tier = 1) {
	var type = "";
	var typeSelection = [];
	var lowest = 1000; //ooga booga method, doubt there's ever going to be tier that extreme

	for (const a in buffList) {
		const tierCheck = this.stateTypeTier(a);
		if (tierCheck < lowest) {
			lowest = tierCheck;
			typeSelection = [a]; //if there's lower one found then just reset it to the new one only
		} else if (tierCheck == lowest) {
			typeSelection.push(a) //if there's one with the same as lowest then add to the possible selection for randomizer
		}
	}

	if (typeSelection.length <= 0)
		return; //if somehow nothing then return

	type = typeSelection[Math.randomInt(typeSelection.length)] //select random type from possible selection
	this.addStateTier(type, tier);
};

//Does the text for buff change on battle log, enter what to display manually
Game_Battler.prototype.parseBuffText = function(type, tier = 1) {
	if (tier == 0)
		return; //if tier 0 then it's nothing lol

	type = convertAltStateName(type.toLowerCase());
	const tname = this.name();
	let tierAbs = Math.abs(tier);
	let first = "";
	let second = "";
	let adj = "";

	//Get emotion max text
	for (let key in buffStateTextDict) {
		key = String(key);
		if (type = key) {
			stat = buffStateTextDict[key];
			break;
		}
	}

	//get buff adjective
	for (let key in buffAdjectiveDict) {
		key = Number(key);
		if (key == tierAbs) {
			adj = buffAdjectiveDict[key];
			break;
		}
	}

	if (!this._noStateMessage) {
		let hl = tier > 0 ? "rose" : "fell";
		if (adj == "") {
			first = `${tname}'s ${stat} ${hl}!`
			second = ``; 
		} else {
			first = `${tname}'s ${stat} ${hl} `
			second = `${adj}`; 
		}
	} else {
		let hl = tier > 0 ? "higher!" : "lower!";
		first = `${tname}'s ${stat} can't go `
		second = `any ${hl}`;
	}

	let complete = `${first}${second}`;
	if(complete.length < 40) {
		BattleManager.addText(complete, 16)
	} else {
		BattleManager.addText(first, 1)
		BattleManager.addText(second, 16)
	}
};

//Does the text for emotion change on battle log, enter what to display manually
Game_Battler.prototype.parseEmotionText = function(type) {
	type = convertAltStateName(type.toLowerCase());
	let tname = this.name();
	let first = "";
	let second = "";
	let adj = "";

	if(!this._noEffectMessage) {
		//Get cur emotion text
		for (let key in emotionTextDict) {
			key = Number(key);
			if (this.isStateAffected(key)) {
				adj = emotionTextDict[key];
				break;
			}
		}

		first = `${tname} feels `;
		second = `${adj}`; 
	} else {
		//Get emotion max text
		for (let key in emotionMaxTextDict) {
			key = String(key);
			if (type = key) {
				adj = emotionMaxTextDict[key];
				break;
			}
		}

		first = `${tname} can't get any `;
		second = `${adj}`; 

		if(type == "afraid") {
			first = `${tname} can't be more `;
			second = `AFRAID!`; 
		}
	}

	let complete = `${first}${second}`;
	if(complete.length < 40) {
		BattleManager.addText(complete, 16)
	}
	else {
		BattleManager.addText(first, 1)
		BattleManager.addText(second, 16)
	}
};

{
	window.DGT = window.DGT || {}
	DGT.reverieFixes = {}
  
	let alias = (originalStorage, baseClass, funcName, usePrototype, newFunc) => {
	  	if (originalStorage[baseClass] == undefined) {
			originalStorage[baseClass] = {}
	  	}
	  	// note: using window here is supposedly slightly stupid and i should polyfill globalthis or something
	  	// but im not going to
	  	if (usePrototype) { // prototype solution is stupid
			originalStorage[baseClass][funcName] = window[baseClass].prototype[funcName] || (() => {}) // save original function
			window[baseClass].prototype[funcName] = function(...args) {
			  return newFunc.call(this, originalStorage[baseClass][funcName], ...args)
			} // override function and pass original forward
	  	} else {
			originalStorage[baseClass][funcName] = window[baseClass][funcName] || (() => {}) // save original function
			window[baseClass][funcName] = newFunc.bind(window[baseClass], originalStorage[baseClass][funcName]) // override function and pass original forward
	  	}
	}
	alias = alias.bind(null, DGT.reverieFixes)
	
	AIManager.conditionEvalWithTarget = function() {
	  	var action = this.action();
	  	var item = action.item();
	  	var user = this.battler();
	  	var s = $gameSwitches._data;
	  	var v = $gameVariables._data;
		
	  	var group = this.getActionGroup();
	  	var validTargets = [];
	  	for (var i = 0; i < group.length; ++i) {
			var target = group[i];
			if (!target) continue;
			try {
			  if (eval(condition)) validTargets.push(target);
			} catch (e) {
			  Yanfly.Util.displayError(e, condition, 'A.I. EVAL WITH TARGETS ERROR')
			}
	  	}
	  	if (validTargets.length <= 0) return false;
	  	this.setProperTarget(validTargets);
	  	return true;
	}
	alias('AIManager', 'passAIConditions', false, function(original, line) {
	  	if (line.match(/TARGEVAL[ ](.*)/i)) {
			var condition = String(RegExp.$1);
			return this.conditionEvalWithTarget(condition);
	  	}
	  	return original.call(this, line)
	})
}