export const openAndCloseDropdown = (opr = 'close',compObj)=>{
    let template = compObj.template;
    // check if the dropdown has any options or not
    const options =  template.querySelectorAll('div[role="option"]');
    if(!(options && options.length > 0)){
        return;
    }
    let element =  template.querySelector('div[role="dropdown-trigger"');
    const inputElement = compObj.template.querySelector('input.selection-input');
    if(element){
        if(opr === 'open'){
            if(!element.classList.contains('slds-is-open')){
                element.classList.add('slds-is-open');
            }
            // add the expend attribute as true
            element.setAttribute('aria-expanded','true');
            compObj.comboboxObj._isDropdownVisibile = true;
            inputElement.focus();
        }
        else{
           if(element.classList.contains('slds-is-open')){
                element.classList.remove('slds-is-open');
            }
            // add the expend attribute as true
            element.setAttribute('aria-expanded','false');
            compObj.comboboxObj._isDropdownVisibile = false;            
            compObj.comboboxObj._searchTerm = ''; // reset search term
            // reset the dropdown list 
            compObj.comboboxObj.options = compObj.comboboxObj.dropdownList;
            // remove highlighted option
            let listElements = template.querySelectorAll('div[role="option"]');
            if(listElements.length > 0){
                listElements.forEach(ele => {
                    ele.setAttribute('aria-selected','false');
                    ele.classList.remove('slds-has-focus');
                    ele.classList.remove('slds-hide')
                });
            }
        }
    }
}

export const preventAndStopEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
}

export function handleKeyDownOnInput(event,compObj) {
    if (eventKeyToHandlerMap[event.key]) {
        eventKeyToHandlerMap[event.key](event,compObj);
    } else {
        // custom handling logic for the filter the dropdown
    }
}

export function handleKeyUpOnInput(event,compObj){
    if(compObj.comboboxObj.autocomplete){
        filterDropdownList(event,compObj);
    }
}

export function handleDropdownOnInputClick(event,compObj){
    const template = compObj.template; // get the template
    if(!compObj.comboboxObj._isDropdownVisibile){
        openAndCloseDropdown('open',compObj);
        let currentIndex = findCurrentSelectedIndex(template);
        currentIndex = currentIndex < 0 ? 0 : currentIndex;
        highlightSelection(currentIndex,template);
        // get element By Index and then scroll to current position
        const scrollTo = getOptionElementByIndex(currentIndex,template);
        const parentEle = template.querySelector('div[role="listbox"]');
        scrollIntoViewIfNeeded(scrollTo,parentEle);
    }
    else{
        openAndCloseDropdown('close',compObj);
    }
}

export function syncComboboxAttributes(compObj){
    const inputElement = compObj.template.querySelector('input.selection-input');
    if(!inputElement){
        return;
    }
    if(compObj.comboboxObj._hasFocus){
        inputElement.focus();
    }
    if(compObj.comboboxObj._disabled || compObj.comboboxObj.readOnly){
        inputElement.disabled = compObj.comboboxObj._disabled;
        inputElement.readOnly = compObj.comboboxObj.readOnly;
    }
    else{
        if(compObj.comboboxObj.autocomplete){
            inputElement.readOnly = false;
            if(compObj.comboboxObj._clearMode){
                inputElement.readOnly = true;
            }
        }
        else{
            inputElement.readOnly = true;
        }
    }
}

export function handleOptionClickAction(event,compObj){
    //const template = compObj.template;
    let value = event.currentTarget.dataset.value;
    // set the current value to the dropdown
    populateValueOnInput(value,compObj.comboboxObj);
    if(!compObj.comboboxObj.multiselect){ // if multiselect is not enabled then Don't close the Popup
        openAndCloseDropdown('close',compObj);
    }
}

export function handleOptionHoverAction(event,compObj){
    const template = compObj.template;
    if(event.type === 'mouseover'){
        const currentHoverIndex = getOptionElementIndexById(event.currentTarget.getAttribute('id'),template);
        if(currentHoverIndex >= 0){
            highlightSelection(currentHoverIndex,template);
        }
    }
    else{
        removeHighlightSelection(template);
    }
}

