export interface ModifyHeaderRule {
  test?: string;
  key: string;
  value: string;
}

export interface ServiceStatus {
  href: string;
  version: string;
  rules: ModifyHeaderRule[];
}
