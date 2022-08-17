export type JSONPrimitive = string | number | boolean | null;

export type JSONArray = Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