export function clearSelectionOnAutocomplete(compObj){
    populateValueOnInput('',compObj.comboboxObj); // set value to null
    // reset the dropdown list 
    compObj.comboboxObj.options = compObj.comboboxObj.dropdownList;
    // if dropdown is not visible then show the dropdown
    if(!compObj.comboboxObj._isDropdownVisibile){
        resetDropdownOptions(compObj.template);
        openAndCloseDropdown('open',compObj);
    }
}

export function handleSelectionRemovalAction(event,compObj){
    const template = compObj.template;
    let value = event.target.dataset.value;
    populateValueOnInput(value,compObj.comboboxObj); // send the value and update
}

export function evaluateExpression(value, condition) {
    return (new Function('value', '"use strict";return (' + condition + ')' )(value));
}

// -------------------------------------------------
// Internal functions which no need to export
// -------------------------------------------------

const eventKeyToHandlerMap = {
    Enter: handleEnterKey,
    Down: handleUpOrDownKey,
    Up: handleUpOrDownKey,
    ArrowUp: handleUpOrDownKey,
    ArrowDown: handleUpOrDownKey,
    Esc: handleEscapeOrTabKey,
    Escape: handleEscapeOrTabKey,
    Tab: handleEscapeOrTabKey,
    Backspace: handleBackspaceOrDeleteKey,
    Delete: handleBackspaceOrDeleteKey
};

function resetDropdownOptions(template){
    const listElements = template.querySelectorAll('div[role="option"]');
    if(listElements.length > 0){ 
        listElements.forEach(ele => {
            ele.classList.remove('slds-hide');
            ele.classList.remove('slds-has-focus');
            ele.setAttribute('aria-selected','false');
            ele.setAttribute('aria-checked','false');
        });
    }
}

function populateValueOnInput(value, comboboxObj){
    if(comboboxObj.value === value &&comboboxObj.multiselect){ // if multiselect and same value sent
        value = '';
    }
    comboboxObj.value = value;
}

function handleBackspaceOrDeleteKey(event,compObj){
    if(compObj.comboboxObj._disableDropdown){
        event.stopPropagation();
        clearSelectionOnAutocomplete(compObj);
    }
}

function handleEscapeOrTabKey(event,compObj){
    if(compObj.comboboxObj._isDropdownVisibile){
        event.stopPropagation();
        openAndCloseDropdown('close',compObj);
    }
}

function filterDropdownList(event,compObj){
    // check for the dropdown if dropdown is off bring the dropdown
    if(!compObj.comboboxObj._isDropdownVisibile){
        openAndCloseDropdown('open',compObj);
    }
    // get the value of the input
    const template = compObj.template;
    const searchTerm = event.target.value;
    compObj.comboboxObj._searchTerm = searchTerm;
    compObj.comboboxObj.options = compObj.comboboxObj.dropdownList.filter(ele => ele.label.toLowerCase().includes(searchTerm.toLowerCase()));
}

function findCurrentHoverIndex(template){
    // serach for hover selection index
    const listElements = template.querySelectorAll('div[role="option"]');
    if(listElements.length > 0){
       return [...listElements].findIndex(ele => ele.getAttribute('aria-selected') === 'true');
    }
    return -1;
}

function findCurrentSelectedIndex(template){
    // serach for selected option index
    const listElements = template.querySelectorAll('div[role="option"]');
    if(listElements.length > 0){
        return [...listElements].findIndex(ele => ele.getAttribute('aria-checked') === 'true');
    }
    return -1;
}

function getOptionElementByIndex(index,template){
    const listElements = template.querySelectorAll('div[role="option"]');
    if(listElements.length > 0){
        return listElements[index];
    }
}

