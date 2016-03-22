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

namespace oat\taoQtiItem\model\RestApi\v1;


use oat\taoRestAPI\exception\HttpRequestException;
use oat\taoRestAPI\exception\HttpRequestExceptionWithHeaders;
use oat\taoRestAPI\model\DataStorageInterface;
use oat\taoRestAPI\model\v1\http\filters\Filter;
use oat\taoRestAPI\model\v1\http\filters\Paginate;
use oat\taoRestAPI\model\v1\http\filters\Partial;
use oat\taoRestAPI\model\v1\http\filters\Sort;
use oat\taoRestAPI\model\v1\http\Request\Router;
use Request;
use Response;

if (!defined('API_HOST')) {
    define('API_HOST', trim(preg_replace('|^.*://(.*)$|', "\\1", ROOT_URL), '/'));
}

define('ITEMS_REST_URI', '/taoQtiItem/RestApi/v1/');

/**
 * Class HttpRoute
 * @package oat\taoRestAPI\model\example\v1
 * 
 * #######
 * ===
 * 
 * @SWG\Swagger(
 *   swagger="2.0",
 *   schemes={"http","https"},
 *   host=API_HOST,
 *   basePath=ITEMS_REST_URI,
 *   consumes={"application/json","application/xml"},
 *   produces={"application/json","application/xml"},
 *   @SWG\Info(
 *     title="TAO RestAPI for items",
 *     version="1.0.0",
 *     description="RestAPI control for TAO Items.
 *      [Learn about TAO](http://www.taotesting.com/).
 *      For this sample, you can use the api key `oAuth-token-for-test`",
 *     termsOfService="http://www.taotesting.com/resources/faq/",
 *     @SWG\Contact(
 *       name="Open Assessment Technologies S.A.",
 *       email="contact@taotesting.com",
 *       url="http://www.taotesting.com/contact/"
 *     ),
 *     @SWG\License(
 *       name="GNU General Public License",
 *       url="http://www.gnu.org/licenses/gpl.html"
 *     ),
 *   )
 * )
 *
 * ### Models
 * ---
 * @SWG\Definition(
 *     required={"title", "type"}, 
 *     @SWG\Xml(name="Resource"),
 *     @SWG\Property(title="id",format="int64"),
 *     definition="Resource for test"
 * )
 * ===
 * ###
 * 
 * 
 * ### Tags
 * ---
 * @SWG\Tag(
 *   name="Items of the TAO",
 *   description="Items"
 * )
 * ===
 * ###
 *
 * 
 * ### List of the items
 * ---
 * 
 * @SWG\Get(
 *   path="items",
 *   summary="All items",
 *   description="Get list of the items",
 *   tags={"Items of the TAO"},
 *   operationId="getList",
 *   consumes={"application/xml", "application/json"},
 *   produces={"application/xml", "application/json"},
 *   @SWG\Response(
 *     response=200,
 *     description="OK",
 *     @SWG\Schema(ref="#/definitions/Items")
 *   ),
 *     
 *   @SWG\Parameter(
 *     name="range",
 *     in="query",
 *     type="string",
 *     description="Paginate by the resources {0-1}",
 *     required=false,
 *     collectionFormat="multi"
 *   ),
 *   @SWG\Parameter(
 *     name="title",
 *     in="query",
 *     description="Filter by title (Potato,Orange)",
 *     required=false,
 *     type="string",
 *     @SWG\Items(type="array"),
 *     collectionFormat="multi"
 *   ),
 *   @SWG\Parameter(
 *     name="type",
 *     in="query",
 *     description="Filter by type (vegetable)",
 *     required=false,
 *     type="string",
 *     @SWG\Items(type="array"),
 *     collectionFormat="multi"
 *   ),
 *   @SWG\Parameter(
 *     name="fields",
 *     in="query",
 *     description="Return only specified fields (title,type)",
 *     required=false,
 *     type="string",
 *     @SWG\Items(type="array"),
 *     collectionFormat="multi"
 *   ),
 *   @SWG\Parameter(
 *     name="sort",
 *     in="query",
 *     description="Sorting by fields ASC (title,type)",
 *     required=false,
 *     type="string",
 *     @SWG\Items(type="array"),
 *     collectionFormat="multi"
 *   ),
 *   @SWG\Parameter(
 *     name="desc",
 *     in="query",
 *     description="Using with ?sort=field, and set DESC direction for field (title,type) ",
 *     required=false,
 *     type="string",
 *     @SWG\Items(type="array"),
 *     collectionFormat="multi"
 *   ), 
 *     
 *   @SWG\Response(
 *     response=206,
 *     description="Partial Content",
 *     @SWG\Schema(ref="#/definitions/Resource")
 *   ),
 *   @SWG\Response(
 *     response=400,
 *     description="Incorrect range parameter. Try to use: ?range=0-25"
 *   ),
 *   @SWG\Response(
 *     response=406,
 *     description="Not acceptable encoding format"
 *   ),
 *
 * )
 * 
 * ====
 * ###
 * 
 * ### Get one resource 
 * 
 * @SWG\Get(
 *   path="resources/{id}",
 *   summary="Find resource by ID",
 *   tags={"Resources for example"},
 *   operationId="getItem",
 *   @SWG\Parameter(
 *      name="id",
 *      in="query",
 *      type="string",
 *      description="Unique Id of the resource",
 *      required=true
 *   ),
 *   @SWG\Response(
 *     response=200,
 *     description="A list with resources|Resource was found"
 *   ),
 *   @SWG\Response(
 *     response="default",
 *     description="an unexpected error"
 *   )
 * )
 * 
 * ===
 * #######
 */
