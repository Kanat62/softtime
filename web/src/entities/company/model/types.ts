export type CompanyStatus = "TRIAL" | "ACTIVE" | "GRACE" | "SUSPENDED";
export interface Company {
  id: string;
  name: string;
  code: string;
  status: CompanyStatus;
  employeesCount: number;
  mrr: number;
}
