const { loadModule } = mod.getContext(import.meta);

export class DungeoneeringPortalMenuElement extends HTMLElement {
    constructor() {
        super();
        this.noneSelected = true; 
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-portal-menu-template'));

        this.portalAction = getElementFromFragment(this._content, 'portal-action', 'small');
        this.portalImage = getElementFromFragment(this._content, 'portal-image', 'img');
        this.portalName = getElementFromFragment(this._content, 'portal-name', 'span');
        this.portalDescription = getElementFromFragment(this._content, 'portal-description', 'small');

        this.createRow = getElementFromFragment(this._content, 'create-row', 'div');
        this.createBox = getElementFromFragment(this._content, 'create-box', 'dungeoneering-portal-create-box');

        this.rerollRow = getElementFromFragment(this._content, 'reroll-row', 'div');
        this.rerollBox = getElementFromFragment(this._content, 'reroll-box', 'dungeoneering-portal-reroll-box');

        this.createButton = getElementFromFragment(this._content, 'create-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init() {
        this.setCreatePortal();
        this.createButton.onclick = () => {
            game.dungeoneering.portalMenuOnClick(),
            this.createButton.blur();
        };
    }
    setSelected() {
        if(this.noneSelected) {
            this.noneSelected = false;
        }
    }
    setCreatePortal() {
        this.portalImage.src = game.dungeoneering.media;
        this.portalName.textContent = "Create New Portal";
        this.createRow.classList.remove('d-none');
        this.rerollRow.classList.add('d-none');
        this.createButton.innerText = 'Create';
        this.portalAction.innerText = 'Create';
    }
    setPortal(portal) {
        if(portal !== undefined) {
            this.portalImage.src = portal.media;
            this.portalName.textContent = portal.name;
            this.rerollRow.classList.remove('d-none');
            this.createRow.classList.add('d-none');
            this.createButton.innerText = 'Reroll';
            this.portalAction.innerText = 'Reroll';
            this.rerollBox.setPortal(portal);
        } else {
            this.setCreatePortal();
        }
    }
    setRequirements(items, currencies, game) {

    }
}
window.customElements.define('dungeoneering-portal-menu', DungeoneeringPortalMenuElement);