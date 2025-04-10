import type {
  CodeBlockWriter,
  JSDocStructure,
  ModuleDeclaration,
  OptionalKind,
  SourceFile,
  TypeParameterDeclarationStructure,
} from "ts-morph";
import { STATUS_CODE } from "@std/http/status";

import type { OpenAPI } from "./types/openapi.ts";

import { empty, isOk, notEmpty, resolveRef } from "./utils/mod.ts";
import { pascalCase } from "./utils/case/pascal_case.ts";
import { wait } from "@denosaurs/wait";

export const statusCodes = Object.values(STATUS_CODE) as number[];

export const methods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;
export type Method = typeof methods[number];

export type ParameterObjectMap = Map<string, OpenAPI.ParameterObject>;

export interface Options {
  baseUrls?: string[];
  includeAbsoluteUrl?: boolean;
  includeRelativeUrl?: boolean;
  includeServerUrls?: boolean;
  experimentalURLSearchParams?: boolean;
  experimentalDiscriminator?: string | false;
  experimentalRequireDiscriminator?: boolean;
}

export function escapeObjectKey(key: string): string {
  if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(key)) {
    return key;
  }
  return `"${key}"`;
}

/**
 * Prevents narrowing of string literal union to string.
 *
 * @example
 * ```ts
 * type ThisWillBeNarrowedToString = string | "string" | "number" | "boolean";
 * type ThisWillNotBeNarrowed = NonNullable<string> | "string" | "number" | "boolean";
 * ```
 */
function toSafeUnionString(
  type: string | undefined,
  types: (string | undefined)[],
): string | undefined {
  if (type === "string" && types.length > 1) {
    return "NonNullable<string>";
  }

  return type;
}

export function toSchemaType(
  document: OpenAPI.Document,
  schema?:
    | OpenAPI.ReferenceObject
    | OpenAPI.SchemaObject,
  coerceToString?: boolean,
): string | undefined {
  if (schema === undefined) return undefined;
  if ("$ref" in schema) return pascalCase(schema.$ref.split("/").pop()!);

  if ("nullable" in schema && schema.nullable !== undefined) {
    const type = toSchemaType(
      document,
      { ...schema, nullable: undefined },
      coerceToString,
    );
    if (type !== undefined) return `${type}|null`;
    return "null";
  }

  if (schema.not !== undefined) {
    const type = toSchemaType(
      document,
      { ...schema, not: undefined },
      coerceToString,
    );
    const exclude = toSchemaType(document, schema.not, coerceToString);
    if (type !== undefined && exclude !== undefined) {
      return `Exclude<${type}, ${exclude}>`;
    }
    if (type !== undefined) return type;
    return undefined;
  }

  if (schema.additionalProperties) {
    const type = toSchemaType(document, {
      ...schema,
      additionalProperties: undefined,
    }, coerceToString);
    let additionalProperties;
    if (schema.additionalProperties !== true) {
      additionalProperties = toSchemaType(
        document,
        schema.additionalProperties,
        coerceToString,
      );
    }
    if (type !== undefined) {
      return `${type}&${additionalProperties ?? "Record<string, unknown>"}`;
    }
    return undefined;
  }

  if (schema.allOf) {
    return schema.allOf
      .map((schema) => toSchemaType(document, schema, coerceToString))
      .filter(Boolean)
      .join("&");
  }

  if (schema.oneOf) {
    return schema.oneOf
      .map((schema) => toSchemaType(document, schema, coerceToString))
      .map((type, _, types) => toSafeUnionString(type, types))
      .filter(Boolean)
      .join("|");
  }

  if (schema.anyOf) {
    const objects = schema.anyOf.filter((schema) =>
      "type" in schema && schema.type === "object"
    );

    if (objects.length > 1) {
      console.warn(
        "Usage of anyOf operator with objects is not converted to the equivalent TypeScript type",
      );
      console.group();
      console.warn(schema);
      console.groupEnd();
    }

    // The string union is safe if all types are boolean, string, number, integer,
    // object, array or null. Any other value is not known to be safe and we therefore
    // use the `toSafeUnionString` function to prevent narrowing of the type.
    const safeStringUnion = schema.anyOf.every((schema) =>
      "type" in schema &&
      !("enum" in schema || "oneOf" in schema ||
        "anyOf" in schema || "allOf" in schema) &&
      (schema.type === "boolean" || schema.type === "string" ||
        schema.type === "number" || schema.type === "integer" ||
        schema.type === "object" || schema.type === "array" ||
        schema.type === "null")
    );

    return schema.anyOf
      .map((schema) => toSchemaType(document, schema, coerceToString))
      .map((type, _, types) =>
        safeStringUnion ? type : toSafeUnionString(type, types)
      )
      // Naively removes duplicates.
      .filter((type, index, types) => types.indexOf(type) === index)
      .filter(Boolean)
      .join("|");
  }

  if (schema.enum) {
    return schema.enum.map((value) => JSON.stringify(value)).join("|");
  }

  switch (schema.type) {
    case "boolean":
      if (coerceToString) return "`${boolean}`";
      return "boolean";
    case "string":
      return "string";
    case "number":
    case "integer":
      if (coerceToString) return "`${number}`";
      return "number";
    case "object": {
      if ("properties" in schema && schema.properties !== undefined) {
        const properties = Object.entries(schema.properties);
        if (properties.length === 0) return "Record<string, never>";

        return `{${
          properties
            .map(([property, type]) =>
              `${escapeObjectKey(property)}${
                schema.required?.includes(property) ? "" : "?"
              }:${toSchemaType(document, type, coerceToString)}`
            )
            .join(";")
        }}`;
      }

      if (coerceToString) return "Record<string, string>";
      return "Record<string, unknown>";
    }
    case "array": {
      const items = toSchemaType(document, schema.items, coerceToString);
      if (items !== undefined) return `(${items})[]`;

      if (coerceToString) return "string[]";
      return "unknown[]";
    }
    case "null":
      if (coerceToString) return "`${null}`";
      return "null";
  }

  return undefined;
}

