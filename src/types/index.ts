export type JiraTicket = {
  key: string;
  summary: string;
  description: string;
  acceptanceCriteria: string[];
  labels: string[];
  component: string;
};

export type PrGenerationInput = {
  ticket: JiraTicket;
  diff: string;
  extraContext?: string;
  forceEmptyContext?: boolean;
};

export type PrDescription = {
  title: string;
  summary: string;
  changes: string[];
  testPlan: string[];
  risks: string[];
  rolloutNotes: string;
};
