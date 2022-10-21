//=============================================================================
// Stahl Plugin - Emotion Functions
// Stahl_EmotionFunctions.js    VERSION Beta 1.2.0
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
 * setStateTier(type, tier, parseText): void
 * set states that uses tiering system, removes the other tiers
 * Parameter:
 * type: String - "happy", "sad", "angry", "afraid", "atk", "def", "spd"
 * tier: number - the tier of state
 * parseText: boolean - whether to show text after adding state
 * 
 * addStateTier(type, tier, parseText): void
 * adds states that uses tiering system
 * Parameter:
 * type: String - "happy", "sad", "angry", "afraid", "atk", "def", "spd"
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addRandomMainEmotion(tier, parseText): void
 * adds random main emotion to battler (sad, happy, angry)
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addRandomEmotion(tier, parseText): void
 * adds random emotion to battler (ANY emotion possile)
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addRandomBuff(tier, parseText): void
 * adds random buff to battler 
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addSupplementaryEmotion(tier, parseText): void
 * adds emotion of the battler's current emotion
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addSupplementaryBuff(tier, parseText): void
 * adds buff based on battler's current emotion strength
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addComplimentaryBuff(tier, parseText): void
 * adds buff based on battler's current emotion weakness
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addAdvantageEmotion(target, tier, parseText): void
 * adds buff to battler that is advantageous to the target
 * Parameter:
 * target: Game_Battler - target's emotion to be based on
 * tier: number - amount of tier added
 * 
 * addDisavantageEmotion(target, tier, parseText): void
 * adds buff to battler that is disadvantageous to the target
 * Parameter:
 * target: Game_Battler - target's emotion to be based on
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addHighestBuff(tier, parseText): void
 * adds tier to the buff type with highest tier the battler has
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
 * 
 * addLowestBuff(tier, parseText): void
 * adds tier to the buff type with lowest tier the battler has
 * Parameter:
 * tier: number - amount of tier added
 * parseText: boolean - whether to show text after adding state
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

const stateTypeDict = {
	emotions: {
		"sad": {
			idList: [0,10,11,12],
			strong: ["happy"],
			weak: ["angry"],
			limitText: `tname + " can't get any SADDER!"`,
			supBuff: ["def"],
			comBuff: ["spd"],
		},
		"angry": {
			idList: [0,14,15,16],
			strong: ["sad"],
			weak: ["happy"],
			limitText: `tname + " can't get any ANGRIER!"`,
			supBuff: ["atk"],
			comBuff: ["def"],
		},
		"happy": {
			idList: [0,6,7,8],
			strong: ["angry"],
			weak: ["sad"],
			limitText: `tname + " can't get any HAPPIER!"`,
			supBuff: ["spd"],
			comBuff: ["atk"],
		},
		"afraid": {
			idList: [0,18],
			weak: ["angry", "happy", "sad"],
			limitText: `tname + " can't be more AFRAID!"`,
		},
	},
	buffs: {
		"atk": {
			idList: [94,93,92,0,89,90,91],
			statText: "ATTACK",
			altName: ["attack"],
		},
		"def": {
			idList: [100,99,98,0,95,96,97],
			statText: "DEFENSE",
			altName: ["defense"],
		},
		"spd": {
			idList: [106,105,104,0,101,102,103],
			statText: "SPEED",
			altName: ["speed","agi","agility"],
		},
	},
};

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

//buff tier to adjective for display
const buffAdjectiveDict = {
	1: '',
	2: 'moderately!',
	3: 'greatly!',
	4: 'sharply!',
	5: 'significantly!',
	6: 'exceedingly!',
};

//convert Alternate name into used names, mostly buffs
function convertAltStateName(input){
	input = input.toLowerCase();

	let buffDict = stateTypeDict.buffs;
	for (let key in buffDict) {
		key = String(key);
		if (buffDict[key].altName.includes(input))
			return key;
	}
	return input;
}

//array of State IDs from low to high. 0 is No state.
function getStateIDArray(type){
	type = convertAltStateName(type);

	//return id List of emotions
	for (let key in stateTypeDict.emotions) {
		key = String(key);
		if (key == type)
			return stateTypeDict.emotions[key].idList;
	}

	//return id List of buffs
	for (let key in stateTypeDict.buffs) {
		key = String(key);
		if (key == type)
			return stateTypeDict.buffs[key].idList;
	}

	console.log("no state found");
	return [0];
};

//Returns Emotion Advantage to input, returns an array of all possible
function getEmotionAdvantage(type){
	type = convertAltStateName(type);
	let emoDict = stateTypeDict.emotions;
	for (let key in emoDict) {
		if (key == type)
			return emoDict[key].strong;
	}
	return [];
};

//Returns Emotion Disadvantage to input, reverse of advantage
function getEmotionDisadvantage(type){
	type = convertAltStateName(type);
	let emoDict = stateTypeDict.emotions;
	for (let key in emoDict) {
		if (key == type)
			return emoDict[key].weak;
	}
	return [];
};

function getComBuff(type){
	type = convertAltStateName(type);
	let emoDict = stateTypeDict.emotions;
	for (let key in emoDict) {
		if (key == type)
			return emoDict[key].comBuff;
	}
	return [];
};

function getSupBuff(type){
	type = convertAltStateName(type);
	let emoDict = stateTypeDict.emotions;
	for (let key in emoDict) {
		if (key == type)
			return emoDict[key].supBuff;
	}
	return [];
};