export function writeModuleComment(
  writer: CodeBlockWriter,
  info: OpenAPI.Info,
) {
  writer.writeLine(
    `// This file was automatically generated by [TypeFetch](https://github.com/denosaurs/typefetch) at ${
      new Date().toISOString()
    }`,
  );
  writer.blankLine();

  writer.writeLine("/**");

  writer.writeLine(` * # ${info.title.trim()}`);

  if (notEmpty(info.description)) {
    writer.writeLine(" * ");
    writer.writeLine(
      ` * ${info.description.trim().split("\n").join("\n * ")}`,
    );
  }

  if (
    "summary" in info &&
    notEmpty(info.summary)
  ) {
    writer.writeLine(` * @summary ${info.summary.trim()}`);
  }

  writer.writeLine(" * ");
  writer.writeLine(` * @version ${info.version.trim()}`);

  if (notEmpty(info.license?.name)) {
    writer.writeLine(` * @license ${info.license.name.trim()}`);
  }

  if (notEmpty(info.contact?.name)) {
    writer.write(" * @author ");
    writer.write(info.contact.name!.trim());
    writer.spaceIfLastNot();
    writer.conditionalWrite(
      notEmpty(info.contact.email),
      `<${info.contact.email!.trim()}>`,
    );
    writer.newLine();
  }

  writer.writeLine(" * @module");
  writer.writeLine(" */");
  writer.blankLine();
}

export function addPathsObject(
  global: ModuleDeclaration,
  document: OpenAPI.Document,
  paths: OpenAPI.PathsObject,
  options: Options,
) {
  const spinner = wait("Adding OpenAPI paths").start();

  for (const [pattern, item] of Object.entries(paths)) {
    spinner.text = `Generating ${pattern}...`;
    spinner.render();
    addPathItemObject(global, document, pattern, item, options);
  }

  spinner.succeed("OpenAPI paths added");
}

