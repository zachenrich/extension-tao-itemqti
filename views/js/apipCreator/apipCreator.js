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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 *
 */
define([
    'taoQtiItem/apipCreator/api/apipItem', 
    'taoQtiItem/apipCreator/editor/inclusionOrderSelector',
    'taoQtiItem/apipCreator/editor/qtiElementSelector'
], function(ApipItem, inclusionOrderSelector, qtiElementSelector){

    function init(config){
        
        var $container = $('#apip-creator-scope');
        var apipItem = new ApipItem(config.properties.xml);
        
        initLabel($container, config);
        initInclusionOrderSelector($container, config);
        initQtiElementSelector($container, config, apipItem);
        initEvents($container, config);
    }
    
    function initLabel($container, config){
        $container.find('#item-editor-label').html(config.properties.label);
    }
    
    function initInclusionOrderSelector($container, config){
        inclusionOrderSelector.render($container.find('.item-editor-action-bar'));
    }
    
    function initQtiElementSelector($container, config, apipItem){
        qtiElementSelector.render($container.find('#item-editor-scroll-inner'), apipItem.getItemBodyModel());
    }
    
    function initEvents($container){
        
        $container.on('inclusionorderactivated', function(e, inclusionOrderType){
           console.log('activated', inclusionOrderType); 
        }).on('activated.qti-element-selector', function(e, qtiElementSerial){
            //show contextual popup + load form
        }).on('deactivated.qti-element-selector', function(){
            //destroy contextual popup
        });
    }
    
    return {
        init : init
    };
});