const { loadModule, getResourceUrl, version } = mod.getContext(import.meta);

const { DungeoneeringPortalDungeon } = await loadModule('src/dungeoneering-portal-dungeon.mjs');
const { DungeoneeringDimension } = await loadModule('src/dungeoneering-dimension.mjs');
const { DungeoneeringUpgrade } = await loadModule('src/dungeoneering-upgrade.mjs');
const { DungeoneeringCoins } = await loadModule('src/dungeoneering-coins.mjs');

const { DungeoneeringPageElement } = await loadModule('src/components/dungeoneering-page.mjs');

const { DungeoneeringCombatAreaMenuElement } = await loadModule('src/components/dungeoneering-combat-area-menu.mjs');
const { DungeoneeringPortalMenuElement } = await loadModule('src/components/dungeoneering-portal-menu.mjs');

const { DungeoneeringPortalSelectionTabElement } = await loadModule('src/components/dungeoneering-portal-selection-tab.mjs');

const { DungeoneeringPortalCreateBoxElement } = await loadModule('src/components/dungeoneering-portal-create-box.mjs');
const { DungeoneeringPortalRerollBoxElement } = await loadModule('src/components/dungeoneering-portal-reroll-box.mjs');
const { DungeoneeringPortalRerollRadioElement } = await loadModule('src/components/dungeoneering-portal-reroll-radio.mjs');

const { DungeoneeringUpgradeElement } = await loadModule('src/components/dungeoneering-upgrade.mjs');
const { DungeoneeringPortalElement } = await loadModule('src/components/dungeoneering-portal.mjs');

class DungeoneeringRenderQueue extends SkillRenderQueue {
    constructor() {
        super();
        this.upgradeModifiers = false;
        this.portals = false;
        this.selectedPortal = false;
    }
}

export class Dungeoneering extends Skill {
    constructor(namespace, game) {
        super(namespace, 'Dungeoneering', game);
        this.version = parseInt(version.split('.')[1]);
        this.saveVersion = -1;
        this._media = 'assets/dungeoneering.png';
        this.isActive = false;

        this.coins = new DungeoneeringCoins(namespace, game);
        game.currencies.registerObject(this.coins);

        this.dimensions = new NamespaceRegistry(this.game.registeredNamespaces);
        this.portals = new NamespaceRegistry(this.game.registeredNamespaces);
        this.upgrades = new NamespaceRegistry(this.game.registeredNamespaces);

        this.renderQueue = new DungeoneeringRenderQueue();

        this.modifiers = new ModifierTable();
        this.enemyModifiers = new ModifierTable();

        this.upgradeRanks = new Map();
        this.upgradeModifiers = new ModifierTable();

        this.upgradeMenus = new Map();

        this.baseMaxPortals = 10;

        this.page = createElement('dungeoneering-page', {
            id: 'dungeoneering-container',
            classList: ['content', 'd-none']
        });
    }

    get name() { return "Dungeoneering"; }
    get isCombat() { return false; }
    get hasMinibar() { return true; }
    get maxPortals() { return this.baseMaxPortals; }

    getErrorLog() {
        return ``;
    }

    portalMenuOnClick() {
        if(this.portals.allObjects.length >= this.maxPortals) {
            notifyPlayer(this.media, `Can't create more than ${this.maxPortals} portals.`, 'danger');
            return;
        }
        this.createDungeoneeringPortal();
    }

    portalOnClick(portal, elem) {
        if(this.selectedPortalElem !== undefined)
            this.selectedPortalElem.setSelected(false);

        if(this.selectedPortal !== portal) {
            this.selectedPortal = portal;
            this.selectedPortalElem = elem;
            this.selectedPortalElem.setSelected(true);
        } else {
            this.selectedPortal = undefined;
            this.selectedPortalElem = undefined;
        }

        this.page.portalMenu.setPortal(this.selectedPortal);
        this.renderQueue.selectedPortal = true;
    }

    upgradeOnClick(upgrade) {
        if(this.isDungeoneeringPortal(game.combat.selectedArea)) {
            notifyPlayer(this.media, "Can't buy upgrades while in a portal.", 'danger');
            return;
        }
        let menu = this.upgradeMenus.get(upgrade);
        let rank = this.getRankForUpgrade(upgrade);

        if(upgrade.max > 0 && rank >= upgrade.max) {
            notifyPlayer(this.media, "Max rank reached.", 'danger');
            return;
        }

        rank += 1;

        this.upgradeRanks.set(upgrade, rank);
        menu.setRank(rank);
        
        this.calculateModifiers();
    }

    getRankForUpgrade(upgrade) {
        if(this.upgradeRanks.has(upgrade)) {
            return this.upgradeRanks.get(upgrade);
        }
        return 0;
    }
    