export function addParameterObjects(
  document: OpenAPI.Document,
  parameters: (OpenAPI.ParameterObject | OpenAPI.ReferenceObject)[],
  map: ParameterObjectMap,
) {
  for (let parameter of parameters) {
    if ("$ref" in parameter) {
      parameter = resolveRef<OpenAPI.ParameterObject>(document, parameter.$ref);
    }
    map.set(parameter.name, parameter);
  }
}

export function addPathItemObject(
  global: ModuleDeclaration,
  document: OpenAPI.Document,
  pattern: string,
  item: NonNullable<OpenAPI.Document["paths"]>[string],
  options: Options,
) {
  if (item === undefined) return;
  if ("$ref" in item && item.$ref !== undefined) {
    item = { ...item, ...resolveRef(document, item.$ref) };
  }

  const parameters = new Map<string, OpenAPI.ParameterObject>();
  if (item.parameters !== undefined) {
    addParameterObjects(document, item.parameters, parameters);
  }

  for (const method of methods) {
    if (method in item) {
      const operation = item[method];

      if (operation === undefined) {
        throw new TypeError(`Operation is undefined for ${method} ${pattern}`);
      }

      addOperationObject(
        global,
        document,
        pattern,
        structuredClone(parameters),
        method,
        operation,
        options,
      );
    }
  }
}

export function createRequestBodyType(
  document: OpenAPI.Document,
  contentType: string,
  schema?: OpenAPI.SchemaObject | OpenAPI.ReferenceObject,
  options?: Options,
): string {
  let type = "BodyInit";

  switch (contentType) {
    case "application/json": {
      type = `JSONString<${toSchemaType(document, schema) ?? "unknown"}>`;
      break;
    }
    case "text/plain": {
      type = "string";
      break;
    }
    case "multipart/form-data": {
      type = "FormData";
      break;
    }
    case "application/x-www-form-urlencoded": {
      const schemaType = toSchemaType(document, schema, true);
      if (schemaType !== undefined) {
        const types = [`URLSearchParamsString<${schemaType}>`];

        // TODO: We don't yet support URLSearchParams with the --experimental-urlsearchparams flag
        if (!options?.experimentalURLSearchParams) {
          types.push(`URLSearchParams<${schemaType}>`);
        }

        return `(${types.join("|")})`;
      } else {
        type = `URLSearchParams`;
      }
      break;
    }
    case "application/octet-stream": {
      type = "ReadableStream | Blob | BufferSource";
      break;
    }
  }

  return type;
}

export function createResponseType(
  document: OpenAPI.Document,
  statusCode: number | number[],
  response: OpenAPI.ResponseObject,
): string {
  const okAndStatus = `ok: ${
    Array.isArray(statusCode)
      ? statusCode.every(isOk)
        ? "true"
        : statusCode.some(isOk)
        ? "boolean"
        : "false"
      : isOk(statusCode)
      ? "true"
      : "false"
  }; status: ${Array.isArray(statusCode) ? statusCode.join("|") : statusCode};`;

  if (empty(response.content)) {
    return `{ ${okAndStatus} }`;
  }

  return `(${
    Object.entries<OpenAPI.MediaTypeObject>(response.content).map(
      ([contentType, object]) => {
        switch (contentType) {
          case "application/json": {
            const type = toSchemaType(document, object.schema);
            return (
              `{ ${okAndStatus} json(): Promise<${type}>; text(): Promise<JSONString<${type}>>; }`
            );
          }
          case "text/plain":
            return (
              `{ ${okAndStatus} text(): Promise<string>; }`
            );
          case "multipart/form-data":
            return (
              `{ ${okAndStatus} formData(): Promise<FormData>; }`
            );
          case "text/event-stream":
            return (
              `{ ${okAndStatus} readonly body: ReadableStream<Uint8Array>; }`
            );
          case "application/octet-stream":
            return (
              `{ ${okAndStatus} readonly body: ReadableStream<Uint8Array>; arrayBuffer(): Promise<ArrayBuffer>; blob(): Promise<Blob>; }`
            );
          default:
            return (
              `{ ${okAndStatus} }`
            );
        }
      },
    ).join("|")
  })`;
}

