const { loadModule } = mod.getContext(import.meta);

export class DungeoneeringPortalRerollRadioElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeoneering-portal-reroll-radio-template'));
        this.label = getElementFromFragment(this._content, 'label', 'label');
        this.input = getElementFromFragment(this._content, 'input', 'input');
        const id = `dungeoneering-portal-reroll-radio-${DungeoneeringPortalRerollRadioElement.elementCount}`;
        this.input.id = id;
        this.label.htmlFor = id;
        DungeoneeringPortalRerollRadioElement.elementCount++;
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this.label, {
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
    initialize(data, onChange) {
        this.setChecked(data.currentValue);
        this.label.innerHTML = data.label;
        this.input.name = data.name;
        this.input.value = data.value;
        this.input.onchange = onChange;
    }
    setLabel(label) {
        this.label.innerHTML = label;
    }
    setTooltip(tooltip) {
        if(this.tooltip === undefined)
            return;
        console.log(tooltip);
        this.tooltip.setContent(tooltip);
        this.tooltip.enable();
    }
    setChecked(isChecked) {
        this.input.checked = isChecked;
    }
    setValue(value) {
        this.input.value = value;
    }
}
DungeoneeringPortalRerollRadioElement.elementCount = 0;
window.customElements.define('dungeoneering-portal-reroll-radio', DungeoneeringPortalRerollRadioElement);