const { loadModule, getResourceUrl, version } = mod.getContext(import.meta);

const { DungeoneeringPageUIComponent } = await loadModule('src/components/dungeoneering.mjs');

class DungeoneeringCombatAreaMenuElement extends CombatAreaMenuElement {
    constructor() {
        super();
    }
    setAreaEffect(area) {
      if (area instanceof DungeoneeringPortalDungeon) {
        showElement(this.areaEffectContainer);
        if (area.areaEffect === undefined) {
          this.areaEffectContainer.classList.replace('text-danger', 'text-success');
          this.effectDescription.textContent = getLangString('COMBAT_MISC_NO_AREA_EFFECT');
        } else {
          this.areaEffectContainer.classList.replace('text-success', 'text-danger');
          this.effectDescription.textContent = area.areaEffectDescription;
        }
      } else {
        hideElement(this.areaEffectContainer);
      }
    }
}
window.customElements.define('dungeoneering-combat-area-menu', DungeoneeringCombatAreaMenuElement);
class DungeoneeringPortalDungeon extends Dungeon {
    constructor({id='p' + Math.random().toString(36).slice(-5)}, manager, game) {
        super(game.registeredNamespaces.getNamespace('dungeoneering'), {
            id,
            name: '',
            media: "assets/dungeoneering.png",
            monsterIDs: [],
            difficulty: [0],
            entryRequirements: [],
            rewardItemIDs: [],
            dropBones: false,
            pet: {
                petID: 'dungeoneering:Mimic',
                weight: 20000
            },
            fixedPetClears: false,
            pauseOnBosses: false,
            skillUnlockCompletions: 0
        }, game);
        this.manager = manager;
        this.game = game;
        this._monsters = [];
        this._floors = [];
    }

    set clears(_) { }
    get clears() { return 5; }

    set clearCount(_) { }
    get clearCount() { return 0; }

    set name(_) { }
    get name() {
        return `Dungeoneering Dungeon ${this._localID}`;
    }

    set monsters(_) { }
    get monsters() {
        if(this._monsters.length === 0)
            this.generateMonsters();
        return this._monsters;
    }

    set floors(_) { }
    get floors() {
        return this._floors;
    }
    
    get areaEffectDescription() {
        return `${describeModifierDataPlain(this.modifiers)}, ${describeModifierDataPlain(this.enemyModifiers)}`;
    }

    set modifiers(_) { }
    get modifiers() {
        return {
            "decreasedHitpointRegeneration": 100
        }
    }

    set enemyModifiers(_) { }
    get enemyModifiers() {
        return {
            "increasedDamageReduction": 10
        }
    }

    generateMonsters(hasBarrier=false) {//, combatLevel=rollInteger(10, 4000)) {
        this._floors = [];
        const boss = getRandomArrayElement(game.monsters.allObjects.filter(monster => monster.isBoss && monster.hasBarrier === hasBarrier));
        for(let i=0; i<rollInteger(4, 8); i++) {
            let floorMonster = getRandomArrayElement(game.monsters.allObjects.filter(monster => !monster.isBoss && monster.combatLevel < boss.combatLevel && monster.hasBarrier === hasBarrier));
            console.log(boss.combatLevel / floorMonster.combatLevel);
            let floorMonsterCount = rollInteger(3, 8);
            this._floors.push(floorMonsterCount);
            for(let j=0; j<floorMonsterCount; j++) {
                this._monsters.push(floorMonster);
            }
        }
        this._floors.push(1);
        this._monsters.push(boss);
    }

    encode(writer) {

        return writer;
    }

    decode(reader, version) {

    }
}

class DungeoneeringRenderQueue extends MasterySkillRenderQueue {
    constructor() {
        super();
    }
}

export class Dungeoneering extends SkillWithMastery {
    constructor(namespace, game) {
        super(namespace, 'Dungeoneering', game);
        this.version = parseInt(version.split('.')[1]);
        this.saveVersion = -1;
        this._media = 'assets/dungeoneering.png';
        this.isActive = false;

        this.portals = new NamespaceRegistry(this.game.registeredNamespaces);

        this.renderQueue = new DungeoneeringRenderQueue();

        this.component = new DungeoneeringPageUIComponent();

        this.modifiers = new MappedModifiers();
        this.enemyModifiers = new TargetModifiers();
    }

    get name() { return "Dungeoneering"; }
    get isCombat() { return false; }
    get hasMinibar() { return true; }

