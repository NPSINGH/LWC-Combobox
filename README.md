# LWC-Combobox
LWC based Combobox which provides Single/Multi Selection with Auto search capability, The component is built upon LWC framework and inhertis all the capability and design constraint from Lightning Design System for Combobox blueprint-https://www.lightningdesignsystem.com/components/combobox/

This work is inspired from the LWC Base-Combobox Implementation https://github.com/salesforce/base-components-recipes/tree/master/force-app/main/default/lwc/baseCombobox
## Features
This new LWC native Combobox supports and provides following features-
1. **Native SLDS Support** - The component is written by using native Lightning design system styling, Thus the component will be rendered with the exact styling as described in the Combobox blueprint of SLDS,(https://www.lightningdesignsystem.com/components/combobox/)
2. **Multiselect Options Support** - The native LWC Combobox only provides supports to the single selection, but this component extend that capbility and provide multiple selection with the native user experience of Combobox.
3. **Auto-Search/Filter Options Support** - When dealing with large amount of data/options, it is essential to provide a intutive user experience where user can search and narrow-down the options and then select it in a quick fashion. This component provides that capability where you can enable the search the options and then select it. This capbility can be opt for Single/Multi selection of options.
4. **Keyboard interface support for option selection/navigation** - The component supports native keyboard navigation and hanlder as per the Native LWC Combobox component(https://developer.salesforce.com/docs/component-library/bundle/lightning-combobox/example), This kind of user interface helps with the users who wants to use the Keyboard for selection and navigation of the options.
5. **Native naming conventions** - The component is written by utilizing all the native base combobox attributes (https://developer.salesforce.com/docs/component-library/bundle/lightning-combobox/specification), methods and events, which helps any developer to easily integrate the component with their existing combobox code. 

## Demo
1. Single Select without Search
![Single Select without Search Image](/assets/Single_Select_without_Search.gif)
2. Multiselect without Search
![Multiselect without Search Image](/assets/Multiselect_without_search.gif)
3. Single Select with Search
![Single Select with Search Image](/assets/Single_Select_with_Search.gif)
4. Multiselect with Search
![Multiselect with Search Image](/assets/Multiselect_with_Search.gif)

## Usage
Use the component by refering it in your LWC code, but before going to do that make sure your import all the necessary references from the `lwc` folder from repository.

Use following code snippet to refer this component in your code:
 ```
 <c-combobox label="Select List" options={options}></c-combobox>
 ```
This Combobox component comes with following supported attributes and Events and Methods, the component inherits and use same naming convention as described in native LWC Combobox component so you can refer the same document for more details.
### Supported Attributes
| Attribute | Mandatory | Description | Default |
| --- | --- | --- | --- |
| `label` | Yes | To specify the Combobox label text |  |
| `options` | Yes | To specify the Combobox options Array, It accepts parameter as an array of JS object of `label` and `value` pair, An example could be: ``` [{"label": "United States","value": "us"},{"label": "United Kingdom","value": "uk"}] ``` |  |
| `value` | No | To specify the Combobox default or prepulated options, you can pass a `string` or text here. Please make sure to pass a valid `value` from the `options`. If the Combobox is multiselect, then you can specify your multiple values with Semocolon(`;`) seperated i.e. `us;uk`  | `false` |
| `multiselect` | No | To specify the Combobox selection constraint, if `true` specified then it will allow multiple selection, otherwise single select  | `false` |
| `autocomplete` | No | To specify the Combobox search/autocomplete constraint, if `true` specified then it will allow searching of options to narrow down the dropdown list  | `false` |
| `required` | No | To specify the Combobox required constraint  | `false` |
| `disabled` | No | To specify the Combobox disable state, if `true` then the Combobox will be in disabled state  | `false` |
| `read-only` | No | To specify the Combobox readonly state, if `true` then the Combobox will be in readonly state | `false` |
| `variant` | No | The variant changes the appearance of the combobox. Accepted variants include `standard`, `label-hidden`, `label-inline`. Use `label-hidden` to hide the label but make it available to assistive technology. Use `label-inline` to horizontally align the label and combobox. Use `standard` to place the label above the combobox as in stacked position.| `standard` |
| `placeholder` | No | To display default placeholder on the Combobox, It accepts `string`  |  |
| `field-level-help` | No | To display help text for the Combobox field, the help text will be displayed in the format of tooltip |  |
| `validation` | No | To pass custom validation rules to execute for validation of input data, refer below link for more detail: https://github.com/NPSINGH/LWC-Combobox/blob/main/README.md#validation-through-validation-attribute |  |
### Supported Events
Following Events are supported by the Combobox
1. **`onchange` Event**:
This event will be triggered whenever we update the Combobox selection. You can listen to this event from your parent component. To refer the updated value use `event.detail.value` from the `event` object.
  On your Parent Component listen to this event:
  ```
  <!-- in HTML -->
  <c-combobox label="Select List" options={options} onchange={handleSelectChange}></c-combobox>
  ```
  ```
  <!-- in JS -->
  handleSelectChange(event){
      console.log('EVENT FIRED!!! Selected Value: '+event.detail.value);
  }
  ```
### Supported Methods
Following Methods are supported by the Combobox
1. **`checkValidity` Method**:
  This method can be use to check the Component validity state, like whether the component has any error or not, this method is quite useful in order to know the component validity in case of required state or any other custom validations. This method returns the `true|false` state of validity.
2.  **`setCustomValidity` Method**:
  This method can be use to supply any custom validation which you would like to append on the error state, for example `onchange` event of Combobox you want to validate the selected value where user can only select a particular value, in that case you can add your validation check and apply an error state to the component with your custom message, for example
  ```
  handleSelectedOption(event){
      console.log('EVENT FIRED!!! Selected Value: '+event.detail.value);
      if(event.detail.value !== 'us'){
          this.template.querySelector('c-combobox').setCustomValidity('You need to select United States as option');
      }
      else {
          this.template.querySelector('c-combobox').setCustomValidity('');
      }
  }
  ```
  For more information about validation through `setCustomValidity` method, refer below section.
  
  #### Validation Handler Logic
  Component supports dynamic and custom validation through a specific js `object` and `setCustomValidity` method. You can prepare your custom validations and pass pass that `Array object` as in `validation` attribute or you can use `setCustomValidity` method and perform the validation dynamically on the fly from your parent component.
  ##### Validation through `validation` Attribute:
  In order to add custom validation, prepare a JSON Array object with following structure:
  ```
  validationObj = [
     {
       name: 'MAX-VALUE-SELECTION',
       condition: 'value.split(";").length > 5', /* `value` is reserved variable which will be dynamically mapped to the selected value param*/
       message: 'You can select upto 5 options'
     },
     {
       name: 'MIN-VALUE-SELECTION',
       condition: 'value.split(";").length < 2',
       message: 'You need to select atleast 2 options'
     }
     ...
  ];
  ```
  You need to pass this `Array Object` in validation rule, the Component run those validation on run time and show the corresponding message on the UI.
  ```
  <!-- in HTML -->
  <c-combobox label="Select List" options={options} onchange={handleSelectChange} validation={validationObj}></c-combobox>
  ```
  **Component parse the validation object and if there are validation with the same name it will be replaced in the array object**
  
 ##### Validation through `setCustomValidity` method:
 if you want to perform a dynamic validation on the fly from your parent component you can call this method and pass two parameters, the second parameter is an optional parameter where you would pass the condition, if you don't pass anything the message you try to display as an error which rendered immedietly without any condition check.
 
 **An example of code for immediate message display without condition:**
  ```
  handleSelectedOption(event){
      console.log('EVENT FIRED!!! Selected Value: '+event.detail.value);
      if(event.detail.value !== 'us'){
          this.template.querySelector('c-combobox').setCustomValidity('You need to select United States as option'); // show the message immedietly without any condition
      }
      else {
          this.template.querySelector('c-combobox').setCustomValidity(''); // to reset the message which you sent previously
      }
  }
  ```  
  **An example of code for display message based on condition eval:**
  ```
  renderedCallback(){
      const element = this.template.querySelector('c-combobox');
      if(element){
        element.setCustomValidity('You need to select United States as option','!value.split(";").includes("US")');
      }
      
      // to reset the condition use: element.setCustomValidity('');
  }
  ```
