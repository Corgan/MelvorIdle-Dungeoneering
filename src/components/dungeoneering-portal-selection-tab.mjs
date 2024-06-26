const { loadModule } = mod.getContext(import.meta);

const { DungeoneeringPortalElement } = await loadModule('src/components/dungeoneering-portal.mjs');

export class DungeoneeringPortalSelectionTabElement extends HTMLElement {
    constructor() {
        super();
        this.portals = [];
        this.options = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-portal-selection-tab-template'));
        this.portalContainer = getElementFromFragment(this._content, 'portal-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setPortals(portals) {
        while (this.options.length < portals.length)
            this.addOption();
        this.options.forEach((option, i) => {
            if (i >= portals.length) {
                hideElement(option);
                return;
            } else
                showElement(option);
            const portal = portals[i];
            option.setPortal(portal);
        });
        this.portals = portals;
    }
    addOption() {
        const newOption = createElement('dungeoneering-portal', {
            className: 'col-12 col-md-6',
            parent: this.portalContainer
        });
        this.options.push(newOption);
    }
}
window.customElements.define('dungeoneering-portal-selection-tab', DungeoneeringPortalSelectionTabElement);