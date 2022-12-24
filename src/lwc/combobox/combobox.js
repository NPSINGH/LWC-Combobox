import { LightningElement, track, api } from 'lwc';
import {uniqueStrGenerator,deepClone,evaluateExpression,syncComboboxAttributes,handleSelectionRemovalAction,clearSelectionOnAutocomplete,handleKeyUpOnInput,handleOptionClickAction,handleOptionHoverAction,handleDropdownOnInputClick,handleKeyDownOnInput,openAndCloseDropdown,preventAndStopEvent} from './comboboxHelper';
const SEPERATOR = ';',
    MAX_OPTION_DISPLAY = 3,
    DEFAULT_SEARCH_TEXT = "Start typing to search.",
    NO_MATCH_FOUND = "No results for ",
    LOADING_TEXT = 'Please Wait...',
    RESTRICT_OBJECT_KEYS = ['label', 'value', '_label'],
    VALIDATION = [{ name: "REQUIRED", condition: "(value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) ? true : false", message: "Complete this field", custom: false }];
export default class Combobox extends LightningElement {
uniqueId = uniqueStrGenerator(); // generate this Id to use in the attribute mapping

@track comboboxObj = {
    compObj: this,
    variant: 'standard',
    readOnly: false,
    multiselect: false,
    label: '',
    name: '',
    placeholder: '',
    hasError: false,
    errorMsg: '',
    helpText: '',
    options:[],
    dropdownList:[],
    lazySearch: false,
    isLoading: false,

    _required: false,
    _hasFocus: false,
    _isDropdownVisibile: false,
    _cbIdAttr: 'combobox-id-'+this.uniqueId,
    _cbLabelIdAttr: 'combobox-label-id-'+this.uniqueId,
    _cbSelectIdAttr: 'combobox-id-'+this.uniqueId+'-selected-value',
    _listboxIdAttr: 'listbox-id-'+this.uniqueId,
    _fieldErrorIdAttr: 'field-error-id-'+this.uniqueId,
    _searchTerm: '',
    _disabled: false,
    _autocomplete: false,
    _isValueObj: false,
    _selectedValues: [],

    get _showSearchText() {
        if (this.lazySearch && !(this.options && this.options.length > 0)) {
            return true;
        }
        return false;
    },
    get _defaultSearchText() {
        return this.isLoading ? LOADING_TEXT : this._searchTerm ? NO_MATCH_FOUND + '"' + this._searchTerm + '"' : DEFAULT_SEARCH_TEXT;
    },
    get autocomplete() {
        return this._autocomplete || this.lazySearch;
    },
    set autocomplete(value) {
        this._autocomplete = value;
    },
    get required(){
        return this._required;
    },
    set required(value){
        this._required = value;
        if(this.compObj._connected){
            this.compObj.runValidationRules();
        }
    },
    get _showHelpText(){
        return this.helpText ? true : false;
    },
    get _builtInValidation(){
        let _validations = [];
        if(this.required) {
            _validations.push('REQUIRED');
        }
        return _validations;
    },
    get _selectedOptions(){
        return this._selectedValues;
    },
    get _showPillSelector(){
        return this.multiselect && this.autocomplete && this._selectedOptions.length > 0 ? true : false;
    },
    get disabled(){
        return this.readOnly || this._disabled;
    },
    set disabled(value) {
        this._disabled = value;
    },
    get _autoHideInput(){
        return this.autocomplete && this.multiselect && !this._hasFocus && this._selectedOptions.length > 0 && !this.hasError ? true : false;
    },
    get value() {
        return this._isValueObj ? this._selectedValues : this._value;
    },
    set value(val) {
        if (!val) {
            val = [];
        }
        if (typeof val === 'object') {
            val = deepClone(val);
        }
        else {
            if (typeof val === 'string' && val.trim() === '') {
                val = new Array();
            }
            else {
                // parse for JSON
                try {
                    val = JSON.parse(val);
                    // check if val is an object
                    if (typeof val === 'object') {
                        this._isValueObj = true; // set value as an object
                    }
                    else {
                        val = this.compObj.convertToObject(val.toString());
                    }
                }
                catch (e) {
                    this._isValueObj = false;
                    console.warn('Supplied value is not a valid Object. Converting to JS Object');
                    val = this.compObj.convertToObject(val); // convert to object with label/value pair
                }
            }
        }
        // if the value already exist remove it
        let valueList = []; 
        if (!Array.isArray(val) || (Array.isArray(val) && val.length > 0)) {
            if (this._selectedValues.length > 0) {
                if (this.multiselect) {
                    // search for the existing value if any
                    valueList = deepClone(this._selectedValues);
                    const valueIndex = valueList.findIndex(ele => ele.value === val.value);
                    if (valueIndex > -1) {
                        valueList.splice(valueIndex, 1); // splice the element
                    }
                    else {
                        valueList.push(val);
                    }
                }
                else {
                    valueList = Array.isArray(val) ? val : [...valueList, val];
                }
            }
            else {
                valueList = Array.isArray(val) ? val : [...valueList, val];
            }
        }

        if (!compareArrayObject(valueList, this._selectedValues)) { // if the values are not same
            valueList = this.compObj.prepareSelectedValueList(valueList);
            this._selectedValues = valueList;
            this.compObj.dispatchChangeEvent(this._value, valueList);

            // check for validation Rules
            if(this.compObj._connected){
                this.compObj.runValidationRules();
            }
        }
    },
    get _valueDisplay(){
        if(this._searchTerm && this.autocomplete){
            return this._searchTerm;
        }
        if(this.autocomplete && this.multiselect){
            return '';
        }

        //else if ()
        let valueDisplay = '';
        let selectedOptions = this._selectedValues;
        if(selectedOptions && selectedOptions.length > 0){
            if(selectedOptions.length > MAX_OPTION_DISPLAY){
                valueDisplay = selectedOptions.length + ' options selected';
            }
            else{
                valueDisplay = selectedOptions.map(data => data.label).join(SEPERATOR);
            }
        }
        return valueDisplay;
    },
    get _value() {
        return this._selectedValues ? this._selectedValues.map(obj => obj.value).join(SEPERATOR) : '';
    },
    get _clearMode(){
        return this.autocomplete && (this.value && this.value.length > 0 && !this.multiselect) ? true : false;
    },
    get _computedInputClass(){
        return this._clearMode ? 'slds-input slds-combobox__input selection-input slds-combobox__input-value' : 'slds-input slds-combobox__input selection-input';
    },
    get _dropdownTriggerClass(){
        return this._isDropdownVisibile ? 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    },
    get _computedLabelVariant(){
        return this.variant === 'label-hidden' ? 'slds-form-element__label slds-assistive-text' : 'slds-form-element__label';
    },
    get _computedFormLayoutVariant(){
        return this.variant === 'label-stacked' ? 'slds-form-element slds-form-element_stacked' : this.variant === 'label-inline' ? 'slds-form-element slds-form-element_horizontal' : 'slds-form-element';
    },
    get _computedFormElementClass(){
        return this.hasError ? this._computedFormLayoutVariant + ' slds-has-error' : this._computedFormLayoutVariant;
    },
    get _computedInputRole (){
        return this.readOnly ? 'none' : 'combobox';
    },
    get _ariaLabelledAttr(){
        return this._cbLabelIdAttr + ' ' + this._cbSelectIdAttr;
    },
    get _placeholder(){
        return this.placeholder ? this.placeholder : this.autocomplete ? 'Search...' : this.multiselect ? 'Select Multiple Options' : 'Select an Option';
    },
    get _disableDropdown(){
        return this._clearMode ? true : false;
    }
}
 _cancelBlur = false;
 _connected = false;

// @api properties
    @api get lazySearch() {
        return this.comboboxObj.lazySearch;
    }
    set lazySearch(value) {
        value = typeof value === 'string' ? value.toLowerCase() === 'true' ? true : false : value ? value : false;
        this.comboboxObj.lazySearch = value;
    }

@api get label(){
    this.comboboxObj.label;
}
set label(value){
    this.comboboxObj.label = value;
}

@api get name(){
    this.comboboxObj.name;
}
set name(value){
    this.comboboxObj.name = value;
}

@api get validation(){
    return VALIDATION;
}
set validation(value){
    if(typeof value === 'object' && value.length > 0){
        let rules = deepClone(value);
        this.prepareValidationRules(rules);
        // run the rules
        this.runValidationRules();
    }
    else{
        console.warn('An Empty object passed in Combobox[validation] attribute, please check the passed "validation" parameter');
    }
}

@api get disabled(){
    this.comboboxObj._disabled;
}
set disabled(value){
    value = typeof value  === 'string' ? value.toLowerCase() === 'true' ? true : false : value ? value : false;
    this.comboboxObj.disabled = value;
    syncComboboxAttributes(this);
}

@api get required(){
    this.comboboxObj.required;
}
set required(value){
    value = typeof value  === 'string' ? value.toLowerCase() === 'true' ? true : false : value ? value : false;
    this.comboboxObj.required = value;
}

@api get fieldLevelHelp(){
    return this.comboboxObj.helpText;
}
set fieldLevelHelp(value){
    this.comboboxObj.helpText = value;
}

@api get autocomplete(){
    this.comboboxObj.autocomplete;
}
set autocomplete(value){
    value = typeof value  === 'string' ? value.toLowerCase() === 'true' ? true : false : value ? value : false;
    this.comboboxObj.autocomplete = value;
}

@api get multiselect(){
    this.comboboxObj.multiselect;
}
set multiselect(value){
    value = typeof value  === 'string' ? value.toLowerCase() === 'true' ? true : false : value ? value : false;
    this.comboboxObj.multiselect = value;
}

@api get placeholder(){
    this.comboboxObj._placeholder;
}
set placeholder(value){
    this.comboboxObj.placeholder = value;
}

@api get options(){
    return this.comboboxObj.options;
}
set options(value){
    if(typeof value === 'object' && value.length > 0){
        this.comboboxObj.options = this.prepareDropdownOptionList(deepClone(value));
        this.comboboxObj.dropdownList =  this.prepareDropdownOptionList(deepClone(value));
    }
    else{
        console.warn('An Empty object passed in Combobox[options] attribute, please check the passed "options" parameter');
    }
}

@api get readOnly(){
    return this.comboboxObj.readOnly;
}
set readOnly(value){
    value = typeof value  === 'string' ? value.toLowerCase() === 'true' ? true : false : value ? value : false;
    this.comboboxObj.readOnly = value;
}

@api get variant(){
    return this.comboboxObj.variant;
}
set variant(value){
    this.comboboxObj.variant = value;
}


@api get value(){
    return this.comboboxObj.value;
}
set value(value){
    if (typeof value !== 'string') {
        this.comboboxObj._isValueObj = true;
    }
    else {
        this.comboboxObj._isValueObj = false;
    }
    this.comboboxObj.value = value;
}

// @api methods 
    @api checkValidity() {
        return !this.runValidationRules();
    }

