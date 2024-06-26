const { loadModule } = mod.getContext(import.meta);

export class DungeoneeringPortalElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-portal-template'));
        this.portal = getElementFromFragment(this._content, 'portal', 'a');
        this.icon = getElementFromFragment(this._content, 'icon', 'img');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.selected = false;
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this, {
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    disconnectedCallback() {
        if(this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    setPortal(portal) {
        this.name.textContent = portal.name;
        this.icon.src = portal.media;
        this.portal.onclick = () => {
            game.dungeoneering.portalOnClick(portal, this);
        };
        this.updateTooltip(portal);
    }
    updateTooltip(portal) {
        if(this.tooltip === undefined)
            return;
        this.tooltip.setContent(`<div class="font-size-2sm font-w600 text-center text-muted"><span class="text-combat-smoke"><b>Player</b>:</br>${describeModifierDataLineBreak(portal.modifiers)}</br><b>Enemy</b>:</br>${describeModifierDataLineBreak(portal.enemyModifiers)}</span></div>`);
        this.tooltip.enable();
    }
    setSelected(selected) {
        this.selected = selected;
    }
}
window.customElements.define('dungeoneering-portal', DungeoneeringPortalElement);