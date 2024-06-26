const { loadModule } = mod.getContext(import.meta);

export class DungeoneeringPageElement extends HTMLElement  {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-page-template'));
        //this.portals = getElementFromFragment(this._content, 'portals', 'div');
        this.upgrades = getElementFromFragment(this._content, 'upgrades', 'div');
        this.upgradeModifiers = getElementFromFragment(this._content, 'upgrade-modifiers', 'div');
        this.categoryMenu = getElementFromFragment(this._content, 'dungeoneering-category-menu', 'category-menu');
        this.portalMenu = getElementFromFragment(this._content, 'dungeoneering-portal-menu', 'dungeoneering-portal-menu');
        this.portalsSelectionTab = getElementFromFragment(this._content, 'dungeoneering-portal-selection-tab', 'dungeoneering-portal-selection-tab');
        this.categories = new Map();
    }

    connectedCallback() {
        this.appendChild(this._content);
    }

    setUpgradeModifiers(modifiers) {
        this.upgradeModifiers.innerHTML = '';
        this.upgradeModifiers.append(...modifiers.getModifierDescriptionsAsNodes('div'));
    }

    setCategories(categories) {
        categories.forEach(category => {
            this.categories.set(category, document.getElementById(category.id));
        });
        this.categoryMenu.addOptions(categories, 'Select Dungeoneering Category', switchToCategory(this.categories));
    }
}
window.customElements.define('dungeoneering-page', DungeoneeringPageElement);