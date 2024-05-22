import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export declare namespace OpenAPI {
  type Document = OpenAPIV3.Document | OpenAPIV3_1.Document;
  type Info = OpenAPIV3.InfoObject | OpenAPIV3_1.InfoObject;
  type PathsObject = OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject;
  type PathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;
  type OperationObject =
    | OpenAPIV3.OperationObject
    | OpenAPIV3_1.OperationObject;
  type ReferenceObject =
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3_1.ReferenceObject;
  type ParameterObject =
    | OpenAPIV3.ParameterObject
    | OpenAPIV3_1.ParameterObject;
  type RequestBodyObject =
    | OpenAPIV3.RequestBodyObject
    | OpenAPIV3_1.RequestBodyObject;
  type MediaTypeObject =
    | OpenAPIV3.MediaTypeObject
    | OpenAPIV3_1.MediaTypeObject;
  type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
  type ResponsesObject =
    | OpenAPIV3.ResponsesObject
    | OpenAPIV3_1.ResponsesObject;
  type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
  type ComponentsObject =
    | OpenAPIV3.ComponentsObject
    | OpenAPIV3_1.ComponentsObject;
}