function isEmotionState(type){
	return Object.keys(stateTypeDict.emotions).includes(convertAltStateName(type));
};

function isBuffState(type){
	return Object.keys(stateTypeDict.buffs).includes(convertAltStateName(type));
};


// ===========================================================
//                     RETURN FUNCTIONS
// ===========================================================

//returns the emotion type affected
Game_Battler.prototype.emotionStateType = function() {
	let emoArr = Object.keys(stateTypeDict.emotions);
	for (const a of emoArr) {
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
Game_Battler.prototype.addRandomMainEmotion = function(tier = 1, parseText = false) {
	let arr = ["happy", "sad", "angry"];
	let type = arr[Math.randomInt(arr.length)];
	this.addStateTier(type, tier, parseText);
};

//Adds random emotion
Game_Battler.prototype.addRandomEmotion = function(tier = 1, parseText = false) {
	let arr = Object.keys(stateTypeDict.emotions);
	let type = arr[Math.randomInt(arr.length)];
	this.addStateTier(type, tier, parseText);
};

//Adds random buffs
Game_Battler.prototype.addRandomBuff = function(tier = 1, parseText = false) {
	let arr = Object.keys(stateTypeDict.buffs);
	let type = arr[Math.randomInt(arr.length)];
	this.addStateTier(type, tier, parseText);
};

//Adds random tier of the type. Specifying min and max
Game_Battler.prototype.addRandomTier = function(type, minTier = 1, maxTier = 1, parseText = false) {
	var tier = randomIntRange(minTier, maxTier);
	this.addStateTier(type, tier, parseText);
};

//Adds emotion on current emotion
Game_Battler.prototype.addSupplementaryEmotion = function(tier = 1, parseText = false) {
	const curEmotion = this.emotionStateType();
	this.addStateTier(curEmotion, tier, parseText);
};

//Adds buff on current emotion's strength
Game_Battler.prototype.addSupplementaryBuff = function(tier = 1, parseText = false) {
	const curEmotion = this.emotionStateType();
	let typeArr = getSupBuff(curEmotion); //To give advantage to target, grab disadvantage
	if (typeArr == []){return;};
	let type = typeArr[Math.randomInt(typeArr.length)]; //randomize from selection
	this.addStateTier(type, tier, parseText);
};

//Adds buff on current emotion's weakness
Game_Battler.prototype.addComplimentaryBuff = function(tier = 1, parseText = false) {
	const curEmotion = this.emotionStateType();
	let typeArr = getComBuff(curEmotion); //To give advantage to target, grab disadvantage
	if (typeArr == []){return;};
	let type = typeArr[Math.randomInt(typeArr.length)]; //randomize from selection
	this.addStateTier(type, tier, parseText);
};

//Add emotion to the battler advantageous to "target". (Find target disadvantage. Target is sad then give happy, etc.)
Game_Battler.prototype.addAdvantageEmotion = function(target, tier = 1, parseText = false) {
	const targetEmoType = target.emotionStateType();
	let typeArr = getEmotionDisadvantage(targetEmoType); //To give advantage to target, grab disadvantage
	if (typeArr == []){return;};
	let type = typeArr[Math.randomInt(typeArr.length)]; //randomize from selection
	this.addStateTier(type, tier, parseText);
};

//Add emotion to the battler disadvantageous to "target". (Find target advantage. Target is sad then give angry, etc.)
Game_Battler.prototype.addDisadvantageEmotion = function(target, tier = 1, parseText = false) {
	const targetEmoType = target.emotionStateType();
	let typeArr = getEmotionAdvantage(targetEmoType); //To give disadvantage to target, grab advantage
	if (typeArr == []){return;};
	let type = typeArr[Math.randomInt(typeArr.length)]; //randomize from selection
	this.addStateTier(type, tier, parseText);
};

//Adds buff type that is highest
Game_Battler.prototype.addHighestBuff = function(tier = 1, parseText = false) {
	var typeSelection = [];
	var highest = -10000; //ooga booga method, doubt there's ever going to be tier that extreme

	let buffList = Object.keys(stateTypeDict.buffs);
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

	var type = typeSelection[Math.randomInt(typeSelection.length)] //select random type from possible selection
	this.addStateTier(type, tier, parseText);
};

//Adds buff type that is lowest
Game_Battler.prototype.addLowestBuff = function(tier = 1, parseText = false) {
	var typeSelection = [];
	var lowest = 10000; //ooga booga method, doubt there's ever going to be tier that extreme

	let buffList = Object.keys(stateTypeDict.buffs);
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

	var type = typeSelection[Math.randomInt(typeSelection.length)] //select random type from possible selection
	this.addStateTier(type, tier, parseText);
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
	let buffDict = stateTypeDict.buffs;
	for (let key in buffDict) {
		key = String(key);
		if (type = key) {
			stat = buffDict[key].statText;
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
		let sentence = "";
		let emoDict = stateTypeDict.emotions;
		for (let key in emoDict) {
			if (key == type)
				sentence = emoDict[key].limitText;
		}

		first = eval(sentence);
		second = "";
		while (first.length > 40) {
			const lastIndexOfSpace = first.lastIndexOf(' ');
			if (lastIndexOfSpace === -1) {
			  break;
			}
			second = first.substring(lastIndexOfSpace) + second;
			first = first.substring(0, lastIndexOfSpace);
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