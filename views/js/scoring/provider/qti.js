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
 * Copyright (c) 2015 (original work) Open Assessment Technlogies SA (under the project TAO-PRODUCT);
 *
 */

/**
 * Provides the QTI implementation for the scoring.
 * The provider needs to be registered into the {@link taoItems/scoring/api/scorer}.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'lodash',
    'taoQtiItem/scoring/processor/responseRules/engine',
    'taoQtiItem/qtiCommonRenderer/helpers/PciResponse',
], function(_, ruleEngineFactory, PciResponse){
    'use strict';

    var qtiPciCardinalities = {
        single : 'base',
        multiple : 'list',
        ordered : 'list',
        record : 'record'
    };

    var stateBuilder = function stateBuilder(responses, itemData){

        var state = {};

              //load responses variables
        _.forEach(itemData.responses, function(response){
            var responseValue;
            var identifier      = response.attributes.identifier;
            var cardinality     = response.attributes.cardinality;
            var baseType        = response.attributes.baseType;
            var pciCardinality  = qtiPciCardinalities[cardinality];

            if(state[identifier]){
                //throw an error
                throw new Error('Variable collision : the state already contains the response variable ' + identifier);
            }

            //load the declaration
            state[identifier] = {
                cardinality         : cardinality,
                baseType            : baseType,
                correctResponse     : response.correctResponses,
                mapping             : response.mapping,
                areaMapping         : response.areaMapping,
                mappingAttributes   : response.mappingAttributes,
                defaultValue        : response.attributes.defaultValue || response.defaultValue
            };

            //and add the current response
            if(responses && responses[identifier] && typeof responses[identifier][pciCardinality] !== 'undefined'){
                responseValue = responses[identifier][pciCardinality];
                if(_.isObject(responseValue)){
                    state[identifier].value = (typeof responseValue[baseType] !== 'undefined') ? responseValue[baseType] : null;
                } else {
                    state[identifier].value = null;
                }
            }
        });

        //load outcomes variables
        _.forEach(itemData.outcomes, function(outcome){
            var identifier = outcome.attributes.identifier;
            if(state[identifier]){
                //throw an error
                throw new Error('Variable collision : the state already contains the outcome variable ' + identifier);
            }
            state[identifier] = {
                cardinality  : outcome.attributes.cardinality,
                baseType     : outcome.attributes.baseType,

            };
            if(typeof outcome.defaultValue){
                state[identifier].defaultValue = outcome.defaultValue;
                state[identifier].value = outcome.defaultValue;
            }
        });

        return state;
    };

    var stateToPci = function stateToPci(state){
        var pciState = {};

        _.forEach(state, function(variable, identifier){
            var pciCardinality  = qtiPciCardinalities[variable.cardinality];
            var baseType        = variable.baseType;
            if(pciCardinality){
                pciState[identifier] = {};
                if(pciCardinality === 'base'){
                    if(variable.value === null || typeof variable.value === 'undefined'){
                        pciState[identifier].base = null;
                    } else {
                        pciState[identifier].base = {};
                        pciState[identifier].base[baseType] = variable.value;
                    }
                } else {
                    pciState[identifier][pciCardinality] = {};
                    pciState[identifier][pciCardinality][baseType] = variable.value;
                }
            }
        });
        return pciState;
    };

    /**
     * The QTI scoring provider.
     * @exports taoQtiItem/scoring/provider/qti
     */
    var qtiScoringProvider = {

        /**
         * Process the score from the response.
         *
         * @param {Object} responses - we expect a response formated using the PCI
         * @param {Object} itemData - we expect the whole itemData in the QTI context.
         * @param {Function} done - callback with the produced outcome
         * @see {@link http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343} for the response format.
         * @this {taoItems/scoring/api/scorer} the scorer calls are delegated here, the context is the scorer's context with event mehods available.
         */
        process : function process(responses, itemData, done){


            var state = stateBuilder(responses, itemData);
            var ruleEngine = ruleEngineFactory(state);

            ruleEngine.execute(itemData.responseProcessing.responseRules);

            done(stateToPci(state));
        }
    };

    return qtiScoringProvider;
});
