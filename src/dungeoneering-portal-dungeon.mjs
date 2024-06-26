const { loadModule, getResourceUrl, version } = mod.getContext(import.meta);

export class DungeoneeringPortalDungeon extends Dungeon {
    constructor({
        id='p' + Math.random().toString(36).slice(-5),
        hasBarrier=false,
        damageType=game.normalDamage,
        attackTypes=["melee", "ranged", "magic"],
        dimension=getRandomArrayElement(game.dungeoneering.dimensions.allObjects),
        maxAttempts=5,
        combatLevel=-1
    }, manager) {
        super(game.registeredNamespaces.getNamespace('dungeoneering'), {
            id,
            name: '',
            media: "assets/dungeoneering.png",
            monsterIDs: [],
            difficulty: [7],
            entryRequirements: [],
            rewardItemIDs: [],
            dropBones: true,
            pet: {
                petID: 'dungeoneering:Mimic',
                weight: 20000
            },
            fixedPetClears: false,
            pauseOnBosses: false,
            skillUnlockCompletions: 0
        }, game);
        this.dropsCurrency = true;

        this.manager = manager;
        this.game = game;
        this.attempts = 0;

        this.combatLevel = combatLevel;
        this.maxAttempts = maxAttempts;
        this.hasBarrier = hasBarrier;
        this.damageType = damageType;
        this.attackTypes = attackTypes;
        this.dimension = dimension;
    }

    set name(_) { }
    get name() {
        if(this._monsters === undefined)
            this.generateMonsters();
        let dungeon = game.dungeons.find(dungeon => !game.dungeoneering.isDungeoneeringPortal(dungeon) && dungeon.monsters[dungeon.monsters.length-1] === this._monsters[this._monsters.length-1]);
        return `${this.dimension.name} ${dungeon !== undefined ? dungeon.name : 'Dungeon'}`;
    }

    set monsters(_) { }
    get monsters() {
        if(this._scaledMonsters === undefined)
            this.scaleMonsters();
        return this._scaledMonsters;
    }

    set floors(_) { }
    get floors() {
        return this._floors;
    }
    
    get areaEffectDescription() {
        return `</br><span class="text-combat-smoke"><b>Player</b>:</br>${describeModifierDataLineBreak(this.modifiers)}</br><b>Enemy</b>:</br>${describeModifierDataLineBreak(this.enemyModifiers)}</span>`;
    }

    set modifiers(_) { }
    get modifiers() {
        if(this._staticModifiers === undefined && this._randomModifiers === undefined)
            this.generateModifiers();
        return [...this._staticModifiers, ...this._randomModifiers];
    }

    set enemyModifiers(_) { }
    get enemyModifiers() {
        if(this._staticEnemyModifiers === undefined && this._randomEnemyModifiers === undefined)
            this.generateEnemyModifiers();
        return [...this._staticEnemyModifiers, ...this._randomEnemyModifiers];
    }

    set passives(_) { }
    get passives() {
        if(this._passives === undefined)
            this.generatePassives();
        return this._passives;
    }
    

    /*
        this._rewards = [];
        "bones": {
          "itemID": "melvorD:Bones",
          "quantity": 1
        },
        "currencyDrops": [
          {
            "currencyID": "melvorD:GP",
            "min": 10,
            "max": 50
          }
        ]
    */

