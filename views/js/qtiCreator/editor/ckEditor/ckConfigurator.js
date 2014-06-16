define([
    'lodash',
    'ckeditor',
    'taoQtiItem/qtiCreator/editor/ckEditor/dtdHandler'
], function(_, ckeditor, dtdHandler){
    'use strict';
    /**
     * Cache original config
     */
    var originalConfig = _.cloneDeep(CKEDITOR.config);

    var ckConfigurator = (function(){

        // This is different from CKEDITOR.config.extraPlugins since it also allows to position the button
        // Valid positioning keys are insertAfter | insertBefore | replace followed by the button name, e.g. 'Anchor'
        // separator bool, defaults to false
        // don't get confused by the naming - TaoMediaManager is the button name for the plugin taomediamanager
        var positionedPlugins = {
            TaoMediaManager : {
                insertAfter : 'SpecialChar'
            }
        };

        var qtiPositionedPlugins = {
//            TaoQtiMedia : {
//                insertAfter : 'SpecialChar'
//            },
            TaoQtiImage : {
                insertAfter : 'SpecialChar'
            },
            TaoQtiMaths : {
                insertAfter : 'SpecialChar'
            }
        };
        
        /**
         * Toolbar presets that you normally never would need to change, they can however be overridden with options.toolbar.
         * The argument 'toolbarType' determines which toolbar to use
         */
        var toolbarPresets = {
            inline : [{
                    name : 'basicstyles',
                    items : ['Bold', 'Italic', 'Subscript', 'Superscript']
                }, {
                    name : 'insert',
                    items : ['SpecialChar']
                }, {
                    name : 'links',
                    items : ['Link']
                }],
            flow : [{
                    name : 'basicstyles',
                    items : ['Bold', 'Italic', 'Subscript', 'Superscript']
                }, {
                    name : 'insert',
                    items : ['SpecialChar']
                }, {
                    name : 'links',
                    items : ['Link']
                }],
            block : [{
                    name : 'basicstyles',
                    items : ['Bold', 'Italic', 'Subscript', 'Superscript']
                }, {
                    name : 'insert',
                    items : ['Image', 'Table', 'SpecialChar']
                },
                {
                    name : 'links',
                    items : ['Link']
                },
                '/',
                {
                    name : 'styles',
                    items : ['Format']
                }, {
                    name : 'paragraph',
                    items : ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
                }
            ]
        };

        /**
         * defaults for editor configuration
         */
        var ckConfig = {
            disableAutoInline : true,
            entities: false,
            entities_processNumerical: true,
            autoParagraph : false,
            extraPlugins : 'confighelper',
            floatSpaceDockedOffsetY : 0,
            forcePasteAsPlainText : true,
            skin : 'tao',
            language : 'en',
            removePlugins : '',
            linkShowAdvancedTab:false,
            justifyClasses: ['txt-lft', 'txt-ctr', 'txt-rgt', 'txt-jty'],
            linkShowTargetTab:false
        };

        /**
         * Insert positioned plugins at position specified in options.positionedPlugins
         *
         * @param ckConfig
         * @param positionedPlugins
         */
        var _updatePlugins = function(ckConfig, positionedPlugins){
            var itCnt,
                tbCnt = ckConfig.toolbar.length,
                itLen,
                method,
                plugin,
                index,
                separator,
                idxItem,
                numToReplace,
                stringVal,
                stringVals = {},
                i;

            // add positioned plugins to extraPlugins and let CKEDITOR take care of their registration
            ckConfig.extraPlugins = (function(positionedPluginArr, extraPlugins){
                var i = positionedPluginArr.length,
                    extraPluginArr = extraPlugins.split(',');

                while(i--){
                    positionedPluginArr[i] = positionedPluginArr[i].toLowerCase();
                }

                extraPluginArr = _.compact(_.union(extraPluginArr, positionedPluginArr));
                return extraPluginArr.join(',');

            }(_.keys(positionedPlugins), ckConfig.extraPlugins));

            // capture line breaks (/) and such
            // and turn them into a objects temporarily
            for(i = 0; i < tbCnt; i++){
                if(_.isString(ckConfig.toolbar[i])){
                    stringVals[i] = ckConfig.toolbar[i];
                    ckConfig.toolbar[i] = {
                        items : []
                    };
                }
            }

            // add positioned plugins to toolbar
            for(plugin in positionedPlugins){

                method = (function(pluginProps){
                    var i = pluginProps.length;
                    while(i--){
                        if(pluginProps[i].indexOf('insert') === 0 || pluginProps[i] === 'replace'){
                            return pluginProps[i];
                        }
                    }

                    throw 'Missing key insertBefore | insertAfter | replace in positionedPlugins';

                }(_.keys(positionedPlugins[plugin])));


                // the item to insert before | after
                idxItem = positionedPlugins[plugin][method].toLowerCase();
                separator = positionedPlugins[plugin].separator || false;
                index = -1;

                // each button row
                while(tbCnt--){
                    itLen = ckConfig.toolbar[tbCnt].items.length;

                    // each item in row
                    for(itCnt = 0; itCnt < itLen; itCnt++){
                        if(ckConfig.toolbar[tbCnt].items[itCnt].toLowerCase() === idxItem){
                            index = itCnt;
                            break;
                        }
                    }
                    //continue
                    if(index > -1){
                        // ~~ converts bool to number
                        numToReplace = ~~(method === 'replace');
                        if(method === 'insertAfter'){
                            index++;
                        }
                        if(separator){
                            ckConfig.toolbar[tbCnt].items.splice(index, numToReplace, '-');
                            index++;
                        }
                        ckConfig.toolbar[tbCnt].items.splice(index, numToReplace, plugin);
                        break;
                    }
                }
                // reset tbCnt
                tbCnt = ckConfig.toolbar.length;
            }


            // re-add toolbar line breaks
            for(stringVal in stringVals){
                ckConfig.toolbar[stringVal] = stringVals[stringVal];
            }

        };


        /**
         * Generate a configuration object for CKEDITOR
         *
         * Options not covered in http://docs.ckeditor.com/#!/api/CKEDITOR.config:
         * options.dtdOverrides         -> @see dtdOverrides which pre-defines them
         * options.positionedPlugins    -> @see ckConfig.positionedPlugins
         *
         * @param editor instance of ckeditor
         * @param toolbarType block | inline | flow | qtiBlock | qtiInline | qtiFlow | reset to get back to normal
         * @param options is based on the CKEDITOR config object with some additional sugar
         *        Note that it's here you need to add parameters for the resource manager
         * @see http://docs.ckeditor.com/#!/api/CKEDITOR.config
         */
        var getConfig = function(editor, toolbarType, options){
            if(toolbarType === 'reset'){
                return originalConfig;
            }

            options = options || {};

            options.resourcemgr = options.resourcemgr || {};

            var toolbar,
                toolbars = _.clone(toolbarPresets, true),
                config,
                dtdMode = 'html';

            // modify DTD to either comply with QTI or XHTML
            if(toolbarType.indexOf('qti') === 0){
                toolbarType = toolbarType.slice(3).toLowerCase();
                ckConfig.allowedContent = true;
                ckConfig.autoParagraph = false;
                dtdMode = 'qti';
            }

            // if there is a toolbar in the options add it to the set
            if(options.toolbar){
                toolbars[toolbarType] = _.clone(options.toolbar);
                delete(options.toolbar);
            }

            // add toolbars to config
            for(toolbar in toolbars){
                if(toolbars.hasOwnProperty(toolbar)){
                    ckConfig['toolbar_' + toolbar] = toolbars[toolbar];
                }
            }

            // add the toolbar
            if(typeof toolbars[toolbarType] !== 'undefined'){
                ckConfig.toolbar = toolbars[toolbarType];
            }

            // modify plugins - this will change the toolbar too
            // this would add the qti plugins qtiPositionedPlugins
            if(typeof options.positionedPlugins !== 'undefined') {
                options.positionedPlugins = {};
            }

            // set options.positionedPlugins to false to prevent the class from using them at all
            if(false !== options.positionedPlugins) {
                if(dtdMode === 'qti'){
                    positionedPlugins = _.assign(qtiPositionedPlugins, _.clone(options.positionedPlugins));
                }
                // this would add positionedPlugins (e.g. the media manager)
                else{
                    positionedPlugins = _.assign(positionedPlugins, _.clone(options.positionedPlugins));
                }
                delete(options.positionedPlugins);
                _updatePlugins(ckConfig, positionedPlugins);
            }

            config = _.assign({}, _.cloneDeep(originalConfig), ckConfig, options);

            // debugger: has this config been used?
            //config.aaaConfigurationHasBeenLoadedFromConfigurator = true;

            // toggle global DTD
            // I know that this is rather ugly
            editor.on('focus', function(e){
                dtdHandler.setMode(dtdMode);
                CKEDITOR.dtd = dtdHandler.getDtd();
                // should be 1 on html, undefined on qti
                // console.log(CKEDITOR.dtd.pre.img)
            });
            // remove title 'Rich Text Editor, instance n' that CKE sets by default
            // ref: http://tinyurl.com/keedruc
            editor.on('instanceReady', function(e){
                $(e.editor.element.$).removeAttr("title");
            });

            return config;
        };

        return {
            getConfig : getConfig
        };

    }());

    return ckConfigurator;
});