export function toTemplateString(
  document: OpenAPI.Document,
  pattern: string,
  parameters: ParameterObjectMap,
): string {
  let patternTemplateString = pattern;
  let urlSearchParamsOptional = true;
  const urlSearchParamsRecord = [];

  for (const parameter of parameters.values()) {
    if (parameter.in === "query") {
      if (parameter.required) {
        urlSearchParamsOptional = false;
      }

      const types = [
        toSchemaType(document, parameter.schema, true) ?? "string",
      ];
      if (parameter.allowEmptyValue === true) types.push("true");
      urlSearchParamsRecord.push(
        `${escapeObjectKey(parameter.name)}${!parameter.required ? "?" : ""}: ${
          types.join("|")
        }`,
      );
    }

    if (parameter.in !== "path") continue;

    patternTemplateString = patternTemplateString.replace(
      `{${parameter.name}}`,
      `\${${toSchemaType(document, parameter.schema) ?? "string"}}`,
    );
  }

  const urlSearchParamsType = urlSearchParamsRecord.length > 0
    ? `URLSearchParamsString<{${urlSearchParamsRecord.join(";")}}>`
    : undefined;

  const urlSearchParams = urlSearchParamsType
    ? urlSearchParamsOptional
      ? `\${\`?\${${urlSearchParamsType}}\` | ""}`
      : `?\${${urlSearchParamsType}}`
    : "";

  return `${patternTemplateString}${urlSearchParams}`;
}

export function toHeadersInitType(
  document: OpenAPI.Document,
  parameters: ParameterObjectMap,
  additionalHeaders: string[] = [],
): string | undefined {
  const headersInitProperties = [];

  for (const parameter of parameters.values()) {
    if (parameter.in !== "header") continue;

    // If the header has a predefined default in the additionalHeaders argument discard it
    additionalHeaders = additionalHeaders.filter((header) =>
      !header.startsWith(`"${parameter.name}"`)
    );

    headersInitProperties.push(
      `"${parameter.name}"${parameter.required ? "" : "?"}: ${
        toSchemaType(document, parameter.schema) ?? "string"
      }`,
    );
  }

  headersInitProperties.unshift(...additionalHeaders);

  if (headersInitProperties.length === 0) return undefined;
  return `TypedHeadersInit<{ ${headersInitProperties.join("; ")} }>`;
}