function handleEnterKey(event,compObj){
    preventAndStopEvent(event);
    const template = compObj.template; // get the template
    if(!compObj.comboboxObj._isDropdownVisibile){
        openAndCloseDropdown('open',compObj);
        let currentIndex = findCurrentSelectedIndex(template);
        currentIndex = currentIndex < 0 ? 0 : currentIndex;
        highlightSelection(currentIndex,template);
        // get element By Index and then scroll to current position
        const scrollTo = getOptionElementByIndex(currentIndex,template);
        const parentEle = template.querySelector('div[role="listbox"]');
        scrollIntoViewIfNeeded(scrollTo,parentEle);
    }
    else{
        let currentIndex = findCurrentHoverIndex(template);
        if(currentIndex >= 0){
            // get the value out of the hover
            let value = template.querySelectorAll('div[role="option"]')[currentIndex].dataset.value;
            populateValueOnInput(value,compObj.comboboxObj);
            if(!compObj.comboboxObj.multiselect){
                openAndCloseDropdown('close',compObj);
            }
        }
    }
}

function getOptionElementIndexById(elementId,template){
    //const elementId = element.getAttribute('id');
    const listElements = template.querySelectorAll('div[role="option"]');
    if(listElements.length > 0){
       // return listElements.findIndex(optEle=>optEle.getAttribute('aria-selected=') == 'true');
       return [...listElements].findIndex(ele => ele.getAttribute('id') === elementId);
    }
    return -1;
}

function handleUpOrDownKey(event,compObj) {
    preventAndStopEvent(event);
    let template = compObj.template; // get the template  

    if(!compObj.comboboxObj.isDropdownVisibile){
        openAndCloseDropdown('open',compObj);
    }
    const currentIndex = findCurrentHoverIndex(template);

    const isUpKey = event.key === 'Up' || event.key === 'ArrowUp';
    let nextIndex = findNextIndex(currentIndex,isUpKey,template);
    // highlight selection
    highlightSelection(nextIndex,template);
    // get element By Index and then scroll to current position
    const scrollTo = getOptionElementByIndex(nextIndex,template);
    const parentEle = template.querySelector('div[role="listbox"]');
    scrollIntoViewIfNeeded(scrollTo,parentEle);
}

function findNextIndex(index,isUpKey,template){
    let currentIndex = index;
    const listElements = template.querySelectorAll('div[role="option"]');
    do{
        if (currentIndex >= 0) {
            currentIndex = isUpKey ? currentIndex - 1 : currentIndex + 1;
            if (currentIndex >= listElements.length) {
                currentIndex = 0;
            } else if (currentIndex < 0) {
                currentIndex = listElements.length - 1;
            }
        } else {
            currentIndex = isUpKey ? listElements.length - 1 : 0;
        }
    }while(listElements[currentIndex].classList.contains('slds-hide'))

    return currentIndex;
}

function highlightSelection(index,template){
    let listElements = template.querySelectorAll('div[role="option"]');
    if(listElements.length > 0){
        removeHighlightSelection(template);
        let selectionEle =  listElements[index];
        const id = selectionEle.getAttribute('id'); 
        selectionEle.classList.add('slds-has-focus');
        selectionEle.setAttribute('aria-selected','true');
        //selection-input
        template.querySelector('input.selection-input').setAttribute('aria-activedescendant',id);
    }
}

function removeHighlightSelection(template){
    let listElements = template.querySelectorAll('div[role="option"]');
    if(listElements.length > 0){
        listElements.forEach(ele => {
            ele.setAttribute('aria-selected','false');
            ele.classList.remove('slds-has-focus');
        });
    }
}

function scrollIntoViewIfNeeded(element, scrollingParent) {
    const parentRect = scrollingParent.getBoundingClientRect();
    const findMeRect = element.getBoundingClientRect();
    if (findMeRect.top < parentRect.top) {
        if (element.offsetTop + findMeRect.height < parentRect.height) {
            scrollingParent.scrollTop = 0;
        } else {
            scrollingParent.scrollTop = element.offsetTop;
        }
    } else if (findMeRect.bottom > parentRect.bottom) {
        scrollingParent.scrollTop += findMeRect.bottom - parentRect.bottom;
    }
}
