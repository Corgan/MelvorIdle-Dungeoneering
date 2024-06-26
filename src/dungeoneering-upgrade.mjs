const { loadModule, getResourceUrl, version } = mod.getContext(import.meta);

export class DungeoneeringUpgrade extends NamespacedObject {
    constructor(namespace, data, manager, game) {
        super(namespace, data.id);
        this.manager = manager;
        this.game = game;
        this.name = data.name;
        this._media = data.media;
        this.modifiers = game.getModifierValuesFromData(data.modifiers);
        this.max = data.max !== undefined ? data.max : 0;
    }

    get media() {
        return this.getMediaURL(this._media);
    }

    get rank() {
        return this.manager.getRankForUpgrade(this);
    }
}