export function addOperationObject(
  global: ModuleDeclaration,
  document: OpenAPI.Document,
  pattern: string,
  parameters: ParameterObjectMap,
  method: Method,
  operation: OpenAPI.OperationObject,
  options: Options,
) {
  if (operation.parameters !== undefined) {
    addParameterObjects(document, operation.parameters, parameters);
  }

  const requestBodyTypes: { contentType?: string; requestBodyType?: string }[] =
    [];
  if (operation.requestBody !== undefined) {
    if ("$ref" in operation.requestBody) {
      operation.requestBody = resolveRef<OpenAPI.RequestBodyObject>(
        document,
        operation.requestBody.$ref,
      );
    }

    for (
      const [contentType, object] of Object.entries<OpenAPI.MediaTypeObject>(
        operation.requestBody.content,
      )
    ) {
      const requestBodyType = createRequestBodyType(
        document,
        contentType,
        object.schema,
      );
      requestBodyTypes.push({ contentType, requestBodyType });
    }
  } else {
    requestBodyTypes.push({
      requestBodyType: undefined,
      contentType: undefined,
    });
  }

  const responseTypeParameters = [];
  if (operation.responses !== undefined) {
    for (
      let [statusCodeString, response] of Object.entries<
        OpenAPI.ReferenceObject | OpenAPI.ResponseObject
      >(operation.responses)
    ) {
      let statusCode: "default" | number | number[];
      if (statusCodeString === "default") {
        statusCode = "default";
      } else if (
        statusCodeString.length === 3 && statusCodeString.endsWith("XX")
      ) {
        const range = Number.parseInt(statusCodeString[0]);
        if (Number.isNaN(range) || range < 1 || range > 5) {
          throw new TypeError(
            `Invalid status code ${statusCodeString} for ${method} ${pattern}`,
          );
        }
        statusCode = new Array(100)
          .fill(0)
          .map((_, index) => range * 100 + index)
          .filter((statusCode) => statusCodes.includes(statusCode));
      } else {
        statusCode = Number.parseInt(statusCodeString);
        if (Number.isNaN(statusCode)) {
          throw new TypeError(
            `Invalid status code ${statusCodeString} for ${method} ${pattern}`,
          );
        }
      }

      if ("$ref" in response) {
        response = resolveRef<OpenAPI.ResponseObject>(document, response.$ref);
      }

      responseTypeParameters.push({ statusCode, response });
    }
  }
  const responseTypes: string[] = [];
  for (let { statusCode, response } of responseTypeParameters) {
    if (statusCode === "default") {
      const otherStatusCodes = responseTypeParameters
        .filter(({ statusCode }) => statusCode !== "default")
        .flatMap(({ statusCode }) => {
          if (statusCode === "default") return [];
          if (typeof statusCode === "number") return [statusCode];
          return statusCode;
        });
      statusCode = new Array(500)
        .fill(0)
        .map((_, index) => index + 100)
        .filter((statusCode) => !otherStatusCodes.includes(statusCode))
        .filter((statusCode) => statusCodes.includes(statusCode));
    }
    responseTypes.push(createResponseType(document, statusCode, response));
  }

  const doc: Pick<JSDocStructure, "description" | "tags"> = {};

  if (notEmpty(operation.description)) {
    doc.description = operation.description.trim();
  }

  if (operation.deprecated === true) {
    doc.tags ??= [];
    doc.tags.push({ tagName: "deprecated" });
  }

  if (notEmpty(operation.summary)) {
    doc.tags ??= [];
    doc.tags.push({ tagName: "summary", text: operation.summary.trim() });
  }

  const path = toTemplateString(document, pattern, parameters);

  const inputs = [];

  for (let baseUrl of options.baseUrls ?? []) {
    if (baseUrl.trim() === "") {
      continue;
    }

    baseUrl = baseUrl!.trim();
    baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    inputs.push(`${baseUrl}${path}`);
  }

  if (options.includeAbsoluteUrl) {
    inputs.push(`\${"http://" | "https://"}\${string}${path}`);
  }

  if (options.includeServerUrls) {
    const servers = document.servers?.map(({ url }) =>
      url.endsWith("/") ? url.slice(0, -1) : url
    ) ?? [];
    inputs.push(...servers.map((server) =>
      `${server}${path}`
    ));
  }

  if (options.includeRelativeUrl) {
    inputs.push(path);
  }

  if (inputs.length === 0) {
    throw new TypeError(
      `No URLs were generated for ${path} with the options:\n${
        JSON.stringify(options, null, 2)
      }\n\n` +
        `You may want to run TypeFetch with one of the following options:\n` +
        `  --base-urls <URLS>      A comma separated list of custom base urls for paths to start with\n` +
        `  --include-server-urls   Include server URLs from the schema in the generated paths\n` +
        `  --include-absolute-url  Include absolute URLs in the generated paths\n` +
        `  --include-relative-url  Include relative URLs in the generated paths\n`,
    );
  }

  const input = inputs.map((template) => `\`${template}\``).join("|");

  const typeParameters: OptionalKind<TypeParameterDeclarationStructure>[] = [];
  if (options.experimentalDiscriminator) {
    const discriminatorType = `"${options.experimentalDiscriminator}"`;
    typeParameters.push({
      name: "T",
      constraint: discriminatorType,
      default: options.experimentalRequireDiscriminator
        ? undefined
        : discriminatorType,
    });
  }

  global.addFunctions(
    requestBodyTypes.map(({ contentType, requestBodyType }) => ({
      name: "fetch",
      docs: notEmpty(doc) ? [doc] : [],
      typeParameters: typeParameters,
      parameters: [
        {
          name: "input",
          type: input,
        },
        {
          name: "init",
          hasQuestionToken: method === "get" &&
            operation.requestBody === undefined,
          type: (writer) => {
            const omit = ["method", "body"];
            const additionalHeaders = [];

            if (contentType !== undefined) {
              additionalHeaders.push(`"Content-Type": "${contentType}"`);
            }

            const headersInitType = toHeadersInitType(
              document,
              parameters,
              additionalHeaders,
            );
            if (headersInitType !== undefined) {
              omit.push("headers");
            }

            writer.write(
              `Omit<RequestInit, ${omit.map((key) => `"${key}"`).join("|")}> &`,
            );
            writer.block(() => {
              writer.writeLine(
                `method${
                  method === "get" ? "?" : ""
                }: "${method.toUpperCase()}";`,
              );

              if (requestBodyType !== undefined) {
                writer.write("body");
                writer.conditionalWrite(
                  !(
                    operation.requestBody &&
                    "required" in operation.requestBody &&
                    operation.requestBody.required
                  ),
                  "?",
                );
                writer.write(`: ${requestBodyType};`);
                writer.newLine();
              }

              if (headersInitType !== undefined) {
                writer.write(`headers: ${headersInitType};`);
              }
            });
          },
        },
      ],
      returnType: (writer) => {
        if (responseTypes.length === 0) {
          writer.write(`Promise<Response>`);
        } else {
          writer.write(
            `Promise<Omit<Response, "ok" | "status" | "arrayBuffer" | "blob" | "formData" | "json" | "text"> & (`,
          );
          writer.write(responseTypes.join("|"));
          writer.write(")>");
        }
      },
    })),
  );
}

