import ApiError from "../utils/ApiError.js";

/**
 * Validates req[source] with a Zod schema. Parsed data lands on req.body or
 * req.valid.query/params (Express 5 makes req.query read-only).
 */
export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) fields[issue.path.join(".") || "_"] ??= issue.message;
      throw ApiError.badRequest(Object.values(fields)[0] || "Invalid input", fields);
    }
    if (source === "body") req.body = result.data;
    else {
      req.valid ??= {};
      req.valid[source] = result.data;
    }
    next();
  };
