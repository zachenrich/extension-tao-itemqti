/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'taoQtiItem/qtiCommonRenderer/helpers/Graphic',
    'taoQtiItem/qtiCreator/widgets/interactions/helpers/shapeSideBar',
    'taoQtiItem/qtiCreator/widgets/interactions/helpers/shapeFactory',
    'taoQtiItem/qtiCreator/widgets/interactions/helpers/shapeEditor',
], function($, _, GraphicHelper, shapeSideBar, shapeFactory, shapeEditor){

    /**
     * This factory creates an new shape editor. 
     * The editor manages to create the side bar to add, move, resize and delete the interaction shapes.
     * @exports taoQtiItem/qtiCreator/widgets/interactions/helpers/graphicInteractionShapeEditor
     * @param {Object} widget - the graphic interaction widget
     * @param {Object} [options]
     * @param {Array<String>} [options.currents] - the list of current shapes ids (use interaction's choices serial by default)
     * @param {Boolean} [options.target = false]  - if the side bar contains a target type (to select a point)
     * @param {shapeCreated} [options.shapeCreated]
     * @param {shapeRemoved} [options.shapeRemoved]
     * @param {shapeChange} [options.shapeChange]
     * @param {enterHandling} [options.enterHandling]
     * @param {quitHandling} [options.quitHandling]
     * @returns {InteractionShapeEditor}
     */
    return function factory(widget, options){

        /**
         * One by interaction, but itthat contains multipe shapeEditor (one by shape).
         * @typedef InteractionShapeEditor
         */
        var interactionShapeEditor = {

            //keep the ref to the editor to be able to destroy them later
            editors :  [],

            /**
             * Create the editor
             */
            create : function(){
                var editors     = this.editors;
                var factories   = {};
                var $container  = widget.$container;
                var $original   = widget.$original;
                var interaction = widget.element;
                var paper       = interaction.paper;
                var image       = paper.getById('bg-image-' + interaction.serial);
                var currents    = options.currents || _.pluck(interaction.getChoices(), 'serial');

                //set up shape cnotextual options
                var shapeOptions = {
                    paper : interaction.paper, 
                    background : image, 
                    $container : $container.find('.main-image-box'), 
                    isResponsive : $original.hasClass('responsive')
                };
            
                //create the side bar 
                var $sideBar = shapeSideBar.create($container, !!options.target); 

                //once a shape type is selected
                $sideBar.on('shapeactive.qti-widget', function(e, $form, type){
            
                    //enable to create a shape of the given type
                    createShape(type, function shapeCreated (shape){

                        if(_.isFunction(options.shapeCreated)){
                        
                            /**
                             * Called back when a shape is created
                             * @callback shapeCreated
                             * @param {Raphael.Element} shape - the new shape
                             * @param {String} type - the new shape type 
                             */
                            options.shapeCreated(shape, type);
                        }                
                        
                        //deactivate the form in the sidebar
                        $form.removeClass('active');

                        //start the shape editor (hnadling, resize, move)
                        editShape(shape, true);
                        
                    });
                });

                //retrieve the current shapes and make them editable
                _.forEach(currents, function(id){
                    var element = paper.getById(id);
                    if(element){
                        element
                            .attr(GraphicHelper._style.creator)
                            .unmouseover()
                            .unmouseout();
                        editShape(element);
                    }
                });

                /**
                 * Make a shape editable
                 * @private
                 * @param {Raphael.Element} shape - the shape to make editable
                 * @param {Boolean} [enterHandling = false]  - wether to enter handling directly
                 */
                function editShape(shape, enterHandling){

                    var editor = shapeEditor(shape, shapeOptions); 
                    editor.on('enterhandling.qti-widget', function(){

                        //only one shape handling at a time
                        _.invoke(_.reject(editors, editor), 'quitHandling');

                        //enable to bin the shape
                        $sideBar
                            .trigger('enablebin.qti-widget')
                            .on('bin.qti-widget', function(){
                                
                                //remove the shape and the editor
                                editor.removeShape();
                                editor.destroy();
                                editors = _.reject(editors, editor);
                                editor = undefined;
                            });
                         
                        if(_.isFunction(options.enterHandling)){
                            
                            /**
                             * Called back when a shape is being handled
                             * @callback enterHandling
                             * @param {Raphael.Element} shape - the shape
                             */
                            options.enterHandling(shape);
                        }                
                    }).on('shapechange.qti-widget', function(){

                        if(_.isFunction(options.shapeChange)){
                            
                            /**
                             * Called back when a shape has changed
                             * @callback shapeChange
                             * @param {Raphael.Element} shape - the shape
                             */
                            options.shapeChange(shape);
                        }                

                    }).on('quithandling.qti-widget', function(){

                        if(_.isFunction(options.quitHandling)){
                            
                            /**
                             * Called back when the handling is left on a shape
                             * @callback quitHandling
                             * @param {Raphael.Element} shape - the shape
                             */
                            options.quitHandling(shape);
                        }                

                        //update the side bar
                        $sideBar
                            .trigger('disablebin.qti-widget')
                            .off('click')
                            .off('bin.qti-widget');

                    }).on('remove.qti-widget', function(id){
                        if(_.isFunction(options.shapeRemoved)){
                            
                            /**
                             * Called back when a shape is removed
                             * @callback shapeRemoved
                             * @param {String} id - the id of the passed away shape
                             */
                            options.shapeRemoved(id);
                        }                
                        _.remove(currents, id);
                    });

                    editors.push(editor);
                    if(enterHandling){
                        editor.enterHandling();
                    }
                }

                /**
                 * Enables to create a shape of the given type
                 * @private
                 * @param {String} type - the shape type (rect, circle, ellipse or path)
                 * @param {Function} created - call back once a new shape is created
                 */
                function createShape(type, created){
                    var factory = factories[type];
                    if(!factories[type]){
                        factory = shapeFactory(_.merge({type : type}, shapeOptions));
                        factories[type] = factory;
                    } 
                    
                    factory.on('created.qti-widget', created); 
                    if( type === 'path'){
                        factory.startDrawingPath();
                    } else {    
                        factory.startWithMouse();
                    }
                }
            },

            /**
             * Destroy the editor
             */
            destroy : function(){

                var $container  = widget.$container;
                var interaction = widget.element;
                var paper       = interaction.paper;
                var currents    = options.currents || _.pluck(interaction.getChoices(), 'serial');

                shapeSideBar.remove($container);
                
                _.invoke(this.editors, 'destroy');

                //reset the shape style
                _.forEach(currents, function(id){
                    var element = paper.getById(id);
                    if(element){
                        element
                            .attr(GraphicHelper._style.basic)
                            .hover(function(){
                                if(!element.flashing){
                                    GraphicHelper.updateElementState(this, 'hover'); 
                                }
                          }, function(){
                                if(!element.flashing){
                                    GraphicHelper.updateElementState(this, this.active ? 'active' : this.selectable ? 'selectable' : 'basic');
                                }
                          });
                    }
                });
            }
        };
    
        return interactionShapeEditor;
    };
});