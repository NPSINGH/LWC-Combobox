import { LightningElement, track, api } from 'lwc';
import {uniqueStrGenerator,deepClone} from 'c/Util';
import {evaluateExpression,syncComboboxAttributes,handleSelectionRemovalAction,clearSelectionOnAutocomplete,handleKeyUpOnInput,handleOptionClickAction,handleOptionHoverAction,handleDropdownOnInputClick,handleKeyDownOnInput,openAndCloseDropdown,preventAndStopEvent} from './ComboboxHelper';
const SEPERATOR = ';',
      MAX_OPTION_DISPLAY = 3,
      VALIDATION = [{name:"REQUIRED",condition:"(value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) ? true : false",message:"Complete this field",custom:false}];
export default class Combobox extends LightningElement {
uniqueId = uniqueStrGenerator(); // generate this Id to use in the attribute mapping

@track comboboxObj = {
    compObj: this,
    variant: 'standard',
    readOnly: false,
    multiselect: false,
    autocomplete: false,
    label: '',
    name: '',
    placeholder: '',
    hasError: false,
    errorMsg: '',
    helpText: '',
    options:[],
    dropdownList:[],

    _required: false,
    _value: '',
    _hasFocus: false,
    _isDropdownVisibile: false,
    _cbIdAttr: 'combobox-id-'+this.uniqueId,
    _cbLabelIdAttr: 'combobox-label-id-'+this.uniqueId,
    _cbSelectIdAttr: 'combobox-id-'+this.uniqueId+'-selected-value',
    _listboxIdAttr: 'listbox-id-'+this.uniqueId,
    _fieldErrorIdAttr: 'field-error-id-'+this.uniqueId,
    _searchTerm: '',
    _disabled: false,

    get required(){
        return this._required;
    },
    set required(value){
        this._required = value;
        this.compObj.runValidationRules();
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
        let selectedOptions = [];
        if(this.options && this.options.length > 0){
            selectedOptions = this.options.filter(opt => opt.selected === true);
        }
        return selectedOptions;
    },
    get _showPillSelector(){
        return this.multiselect && this.autocomplete && this._selectedOptions.length > 0 ? true : false;
    },
    get value(){
        return this._value;
    },
    get disabled(){
        return this.readOnly || this._disabled;
    },
    get _autoHideInput(){
        return this.autocomplete && this.multiselect && !this._hasFocus && this._selectedOptions.length > 0 && !this.hasError ? true : false;
    },
    set value(value){
        if(!value){
            value = '';
        }
        let valueList = [];
        if(this._value && this.multiselect){
            if(value){
                let existingValues = this._value.split(SEPERATOR);
                const index = existingValues.indexOf(value);
                // check if the supplied value already exist in the collection
                if (index > -1) {//if multiselect then remove the existing one
                    existingValues.splice(index, 1);
                }
                else{
                    existingValues.push(value);
                }
                valueList = existingValues;
            }
            else{
                valueList = value.split(SEPERATOR);
            }
        }
        else{
            valueList = value.split(SEPERATOR);
        }
        if(this._value != valueList.join(SEPERATOR)){
            // dispatch Change Event
            this._value = valueList.join(SEPERATOR);
            this.compObj.dispatchChangeEvent(this._value);

            // check for validation Rules
            this.compObj.runValidationRules();
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
        let selectedOptions = this._selectedOptions;
        if(selectedOptions && selectedOptions.length > 0){
            if(selectedOptions.length > MAX_OPTION_DISPLAY){
                valueDisplay = selectedOptions.length + ' options selected';
            }
            else{
                valueDisplay = selectedOptions.map(data=> data.label).join(SEPERATOR);
            }
        }
        return valueDisplay;
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

// @api properties
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
    this.comboboxObj._disabled = value;
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
        let dataOptions = deepClone(value);
        this.comboboxObj.options = this.prepareDropdownOptionList(dataOptions);
        this.comboboxObj.dropdownList = deepClone(this.comboboxObj.options);
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
    if(value){
        this.comboboxObj.value = value; 
    }
}

// @api methods 
@api checkValidity(){
    return !this.runValidationRules();
}

@api setCustomValidity(message,condition = 'true'){
    this.setCustomErrorMessage(message,condition);
}

// internal component logic
 
connectedCallback(){
    //console.log('In Combobox connected Callback');
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
                if(comboboxObj.value){
                    val = comboboxObj.value.split(';').includes(this.value);
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
    const value = this.comboboxObj.value;
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
dispatchChangeEvent(data){
    const dataValue = data;
    this.dispatchEvent(
        new CustomEvent('change', {
            composed: true,
            bubbles: true,
            detail: {
                value: dataValue
            }
        })
    );
}
}
