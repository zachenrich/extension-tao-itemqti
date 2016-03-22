<?php
/**
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
 * Copyright (c) 2016  (original work) Open Assessment Technologies SA;
 *
 * @author Alexander Zagovorichev <zagovorichev@1pt.com>
 */

namespace oat\taoQtiItem\test\RestApi\v1;


use oat\tao\test\TaoPhpUnitTestRunner;
use oat\taoItems\model\Rest\v1\ItemsRdfStorage;
use oat\taoQtiItem\model\RestApi\v1\HttpRoute;
use oat\taoRestAPI\exception\RestApiException;
use oat\taoRestAPI\model\v1\http\Request\DataFormat;
use oat\taoRestAPI\service\v1\RestApiService;
use oat\taoRestAPI\test\v1\Mocks\EnvironmentTrait;
use oat\taoRestAPI\test\v1\Mocks\FailedAuth;
use taoItems_models_classes_ItemsService;


define('TAO_ITEM_CLASS', 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item');
define('TAO_ITEM_MODEL_PROPERTY', 'http://www.tao.lu/Ontologies/TAOItem.rdf#ItemModel');
define('TAO_ITEM_CONTENT_PROPERTY', 'http://www.tao.lu/Ontologies/TAOItem.rdf#ItemContent');

class RestApiServiceTest extends TaoPhpUnitTestRunner
{
    use EnvironmentTrait;

    /**
     * @var RestApiService
     */
    private $service;

    /**
     * @var taoItems_models_classes_ItemsService
     */
    private $itemService;
    
    public function setUp()
    {
        parent::setUp();
        $this->service = new RestApiService();
        $this->itemService = taoItems_models_classes_ItemsService::singleton();;
    }

    public function testServiceAuth()
    {
        $this->request('GET', '/resources', function ($req, $res, $args) {

            try {
                $this->service
                    ->setEncoder(new DataFormat())
                    ->setRouter(new HttpRoute(new ItemsRdfStorage($this->itemService)))
                    ->setAuth(new FailedAuth())
                    ->execute(function ($router, $encoder) use ($req, &$res) {
                        $router($req, $res);
                        $res->write($encoder->encode($res->getResourceData()));
                    });
            } catch (RestApiException $e) {
                $res = $res->withStatus($e->getCode());
                $res = $res->withJson(['errors' => [$e->getMessage()]]);
            }

            return $this->response = $res;
        });

        $this->assertEquals(401, $this->response->getStatusCode());
        $this->assertEquals('Unauthorized', $this->response->getReasonPhrase());
        $this->assertEquals('{"errors":["Testing for fail auth"]}', (string)$this->response->getBody());
    }
/*
    public function testServiceWithoutCallable()
    {
        $this->request('GET', '/resources', function ($req, $res, $args) {

            try {
                $this->service
                    ->setEncoder(new DataFormat())
                    ->setRouter(new TestHttpRoute())
                    ->execute($a = '1');
            } catch (RestApiException $e) {
                $res = $res->withStatus($e->getCode());
                $res = $res->withJson(['errors' => [$e->getMessage()]]);
            }

            return $this->response = $res;
        });

        $this->assertEquals(500, $this->response->getStatusCode());
        $this->assertEquals('Internal Server Error', $this->response->getReasonPhrase());
        $this->assertEquals('{"errors":["$callable must be a closure function"]}', (string)$this->response->getBody());
    }

    public function testServiceWithoutRoute()
    {
        $this->request('GET', '/resources', function ($req, $res, $args) {

            try {
                $this->service
                    ->setEncoder(new DataFormat())
                    ->execute(function ($router, $encoder) use ($req, &$res) {
                        $router($req, $res);
                        $res->write($encoder->encode($res->getResourceData()));
                    });
            } catch (RestApiException $e) {
                $res = $res->withStatus($e->getCode());
                $res = $res->withJson(['errors' => [$e->getMessage()]]);
            }

            return $this->response = $res;
        });

        $this->assertEquals(500, $this->response->getStatusCode());
        $this->assertEquals('Internal Server Error', $this->response->getReasonPhrase());
        $this->assertEquals('{"errors":["HttpRouter is not set"]}', (string)$this->response->getBody());
    }

    public function testServiceGetList()
    {
        $this->request('GET', '/resources', function ($req, $res, $args) {

            try {

                $this->service
                    ->setEncoder(new DataFormat())
                    ->setRouter(new TestHttpRoute())
                    ->execute(function ($router, $encoder) use ($req, &$res) {
                        $router($req, $res);
                        $res->write($encoder->encode($res->getResourceData()));
                    });
            } catch (RestApiException $e) {
                $res = $res->withStatus($e->getCode());
                $res = $res->withJson(['errors' => [$e->getMessage()]]);
            }

            return $this->response = $res;
        });

        $this->assertEquals(200, $this->response->getStatusCode());
        $this->assertEquals('OK', $this->response->getReasonPhrase());
        $this->assertEquals(['0-4/5'], $this->response->getHeader('Content-Range'));
        $this->assertEquals(['resource 50'], $this->response->getHeader('Accept-Range'));
        $this->assertEquals('[{"id":1,"title":"Potato","type":"vegetable","form":"circle","color":"brown"},{"id":2,"title":"Lemon","type":"citrus","form":"ellipse","color":"yellow"},{"id":3,"title":"Lime","type":"citrus","form":"ellipse","color":"green"},{"id":4,"title":"Carrot","type":"vegetable","form":"conical","color":"orange"},{"id":5,"title":"Orange","type":"citrus","form":"circle","color":"orange"}]', (string)$this->response->getBody());
    }

    public function testServiceGetListDefaultEncoder()
    {
        $this->request('GET', '/resources', '/resources?range=0-1', function ($req, $res, $args) {

            try {

                $this->service
                    ->setRouter(new TestHttpRoute())
                    ->execute(function ($router, $encoder) use ($req, &$res) {
                        $router($req, $res);
                        $res->write($encoder->encode($res->getResourceData()));
                    });
            } catch (RestApiException $e) {
                $res = $res->withStatus($e->getCode());
                $res = $res->withJson(['errors' => [$e->getMessage()]]);
            }

            return $this->response = $res;
        });

        $this->assertEquals(206, $this->response->getStatusCode());
        $this->assertEquals('Partial Content', $this->response->getReasonPhrase());
        $this->assertEquals('[{"id":1,"title":"Potato","type":"vegetable","form":"circle","color":"brown"},{"id":2,"title":"Lemon","type":"citrus","form":"ellipse","color":"yellow"}]', (string)$this->response->getBody());
        $this->assertEquals(['0-1/5'], $this->response->getHeader('Content-Range'));
        $this->assertEquals(['resource 50'], $this->response->getHeader('Accept-Range'));
    }

    public function testServiceGetListXmlEncoder()
    {
        $this->request('GET', '/resources', '/resources?range=1-1', function ($req, $res, $args) {

            $_SERVER['HTTP_ACCEPT'] = 'text/xml';
            try {

                $this->service
                    ->setEncoder(new DataFormat())
                    ->setRouter(new TestHttpRoute())
                    ->execute(function ($router, $encoder) use ($req, &$res) {
                        $router($req, $res);
                        $res->write($encoder->encode($res->getResourceData()));
                    });
            } catch (RestApiException $e) {
                $res = $res->withStatus($e->getCode());
                $res = $res->withJson(['errors' => [$e->getMessage()]]);
            }

            return $this->response = $res;
        });

        $this->assertEquals(206, $this->response->getStatusCode());
        $this->assertEquals('Partial Content', $this->response->getReasonPhrase());
        $this->assertEquals(['1-1/5'], $this->response->getHeader('Content-Range'));
        $this->assertEquals(['resource 50'], $this->response->getHeader('Accept-Range'));
        $this->assertEquals("<?xml version=\"1.0\"?>\n<root>\n  <element>\n    <id>2</id>\n    <title>Lemon</title>\n    <type>citrus</type>\n    <form>ellipse</form>\n    <color>yellow</color>\n  </element>\n</root>\n", (string)$this->response->getBody());
    }*/
}