    @api setCustomValidity(message, condition = 'true') {
        this.setCustomErrorMessage(message, condition);
    }

    @api processSearchResult(data) {
        this.comboboxObj.options = this.prepareDropdownOptionList(deepClone(data));
        this.comboboxObj.dropdownList = this.prepareDropdownOptionList(deepClone(data));
        // reset the loading
        this.comboboxObj.isLoading = false;
    }

// internal component logic

    convertToObject(value) {
        // check whether the supplied input is valid JSON array or not
        let valueObj = new Array();
        // not a valid JSON fallback to parse the string of comma seperated
        const valueArray = value.split(SEPERATOR);
        valueArray.forEach(element => {
            valueObj.push({ label: '', value: element });
        });
        return valueObj
    }

    trimObject(val) {
        if (Array.isArray(val)) { // check if it is array
            if (val.length > 0) {
                val.forEach(obj => {
                    obj = this.trimObjectToValuePair(obj);
                });
            }
        }
        else {
            obj = this.trimObjectToValuePair(obj);
        }
        return val;
    }

    trimObjectToValuePair(obj) {
        for (let key in obj) {
            if (!RESTRICT_OBJECT_KEYS.includes(key.toLocaleLowerCase())) {
                delete obj[key];
            }
        }
        return obj;
    }
 
connectedCallback(){
    //console.log('In Combobox connected Callback');
    this._connected = true;
}

handleLabelClick(event){
    this.comboboxObj._hasFocus = true;
}

handleInputFocus(event){
    this.comboboxObj._hasFocus = true;
}

handleSelectInputBlur(event){
    event.preventDefault();
    event.stopPropagation();
    if (this._cancelBlur) {
        return;
    }
    this.comboboxObj._hasFocus = false;
    this.runValidationRules();
    openAndCloseDropdown('close',this);
}

handleOptionClick(event){
    event.stopPropagation();
    event.preventDefault();
    handleOptionClickAction(event,this);
}

handleOptionHover(event){
    event.stopPropagation();
    event.preventDefault();
    handleOptionHoverAction(event,this);
}

handleListboxScroll(event) {
    event.stopPropagation();
}

handlePillContainerClick(event){
    event.preventDefault();
    event.stopPropagation();
    this.comboboxObj._hasFocus = true;
}

handleInputKeyDown(event){
    //console.log('In key press: '+event.key);
    if(this.comboboxObj.readOnly || this.comboboxObj.disabled || (this.comboboxObj._disableDropdown && (event.key.toLowerCase() !== 'delete' && event.key.toLowerCase() !== 'backspace'))){
        return;
    }
    handleKeyDownOnInput(event,this);
}

handleInputKeyUp(event){
    //console.log(event);
    if(this.comboboxObj.readOnly || this.comboboxObj.disabled || this.comboboxObj._disableDropdown){
        return;
    }
    handleKeyUpOnInput(event,this);
}

handleInputClick(event){
    // first need to check for readOnly and Disabled flag
    event.stopPropagation();
    event.preventDefault();
    if(this.comboboxObj.readOnly || this.comboboxObj.disabled || this.comboboxObj._disableDropdown){
        return;
    }
    handleDropdownOnInputClick(event,this);
}

handleDropdownMouseDown(event){
    event.stopPropagation();
    event.preventDefault();
    const mainButton = 0;
    if (event.button === mainButton) {
        this._cancelBlur = true;
    }
}

handleClearAction(event){
    preventAndStopEvent(event);
    if(this.comboboxObj.autocomplete){
        clearSelectionOnAutocomplete(this);
    }
}

handleDropdownMouseUp(event) {
    event.stopPropagation();
    event.preventDefault();
    this._cancelBlur=false;
}

handleSelectionRemoval(event){
    handleSelectionRemovalAction(event,this);
}

