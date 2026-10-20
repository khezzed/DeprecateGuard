export interface ScenarioProof {
  id: number;
  title: string;
  description: string;
  txHash: string;
  pledgeTx?: string;
  withdrawTx?: string;
  expireTx?: string;
  outcome: string;
  evidenceUrl?: string;
  verbatimQuote?: string;
  extractedDigest?: string;
  details?: any;
}

export interface ProofManifest {
  projectName: string;
  tagline: string;
  repositoryUrl?: string;
  network: {
    chainId: number;
    networkName: string;
    rpcUrl: string;
    explorerUrl: string;
  };
  runnerHash: string;
  contracts: {
    probeContract: {
      address: string;
      deployTx: string;
      probeCallTx: string;
      evidenceSampleUrl: string;
      onChainResult: string;
    };
    mainContract: {
      address: string;
      deployTx: string;
      liveStats?: {
        total_pledges: number;
        total_claims: number;
      };
    };
  };
  scenarios: ScenarioProof[];
  verifiedAt: string;
}
