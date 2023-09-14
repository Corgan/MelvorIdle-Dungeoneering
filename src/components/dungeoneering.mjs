const { loadModule } = mod.getContext(import.meta);

const { UIComponent } = await loadModule('src/components/ui-component.mjs');

export class DungeoneeringPageUIComponent extends UIComponent {
    constructor() {
        super('dungeoneering-page-component');

        this.page = getElementFromFragment(this.$fragment, 'page', 'div');
    }
}