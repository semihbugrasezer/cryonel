import { createHash } from "crypto";

export interface MerkleProof {
  leaf: string;
  proof: string[];
  position: number;
}

export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  constructor(leaves: string[]) {
    this.leaves = [...leaves];
    this.layers = this.buildTree(this.leaves);
  }

  /**
   * Hash a single value using SHA-256
   */
  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * Hash two values together
   */
  private hashPair(left: string, right: string): string {
    return this.hash(left + right);
  }

  /**
   * Build the Merkle tree from leaves
   */
  private buildTree(leaves: string[]): string[][] {
    if (leaves.length === 0) {
      throw new Error("Cannot build tree with empty leaves");
    }

    const layers: string[][] = [];
    let currentLayer = leaves.map(leaf => this.hash(leaf));
    layers.push([...currentLayer]);

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        nextLayer.push(this.hashPair(left, right));
      }
      
      currentLayer = nextLayer;
      layers.push([...currentLayer]);
    }

    return layers;
  }

  /**
   * Get the root hash of the tree
   */
  getRoot(): string {
    if (this.layers.length === 0) {
      throw new Error("Tree not built");
    }
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Generate a proof for a specific leaf
   */
  getProof(leafIndex: number): MerkleProof {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error("Invalid leaf index");
    }

    const leaf = this.hash(this.leaves[leafIndex]);
    const proof: string[] = [];
    let currentIndex = leafIndex;

    // Go through each layer (except the root)
    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const layer = this.layers[layerIndex];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf,
      proof,
      position: leafIndex
    };
  }

  /**
   * Verify a proof against the root
   */
  static verifyProof(proof: MerkleProof, root: string): boolean {
    let hash = proof.leaf;
    let position = proof.position;

    for (const proofElement of proof.proof) {
      const isRightNode = position % 2 === 1;
      
      if (isRightNode) {
        hash = MerkleTree.hashPair(proofElement, hash);
      } else {
        hash = MerkleTree.hashPair(hash, proofElement);
      }
      
      position = Math.floor(position / 2);
    }

    return hash === root;
  }

  /**
   * Static method for hashing a pair (used in verification)
   */
  private static hashPair(left: string, right: string): string {
    return createHash('sha256').update(left + right).digest('hex');
  }

  /**
   * Create a Merkle tree from PnL data
   */
  static fromPnLData(trades: Array<{
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    pnl: number;
    timestamp: string;
  }>): MerkleTree {
    const leaves = trades.map(trade => JSON.stringify({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      pnl: trade.pnl,
      timestamp: trade.timestamp
    }));

    return new MerkleTree(leaves);
  }

  /**
   * Create a leaf hash for a specific trade
   */
  static createTradeLeaf(trade: {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    pnl: number;
    timestamp: string;
  }): string {
    const tradeData = JSON.stringify({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      pnl: trade.pnl,
      timestamp: trade.timestamp
    });
    return createHash('sha256').update(tradeData).digest('hex');
  }
}