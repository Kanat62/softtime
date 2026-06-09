export interface OfficeNetwork {
  id: string;
  ssid: string;
  cidr: string;
  mode: "WHITELIST" | "BLOCKED";
  status: "ACTIVE" | "BLOCKED";
}
