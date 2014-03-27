define([
    'lodash',
    'i18n',
    'jquery',
    'tpl!taoQtiItem/qtiCommonRenderer/tpl/interactions/gapMatchInteraction',
    'taoQtiItem/qtiCommonRenderer/helpers/Helper',
    'eyecatcher'
], function(_, __, $, tpl, Helper, eyecatcher){
    
    /**
     * Global variable to count number of choice usages:
     * @type type
     */
    var _choiceUsages = {}

    var setChoice = function(interaction, $choice, $target){

        var choiceSerial = $choice.data('serial'),
            choice = interaction.getChoice(choiceSerial);

        if(!_choiceUsages[choiceSerial]){
            _choiceUsages[choiceSerial] = 0;
        }
        _choiceUsages[choiceSerial]++;

        $target
            .data('serial', choiceSerial)
            .html($choice.html())
            .addClass('filled');

        if(!interaction.responseMappingMode
            && choice.attr('matchMax')
            && _choiceUsages[choiceSerial] >= choice.attr('matchMax')){

            $choice.addClass('deactivated');
        }
    };

    var unsetChoice = function(interaction, $choice, animate){

        var serial = $choice.data('serial'),
            $container = Helper.getContainer(interaction);

        $container.find('.choice-area [data-serial=' + serial + ']').removeClass('deactivated');

        _choiceUsages[serial]--;

        $choice
            .removeClass('filled')
            .removeData('serial')
            .empty();

        if(!interaction.swapping){
            //set correct response
            Helper.triggerResponseChangeEvent(interaction);
        }
    };

    var getChoice = function(interaction, identifier){
        return Helper.getContainer(interaction).find('.choice-area [data-identifier=' + identifier + ']');
    };
    
    var getGap = function(interaction, identifier){
        return Helper.getContainer(interaction).find('.qti_flow_container [data-identifier=' + identifier + ']');
    };

    /**
     * Init rendering, called after template injected into the DOM
     * All options are listed in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10291
     * 
     * @param {object} interaction
     */
    var render = function(interaction){
        
        var $container = Helper.getContainer(interaction),
            $choiceArea = $container.find('.choice-area'),
            $flowContainer = $container.find('.qti_flow_container'),
            $activeChoice = null;

        var _getChoice = function(serial){
            return $choiceArea.find('[data-serial=' + serial + ']');
        };

        var _setChoice = function($choice, $target){
            return setChoice(interaction, $choice, $target);
        };

        var _resetSelection = function(){
            if($activeChoice){
                $flowContainer.find('.remove-choice').remove();
                $activeChoice.removeClass('active');
                $container.find('.empty').removeClass('empty');
                $activeChoice = null;
            }
        };

        var _unsetChoice = function($choice){
            return unsetChoice(interaction, $choice);
        };

        var _isInsertionMode = function(){
            return ($activeChoice && $activeChoice.data('identifier'));
        };

        var _isModeEditing = function(){
            return ($activeChoice && !$activeChoice.data('identifier'));
        };

        $choiceArea.on('mousedown', '>li', function(e){

            if($(this).hasClass('deactivated')){
                e.preventDefault();
                return;
            }

            if(_isModeEditing()){
                //swapping:
                _unsetChoice($activeChoice);
                _setChoice($(this), $activeChoice);
                _resetSelection();
            }else{

                if($(this).hasClass('active')){
                    _resetSelection();
                }else{
                    _resetSelection();

                    //activate it:
                    $activeChoice = $(this);
                    $(this).addClass('active');
                    $flowContainer.find('.gapmatch-content').addClass('empty');
                }
            }

        });

        $flowContainer.on('mousedown', '.gapmatch-content', function(){
            if(_isInsertionMode()){

                var $target = $(this),
                    choiceSerial = $activeChoice.data('serial'),
                    targetSerial = $target.data('serial');

                if(targetSerial !== choiceSerial){

                    //set choices:
                    if(targetSerial){
                        _unsetChoice($target);
                    }

                    _setChoice($activeChoice, $target);
                }

                _resetSelection();

            }else if(_isModeEditing()){

                //editing mode:
                var $target = $(this),
                    targetSerial = $target.data('serial'),
                    choiceSerial = $activeChoice.data('serial');

                if(targetSerial !== choiceSerial){
                    _unsetChoice($activeChoice);
                    if(targetSerial){
                        //swapping:
                        _unsetChoice($target);
                        _setChoice(_getChoice(targetSerial), $activeChoice);
                    }
                    _setChoice(_getChoice(choiceSerial), $target);
                }

                _resetSelection();

            }else if($(this).data('serial')){

                //selecting a choice in editing mode:
                var serial = $(this).data('serial');

                $activeChoice = $(this);
                $activeChoice.addClass('active');

                $flowContainer.find('>li>div').filter(function(){
                    return $(this).data('serial') !== serial;
                }).addClass('empty');

                $choiceArea.find('>li:not(.deactivated)').filter(function(){
                    return $(this).data('serial') !== serial;
                }).addClass('empty');

                //append trash bin:
                var $bin = $('<span>', {'class' : 'icon-undo remove-choice', 'title' : __('remove')});
                $bin.on('mousedown', function(e){
                    e.stopPropagation();
                    _unsetChoice($activeChoice);
                    _resetSelection();
                });
                $(this).append($bin);
            }

        });
        
        //run eyecatcher:
        eyecatcher();
    };

    var _resetResponse = function(interaction){
        Helper.getContainer(interaction).find('.gapmatch-content').each(function(){
            unsetChoice(interaction, $(this));
        });
    };

    /**
     * Set the response to the rendered interaction.
     * 
     * The response format follows the IMS PCI recommendation :
     * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343  
     * 
     * Available base types are defined in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10291
     * 
     * Special value: the empty object value {} resets the interaction responses
     * 
     * @param {object} interaction
     * @param {object} response
     */
    var setResponse = function(interaction, response){

        var _setPairs = function(pairs){
            _.each(pairs, function(pair){
                if(pair){
                    setChoice(interaction, getChoice(interaction, pair[0]), getGap(interaction, pair[1]));
                }
           });
        };

        if(response.base && response.base.directedPair && _.isArray(response.base.directedPair) && response.base.directedPair.length === 2){
            _setPairs([response.base.directedPair]);
        }else if(response.list && response.list.directedPair && _.isArray(response.list.directedPair)){
            _setPairs(response.list.directedPair);
        }else if(_.isEmpty(response)){
            _resetResponse(interaction);
        }else{
            throw new Error('wrong response format in argument: ');
        }
    };

    var _getRawResponse = function(interaction){
        var response = [];
        Helper.getContainer(interaction).find('.gapmatch-content').each(function(){
            var choiceSerial = $(this).data('serial'),
                pair = [];

            if(choiceSerial){
                pair.push(interaction.getChoice(choiceSerial).attr('identifier'));
            }
            pair.push($(this).data('identifier'));
            
            if(pair.length === 2){
                response.push(pair);
            }
        });
        return response;
    };

    /**
     * Return the response of the rendered interaction
     * 
     * The response format follows the IMS PCI recommendation :
     * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343  
     * 
     * Available base types are defined in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10307
     * 
     * @param {object} interaction
     * @returns {object}
     */
    var getResponse = function(interaction){
        var ret = {}, values = _getRawResponse(interaction);
        if(values.length === 1){
            ret = {base : {directedPair : values[0]}};
        }else{
            ret = {list : {directedPair : values}};
        }
        return ret;
    };
    
    var restore = function(interaction){
        
        var $container = Helper.getContainer(interaction);

        //restore seelcted choice:
        $container.find('.gapmatch-content .active').mousedown();

        //remove event
        $(document).off('.commonRenderer');
        $container.find('.choice-area, .gapmatch-content').off('.commonRenderer');

        //restore response
        _resetResponse(interaction);

        Helper.getContainer(interaction).find('.gapmatch-content').empty();
    };
    
    return {
        qtiClass : 'gapMatchInteraction',
        template : tpl,
        render : render,
        getContainer : Helper.getContainer,
        setResponse : setResponse,
        getResponse : getResponse,
        restore : restore
    };
});