export function addComponents(
  source: SourceFile,
  document: OpenAPI.Document,
  components: OpenAPI.ComponentsObject,
) {
  const spinner = wait("Adding OpenAPI components").start();

  if (notEmpty(components.schemas)) {
    source.addTypeAliases(
      Object.entries<OpenAPI.SchemaObject | OpenAPI.ReferenceObject>(
        components.schemas,
      ).map(([name, schema]) => {
        spinner.text = `Adding ${name}...`;
        spinner.render();

        const doc: Pick<JSDocStructure, "description" | "tags"> = {};

        if ("deprecated" in schema && schema.deprecated === true) {
          doc.tags ??= [];
          doc.tags.push({ tagName: "deprecated" });
        }

        if ("title" in schema && notEmpty(schema.title)) {
          doc.description ??= "";
          doc.description += `# ${schema.title.trim()}\n`;
        }

        if ("description" in schema && notEmpty(schema.description)) {
          doc.description ??= "";
          doc.description += `${schema.description.trim()}`;
        }

        if ("example" in schema && notEmpty(schema.example)) {
          doc.tags ??= [];
          doc.tags.push({
            tagName: "example",
            text: JSON.stringify(schema.example, null, 2),
          });
        }

        if ("examples" in schema && notEmpty(schema.examples)) {
          doc.tags ??= [];
          for (const example of schema.examples) {
            doc.tags.push({
              tagName: "example",
              text: JSON.stringify(example, null, 2),
            });
          }
        }

        if ("default" in schema) {
          doc.tags ??= [];
          doc.tags.push({
            tagName: "default",
            text: JSON.stringify(schema.default, null, 2),
          });
        }

        if (typeof doc.description === "string") {
          doc.description = doc.description.trim();
        }

        return ({
          isExported: true,
          docs: notEmpty(doc) ? [doc] : [],
          name: pascalCase(name),
          type: toSchemaType(document, schema) ?? "unknown",
        });
      }),
    );
  }

  spinner.succeed("OpenAPI components added");
}
