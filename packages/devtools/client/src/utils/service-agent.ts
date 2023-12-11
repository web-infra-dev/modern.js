export interface ModifyHeaderRule {
  id: string;
  test?: string;
  key: string;
  value: string;
}

export interface ServiceStatus {
  href: string;
  version: string;
  rules: ModifyHeaderRule[];
}
