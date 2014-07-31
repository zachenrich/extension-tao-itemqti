define([
    'jquery',
    'i18n',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/static/states/Active',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/static/img',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCreator/widgets/static/helpers/inline',
    'taoQtiItem/qtiItem/helper/util',
    'lodash',
    'util/image',
    'ui/mediasizer',
    'ui/resourcemgr',
    'nouislider'
], function($, __, stateFactory, Active, formTpl, formElement, inlineHelper, itemUtil, _, imageUtil, mediasizer){

    var ImgStateActive = stateFactory.extend(Active, function(){

        this.initForm();

    }, function(){

        this.widget.$form.empty();
    });

    /**
     * Extract a default label from a file/path name
     * @param {String} fileName - the file/path
     * @returns {String} a label
     */
    var _extractLabel = function extractLabel(fileName){
        return fileName
            .replace(/\.[^.]+$/, '')
            .replace(/^(.*)\//, '')
            .replace(/\W/, ' ')
            .substr(0, 255);
    };

    ImgStateActive.prototype.initForm = function(){

        var _widget = this.widget,
            $img = _widget.$original,
            $form = _widget.$form,
            img = _widget.element,
            baseUrl = _widget.options.baseUrl,
            responsive = true;

        $form.html(formTpl({
            baseUrl : baseUrl || '',
            src : img.attr('src'),
            alt : img.attr('alt'),
            height : img.attr('height'),
            width : img.attr('width'),
            responsive : responsive
        }));

        //init slider and set align value before ...
        _initAdvanced(_widget);
        _initMediaSizer(_widget);
        _initAlign(_widget);
        _initUpload(_widget);

        //... init standard ui widget
        formElement.initWidget($form);

        //init data change callbacks
        formElement.setChangeCallbacks($form, img, {
            src : _.throttle(function(img, value){

                img.attr('src', value);

                $img.attr('src', itemUtil.fullpath(value, baseUrl));
                $img.trigger('contentChange.qti-widget').change();

                inlineHelper.togglePlaceholder(_widget);

                _initAdvanced(_widget);
                _initMediaSizer(_widget);
            }, 1000),
            alt : function(img, value){
                img.attr('alt', value);
            },
            longdesc : formElement.getAttributeChangeCallback(),
            align : function(img, value){
                inlineHelper.positionFloat(_widget, value);
            }
        });

    };

    var _initAlign = function(widget){

        var align = 'default';

        //init float positioning:
        if(widget.element.hasClass('rgt')){
            align = 'right';
        }else if(widget.element.hasClass('lft')){
            align = 'left';
        }

        inlineHelper.positionFloat(widget, align);
        widget.$form.find('select[name=align]').val(align);
    };


    var _initMediaSizer = function(widget){

        var img = widget.element,
            $src = widget.$form.find('input[name=src]'),
            $mediaResizer = widget.$form.find('.img-resizer'),
            $mediaSpan = widget.$container;

        if($src.val()){

            //init data-responsive:
            if(img.data('responsive') === undefined){
                if(img.attr('width') && !/[0-9]+%/.test(img.attr('width'))){
                    img.data('responsive', false);
                }else{
                    img.data('responsive', true);
                }
            }

            //hack to fix the initial width issue:
            if(img.data('responsive')){
                $mediaSpan.css('width', img.attr('width'))
                $mediaSpan.css('height', '')
            }
            
            //init media sizer
            $mediaResizer.mediasizer({
                responsive : (img.data('responsive') !== undefined) ? !!img.data('responsive') : true,
                target : widget.$original,
                applyToMedium: false
            });

            //bind modification events
            $mediaResizer
                .off('.mediasizer')
                .on('responsiveswitch.mediasizer', function(e, responsive){
                
                    img.data('responsive', responsive);
                    
                })
                .on('sizechange.mediasizer', function(e, size){


                _(['width', 'height']).each(function(sizeAttr){
                    if(size[sizeAttr] === '' || size[sizeAttr] === undefined || size[sizeAttr] === null){
                        img.removeAttr(sizeAttr);
                        $mediaSpan.css(sizeAttr, '')
                    }else{
                        img.attr(sizeAttr, size[sizeAttr]);
                        $mediaSpan.css(sizeAttr, size[sizeAttr])
                    }
                    
                    //trigger choice container size adaptation
                    widget.$container.trigger('contentChange.qti-widget');
                });

            });
        }

    };

    var _initAdvanced = function(widget){

        var $form = widget.$form,
            src = widget.element.attr('src');

        if(src){
            $form.find('[data-role=advanced]').show();
        }else{
            $form.find('[data-role=advanced]').hide();
        }
    };


    var _initUpload = function(widget){

        var $form = widget.$form,
            options = widget.options,
            img = widget.element,
            $uploadTrigger = $form.find('[data-role="upload-trigger"]'),
            $src = $form.find('input[name=src]'),
            $label = $form.find('input[name=alt]');

        var _openResourceMgr = function(){
            $uploadTrigger.resourcemgr({
                title : __('Please select an image file from the resource manager. You can add files from your computer with the button "Add file(s)".'),
                appendContainer : options.mediaManager.appendContainer,
                root : '/',
                browseUrl : options.mediaManager.browseUrl,
                uploadUrl : options.mediaManager.uploadUrl,
                deleteUrl : options.mediaManager.deleteUrl,
                downloadUrl : options.mediaManager.downloadUrl,
                params : {
                    uri : options.uri,
                    lang : options.lang,
                    filters : 'image/jpeg,image/png,image/gif'
                },
                pathParam : 'path',
                select : function(e, files){
                    var file, label;
                    if(files && files.length){
                        file = files[0].file;
                        imageUtil.getSize(options.baseUrl + file, function(size){

                            if($.trim($label.val()) === ''){
                                label = _extractLabel(file);
                                img.attr('alt', label);
                                $label.val(label).trigger('change');
                            }
                            _.defer(function(){
                                $src.val(file).trigger('change');
                            });
                        });
                    }
                },
                open : function(){
                    //hide tooltip if displayed
                    if($src.hasClass('tooltipstered')){
                        $src.blur().tooltipster('hide');
                    }
                },
                close : function(){
                    //triggers validation : 
                    $src.blur();
                }
            });
        };

        $uploadTrigger.on('click', _openResourceMgr);

        //if empty, open file manager immediately
        if(!$src.val()){
            _openResourceMgr();
        }

    };

    return ImgStateActive;
});
