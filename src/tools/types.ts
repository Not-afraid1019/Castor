import { z } from "zod";
import type { ToolDefinition } from "../llm/types.js";

export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodObject<z.ZodRawShape>;
  execute(args: Record<string, unknown>): Promise<string>;
}

export function toolToDefinition(tool: Tool): ToolDefinition {
  const jsonSchema = zodToJsonSchema(tool.parameters);
  return {
    name: tool.name,
    description: tool.description,
    parameters: jsonSchema,
  };
}

function zodToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): ToolDefinition["parameters"] {
  const shape = schema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const field = value as z.ZodTypeAny;
    properties[key] = zodFieldToJson(field);
    if (!field.isOptional()) {
      required.push(key);
    }
  }

  return { type: "object", properties, ...(required.length ? { required } : {}) };
}

function zodFieldToJson(field: z.ZodTypeAny): any {
  // Unwrap optional
  if (field instanceof z.ZodOptional) {
    return zodFieldToJson(field._def.innerType);
  }
  if (field instanceof z.ZodString) {
    return { type: "string", ...(field.description ? { description: field.description } : {}) };
  }
  if (field instanceof z.ZodNumber) {
    return { type: "number", ...(field.description ? { description: field.description } : {}) };
  }
  if (field instanceof z.ZodBoolean) {
    return { type: "boolean", ...(field.description ? { description: field.description } : {}) };
  }
  if (field instanceof z.ZodEnum) {
    return { type: "string", enum: field._def.values };
  }
  if (field instanceof z.ZodArray) {
    return { type: "array", items: zodFieldToJson(field._def.type) };
  }
  return { type: "string" };
}