    prepareSelectedValueList(options) {
        const comboboxObj = this.comboboxObj;
        for (let obj of options) {
            obj._label = obj.label ? obj.label : '';
            obj.value = obj.value ? obj.value : '';
            //obj.selected = obj.selected ? obj.selected : false;
            Object.defineProperty(obj, 'label', {
                get() {
                    let label = '';
                    if (this._label) {
                        label = this._label;
                    }
                    else {
                        if (!comboboxObj.lazySearch) {
                            const obj1 = comboboxObj.options.find(opt => opt.value.toString() === this.value.toString());
                            if (obj1) {
                                label = obj1.label;
                            }
                            else {
                                label = this.value;
                            }
                        }
                        else {
                            label = this.value;
                        }
                    }
                    return label;
                }
            });
        }
        return options;
    }

prepareDropdownOptionList(options){
    const comboboxObj = this.comboboxObj;
    for(let obj of options){
        obj.label = obj.label ? obj.label : '';
        obj.value = obj.value ? obj.value : '';
        obj.description = obj.description ? obj.description : '';
        //obj.selected = obj.selected ? obj.selected : false;
        // automated properties for dropdown options
        Object.defineProperty(obj, '_id', {
            value: uniqueStrGenerator()
        });
        Object.defineProperty(obj, 'selected', {
            get(){
                let val = false;
                if (comboboxObj._selectedValues.length > 0) {
                    val = comboboxObj._value.split(SEPERATOR).includes(this.value.toString());
                }
                return val;
            }
        });
    }
    return options;
}

setCustomErrorMessage(msg,cond){
    let dataObj = {name:"_custom",condition:cond,message:msg,custom:true};
    // search and find existing element with this name
    const objIndex = VALIDATION.findIndex(obj => obj.name === dataObj.name);
    if(objIndex > -1){
        VALIDATION[objIndex] = dataObj;
    }
    else{
        VALIDATION.push(dataObj);
    }

    // run the validation rules
    this.runValidationRules();
}

prepareValidationRules(ruleObj){
    if(ruleObj && ruleObj.length > 0){
        for (const rule of ruleObj){
            if(rule.condition && rule.message){
                const dataObj = this.customValidationRuleObj(rule);
                const objIndex = VALIDATION.findIndex(obj => obj.name === dataObj.name);
                // if an existing rule found replace it
                if(objIndex > -1){
                    VALIDATION[objIndex] = dataObj;
                }
                else{
                    VALIDATION.push(dataObj);
                }
            }
        }
    }
}

customValidationRuleObj(dataObj){
    let ruleObj = {};
    ruleObj.name = ('name' in dataObj) ? dataObj.name ? dataObj.name : uniqueStrGenerator() : uniqueStrGenerator();
    ruleObj.condition = dataObj.condition;
    ruleObj.message = dataObj.message;
    ruleObj.custom = true;
    return ruleObj;
}

runValidationRules(){
    const errorObj = VALIDATION;
    const value = this.comboboxObj._value;
    if(errorObj && errorObj.length > 0){
        const filteredObj = errorObj.filter(error => { return this.comboboxObj._builtInValidation.includes(error.name) || error.custom});
        for (const error of filteredObj){
            if(evaluateExpression(value,error.condition)){
                let hasError = error.message ? true : false;
                this.comboboxObj.hasError = hasError;
                this.comboboxObj.errorMsg = error.message;
                if(hasError){
                    return this.comboboxObj.hasError;
                }
            }
            else{
                this.comboboxObj.hasError = false;
                this.comboboxObj.errorMsg = '';
            }
        };
    }
    return this.comboboxObj.hasError;
}


renderedCallback(){
    // console.log('In rendered Callback  of Combobbox');
    // sync the attributes 
    syncComboboxAttributes(this);
}

    // dispatch events for the parent component
    dispatchChangeEvent(data, dataObj) {
        if (this._connected) {
            const dataValue = data;
            const dataValueObj = dataObj;
            this.dispatchEvent(
                new CustomEvent('change', {
                    composed: true,
                    bubbles: true,
                    detail: {
                        value: dataValue,
                        valueObj: dataValueObj
                    }
                })
            );
        }
    }

    dispatchSearchEvent(searchText) {
        if (this._connected) {
            const dataValue = searchText;
            this.dispatchEvent(
                new CustomEvent('search', {
                    composed: true,
                    bubbles: true,
                    detail: {
                        value: dataValue
                    }
                })
            );
        }
    }

}
