import { type InitialAPI, type ConnectedAPI, type Signature } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletState, AttestationState, ReleaseManifest } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MidnightWindow extends Window {
  midnight?: Record<string, InitialAPI>;
  cardano?: {
    midnight?: Record<string, InitialAPI>;
  };
}

export interface AttestationPayload {
  documentId: string;    // SHA-256 of manifest JSON
  metadataHash: string;  // SHA-256 of originalHash + redactedHash + mode + timestamp
  originalHash: string;
  redactedHash: string;
  mode: string;
  timestamp: string;
  appVersion: string;
}

export interface AttestationResult {
  payload: AttestationPayload;
  signature: Signature;
  attestedAt: string;
  walletAddress: string;
}

// ---------------------------------------------------------------------------
// Utility: SHA-256 hash
// ---------------------------------------------------------------------------
async function sha256(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Build attestation payload from manifest
// ---------------------------------------------------------------------------
export async function buildAttestationPayload(manifest: ReleaseManifest): Promise<AttestationPayload> {
  // documentId = SHA-256 of the full manifest JSON (deterministic representation)
  const manifestJson = JSON.stringify({
    mode: manifest.mode,
    hash: manifest.hash,
    originalHash: manifest.originalHash,
    timestamp: manifest.timestamp,
    policy: manifest.policy,
    redactionCount: manifest.redactionCount,
  });
  const documentId = await sha256(manifestJson);

  // metadataHash = SHA-256 of the core attested values
  const metadataInput = `${manifest.originalHash}|${manifest.hash}|${manifest.mode}|${manifest.timestamp}`;
  const metadataHash = await sha256(metadataInput);

  return {
    documentId,
    metadataHash,
    originalHash: manifest.originalHash,
    redactedHash: manifest.hash,
    mode: manifest.mode,
    timestamp: manifest.timestamp,
    appVersion: 'Blackline_v1.0',
  };
}

// ---------------------------------------------------------------------------
// Midnight Service
// ---------------------------------------------------------------------------
export class MidnightService {
  private api: ConnectedAPI | null = null;
  private networkId = 'preprod';
  private walletAddress: string | null = null;

  // -------------------------------------------------------------------------
  // Wallet detection & Enumeration
  // -------------------------------------------------------------------------

  public getAvailableWallets(): InitialAPI[] {
    const w = window as unknown as MidnightWindow;
    const providers: InitialAPI[] = [];
    
    // Standard pattern: window.midnight.{walletId}
    if (w.midnight) {
      providers.push(...Object.values(w.midnight));
    }
    
    // Fallback pattern used in some earlier multi-chain versions
    if (w.cardano?.midnight) {
      for (const provider of Object.values(w.cardano.midnight)) {
        if (!providers.find(p => p.rdns === provider.rdns)) {
          providers.push(provider);
        }
      }
    }
    
    return providers;
  }

  public isWalletAvailable(): boolean {
    return this.getAvailableWallets().length > 0;
  }

  public getWalletInfo(): { name: string; icon: string; apiVersion: string } | null {
    const wallet = this.getAvailableWallets()[0];
    if (!wallet) return null;
    return {
      name: wallet.name || 'Midnight Wallet',
      icon: wallet.icon || '',
      apiVersion: wallet.apiVersion || 'unknown',
    };
  }

  // -------------------------------------------------------------------------
  // Connection
  // -------------------------------------------------------------------------

  public async connectWallet(): Promise<WalletState> {
    const wallets = this.getAvailableWallets();
    const wallet = wallets[0];
    
    if (!wallet) {
      throw new Error('No Midnight wallet provider found on this page.');
    }

    try {
      this.api = await wallet.connect(this.networkId);

      // Get wallet address
      try {
        const { unshieldedAddress } = await this.api.getUnshieldedAddress();
        this.walletAddress = unshieldedAddress;
      } catch {
        this.walletAddress = null;
      }

      // Get balance
      let balance: { dust: bigint } | null = null;
      try {
        const unshielded = await this.api.getUnshieldedBalances();
        const dustBalance = unshielded[''] ?? Object.values(unshielded)[0] ?? 0n;
        balance = { dust: BigInt(dustBalance) };
      } catch {
        balance = null;
      }

      return {
        available: true,
        connected: true,
        address: this.walletAddress,
        balance,
        network: this.networkId,
        connectionStatus: 'connected',
        error: undefined,
      };
    } catch (error: any) {
      this.api = null;
      this.walletAddress = null;
      
      const msg = error?.message || String(error);
      let userFriendlyMsg = 'Failed to connect wallet.';
      
      if (msg.toLowerCase().includes('locked')) {
        userFriendlyMsg = 'Wallet is currently locked. Please open the extension and unlock it.';
      } else if (msg.toLowerCase().includes('network')) {
        userFriendlyMsg = `Wallet is on the wrong network. Please switch to ${this.networkId}.`;
      } else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('decline')) {
        userFriendlyMsg = 'Connection rejected by user.';
      } else {
        userFriendlyMsg = msg; // honest fallback
      }
      
      throw new Error(userFriendlyMsg);
    }
  }

  public async checkConnectionStatus(): Promise<'connected' | 'disconnected'> {
    if (!this.api) return 'disconnected';
    try {
      const status = await this.api.getConnectionStatus();
      if (status.status === 'disconnected') {
        this.api = null;
        this.walletAddress = null;
      }
      return status.status;
    } catch {
      return 'disconnected';
    }
  }

  public isConnected(): boolean {
    return this.api !== null;
  }

  public getAddress(): string | null {
    return this.walletAddress;
  }

  // -------------------------------------------------------------------------
  // Attestation via wallet signing
  // -------------------------------------------------------------------------

  /**
   * Sign an attestation payload using the connected wallet.
   * This is a REAL wallet interaction — the user sees the Lace signing prompt.
   * The resulting signature proves:
   * - The wallet holder authorized this attestation
   * - The exact payload contents at the time of signing
   * - The verifying key ties the signature to a specific wallet identity
   */
  public async signAttestation(payload: AttestationPayload): Promise<AttestationResult> {
    if (!this.api) {
      throw new Error('Wallet not connected. Please connect your Midnight Lace wallet first.');
    }

    // Sign the deterministic payload string
    const payloadString = JSON.stringify(payload, null, 0);
    const signature = await this.api.signData(payloadString, {
      encoding: 'text',
      keyType: 'unshielded',
    });

    return {
      payload,
      signature,
      attestedAt: new Date().toISOString(),
      walletAddress: this.walletAddress || 'unknown',
    };
  }

  /**
   * Full attestation flow: build payload from manifest, sign with wallet.
   * Returns an AttestationState for the manifest.
   */
  public async attestManifest(
    manifest: ReleaseManifest,
    onProgress?: (state: string) => void
  ): Promise<AttestationState> {
    if (!this.api) throw new Error('Wallet not connected');

    // 1. Build payload
    onProgress?.('PREPARING');
    const payload = await buildAttestationPayload(manifest);

    // 2. Sign with wallet
    onProgress?.('SIGNING');
    const result = await this.signAttestation(payload);

    // 3. Return attestation state
    return {
      status: 'signed',
      signature: {
        data: result.signature.data,
        signature: result.signature.signature,
        verifyingKey: result.signature.verifyingKey,
      },
      attestedAt: result.attestedAt,
      walletAddress: result.walletAddress,
      documentId: payload.documentId,
      metadataHash: payload.metadataHash,
    };
  }

  // -------------------------------------------------------------------------
  // Network configuration (for future on-chain deployment)
  // -------------------------------------------------------------------------

  public async getNetworkConfig(): Promise<{
    indexerUri: string;
    substrateNodeUri: string;
    networkId: string;
  } | null> {
    if (!this.api) return null;
    try {
      const config = await this.api.getConfiguration();
      return {
        indexerUri: config.indexerUri,
        substrateNodeUri: config.substrateNodeUri,
        networkId: config.networkId,
      };
    } catch {
      return null;
    }
  }
}

export const midnightService = new MidnightService();