    calculateModifiers() {
        this.upgradeModifiers.empty();
        this.upgradeRanks.forEach((rank, upgrade) => {
            this.upgradeModifiers.addModifiers(upgrade, upgrade.modifiers, rank, rank);
        });
        this.renderQueue.upgradeModifiers = true;
    }

    render() {
        super.render();
        this.renderUpgradeModifiers();
        this.renderPortals();
        this.renderSelectedPortal();
    }

    renderUpgradeModifiers() {
        if(!this.renderQueue.upgradeModifiers)
            return;
        this.page.setUpgradeModifiers(this.upgradeModifiers);
        this.renderQueue.upgradeModifiers = false;
    }

    renderSelectedPortal() {
        if(!this.renderQueue.selectedPortal)
            return;
        this.page.portalsSelectionTab.options.forEach(option => {
            option.portal.classList.toggle('bg-light-gray', option.selected);
        });
        this.renderQueue.selectedPortal = false;
    }

    renderPortals() {
        if(!this.renderQueue.portals)
            return;
        this.page.portalsSelectionTab.setPortals(this.portals.allObjects);
        this.renderQueue.portals = false;
    }

    onCombatSpawnEnemy() {
        this.modifiers.empty();
        this.enemyModifiers.empty();
        if(game.combat.selectedArea instanceof DungeoneeringPortalDungeon) {
            this.modifiers.addModifiers(this, game.combat.selectedArea.modifiers);
            this.enemyModifiers.addModifiers(this, game.combat.selectedArea.enemyModifiers);
        }
    }

    renderEnemyImageAndName() {
        if(game.combat.selectedArea instanceof DungeoneeringPortalDungeon) {
            let img = game.combat.enemy.statElements.image.querySelector('.combat-enemy-img');
            if(img) {
                let layer_arr = new Array(5).fill().map(() => createElement('div', {
                    classList: ['glitch__layer'],
                    attributes: [
                        ['style', `background-image: url('${img.src}')`]
                    ]
                }));

                let layers = createElement('div', {
                    classList: ['glitch__layers'],
                    children: layer_arr
                });
                let glitch = createElement('div', {
                    classList: ['glitch'],
                    children: [layers]
                });
                let enemy_img = createElement('div', {
                    classList: ['combat-enemy-img'],
                    attributes: [
                        ['style', 'height: 230px']
                    ],
                    children: [glitch]
                })
                img.remove();
                game.combat.enemy.statElements.image.append(enemy_img);
            }
        }
    }

    onLoad() {
        super.onLoad();
        
        this.calculateModifiers();
        this.renderQueue.upgradeModifiers = true;
        this.renderQueue.portals = true;

        if(game.currentGamemode.allowDungeonLevelCapIncrease === true)
            game.currentGamemode.startingSkills.add(game.dungeoneering);
    }

    addPortalToMenu(portal) {
        let combatCategory = combatAreaMenus.all.get(game.combatAreaCategories.getObjectByID('dungeoneering:Dungeoneering'));
        const combatAreaMenuElement = new DungeoneeringCombatAreaMenuElement();
        combatAreaMenuElement.className = 'col-12 col-md-6 col-xl-4';
        combatAreaMenuElement.setArea(portal);
        combatCategory.container.append(combatAreaMenuElement);
        combatCategory.menuElems.set(portal, combatAreaMenuElement);
        combatAreaMenuElement.updateRequirements(portal);
        this.renderQueue.portals = true;
    }

