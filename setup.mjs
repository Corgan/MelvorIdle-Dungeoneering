export async function setup({ characterStorage, gameData, patch, getResourceUrl, loadTemplates, loadStylesheet, loadModule, onModsLoaded, onInterfaceAvailable, onCharacterLoaded }) {
    console.log("Loading Dungeoneering Templates");
    await loadTemplates("templates.html"); // Add templates
    
    console.log("Loading Dungeoneering Stylesheet");
    await loadStylesheet('style.css');
  
    console.log("Loading Dungeoneering Module");
    const { Dungeoneering } = await loadModule('src/dungeoneering.mjs');
    const { DungeoneeringCombatAreaMenuElement } = await loadModule('src/components/dungeoneering-combat-area-menu.mjs');

    game.dungeoneering = game.registerSkill(game.registeredNamespaces.getNamespace('dungeoneering'), Dungeoneering); // Register skill

    console.log("Registering Dungeoneering Data");
    await gameData.addPackage('data/data.json'); // Add skill data (page + sidebar, skillData)

    if(cloudManager.hasAoDEntitlementAndIsEnabled)
        await gameData.addPackage('data/data-aod.json');

    console.log('Registered Dungeoneering Data.');

    patch(Enemy, 'renderImageAndName').after(function() {
        game.dungeoneering.renderEnemyImageAndName();
    });

    patch(CombatManager, 'spawnEnemy').before(function() {
        game.dungeoneering.onCombatSpawnEnemy();
    });

    patch(BaseManager, 'setCombatArea').before(function(area) {
        if (this.selectedArea === area)
            return;
        if(game.dungeoneering.isDungeoneeringPortal(this.selectedArea)) {
            this.player.modifiers.removeTable(game.dungeoneering.upgradeModifiers);
            this.player.computePostModifierStats();
        }
    });

    patch(BaseManager, 'computeAreaEffects').before(function() {
        if(game.dungeoneering.isDungeoneeringPortal(this.selectedArea)) {
            this.player.modifiers.addTable(game.dungeoneering.upgradeModifiers);
        }
    });

    patch(CombatManager, 'increaseDungeonProgress').after(function(stopCombat) {
        if(game.dungeoneering.isDungeoneeringPortal(this.selectedArea)) {
            if(this.selectedArea.attempts >= this.selectedArea.maxAttempts)
                if (this.areaProgress === 0)
                    return true;
        }
    });

    patch(CombatManager, 'selectDungeon').replace(function(o, dungeon, ...args) {
        if(game.dungeoneering.isDungeoneeringPortal(dungeon)) {
            if(dungeon.attempts >= dungeon.maxAttempts) {
                notifyPlayer(this.game.attack, 'This dungeon portal has been used up.', 'danger');
                return;
            }
        }
        o(dungeon, ...args);
    });

    patch(CombatManager, 'loadNextEnemy').after(function() {
        if(game.dungeoneering.isDungeoneeringPortal(this.selectedArea)) {
            if (this.areaProgress === 0) {
                if(this.selectedArea.attempts < this.selectedArea.maxAttempts) {
                    this.selectedArea.attempts += 1;
                    this.renderQueue.attemptsCount.add(this.selectedArea);
                    game.dungeoneering.renderQueue.portals = true;
                }
            }
        }
    });

    patch(CombatManager, 'initialize').before(function() {
        if(this.renderQueue.attemptsCount === undefined)
            this.renderQueue.attemptsCount = new Set();
        this.game.combatAreas.forEach((area)=>{
            if(area instanceof DungeoneeringCombatAreaMenuElement) {
                this.renderQueue.attemptsCount.add(area);
            }
        });
    });
    patch(CombatManager, 'render').after(function() {
        this.renderCompletionCount();
    });

    CombatManager.prototype.renderCompletionCount = function() {
        this.renderQueue.attemptsCount.forEach((area)=>{
            combatAreaMenus.all.forEach((menu)=>menu.updateAttemptsCount(area));
        });
        this.renderQueue.attemptsCount.clear();
    }
    
    CombatAreaMenu.prototype.updateAttemptsCount = function(area) {
        const menu = this.menuElems.get(area);
        menu === null || menu === void 0 ? void 0 : menu.updateAttemptsCount(area);
    }

    patch(CombatManager, 'addDungeonCompletion').replace(function(o, dungeon, ...args) {
        if(game.dungeoneering.isDungeoneeringPortal(dungeon)) {
        } else {
            o(dungeon, ...args);
        }
    });

    patch(ViewMonsterListTableRowElement, 'setRow').after(function(_, monster, count) {
        if(monster.isDungeoneering !== undefined && monster.isDungeoneering === true)
            this.setSeenMonster(monster, count);
    });

    patch(NamespaceRegistry, 'getObjectByID').replace(function(o, id) {
        let obj = o(id);
        if(obj === undefined && id !== undefined && typeof id === "string" && id.startsWith("dungeoneering")) {
            return game.dungeoneering.handleMissingObject(id);
        }
        return obj;
    });

    onModsLoaded(async () => {
        if(cloudManager.hasAoDEntitlementAndIsEnabled) {
            const levelCapIncreases = ['dungeoneering:Pre99Dungeons', 'dungeoneering:ImpendingDarknessSet100'];

            if(cloudManager.hasTotHEntitlementAndIsEnabled) {
                levelCapIncreases.push(...['dungeoneering:Post99Dungeons', 'dungeoneering:ThroneOfTheHeraldSet120']);
            }

            const gamemodes = game.gamemodes.filter(gamemode => gamemode.defaultInitialLevelCap !== undefined && gamemode.levelCapIncreases.length > 0 && gamemode.useDefaultSkillUnlockRequirements === true && gamemode.allowSkillUnlock === false);

            await gameData.addPackage({
                $schema: '',
                namespace: 'dungeoneering',
                modifications: {
                    gamemodes: gamemodes.map(gamemode => ({
                        id: gamemode.id,
                        levelCapIncreases: {
                            add: levelCapIncreases
                        },
                        startingSkills: {
                            add: ['dungeoneering:Dungeoneering']
                        },
                        skillUnlockRequirements: [
                            {
                                skillID: 'dungeoneering:Dungeoneering',
                                requirements: [
                                    {
                                        type: 'SkillLevel',
                                        skillID: 'melvorD:Attack',
                                        level: 1
                                    }
                                ]
                            }
                        ]
                    }))
                }
            });
        }
    
        patch(EventManager, 'loadEvents').after(() => {
            if(game.currentGamemode.startingSkills !== undefined && game.currentGamemode.startingSkills.has(game.dungeoneering)) {
                game.dungeoneering.setUnlock(true);
            }
        });
    });

    onCharacterLoaded(async () => {
        await game.dungeoneering.onCharacterLoaded();
    });

    onInterfaceAvailable(async () => {
        await game.dungeoneering.onInterfaceAvailable();
    });
}