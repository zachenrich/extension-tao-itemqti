define([
    'lodash',
    'tpl!taoQtiItem/qtiCommonRenderer/tpl/interactions/textEntryInteraction',
    'taoQtiItem/qtiCommonRenderer/helpers/Helper',
    'taoQtiItem/qtiCommonRenderer/helpers/PciResponse',
    'polyfill/placeholders'
], function(_, tpl, Helper, pciResponse){
    'use strict';   
 
    /**
     * Setting the pattern mask for the input, for browsers which doesn't support this feature
     * @param {jQuery} $element
     * @param {string} pattern
     * @returns {undefined}
     */
    var _setPattern = function($element, pattern){
        var patt = new RegExp('^'+pattern+'$');
        
        //test when some data is entering in the input field
        $element.on('keyup', function(){
            $element.removeClass('field-error');
            if(!patt.test($element.val())){
                $element.addClass('field-error');
            }
        });
    };

    /**
     * Init rendering, called after template injected into the DOM
     * All options are listed in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10333
     * 
     * @param {object} interaction
     */
    var render = function(interaction){
        var attributes = interaction.getAttributes(),
            $el = interaction.getContainer();
    
        //setting up the width of the input field
        if(attributes.expectedLength){
            $el.css('width', parseInt(attributes.expectedLength) + 'em');
        }
        
        //checking if there's a pattern mask for the input
        if(attributes.patternMask){
            var patternSupported = ('pattern' in document.createElement('input'));
            
            /*
             * checking if pattern attribute is not supported of the browser 
             * or if the browser is safari(bug with pattern attribute support)
             * 
             */
            if(!patternSupported || navigator.userAgent.match(/Safari/i)){
                _setPattern($el, attributes.patternMask);
            }else{
                $el.attr('pattern', attributes.patternMask);
            }
        }

        //checking if there's a placeholder for the input
        if(attributes.placeholderText){
            $el.attr('placeholder', attributes.placeholderText);            
        }
    };

    var _resetResponse = function(interaction){
        interaction.getContainer().val('');
    };

    /**
     * Set the response to the rendered interaction.
     * 
     * The response format follows the IMS PCI recommendation :
     * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343  
     * 
     * Available base types are defined in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10333
     * 
     * Special value: the empty object value {} resets the interaction responses
     * 
     * @param {object} interaction
     * @param {object} response
     */
    var setResponse = function(interaction, response){
        
        var _setVal = function(value){
            interaction.getContainer().val(value);
        };
        
        var baseType = interaction.getResponseDeclaration().attr('baseType');
        
        if(response.base && response.base[baseType]){
            _setVal(response.base[baseType]);
        }else if(_.isEmpty(response)){
            _resetResponse(interaction);
        }else{
            throw new Error('wrong response format in argument: ');
        }
    };

    /**
     * Return the response of the rendered interaction
     * 
     * The response format follows the IMS PCI recommendation :
     * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343  
     * 
     * Available base types are defined in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10333
     * 
     * @param {object} interaction
     * @returns {object}
     */
    var getResponse = function(interaction){
        var ret = {'base' : {}},
            value, 
            $el = interaction.getContainer(),
            attributes = interaction.getAttributes(),
            baseType = interaction.getResponseDeclaration().attr('baseType'),
            numericBase = attributes.base || 10; 
    
        if(attributes.placeholderText && $el.val() === attributes.placeholderText){
            value = '';
        } else {
            if(baseType==='integer'){
                value = parseInt($el.val(), numericBase);
            } else if(baseType==='float'){
                value = parseFloat($el.val());
            } else if(baseType==='string'){
                value = $el.val();
            }
        }
        
        ret.base[baseType] = isNaN(value) && typeof value === 'number' ? '' : value;
        
        return ret;
    };

    return {
        qtiClass : 'textEntryInteraction',
        template : tpl,
        render : render,
        getContainer : Helper.getContainer,
        setResponse : setResponse,
        getResponse : getResponse
    };
});