    getMonsterProxy(monster, scale) {
        let bossCombatLevel = this.combatLevel;
        let scaledCombatLevel = Math.floor((scale/100) * bossCombatLevel);
        let combatLevelScaler = scaledCombatLevel / monster.combatLevel;
        let dungeonPassives = this.passives;

        let scaledName = `${this.dimension.name} ${monster.name}`;

        let scaledLevels = {};
        for(let skill in monster.levels) {
            scaledLevels[skill] = Math.ceil(monster.levels[skill] * combatLevelScaler);
        }

        let scaledSpecialAttacks = [...monster.specialAttacks].map(({attack, ...rest}) => {
            let scaledDamage = attack.damage.map(({maxRoll, maxPercent, minRoll, minPercent, ...rest}) => {
                let newDamage = { ...rest };
                if(maxRoll !== undefined && maxPercent !== undefined) {
                    newDamage.maxRoll = maxRoll;
                    newDamage.maxPercent = maxRoll === "Fixed" ? Math.ceil(maxPercent * combatLevelScaler) : maxPercent;
                }
                if(minRoll !== undefined && minPercent !== undefined) {
                    newDamage.minRoll = minRoll;
                    newDamage.minPercent = minRoll === "Fixed" ? Math.ceil(minPercent * combatLevelScaler) : minPercent;
                }
                return newDamage;
            });

            let scaledAttack = new Proxy(attack, {
                get(target, prop, receiver) {
                    if(prop === 'modifiedDescription') {
                        return applyDescriptionModifications(receiver.description);
                    }
                    if(prop === 'damage') {
                        return scaledDamage;
                    }
                    return Reflect.get(...arguments);
                }
            });

            return {
                attack: scaledAttack,
                ...rest
            };
        });

        let scaledCurrencyDrops = [{
            currency: game.dungeoneering.coins,
            min: 10,
            max: 50
        }];

        return {
            get(target, prop, receiver) {
                if (prop === 'name') {
                    return scaledName;
                }
                if (prop === 'levels') {
                    return scaledLevels;
                }
                if (prop === 'specialAttacks') {
                    return scaledSpecialAttacks;
                }
                if (prop === 'passives') {
                    return dungeonPassives;
                }
                if (prop === 'isDungeoneering') {
                    return true;
                }
                /*if(prop === 'rewards') {
                    return scaledRewards;
                }
                if(prop === 'bones') {
                    return scaledBones;
                }*/
                if(prop === 'currencyDrops') {
                    return scaledCurrencyDrops;
                }
            return Reflect.get(...arguments);
            }
        }
    }

    scaleMonsters() {
        if(this._monsters === undefined)
            this.generateMonsters();
        this._scaledMonsters = [];

        this._floors.forEach((count, i) => {
            let scale = this._scale[i];
            let monster = this._monsters[i];
            let scaledMonster = new Proxy(monster, this.getMonsterProxy(monster, scale));

            for(let i=0; i<count; i++)
                this._scaledMonsters.push(scaledMonster);
        });
    }

    generatePassives() {
        let modifiers = new ModifierTable();
        let enemyModifiers = new ModifierTable();

        modifiers.addModifiers(this, this.modifiers);
        enemyModifiers.addModifiers(this, this.enemyModifiers);

        let playerModifierDescriptions = modifiers.getModifierDescriptionsAsNodes('span');
        let enemyModifierDescriptions = enemyModifiers.getModifierDescriptionsAsNodes('span');
        let description = `This realm has a strange effect on you and the monsters within.<br><b>You suffer from</b><br>${playerModifierDescriptions.map((node) => node.outerHTML).join('<br>')}<br><b>Monsters gain</b><br>${enemyModifierDescriptions.map((node) => node.outerHTML).join('<br>')}`
        
        this._passives = [{
            "name": "Dungeoneering Aura",
            "modifiers": modifiers.toCondensedValues(),
            "enemyModifiers": enemyModifiers.toCondensedValues(),
            "description": description,
            "modifiedDescription": applyDescriptionModifications(description)
        }];
    }

    generateModifiers() {
        const staticModifiers = {};
        const randomModifiers = {};
        let guaranteedModifiers = this.manager.guaranteedDungeonModifiers;
        for(let i=0; i<guaranteedModifiers.length; i++) {
            let [mod, min, max] = guaranteedModifiers[i];
            staticModifiers[mod] = rollInteger(min, max);
        }
        for(let i=0; i<rollInteger(1, 3); i++) {
            let [mod, min, max] = getRandomArrayElement(this.manager.randomDungeonModifiers);
            randomModifiers[mod] = rollInteger(min, max);
        }
        this._staticModifiers = game.getModifierValuesFromData(staticModifiers);
        this._randomModifiers = game.getModifierValuesFromData(randomModifiers);
    }

