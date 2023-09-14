export async function setup({ characterStorage, gameData, patch, getResourceUrl, loadTemplates, loadModule, onInterfaceAvailable, onCharacterLoaded }) {
    console.log("Loading Dungeoneering Templates");
    await loadTemplates("templates.html"); // Add templates
  
    console.log("Loading Dungeoneering Module");
    const { Dungeoneering } = await loadModule('src/dungeoneering.mjs');

    game.dungeoneering = game.registerSkill(game.registeredNamespaces.getNamespace('dungeoneering'), Dungeoneering); // Register skill

    console.log("Registering Dungeoneering Data");
    await gameData.addPackage('data.json'); // Add skill data (page + sidebar, skillData)

    console.log('Registered Dungeoneering Data.');

    const _determineRandomSkillsForUnlock = determineRandomSkillsForUnlock;
    window.determineRandomSkillsForUnlock = function(...args) {
        game.dungeoneering.setUnlock(false);
        _determineRandomSkillsForUnlock(...args);
        game.dungeoneering.setUnlock(true);
    }

    patch(CombatManager, 'onSelection').before(function() {
        game.dungeoneering.onCombatSelection();
    });

    patch(CombatManager, 'awardSkillLevelCapIncreaseForDungeonCompletion').before(function(dungeon) {
        if (dungeon.id === "melvorF:Impending_Darkness" || dungeon.id === "melvorTotH:Throne_of_the_Herald") {
            // We do nothing here beacuse it's handled in the base call
        } else if (dungeon.namespace === "melvorTotH") {
            const amount = Math.min(3, 120 - this.game.attack.overrideLevelCap);
            this.game.dungeoneering.increaseLevelCap(amount);
        } else {
            const amount = Math.min(5, 99 - this.game.attack.overrideLevelCap);
            this.game.dungeoneering.increaseLevelCap(amount);
        }
    });

    patch(NamespaceRegistry, 'getObjectByID').replace(function(o, id) {
        let obj = o(id);
        if(obj === undefined && id !== undefined && typeof id === "string" && id.startsWith("dungeoneering")) {
            return game.dungeoneering.handleMissingObject(id);
        }
        return obj;
    });

    onCharacterLoaded(async () => {
        areaMenus.dungeoneering = new CombatAreaMenu('combat-select-area-Dungeoneering', []);
        game.dungeoneering.onCharacterLoaded();
    });

    onInterfaceAvailable(async () => {
        game.dungeoneering.component.mount(document.getElementById('main-container')); // Add skill container
        const dungeons = document.getElementById('combat-select-area-Dungeon');
        dungeons.after(createElement('div', {
            id: 'combat-select-area-Dungeoneering',
            classList: ['row', 'row-deck', 'gutters-tiny', 'mt-3', 'd-none']
        }));

        const selection = document.getElementById('combat-area-selection');
        selection.append(
            createElement('div', {
                classList: ['col-12', 'col-md-6', 'col-xl-4'],
                children: [createElement('a', {
                    id: 'combat-select-Dungeoneering',
                    attributes: [
                        ['onclick', "showCombatArea('Dungeoneering')"]
                    ],
                    classList: ['block', 'block-content', 'block-rounded', 'block-link-pop', 'border-top', 'border-combat', 'border-4x', 'pointer-enabled'],
                    children: [createElement('div', {
                        classList: ['media', 'd-flex', 'align-items-center', 'push'],
                        children: [createElement('div', {
                            classList: ['mr-3'],
                            children: [createElement('img', {
                                classList: ['shop-img'],
                                attributes: [
                                    ['src', game.dungeoneering.media]
                                ]
                            })]
                        }), createElement('div', {
                            classList: ['media-body'],
                            children: [createElement('div', {
                                classList: ['font-w600'],
                                children: [createElement('span', {
                                    text: "Dungeoneering"
                                })]
                            }),
                            createElement('div', {
                                classList: ['font-size-sm'],
                                children: [createElement('small', {
                                    text: "Generate random Dungeons"
                                })]
                            }),
                            createElement('div', {
                                classList: ['font-size-sm'],
                                children: [createElement('small', {
                                    text: "Rewards based on difficulty"
                                })]
                            })]
                        })]
                    })]
                })]
            })
        )
    });
}