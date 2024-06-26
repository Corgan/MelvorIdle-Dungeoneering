const { loadModule, getResourceUrl, version } = mod.getContext(import.meta);

export class DungeoneeringDimension extends NamespacedObject {
    constructor(namespace, data, manager, game) {
        super(namespace, data.id);
        this.manager = manager;
        this.game = game;
        this.name = data.name;
        this._media = data.media;
        this.modifiers = game.getModifierValuesFromData(data.modifiers);
        this.enemyModifiers = game.getModifierValuesFromData(data.enemyModifiers);
    }

    get media() {
        return this.getMediaURL(this._media);
    }
}