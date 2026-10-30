export interface HealthStatusResponse {
  status: string;
  service: string;
  tagline: string;
  hackathon: string;
  version: string;
  stage: string;
  timestamp: string;
  database: {
    type: string;
    status: string;
  };
}
