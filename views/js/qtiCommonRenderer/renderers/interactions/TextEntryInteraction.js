/*  
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * 
 * Copyright (c) 2014 (original work) Open Assessment Technlogies SA (under the project TAO-PRODUCT);
 * 
 */

/**
 * @author Sam Sipasseuth <sam@taotesting.com>
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'tpl!taoQtiItem/qtiCommonRenderer/tpl/interactions/textEntryInteraction',
    'taoQtiItem/qtiCommonRenderer/helpers/container',
    'taoQtiItem/qtiCommonRenderer/helpers/instructions/instructionManager',
    'taoQtiItem/qtiCommonRenderer/helpers/PciResponse',
    'polyfill/placeholders',
    'tooltipster'
], function($, _, __, tpl, containerHelper, instructionMgr, pciResponse){
    'use strict';

    /**
     * Setting the pattern mask for the input, for browsers which doesn't support this feature
     * @param {jQuery} $element
     * @param {string} pattern
     * @returns {undefined}
     */
    var _setPattern = function($element, pattern){
        var patt = new RegExp('^' + pattern + '$'),
            patternSupported = ('pattern' in document.createElement('input'));
    

    

        $element.attr('pattern', pattern);
        //test when some data is entering in the input field
        $element.on('keyup', function(){
            $element.removeClass('field-error');
            if(!patt.test($element.val())){


                /*
                 * FIXME WTF is this check ? If I understand if there is a pattern attribute, 
                 * 
                 * --- orinal comment:
                 * checking if pattern attribute is not supported of the browser 
                 * or if the browser is safari(bug with pattern attribute support)
                 * 
                 */
                if(!patternSupported || navigator.userAgent.match(/Safari/i)){
                    $element.addClass('field-error');
                }
                $element.tooltipster('show');
            } else {
                $element.tooltipster('hide');
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
            //set up the tooltip plugin for the input
            $el.tooltipster({
                theme: 'tao-error-tooltip',
                content: __('Invalid pattern'),
                delay: 350,
                trigger: 'custom'
            });

            _setPattern($el, attributes.patternMask);
        }

        //checking if there's a placeholder for the input
        if(attributes.placeholderText){
            $el.attr('placeholder', attributes.placeholderText);
        }

        $el.on('change', function(){
            containerHelper.triggerResponseChangeEvent(interaction);
        });
    };

    var resetResponse = function(interaction){
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

        var responseValue;

        try{
            responseValue = pciResponse.unserialize(response, interaction);
        }catch(e){
        }

        if(responseValue && responseValue.length){
            interaction.getContainer().val(responseValue[0]);
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
        }else{
            if(baseType === 'integer'){
                value = parseInt($el.val(), numericBase);
            }else if(baseType === 'float'){
                value = parseFloat($el.val());
            }else if(baseType === 'string'){
                value = $el.val();
            }
        }

        ret.base[baseType] = isNaN(value) && typeof value === 'number' ? '' : value;

        return ret;
    };

    var destroy = function(interaction){
        
        //remove event
        $(document).off('.commonRenderer');
        containerHelper.get(interaction).off('.commonRenderer');

        //destroy response
        resetResponse(interaction);

        //remove instructions
        instructionMgr.removeInstructions(interaction);

        //remove all references to a cache container
        containerHelper.reset(interaction);
    };

    /**
     * Set the interaction state. It could be done anytime with any state.
     * 
     * @param {Object} interaction - the interaction instance
     * @param {Object} state - the interaction state
     */
    var setState  = function setState(interaction, state){
        if(typeof state !== undefined){
            interaction.resetResponse();
            interaction.setResponse(state);
        }
    };

    /**
     * Get the interaction state.
     * 
     * @param {Object} interaction - the interaction instance
     * @returns {Object} the interaction current state
     */
    var getState = function getState(interaction){
        return interaction.getResponse();
    };

    return {
        qtiClass : 'textEntryInteraction',
        template : tpl,
        render : render,
        getContainer : containerHelper.get,
        setResponse : setResponse,
        getResponse : getResponse,
        resetResponse : resetResponse,
        destroy : destroy,
        setState : setState,
        getState : getState
    };
});
