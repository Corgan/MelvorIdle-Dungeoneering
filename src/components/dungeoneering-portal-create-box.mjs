const { loadModule } = mod.getContext(import.meta);

export class DungeoneeringPortalCreateBoxElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-portal-create-box-template'));
        this.name = getElementFromFragment(this._content, 'name', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }

    setName(name) {
        this.name.textContent = name;
    }
}

window.customElements.define('dungeoneering-portal-create-box', DungeoneeringPortalCreateBoxElement);