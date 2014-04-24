define(['lodash', 'handlebars', 'taoQtiItem/qtiItem/core/Element', 'taoQtiItem/qtiItem/helper/interactionHelper'], function(_, Handlebars, Element, interactionHelper){

    'use strict';

    var _isValidRenderer = function(renderer){

        var valid = true;

        if(typeof(renderer) !== 'object'){
            return false;
        }

        var classCorrect = false;
        if(renderer.qtiClass){
            if(_.indexOf(_renderableClasses, renderer.qtiClass) >= 0){
                classCorrect = true;
            }else{
                var pos = renderer.qtiClass.indexOf('.');
                if(pos > 0){
                    var qtiClass = renderer.qtiClass.slice(0, pos);
                    var subClass = renderer.qtiClass.slice(pos + 1);
                    if(_renderableSubclasses[qtiClass] && _.indexOf(_renderableSubclasses[qtiClass], subClass) >= 0){
                        classCorrect = true;
                    }
                }
            }
        }
        if(!classCorrect){
            valid = false;
            throw new Error('invalid qti class name in renderer declaration : ' + renderer.qtiClass);
        }

        if(!renderer.template){
            valid = false;
            throw new Error('missing template in renderer declaration : ' + renderer.qtiClass);
        }

        return valid;
    };

    var _renderableClasses = [
        '_container',
        'assessmentItem',
        'stylesheet',
        'responseDeclaration',
        'outcomeDeclaration',
        'responseProcessing',
        '_simpleFeedbackRule',
        'img',
        'math',
        'object',
        'modalFeedback',
        'rubricBlock',
        'associateInteraction',
        'choiceInteraction',
        'extendedTextInteraction',
        'gapMatchInteraction',
        'graphicAssociateInteraction',
        'graphicGapMatchInteraction',
        'graphicOrderInteraction',
        'hotspotInteraction',
        'hottextInteraction',
        'inlineChoiceInteraction',
        'matchInteraction',
        'mediaInteraction',
        'orderInteraction',
        'selectPointInteraction',
        'sliderInteraction',
        'textEntryInteraction',
        'uploadInteraction',
        'endAttemptInteraction',
        'prompt',
        'associableHotspot',
        'gap',
        'gapImg',
        'gapText',
        'hotspotChoice',
        'hottext',
        'inlineChoice',
        'simpleAssociableChoice',
        'simpleChoice'
    ];

    var _renderableSubclasses = {
        'simpleAssociableChoice' : ['associateInteraction', 'matchInteraction'],
        'simpleChoice' : ['choiceInteraction', 'orderInteraction']
    };

    var _alwaysRequiredClasses = [
        '_container',
        'prompt',
        'modalFeedback'
    ];

    var Renderer = function(options){

        options = options || {};
        
        this.isRenderer = true;
        this.name = '';
        this.shuffleChoices = (options.shuffleChoices !== undefined)? options.shuffleChoices : true;
        
        this.shuffledChoices = [];

        /**
         * Store the registered renderer location
         */
        var _locations = {};

        /**
         * Store loaded renderers
         */
        var _renderers = {};

        /**
         * Get the actual renderer of the give qti class or subclass:
         * e.g. simplceChoice, simpleChoice.choiceInteraction, simpleChoice.orderInteraction
         */
        var _getClassRenderer = function(qtiClass){
            var ret = null;
            if(_renderers[qtiClass]){
                ret = _renderers[qtiClass];
            }else{
                var pos = qtiClass.indexOf('.');
                if(pos > 0){
                    qtiClass = qtiClass.slice(0, pos);
                    if(_renderers[qtiClass]){
                        ret = _renderers[qtiClass]
                    }
                }
            }
            return ret;
        };
        
        this.setOption = function(key, value){
            if(typeof(key) === 'string'){
                options[key] = value;
            }
            return this;
        };
        
        this.getOption = function(key){
            if(typeof(key) === 'string' && options[key]){
                return options[key];
            }
            return null;
        };

        this.renderTpl = function(element, data, qtiSubclass){

            var ret = '',
                tplFound = false,
                qtiClass = qtiSubclass || element.qtiClass,
                renderer = _getClassRenderer(qtiClass);

            if(renderer){
                if(typeof(renderer.template) === 'function'){
                    ret = renderer.template(data);
                    tplFound = true;
                }
            }

            if(!tplFound){
                throw new Error('no renderer template loaded under the class name : ' + qtiClass);
            }

            return ret;
        };

        this.getData = function(element, data, qtiSubclass){

            var ret = data,
                qtiClass = qtiSubclass || element.qtiClass,
                renderer = _getClassRenderer(qtiClass);

            if(renderer){
                if(typeof(renderer.getData) === 'function'){
                    ret = renderer.getData.call(this, element, data);
                }
            }

            return ret;
        };

        this.renderDirect = function(tpl, data){
            return Handlebars.compile(tpl)(data);
        };

        this.getContainer = function(qtiElement, $scope){

            var ret = null,
                renderer = _getClassRenderer(qtiElement.qtiClass);

            if(renderer){
                ret = renderer.getContainer(qtiElement, $scope);
            }else{
                throw 'no renderer found for the class : ' + qtiElement.qtiClass;
            }
            return ret;
        };

        this.postRender = function(qtiElement, data, qtiSubclass){

            var ret = false,
                qtiClass = qtiSubclass || qtiElement.qtiClass,
                renderer = _getClassRenderer(qtiClass);

            if(renderer){
                if(typeof(renderer.render) === 'function'){
                    ret = renderer.render.call(this, qtiElement, data);
                }else{
                    //postRendering is optional, log missing call of postRender?
                }
            }

            return ret;
        };

        this.setResponse = function(qtiInteraction, response){
            var ret = false, qtiClass = qtiInteraction.qtiClass;
            if(_renderers[qtiClass]){
                if(typeof(_renderers[qtiClass].setResponse) === 'function'){
                    ret = _renderers[qtiClass].setResponse.call(this, qtiInteraction, response);
                }
            }else{
                throw 'no renderer template registered under the name : ' + qtiClass;
            }
            return ret;
        };

        this.getResponse = function(qtiInteraction){
            var ret = false, qtiClass = qtiInteraction.qtiClass;
            if(_renderers[qtiClass]){
                if(typeof(_renderers[qtiClass].getResponse) === 'function'){
                    ret = _renderers[qtiClass].getResponse.call(this, qtiInteraction);
                }
            }else{
                throw 'no renderer template registered under the name : ' + qtiClass;
            }
            return ret;
        };
        
        this.resetResponse = function(qtiInteraction){
            var ret = false, qtiClass = qtiInteraction.qtiClass;
            if(_renderers[qtiClass]){
                if(typeof(_renderers[qtiClass].resetResponse) === 'function'){
                    ret = _renderers[qtiClass].resetResponse.call(this, qtiInteraction);
                }
            }else{
                throw 'no renderer template registered under the name : ' + qtiClass;
            }
            return ret;
        };

        this.getLoadedRenderers = function(){
            return _renderers;
        };

        this.register = function(renderersLocations){
            _.extend(_locations, renderersLocations);
        };

        this.load = function(callback, requiredClasses){

            var required = [];
            if(requiredClasses){
                if(_.isArray(requiredClasses)){
                    requiredClasses = _.intersection(requiredClasses, _renderableClasses);
                    requiredClasses = _.union(requiredClasses, _alwaysRequiredClasses);
                    for(var i in requiredClasses){
                        var qtiClass = requiredClasses[i];
                        if(_renderableSubclasses[qtiClass]){
                            var requiredSubClasses = _.intersection(requiredClasses, _renderableSubclasses[qtiClass]);
                            _.each(requiredSubClasses, function(subclass){
                                if(_locations[qtiClass + '.' + subclass]){
                                    required.push(_locations[qtiClass + '.' + subclass]);
                                }else if(_locations[qtiClass]){
                                    required.push(_locations[qtiClass]);
                                }else{
                                    throw new Error(this.name + ' : missing qti class location declaration: ' + qtiClass + ', subclass: ' + subclass);
                                }
                            });
                        }else{
                            if(_locations[qtiClass] === false){
                                _renderers[qtiClass] = false;//mark this class as not renderable
                            }else if(_locations[qtiClass]){
                                required.push(_locations[qtiClass]);
                            }else{
                                throw new Error(this.name + ' : missing qti class location declaration: ' + qtiClass);
                            }
                        }
                    }
                }else{
                    throw new Error('invalid argument type: expected array for arg "requireClasses"');
                }
            }else{
                required = _.values(_locations);
            }

            var _this = this;
            require(required, function(){

                _.each(arguments, function(clazz){
                    if(_isValidRenderer(clazz)){
                        _renderers[clazz.qtiClass] = clazz;
                    }
                });

                if(typeof(callback) === 'function'){
                    callback.call(_this, _renderers);
                }
            });
            
            return this;
        };

        this.setShuffledChoices = function(interaction, choices, identificationType){
            if(Element.isA(interaction, 'interaction')){
                this.shuffledChoices[interaction.getSerial()] = interactionHelper.findChoices(interaction, choices, identificationType);
            }
        };

        this.getShuffledChoices = function(interaction, reshuffle, returnedType){
            var ret = [], tmp;

            if(Element.isA(interaction, 'interaction')){
                var serial = interaction.getSerial();
                if(!this.shuffledChoices[serial] || reshuffle){
                    if(Element.isA(interaction, 'matchInteraction')){
                        this.shuffledChoices[serial] = [];
                        for(var i = 0; i < 2; i++){
                            this.shuffledChoices[serial].push(interactionHelper.shuffleChoices(interaction.getChoices(i)))
                        }
                    }else{
                        this.shuffledChoices[serial] = interactionHelper.shuffleChoices(interaction.getChoices());
                    }
                }
                tmp = this.shuffledChoices[serial];

                if(returnedType === 'serial' || returnedType === 'identifier'){
                    ret = interactionHelper.convertChoices(tmp, returnedType);
                }else{
                    //pass value only, not ref
                    ret = _.clone(tmp);
                }
            }

            return ret;
        };
        
        this.getRenderers = function(){
            return _renderers;
        };
        
        this.getLocations = function(){
            return _locations;
        };

    };

    return {
        build : function(renderersLocations, name){
            var NewRenderer = function(){
                Renderer.apply(this, arguments);
                this.register(renderersLocations);
                this.name = name || '';
            };
            NewRenderer.prototype = Renderer.prototype;
            return NewRenderer;
        },
        getElementRenderer : function(ElementRenderer, element){
            if(element.qtiClass === ElementRenderer.qtiClass){
                var currentRenderer = element.getRenderer();
            }
        }
    };
});