    removePortalFromMenu(portal) {
        let combatCategory = combatAreaMenus.all.get(game.combatAreaCategories.getObjectByID('dungeoneering:Dungeoneering'));
        let combatAreaMenuElement = combatCategory.menuElems.get(portal);
        combatAreaMenuElement.remove();
        combatCategory.menuElems.delete(portal);
        this.renderQueue.portals = true;
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

    loadUpgrades() {
        const sortedActions = this.upgrades.allObjects;
        sortedActions.forEach((upgrade)=>{
            const upgradeMenu = createElement('dungeoneering-upgrade', {
                className: 'col-12 col-lg-6 col-xl-3'
            });
            this.upgradeMenus.set(upgrade, upgradeMenu);
            this.page.upgrades.append(upgradeMenu);
            upgradeMenu.setUpgrade(upgrade);
        });
    }

    onInterfaceAvailable() {
        document.getElementById('main-container').append(this.page);
    }

    onCharacterLoaded() {
        let category = combatAreaMenus.all.get(game.combatAreaCategories.getObjectByID('dungeoneering:Dungeoneering'));

        this.portals.allObjects.forEach(portal => {
            if(!category.menuElems.has(portal))
                this.addPortalToMenu(portal);
        });
        this.page.setCategories([
            {
                id: 'portals-category',
                name: 'Portals',
                media: this.media
            },
            {
                id: 'upgrades-category',
                name: 'Upgrades',
                media: assets.getURI("assets/media/skills/strength/strength.svg")
            }
        ]);

        this.page.portalMenu.init();

        this.loadUpgrades();
    }

    get guaranteedDungeonModifiers() {
        return [
            ["decreasedDamageReduction", 10, 80],
            ["decreasedMaxHitPercent", 25, 50],
            ["decreasedMaxHitpoints", 10, 50]
        ]
    }

    get guaranteedDungeonEnemyModifiers() {
        return [
            ["increasedDamageReduction", 10, 40],
            ["increasedMaxHitPercent", 50, 200],
            ["increasedMaxHitpoints", 50, 200]
        ]
    }

    get randomDungeonModifiers() {
        return [
            ["decreasedHitpointRegeneration", 50, 100],
            ["decreasedDamageToBosses", 10, 25],
            ["decreasedAutoEatThreshold", 10, 25],
            ["decreasedFoodHealingValue", 25, 50],
            ["increasedAttackIntervalPercent", 10, 50],
            ["increasedPrayerCost", 200, 500]
        ]
    }

    get randomDungeonEnemyModifiers() {
        return [
            ["decreasedAttackIntervalPercent", 10, 50],
            ["increasedLifesteal", 10, 50],
            ["increasedReflectDamage", 10, 50],
            ["increasedMeleeEvasion", 10, 50],
            ["increasedRangedEvasion", 10, 50],
            ["increasedMagicEvasion", 10, 50]
        ]
    }
    
    createDungeoneeringPortal({...args}={}) {
        let {
            minCombatLevel=1,
            maxCombatLevel=2000
        } = args;

        let portal = new DungeoneeringPortalDungeon({
            combatLevel: rollInteger(minCombatLevel, maxCombatLevel),
            ...args
        }, this, this.game);

        this.portals.registerObject(portal);
        this.game.dungeons.registerObject(portal);

        if(game.softDataRegQueue.length > 0) {
            game.softDataRegQueue.forEach(({data,object})=>object.registerSoftDependencies(data, game));
            game.softDataRegQueue = [];
        }
        
        console.log("Created Portal:", portal.id, portal.name);
        this.addPortalToMenu(portal);
        return portal;
    }

    removeDungeoneeringPortal(portal) {
        if(!this.isDungeoneeringPortal(portal))
            return;
        console.log("Removed Portal:", portal.id, portal.name);
        this.game.dungeons.registeredObjects.delete(portal.id);
        this.game.combat.dungeonCompletion.delete(portal);
        this.portals.registeredObjects.delete(portal.id);
        this.removePortalFromMenu(portal);
    }

    isDungeoneeringPortal(portal) {
        return portal instanceof DungeoneeringPortalDungeon;
    }

    registerData(namespace, data) {
        super.registerData(namespace, data);

        if(data.upgrades !== undefined) {
            console.log(`Registering ${data.upgrades.length} Upgrades`);
            data.upgrades.forEach(data => {
                let upgrade = new DungeoneeringUpgrade(namespace, data, this, this.game);
                this.upgrades.registerObject(upgrade);
            });
        }

        if(data.dimensions !== undefined) {
            console.log(`Registering ${data.dimensions.length} Dimensions`);
            data.dimensions.forEach(data => {
                let dimension = new DungeoneeringDimension(namespace, data, this, this.game);
                this.dimensions.registerObject(dimension);
            });
        }
    }

    encode(writer) {
        let start = writer.byteOffset;
        super.encode(writer); // Encode default skill data
        writer.writeUint32(this.version);
        writer.writeMap(this.upgradeRanks, writeNamespaced, (value, writer) => writer.writeUint32(value));
        writer.writeArray(this.portals.allObjects, (value, writer) => {
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
            this.upgradeRanks = reader.getMap(readNamespacedReject(this.upgrades), (reader) => reader.getUint32());
            reader.getArray((reader) => {
                let value = reader.getNamespacedObject(this.portals);
                console.log(`Got ${value.id}, decoding`);
                value.decode(reader);
                return value;
            });

            if(game.softDataRegQueue.length > 0) {
                game.softDataRegQueue.forEach(({data,object})=>object.registerSoftDependencies(data, game));
                game.softDataRegQueue = [];
            }
        } catch(e) { // Something's fucky, dump all progress and skip past the trash save data
            console.log(e);
            reader.byteOffset = start;
            reader.getFixedLengthBuffer(skillDataSize);
        }

        let end = reader.byteOffset;
        console.log(`Read ${end-start} bytes for Dungeoneering save, expected ${skillDataSize}`);

        if(end-start !== skillDataSize) {
            reader.byteOffset = start;
            reader.getFixedLengthBuffer(skillDataSize);
        }
    }
}