class HttpRoute extends Router
{
    /**
     * @var Request
     */
    protected $req;

    /**
     * @var Response
     */
    protected $res;

    /**
     * Response headers for header() 
     * @var array
     */
    private $httpHeaders = [];

    /**
     * Response status code for header() 
     * @var int
     */
    private $httpStatusCode = 200;

    /**
     * Response Body Data
     * @var
     */
    private $bodyData;

    /**
     * @var DataStorageInterface
     */
    private $storage;
    
    public function __construct(DataStorageInterface $storage)
    {
        $this->storage = $storage;
    }

    public function __invoke(Request $request, Response $response)
    {
        $this->req = $request;
        $this->res = $response;

        $this->runApiCommand($this->req->getMethod(), $this->req->getParameter('uri'));
    }

    public function getHeaders()
    {
        return $this->httpHeaders;
    }

    public function getStatusCode()
    {
        return $this->httpStatusCode;
    }
    
    public function getBodyData()
    {
        return $this->bodyData;
    }

    private function addFilterHeadersInResponse(array $addHeaders)
    {
        if (count($addHeaders)) {
            foreach ($addHeaders as $name => $headers) {
                $this->httpHeaders[$name] = $headers; 
            }
        }
    }
    
    protected function getList()
    {
        $queryParams = $this->req->getParameters();

        $filter = new Filter([
            'query' => $queryParams,
            'fields' => $this->storage->getFields(),
        ]);
        
        try {
            $paginate = new Paginate([
                'query' => isset($queryParams['range']) ? $queryParams['range'] : '',
                'total' => $this->storage->getCount(),
                'paginationUrl' => ROOT_URL . ITEMS_REST_URI . '?range=',
            ]);
        } catch (HttpRequestExceptionWithHeaders $e) {
            // add failed headers if exists
            $this->addFilterHeadersInResponse($e->getHeaders());
            throw new HttpRequestException($e->getMessage(), $e->getCode());
        }

        $partial = new Partial([
            'query' => isset($queryParams['fields']) ? $queryParams['fields'] : '',
            'fields' => $this->storage->getFields(),
        ]);

        $sort = new Sort(['query' => $queryParams]);

        $this->bodyData = $this->storage->searchInstances([

            // use filter by values
            'filters' => $filter->getFilters(),

            // columns
            'fields' => $partial->getFields(),

            // sort
            'sortBy' => $sort->getSorting(),

            // pagination
            'offset' => $paginate->offset(),
            'limit' => $paginate->length(),
        ]);

        $beforePaginationCount = count($this->storage->searchInstances(['filters' => $filter->getFilters()]));

        $paginate->correctPaginationHeader(count($this->bodyData), $beforePaginationCount);

        if ($paginate->getStatusCode()) {
            $this->httpStatusCode = $paginate->getStatusCode();
        }

        // success headers
        $this->addFilterHeadersInResponse($paginate->getHeaders());
    }
    
    protected function getOne()
    {
        echo 'one';
    }
}
