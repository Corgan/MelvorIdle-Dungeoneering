const { loadModule, getResourceUrl, version } = mod.getContext(import.meta);

export class DungeoneeringCoins extends Currency {
    constructor(namespace, game) {
        super(namespace, 'DungeonCoins', game);
        this._media = 'assets/coin.png';
        this.travelCostWeight = 1;
        this.type = 'DungeonCoins';
        this.shouldNotify = true;
    }
    get name() {
        return 'Dungeon Coins';
    }
    get gainTemplate() {
        return 'You earned ${curIcon} ${count} Dungeon Coins';
    }
    get usedTemplate() {
        return 'You spent ${curIcon} ${count} Dungeon Coins';
    }
    formatAmount(qtyText) {
        return templateString('${gp} Dungeon Coins', {
            gp: qtyText
        });
    }
    renderMedia() {
        const elements = document.querySelectorAll(`[data-currency-media="${this.id}"]`);
        elements.forEach((element)=>{
            if(element.src !== this.media)
                element.src = this.media;
        });
    }
    render() {
        if (!this.renderRequired)
            return;
        this.renderMedia();
        super.render();
    }
}