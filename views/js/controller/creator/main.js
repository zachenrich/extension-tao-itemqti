define([
    'lodash',
    'taoQtiItem/qtiCreator/editor/preview',
    'taoQtiItem/qtiCreator/editor/preparePrint',
    'taoQtiItem/qtiCreator/editor/toggleAppearance',
    'taoQtiItem/qtiCreator/editor/listStyler',
    'taoQtiItem/qtiCreator/helper/itemLoader',
    'taoQtiItem/qtiCreator/helper/creatorRenderer',
    // css editor related
    'taoQtiItem/qtiCreator/editor/styleEditor/fontSelector',
    'taoQtiItem/qtiCreator/editor/styleEditor/colorSelector',
    'taoQtiItem/qtiCreator/editor/styleEditor/fontSizeChanger',
    'taoQtiItem/qtiCreator/editor/styleEditor/itemResizer',
    'taoQtiItem/qtiCreator/editor/styleEditor/styleEditor',
    'taoQtiItem/qtiCreator/editor/styleEditor/styleSheetToggler'
], function(
    _,
    preview,
    preparePrint,
    toggleAppearance,
    listStyler,
    loader,
    creatorRenderer,
    fontSelector,
    colorSelector,
    fontSizeChanger,
    itemResizer,
    styleEditor,
    styleSheetToggler
    ){


    var _initUiComponents = function(item, config){

        styleEditor.init(item, config);

        // do this when init is finished

        styleSheetToggler.init();

        // CSS widgets
        fontSelector();
        colorSelector(config);
        fontSizeChanger(config);
        itemResizer(config);

        preview.init('#preview-trigger');
        preparePrint();

        toggleAppearance();

        listStyler();

        $('#item-editor-panel').addClass('has-item');

        $('.item-editor-sidebar').fadeTo(2000, 1);
    };

    var _initFormVisibilityListener = function(){


        var _staticElements = ['img', 'object', 'rubricBlock', 'modalFeedback', 'math'];

        var $formInteractionPanel = $('#item-editor-interaction-property-bar').hide(),
            $formChoicePanel = $('#item-editor-choice-property-bar').hide(),
            $formResponsePanel = $('#item-editor-response-property-bar').hide(),
            $formItemPanel = $('#item-editor-item-property-bar').hide(),
            $formBodyElementPanel = $('#item-editor-body-element-property-bar').hide();

        $(document).on('afterStateInit.qti-widget', function(e, element, state){

            switch(state.name){
                case 'active':
                    $formItemPanel.hide();
                    if(_.indexOf(_staticElements, element.qtiClass) >= 0){
                        $formBodyElementPanel.show();
                    }
                    break;
                case 'question':
                    $formInteractionPanel.show();
                    break;
                case 'choice':
                    $formChoicePanel.show();
                    break;
                case 'answer':
                    $formResponsePanel.show();
                    break;
                case 'sleep':
                    if(_.indexOf(_staticElements, element.qtiClass) >= 0){
                        $formBodyElementPanel.hide();
                    }
                    break;
            }
        });

        $(document).on('beforeStateExit.qti-widget', function(e, element, state){
            switch(state.name){
                case 'question':
                    $formInteractionPanel.hide();
                    $formItemPanel.show();
                    break;
                case 'choice':
                    $formChoicePanel.hide();
                    break;
                case 'answer':
                    $formResponsePanel.hide();
                    break;
            }
        });
    };

    return {
        start : function(config){

            _initFormVisibilityListener();

            //load item from serice REST
            loader.loadItem({uri : config.uri}, function(item){

                //load renderer
                creatorRenderer.setOption('baseUrl', config.baseUrl);
                creatorRenderer.get().load(function(){

                    item.setRenderer(this);

                    //render item (body only) into the "drop-area"
                    $('#item-editor-panel').append(item.render());

                    //"post-render it" to initialize the widget
                    item.postRender({uri : config.uri});

                    _initUiComponents(item, config);

                }, item.getUsedClasses());

            });

        }
    };
});