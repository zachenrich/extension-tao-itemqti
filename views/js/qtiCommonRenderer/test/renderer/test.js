define([
    'lodash',
    'jquery',
    'taoQtiItem/qtiItem/core/Loader',
    'taoQtiItem/qtiItem/core/Element',
    'taoQtiItem/qtiCommonRenderer/renderers/Renderer',
    'json!taoQtiItem/qtiItem/../../../test/samples/json/ALL.json'
], function(_, $, Loader, Element, Renderer, data){

    var CL = console.log;

    var _responseEqual = function(actual, expected, ordered){
        ordered = ordered || false;
        var responseStr = JSON.stringify(expected);
        if(actual.base || actual.list && ordered){
            deepEqual(actual, expected, 'response matches : ' + responseStr);
        }else if(actual.list && expected.list){
            var _isListEqual = function(actualList, expectedList){
                var ret = true;
                for(var i in actualList){
                    if(typeof(actualList[i]) === 'object'){
                        ret = _isListEqual(actualList[i], expectedList[i]);
                    }else{
                        ret = (!_.difference(actual.list[i], expected.list[i]).length);
                    }
                    if(!ret){
                        break;
                    }
                }
                return ret;
            };
            ok(_isListEqual(actual.list, expected.list), 'unordered listed response matches :' + responseStr);
        }else{
            deepEqual(actual, expected, 'special reponse format matching : ' + responseStr);
        }
    };

    var Test = {
        testRender : function(itemIdentifier, attributes, responses){

            if(data[itemIdentifier]){

                test('render', function(){

                    var loader = new Loader();
                    var renderer = new Renderer({
                        runtimeContext : {
                            runtime_base_www : '/taoQtiItem/test/samples/test_base_www/',
                            root_url : '',
                            debug : true
                        }
                    });

                    stop();//wait for the next start()

                    loader.loadItemData(data[itemIdentifier].full, function(item){
                        
                        ok(Element.isA(item, 'assessmentItem'), itemIdentifier + ' item loaded');

                        //count interaction number:
                        var interactions = item.getInteractions();
                        ok(interactions.length, 'has ' + interactions.length + ' interaction(s)');

                        //test only the last interaction:
                        var interaction = interactions.pop();
                        interaction.attr(attributes);//overwrite attributes for test purpose:

                        //append item placeholder and render it:
                        var $placeholder = $('<div>', {id : 'qtiItem-' + item.id()});
                        var $title = $('<h2>', {text : 'identifier : ' + item.id()});
                        $("#qunit-fixture").after($placeholder.before($title));

                        renderer.load(function(){

                            start();

                            //set renderer
                            item.setRenderer(this);

                            //render tpl:
                            try{
                                item.render({}, $placeholder);
                            }catch(e){
                                CL('error in template rendering', e);
                            }

                            //check item container:
                            ok(item.getContainer().length, 'rendered container found');

                            //post render:
                            try{
                                item.postRender();
                            }catch(e){
                                CL('error in post rendering', e);
                            }

                            if(_.isArray(responses)){
                                //test responses set() and get():
                                _.each(responses, function(response){
                                    interaction.setResponse({});//reset response
                                    interaction.setResponse(response.set ? response.set : response);//assign the given value
                                    _responseEqual(interaction.getResponse(), response.get ? response.get : response);//test the assigned value
                                });
                            }

                        }, this.getLoadedClasses());

                    });

                });
            }else{
                throw new Error('item sample not found : ' + itemIdentifier);
            }
        }
    };

    return Test;
});
