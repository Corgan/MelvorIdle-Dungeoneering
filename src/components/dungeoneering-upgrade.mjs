const { loadModule } = mod.getContext(import.meta);

export class DungeoneeringUpgradeElement extends HTMLElement  {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-upgrade-template'));
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.rank = getElementFromFragment(this._content, 'rank', 'small');
        this.max = getElementFromFragment(this._content, 'max', 'small');
        this.icon = getElementFromFragment(this._content, 'icon', 'img');
        this.modifiers = getElementFromFragment(this._content, 'modifiers', 'div');
        this.upgrade = getElementFromFragment(this._content, 'upgrade', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setUpgrade(upgrade) {
        this.name.textContent = upgrade.name;
        if(upgrade.max > 0) {
            this.max.classList.remove('d-none');
            this.max.textContent = ` / ${upgrade.max}`;
        }
        this.icon.src = upgrade.media;
        this.upgrade.onclick = ()=>game.dungeoneering.upgradeOnClick(upgrade);
        this.setRank(upgrade.rank);
        this.modifiers.innerHTML = '';
        this.modifiers.append(...getSpansFromModifierObject(upgrade.modifiers));
    }
    setRank(rank) {
        this.rank.textContent = `Rank ${rank}`;
    }
}
window.customElements.define('dungeoneering-upgrade', DungeoneeringUpgradeElement);