    generateEnemyModifiers() {
        const staticEnemyModifiers = {};
        const randomEnemyModifiers = {};
        let guaranteedEnemyModifiers = this.manager.guaranteedDungeonEnemyModifiers;
        for(let i=0; i<guaranteedEnemyModifiers.length; i++) {
            let [mod, min, max] = guaranteedEnemyModifiers[i];
            staticEnemyModifiers[mod] = rollInteger(min, max);
        }
        for(let i=0; i<rollInteger(1, 3); i++) {
            let [mod, min, max] = getRandomArrayElement(this.manager.randomDungeonEnemyModifiers);
            randomEnemyModifiers[mod] = rollInteger(min, max);
        }
        this._staticEnemyModifiers = game.getEnemyModifierValuesFromData(staticEnemyModifiers);
        this._randomEnemyModifiers = game.getEnemyModifierValuesFromData(randomEnemyModifiers);
    }

    generateMonsters() {
        if(this._staticModifiers === undefined && this._randomModifiers === undefined)
            this.generateModifiers();
        if(this._staticEnemyModifiers === undefined && this._randomEnemyModifiers === undefined)
            this.generateEnemyModifiers();
        if(this._passives === undefined)
            this.generatePassives();

        this._monsters = [];
        this._floors = [];
        this._scale = [];

        const monsters = game.monsters.allObjects.filter(monster => monster.hasBarrier === this.hasBarrier && monster.damageType === this.damageType && this.attackTypes.includes(monster.attackType));
        const boss = getRandomArrayElement(monsters.filter(monster => monster.isBoss).filter(boss => game.dungeons.find(dungeon => !game.dungeoneering.isDungeoneeringPortal(dungeon) && dungeon.monsters[dungeon.monsters.length-1] === boss)));
        const floorCount = rollInteger(4, 8);

        for(let i=0; i<floorCount; i++) {
            this._monsters.push(getRandomArrayElement(monsters.filter(monster => !monster.isBoss)));
            this._scale.push(rollInteger(50, 99));
            this._floors.push(rollInteger(3, 8));
        }

        this._scale.sort();

        this._floors.push(1);
        this._scale.push(100);
        this._monsters.push(boss);
    }

    encode(writer) {
        writer.writeUint8(this.attempts);
        writer.writeUint8(this.maxAttempts);
        writer.writeUint32(this.combatLevel);
        writer.writeBoolean(this.hasBarrier);
        writer.writeNamespacedObject(this.dimension);
        writer.writeNamespacedObject(this.damageType);
        writer.writeArray(this.attackTypes, (value, writer) => {
            writer.writeString(value);
        });
        writer.writeModifierValues(this._staticModifiers);
        writer.writeModifierValues(this._randomModifiers);
        writer.writeModifierValues(this._staticEnemyModifiers);
        writer.writeModifierValues(this._randomEnemyModifiers);
        writer.writeArray(this._monsters, (value, writer) => {
            writer.writeNamespacedObject(value);
        });
        writer.writeArray(this._floors, (value, writer) => {
            writer.writeUint8(value);
        });
        writer.writeArray(this._scale, (value, writer) => {
            writer.writeUint8(value);
        });
        return writer;
    }

    decode(reader, version) {
        this.attempts = reader.getUint8();
        this.maxAttempts = reader.getUint8();
        this.combatLevel = reader.getUint32();
        this.hasBarrier = reader.getBoolean();
        this.dimension = reader.getNamespacedObject(game.dungeoneering.dimensions);
        this.damageType = reader.getNamespacedObject(game.damageTypes);
        this.attackTypes = reader.getArray((reader) => {
            return reader.getString();
        });
        this._staticModifiers = reader.getModifierValues(this.game, version);
        this._randomModifiers = reader.getModifierValues(this.game, version);
        this._staticEnemyModifiers = reader.getModifierValues(this.game, version);
        this._randomEnemyModifiers = reader.getModifierValues(this.game, version);
        this._monsters = reader.getArray((reader)=>{
            return reader.getNamespacedObject(game.monsters);
        });
        this._floors = reader.getArray((reader)=>{
            return reader.getUint8();
        });
        this._scale = reader.getArray((reader)=>{
            return reader.getUint8();
        });
    }
}