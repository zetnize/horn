import type { QueryResultRow } from "pg";
class Values {
  readonly values: unknown[];
  constructor(values: unknown[]) {
    this.values = values;
  }
}
export interface Sql {
  (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<QueryResultRow[]>;
  (values: unknown[]): Values;
  json(value: unknown): string;
  unsafe(text: string): Promise<QueryResultRow[]>;
  begin<T>(work: (tx: Sql) => Promise<T>): Promise<T>;
}
type Execute = (
  text: string,
  values?: unknown[],
) => Promise<{ rows: QueryResultRow[] }>;
export function createSql(
  execute: Execute,
  transaction?: <T>(work: (tx: Sql) => Promise<T>) => Promise<T>,
): Sql {
  function query(
    strings: TemplateStringsArray | unknown[],
    ...values: unknown[]
  ): Promise<QueryResultRow[]> | Values {
    if (!("raw" in strings)) return new Values(strings);
    const params: unknown[] = [];
    let text = strings[0] as string;
    for (let index = 0; index < values.length; index++) {
      const value = values[index];
      if (value instanceof Values) {
        if (!value.values.length) throw new Error("EMPTY_SQL_LIST");
        text +=
          "(" +
          value.values
            .map((item) => {
              params.push(item);
              return `$${params.length}`;
            })
            .join(",") +
          ")";
      } else {
        params.push(value);
        text += `$${params.length}`;
      }
      text += strings[index + 1];
    }
    return execute(text, params).then((result) => result.rows);
  }
  const sql = query as Sql;
  sql.json = JSON.stringify;
  sql.unsafe = async (text) => (await execute(text)).rows;
  sql.begin =
    transaction ??
    (async (work) => {
      await execute("BEGIN");
      try {
        const result = await work(sql);
        await execute("COMMIT");
        return result;
      } catch (error) {
        await execute("ROLLBACK");
        throw error;
      }
    });
  return sql;
}