    getErrorLog() {
        return ``;
    }
    
    getTotalUnlockedMasteryActions() {
        return this.actions.reduce(levelUnlockSum(this), 0);
    }

    onCombatSelection() {
        this.modifiers.reset();
        this.enemyModifiers.reset();
        if(game.combat.selectedArea instanceof DungeoneeringPortalDungeon) {
            console.log(game.combat.selectedArea);
        }
    }

    onLoad() {
        super.onLoad();

        if(game.currentGamemode.allowDungeonLevelCapIncrease === true)
            game.currentGamemode.startingSkills.add(game.enchanting);
    }

    checkForPortal(portal) {
        if(portal.clearCount >= portal.clears)
            return false;
        return true;
    }

    addPortalToMenu(portal) {
        const element = new DungeoneeringCombatAreaMenuElement();
        element.className = 'col-12 col-md-6 col-xl-4';
        element.setArea(portal);
        areaMenus.dungeoneering.container.append(element);
        areaMenus.dungeoneering.menuElems.set(portal, element);
        element.updateRequirements(portal);
        return element;
    }

    handleMissingObject(namespacedID) {
        let [ namespace, id ] = namespacedID.split(':');
        if(this.portals.getObject(namespace, id) !== undefined)
            return this.portals.getObject(namespace, id);
        
        let obj;
        switch (id[0]) {
            case "p":
                obj = new DungeoneeringPortalDungeon({id}, this, this.game);
                break;
            default:
                break;
        }
        if(obj !== undefined) {
            this.portals.registerObject(obj);
            this.game.dungeons.registerObject(obj);
        }
        return obj;
    }

    onCharacterLoaded() {
        if(game.currentGamemode.allowDungeonLevelCapIncrease === true && !this.isUnlocked)
            this.setUnlock(true);
        
        this.portals.allObjects.forEach(portal => {
            if(!areaMenus.dungeoneering.menuElems.has(portal))
                this.addPortalToMenu(portal);
        });
    }
    
    createDungeoneeringPortal() {
        let portal = new DungeoneeringPortalDungeon({}, this, this.game);
        this.portals.registerObject(portal);
        this.game.dungeons.registerObject(portal);

        if(game.softDataRegQueue.length > 0) {
            game.softDataRegQueue.forEach(([data,object])=>object.registerSoftDependencies(data, game));
            game.softDataRegQueue = [];
        }
        
        console.log("Created Portal:", portal.id, portal.name);
        this.addPortalToMenu(portal);
        return portal;
    }

    removeDungeoneeringPortal(portal) {
        if(item.constructor !== DungeoneeringPortalDungeon)
            return;
        if(this.checkForPortal(item))
            return;
        console.log("Removed Portal:", portal.id, portal.name);
        this.game.dungeons.registeredObjects.delete(portal.id);
        this.equipment.registeredObjects.delete(portal.id);
    }

    encode(writer) {
        let start = writer.byteOffset;
        super.encode(writer); // Encode default skill data
        writer.writeUint32(this.version);
        writer.writeArray(this.portals.allObjects.filter((portal) => this.checkForPortal(portal)), (value, writer) => {
            writer.writeNamespacedObject(value);
            value.encode(writer);
        });
        let end = writer.byteOffset;
        console.log(`Wrote ${end-start} bytes for Dungeoneering save`);
        return writer;
    }

    decode(reader, version) {
        console.log("Dungeoneering save decoding");
        let start = reader.byteOffset;
        reader.byteOffset -= Uint32Array.BYTES_PER_ELEMENT; // Let's back up a minute and get the size of our skill data
        let skillDataSize = reader.getUint32();

        try {
            super.decode(reader, version);
            this.saveVersion = reader.getUint32();
            reader.getArray((reader) => {
                let value = reader.getNamespacedObject(this.portals);
                console.log(`Got ${value.id}, decoding`);
                value.decode(reader);
                return value;
            });

            if(game.softDataRegQueue.length > 0) {
                game.softDataRegQueue.forEach(([data,object])=>object.registerSoftDependencies(data, game));
                game.softDataRegQueue = [];
            }
        } catch(e) { // Something's fucky, dump all progress and skip past the trash save data
            console.log(e);
            reader.byteOffset = start;
            reader.getFixedLengthBuffer(skillDataSize);
        }

        let end = reader.byteOffset;
        console.log(`Read ${end-start} bytes for Dungeoneering save`);
    }
}

